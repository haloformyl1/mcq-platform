import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const materials = await prisma.studyMaterial.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(materials);
  } catch (error) {
    console.error("Fetch study materials error:", error);
    return NextResponse.json({ error: "Failed to fetch study materials" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string || "";
    const type = formData.get("type") as string; // PDF, IMAGE, LINK
    const url = formData.get("url") as string || "";
    const file = formData.get("file") as Blob | null;

    if (!title || !type) {
      return NextResponse.json({ error: "Title and type are required" }, { status: 400 });
    }

    let finalUrl = url;
    let fileSizeFormatted: string | null = null;

    if (type === "LINK") {
      if (!url) {
        return NextResponse.json({ error: "Link URL is required" }, { status: 400 });
      }
    } else if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      fileSizeFormatted = `${sizeMB} MB`;

      const uploadsDir = path.join(process.cwd(), "public", "uploads", "study_materials");
      await mkdir(uploadsDir, { recursive: true });

      const sanitizeName = (file as any).name ? (file as any).name.replace(/[^a-zA-Z0-9.-]/g, "_") : `file_${Date.now()}`;
      const fileName = `${Date.now()}_${sanitizeName}`;
      const filePath = path.join(uploadsDir, fileName);
      await writeFile(filePath, buffer);

      finalUrl = `/uploads/study_materials/${fileName}`;
    } else if (!url) {
      return NextResponse.json({ error: "File or link URL is required" }, { status: 400 });
    }

    const material = await prisma.studyMaterial.create({
      data: {
        title,
        description,
        type,
        url: finalUrl,
        fileSize: fileSizeFormatted
      }
    });

    return NextResponse.json({ success: true, material });
  } catch (error) {
    console.error("Create study material error:", error);
    return NextResponse.json({ error: "Failed to upload study material" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Material ID is required" }, { status: 400 });
    }

    await prisma.studyMaterial.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete study material error:", error);
    return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
  }
}
