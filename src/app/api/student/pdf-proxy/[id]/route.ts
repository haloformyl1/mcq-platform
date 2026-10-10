import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { hasPremiumAccess } from "@/lib/subscription";
import { validateStudentSession } from "@/lib/sessionService";
import { parseMaterialMetadata, isStudentEligibleForMaterial } from "@/lib/studyMaterialMetadata";
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
      select: { 
        id: true, 
        email: true, 
        name: true, 
        subscriptionStatus: true, 
        subscriptionExpiresAt: true,
        board: true,
        academicLevel: true
      }
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

    // Enforce academic curriculum eligibility (e.g. SEM-II only for SEM-II WBCHSE & Class 11 CBSE/ICSE)
    const meta = parseMaterialMetadata(material.description, material.title, material.type);
    const eligibility = isStudentEligibleForMaterial(student, meta.section, meta.classSem);
    if (!eligibility.eligible) {
      return new NextResponse(
        `Forbidden: Access restricted to ${eligibility.targetLabel || "assigned class/semester"}. ${eligibility.reason || ""}`, 
        { status: 403 }
      );
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

    // Fetch PDF Buffer from either S3/R2 or external URL
    let pdfBuffer: Buffer | Uint8Array | null = null;
    let contentType = "application/pdf";

    if (key) {
      const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key });
      const s3Response = await r2Client.send(command);
      pdfBuffer = await (s3Response.Body as any).transformToByteArray();
      contentType = s3Response.ContentType || contentType;
    } else {
      const externalRes = await fetch(material.url);
      if (!externalRes.ok) {
        return new NextResponse("Failed to load document stream", { status: 502 });
      }
      pdfBuffer = new Uint8Array(await externalRes.arrayBuffer());
      contentType = externalRes.headers.get("content-type") || contentType;
    }

    // Apply Watermark if it's a Download request
    if (isDownload && pdfBuffer) {
      try {
        const { PDFDocument, rgb, degrees } = await import('pdf-lib');
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pages = pdfDoc.getPages();
        const watermarkText = "PIECHEM - An Arghyadeep Roy Initiative.";

        pages.forEach(page => {
          const { width, height } = page.getSize();
          const fontSize = 40;
          page.drawText(watermarkText, {
            x: 50,
            y: height / 2,
            size: fontSize,
            color: rgb(0.5, 0.5, 0.5),
            opacity: 0.3,
            rotate: degrees(45),
          });
        });

        pdfBuffer = await pdfDoc.save();
      } catch (err) {
        console.error("Failed to watermark PDF:", err);
        // Fallback to original buffer if watermarking fails
      }
    }

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${safeTitle}.pdf"`,
        "Cache-Control": isDownload ? "private, max-age=3600" : "private, no-cache, no-store, must-revalidate",
        "Pragma": isDownload ? "cache" : "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });

  } catch (error: any) {
    console.error("PDF Proxy error:", error);
    return new NextResponse(error?.message || "Internal server error streaming document", { status: 500 });
  }
}
