"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, User, ChevronDown, X, Check } from "lucide-react";
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
  const [mobileCurriculumModalOpen, setMobileCurriculumModalOpen] = useState(false);

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

                {/* DESKTOP-ONLY Curriculum Switcher (md and up) */}
                {student && onCurriculumChange && (
                  <div className="hidden md:flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl bg-[#061421]/90 border border-cyan-500/30 text-xs shadow-inner">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />

                    <select
                      value={student.board || "CBSE"}
                      disabled={updatingCurriculum}
                      onChange={(e) => {
                        const nb = e.target.value;
                        const defaultLevel = nb === "WBCHSE" ? "SEM-I" : "11";
                        onCurriculumChange(nb, defaultLevel);
                      }}
                      className="bg-transparent text-cyan-300 font-extrabold text-xs focus:outline-none cursor-pointer"
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
                        className="bg-transparent text-teal-300 font-extrabold text-xs focus:outline-none cursor-pointer"
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
                        className="bg-transparent text-teal-300 font-extrabold text-xs focus:outline-none cursor-pointer"
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
                        className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5 shadow-[0_0_6px_#10b981]"
                        title="Active Curriculum"
                      />
                    )}
                  </div>
                )}

                {/* Notifications Dropdown (if student prop passed) */}
                {student && (
                  <NotificationCenterDropdown
                    student={student}
                    upgradeReq={upgradeReq}
                  />
                )}

                {/* Account Link / Sign In */}
                {student ? (
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

            {/* DEDICATED MOBILE CURRICULUM STRIP (md:hidden) */}
            {student && onCurriculumChange && (
              <div className="md:hidden mt-2 pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2 px-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_#10b981]" />
                  <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase shrink-0">
                    CURRICULUM:
                  </span>
                  <span className="text-xs font-black text-cyan-300 truncate">
                    {student.board || "CBSE"} • {student.academicLevel || "11"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileCurriculumModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/40 text-[11px] font-bold text-cyan-300 transition shrink-0 active:scale-95"
                >
                  <span>Switch</span>
                  <ChevronDown className="w-3 h-3 text-cyan-400" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOBILE CURRICULUM BOTTOM SHEET MODAL */}
      {mobileCurriculumModalOpen && student && onCurriculumChange && (
        <div 
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setMobileCurriculumModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#040e17] border-t sm:border border-cyan-500/30 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Select Curriculum</h3>
                  <p className="text-[11px] text-slate-400">Target your syllabus, notes & tests</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileCurriculumModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Board Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
                Education Board
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["CBSE", "ICSE", "WBCHSE"].map((b) => {
                  const isSelected = (student.board || "CBSE") === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        const defaultLevel = b === "WBCHSE" ? "SEM-I" : "11";
                        onCurriculumChange(b, defaultLevel);
                      }}
                      disabled={updatingCurriculum}
                      className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 border ${
                        isSelected
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                          : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      <span>{b}</span>
                      {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Level / Semester Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
                {student.board === "WBCHSE" ? "Semester" : "Class Level"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(student.board === "WBCHSE"
                  ? ["SEM-I", "SEM-II", "SEM-III", "SEM-IV"]
                  : ["11", "12"]
                ).map((lvl) => {
                  const isSelected = (student.academicLevel || (student.board === "WBCHSE" ? "SEM-I" : "11")) === lvl;
                  const label = student.board === "WBCHSE" ? lvl : `Class ${lvl}`;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        onCurriculumChange(student.board || "CBSE", lvl);
                        setMobileCurriculumModalOpen(false);
                      }}
                      disabled={updatingCurriculum}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-between border ${
                        isSelected
                          ? "bg-teal-500/20 border-teal-400 text-teal-200 shadow-[0_0_12px_rgba(20,184,166,0.25)]"
                          : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      <span>{label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-teal-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {updatingCurriculum && (
              <div className="flex items-center justify-center gap-2 pt-1 text-xs text-cyan-300 font-mono">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Syncing curriculum data...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
