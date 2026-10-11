"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { 
  Bell, 
  BellRing, 
  CheckCheck, 
  Trash2, 
  Sparkles, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  Atom, 
  BookOpen, 
  ExternalLink, 
  X, 
  ChevronRight, 
  Crown, 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  AlertCircle,
  Flame,
  ArrowRight
} from "lucide-react";

interface StudentProps {
  id: string;
  name?: string | null;
  email?: string | null;
  subscriptionStatus?: string | null;
  isComplimentary?: boolean | null;
  subscriptionExpiresAt?: string | Date | null;
  subscriptionStartedAt?: string | Date | null;
  board?: string | null;
  academicLevel?: string | null;
}

interface UpgradeReqProps {
  id?: string;
  status?: string;
  amount?: number | null;
  note?: string | null;
  planName?: string | null;
  utrNumber?: string | null;
  createdAt?: string | Date | null;
  approvedAt?: string | Date | null;
}

interface NotificationCenterDropdownProps {
  student?: StudentProps | null;
  upgradeReq?: UpgradeReqProps | null;
}

export type NotificationCategory = "all" | "billing" | "exams" | "system";

export interface NotificationItem {
  id: string;
  category: "billing" | "exams" | "system";
  type: "payment_pending" | "ultra_active" | "pro_active" | "complimentary_active" | "upgrade_promo" | "exam_live" | "security" | "welcome";
  title: string;
  description: string;
  badge: string;
  badgeVariant: "red" | "blue" | "emerald" | "amber" | "slate";
  timeLabel: string;
  timestamp: number;
  actionText?: string;
  actionHref?: string;
  actionIsEvent?: boolean;
  priority?: boolean;
}

