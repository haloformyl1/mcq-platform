"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, ArrowRight, ShieldCheck } from "lucide-react";

export default function AdminSubscriptionsPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/admin/students");
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0b0f19] border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(229,9,20,0.3)]">
          <ShieldCheck size={32} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-white">Subscriptions Queue Decommissioned</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            UPI queues and payment verification have been scrapped. Manage Free and Ultra student memberships directly from the Students Directory.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/admin/students"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl text-xs font-bold transition shadow-[0_0_20px_rgba(229,9,20,0.4)]"
          >
            <Users size={16} />
            <span>Go to Students Directory</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
