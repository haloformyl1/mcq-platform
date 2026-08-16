import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let setting = await prisma.proctoringSetting.findUnique({
      where: { id: "default" }
    });

    if (!setting) {
      setting = await prisma.proctoringSetting.create({
        data: {
          id: "default",
          enforceFullscreen: true,
          enableAiProctoring: true,
          faceAbsenceDelaySeconds: 10,
          maxAllowedWarnings: 5,
          tabSwitchAction: "AUTO_SUBMIT",
          enableAudioProctoring: true,
          audioNoiseDelaySeconds: 10,
          maxAudioWarnings: 3
        }
      });
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error("Failed to fetch proctoring settings:", error);
    return NextResponse.json({ error: "Failed to fetch proctoring settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const payload = adminSession ? await decrypt(adminSession) : null;
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    const setting = await prisma.proctoringSetting.upsert({
      where: { id: "default" },
      update: {
        enforceFullscreen: Boolean(data.enforceFullscreen),
        enableAiProctoring: Boolean(data.enableAiProctoring),
        faceAbsenceDelaySeconds: parseInt(data.faceAbsenceDelaySeconds) || 10,
        maxAllowedWarnings: parseInt(data.maxAllowedWarnings) || 5,
        tabSwitchAction: data.tabSwitchAction || "AUTO_SUBMIT",
        enableAudioProctoring: Boolean(data.enableAudioProctoring),
        audioNoiseDelaySeconds: parseInt(data.audioNoiseDelaySeconds) || 10,
        maxAudioWarnings: parseInt(data.maxAudioWarnings) || 3
      },
      create: {
        id: "default",
        enforceFullscreen: Boolean(data.enforceFullscreen),
        enableAiProctoring: Boolean(data.enableAiProctoring),
        faceAbsenceDelaySeconds: parseInt(data.faceAbsenceDelaySeconds) || 10,
        maxAllowedWarnings: parseInt(data.maxAllowedWarnings) || 5,
        tabSwitchAction: data.tabSwitchAction || "AUTO_SUBMIT",
        enableAudioProctoring: Boolean(data.enableAudioProctoring),
        audioNoiseDelaySeconds: parseInt(data.audioNoiseDelaySeconds) || 10,
        maxAudioWarnings: parseInt(data.maxAudioWarnings) || 3
      }
    });

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    console.error("Failed to update proctoring settings:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
