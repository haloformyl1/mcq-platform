import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { hasPremiumAccess } from "@/lib/subscription";
import { validateStudentSession } from "@/lib/sessionService";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET, R2_PUBLIC_DOMAIN } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const cleanId = id.startsWith("db-") ? id.replace("db-", "") : id;

    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const payload = session ? await decrypt(session) : null;

    if (!payload || !payload.id) {
      return new NextResponse("Unauthorized: Student login required", { status: 401 });
    }

    // Single active device concurrency check
    const { isValid, isRevoked } = await validateStudentSession(payload.id, cookieStore, req);
    if (!isValid || isRevoked) {
      cookieStore.delete("session");
      return new NextResponse("Session expired or signed in from another device", { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, subscriptionStatus: true, subscriptionExpiresAt: true }
    });

    if (!student) {
      return new NextResponse("Student profile not found", { status: 404 });
    }

    const material = await prisma.studyMaterial.findUnique({
      where: { id: cleanId }
    });

    if (!material) {
      return new NextResponse("Study material not found", { status: 404 });
    }

    // Verify access tier
    if (material.isPremium) {
      const canAccess = hasPremiumAccess(student.subscriptionStatus, student.subscriptionExpiresAt);
      if (!canAccess) {
        return new NextResponse("Forbidden: Gold membership required", { status: 403 });
      }
    }

    // Determine S3 Key from URL
    let key = "";
    if (material.url.includes(".r2.dev/")) {
      const urlObj = new URL(material.url);
      key = urlObj.pathname.replace(/^\//, "");
    } else if (R2_PUBLIC_DOMAIN && material.url.startsWith(R2_PUBLIC_DOMAIN)) {
      key = material.url.replace(R2_PUBLIC_DOMAIN, "").replace(/^\//, "");
    } else if (material.url.startsWith("materials/")) {
      key = material.url;
    }

    const { searchParams } = new URL(req.url);
    const isDownload = searchParams.get("download") === "true" || searchParams.get("download") === "1";
    const disposition = isDownload ? "attachment" : "inline";
    const safeTitle = (material.title || "document").replace(/[^a-zA-Z0-9_-]/g, "_");

    if (key) {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      });
      const s3Response = await r2Client.send(command);
      const stream = (s3Response.Body as any).transformToWebStream();

      return new NextResponse(stream, {
        headers: {
          "Content-Type": s3Response.ContentType || "application/pdf",
          "Content-Disposition": `${disposition}; filename="${safeTitle}.pdf"`,
          "Cache-Control": isDownload ? "private, max-age=3600" : "private, no-cache, no-store, must-revalidate",
          "Pragma": isDownload ? "cache" : "no-cache",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // Legacy or direct link fallback streaming
    const externalRes = await fetch(material.url);
    if (!externalRes.ok) {
      return new NextResponse("Failed to load document stream", { status: 502 });
    }

    return new NextResponse(externalRes.body, {
      headers: {
        "Content-Type": externalRes.headers.get("content-type") || "application/pdf",
        "Content-Disposition": "inline; filename=\"material.pdf\"",
        "Cache-Control": "private, no-cache, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    console.error("PDF Proxy error:", error);
    return new NextResponse(error?.message || "Internal server error streaming document", { status: 500 });
  }
}