export default function NotificationCenterDropdown({ student, upgradeReq }: NotificationCenterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>("all");
  const [readIds, setReadIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const studentId = student?.id || "guest";
  const isComp = Boolean(student?.isComplimentary || student?.subscriptionStatus === "COMPLIMENTARY");
  const isPaid = student?.subscriptionStatus === "PAID";
  const hasActiveAccess = isComp || isPaid;

  // Resolve active plan tier ('ultra' vs 'pro' vs 'basic')
  const activePlanTier = useMemo((): "ultra" | "pro" | "basic" => {
    if (!hasActiveAccess) return "basic";
    const reqNote = (upgradeReq?.note || "").toLowerCase();
    const reqAmount = Number(upgradeReq?.amount) || 0;
    if (reqNote.includes("ultra") || reqAmount === 499 || reqAmount === 200) {
      return "ultra";
    }
    return "pro";
  }, [hasActiveAccess, upgradeReq]);

  // Load read and dismissed IDs from localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !studentId) return;
    try {
      const savedRead = localStorage.getItem(`piechem_read_notifs_${studentId}`);
      if (savedRead) setReadIds(JSON.parse(savedRead));
      const savedDismissed = localStorage.getItem(`piechem_dismissed_notifs_${studentId}`);
      if (savedDismissed) setDismissedIds(JSON.parse(savedDismissed));
    } catch {}
  }, [studentId]);

  // Sync read states to localStorage
  const persistReadIds = (newIds: string[]) => {
    setReadIds(newIds);
    try {
      localStorage.setItem(`piechem_read_notifs_${studentId}`, JSON.stringify(newIds));
    } catch {}
  };

  // Sync dismissed states to localStorage
  const persistDismissedIds = (newIds: string[]) => {
    setDismissedIds(newIds);
    try {
      localStorage.setItem(`piechem_dismissed_notifs_${studentId}`, JSON.stringify(newIds));
    } catch {}
  };

  // Build raw list of notifications
  const rawNotifications = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];
    const now = Date.now();

    // 1. Payment Verification Pending Notification (Highest Priority)
    if (upgradeReq?.status === "PENDING") {
      const isUltraReq = (upgradeReq.note || "").toLowerCase().includes("ultra") || upgradeReq.amount === 200 || upgradeReq.amount === 499;
      const targetPlan = isUltraReq ? "PIE Ultra" : "PIE Pro";
      const amtDisplay = upgradeReq.amount ? `₹${upgradeReq.amount}` : "payment";
      const createdTime = upgradeReq.createdAt ? new Date(upgradeReq.createdAt).getTime() : now;

      list.push({
        id: `pending_${upgradeReq.id || "current"}`,
        category: "billing",
        type: "payment_pending",
        title: `Payment Verification In Progress`,
        description: `Your ${amtDisplay} payment for ${targetPlan} (Ref: ${upgradeReq.utrNumber || "Submitted"}) is awaiting admin verification. Approval usually takes 15–30 minutes.`,
        badge: "IN REVIEW",
        badgeVariant: "amber",
        timeLabel: "Reviewing now",
        timestamp: createdTime,
        actionText: "Track Order & Status",
        actionHref: "/dashboard/account",
        priority: true
      });
    }

    // 2. Active Plan Notifications
    if (hasActiveAccess) {
      const validUntilStr = student?.subscriptionExpiresAt
        ? new Date(student.subscriptionExpiresAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Lifetime";

      if (activePlanTier === "ultra") {
        list.push({
          id: `ultra_active_${student?.id}_${student?.subscriptionExpiresAt || "active"}`,
          category: "billing",
          type: "ultra_active",
          title: "PIE Ultra All-Access Pass Active",
          description: `You have full VIP access to unlimited Chemistry Exams, unlimited PIE AI Tutor queries, full 3D molecular models & PIE LAB simulations valid until ${validUntilStr}.`,
          badge: "ULTRA PASS",
          badgeVariant: "red",
          timeLabel: "Active Membership",
          timestamp: now - 3600000,
          actionText: "View Celebration 🎉",
          actionHref: "#celebrate",
          actionIsEvent: true,
          priority: true
        });
      } else if (isComp) {
        list.push({
          id: `comp_active_${student?.id}`,
          category: "billing",
          type: "complimentary_active",
          title: "💎 Lifetime PIE Pro Access Active",
          description: "Administrator Arghyadeep Roy has granted you complimentary PIE Pro access for infinite time! You can upgrade to PIE Ultra for just ₹200 (30 Days) anytime.",
          badge: "COMPLIMENTARY",
          badgeVariant: "blue",
          timeLabel: "Never Expires",
          timestamp: now - 7200000,
          actionText: "Upgrade to Ultra (₹200) →",
          actionHref: "/dashboard/account?tab=change-plan",
          priority: true
        });
      } else {
        list.push({
          id: `pro_active_${student?.id}_${student?.subscriptionExpiresAt || "active"}`,
          category: "billing",
          type: "pro_active",
          title: "PIE Pro Membership Active",
          description: `Your 30-day PIE Pro subscription is active until ${validUntilStr}. Enjoy 20 AI queries/day, 5 downloads/day & proctored national rankings.`,
          badge: "ACTIVE PRO",
          badgeVariant: "blue",
          timeLabel: "30-Day Cycle",
          timestamp: now - 7200000,
          actionText: "Upgrade to Ultra (₹200) →",
          actionHref: "/dashboard/account?tab=change-plan",
        });
      }
    } else if (upgradeReq?.status !== "PENDING") {
      // Free student upgrade promotional banner
      list.push({
        id: "upgrade_promo_basic",
        category: "billing",
        type: "upgrade_promo",
        title: "⚡ Upgrade to PIE Pro or PIE Ultra",
        description: "Unlock all 50+ Chemistry Exam series, instant step-by-step 3D solutions, PIE AI tutor, and proctored national percentiles.",
        badge: "SPECIAL ACCESS",
        badgeVariant: "red",
        timeLabel: "Limited Access",
        timestamp: now - 14400000,
        actionText: "Explore Plans & Upgrade →",
        actionHref: "/dashboard/account?tab=change-plan",
      });
    }

    // 3. Academic & Test Series Notification
    list.push({
      id: "academic_exam_ready",
      category: "exams",
      type: "exam_live",
      title: "Chemistry Exam Series Live",
      description: "Timed chapter tests, full-syllabus mock papers for CBSE, WBCHSE, NEET & JEE are open for practice with automated national scoring.",
      badge: "EXAM SERIES",
      badgeVariant: "emerald",
      timeLabel: "Updated Today",
      timestamp: now - 86400000,
      actionText: "Open Exam Tests →",
      actionHref: "/dashboard",
    });

    // 4. Security & Device Session
    list.push({
      id: "system_security_check",
      category: "system",
      type: "security",
      title: "Active Device Session Verified",
      description: "Anti-cheating exam integrity and Single-Sign-On safeguards are active for your student profile.",
      badge: "VERIFIED",
      badgeVariant: "slate",
      timeLabel: "Protected",
      timestamp: now - 172800000,
      actionText: "Security Settings",
      actionHref: "/dashboard/account?tab=security",
    });

    // 5. Platform Welcome
    list.push({
      id: "platform_welcome_v2",
      category: "system",
      type: "welcome",
      title: "Welcome to PIECHEM",
      description: "An initiative by Arghyadeep Roy. Master molecular concepts, practice competitive exams, and review high-yield chemistry vaults.",
      badge: "PLATFORM",
      badgeVariant: "slate",
      timeLabel: "Official",
      timestamp: now - 604800000,
      actionText: "Explore Chemistry Vault",
      actionHref: "/dashboard",
    });

    return list;
  }, [student, upgradeReq, hasActiveAccess, isComp, activePlanTier]);

  // Filter out dismissed notifications
  const visibleNotifications = useMemo(() => {
    return rawNotifications.filter(n => !dismissedIds.includes(n.id));
  }, [rawNotifications, dismissedIds]);

  // Categorized notifications
  const filteredNotifications = useMemo(() => {
    if (activeCategory === "all") return visibleNotifications;
    return visibleNotifications.filter(n => n.category === activeCategory);
  }, [visibleNotifications, activeCategory]);

  // Count unread
  const unreadCount = useMemo(() => {
    return visibleNotifications.filter(n => !readIds.includes(n.id)).length;
  }, [visibleNotifications, readIds]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const markAllAsRead = () => {
    const allIds = visibleNotifications.map(n => n.id);
    persistReadIds(Array.from(new Set([...readIds, ...allIds])));
  };

  const markSingleAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      persistReadIds([...readIds, id]);
    }
  };

  const dismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    persistDismissedIds([...dismissedIds, id]);
  };

  const clearAllNotifications = () => {
    const allIds = rawNotifications.map(n => n.id);
    persistDismissedIds(Array.from(new Set([...dismissedIds, ...allIds])));
  };

  const getBadgeStyle = (variant: string) => {
    switch (variant) {
      case "red":
        return "bg-gradient-to-r from-red-600/25 to-rose-900/30 text-red-300 border-red-500/40 shadow-[0_0_12px_rgba(229,9,20,0.25)]";
      case "blue":
        return "bg-gradient-to-r from-blue-600/25 to-cyan-900/30 text-blue-300 border-blue-500/40 shadow-[0_0_12px_rgba(37,99,235,0.25)]";
      case "emerald":
        return "bg-gradient-to-r from-emerald-600/25 to-teal-900/30 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]";
      case "amber":
        return "bg-gradient-to-r from-amber-600/25 to-yellow-900/30 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]";
      default:
        return "bg-slate-800/60 text-slate-300 border-slate-700/60";
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "payment_pending":
        return (
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 via-amber-900/40 to-[#0e0c05] border border-amber-500/50 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.35)]">
            <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
        );
      case "ultra_active":
        return (
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-[#3d060a] to-[#120204] border border-red-500/60 flex items-center justify-center shrink-0 shadow-[0_0_22px_rgba(229,9,20,0.5)]">
            <Crown className="w-5 h-5 text-red-200 fill-red-500/30" />
          </div>
        );
      case "pro_active":
      case "complimentary_active":
        return (
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-[#071d49] to-[#040e22] border border-blue-500/60 flex items-center justify-center shrink-0 shadow-[0_0_22px_rgba(37,99,235,0.4)]">
            <Sparkles className="w-5 h-5 text-blue-300" />
          </div>
        );
      case "upgrade_promo":
        return (
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 via-slate-900 to-black border border-red-500/30 flex items-center justify-center shrink-0 shadow-sm">
            <Flame className="w-5 h-5 text-red-400" />
          </div>
        );
      case "exam_live":
        return (
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/25 via-[#062419] to-[#03100a] border border-emerald-500/50 flex items-center justify-center shrink-0 shadow-[0_0_18px_rgba(16,185,129,0.3)]">
            <Atom className="w-5 h-5 text-emerald-400" />
          </div>
        );
      case "security":
        return (
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700/30 via-slate-900 to-black border border-slate-700/50 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-slate-300" />
          </div>
        );
      default:
        return (
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-slate-300" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Netflix Cinematic Trigger Button */}
      <button
        onClick={handleToggle}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className={"relative p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-center outline-none cursor-pointer group " + (
          isOpen 
            ? "bg-white/15 border-white/30 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)]" 
            : "bg-[#0b101b]/90 hover:bg-[#141b2d] border-white/10 hover:border-white/25 text-slate-300 hover:text-white"
        )}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-slate-200 group-hover:text-white transition-transform group-hover:rotate-12 duration-200" />
        ) : (
          <Bell className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
        )}

        {/* Netflix Red Unread Counter Pill */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-gradient-to-r from-red-600 to-[#e50914] text-white text-[10px] font-black border border-white/30 shadow-[0_0_14px_rgba(229,9,20,0.8)] animate-in zoom-in-75 duration-200">
            {unreadCount > 9 ? "9+" : unreadCount}
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-full mt-2 sm:w-[440px] max-w-[calc(100vw-1rem)] rounded-3xl bg-gradient-to-b from-[#0e1422]/98 via-[#080c16]/98 to-[#03060c]/99 backdrop-blur-3xl border border-white/15 shadow-[0_35px_100px_rgba(0,0,0,0.95)] z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col ring-1 ring-white/10"
          role="region"
          aria-label="Notification Center"
        >
          {/* Top Notch Pointer (Desktop) */}
          <div className="hidden sm:block absolute -top-2 right-4 w-4 h-4 bg-[#0e1422] border-t border-l border-white/15 rotate-45 z-10" />

          {/* Header */}
          <div className="relative px-5 pt-4 pb-3 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_12px_#e50914] animate-pulse" />
                <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-600/30 text-red-300 border border-red-500/40 shadow-sm">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Read all</span>
                  </button>
                )}
                {visibleNotifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    title="Clear all notifications"
                    className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              {(["all", "billing", "exams", "system"] as NotificationCategory[]).map((tab) => {
                const count = tab === "all" 
                  ? visibleNotifications.length 
                  : visibleNotifications.filter(n => n.category === tab).length;
                const isActive = activeCategory === tab;
                const labels: Record<NotificationCategory, string> = {
                  all: "All",
                  billing: "Plans & Billing",
                  exams: "Exams",
                  system: "System"
                };

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveCategory(tab)}
                    className={"px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 " + (
                      isActive 
                        ? "bg-white text-slate-950 shadow-md font-extrabold" 
                        : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5"
                    )}
                  >
                    <span>{labels[tab]}</span>
                    {count > 0 && (
                      <span className={"text-[10px] px-1.5 py-0.2 rounded-full " + (
                        isActive ? "bg-slate-900 text-white" : "bg-white/10 text-slate-300"
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notification Cards List */}
          <div className="p-3 space-y-2.5 max-h-[440px] overflow-y-auto overscroll-contain pr-2 custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">You're all caught up!</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    No active notifications in this category. We will alert you whenever your tests, payments, or perks update.
                  </p>
                </div>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isRead = readIds.includes(notif.id);

                return (
                  <div
                    key={notif.id}
                    onClick={() => markSingleAsRead(notif.id)}
                    className={"group relative rounded-2xl p-4 border transition-all duration-200 cursor-pointer backdrop-blur-md " + (
                      !isRead 
                        ? "bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/20 shadow-[0_6px_25px_rgba(0,0,0,0.5)] hover:border-white/35 hover:-translate-y-0.5" 
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/15 opacity-80 hover:opacity-100"
                    )}
                  >
                    {/* Unread Glow Indicator */}
                    {!isRead && (
                      <div className="absolute top-4 right-4 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse" />
                      </div>
                    )}

                    {/* Card Content Row */}
                    <div className="flex items-start gap-3.5">
                      {/* Avatar / Poster */}
                      {getIconForType(notif.type)}

                      {/* Info & Copy */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={"text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider " + getBadgeStyle(notif.badgeVariant)}>
                            {notif.badge}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {notif.timeLabel}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white tracking-tight leading-snug mb-1">
                          {notif.title}
                        </h4>

                        <p className="text-[11px] text-slate-300 leading-relaxed font-normal mb-3">
                          {notif.description}
                        </p>

                        {/* Interactive CTAs */}
                        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-white/5">
                          {notif.actionText && (
                            notif.actionIsEvent ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsOpen(false);
                                  window.dispatchEvent(new CustomEvent("piechem:show-celebration"));
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 hover:brightness-110 text-white text-[11px] font-bold shadow-md transition cursor-pointer"
                              >
                                <span>{notif.actionText}</span>
                              </button>
                            ) : (
                              <Link
                                href={notif.actionHref || "#"}
                                onClick={() => setIsOpen(false)}
                                className={"inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition shadow-sm " + (
                                  notif.type === "ultra_active" || notif.type === "upgrade_promo"
                                    ? "bg-gradient-to-r from-red-600 to-rose-700 hover:brightness-110 text-white"
                                    : notif.type === "pro_active" || notif.type === "complimentary_active"
                                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110 text-white"
                                    : notif.type === "payment_pending"
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                                    : "bg-white/10 hover:bg-white/20 text-white"
                                )}
                              >
                                <span>{notif.actionText}</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            )
                          )}

                          {notif.type === "payment_pending" && (
                            <div className="flex items-center gap-1.5">
                              <a
                                href="https://wa.me/919830507435?text=Hello%20Arghyadeep%2C%20I%20have%20submitted%20my%20payment%20verification."
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition text-[11px] flex items-center gap-1"
                                title="WhatsApp Admin"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span className="text-[10px] font-bold">WhatsApp</span>
                              </a>
                              <a
                                href="tel:9830507435"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 transition text-[11px] flex items-center gap-1"
                                title="Call Admin"
                              >
                                <Phone className="w-3 h-3" />
                                <span className="text-[10px] font-bold">Call</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Dismiss Cross */}
                      <button
                        onClick={(e) => dismissNotification(notif.id, e)}
                        title="Dismiss notification"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-all absolute top-2 right-2 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* VIP Concierge Footer */}
          <div className="px-5 py-3.5 bg-[#060912]/95 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
              <span>Admin Helpline:</span>
              <a href="tel:9830507435" className="text-white font-mono font-bold hover:text-amber-400 transition">
                9830507435
              </a>
            </div>
            <a
              href="https://wa.me/919830507435"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
            >
              <MessageCircle className="w-3 h-3" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
