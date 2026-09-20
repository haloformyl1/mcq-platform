import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { hasPremiumAccess } from "@/lib/subscription";
import LabViewerClient from "./LabViewerClient";
import { Lock, Crown, ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LabViewerPage({
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

  // Enforce Gold Subscription Guard
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
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-950 text-amber-400 border border-amber-500/30">
                Gold Membership Exclusive
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {material.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                This interactive 3D virtual chemistry laboratory requires an active Gold membership.
              </p>
            </div>

            <div className="bg-[#050e18] p-4 rounded-2xl border border-slate-800 text-left space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">With Gold You Get:</p>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Unlimited access to all 3D virtual chemistry simulations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Premium chapter notes, DPPs, and previous year solutions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Advanced AI doubt tutor and adaptive mock exams</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/dashboard/account"
                className="w-full py-3 px-6 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition shadow-lg shadow-amber-500/25 uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Upgrade to Gold Now</span>
              </Link>

              <Link
                href="/dashboard"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-900 transition border border-slate-800 flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Library Vault</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  // Obfuscate the destination URL for secure in-app rendering
  const encodedUrl = Buffer.from(material.url).toString('base64');

  return (
    <LabViewerClient
      material={{
        id: material.id,
        title: material.title,
        description: material.description,
        isPremium: material.isPremium,
        token: encodedUrl
      }}
      student={{
        id: student.id,
        email: student.email,
        name: student.name,
        subscriptionStatus: student.subscriptionStatus
      }}
    />
  );
}