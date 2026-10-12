"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  Shield,
  CreditCard,
  GraduationCap,
  KeyRound,
  LogOut,
  ChevronDown
} from "lucide-react";

interface AdminHeaderProps {
  onOpenMobile: () => void;
  onOpenCommandPalette: () => void;
  pendingPaymentCount: number;
  onOpenPasswordModal: () => void;
  onOpenProctoringModal: () => void;
  onTestAsStudent: () => void;
  onLogout: () => void;
}

export default function AdminHeader({
  onOpenMobile,
  onOpenCommandPalette,
  pendingPaymentCount,
  onOpenPasswordModal,
  onOpenProctoringModal,
  onTestAsStudent,
  onLogout,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format breadcrumb from pathname
  const getBreadcrumb = () => {
    if (pathname === "/admin" || pathname === "/admin/dashboard") {
      return { title: "Command Dashboard", section: "Overview" };
    }
    if (pathname.startsWith("/admin/tests")) {
      return { title: "Tests & Examination Bank", section: "Academics" };
    }
    if (pathname.startsWith("/admin/study-materials")) {
      return { title: "Study Materials & Digital Library", section: "Academics" };
    }
    if (pathname.startsWith("/admin/results")) {
      return { title: "Examination Results & Logs", section: "Academics" };
    }
    if (pathname.startsWith("/admin/students")) {
      return { title: "Student Roster & Verification", section: "Academics" };
    }
    if (pathname.startsWith("/admin/subscriptions")) {
      return { title: "PIE Ultra Subscriptions", section: "Commerce" };
    }
    if (pathname.startsWith("/admin/payments")) {
      return { title: "Payment & Subscription Hub", section: "Commerce" };
    }
    if (pathname.startsWith("/admin/notifications")) {
      return { title: "Broadcast Notifications", section: "Communications" };
    }
    if (pathname.startsWith("/admin/test-alerts")) {
      return { title: "Live Marquee Alert Ticker", section: "Communications" };
    }
    return { title: "Administration", section: "Portal" };
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80 shadow-md">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left Section: Mobile Menu + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobile}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            title="Open menu"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0 hidden sm:block">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <span>Admin</span>
              <span>/</span>
              <span className="text-red-400 font-semibold">{breadcrumb.section}</span>
            </div>
            <h1 className="text-sm font-bold text-white tracking-tight truncate">
              {breadcrumb.title}
            </h1>
          </div>
        </div>

        {/* Center: Command Palette Trigger */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#121724] hover:bg-[#182030] border border-slate-700/60 hover:border-slate-600 text-xs text-slate-400 hover:text-slate-200 transition shadow-inner group"
          >
            <div className="flex items-center gap-2 truncate">
              <Search size={14} className="text-slate-400 group-hover:text-red-400 transition-colors" />
              <span className="truncate">Quick search pages, tools...</span>
            </div>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800/90 rounded border border-slate-700">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right Tools Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Test As Student Mode */}
          <button
            type="button"
            onClick={onTestAsStudent}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-600/40 transition shadow-sm"
            title="Preview platform exactly as an enrolled student"
          >
            <GraduationCap size={15} className="text-amber-400" />
            <span>Student View</span>
          </button>

          {/* Pending Subscriptions Link & Badge */}
          <Link
            href="/admin/payments"
            className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-600/40 transition shadow-sm"
            title="Review student UPI subscriptions and fee rates"
          >
            <CreditCard size={15} className="text-emerald-400" />
            <span className="hidden md:inline">Payments</span>
            {pendingPaymentCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#E50914] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-red-950 shadow-[0_0_10px_rgba(229,9,20,0.8)] animate-pulse">
                {pendingPaymentCount > 9 ? "9+" : pendingPaymentCount}
              </span>
            )}
          </Link>

          {/* Security Protocols Modal Trigger */}
          <button
            type="button"
            onClick={onOpenProctoringModal}
            className="p-2 rounded-xl text-red-300 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 transition"
            title="Configure anti-cheating & proctoring protocols"
          >
            <Shield size={16} className="text-red-400" />
          </button>

          {/* Administrator Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-red-700 to-red-500 flex items-center justify-center text-white text-xs font-black shadow">
                A
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#0e131f] border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 z-50 animate-fade-in space-y-1">
                <div className="px-3 py-2 border-b border-slate-800 text-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>Administrator</span>
                    <span className="bg-red-950 text-red-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-red-600/40">
                      ROOT
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">PIE Chem Command</div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onOpenPasswordModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition text-left"
                >
                  <KeyRound size={15} className="text-cyan-400" />
                  <span>Security Credentials</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onTestAsStudent();
                  }}
                  className="w-full sm:hidden flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-slate-800/80 transition text-left"
                >
                  <GraduationCap size={15} className="text-amber-400" />
                  <span>Student View Mode</span>
                </button>

                <div className="border-t border-slate-800 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/40 transition text-left"
                >
                  <LogOut size={15} className="text-red-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
