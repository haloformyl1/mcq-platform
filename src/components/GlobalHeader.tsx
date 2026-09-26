"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Home,
  Target,
  BookOpen,
  Atom,
  Sparkles,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  Check,
  Phone,
  MessageSquare,
  ShieldCheck,
  Award
} from "lucide-react";
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
  showNavLinks = true,
  onCurriculumChange,
  updatingCurriculum = false,
  children
}: GlobalHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [curriculumMenuOpen, setCurriculumMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setCurriculumMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  // Escape key handler for accessible drawer dismissal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("piechem_is_gold");
          localStorage.removeItem("piechem_gold_expires_at");
          localStorage.removeItem("piechem_is_complimentary");
          window.dispatchEvent(new Event("piechem_gold_status_changed"));
        } catch {}
      }
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.href = "/";
    }
  };

  const isGold =
    isGoldMember ||
    student?.subscriptionStatus === "COMPLIMENTARY" ||
    (student?.subscriptionStatus === "PAID" &&
      (!student?.subscriptionExpiresAt ||
        new Date(student.subscriptionExpiresAt).getTime() > Date.now()));

  // Core EdTech Navigation Links
  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard",
    },
    {
      label: "Tests",
      href: "/dashboard#tests",
      icon: Target,
      isActive: pathname?.startsWith("/exam"),
    },
    {
      label: "Study Materials",
      href: "/study-material",
      icon: BookOpen,
      isActive: pathname?.startsWith("/study-material"),
    },
    {
      label: "3D Simulations",
      href: "/3d-animations",
      icon: Atom,
      isActive: pathname === "/3d-animations",
    },
    {
      label: "AI Tutor",
      href: "/dashboard/ai",
      icon: Sparkles,
      isActive: pathname?.startsWith("/dashboard/ai"),
      badge: "AI",
    },
  ];

  return (
    <>
      <header
        className={`dashboard-header sticky top-0 z-50 w-full bg-black/90 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7)] ${className}`}
      >
        <div className="site-header-inner w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          {children ? (
            children
          ) : (
            <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-4">
              {/* 1. FAR LEFT: PIE CHEM LOGO & CONTEXT */}
              <div className="flex items-center gap-2 sm:gap-3.5 shrink-0 min-w-0">
                <PiechemLogo
                  size="md"
                  href={logoHref}
                  isGoldMember={isGold}
                />
                {contextBadge}
              </div>

              {/* 2. CENTER: Main Navigation Links (Desktop: lg+) */}
              {navigation ? (
                <div className="flex-1 flex items-center justify-center min-w-0 px-2">
                  {navigation}
                </div>
              ) : showNavLinks ? (
                <nav
                  className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 flex-1 min-w-0 px-2"
                  aria-label="Main Navigation"
                >
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          item.isActive
                            ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                            : "text-slate-300 hover:text-white hover:bg-white/[0.04] border border-transparent"
                        }`}
                      >
                        <Icon
                          className={`w-3.5 h-3.5 ${
                            item.isActive ? "text-cyan-400" : "text-slate-400"
                          }`}
                        />
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold uppercase tracking-wider ml-0.5">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              ) : (
                <div className="flex-1 min-w-0" />
              )}

              {/* 3. FAR RIGHT: Desktop Actions & Mobile Trigger */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Custom actions slot if provided */}
                {actions}

                {/* Notifications Dropdown (if student prop passed) */}
                {student && (
                  <NotificationCenterDropdown
                    student={student}
                    upgradeReq={upgradeReq}
                  />
                )}

                {/* Desktop Curriculum Switcher (if onCurriculumChange passed) */}
                {student && onCurriculumChange && (
                  <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#061421]/90 border border-cyan-500/30 text-xs shadow-inner">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400 hidden sm:block shrink-0" />

                    <select
                      value={student.board || "CBSE"}
                      disabled={updatingCurriculum}
                      onChange={(e) => {
                        const nb = e.target.value;
                        const defaultLevel = nb === "WBCHSE" ? "SEM-I" : "11";
                        onCurriculumChange(nb, defaultLevel);
                      }}
                      className="bg-transparent text-cyan-300 font-extrabold text-xs focus:outline-none cursor-pointer"
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

                {/* Desktop Account Link */}
                {student ? (
                  <Link
                    href="/dashboard/account"
                    className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/40 text-xs font-bold text-cyan-300 hover:text-white transition shadow-sm shrink-0"
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
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-xs font-bold text-cyan-300 hover:text-white transition"
                  >
                    <span>Sign In</span>
                  </Link>
                )}

                {/* Mobile / Tablet Hamburger Menu Button (lg:hidden) */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(prev => !prev)}
                  className="lg:hidden touch-target p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-cyan-500/20 border border-white/10 active:border-cyan-400 text-slate-200 hover:text-white transition flex items-center justify-center"
                  aria-label={mobileMenuOpen ? "Close menu" : "Open navigation menu"}
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5 text-cyan-300" />
                  ) : (
                    <Menu className="w-5 h-5 text-slate-200" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ========================================================= */}
      {/* MOBILE NAVIGATION DRAWER & BACKDROP                       */}
      {/* ========================================================= */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`mobile-nav-drawer ${
          mobileMenuOpen ? "mobile-nav-drawer-open" : "mobile-nav-drawer-closed"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        {/* Drawer Header: Brand + Close button */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <PiechemLogo size="sm" href={logoHref} isGoldMember={isGold} />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="touch-target p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity / Profile Card */}
        {student ? (
          <div className="my-4 p-3.5 rounded-2xl bg-gradient-to-br from-cyan-950/60 via-[#07131f] to-black/80 border border-cyan-500/30 space-y-2.5 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-cyan-700 border border-cyan-400 flex items-center justify-center shrink-0">
                <img
                  src={student.avatarUrl || "/avatars/atom.jpg"}
                  alt={student.name || "Student"}
                  className="w-full h-full object-cover"
                  onError={(e: any) => {
                    e.target.style.display = "none";
                  }}
                />
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate">
                  {student.name || "Student"}
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  {student.email}
                </div>
              </div>
            </div>

            {/* Status Pill */}
            <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
              {isGold ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Gold Member
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  Free Student Account
                </span>
              )}
              <Link
                href="/dashboard/account"
                onClick={() => setMobileMenuOpen(false)}
                className="text-cyan-400 hover:text-cyan-300 font-semibold text-xs flex items-center gap-0.5"
              >
                <span>Profile</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-[#0b1c2d] to-[#040c15] border border-cyan-500/30 text-center space-y-3">
            <p className="text-xs text-slate-300">
              Sign in to save test scores, track rankings, and access the AI chemistry tutor.
            </p>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider block transition shadow-md"
            >
              Sign In / Register
            </Link>
          </div>
        )}

        {/* Curriculum Switcher Dropdown (if onCurriculumChange is provided) */}
        {student && onCurriculumChange && (
          <div className="mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <BookOpen className="w-3.5 h-3.5" />
                Active Curriculum
              </span>
              <span className="text-teal-300 font-mono">
                {student.board} • {student.academicLevel}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCurriculumMenuOpen(prev => !prev)}
              className="w-full py-2 px-3 rounded-lg bg-[#07131e] border border-cyan-500/30 text-xs font-semibold text-white flex items-center justify-between transition hover:border-cyan-400"
            >
              <span>Change Curriculum Selection</span>
              <ChevronDown
                className={`w-4 h-4 text-cyan-400 transition-transform ${
                  curriculumMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {curriculumMenuOpen && (
              <div className="pt-2 space-y-2 text-xs animate-in fade-in duration-200">
                <div className="text-[10px] text-slate-400 font-mono">WBCHSE SEMESTERS:</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {["SEM-I", "SEM-II", "SEM-III", "SEM-IV"].map((lvl) => {
                    const isSelected =
                      student.board === "WBCHSE" && student.academicLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        disabled={updatingCurriculum}
                        onClick={async () => {
                          setCurriculumMenuOpen(false);
                          if (!isSelected) {
                            await onCurriculumChange("WBCHSE", lvl);
                          }
                        }}
                        className={`py-1.5 px-2 rounded text-[11px] font-bold text-center border transition ${
                          isSelected
                            ? "bg-cyan-500/25 border-cyan-400 text-cyan-200"
                            : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {lvl} {isSelected && "✓"}
                      </button>
                    );
                  })}
                </div>

                <div className="text-[10px] text-slate-400 font-mono pt-1">CBSE & ICSE:</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { board: "CBSE", level: "11", label: "CBSE 11" },
                    { board: "CBSE", level: "12", label: "CBSE 12" },
                    { board: "ICSE", level: "11", label: "ICSE 11" },
                    { board: "ICSE", level: "12", label: "ICSE 12" },
                  ].map((item) => {
                    const isSelected =
                      student.board === item.board && student.academicLevel === item.level;
                    return (
                      <button
                        key={`${item.board}-${item.level}`}
                        type="button"
                        disabled={updatingCurriculum}
                        onClick={async () => {
                          setCurriculumMenuOpen(false);
                          if (!isSelected) {
                            await onCurriculumChange(item.board, item.level);
                          }
                        }}
                        className={`py-1.5 px-2 rounded text-[11px] font-bold text-center border transition ${
                          isSelected
                            ? "bg-teal-500/25 border-teal-400 text-teal-200"
                            : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {item.label} {isSelected && "✓"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Links List */}
        <div className="flex-1 space-y-1 py-2 overflow-y-auto">
          <div className="text-[10px] font-mono tracking-wider text-slate-500 uppercase px-2 mb-1.5">
            Platform Sections
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition active:bg-white/[0.08] touch-manipulation ${
                  item.isActive
                    ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      item.isActive ? "text-cyan-400" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold uppercase tracking-wider">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                )}
              </Link>
            );
          })}

          {student && (
            <Link
              href="/dashboard/account"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition active:bg-white/[0.08] touch-manipulation ${
                pathname === "/dashboard/account"
                  ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile & Settings</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            </Link>
          )}
        </div>

        {/* Footer of Drawer: Helpline & Logout */}
        <div className="pt-4 mt-2 border-t border-white/10 space-y-3">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Support Helpline</span>
            <a
              href="tel:9830507435"
              className="text-cyan-400 hover:underline font-mono font-bold"
            >
              9830507435
            </a>
          </div>

          {student && (
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full py-2.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-950/70 border border-red-900/50 text-red-300 hover:text-red-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
