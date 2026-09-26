"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, User } from "lucide-react";
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
  const isGold =
    isGoldMember ||
    student?.subscriptionStatus === "COMPLIMENTARY" ||
    (student?.subscriptionStatus === "PAID" &&
      (!student?.subscriptionExpiresAt ||
        new Date(student.subscriptionExpiresAt).getTime() > Date.now()));

  return (
    <header
      className={`dashboard-header sticky top-0 z-50 w-full bg-black/90 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7)] border-b border-white/[0.06] ${className}`}
    >
      <div className="site-header-inner w-full px-2.5 sm:px-6 lg:px-8 py-2 sm:py-3">
        {children ? (
          children
        ) : (
          <div className="flex min-w-0 items-center justify-between gap-1.5 sm:gap-4">
            {/* 1. FAR LEFT: PIE CHEM LOGO & CONTEXT */}
            <div className="flex items-center gap-1.5 sm:gap-3.5 shrink-0 min-w-0 max-w-[55%] xs:max-w-none">
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

            {/* 3. FAR RIGHT: Header Actions, Curriculum, Notifications & Account */}
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

              {/* Curriculum Switcher (if onCurriculumChange passed) */}
              {student && onCurriculumChange && (
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-[#061421]/90 border border-cyan-500/30 text-xs shadow-inner">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400 hidden xs:block shrink-0" />

                  <select
                    value={student.board || "CBSE"}
                    disabled={updatingCurriculum}
                    onChange={(e) => {
                      const nb = e.target.value;
                      const defaultLevel = nb === "WBCHSE" ? "SEM-I" : "11";
                      onCurriculumChange(nb, defaultLevel);
                    }}
                    className="bg-transparent text-cyan-300 font-extrabold text-[11px] sm:text-xs focus:outline-none cursor-pointer"
                    aria-label="Select Education Board"
                  >
                    <option value="CBSE" className="bg-[#040e17] text-cyan-300">
                      CBSE
                    </option>
                    <option value="ICSE" className="bg-[#040e17] text-cyan-300">
                      ICSE
                    </option>
                    <option value="WBCHSE" className="bg-[#040e17] text-cyan-300">
                      WBCHSE
                    </option>
                  </select>

                  <span className="text-slate-500 text-[10px]">•</span>

                  {student.board === "WBCHSE" ? (
                    <select
                      value={student.academicLevel || "SEM-I"}
                      disabled={updatingCurriculum}
                      onChange={(e) =>
                        onCurriculumChange(student.board || "WBCHSE", e.target.value)
                      }
                      className="bg-transparent text-teal-300 font-extrabold text-[11px] sm:text-xs focus:outline-none cursor-pointer"
                      aria-label="Select Semester"
                    >
                      <option value="SEM-I" className="bg-[#040e17] text-teal-300">
                        SEM-I
                      </option>
                      <option value="SEM-II" className="bg-[#040e17] text-teal-300">
                        SEM-II
                      </option>
                      <option value="SEM-III" className="bg-[#040e17] text-teal-300">
                        SEM-III
                      </option>
                      <option value="SEM-IV" className="bg-[#040e17] text-teal-300">
                        SEM-IV
                      </option>
                    </select>
                  ) : (
                    <select
                      value={student.academicLevel || "11"}
                      disabled={updatingCurriculum}
                      onChange={(e) =>
                        onCurriculumChange(student.board || "CBSE", e.target.value)
                      }
                      className="bg-transparent text-teal-300 font-extrabold text-[11px] sm:text-xs focus:outline-none cursor-pointer"
                      aria-label="Select Class Level"
                    >
                      <option value="11" className="bg-[#040e17] text-teal-300">
                        Class 11
                      </option>
                      <option value="12" className="bg-[#040e17] text-teal-300">
                        Class 12
                      </option>
                    </select>
                  )}

                  {updatingCurriculum ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping ml-1" />
                  ) : (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5"
                      title="Active Curriculum"
                    />
                  )}
                </div>
              )}

              {/* Account Link / Sign In */}
              {student ? (
                <Link
                  href="/dashboard/account"
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/40 text-xs font-bold text-cyan-300 hover:text-white transition shadow-sm shrink-0"
                  title="My Profile & Settings"
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-cyan-600 flex items-center justify-center shrink-0">
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
        )}
      </div>
    </header>
  );
}
