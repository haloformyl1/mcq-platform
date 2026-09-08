"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface StudentProps {
  id: string;
  name?: string | null;
  email?: string | null;
  subscriptionStatus?: string | null;
  subscriptionExpiresAt?: string | Date | null;
  subscriptionStartedAt?: string | Date | null;
}

interface UpgradeReqProps {
  id?: string;
  status?: string;
  utrNumber?: string | null;
  createdAt?: string | Date | null;
  approvedAt?: string | Date | null;
}

interface NotificationCenterDropdownProps {
  student?: StudentProps | null;
  upgradeReq?: UpgradeReqProps | null;
}

export interface NotificationItem {
  id: string;
  type: "gold_activated" | "payment_pending" | "upgrade_promo" | "welcome";
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  time: string;
  actionText?: string;
  actionHref?: string;
}

export default function NotificationCenterDropdown({ student, upgradeReq }: NotificationCenterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const isGold = student?.subscriptionStatus === "PAID";
  const isPending = !isGold && upgradeReq?.status === "PENDING";

  // Build notifications
  const notifications: NotificationItem[] = [];

  if (isGold) {
    const validUntilStr = student?.subscriptionExpiresAt
      ? new Date(student.subscriptionExpiresAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "30 Days";

    const approvedDateStr = student?.subscriptionStartedAt
      ? new Date(student.subscriptionStartedAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Recently approved";

    notifications.push({
      id: "gold_active_" + (student?.id || "user") + "_" + (student?.subscriptionExpiresAt || "active"),
      type: "gold_activated",
      title: "🎉 Gold Membership Activated!",
      description: "Payment verified by Admin Arghyadeep Roy. Your 30-Day All-Access Pass is active until " + validUntilStr + ". All 50+ Chemistry Exams unlocked.",
      badge: "ACTIVE",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      time: approvedDateStr,
      actionText: "Practice Exams →",
      actionHref: "/dashboard",
    });
  } else if (isPending) {
    notifications.push({
      id: "pending_" + (upgradeReq?.id || "req"),
      type: "payment_pending",
      title: "⏳ Payment Verification In Progress",
      description: "UTR Ref: " + (upgradeReq?.utrNumber || "Submitted") + ". Admin Arghyadeep Roy is verifying your payment. Usually takes ~15-30 minutes.",
      badge: "IN REVIEW",
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      time: "Awaiting approval",
      actionText: "Helpline: 9830507435",
      actionHref: "tel:9830507435",
    });
  } else {
    notifications.push({
      id: "promo_upgrade",
      type: "upgrade_promo",
      title: "⭐ Upgrade to Gold Membership",
      description: "Unlock all 50+ premium chemistry test modules, complete solutions, and 3D molecular models.",
      badge: "30-DAY PASS",
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      time: "Limited Offer",
      actionText: "View Plans →",
      actionHref: "/dashboard/account",
    });
  }

  // Common welcome notification
  notifications.push({
    id: "welcome_platform",
    type: "welcome",
    title: "👋 Welcome to PIECHEM",
    description: "Prepare for competitive chemistry exams with real-time timed test papers and detailed scoring.",
    badge: "SYSTEM",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    time: "Platform",
  });

  // Check unread state from localStorage
  useEffect(() => {
    if (!student?.id || notifications.length === 0) return;

    const topNotificationId = notifications[0]?.id;
    const readStorageKey = "piechem_last_read_notif_" + student.id;
    const lastRead = localStorage.getItem(readStorageKey);

    if (!lastRead || lastRead !== topNotificationId) {
      setHasUnread(true);
    } else {
      setHasUnread(false);
    }
  }, [student?.id, notifications]);

  // Handle click outside to close
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

  const markAllAsRead = () => {
    if (student?.id && notifications[0]?.id) {
      localStorage.setItem("piechem_last_read_notif_" + student.id, notifications[0].id);
    }
    setHasUnread(false);
  };

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      markAllAsRead();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        aria-label="Notification Center"
        aria-expanded={isOpen}
        className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Red Unread Notification Dot */}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-[#030712]" />
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-[#091322]/95 backdrop-blur-xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-50 p-4 animate-in fade-in zoom-in-95 duration-200"
          role="region"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-sm">🔔 Notifications</span>
              {hasUnread && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
                  New
                </span>
              )}
            </div>
            <button
              onClick={markAllAsRead}
              className="text-[11px] text-slate-400 hover:text-amber-400 transition-colors"
            >
              Mark all as read
            </button>
          </div>

          {/* List of Notification Cards */}
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={"p-3 rounded-xl border transition-all " + (
                  notif.type === "gold_activated"
                    ? "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30 hover:border-amber-500/50"
                    : notif.type === "payment_pending"
                    ? "bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20 hover:border-amber-500/40"
                    : "bg-white/[0.03] border-white/10 hover:border-white/20"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-white tracking-tight">
                    {notif.title}
                  </span>
                  <span className={"text-[9px] font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wider " + notif.badgeColor}>
                    {notif.badge}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                  {notif.description}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                  <span>{notif.time}</span>
                  {notif.actionText && notif.actionHref && (
                    <Link
                      href={notif.actionHref}
                      onClick={() => setIsOpen(false)}
                      className="font-bold text-amber-400 hover:text-amber-300 hover:underline"
                    >
                      {notif.actionText}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Helpline Note */}
          <div className="mt-3 pt-2.5 border-t border-white/10 text-center">
            <p className="text-[10px] text-slate-400">
              Payment issues? Contact Admin Arghyadeep Roy:{" "}
              <a href="tel:9830507435" className="text-amber-400 font-bold hover:underline">
                9830507435
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
