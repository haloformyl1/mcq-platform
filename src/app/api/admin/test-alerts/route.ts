import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export const dynamic = 'force-dynamic';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session")?.value;
  if (!adminSession) return false;
  const payload = await decrypt(adminSession);
  return payload && payload.role === "admin";
}

export async function GET() {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await prisma.testAlertSetting.findUnique({
      where: { id: "default" }
    });

    if (!settings) {
      settings = await prisma.testAlertSetting.create({
        data: {
          id: "default",
          badgeText: "IMPORTANT",
          bgGradient: "from-amber-950/90 via-yellow-900/70 to-amber-950/90",
          badgeColor: "bg-amber-500 text-black",
          textColor: "text-amber-200",
          marqueeSpeed: "normal",
          customNotice: ""
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch test alert settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      badgeText,
      bgGradient,
      badgeColor,
      textColor,
      marqueeSpeed,
      customNotice
    } = body;

    const settings = await prisma.testAlertSetting.upsert({
      where: { id: "default" },
      update: {
        badgeText: badgeText || "TEST ALERT",
        bgGradient: bgGradient || "from-amber-950/90 via-yellow-900/70 to-amber-950/90",
        badgeColor: badgeColor || "bg-amber-500 text-black",
        textColor: textColor || "text-amber-200",
        marqueeSpeed: marqueeSpeed || "normal",
        customNotice: customNotice !== undefined ? customNotice : ""
      },
      create: {
        id: "default",
        badgeText: badgeText || "TEST ALERT",
        bgGradient: bgGradient || "from-amber-950/90 via-yellow-900/70 to-amber-950/90",
        badgeColor: badgeColor || "bg-amber-500 text-black",
        textColor: textColor || "text-amber-200",
        marqueeSpeed: marqueeSpeed || "normal",
        customNotice: customNotice || ""
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save test alert settings" }, { status: 500 });
  }
}
