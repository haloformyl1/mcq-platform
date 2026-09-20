import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET, R2_PUBLIC_DOMAIN } from "@/lib/r2";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { filename, contentType } = body;

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    const rawName = filename || `file_${Date.now()}`;
    const sanitizeName = rawName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `materials/${Date.now()}_${sanitizeName}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType || "application/pdf",
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    const publicUrl = `${R2_PUBLIC_DOMAIN}/${key}`;

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (error: any) {
    console.error("Presigned URL generation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate presigned upload URL" },
      { status: 500 }
    );
  }
}
