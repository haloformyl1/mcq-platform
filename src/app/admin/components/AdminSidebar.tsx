"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  BarChart3,
  Users,
  CreditCard,
  Wallet,
  Bell,
  Megaphone,
  Shield,
  QrCode,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  LogOut,
  GraduationCap,
  X,
  Settings
} from "lucide-react";
import PiechemLogo from "@/components/PiechemLogo";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  pendingPaymentCount: number;
  onOpenPasswordModal: () => void;
  onOpenProctoringModal: () => void;
  onOpenPaymentModal: () => void;
  onTestAsStudent: () => void;
  onLogout: () => void;
}

export default function AdminSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  pendingPaymentCount,
  onOpenPasswordModal,
  onOpenProctoringModal,
  onOpenPaymentModal,
  onTestAsStudent,
  onLogout,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const isCurrentActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin" || pathname === "/admin/dashboard";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const navGroups = [
    {
      group: "Overview",
      items: [
        {
          name: "Dashboard",
          href: "/admin",
          icon: LayoutDashboard,
          badge: null,
        },
      ],
    },
    {
      group: "Academics",
      items: [
        {
          name: "Tests & MCQs",
          href: "/admin/tests",
          icon: FileText,
          badge: null,
        },
        {
          name: "Study Materials",
          href: "/admin/study-materials",
          icon: BookOpen,
          badge: null,
        },
        {
          name: "Examination Results",
          href: "/admin/results",
          icon: BarChart3,
          badge: null,
        },
        {
          name: "Students Directory",
          href: "/admin/students",
          icon: Users,
          badge: null,
        },
      ],
    },
    {
      group: "PIE Ultra & Commerce",
      items: [
        {
          name: "Subscriptions Queue",
          href: "/admin/subscriptions",
          icon: CreditCard,
          badge: pendingPaymentCount > 0 ? pendingPaymentCount : null,
          badgeColor: "bg-red-600 text-white shadow-[0_0_8px_rgba(229,9,20,0.6)]",
        },
        {
          name: "Payment Hub",
          href: "/admin/payments",
          icon: Wallet,
          badge: null,
        },
      ],
    },
    {
      group: "Communications",
      items: [
        {
          name: "Notifications",
          href: "/admin/notifications",
          icon: Bell,
          badge: null,
        },
        {
          name: "Live Alerts Ticker",
          href: "/admin/test-alerts",
          icon: Megaphone,
          badge: null,
        },
      ],
    },
  ];

  const systemActionItems = [
    {
      name: "Security Protocols",
      action: onOpenProctoringModal,
      icon: Shield,
      accent: "text-red-400 group-hover:text-red-300",
      description: "Exam anti-cheat rules",
    },
    {
      name: "UPI & QR Settings",
      action: onOpenPaymentModal,
      icon: QrCode,
      accent: "text-emerald-400 group-hover:text-emerald-300",
      description: "Admin VPA & fee rate",
    },
    {
      name: "Admin Credentials",
      action: onOpenPasswordModal,
      icon: KeyRound,
      accent: "text-cyan-400 group-hover:text-cyan-300",
      description: "Password & username",
    },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between select-none">
      {/* Top Header / Branding */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-[#090d16]/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <PiechemLogo size="sm" isGoldMember={false} showText={!collapsed} />
            {!collapsed && (
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-950/80 text-red-400 border border-red-500/40 shadow-[0_0_10px_rgba(229,9,20,0.2)]">
                Admin
              </span>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-700/60 transition"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="px-3 py-4 space-y-6 overflow-y-auto max-h-[calc(100vh-14rem)] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {navGroups.map((grp) => (
            <div key={grp.group} className="space-y-1">
              {!collapsed && (
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {grp.group}
                </div>
              )}
              {grp.items.map((item) => {
                const active = isCurrentActive(item.href);
                const IconComponent = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    title={collapsed ? item.name : undefined}
                    className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      active
                        ? "bg-gradient-to-r from-red-950/60 via-[#1c080b] to-[#12080a] text-white border border-red-500/40 shadow-[0_0_16px_rgba(229,9,20,0.25)]"
                        : "text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent"
                    } ${collapsed ? "justify-center px-2 py-2.5" : ""}`}
                  >
                    {/* Active Accent Vertical Bar */}
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#E50914] shadow-[0_0_8px_#E50914]" />
                    )}

                    <IconComponent
                      size={18}
                      className={`shrink-0 transition-colors ${
                        active
                          ? "text-[#E50914] drop-shadow-[0_0_6px_rgba(229,9,20,0.5)]"
                          : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />

                    {!collapsed && (
                      <span className="truncate flex-1 tracking-tight">
                        {item.name}
                      </span>
                    )}

                    {item.badge !== null && (
                      <span
                        className={`text-[10px] font-black font-mono px-1.5 py-0.5 rounded-full shrink-0 ${
                          item.badgeColor || "bg-slate-700 text-white"
                        } ${collapsed ? "absolute -top-1 -right-1 text-[9px] w-4 h-4 flex items-center justify-center p-0" : ""}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* System Protocols Action Group */}
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            {!collapsed && (
              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Settings size={11} className="text-slate-400" />
                <span>System Controls</span>
              </div>
            )}
            {systemActionItems.map((act) => {
              const IconComp = act.icon;
              return (
                <button
                  key={act.name}
                  type="button"
                  onClick={() => {
                    onCloseMobile();
                    act.action();
                  }}
                  title={collapsed ? act.name : undefined}
                  className={`w-full group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800/70 hover:text-white transition text-left border border-transparent ${
                    collapsed ? "justify-center px-2 py-2.5" : ""
                  }`}
                >
                  <IconComp
                    size={18}
                    className={`shrink-0 transition-colors ${act.accent}`}
                  />
                  {!collapsed && (
                    <div className="truncate flex-1">
                      <div className="truncate tracking-tight">{act.name}</div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Footer Controls */}
      <div className="p-3 border-t border-slate-800/80 bg-[#070b12]/95 space-y-2">
        {/* Student View Quick Launcher */}
        <button
          type="button"
          onClick={() => {
            onCloseMobile();
            onTestAsStudent();
          }}
          title={collapsed ? "Preview as Student" : undefined}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/40 transition shadow-sm ${
            collapsed ? "justify-center px-2" : ""
          }`}
        >
          <GraduationCap size={16} className="text-amber-400 shrink-0" />
          {!collapsed && <span className="truncate">Student View</span>}
        </button>

        {/* Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? "Logout" : undefined}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/70 border border-red-900/50 transition ${
            collapsed ? "justify-center px-2" : ""
          }`}
        >
          <LogOut size={16} className="text-red-400 shrink-0" />
          {!collapsed && <span className="truncate">Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 bg-[#090d16] border-r border-slate-800/80 transition-all duration-200 z-30 sticky top-0 h-screen ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Off-Canvas Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#090d16] border-r border-slate-800/90 shadow-2xl h-full z-10 animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
