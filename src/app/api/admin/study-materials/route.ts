import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
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
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const rawDescription = formData.get("description") as string || "";
    const type = formData.get("type") as string;
    const isPremium = formData.get("isPremium") === "true";
    const url = formData.get("url") as string || "";
    const file = formData.get("file") as Blob | null;
    const category = (formData.get("category") as string) || "Chapter wise PDF Notes";
    const discipline = (formData.get("discipline") as string) || "GENERAL";

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

    const encodedDescription = encodeMaterialMetadata(rawDescription, category, discipline);

    const material = await prisma.studyMaterial.create({
      data: {
        title,
        description: encodedDescription,
        type,
        url: finalUrl,
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
    const body = await req.json();
    const { id, isPremium, category, discipline } = body;

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
    if (typeof isPremium === "boolean") {
      updateData.isPremium = isPremium;
    }

    if (category || discipline) {
      const currentMeta = parseMaterialMetadata(existing.description, existing.title, existing.type);
      const newCategory = category || currentMeta.category;
      const newDiscipline = discipline || currentMeta.discipline;
      updateData.description = encodeMaterialMetadata(currentMeta.cleanDescription, newCategory, newDiscipline);
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
  } catch (error) {
    console.error("Update study material error:", error);
    return NextResponse.json({ error: "Failed to update material" }, { status: 500 });
  }
}
