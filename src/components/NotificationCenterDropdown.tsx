"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Sparkles, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  Atom, 
  BookOpen, 
  X, 
  ChevronRight, 
  Crown, 
  CheckCircle2, 
  AlertCircle,
  Flame,
  ArrowRight,
  Megaphone,
  Layers,
  GraduationCap,
  ExternalLink,
  RefreshCw
} from "lucide-react";

export type NotificationCategory = 
  | "all" 
  | "payments" 
  | "ultra" 
  | "materials" 
  | "exams" 
  | "announcements" 
  | "system";

export interface NotificationMetadata {
  amount?: string | number;
  txnId?: string;
  board?: string;
  classSem?: string;
  expiresAt?: string;
  [key: string]: unknown;
}

export interface DbNotification {
  id: string;
  studentId: string;
  type: string;
  category: "payments" | "ultra" | "materials" | "exams" | "announcements" | "system";
  title: string;
  message: string;
  metadata?: NotificationMetadata | null;
  actionLabel?: string | null;
  actionUrl?: string | null;
  priority?: boolean;
  readAt?: string | Date | null;
  eventKey?: string | null;
  createdAt: string | Date;
  expiresAt?: string | Date | null;
}

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

const CATEGORY_TABS: { id: NotificationCategory; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All", icon: Layers },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "ultra", label: "PIE Ultra", icon: Crown },
  { id: "materials", label: "Study Materials", icon: BookOpen },
  { id: "exams", label: "Exams", icon: Flame },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "system", label: "System", icon: ShieldCheck },
];

