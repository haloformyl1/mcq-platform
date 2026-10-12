"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  Megaphone,
  Send,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  CreditCard,
  Crown,
  Layers,
  BookOpen,
  Flame,
  Check,
  X,
  RefreshCw,
  Eye,
  Sliders,
  Filter
} from "lucide-react";

interface AnnouncementHistoryItem {
  announcementId: string;
  title: string;
  message: string;
  category: string;
  priority: boolean;
  actionLabel?: string | null;
  actionUrl?: string | null;
  targetBoard?: string | null;
  targetAcademicLevel?: string | null;
  targetSubscription?: string | null;
  dispatchedAt: string;
  recipientCount: number;
}

const BOARDS = [
  { id: "ALL", label: "All Curriculums" },
  { id: "CBSE", label: "CBSE" },
  { id: "ICSE", label: "ICSE / ISC" },
  { id: "WBCHSE", label: "WBCHSE" },
  { id: "NEET", label: "NEET & Medical" },
  { id: "JEE", label: "JEE & Engineering" },
];

const ACADEMIC_LEVELS = [
  { id: "ALL", label: "All Levels & Classes" },
  { id: "11", label: "Class 11 / SEM-I & II" },
  { id: "12", label: "Class 12 / SEM-III & IV" },
  { id: "SEM-I", label: "WBCHSE SEM-I" },
  { id: "SEM-II", label: "WBCHSE SEM-II" },
  { id: "SEM-III", label: "WBCHSE SEM-III" },
  { id: "SEM-IV", label: "WBCHSE SEM-IV" },
  { id: "NEET", label: "NEET Repeater / Aspirant" },
  { id: "JEE", label: "JEE Main / Advanced" },
];

const SUBSCRIPTION_TIERS = [
  { id: "ALL", label: "All Students (Free & Paid)" },
  { id: "PAID", label: "PIE Ultra / Pro Subscribers Only" },
  { id: "FREE", label: "Free Tier Students Only" },
];

const CATEGORIES = [
  { id: "announcements", label: "General Announcement", icon: Megaphone, color: "text-purple-400" },
  { id: "ultra", label: "PIE Ultra & Membership", icon: Crown, color: "text-red-400" },
  { id: "exams", label: "Exams & Tests", icon: Flame, color: "text-amber-400" },
  { id: "system", label: "System & Maintenance", icon: Shield, color: "text-cyan-400" },
];

const QUICK_URL_PRESETS = [
  { label: "Dashboard", url: "/dashboard" },
  { label: "Exam Hall", url: "/courses" },
  { label: "Study Materials", url: "/study-material" },
  { label: "PIE Ultra Pricing", url: "/pricing" },
  { label: "Account / Billing", url: "/dashboard/account" },
];

