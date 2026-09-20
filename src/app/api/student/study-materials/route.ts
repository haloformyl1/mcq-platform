import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { parseMaterialMetadata } from "@/lib/studyMaterialMetadata";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const payload = session ? await decrypt(session) : null;

    let isSubscribed = false;
    if (payload && payload.id) {
      const student = await prisma.student.findUnique({
        where: { id: payload.id },
        select: { subscriptionStatus: true, subscriptionExpiresAt: true }
      });
      if (student) {
        const isComp = student.subscriptionStatus === "COMPLIMENTARY";
        const isPaid = student.subscriptionStatus === "PAID" && (!student.subscriptionExpiresAt || new Date(student.subscriptionExpiresAt).getTime() > Date.now());
        isSubscribed = isComp || isPaid;
      }
    }

    const materials = await prisma.studyMaterial.findMany({
      orderBy: { createdAt: "desc" }
    });

    const sanitized = materials.map(m => {
      const meta = parseMaterialMetadata(m.description, m.title, m.type);
      const isLocked = m.isPremium && !isSubscribed;
      const is3D = meta.category === '3D animations' || m.type === 'LINK';

      let safeUrl = m.url;
      if (isLocked) {
        safeUrl = "#locked";
      } else if (is3D) {
        // Protect 3D labs: Never leak raw destination URL in client JSON responses
        safeUrl = `/dashboard/lab-viewer/${m.id}`;
      }

      return {
        ...m,
        url: safeUrl,
        isLocked,
        category: meta.category,
        discipline: meta.discipline,
        description: meta.cleanDescription
      };
    });

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error("Fetch study materials error:", error);
    return NextResponse.json({ error: "Failed to fetch study materials" }, { status: 500 });
  }
}