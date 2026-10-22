import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isDeviceSuspended } from "@/lib/sessionService";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check device restriction: If this device was used by a suspended account, block immediately
    const cookieStore = await cookies();
    const deviceId = cookieStore.get("piechem_device_id")?.value;
    if (deviceId && await isDeviceSuspended(deviceId)) {
      return NextResponse.json(
        { 
          accountStatus: "SUSPENDED", 
          error: "Your device is restricted because an account associated with this device has been suspended. Please contact +91 9830507435 or email mailarghyadeeproy@gmail.com for assistance.",
          deviceSuspended: true,
        }, 
        { status: 403 }
      );
    }

    // Dedicated Admin Email Check
    if (normalizedEmail === "adminlogin@piechem.com" || normalizedEmail === "piechemotp@gmail.com") {
      return NextResponse.json({ accountStatus: "ACTIVE", name: "Administrator", isAdmin: true });
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
      return NextResponse.json({ accountStatus: "NEW", name: null });
    }

    if (student.status === "SUSPENDED") {
      return NextResponse.json(
        { 
          accountStatus: "SUSPENDED", 
          name: student.name, 
          error: "Your account has been suspended by the administration team. Please contact +91 9830507435 or email mailarghyadeeproy@gmail.com to restore access." 
        }, 
        { status: 403 }
      );
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
