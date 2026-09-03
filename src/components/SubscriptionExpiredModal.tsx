"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X, Sparkles, ArrowRight } from "lucide-react";
import { formatDateTime24 } from "@/lib/subscription";

interface SubscriptionExpiredModalProps {
  student?: {
    id: string;
    subscriptionStatus?: string | null;
    subscriptionExpiresAt?: string | Date | null;
  } | null;
}

export default function SubscriptionExpiredModal({ student }: SubscriptionExpiredModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    if (!student || !student.id || !student.subscriptionExpiresAt) {
      return;
    }

    const checkExpiry = () => {
      const expiryDate = new Date(student.subscriptionExpiresAt!);
      if (isNaN(expiryDate.getTime())) return;
      
      const now = new Date();
      // Triggers if expiry timestamp has passed
      if (now >= expiryDate) {
        const storageKey = `piechem_expiry_dismissed_${student.id}_${expiryDate.toISOString()}`;
        const dismissed = localStorage.getItem(storageKey);

        if (dismissed === "true") {
          setIsDismissed(true);
          setIsOpen(false);
        } else {
          setIsDismissed(false);
          setIsOpen(true);
        }
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 1000); // Live real-time check every second
    return () => clearInterval(interval);
  }, [student]);

  const handleIgnore = () => {
    if (student && student.subscriptionExpiresAt) {
      const expiryDate = new Date(student.subscriptionExpiresAt);
      const storageKey = `piechem_expiry_dismissed_${student.id}_${expiryDate.toISOString()}`;
      localStorage.setItem(storageKey, "true");
    }
    setIsOpen(false);
    setIsDismissed(true);
  };

  const handleRenew = () => {
    handleIgnore();
    router.push("/dashboard/account#renew");
  };

  if (!isOpen || isDismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#161208] via-[#0d1017] to-black border border-amber-500/50 p-6 sm:p-7 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.25)] text-center space-y-5 animate-scale-in">
        
        {/* Close "X" Button */}
        <button
          onClick={handleIgnore}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition cursor-pointer"
          title="Dismiss alert"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 3D Glowing Warning Shield */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/30 via-red-500/20 to-black border border-amber-500/60 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.35)]">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Your Premium Pass Has Expired
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Your 30-day subscription cycle ended on{" "}
            <strong className="text-amber-300 font-mono font-bold">
              {formatDateTime24(student?.subscriptionExpiresAt)}
            </strong>.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed pt-1">
            Renew your subscription now to restore unlimited exam attempts, full step-by-step solutions, and detailed chapter analytics.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={handleRenew}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black text-sm tracking-wide uppercase hover:brightness-110 active:scale-98 transition shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Renew Subscription Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleIgnore}
            className="w-full py-2.5 px-4 text-xs font-bold text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            Ignore
          </button>
        </div>
      </div>
    </div>
  );
}