import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

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
      if (m.isPremium && !isSubscribed) {
        return {
          ...m,
          url: "#locked",
          isLocked: true
        };
      }
      return {
        ...m,
        isLocked: false
      };
    });

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error("Fetch study materials error:", error);
    return NextResponse.json({ error: "Failed to fetch study materials" }, { status: 500 });
  }
}
