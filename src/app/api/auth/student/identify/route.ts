import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        passwordHash: true,
      }
    });

    if (!student) {
      return NextResponse.json({ accountStatus: "NEW", name: null });
    }

    if (student.passwordHash) {
      return NextResponse.json({ accountStatus: "ACTIVE", name: student.name });
    } else {
      return NextResponse.json({ accountStatus: "UNVERIFIED", name: student.name });
    }
  } catch (error) {
    console.error("Identify Error:", error);
    return NextResponse.json({ error: "Failed to identify account" }, { status: 500 });
  }
}
