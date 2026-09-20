import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET, R2_PUBLIC_DOMAIN } from "@/lib/r2";
import { 
  encodeMaterialMetadata, 
  parseMaterialMetadata,
  LIBRARY_CATEGORIES,
  SUBJECT_DISCIPLINES
} from "@/lib/studyMaterialMetadata";

export async function GET() {
  try {
    const materials = await prisma.studyMaterial.findMany({
      orderBy: { createdAt: "desc" }
    });
    const parsed = materials.map(m => {
      const meta = parseMaterialMetadata(m.description, m.title, m.type);
      return {
        ...m,
        category: meta.category,
        discipline: meta.discipline,
        cleanDescription: meta.cleanDescription
      };
    });
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Fetch study materials error:", error);
    return NextResponse.json({ error: "Failed to fetch study materials" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let title = "";
    let rawDescription = "";
    let type = "";
    let isPremium = false;
    let url = "";
    let fileSizeFormatted: string | null = null;
    let category = "Chapter wise PDF Notes";
    let discipline = "GENERAL";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      title = body.title?.trim() || "";
      rawDescription = body.description?.trim() || "";
      type = body.type || "PDF";
      isPremium = Boolean(body.isPremium);
      url = body.url?.trim() || "";
      fileSizeFormatted = body.fileSize || null;
      category = body.category || "Chapter wise PDF Notes";
      discipline = body.discipline || "GENERAL";
    } else {
      const formData = await req.formData();
      title = (formData.get("title") as string)?.trim() || "";
      rawDescription = (formData.get("description") as string)?.trim() || "";
      type = formData.get("type") as string;
      isPremium = formData.get("isPremium") === "true";
      url = (formData.get("url") as string)?.trim() || "";
      const file = formData.get("file") as Blob | null;
      category = (formData.get("category") as string) || "Chapter wise PDF Notes";
      discipline = (formData.get("discipline") as string) || "GENERAL";

      if (file && typeof (file as any).arrayBuffer === "function") {
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

        url = `/uploads/study_materials/${fileName}`;
      }
    }

    if (!title || !type) {
      return NextResponse.json({ error: "Title and type are required" }, { status: 400 });
    }

    if (!url) {
      return NextResponse.json({ error: "A valid file upload or URL is required" }, { status: 400 });
    }

    const encodedDescription = encodeMaterialMetadata(rawDescription, category, discipline);

    const material = await prisma.studyMaterial.create({
      data: {
        title,
        description: encodedDescription,
        type,
        url,
        fileSize: fileSizeFormatted,
        isPremium
      }
    });

    const meta = parseMaterialMetadata(material.description, material.title, material.type);

    return NextResponse.json({
      success: true,
      material: {
        ...material,
        category: meta.category,
        discipline: meta.discipline,
        cleanDescription: meta.cleanDescription
      }
    });
  } catch (error: any) {
    console.error("Create study material error:", error);
    const detailMsg = error?.message || (typeof error === "string" ? error : "Failed to upload study material");
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

    const existing = await prisma.studyMaterial.findUnique({
      where: { id }
    });

    if (existing) {
      // If hosted on R2, optionally delete from bucket
      try {
        if (existing.url.includes(".r2.dev") || (R2_PUBLIC_DOMAIN && existing.url.startsWith(R2_PUBLIC_DOMAIN))) {
          const urlObj = new URL(existing.url);
          const key = urlObj.pathname.replace(/^\//, "");
          if (key) {
            await r2Client.send(new DeleteObjectCommand({
              Bucket: R2_BUCKET,
              Key: key,
            }));
          }
        }
      } catch (r2Err) {
        console.warn("Could not delete from R2 (continuing DB delete):", r2Err);
      }

      await prisma.studyMaterial.delete({
        where: { id }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete study material error:", error);
    return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, title, description, isPremium, category, discipline, type, url, fileSize } = body;

    if (!id) {
      return NextResponse.json({ error: "Material ID is required" }, { status: 400 });
    }

    const existing = await prisma.studyMaterial.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (typeof title === "string" && title.trim()) {
      updateData.title = title.trim();
    }

    if (typeof type === "string" && type.trim()) {
      updateData.type = type.trim();
    }

    if (typeof url === "string" && url.trim()) {
      updateData.url = url.trim();
    }

    if (typeof fileSize === "string" && fileSize.trim()) {
      updateData.fileSize = fileSize.trim();
    }

    if (typeof isPremium === "boolean") {
      updateData.isPremium = isPremium;
    }

    const currentMeta = parseMaterialMetadata(existing.description, existing.title, existing.type);
    const newCategory = category || currentMeta.category;
    const newDiscipline = discipline || currentMeta.discipline;
    const cleanDesc = typeof description === "string" ? description.trim() : currentMeta.cleanDescription;

    if (category || discipline || typeof description === "string") {
      updateData.description = encodeMaterialMetadata(cleanDesc, newCategory, newDiscipline);
    }

    const updated = await prisma.studyMaterial.update({
      where: { id },
      data: updateData
    });

    const meta = parseMaterialMetadata(updated.description, updated.title, updated.type);

    return NextResponse.json({
      success: true,
      material: {
        ...updated,
        category: meta.category,
        discipline: meta.discipline,
        cleanDescription: meta.cleanDescription
      }
    });
  } catch (error: any) {
    console.error("Update study material error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update material" }, { status: 500 });
  }
}