export default function AdminNotificationsPage() {
  // Navigation & Sub-views
  const [activeView, setActiveView] = useState<"composer" | "history" | "access">("composer");

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<"announcements" | "system" | "ultra" | "exams">("announcements");
  const [priority, setPriority] = useState(false);
  const [targetBoard, setTargetBoard] = useState("ALL");
  const [targetAcademicLevel, setTargetAcademicLevel] = useState("ALL");
  const [targetSubscription, setTargetSubscription] = useState<"ALL" | "PAID" | "FREE">("ALL");
  const [actionLabel, setActionLabel] = useState("");
  const [actionUrl, setActionUrl] = useState("");

  // Live Estimation & Dispatch State
  const [estimatedRecipients, setEstimatedRecipients] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [sending, setSending] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

interface AccessRequestItem {
  id: string;
  requestType?: string;
  student?: {
    name?: string | null;
    email?: string | null;
  } | null;
  test?: {
    title?: string | null;
  } | null;
}

  // History & Access Requests
  const [history, setHistory] = useState<AnnouncementHistoryItem[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequestItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const estimateDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Announcement History & Access Requests
  const fetchPageData = async () => {
    setLoadingData(true);
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.announcements || []);
        setAccessRequests(data.accessRequests || []);
      }
    } catch (err) {
      console.error("Failed to load announcements data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch("/api/admin/notifications")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!active || !data) return;
        setHistory(data.announcements || []);
        setAccessRequests(data.accessRequests || []);
        setLoadingData(false);
      })
      .catch(err => {
        console.error("Failed to load announcements data:", err);
        if (active) setLoadingData(false);
      });
    return () => { active = false; };
  }, []);

  // 2. Fetch Live Audience Estimate on Target Change (Debounced)
  useEffect(() => {
    if (estimateDebounceRef.current) clearTimeout(estimateDebounceRef.current);

    estimateDebounceRef.current = setTimeout(async () => {
      setEstimating(true);
      try {
        const query = new URLSearchParams({
          action: "estimate",
          board: targetBoard,
          academicLevel: targetAcademicLevel,
          subscriptionStatus: targetSubscription,
        });

        const res = await fetch(`/api/admin/notifications?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setEstimatedRecipients(data.count ?? 0);
        }
      } catch (err) {
        console.error("Estimate audience error:", err);
      } finally {
        setEstimating(false);
      }
    }, 300);

    return () => {
      if (estimateDebounceRef.current) clearTimeout(estimateDebounceRef.current);
    };
  }, [targetBoard, targetAcademicLevel, targetSubscription]);

  // 3. Dispatch Announcement Handler
  const handleDispatch = async () => {
    setShowConfirmModal(false);
    setSending(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          category,
          priority,
          targetBoard,
          targetAcademicLevel,
          targetSubscription,
          actionLabel: actionLabel.trim() || undefined,
          actionUrl: actionUrl.trim() || undefined,
          announcementId: `annc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const feedbackMsg = data.message || `Broadcast delivered: ${data.insertedCount ?? data.successCount} sent, ${data.skippedCount ?? 0} skipped. (Targeted: ${data.totalTargeted})`;
        setFeedback({
          type: "success",
          message: feedbackMsg,
        });
        // Reset composer inputs
        setTitle("");
        setMessage("");
        setActionLabel("");
        setActionUrl("");
        setPriority(false);
        fetchPageData();
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Failed to dispatch announcement. Please review inputs.",
        });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Network error dispatching broadcast.";
      setFeedback({
        type: "error",
        message: errMsg,
      });
    } finally {
      setSending(false);
    }
  };

  // 4. Handle Legacy Test Access Requests
  const handleAccessAction = async (requestId: string, action: "APPROVE" | "REJECT") => {
    setActionLoadingId(requestId);
    try {
      const res = await fetch("/api/admin/notifications/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      if (res.ok) {
        setAccessRequests((prev) => prev.filter((r) => r.id !== requestId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-[#12080a] via-[#101420] to-[#090d16] border border-red-500/30 p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-[#E50914]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-red-950/80 border border-red-500/40 rounded-2xl text-red-400">
              <Megaphone size={22} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Communications & Announcements Hub</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Broadcast targeted academic notifications across CBSE, ICSE, WBCHSE, and NEET/JEE cohorts.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="relative flex items-center p-1 rounded-2xl bg-[#141a29] border border-slate-700/80">
          <button
            onClick={() => setActiveView("composer")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeView === "composer"
                ? "bg-[#E50914] text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📢 Composer
          </button>
          <button
            onClick={() => setActiveView("history")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeView === "history"
                ? "bg-[#E50914] text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Past Broadcasts</span>
            {history.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40 text-white">
                {history.length}
              </span>
            )}
          </button>
          {accessRequests.length > 0 && (
            <button
              onClick={() => setActiveView("access")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeView === "access"
                  ? "bg-[#E50914] text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Access Requests</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-bold">
                {accessRequests.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Feedback Banners */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-lg animate-fade-in ${
            feedback.type === "success"
              ? "bg-emerald-950/80 border border-emerald-500/60 text-emerald-300"
              : "bg-red-950/80 border border-red-500/60 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg hover:bg-black/30 text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* VIEW A: BROADCAST COMPOSER & LIVE PREVIEW */}
      {activeView === "composer" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: Broadcast Configuration (7 Cols) */}
          <div className="lg:col-span-7 bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
            <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Compose Broadcast Announcement</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Target students with in-app notification center dispatches and optional deep-links.
                </p>
              </div>

              {/* Priority Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={priority}
                  onChange={(e) => setPriority(e.target.checked)}
                  className="sr-only peer"
                />
                <span className="text-xs font-bold text-slate-300 peer-checked:text-red-400">
                  {priority ? "🚨 Urgent Priority" : "Normal Priority"}
                </span>
                <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E50914] relative"></div>
              </label>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowConfirmModal(true);
              }}
              className="space-y-5"
            >
              {/* Title Input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-slate-300">Announcement Title *</label>
                  <span className="text-[10px] text-slate-500 font-mono">{title.length} / 200</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. WBCHSE Semester-I Mock Examination Series Published"
                  className="w-full bg-[#141a29] border border-slate-700/80 focus:border-red-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Message Input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-slate-300">Announcement Message *</label>
                  <span className="text-[10px] text-slate-500 font-mono">{message.length} / 3000</span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={3000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide comprehensive details regarding the syllabus revision, exam schedule, or platform update..."
                  className="w-full bg-[#141a29] border border-slate-700/80 focus:border-red-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none resize-none"
                />
              </div>

              {/* Category Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Category Tag</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => {
                    const IconComp = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id as "announcements" | "system" | "ultra" | "exams")}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition text-left ${
                          isSelected
                            ? "bg-red-950/60 border-red-500/60 text-white shadow-sm"
                            : "bg-[#141a29] border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <IconComp size={14} className={cat.color} />
                        <span className="truncate">{cat.label.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TARGET AUDIENCE MATRIX */}
              <div className="bg-[#121726] border border-slate-800 p-4 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Filter size={13} className="text-red-400" />
                    <span>Audience Targeting Matrix</span>
                  </span>

                  {/* Live Recipient Counter Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-[11px] font-mono text-cyan-300 font-bold">
                    <Users size={12} className={estimating ? "animate-spin" : ""} />
                    <span>
                      {estimating ? "Calculating..." : `~${estimatedRecipients ?? 0} Students`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Academic Board */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Board / Curriculum</label>
                    <select
                      value={targetBoard}
                      onChange={(e) => setTargetBoard(e.target.value)}
                      className="w-full bg-[#1b2336] border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                    >
                      {BOARDS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Academic Level / Class */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Class / Semester</label>
                    <select
                      value={targetAcademicLevel}
                      onChange={(e) => setTargetAcademicLevel(e.target.value)}
                      className="w-full bg-[#1b2336] border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                    >
                      {ACADEMIC_LEVELS.map((lvl) => (
                        <option key={lvl.id} value={lvl.id}>
                          {lvl.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Subscription Status */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Plan Tier</label>
                    <select
                      value={targetSubscription}
                      onChange={(e) => setTargetSubscription(e.target.value as "ALL" | "PAID" | "FREE")}
                      className="w-full bg-[#1b2336] border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                    >
                      {SUBSCRIPTION_TIERS.map((tier) => (
                        <option key={tier.id} value={tier.id}>
                          {tier.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Optional Call to Action Button */}
              <div className="bg-[#121726] border border-slate-800 p-4 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ArrowRight size={13} className="text-cyan-400" />
                  <span>Call to Action Button (Optional)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Button Label</label>
                    <input
                      type="text"
                      maxLength={50}
                      value={actionLabel}
                      onChange={(e) => setActionLabel(e.target.value)}
                      placeholder="e.g. Open Examination Hall →"
                      className="w-full bg-[#1b2336] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Destination URL</label>
                    <input
                      type="text"
                      value={actionUrl}
                      onChange={(e) => setActionUrl(e.target.value)}
                      placeholder="e.g. /courses or /study-material"
                      className="w-full bg-[#1b2336] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Presets:</span>
                  {QUICK_URL_PRESETS.map((p) => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => {
                        setActionUrl(p.url);
                        if (!actionLabel) setActionLabel(`Go to ${p.label}`);
                      }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Trigger */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={sending || !title.trim() || !message.trim()}
                  className="w-full py-3 bg-[#E50914] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-red-950/60 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send size={15} />
                  <span>Review & Dispatch Broadcast</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Student Notification Mock Card (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              <Eye size={14} className="text-red-400" />
              <span>Live Student Dropdown Preview</span>
            </div>

            {/* Mock Dropdown Card */}
            <div className="bg-[#07070a] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-black text-white font-serif">Notification Center</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-500/40">
                  {priority ? "URGENT" : "PREVIEW"}
                </span>
              </div>

              {/* The Actual Notification Card Mockup */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#12080a] via-[#090b10] to-[#07070a] border border-red-500/40 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 rounded bg-red-950 text-red-400 border border-red-500/40">
                      <Megaphone size={12} />
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
                      {category}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Just now</span>
                </div>

                <h4 className="text-xs font-bold text-white leading-snug">
                  {title || "Your Announcement Title Appears Here"}
                </h4>

                <p className="text-[11px] text-slate-300/90 font-light leading-relaxed">
                  {message || "Your announcement message body will be rendered to enrolled students here in their floating notification drawer."}
                </p>

                {/* Metadata Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono">
                  <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                    Board: {targetBoard}
                  </span>
                  {targetAcademicLevel !== "ALL" && (
                    <span className="px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800">
                      Level: {targetAcademicLevel}
                    </span>
                  )}
                  {targetSubscription !== "ALL" && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                      Tier: {targetSubscription}
                    </span>
                  )}
                </div>

                {/* Call To Action Button Preview */}
                {actionLabel && (
                  <div className="pt-2 border-t border-white/10 flex justify-end">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-red-600 text-white text-[10px] font-bold shadow">
                      <span>{actionLabel}</span>
                      <ArrowRight size={10} />
                    </span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-500 font-light leading-relaxed bg-[#101420] p-3 rounded-xl border border-slate-800">
                💡 <strong>Targeting Rule:</strong> Students who match multiple selected filters will receive exactly <strong>one copy</strong> via atomic deduplication.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: DISPATCHED ANNOUNCEMENTS HISTORY */}
      {activeView === "history" && (
        <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">Past Broadcast Announcements</h2>
              <p className="text-xs text-slate-400">History of all dispatched alerts and audience receipts.</p>
            </div>
            <button
              onClick={fetchPageData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#141a29] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl text-xs font-bold transition"
            >
              <RefreshCw size={12} className={loadingData ? "animate-spin text-red-400" : ""} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingData ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">Loading broadcast history...</div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No broadcast announcements have been dispatched yet.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.announcementId}
                  className="bg-[#121726] border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{item.title}</span>
                      {item.priority && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-red-950 text-red-400 border border-red-500/40">
                          URGENT
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 font-light line-clamp-2">{item.message}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>Target: {item.targetBoard || "ALL"}</span>
                      {item.targetAcademicLevel && item.targetAcademicLevel !== "ALL" && (
                        <span>• Level: {item.targetAcademicLevel}</span>
                      )}
                      <span>• Sent: {formatTimestamp(item.dispatchedAt)}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800/80 px-2.5 py-1 rounded-xl inline-block">
                      {item.recipientCount} Recipients
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW C: LEGACY TEST ACCESS REQUESTS (PRESERVED) */}
      {activeView === "access" && (
        <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800/80 pb-3">
            <h2 className="text-base font-bold text-white">Pending Test Access Requests</h2>
            <p className="text-xs text-slate-400">Review student test hall permissions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accessRequests.map((req) => (
              <div
                key={req.id}
                className="bg-[#121726] border border-slate-800 p-4 rounded-2xl space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-bold text-white">{req.student?.name || "Student"}</div>
                    <div className="text-[11px] text-cyan-300 font-mono">{req.student?.email}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    {req.requestType || "ACCESS"}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  Target Test: <strong>{req.test?.title || "Exam"}</strong>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleAccessAction(req.id, "REJECT")}
                    disabled={actionLoadingId === req.id}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-red-950 text-red-400 text-xs font-bold rounded-lg transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAccessAction(req.id, "APPROVE")}
                    disabled={actionLoadingId === req.id}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL BEFORE DISPATCH */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0e131f] border border-red-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 bg-red-950/80 border border-red-500/40 rounded-xl text-red-400">
                <Send size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Broadcast Dispatch</h3>
                <p className="text-xs text-slate-400">Review audience targeting before broadcasting</p>
              </div>
            </div>

            <div className="bg-[#141a29] p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Title</span>
                <span className="text-white font-bold">{title}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Board</span>
                  <span className="text-cyan-300 font-mono font-bold">{targetBoard}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Estimated Recipients</span>
                  <span className="text-emerald-400 font-mono font-bold">~{estimatedRecipients ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatch}
                disabled={sending}
                className="px-5 py-2 text-xs font-bold text-white bg-[#E50914] hover:bg-red-700 rounded-xl transition shadow-lg disabled:opacity-50"
              >
                {sending ? "Dispatching..." : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}