// Format relative timestamp
function formatTimeAgo(dateStr: string | Date) {
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function NotificationCenterDropdown({ student, upgradeReq }: NotificationCenterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationCategory>("all");
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const autoReadTimerRef = useRef<NodeJS.Timeout | null>(null);

  const studentId = student?.id;

  // 1. Fetch notifications from backend API
  const fetchNotifications = useCallback(async (cat: NotificationCategory = activeTab) => {
    if (!studentId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/student/notifications?category=${cat}&limit=30`, {
        cache: "no-store"
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(Number(data.unreadCount) || 0);
        setCategoryCounts(data.categoryCounts || {});
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [studentId, activeTab]);

  // Initial fetch & initial unread count
  useEffect(() => {
    let active = true;
    if (studentId) {
      fetch(`/api/student/notifications?category=all&limit=30`, { cache: "no-store" })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!active || !data) return;
          setNotifications(data.notifications || []);
          setUnreadCount(Number(data.unreadCount) || 0);
          setCategoryCounts(data.categoryCounts || {});
        })
        .catch(err => console.error("Failed to load notifications:", err));
    }
    return () => { active = false; };
  }, [studentId]);

  // Periodic background check every 60 seconds when panel is closed
  useEffect(() => {
    if (!studentId || isOpen) return;
    const interval = setInterval(() => {
      fetch(`/api/student/notifications?category=all&limit=1`, { cache: "no-store" })
        .then(r => r.json())
        .then(d => {
          if (typeof d.unreadCount === "number") {
            setUnreadCount(d.unreadCount);
          }
        })
        .catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [studentId, isOpen]);

  const notificationsRef = useRef(notifications);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // 2. AUTOMATIC READ TRACKING ON PANEL OPENING:
  // "Whenever a user opens the notification panel, automatically mark all currently unread notifications belonging to that user as read."
  const markAllAsReadBackend = useCallback(async () => {
    if (!studentId) return;
    const currentList = notificationsRef.current;
    const visibleUnreadIds = currentList.filter(n => !n.readAt).map(n => n.id);
    if (visibleUnreadIds.length === 0 && unreadCount === 0) return;

    try {
      setIsMarkingRead(true);
      // Optimistic update immediately in the UI
      setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
      setUnreadCount(0);

      const res = await fetch(`/api/student/notifications/read-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationIds: visibleUnreadIds.length > 0 ? visibleUnreadIds : undefined
        })
      });
      if (res.ok) {
        setCategoryCounts(prev => ({ ...prev }));
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setIsMarkingRead(false);
    }
  }, [studentId, unreadCount]);

  // Handle panel open toggle
  const handleTogglePanel = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState) {
      // Panel just opened: fetch fresh list and automatically mark unread as read
      fetchNotifications(activeTab);
      
      // Delay mark-as-read by 500ms so the user sees their unread items fade into read state smoothly
      if (autoReadTimerRef.current) clearTimeout(autoReadTimerRef.current);
      autoReadTimerRef.current = setTimeout(() => {
        markAllAsReadBackend();
      }, 600);
    } else {
      setShowConfirmClear(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowConfirmClear(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (autoReadTimerRef.current) clearTimeout(autoReadTimerRef.current);
    };
  }, [isOpen]);

  // Switch category tabs
  const handleTabChange = (cat: NotificationCategory) => {
    setActiveTab(cat);
    fetchNotifications(cat);
  };

  // Delete all notifications
  const handleClearAll = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/student/notifications`, { method: "DELETE" });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
        setCategoryCounts({ all: 0, payments: 0, ultra: 0, materials: 0, exams: 0, announcements: 0, system: 0 });
        setShowConfirmClear(false);
      }
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete a single notification
  const handleDeleteSingle = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await fetch(`/api/student/notifications?id=${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  // Mark single as read
  const handleMarkSingleRead = async (id: string) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
      await fetch(`/api/student/notifications/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id })
      });
    } catch (err) {
      console.error("Failed to mark single read:", err);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* ============================================================ */}
      {/* 1. BELL TRIGGER BUTTON WITH GLOWING NETFLIX RED UNREAD BADGE */}
      {/* ============================================================ */}
      <button
        onClick={handleTogglePanel}
        aria-label="View notifications"
        aria-expanded={isOpen}
        className={`relative p-2 sm:p-2.5 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 ${
          isOpen
            ? "bg-red-950/40 border-red-500/60 text-white shadow-[0_0_20px_rgba(229,9,20,0.35)]"
            : unreadCount > 0
            ? "bg-white/[0.04] hover:bg-white/[0.08] border-red-500/40 hover:border-red-500 text-white shadow-[0_0_12px_rgba(229,9,20,0.25)]"
            : "bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/20 text-slate-300 hover:text-white"
        }`}
      >
        <Bell className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${isOpen ? "rotate-12 text-red-400" : ""}`} />
        
        {/* Glowing Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 border border-black text-white text-[10px] font-black tracking-tight flex items-center justify-center shadow-[0_0_10px_#e50914] animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ============================================================ */}
      {/* 2. NETFLIX-INSPIRED CINEMATIC FLOATING NOTIFICATION PANEL    */}
      {/* ============================================================ */}
      {isOpen && (
        <div 
          className="fixed inset-x-2 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-3 z-[100] w-auto sm:w-[460px] md:w-[490px] max-h-[85vh] sm:max-h-[80vh] flex flex-col rounded-3xl bg-[#07070a]/98 backdrop-blur-3xl border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.95)] animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
          role="region"
          aria-label="Notification Center"
        >
          {/* Subtle Top Red Cinematic Gradient Bar */}
          <div className="h-1 w-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shrink-0" />

          {/* PANEL HEADER */}
          <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-black/40 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-950/70 border border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(229,9,20,0.3)]">
                  <Crown className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white font-serif tracking-tight">
                      Notifications
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-slate-300 font-semibold">
                      PIE Ultra
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-light">
                    {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "All updates are up to date"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 sm:gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsReadBackend}
                    disabled={isMarkingRead}
                    title="Mark all as read"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] font-semibold text-slate-300 hover:text-white transition-all disabled:opacity-50"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Mark read</span>
                  </button>
                )}

                {notifications.length > 0 && (
                  <button
                    onClick={() => setShowConfirmClear(true)}
                    title="Clear notifications"
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-red-950/60 border border-white/10 hover:border-red-500/50 text-slate-400 hover:text-red-300 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all sm:hidden"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Clear All Confirmation Confirmation Modal Banner */}
            {showConfirmClear && (
              <div className="p-3 rounded-2xl bg-red-950/90 border border-red-500/50 text-white space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-200 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    Clear all notifications?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearAll}
                      disabled={isDeleting}
                      className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold shadow transition-all disabled:opacity-50"
                    >
                      {isDeleting ? "Clearing..." : "Yes, Clear"}
                    </button>
                    <button
                      onClick={() => setShowConfirmClear(false)}
                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORY FILTER TABS (SCROLLABLE PILLS) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-[11px] font-medium">
              {CATEGORY_TABS.map(tab => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                const count = categoryCounts[tab.id] || 0;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-200 shrink-0 ${
                      isActive
                        ? "bg-red-600 text-white font-bold shadow-[0_0_14px_rgba(229,9,20,0.5)] border border-red-400"
                        : "bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06]"
                    }`}
                  >
                    <TabIcon className={`w-3 h-3 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{tab.label}</span>
                    {count > 0 && tab.id !== "all" && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? "bg-black/40 text-white" : "bg-white/10 text-slate-400"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* NOTIFICATION FEED (SCROLLABLE LIST) */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar divide-y divide-white/[0.04]">
            {loading ? (
              // SKELETON LOADERS
              <div className="space-y-3 py-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2.5 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-28 bg-white/10 rounded" />
                      <div className="h-3 w-16 bg-white/10 rounded" />
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded" />
                    <div className="h-3 w-3/4 bg-white/5 rounded" />
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              // EMPTY STATE
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-500">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400/80" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    You&apos;re all caught up
                  </h3>
                  <p className="text-xs text-slate-400 font-light max-w-xs mx-auto leading-relaxed">
                    No notifications in this category. We&apos;ll alert you the moment new study resources, exam schedules, or verified payments arrive.
                  </p>
                </div>
                <button
                  onClick={() => fetchNotifications(activeTab)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all"
                >
                  <RefreshCw className="w-3 h-3 text-cyan-400" />
                  <span>Refresh Feed</span>
                </button>
              </div>
            ) : (
              // NOTIFICATION CARDS
              notifications.map((item) => {
                const isUnread = !item.readAt;
                const isUltraCard = item.category === "ultra" || item.type.includes("ultra");
                const isPaymentCard = item.category === "payments" || item.type.includes("payment");
                const isMaterialCard = item.category === "materials" || item.type.includes("content");
                const isExamCard = item.category === "exams" || item.type.includes("exam");

                return (
                  <div
                    key={item.id}
                    onClick={() => isUnread && handleMarkSingleRead(item.id)}
                    className={`group relative p-4 rounded-2xl transition-all duration-300 border ${
                      isUltraCard
                        ? "bg-gradient-to-br from-red-950/30 via-[#0a0b10] to-[#07070a] border-red-600/35 hover:border-red-500/70 shadow-[0_4px_25px_rgba(229,9,20,0.12)]"
                        : isPaymentCard
                        ? "bg-gradient-to-br from-emerald-950/20 via-[#0a0b10] to-[#07070a] border-emerald-500/30 hover:border-emerald-400/60"
                        : isMaterialCard
                        ? "bg-gradient-to-br from-cyan-950/20 via-[#0a0b10] to-[#07070a] border-cyan-500/25 hover:border-cyan-400/50"
                        : isExamCard
                        ? "bg-gradient-to-br from-amber-950/20 via-[#0a0b10] to-[#07070a] border-amber-500/25 hover:border-amber-400/50"
                        : "bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.06] hover:border-white/20"
                    } ${isUnread ? "ring-1 ring-white/15" : "opacity-90"}`}
                  >
                    {/* Header Row: Category Pill, Timestamp & Delete Button */}
                    <div className="flex items-center justify-between gap-2 pb-2">
                      <div className="flex items-center gap-2">
                        {/* Status Icon */}
                        <div className={`p-1.5 rounded-lg border ${
                          isUltraCard
                            ? "bg-red-950 text-red-400 border-red-500/40"
                            : isPaymentCard
                            ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                            : isMaterialCard
                            ? "bg-cyan-950 text-cyan-400 border-cyan-500/40"
                            : isExamCard
                            ? "bg-amber-950 text-amber-400 border-amber-500/40"
                            : "bg-slate-900 text-slate-400 border-white/10"
                        }`}>
                          {isUltraCard ? (
                            <Crown className="w-3.5 h-3.5" />
                          ) : isPaymentCard ? (
                            <CreditCard className="w-3.5 h-3.5" />
                          ) : isMaterialCard ? (
                            <BookOpen className="w-3.5 h-3.5" />
                          ) : isExamCard ? (
                            <Flame className="w-3.5 h-3.5" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                        </div>

                        {/* Category Label */}
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-300">
                          {item.category === "ultra" ? "PIE ULTRA VIP" : item.category}
                        </span>

                        {/* Unread Glow Dot */}
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#e50914]" title="Unread" />
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatTimeAgo(item.createdAt)}
                        </span>

                        {/* Delete Single Button */}
                        <button
                          onClick={(e) => handleDeleteSingle(e, item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-slate-400 hover:text-red-400 transition-all"
                          title="Dismiss notification"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Notification Title */}
                    <h4 className="text-sm font-bold text-white leading-snug group-hover:text-red-200 transition-colors">
                      {item.title}
                    </h4>

                    {/* Notification Message */}
                    <p className="text-xs text-slate-300/90 font-light mt-1 leading-relaxed">
                      {item.message}
                    </p>

                    {/* Contextual Metadata Badges (if present) */}
                    {item.metadata && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {item.metadata.amount && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                            ₹{item.metadata.amount}
                          </span>
                        )}
                        {item.metadata.txnId && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                            Ref: {item.metadata.txnId}
                          </span>
                        )}
                        {item.metadata.board && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-bold">
                            {item.metadata.board}
                          </span>
                        )}
                        {item.metadata.classSem && item.metadata.classSem !== "ALL" && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                            {item.metadata.classSem}
                          </span>
                        )}
                        {item.metadata.expiresAt && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-500/30">
                            Valid: {item.metadata.expiresAt}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Contextual CTA Action Button */}
                    {item.actionLabel && item.actionUrl && (
                      <div className="pt-3 mt-2 border-t border-white/[0.06] flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">
                          {isUltraCard ? "VIP Status Active" : isPaymentCard ? "Payment Verified" : "Direct Link"}
                        </span>
                        
                        <Link
                          href={item.actionUrl}
                          onClick={() => setIsOpen(false)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                            isUltraCard
                              ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]"
                              : isPaymentCard
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                              : isMaterialCard
                              ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                              : isExamCard
                              ? "bg-amber-600 hover:bg-amber-500 text-black font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                              : "bg-white/10 hover:bg-white/20 text-white"
                          }`}
                        >
                          <span>{item.actionLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* PANEL FOOTER */}
          <div className="p-3 sm:p-3.5 border-t border-white/[0.08] bg-black/60 shrink-0 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Sync Active
            </span>
            <Link 
              href="/dashboard/account" 
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <span>Manage Membership</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
