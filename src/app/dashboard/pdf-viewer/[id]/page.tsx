import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { hasPremiumAccess } from "@/lib/subscription";
import { validateStudentSession } from "@/lib/sessionService";
import PdfViewerClient from "./PdfViewerClient";
import { Crown, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PdfViewerPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cleanId = id.startsWith("db-") ? id.replace("db-", "") : id;

  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const payload = session ? await decrypt(session) : null;

  if (!payload || !payload.id) {
    redirect("/login");
  }

  // Enforce single active device concurrency check
  const { isValid, isRevoked } = await validateStudentSession(payload.id, cookieStore);
  if (!isValid || isRevoked) {
    cookieStore.delete("session");
    redirect("/login?reason=concurrent_device");
  }

  const student = await prisma.student.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      email: true,
      name: true,
      subscriptionStatus: true,
      subscriptionExpiresAt: true
    }
  });

  if (!student) {
    redirect("/login");
  }

  const material = await prisma.studyMaterial.findUnique({
    where: { id: cleanId }
  });

  if (!material) {
    notFound();
  }

  // Enforce Gold Subscription Guard for premium materials
  if (material.isPremium) {
    const isAllowed = hasPremiumAccess(student.subscriptionStatus, student.subscriptionExpiresAt);

    if (!isAllowed) {
      return (
        <div className="min-h-screen bg-[#040b12] text-slate-100 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#081524] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/40 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 border border-amber-500/40 flex items-center justify-center">
              <Crown className="w-8 h-8 text-amber-400" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                GOLD MEMBERSHIP REQUIRED
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Premium Vault Resource
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                <span className="font-semibold text-white">{material.title}</span> is restricted to active Gold members. Upgrade your account to unlock all official study materials, DPPs, and chapter notes.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                href="/dashboard/account"
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <span>Upgrade to Gold Access</span>
              </Link>
              <Link
                href="/dashboard"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <PdfViewerClient 
      material={{
        id: material.id,
        title: material.title,
        description: material.description,
        isPremium: material.isPremium,
        fileSize: material.fileSize
      }}
      student={student}
    />
  );
}
