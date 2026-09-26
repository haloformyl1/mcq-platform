"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, User, ChevronDown, X, Check, LogOut } from "lucide-react";
import PiechemLogo from "@/components/PiechemLogo";
import NotificationCenterDropdown from "@/components/NotificationCenterDropdown";

export interface GlobalHeaderProps {
  isGoldMember?: boolean;
  contextBadge?: React.ReactNode;
  navigation?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  logoHref?: string;
  student?: any;
  upgradeReq?: any;
  showNavLinks?: boolean;
  onCurriculumChange?: (board: string, level: string) => Promise<void> | void;
  updatingCurriculum?: boolean;
  children?: React.ReactNode;
}

export default function GlobalHeader({
  isGoldMember = false,
  contextBadge,
  navigation,
  actions,
  className = "",
  logoHref = "/dashboard",
  student,
  upgradeReq,
  onCurriculumChange,
  updatingCurriculum = false,
  children
}: GlobalHeaderProps) {
  const [internalUpdating, setInternalUpdating] = useState(false);

  const isGold =
    isGoldMember ||
    student?.subscriptionStatus === "COMPLIMENTARY" ||
    (student?.subscriptionStatus === "PAID" &&
      (!student?.subscriptionExpiresAt ||
        new Date(student.subscriptionExpiresAt).getTime() > Date.now()));

  const isUpdating = updatingCurriculum || internalUpdating;

  const handleCurriculumChange = async (board: string, level: string) => {
    if (onCurriculumChange) {
      return onCurriculumChange(board, level);
    }
    
    // Fallback internal handler
    setInternalUpdating(true);
    try {
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board, academicLevel: level })
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to update curriculum", err);
    } finally {
      setInternalUpdating(false);
    }
  };

  return (
    <header
      className={`dashboard-header sticky top-0 z-50 w-full bg-black/90 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7)] border-b border-white/[0.06] ${className}`}
    >
      <div className="site-header-inner w-full px-2.5 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        {children ? (
          children
        ) : (
          <div className="flex flex-col w-full">
            {/* TOP ROW: LOGO, CENTER CONTEXT, AND RIGHT ACTIONS */}
            <div className="flex min-w-0 items-center justify-between gap-1.5 sm:gap-4 w-full">
              {/* 1. FAR LEFT: PIE CHEM LOGO & CONTEXT */}
              <div className="flex items-center gap-1.5 sm:gap-3.5 shrink-0 min-w-0">
                <PiechemLogo
                  size="md"
                  href={logoHref}
                  isGoldMember={isGold}
                />
                {contextBadge}
              </div>

              {/* 2. CENTER: Context / Page Navigation (if custom passed) */}
              {navigation ? (
                <div className="flex-1 flex items-center justify-center min-w-0 px-2">
                  {navigation}
                </div>
              ) : (
                <div className="flex-1 min-w-0" />
              )}

              {/* 3. FAR RIGHT: Desktop Curriculum, Notifications & Account */}
              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                {/* Custom actions slot if provided */}
                {actions}



                {/* Notifications Dropdown (if student prop passed) */}
                {student && (
                  <NotificationCenterDropdown
                    student={student}
                    upgradeReq={upgradeReq}
                  />
                )}

                {/* Account Link / Sign In */}
                {student ? (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Link
                      href="/dashboard/account"
                      className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/40 text-xs font-bold text-cyan-300 hover:text-white transition shadow-sm shrink-0"
                      title="My Profile & Settings"
                    >
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-cyan-600 flex items-center justify-center shrink-0 border border-cyan-400/30">
                        <img
                          src={student.avatarUrl || "/avatars/atom.jpg"}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e: any) => {
                            e.target.style.display = "none";
                          }}
                        />
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <span className="hidden md:inline">My Account</span>
                    </Link>
                    <button
                      onClick={async () => {
                        await fetch('/api/auth/student/logout', { method: 'POST' });
                        window.location.href = '/login';
                      }}
                      title="Logout"
                      className="p-1.5 sm:p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 hover:border-red-400/60 text-red-400 hover:text-red-300 transition-all group shrink-0 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                    >
                      <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-[11px] sm:text-xs font-bold text-cyan-300 hover:text-white transition shrink-0"
                  >
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
            </div>


          </div>
        )}
      </div>


    </header>
  );
}
