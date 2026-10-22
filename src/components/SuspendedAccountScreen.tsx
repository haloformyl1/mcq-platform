"use client";

import React, { useState } from "react";
import { ShieldAlert, Phone, Mail, LogOut } from "lucide-react";

export default function SuspendedAccountScreen() {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      // Delete session cookies explicitly if possible
      document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      document.cookie = "piechem_device_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <div
      id="suspended-account-overlay"
      className="fixed inset-0 z-[999999] bg-black text-white flex flex-col items-center justify-center p-6 sm:p-10 select-none overflow-y-auto"
      style={{ backgroundColor: "#000000" }}
    >
      <div className="max-w-lg w-full text-center space-y-8 animate-in fade-in duration-500">
        {/* 404 / Restricted Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/40 border border-red-700/60 text-red-400 text-xs font-mono font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.25)]">
          <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
          <span>404 Error • Access Denied</span>
        </div>

        {/* Big 404 Headline */}
        <div className="space-y-3">
          <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-white font-mono drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            404
          </h1>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-red-500">
            Account Suspended
          </h2>
        </div>

        {/* Professional & Grammatically Error-Free Message */}
        <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-[#222222] shadow-2xl text-left space-y-4">
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-normal">
            Your student account has been suspended by the administrative team. Access to all examination portals, curriculum modules, and study materials has been temporarily revoked.
          </p>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            If you believe this is an error or would like to initiate an account review, please contact the administrative team directly:
          </p>

          {/* Contact Details */}
          <div className="space-y-2.5 pt-2 border-t border-[#1e1e1e]">
            <a
              href="tel:9830507435"
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-gray-200 hover:text-white transition group"
            >
              <div className="w-9 h-9 rounded-lg bg-red-950/40 border border-red-800/40 flex items-center justify-center text-red-400 group-hover:scale-105 transition">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[11px] text-gray-500 uppercase tracking-wider font-mono">Administrative Hotline</div>
                <div className="text-sm font-bold text-white tracking-wide font-mono">+91 9830507435</div>
              </div>
            </a>

            <a
              href="mailto:mailarghyadeeproy@gmail.com?subject=Account%20Suspension%20Inquiry"
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-gray-200 hover:text-white transition group"
            >
              <div className="w-9 h-9 rounded-lg bg-red-950/40 border border-red-800/40 flex items-center justify-center text-red-400 group-hover:scale-105 transition">
                <Mail className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[11px] text-gray-500 uppercase tracking-wider font-mono">Official Support Email</div>
                <div className="text-sm font-bold text-white tracking-wide">mailarghyadeeproy@gmail.com</div>
              </div>
            </a>
          </div>
        </div>

        {/* Logout / Switch Account Action */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] border border-[#2a2a2a] text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? "Signing Out..." : "Sign Out / Switch Account"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
