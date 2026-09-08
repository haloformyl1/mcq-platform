import prisma from "@/lib/prisma";
import crypto from "crypto";

let sessionTableInitialized = false;

export async function ensureSessionTable() {
  if (sessionTableInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "StudentSession" (
        "id" TEXT PRIMARY KEY,
        "studentId" TEXT NOT NULL,
        "deviceId" TEXT NOT NULL,
        "sessionTokenHash" TEXT,
        "deviceType" TEXT NOT NULL DEFAULT 'desktop',
        "deviceName" TEXT NOT NULL DEFAULT 'Web Browser',
        "browser" TEXT NOT NULL DEFAULT 'Chrome',
        "os" TEXT NOT NULL DEFAULT 'PC',
        "ipAddress" TEXT,
        "city" TEXT,
        "country" TEXT,
        "userAgent" TEXT,
        "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "isRevoked" BOOLEAN NOT NULL DEFAULT false,
        CONSTRAINT "StudentSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "StudentSession_studentId_deviceId_key" ON "StudentSession"("studentId", "deviceId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "StudentSession_studentId_idx" ON "StudentSession"("studentId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "StudentSession_lastActive_idx" ON "StudentSession"("lastActive");
    `);
    sessionTableInitialized = true;
  } catch (err) {
    // Suppress if already exists
    sessionTableInitialized = true;
  }
}

export interface ParsedDeviceInfo {
  deviceType: "desktop" | "mobile" | "tablet";
  deviceName: string;
  browser: string;
  os: string;
}

export function parseUserAgent(uaString: string | null | undefined): ParsedDeviceInfo {
  if (!uaString) {
    return {
      deviceType: "desktop",
      deviceName: "PC Chrome - Web browser",
      browser: "Chrome",
      os: "PC",
    };
  }

  const ua = uaString.toLowerCase();
  const isTablet = /ipad|tablet/.test(ua) || (ua.includes("macintosh") && ua.includes("touch"));
  const isMobile = !isTablet && /mobile|iphone|android|touch/.test(ua);
  const deviceType: "desktop" | "mobile" | "tablet" = isTablet ? "tablet" : (isMobile ? "mobile" : "desktop");

  let os = "PC";
  if (ua.includes("windows") || ua.includes("win32") || ua.includes("win64")) {
    os = "PC";
  } else if (ua.includes("macintosh") || ua.includes("mac os")) {
    os = isTablet ? "iPad" : "Mac";
  } else if (ua.includes("iphone")) {
    os = "iPhone";
  } else if (ua.includes("ipad")) {
    os = "iPad";
  } else if (ua.includes("android")) {
    os = "Android";
  } else if (ua.includes("linux")) {
    os = "Linux";
  } else if (ua.includes("cros")) {
    os = "Chromebook";
  }

  let browser = "Chrome";
  if (ua.includes("edg/") || ua.includes("edge/")) {
    browser = "Edge";
  } else if (ua.includes("opr/") || ua.includes("opera/")) {
    browser = "Opera";
  } else if (ua.includes("brave")) {
    browser = "Brave";
  } else if (ua.includes("firefox") || ua.includes("fxios")) {
    browser = "Firefox";
  } else if (ua.includes("safari") && !ua.includes("chrome") && !ua.includes("chromium")) {
    browser = "Safari";
  } else if (ua.includes("chrome") || ua.includes("crios")) {
    browser = "Chrome";
  }

  const browserSuffix = deviceType === "mobile" 
    ? "Mobile browser" 
    : (deviceType === "tablet" ? "Tablet browser" : "Web browser");
  
  // Format exact Netflix style: "PC Chrome - Web browser"
  const deviceName = `${os} ${browser} - ${browserSuffix}`;

  return {
    deviceType,
    deviceName,
    browser,
    os,
  };
}

export function formatNetflixDeviceDate(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "-";

  // Match: 05/09/26, 10:02 pm IST
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hourStr = String(hours).padStart(2, "0");

  return `${day}/${month}/${year}, ${hourStr}:${minutes} ${ampm} IST`;
}

export function extractClientIp(req?: Request): string {
  if (!req) return "127.0.0.1";
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "Unknown";
}

export async function touchOrCreateStudentSession(
  studentId: string,
  req: Request,
  cookieStore: any
): Promise<{ deviceId: string; isRevoked: boolean }> {
  await ensureSessionTable();

  let deviceId = cookieStore.get("piechem_device_id")?.value;
  let isNew = false;
  if (!deviceId) {
    deviceId = `dev_${crypto.randomBytes(12).toString("hex")}`;
    isNew = true;
  }

  // Always ensure deviceId cookie is set/extended
  cookieStore.set("piechem_device_id", deviceId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 400, // 400 days
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const uaString = req.headers.get("user-agent");
  const parsed = parseUserAgent(uaString);
  const ip = extractClientIp(req);

  try {
    const existing = await prisma.studentSession.findUnique({
      where: {
        studentId_deviceId: {
          studentId,
          deviceId,
        },
      },
    });

    if (existing) {
      if (existing.isRevoked) {
        return { deviceId, isRevoked: true };
      }
      await prisma.studentSession.update({
        where: { id: existing.id },
        data: {
          lastActive: new Date(),
          deviceName: parsed.deviceName,
          deviceType: parsed.deviceType,
          browser: parsed.browser,
          os: parsed.os,
          ipAddress: ip,
          userAgent: uaString || undefined,
        },
      });
      return { deviceId, isRevoked: false };
    }

    await prisma.studentSession.create({
      data: {
        studentId,
        deviceId,
        deviceName: parsed.deviceName,
        deviceType: parsed.deviceType,
        browser: parsed.browser,
        os: parsed.os,
        ipAddress: ip,
        userAgent: uaString || undefined,
        lastActive: new Date(),
        isRevoked: false,
      },
    });

    return { deviceId, isRevoked: false };
  } catch (error) {
    console.error("Error in touchOrCreateStudentSession:", error);
    return { deviceId, isRevoked: false };
  }
}

export async function getActiveStudentSessions(studentId: string, currentDeviceId?: string) {
  await ensureSessionTable();

  try {
    const sessions = await prisma.studentSession.findMany({
      where: {
        studentId,
        isRevoked: false,
      },
      orderBy: {
        lastActive: "desc",
      },
    });

    const now = Date.now();

    return sessions.map((s) => {
      const isCurrent = Boolean(currentDeviceId && s.deviceId === currentDeviceId);
      const diffMs = now - new Date(s.lastActive).getTime();
      const isActiveNow = diffMs < 3 * 60 * 1000; // within 3 minutes

      return {
        id: s.id,
        deviceId: s.deviceId,
        deviceName: s.deviceName,
        deviceType: s.deviceType,
        browser: s.browser,
        os: s.os,
        ipAddress: s.ipAddress || "Local Network",
        lastActive: s.lastActive,
        lastActiveFormatted: formatNetflixDeviceDate(s.lastActive),
        createdAt: s.createdAt,
        createdAtFormatted: formatNetflixDeviceDate(s.createdAt),
        isCurrent,
        isActiveNow,
      };
    });
  } catch (error) {
    console.error("Error in getActiveStudentSessions:", error);
    return [];
  }
}

export async function revokeStudentSession(studentId: string, sessionIdOrDeviceId: string) {
  await ensureSessionTable();
  try {
    await prisma.studentSession.deleteMany({
      where: {
        studentId,
        OR: [
          { id: sessionIdOrDeviceId },
          { deviceId: sessionIdOrDeviceId },
        ],
      },
    });
    return true;
  } catch (error) {
    console.error("Error in revokeStudentSession:", error);
    return false;
  }
}

export async function revokeAllStudentSessions(studentId: string) {
  await ensureSessionTable();
  try {
    await prisma.studentSession.deleteMany({
      where: { studentId },
    });
    return true;
  } catch (error) {
    console.error("Error in revokeAllStudentSessions:", error);
    return false;
  }
}
