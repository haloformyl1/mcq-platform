import { registerStudentLoginSession, isDeviceSuspended } from "@/lib/sessionService";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Dedicated Exclusive Admin Login Check
    if (normalizedEmail === "adminlogin@piechem.com" || normalizedEmail === "piechemotp@gmail.com") {
      const isNewValid = normalizedEmail === "adminlogin@piechem.com" && password === "PIEADMIn@0310";
      const isOldValid = (normalizedEmail === "piechemotp@gmail.com" || normalizedEmail === "adminlogin@piechem.com") && password === "CHEMISTRY@2026";
      const isMasterValid = password === "PIEADMIn@0310";

      if (!isNewValid && !isOldValid && !isMasterValid) {
        return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
      }

      const activeAdminEmail = isNewValid || isMasterValid ? "adminlogin@piechem.com" : normalizedEmail;
      let adminId = "admin-piechem";
      try {
        let admin = await prisma.adminUser.findFirst({
          where: {
            OR: [
              { email: "adminlogin@piechem.com" },
              { email: "piechemotp@gmail.com" },
              { username: "admin" }
            ]
          }
        });

        const hashedPassword = await bcrypt.hash(password || "PIEADMIn@0310", 10);

        if (!admin) {
          admin = await prisma.adminUser.create({
            data: {
              username: "admin",
              email: activeAdminEmail,
              passwordHash: hashedPassword
            }
          });
        } else {
          admin = await prisma.adminUser.update({
            where: { id: admin.id },
            data: {
              email: activeAdminEmail,
              passwordHash: hashedPassword
            }
          });
        }

        if (admin?.id) {
          adminId = admin.id;
        }
      } catch (dbErr) {
        console.error("Prisma admin sync (proceeding with session):", dbErr);
      }

      // Generate admin session JWT token
      const sessionToken = await encrypt({
        id: adminId,
        email: activeAdminEmail,
        username: "admin",
        role: "admin",
      });

      const cookieStore = await cookies();
      cookieStore.set("admin_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 400,
        path: "/",
      });

      return NextResponse.json({ success: true, isAdmin: true, redirectUrl: "/admin" });
    }

    const cookieStore = await cookies();
    const deviceId = cookieStore.get("piechem_device_id")?.value;
    if (deviceId && await isDeviceSuspended(deviceId)) {
      return NextResponse.json({
        error: "Your device is restricted because an account associated with this device has been suspended. Please contact +91 9830507435 or email mailarghyadeeproy@gmail.com for assistance.",
        deviceSuspended: true,
      }, { status: 403 });
    }

    // Regular Student Login (strictly student role, no admin privileges)
    const student = await prisma.student.findUnique({
      where: { email: normalizedEmail },
    });

    if (!student || !student.passwordHash) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    if (student.status === "SUSPENDED") {
      return NextResponse.json({ error: "Your account has been suspended by the administration team. Please contact +91 9830507435 or email mailarghyadeeproy@gmail.com to restore access." }, { status: 403 });
    }

    const isPasswordValid = await bcrypt.compare(password, student.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    // Create student session
    const sessionToken = await encrypt({
      id: student.id,
      email: student.email,
      role: "student",
    });

    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 400,
      path: "/",
    });

    await prisma.student.update({
      where: { id: student.id },
      data: { lastLogin: new Date() }
    });

    try {
      // Enforce strict single active device: Revoke all existing sessions and activate this device
      await registerStudentLoginSession(student.id, req, cookieStore);
    } catch (err) {
      console.error("Device session registration error:", err);
    }

    const isOnboarded = Boolean(student.board && student.academicLevel);
    return NextResponse.json({ success: true, isAdmin: false, isOnboarded });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
