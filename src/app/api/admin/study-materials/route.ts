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
    const type = formData.get("type") as string;
    const isPremium = formData.get("isPremium") === "true"; // PDF, IMAGE, LINK
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
    } else if (file && typeof (file as any).arrayBuffer === "function") {
      const bytes = await (file as any).arrayBuffer();
      const buffer = Buffer.from(bytes);

      const sizeMB = ((file as any).size / (1024 * 1024)).toFixed(2);
      fileSizeFormatted = `${sizeMB} MB`;

      const uploadsDir = path.join(process.cwd(), "public", "uploads", "study_materials");
      await mkdir(uploadsDir, { recursive: true });

      const rawName = (file as any).name || `file_${Date.now()}`;
      const sanitizeName = rawName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const fileName = `${Date.now()}_${sanitizeName}`;
      const filePath = path.join(uploadsDir, fileName);
      await writeFile(filePath, buffer);

      finalUrl = `/uploads/study_materials/${fileName}`;
    } else if (url.trim()) {
      finalUrl = url.trim();
    } else {
      return NextResponse.json({ error: "Please select a valid file or enter a link URL" }, { status: 400 });
    }

    const material = await prisma.studyMaterial.create({
      data: {
        title,
        description,
        type,
        url: finalUrl,
        fileSize: fileSizeFormatted,
        isPremium
      }
    });

    return NextResponse.json({ success: true, material });
  } catch (error: any) {
    console.error("Create study material error:", error);
    const detailMsg = error?.message || (typeof error === 'string' ? error : "Failed to upload study material");
    return NextResponse.json({ error: detailMsg }, { status: 500 });
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


export async function PATCH(req: Request) {
  try {
    const { id, isPremium } = await req.json();
    const updated = await prisma.studyMaterial.update({
      where: { id },
      data: { isPremium: Boolean(isPremium) }
    });
    return NextResponse.json({ success: true, material: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update material" }, { status: 500 });
  }
}