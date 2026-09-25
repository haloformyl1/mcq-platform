import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { phone, name } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const cleanPhone = phone.trim();
    const phoneDigits = cleanPhone.replace(/\D/g, "");

    if (phoneDigits.length < 10) {
      return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
    }

    // Try finding student by full phone or local 10-digit number
    const localNumber = phoneDigits.slice(-10);

    let student = await prisma.student.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: localNumber },
          { phone: `+91${localNumber}` },
          { phone: `91${localNumber}` }
        ]
      }
    });

    if (!student) {
      // Create new student with synthetic email to satisfy unique email constraint
      const syntheticEmail = `${phoneDigits}@phone.piechem.local`;
      student = await prisma.student.create({
        data: {
          phone: cleanPhone.startsWith("+") ? cleanPhone : `+91${localNumber}`,
          email: syntheticEmail,
          name: (name && name.trim()) ? name.trim() : "Student",
          status: "ACTIVE",
          subscriptionStatus: "FREE"
        }
      });
    } else {
      // Update name if student didn't have one and name is provided
      if (name && name.trim() && (!student.name || student.name === "Student")) {
        student = await prisma.student.update({
          where: { id: student.id },
          data: { name: name.trim() }
        });
      }
    }

    if (student.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Your account has been suspended. Please contact the administrator for assistance." },
        { status: 403 }
      );
    }

    // Issue standard student session cookie
    const sessionToken = await encrypt({
      id: student.id,
      email: student.email,
      role: "student"
    });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 400, // 400 days
      path: "/"
    });

    return NextResponse.json({
      success: true,
      isOnboarded: Boolean(student.board && student.academicLevel),
      student: {
        id: student.id,
        name: student.name,
        phone: student.phone
      }
    });
  } catch (error) {
    console.error("Phone Login API Error:", error);
    return NextResponse.json({ error: "Failed to authenticate phone number." }, { status: 500 });
  }
}
