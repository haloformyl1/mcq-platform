import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";

import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import GlobalBackground from "@/components/GlobalBackground";
import GlobalSecurity from "@/components/GlobalSecurity";
import SuspendedAccountScreen from "@/components/SuspendedAccountScreen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: "PIECHEM - Smart Learning Platform",
  description: "PIECHEM Online Chemistry Exam and Assessment Platform",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let isSuspended = false;

  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const adminSession = cookieStore.get("admin_session")?.value;

    // Check device restriction or student session suspension (if not admin)
    if (!adminSession) {
      const deviceId = cookieStore.get("piechem_device_id")?.value;
      if (deviceId) {
        const suspendedDevice = await prisma.studentSession.findFirst({
          where: {
            deviceId,
            student: { status: "SUSPENDED" },
          },
          select: { id: true },
        });
        if (suspendedDevice) {
          isSuspended = true;
        }
      }

      if (!isSuspended && session) {
        const payload = await decrypt(session);
        if (payload?.id && payload.role === "student") {
          const student = await prisma.student.findUnique({
            where: { id: payload.id },
            select: { status: true },
          });
          if (student?.status === "SUSPENDED") {
            isSuspended = true;
          }
        }
      }
    }
  } catch {
    // Fail safely if database or token check fails
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-black`}
    >
      <body className="dark min-h-full flex flex-col bg-black text-slate-100 relative selection:bg-cyan-500/30 selection:text-cyan-200">
        {isSuspended ? (
          <SuspendedAccountScreen />
        ) : (
          <>
            <GlobalSecurity />
            <GlobalBackground />
            <div className="relative z-10 flex flex-col flex-1 min-h-full">
              {children}
            </div>
          </>
        )}
      </body>
    </html>
  );
}
