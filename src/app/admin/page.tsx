"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  FileText,
  BarChart3,
  CreditCard,
  Clock,
  Sparkles,
  RefreshCw,
  PlusCircle,
  BookOpen,
  Bell,
  Megaphone,
  GraduationCap,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ChevronRight
} from "lucide-react";

interface RecentAttemptItem {
  id: string;
  student?: {
    name?: string | null;
    email?: string | null;
  } | null;
  test?: {
    title?: string | null;
  } | null;
  score?: number | null;
  totalMarks?: number | null;
  percentage?: number | null;
  startedAt?: string | null;
  createdAt?: string | null;
}

interface RecentTestItem {
  id: string;
  title: string;
  targetBoard?: string | null;
  durationMinutes: number;
  totalQuestions?: number;
  status?: string;
  lockAt?: string | null;
  _count?: {
    questions?: number;
    attempts?: number;
  };
}

interface PendingSubscriptionRequestItem {
  id: string;
  studentId?: string;
  amount?: number;
  utrNumber?: string | null;
  createdAt?: string | null;
  status?: string;
  student?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  suspendedStudents: number;
  totalTests: number;
  liveTests: number;
  totalQuestions: number;
  totalAttempts: number;
  activeSubscribers: number;
  pendingUpgradesCount: number;
  monthlyFee: number;
  revenueEstimate: number;
  recentAttempts: RecentAttemptItem[];
  recentTests: RecentTestItem[];
  pendingRequests: PendingSubscriptionRequestItem[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [testsRes, studentsRes, subsRes, resultsRes] = await Promise.allSettled([
        fetch("/api/admin/tests"),
        fetch("/api/admin/students"),
        fetch("/api/admin/subscriptions"),
        fetch("/api/admin/results"),
      ]);

      // Check 401 Unauthorized across responses
      if (
        (testsRes.status === "fulfilled" && testsRes.value.status === 401) ||
        (studentsRes.status === "fulfilled" && studentsRes.value.status === 401)
      ) {
        router.push("/login");
        return;
      }

      // 1. Process Tests
      let testsData: RecentTestItem[] = [];
      if (testsRes.status === "fulfilled" && testsRes.value.ok) {
        const json = await testsRes.value.json();
        if (Array.isArray(json)) testsData = json;
      }

      const now = new Date();
      const liveTestsCount = testsData.filter((t: RecentTestItem) => {
        if (t.status === "PUBLISHED" || t.status === "LIVE") return true;
        if (t.status === "SCHEDULE_EXPIRED") {
          const lockDate = t.lockAt ? new Date(t.lockAt) : null;
          return !lockDate || now < lockDate;
        }
        return false;
      }).length;

      const totalQuestions = testsData.reduce(
        (acc: number, t: RecentTestItem) => acc + (t._count?.questions || t.totalQuestions || 0),
        0
      );
      const totalAttempts = testsData.reduce(
        (acc: number, t: RecentTestItem) => acc + (t._count?.attempts || 0),
        0
      );

      // 2. Process Students
      let studentCounts = { totalStudents: 0, activeStudents: 0, suspendedStudents: 0 };
      if (studentsRes.status === "fulfilled" && studentsRes.value.ok) {
        const json = await studentsRes.value.json();
        if (json.stats) {
          studentCounts = json.stats;
        } else if (Array.isArray(json.students)) {
          studentCounts.totalStudents = json.students.length;
          studentCounts.activeStudents = json.students.filter((s: { status?: string }) => s.status === "ACTIVE").length;
          studentCounts.suspendedStudents = json.students.filter((s: { status?: string }) => s.status === "SUSPENDED").length;
        }
      }

      // 3. Process Subscriptions
      let activeSubsCount = 0;
      let pendingRequests: PendingSubscriptionRequestItem[] = [];
      let feeRate = 199.0;
      if (subsRes.status === "fulfilled" && subsRes.value.ok) {
        const json = await subsRes.value.json();
        if (Array.isArray(json.activeStudents)) {
          activeSubsCount = json.activeStudents.length;
        }
        if (Array.isArray(json.requests)) {
          pendingRequests = json.requests.filter((r: PendingSubscriptionRequestItem) => r.status === "PENDING");
        }
        if (json.paymentSettings?.monthlyFee) {
          feeRate = Number(json.paymentSettings.monthlyFee) || 199.0;
        }
      }

      // 4. Process Results (Real attempts stream)
      let recentAttemptsList: RecentAttemptItem[] = [];
      if (resultsRes.status === "fulfilled" && resultsRes.value.ok) {
        const json = await resultsRes.value.json();
        if (Array.isArray(json)) {
          recentAttemptsList = json.slice(0, 6);
        }
      }

      setStats({
        totalStudents: studentCounts.totalStudents,
        activeStudents: studentCounts.activeStudents,
        suspendedStudents: studentCounts.suspendedStudents,
        totalTests: testsData.length,
        liveTests: liveTestsCount,
        totalQuestions,
        totalAttempts,
        activeSubscribers: activeSubsCount,
        pendingUpgradesCount: pendingRequests.length,
        monthlyFee: feeRate,
        revenueEstimate: activeSubsCount * feeRate,
        recentAttempts: recentAttemptsList,
        recentTests: testsData.slice(0, 5),
        pendingRequests: pendingRequests.slice(0, 4),
      });
    } catch (err: unknown) {
      console.error("Dashboard fetch error:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to load platform telemetry.";
      setError(errMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleTestAsStudent = async () => {
    try {
      const res = await fetch("/api/admin/test-as-student", { method: "POST" });
      const data = await res.json();
      if (res.ok && (data.redirectUrl || data.success)) {
        window.location.href = data.redirectUrl || "/dashboard";
      } else {
        alert(data.error || "Failed to switch to student preview mode.");
      }
    } catch (err) {
      console.error(err);
      alert("Error switching to student preview mode.");
    }
  };

  const formatTimestamp = (dateInput: string | Date | null | undefined) => {
    if (!dateInput) return "-";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-slate-800/40 rounded-2xl border border-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-800/30 rounded-2xl border border-slate-800/60" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-800/30 rounded-2xl border border-slate-800/60" />
          <div className="h-72 bg-slate-800/30 rounded-2xl border border-slate-800/60" />
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-red-950/40 border border-red-500/40 p-6 rounded-2xl text-center space-y-4">
        <AlertCircle size={36} className="text-red-400 mx-auto" />
        <div>
          <h2 className="text-base font-bold text-white">Error Loading Command Center</h2>
          <p className="text-xs text-red-300 mt-1">{error}</p>
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Command Center Hero & System Status Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-[#12080a] via-[#101420] to-[#090d16] border border-red-500/30 p-6 rounded-3xl shadow-xl relative overflow-hidden">
        {/* Subtle Crimson Ambient Glow */}
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-[#E50914]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Command Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time examination monitoring, enrollment analytics, and PIE Ultra subscription operations.
          </p>
        </div>

        <div className="relative flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#161c2b] hover:bg-[#1f283d] text-slate-300 hover:text-white border border-slate-700/80 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
            title="Refresh dashboard metrics"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-red-400" : ""} />
            <span>{refreshing ? "Updating..." : "Refresh"}</span>
          </button>

          <button
            onClick={handleTestAsStudent}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs transition shadow-[0_0_15px_rgba(245,158,11,0.3)]"
          >
            <GraduationCap size={15} className="stroke-[2.5]" />
            <span>Test Site as Student</span>
          </button>
        </div>
      </div>

      {/* 2. Netflix-Inspired Quick Action Rail */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Quick Actions & Operations
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/admin/tests/new"
            className="group flex flex-col items-center text-center p-3.5 bg-[#0f1422] hover:bg-[#172033] border border-slate-800 hover:border-red-500/50 rounded-2xl transition duration-150 shadow-md space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-red-950/60 group-hover:bg-red-900/80 text-red-400 border border-red-500/40 transition">
              <PlusCircle size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-red-200">New MCQ Test</div>
              <div className="text-[10px] text-slate-400">Launch examination</div>
            </div>
          </Link>

          <Link
            href="/admin/study-materials"
            className="group flex flex-col items-center text-center p-3.5 bg-[#0f1422] hover:bg-[#172033] border border-slate-800 hover:border-cyan-500/50 rounded-2xl transition duration-150 shadow-md space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-cyan-950/60 group-hover:bg-cyan-900/80 text-cyan-400 border border-cyan-500/40 transition">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-200">Study Materials</div>
              <div className="text-[10px] text-slate-400">Upload notes & PDF</div>
            </div>
          </Link>

          <Link
            href="/admin/subscriptions"
            className="group flex flex-col items-center text-center p-3.5 bg-[#0f1422] hover:bg-[#172033] border border-slate-800 hover:border-amber-500/50 rounded-2xl transition duration-150 shadow-md space-y-2 relative"
          >
            {stats && stats.pendingUpgradesCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
            <div className="p-2.5 rounded-xl bg-amber-950/60 group-hover:bg-amber-900/80 text-amber-400 border border-amber-500/40 transition">
              <CreditCard size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-amber-200">PIE Ultra Queue</div>
              <div className="text-[10px] text-slate-400">
                {stats?.pendingUpgradesCount ? `${stats.pendingUpgradesCount} pending` : "Verify payments"}
              </div>
            </div>
          </Link>

          <Link
            href="/admin/notifications"
            className="group flex flex-col items-center text-center p-3.5 bg-[#0f1422] hover:bg-[#172033] border border-slate-800 hover:border-purple-500/50 rounded-2xl transition duration-150 shadow-md space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-purple-950/60 group-hover:bg-purple-900/80 text-purple-400 border border-purple-500/40 transition">
              <Bell size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-purple-200">Announcements</div>
              <div className="text-[10px] text-slate-400">Broadcast alert</div>
            </div>
          </Link>

          <Link
            href="/admin/test-alerts"
            className="group flex flex-col items-center text-center p-3.5 bg-[#0f1422] hover:bg-[#172033] border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition duration-150 shadow-md space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-emerald-950/60 group-hover:bg-emerald-900/80 text-emerald-400 border border-emerald-500/40 transition">
              <Megaphone size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-emerald-200">Ticker Marquee</div>
              <div className="text-[10px] text-slate-400">Manage banner</div>
            </div>
          </Link>

          <Link
            href="/admin/results"
            className="group flex flex-col items-center text-center p-3.5 bg-[#0f1422] hover:bg-[#172033] border border-slate-800 hover:border-blue-500/50 rounded-2xl transition duration-150 shadow-md space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-blue-950/60 group-hover:bg-blue-900/80 text-blue-400 border border-blue-500/40 transition">
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-blue-200">Exam Results</div>
              <div className="text-[10px] text-slate-400">Scores & logs</div>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. Platform Telemetry & KPI Cards */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Platform KPIs & Resource Telemetry
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Card 1: Total Students */}
          <div className="bg-gradient-to-br from-[#121624] via-[#0b0f1a] to-[#080b12] border border-slate-800 hover:border-slate-700 p-5 rounded-2xl space-y-2 transition shadow-lg">
            <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
              <span>Total Students</span>
              <Users size={16} className="text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {stats?.totalStudents || 0}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span className="text-emerald-400 font-semibold">{stats?.activeStudents || 0} Active</span>
              <span className="text-slate-500">{stats?.suspendedStudents || 0} Suspended</span>
            </div>
          </div>

          {/* Card 2: Live Exams */}
          <div className="bg-gradient-to-br from-[#1c0c10] via-[#12080a] to-[#080b12] border border-red-500/30 p-5 rounded-2xl space-y-2 transition shadow-lg">
            <div className="flex justify-between items-center text-red-300 text-xs font-semibold">
              <span>Live MCQ Tests</span>
              <FileText size={16} className="text-[#E50914]" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {stats?.liveTests || 0}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>{stats?.totalTests || 0} total tests</span>
              <span className="text-red-400 font-bold">{stats?.totalQuestions || 0} Qs</span>
            </div>
          </div>

          {/* Card 3: Total Attempts */}
          <div className="bg-gradient-to-br from-[#121624] via-[#0b0f1a] to-[#080b12] border border-slate-800 hover:border-slate-700 p-5 rounded-2xl space-y-2 transition shadow-lg">
            <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
              <span>Total Attempts</span>
              <BarChart3 size={16} className="text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {stats?.totalAttempts || 0}
            </div>
            <div className="text-[11px] text-slate-400">
              Logged student submissions
            </div>
          </div>

          {/* Card 4: PIE Ultra Passes */}
          <div className="bg-gradient-to-br from-[#161208] via-[#0f0c05] to-[#080b12] border border-amber-500/30 p-5 rounded-2xl space-y-2 transition shadow-lg">
            <div className="flex justify-between items-center text-amber-300 text-xs font-semibold">
              <span>PIE Ultra Passes</span>
              <Sparkles size={16} className="text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {stats?.activeSubscribers || 0}
            </div>
            <div className="text-[11px] text-amber-200/70">
              Active premium members
            </div>
          </div>

          {/* Card 5: Pending Verification Queue */}
          <div className="bg-gradient-to-br from-[#1c080b] via-[#12080a] to-[#080b12] border border-red-500/40 p-5 rounded-2xl space-y-2 transition shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-center text-red-300 text-xs font-semibold">
              <span>Pending Reviews</span>
              <Clock size={16} className="text-red-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {stats?.pendingUpgradesCount || 0}
            </div>
            <div className="text-[11px] text-red-300/80">
              {stats?.pendingUpgradesCount ? "Awaiting admin approval" : "Queue all cleared"}
            </div>
          </div>

          {/* Card 6: Estimated Monthly Volume */}
          <div className="bg-gradient-to-br from-[#081810] via-[#05100a] to-[#080b12] border border-emerald-500/30 p-5 rounded-2xl space-y-2 transition shadow-lg">
            <div className="flex justify-between items-center text-emerald-300 text-xs font-semibold">
              <span>Subscription Vol.</span>
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              ₹{stats?.revenueEstimate ? Math.round(stats.revenueEstimate).toLocaleString("en-IN") : 0}
            </div>
            <div className="text-[10px] text-emerald-200/70 truncate" title="Estimated monthly subscriber volume at current rate">
              Est. volume @ ₹{stats?.monthlyFee || 199}/mo
            </div>
          </div>
        </div>
      </section>

      {/* 4. Split Workspace: Real Activity Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Examination Attempts Stream */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-950/60 border border-blue-500/40 rounded-xl text-blue-400">
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Recent Examination Attempts</h3>
                <p className="text-[11px] text-slate-400">Live student test submissions</p>
              </div>
            </div>
            <Link
              href="/admin/results"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-2.5">
            {stats && stats.recentAttempts.length > 0 ? (
              stats.recentAttempts.map((att: RecentAttemptItem) => (
                <div
                  key={att.id}
                  className="bg-[#121726] border border-slate-800/80 hover:border-slate-700 p-3.5 rounded-2xl flex items-center justify-between gap-3 transition"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {att.student?.name || att.student?.email || "Student"}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {att.test?.title || "Examination"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {formatTimestamp(att.startedAt || att.createdAt)}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-black font-mono text-cyan-300">
                      Score: {att.score ?? "-"} / {att.totalMarks ?? "-"}
                    </div>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        (att.percentage ?? 0) >= 60
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                          : "bg-amber-950 text-amber-400 border border-amber-800/60"
                      }`}
                    >
                      {typeof att.percentage === "number" ? `${Math.round(att.percentage)}%` : "SUBMITTED"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                No recent examination attempts logged yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pending PIE Ultra Subscriptions Queue */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-400">
                <CreditCard size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Pending UPI Verification Queue</h3>
                <p className="text-[11px] text-slate-400">Student payment submissions awaiting approval</p>
              </div>
            </div>
            <Link
              href="/admin/subscriptions"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Manage Queue</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-2.5">
            {stats && stats.pendingRequests.length > 0 ? (
              stats.pendingRequests.map((req: PendingSubscriptionRequestItem) => (
                <div
                  key={req.id}
                  className="bg-[#18140c] border border-amber-500/30 p-3.5 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {req.student?.name || req.student?.email || "Student"}
                    </div>
                    <div className="text-[11px] text-amber-300 font-mono mt-0.5 truncate">
                      UTR: {req.utrNumber || "NOT PROVIDED"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Submitted: {formatTimestamp(req.createdAt)}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-extrabold font-mono text-emerald-400">
                      ₹{req.amount || stats.monthlyFee || 199}
                    </div>
                    <Link
                      href="/admin/subscriptions"
                      className="inline-block mt-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[10px] transition uppercase tracking-wider"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                <CheckCircle2 size={24} className="text-emerald-500/60 mx-auto mb-1.5" />
                <span>Verification queue is all caught up! No pending payments.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Recent Active Examination Catalog */}
      <section className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white">Active Examination Catalog</h3>
            <p className="text-[11px] text-slate-400">Recently published tests and question papers</p>
          </div>
          <Link
            href="/admin/tests"
            className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            <span>View All Tests</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-slate-400 uppercase tracking-wider bg-[#0f1422] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Test Title</th>
                <th className="px-4 py-3 font-semibold">Target Board</th>
                <th className="px-4 py-3 font-semibold">Questions</th>
                <th className="px-4 py-3 font-semibold">Duration</th>
                <th className="px-4 py-3 font-semibold">Attempts</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stats && stats.recentTests.length > 0 ? (
                stats.recentTests.map((t: RecentTestItem) => (
                  <tr key={t.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-xs">{t.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ID: {t.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {t.targetBoard || "ALL BOARDS"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      {t._count?.questions || t.totalQuestions || 0} Qs
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      {t.durationMinutes} mins
                    </td>
                    <td className="px-4 py-3.5 font-mono text-cyan-400 font-bold">
                      {t._count?.attempts || 0}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/tests/${t.id}/questions`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition"
                      >
                        <span>Questions</span>
                        <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                    No tests created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
