import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawIdentifier = (body.identifier || body.email || "").trim();
    
    if (!rawIdentifier) {
      return NextResponse.json({ error: "Email or phone number is required" }, { status: 400 });
    }

    const isEmail = rawIdentifier.includes("@");

    if (isEmail) {
      const normalizedEmail = rawIdentifier.toLowerCase();

      // Dedicated Admin Email Check
      if (normalizedEmail === "piechemotp@gmail.com") {
        return NextResponse.json({ accountStatus: "ACTIVE", name: "Administrator", isAdmin: true, type: "EMAIL" });
      }

      const student = await prisma.student.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          name: true,
          passwordHash: true,
          status: true,
        }
      });

      if (!student) {
        return NextResponse.json({ accountStatus: "NEW", name: null, type: "EMAIL" });
      }

      if (student.status === "SUSPENDED") {
        return NextResponse.json({ accountStatus: "SUSPENDED", name: student.name, error: "Your account has been suspended. Please contact the administrator for assistance." });
      }

      if (student.passwordHash) {
        return NextResponse.json({ accountStatus: "ACTIVE", name: student.name, type: "EMAIL" });
      } else {
        return NextResponse.json({ accountStatus: "UNVERIFIED", name: student.name, type: "EMAIL" });
      }
    } else {
      // Phone verification
      const phoneDigits = rawIdentifier.replace(/\D/g, "");
      if (phoneDigits.length < 10) {
        return NextResponse.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 400 });
      }
      const localNumber = phoneDigits.slice(-10);

      const student = await prisma.student.findFirst({
        where: {
          OR: [
            { phone: rawIdentifier },
            { phone: localNumber },
            { phone: `+91${localNumber}` },
            { phone: `91${localNumber}` }
          ]
        },
        select: {
          id: true,
          name: true,
          status: true,
          board: true,
          academicLevel: true
        }
      });

      if (!student) {
        return NextResponse.json({ accountStatus: "PHONE_NEW", name: null, type: "PHONE", phone: `+91${localNumber}` });
      }

      if (student.status === "SUSPENDED") {
        return NextResponse.json({ accountStatus: "SUSPENDED", name: student.name, error: "Your account has been suspended. Please contact the administrator for assistance." });
      }

      return NextResponse.json({ accountStatus: "PHONE_EXISTING", name: student.name, type: "PHONE", phone: `+91${localNumber}` });
    }
  } catch (error) {
    console.error("Identify Error:", error);
    return NextResponse.json({ error: "Failed to identify account" }, { status: 500 });
  }
}
