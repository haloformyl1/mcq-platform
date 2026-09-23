"use client";
import GlobalFooter from "@/components/GlobalFooter";
import AdaptiveQuizModal from "@/components/ai/AdaptiveQuizModal";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Atom, BookOpen, Trophy, Target, TrendingUp, ChevronRight, ChevronDown, 
  LogOut, Medal, AlertCircle, FileText, Image as ImageIcon, Link as LinkIcon, 
  Download, ExternalLink, FolderOpen, Clock, User, Play, Info, Sparkles, 
  Flame, ShieldCheck, CheckCircle2, Award, Bell, Phone, X, Check, Lock as LockIcon
, ArrowRight } from 'lucide-react';
import AdminPreviewBanner from "@/components/AdminPreviewBanner";
import PiechemLogo from "@/components/PiechemLogo";
import MolecularOrbitalCanvas from "@/components/3d/MolecularOrbitalCanvas";
import PiechemAiLogo from "@/components/ai/PiechemAiLogo";
import PiFiringLoader from "@/components/PiFiringLoader";
import SubscriptionExpiredModal from "@/components/SubscriptionExpiredModal";
import GoldUpgradeCelebrationModal from "@/components/GoldUpgradeCelebrationModal";
import NotificationCenterDropdown from "@/components/NotificationCenterDropdown";
import ChemistryLibraryVault from "@/components/ChemistryLibraryVault";

export default function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [studyMaterials, setStudyMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  const router = useRouter();
  const [updatingCurriculum, setUpdatingCurriculum] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "tests" | "materials" | "leaderboard" | "performance">("overview");
  const [mobileCurriculumOpen, setMobileCurriculumOpen] = useState(false);

  // 3D WebGL animations & interactive simulation models
  const threeDMaterials = useMemo(() => {
    return (studyMaterials || []).filter((mat: any) => {
      return mat.type === "LINK" || mat.category === "3D animations" || (mat.url && mat.url.includes("lab-viewer"));
    });
  }, [studyMaterials]);

  // PIECHEM AI Integration States
  const [isAdaptiveQuizOpen, setIsAdaptiveQuizOpen] = useState(false);
  const [adaptiveDrillTopic, setAdaptiveDrillTopic] = useState<string | undefined>(undefined);

  // Prefetch full-screen AI workspace for instant client-side transition
  useEffect(() => {
    router.prefetch("/dashboard/ai");
  }, [router]);

  const handleOpenAiTutor = (mode: string = "tutor", ctx?: any) => {
    const params = new URLSearchParams();
    if (mode && mode !== "tutor") params.set("mode", mode);
    if (ctx?.subject) params.set("subject", ctx.subject);
    if (ctx?.className) params.set("className", ctx.className);
    if (ctx?.chapter) params.set("chapter", ctx.chapter);
    if (ctx?.topic) params.set("topic", ctx.topic);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    router.push(`/dashboard/ai${queryString}`);
  };

  const handleOpenAdaptiveDrill = (topic?: string) => {
    setAdaptiveDrillTopic(topic);
    setIsAdaptiveQuizOpen(true);
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/student/dashboard");
      const resData = await res.json();
      if (!resData.error) {
        setData(resData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          if (data.error.includes("revoked") || data.code === "CONCURRENT_DEVICE") {
            router.push("/login?reason=concurrent_device");
          } else {
            router.push("/");
          }
          return;
        }
        setData(data);

        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Fetch study materials for students
    fetch("/api/student/study-materials")
      .then(res => res.json())
      .then(mats => {
        if (Array.isArray(mats)) setStudyMaterials(mats);
      })
      .catch(() => {});
  }, [router]);

  const handleCurriculumChange = async (newBoard: string, newLevel: string) => {
    setUpdatingCurriculum(true);
    try {
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board: newBoard,
          academicLevel: newLevel
        })
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Failed to update curriculum", err);
    } finally {
      setUpdatingCurriculum(false);
    }
  };

  // Keep localStorage reactive to real-time subscription status & expiration
  useEffect(() => {
    if (!data?.student) return;
    const isComp = data.student.subscriptionStatus === "COMPLIMENTARY";
    const isPaid = data.student.subscriptionStatus === "PAID" && (!data.student.subscriptionExpiresAt || new Date(data.student.subscriptionExpiresAt).getTime() > now.getTime());
    const isGold = isComp || isPaid;

    if (typeof window !== "undefined") {
      try {
        if (isGold) {
          localStorage.setItem("piechem_is_gold", "true");
          if (isComp) {
            localStorage.setItem("piechem_is_complimentary", "true");
            localStorage.removeItem("piechem_gold_expires_at");
          } else if (data.student.subscriptionExpiresAt) {
            localStorage.setItem("piechem_gold_expires_at", new Date(data.student.subscriptionExpiresAt).toISOString());
            localStorage.removeItem("piechem_is_complimentary");
          }
        } else {
          localStorage.removeItem("piechem_is_gold");
          localStorage.removeItem("piechem_gold_expires_at");
          localStorage.removeItem("piechem_is_complimentary");
        }
        window.dispatchEvent(new Event("piechem_gold_status_changed"));
      } catch {}
    }
  }, [data?.student, now]);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("piechem_is_gold");
        localStorage.removeItem("piechem_gold_expires_at");
        localStorage.removeItem("piechem_is_complimentary");
        window.dispatchEvent(new Event("piechem_gold_status_changed"));
      } catch {}
    }
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (loading) {
    return <PiFiringLoader fullScreen={true} />;
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black text-white flex flex-col items-center justify-center p-4">
        <AdminPreviewBanner />
        <SubscriptionExpiredModal student={data?.student} />
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-4">Unable to load dashboard</h2>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#262626] rounded-md hover:bg-[#333333]">Retry</button>
      </div>
    );
  }

  const { student, availableTests = [], allAttempts = [], lastExamTopStudents = [], lastExamTitle = "" } = data;
  const completedAttempts = allAttempts.filter((a: any) => a.status === 'SUBMITTED');
  
  // Analytics Calculations
  const testsTaken = completedAttempts.length;
  const avgScore = testsTaken > 0 ? (completedAttempts.reduce((acc: number, a: any) => acc + (a.percentage || 0), 0) / testsTaken).toFixed(1) : 0;
  const bestScore = testsTaken > 0 ? Math.max(...completedAttempts.map((a: any) => a.percentage || 0)).toFixed(1) : 0;
  
  const totalCorrect = completedAttempts.reduce((acc: number, a: any) => acc + (a.correctCount || 0), 0);
  const totalQuestionsAttempted = completedAttempts.reduce((acc: number, a: any) => acc + (a.correctCount || 0) + (a.incorrectCount || 0), 0);
  const avgAccuracy = totalQuestionsAttempted > 0 ? ((totalCorrect / totalQuestionsAttempted) * 100).toFixed(1) : 0;

  // Graph Data
  const graphData = [...completedAttempts].reverse().map((a: any, i: number) => ({
    attempt: `Test ${i + 1}`,
    percentage: a.percentage || 0,
    score: a.score || 0
  }));

  const recentAttempts = completedAttempts.slice(0, 5);
  const last25Attempts = completedAttempts.slice(0, 25);
  const studentName = student.name || student.email.split('@')[0];

  const formatDateTime = (dateInput: Date | string | null | undefined) => {
    if (!dateInput) return "";
    const dateObj = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(dateObj.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(dateObj.getDate());
    const month = pad(dateObj.getMonth() + 1);
    const year = dateObj.getFullYear();
    let hours = dateObj.getHours();
    const minutes = pad(dateObj.getMinutes());
    const seconds = pad(dateObj.getSeconds());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}/${month}/${year} ${pad(hours)}:${minutes}:${seconds} ${ampm}`;
  };

  // Categorize Tests
  const currentAvailableTests: any[] = [];
  const upcomingTests: any[] = [];
  const expiredTests: any[] = [];

  availableTests.forEach((test: any) => {
    const lockDate = test.lockAt ? new Date(test.lockAt) : null;
    const unlockDate = test.unlockAt ? new Date(test.unlockAt) : null;

    if (test.status === "LIVE" || test.status === "PUBLISHED") {
      currentAvailableTests.push({ ...test, category: "LIVE", lockState: "PUBLISHED_ALWAYS" });
    } else if (test.status === "EXPIRED" || test.status === "CLOSED" || test.status === "LOCKED") {
      if (test.hasIndividualAccess) {
        currentAvailableTests.push({ ...test, category: "LIVE", lockState: "INDIVIDUAL_ACCESS_GRANTED" });
      } else {
        expiredTests.push({ ...test, category: "EXPIRED", lockState: "EXPIRED_STATUS", lockDate });
      }
    } else if (test.status === "SCHEDULE_EXPIRED") {
      if (!lockDate || now < lockDate) {
        currentAvailableTests.push({ ...test, category: "LIVE", lockState: "SCHEDULED_OPEN", lockDate });
      } else if (test.hasIndividualAccess) {
        currentAvailableTests.push({ ...test, category: "LIVE", lockState: "INDIVIDUAL_ACCESS_GRANTED" });
      } else {
        expiredTests.push({ ...test, category: "EXPIRED", lockState: "EXPIRED_STATUS", lockDate });
      }
    } else if (test.status === "UPCOMING") {
      const holdMinutes = test.postLockHoldMinutes ?? 0;
      const autoLiveDate = lockDate ? new Date(lockDate.getTime() + holdMinutes * 60 * 1000) : null;

      if (!lockDate || (autoLiveDate && now < autoLiveDate)) {
        upcomingTests.push({ 
          ...test, 
          category: unlockDate && now < unlockDate ? "UPCOMING" : (lockDate && now >= lockDate ? "HOLDING" : "UPCOMING_LIVE"), 
          lockState: unlockDate && now < unlockDate ? "BEFORE_UNLOCK" : (lockDate && now >= lockDate ? "POST_LOCK_HOLDING" : "SCHEDULED_OPEN"), 
          unlockDate, 
          lockDate, 
          autoLiveDate 
        });
      } else {
        currentAvailableTests.push({ ...test, category: "LIVE", lockState: "AUTO_RELEASED_LIVE", unlockDate, lockDate, autoLiveDate });
      }
    }
  });



  // Upcoming Alert Banner Items
  const bannerItems: any[] = [];
  (availableTests || []).forEach((t: any) => {
    const unlock = t.unlockAt ? new Date(t.unlockAt) : null;
    const lock = t.lockAt ? new Date(t.lockAt) : null;

    if (t.status === "UPCOMING") {
      if (unlock && now < unlock) {
        bannerItems.push({
          type: "UPCOMING",
          test: t,
          message: `Upcoming Test <strong class="text-white bg-amber-900/80 px-2 py-0.5 rounded border border-amber-600/50">${t.title}</strong> is scheduled to go live on <strong class="text-amber-300 font-mono">${formatDateTime(unlock)}</strong>. Please prepare to attempt!`
        });
      } else if (!lock || now < lock) {
        bannerItems.push({
          type: "UPCOMING",
          test: t,
          message: `Upcoming Test <strong class="text-white bg-green-950 px-2 py-0.5 rounded border border-green-600/60">${t.title}</strong> is currently live! ${lock ? `Concludes on <strong class="text-green-300 font-mono">${formatDateTime(lock)}</strong>.` : 'Available for all students.'}`
        });
      }
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      <AdminPreviewBanner />
      <SubscriptionExpiredModal student={data?.student} />
      <GoldUpgradeCelebrationModal student={student || data?.student} />

      {/* ========================================================= */}
      {/* 1. TOP NAVBAR (NETFLIX GLOBAL HEADER INSPIRATION)         */}
      {/* ========================================================= */}
      <header className="dashboard-header sticky top-0 z-50 bg-black/90 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7)]">
        <div className="dashboard-header-inner site-header-inner w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          <div className="flex min-w-0 items-center justify-between gap-1.5 sm:gap-4">
            
            {/* Left Group: Brand Identity & Designer Attribution at Far Left for Mobile & Desktop */}
            <div className="flex items-center gap-2 sm:gap-5 min-w-0">
              
              {/* Horizontal Logo + Designer Badge Side-by-Side (Image 1 style) */}
              <div className="flex items-center gap-1.5 sm:gap-3.5 shrink-0">
                <PiechemLogo size="md" href="/dashboard" isGoldMember={
                    student.subscriptionStatus === "COMPLIMENTARY" || 
                    (student.subscriptionStatus === "PAID" && (!student.subscriptionExpiresAt || new Date(student.subscriptionExpiresAt).getTime() > now.getTime()))
                  } />
                
                <div className="hidden md:inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-[#061421]/90 text-[9px] sm:text-[10px] font-medium shadow-sm shrink-0">
                  <span className="text-slate-400">Designed by</span>
                  <span className="font-semibold text-cyan-400">Arghyadeep Roy</span>
                  <span className="text-cyan-500/60 text-[9px] hidden xs:inline">•</span>
                  <a 
                    href="tel:9830507435" 
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 hover:text-white border border-cyan-500/40 transition font-mono text-[9px]"
                    title="Call Arghyadeep Roy"
                  >
                    <Phone className="w-2.5 h-2.5 fill-current text-cyan-400" />
                    <span>9830507435</span>
                  </a>
                </div>
              </div>

              
            </div>

            {/* Right Group: Curriculum Switcher + Account Profile */}
            {/* Desktop Right Group (UNTOUCHED: Exactly as before) */}
            <div className="hidden md:flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Option 4: Notification Center Dropdown */}
              <NotificationCenterDropdown student={student} upgradeReq={data?.upgradeReq} />
              
              {/* Sleek Curriculum Selector Pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#061421]/90 border border-cyan-500/30 text-xs shadow-inner">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400 hidden sm:block shrink-0" />
                
                {/* Board Dropdown */}
                <select
                  value={student.board || 'CBSE'}
                  disabled={updatingCurriculum}
                  onChange={(e) => {
                    const nb = e.target.value;
                    const defaultLevel = nb === 'WBCHSE' ? 'SEM-I' : '11';
                    handleCurriculumChange(nb, defaultLevel);
                  }}
                  className="bg-transparent text-cyan-300 font-extrabold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="CBSE" className="bg-[#040e17] text-cyan-300">CBSE</option>
                  <option value="ICSE" className="bg-[#040e17] text-cyan-300">ICSE</option>
                  <option value="WBCHSE" className="bg-[#040e17] text-cyan-300">WBCHSE</option>
                </select>

                <span className="text-slate-500 text-[10px]">•</span>

                {/* Level Dropdown */}
                {student.board === 'WBCHSE' ? (
                  <select
                    value={student.academicLevel || 'SEM-I'}
                    disabled={updatingCurriculum}
                    onChange={(e) => handleCurriculumChange(student.board || 'WBCHSE', e.target.value)}
                    className="bg-transparent text-teal-300 font-extrabold text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="SEM-I" className="bg-[#040e17] text-teal-300">SEM-I</option>
                    <option value="SEM-II" className="bg-[#040e17] text-teal-300">SEM-II</option>
                    <option value="SEM-III" className="bg-[#040e17] text-teal-300">SEM-III</option>
                    <option value="SEM-IV" className="bg-[#040e17] text-teal-300">SEM-IV</option>
                  </select>
                ) : (
                  <select
                    value={student.academicLevel || '11'}
                    disabled={updatingCurriculum}
                    onChange={(e) => handleCurriculumChange(student.board || 'CBSE', e.target.value)}
                    className="bg-transparent text-teal-300 font-extrabold text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="11" className="bg-[#040e17] text-teal-300">Class 11</option>
                    <option value="12" className="bg-[#040e17] text-teal-300">Class 12</option>
                  </select>
                )}

                {updatingCurriculum ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping ml-1" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" title="Active Curriculum" />
                )}
              </div>

              {/* My Account Button (Netflix Profile Pill) */}
              <Link 
                href="/dashboard/account"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/40 text-xs font-bold text-cyan-300 hover:text-white transition shadow-sm shrink-0"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden bg-cyan-600 flex items-center justify-center shrink-0">
                  <img
                    src={student.avatarUrl || "/avatars/atom.jpg"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e: any) => { e.target.style.display = 'none'; }}
                  />
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className="hidden sm:inline">{studentName.split(' ')[0]}</span>
              </Link>
            </div>

            {/* Mobile Right Group: Notification Dropdown + Curriculum Trigger Button + Avatar */}
            <div className="flex md:hidden items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Option 4: Notification Center Dropdown */}
              <NotificationCenterDropdown student={student} upgradeReq={data?.upgradeReq} />

              {/* Curriculum Trigger Button (Zero Truncation Guarantee) */}
              <button
                type="button"
                onClick={() => setMobileCurriculumOpen(prev => !prev)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-black/85 hover:bg-black border border-white/25 active:border-cyan-400 text-white font-bold text-xs shadow-md transition active:scale-95 shrink-0 whitespace-nowrap"
                aria-label="Select Curriculum"
              >
                <span className="text-cyan-300 font-black text-[10px] sm:text-[11px] tracking-tight">
                  {student.board || 'CBSE'}
                </span>
                <span className="text-slate-500 text-[9px] sm:text-[10px]">•</span>
                <span className="text-teal-300 font-black text-[10px] sm:text-[11px] tracking-tight">
                  {student.board === 'WBCHSE' ? (student.academicLevel || 'SEM-I') : `Cl ${student.academicLevel || '11'}`}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-300 transition-transform duration-200 ${mobileCurriculumOpen ? 'rotate-180 text-cyan-400' : ''}`} />
              </button>

              {/* Mobile Profile Avatar (Always Fully Visible) */}
              <Link 
                href="/dashboard/account"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gradient-to-tr from-cyan-950 to-blue-900 border border-cyan-500/50 flex items-center justify-center shrink-0 shadow-sm active:scale-95 hover:border-cyan-400 transition"
                title="My Account"
              >
                <img
                  src={student.avatarUrl || "/avatars/atom.jpg"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e: any) => { e.target.style.display = 'none'; }}
                />
                <User className="w-3.5 h-3.5 text-cyan-300" />
              </Link>
            </div>
          </div>

          {/* Netflix Image 2 Window Overlay (Mobile Browser Only) */}
          {mobileCurriculumOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
                onClick={() => setMobileCurriculumOpen(false)}
              />

              {/* Netflix Menu Window */}
              <div className="absolute top-full left-2 right-2 mt-1.5 z-50 bg-[#040a14]/98 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden md:hidden animate-in fade-in zoom-in-95 duration-150">
                
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-black tracking-wider uppercase text-white">
                      Curriculum & Browse
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setMobileCurriculumOpen(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-md transition"
                    aria-label="Close menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Columns Grid (Netflix Image 2 3-Column Layout) */}
                <div className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs max-h-[65vh] overflow-y-auto">
                  
                  {/* Column 1: WBCHSE Semesters */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 pb-1 border-b border-cyan-500/20 mb-1.5">
                      WBCHSE
                    </div>
                    {[
                      { level: 'SEM-I', label: 'SEM-I' },
                      { level: 'SEM-II', label: 'SEM-II' },
                      { level: 'SEM-III', label: 'SEM-III' },
                      { level: 'SEM-IV', label: 'SEM-IV' }
                    ].map((item) => {
                      const isSelected = student.board === 'WBCHSE' && (student.academicLevel || 'SEM-I') === item.level;
                      return (
                        <button
                          key={item.level}
                          type="button"
                          disabled={updatingCurriculum}
                          onClick={async () => {
                            setMobileCurriculumOpen(false);
                            if (!isSelected) {
                              await handleCurriculumChange('WBCHSE', item.level);
                            }
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded text-[11px] font-bold transition flex items-center justify-between ${
                            isSelected 
                              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                              : 'text-slate-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span>{item.label}</span>
                          {isSelected && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Column 2: CBSE & ICSE */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400 pb-1 border-b border-teal-500/20 mb-1.5">
                      CBSE / ICSE
                    </div>
                    {[
                      { board: 'CBSE', level: '11', label: 'CBSE 11' },
                      { board: 'CBSE', level: '12', label: 'CBSE 12' },
                      { board: 'ICSE', level: '11', label: 'ICSE 11' },
                      { board: 'ICSE', level: '12', label: 'ICSE 12' }
                    ].map((item) => {
                      const isSelected = student.board === item.board && (student.academicLevel || '11') === item.level;
                      return (
                        <button
                          key={`${item.board}-${item.level}`}
                          type="button"
                          disabled={updatingCurriculum}
                          onClick={async () => {
                            setMobileCurriculumOpen(false);
                            if (!isSelected) {
                              await handleCurriculumChange(item.board, item.level);
                            }
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded text-[11px] font-bold transition flex items-center justify-between ${
                            isSelected 
                              ? 'bg-teal-500/25 text-teal-300 border border-teal-500/40 shadow-sm' 
                              : 'text-slate-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span className="truncate">{item.label}</span>
                          {isSelected && <Check className="w-3 h-3 text-teal-400 shrink-0 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Column 3: Navigation Sections */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 pb-1 border-b border-white/10 mb-1.5">
                      Sections
                    </div>
                    {[
                      { id: 'overview', label: 'Overview' },
                      { id: 'materials', label: 'Study Materials' },
                      { id: 'tests', label: 'Tests' },
                      { id: 'leaderboard', label: 'Ranks' },
                      { id: 'performance', label: 'Tracker' }
                    ].map((item) => {
                      const isSelected = activeTab === item.id;
                      return (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          onClick={() => {
                            setActiveTab(item.id as any);
                            setMobileCurriculumOpen(false);
                          }}
                          className={`w-full block text-left px-2 py-1.5 rounded text-[11px] font-medium transition ${
                            isSelected 
                              ? 'bg-white/20 text-white font-bold border border-white/30 shadow-sm' 
                              : 'text-slate-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span>{item.label}</span>
                        </a>
                      );
                    })}
                  </div>

                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 bg-black/60 border-t border-white/10 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Curriculum: <strong className="text-cyan-300">{student.board} • {student.academicLevel}</strong></span>
                  </div>
                  <Link 
                    href="/dashboard/account"
                    onClick={() => setMobileCurriculumOpen(false)}
                    className="text-cyan-400 hover:text-cyan-300 font-bold transition flex items-center gap-1"
                  >
                    <span>My Profile</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

              </div>
            </>
          )}

          </div>
      </header>

      {/* ========================================================= */}
      {/* 2. UPCOMING TEST MARQUEE ALERT BANNER                    */}
      {/* ========================================================= */}
      {bannerItems.length > 0 && (
        <div className="w-full px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-3 pb-1">
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl overflow-hidden py-2.5 px-4 backdrop-blur-sm shadow-lg">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="shrink-0 text-[11px] font-extrabold bg-amber-500 text-black px-2.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1.5 shadow">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                Test Alert
              </span>
              <div className="flex-1 overflow-hidden relative">
                <div className="animate-marquee whitespace-nowrap inline-block text-xs sm:text-sm font-semibold text-amber-200">
                  {bannerItems.map((item: any, idx: number) => (
                    <span key={idx} className="mr-16" dangerouslySetInnerHTML={{ __html: item.message }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. FEATURED 3D ANIMATIONS SPOTLIGHT (GATEWAY HERO)       */}
      {/* Full Free Space Utilization - No Enclosing Box           */}
      {/* ========================================================= */}
      <section id="overview" className="dashboard-hero relative w-full overflow-hidden bg-transparent py-8 sm:py-14 transition-all duration-300 group">

        {/* Content Container - Utilizing Full Available Space */}
        <div className="relative z-10 w-full px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col justify-between min-h-0 sm:min-h-[300px]">
          
          <div className="space-y-4 max-w-3xl">
            {/* Top Row: Icon */}
            <div className="flex items-start">
              <div className="p-3 sm:p-3.5 rounded-2xl border border-sky-500/30 bg-black text-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.2)] flex items-center justify-center">
                <Atom className="w-6 h-6 sm:w-7 sm:h-7 text-sky-400 animate-spin [animation-duration:15s]" />
              </div>
            </div>

            {/* Title (Dominant Serif Heading) */}
            <div className="space-y-2 pt-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] font-serif">
                3D animations
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-xl text-slate-200/95 font-semibold leading-relaxed drop-shadow">
                Interactive WebGL molecular structures &amp; reaction mechanics
              </p>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-400/90 font-light max-w-2xl leading-relaxed pt-0.5">
                Explore real-time 3D simulations of solid state crystal lattices, atomic voids, and spatial chemical bonding directly in your browser.
              </p>
            </div>

            {/* Far-Left Positioned OLED Black Button with Animated Arrow - Directly below description */}
            <div className="pt-3 sm:pt-4 flex items-center justify-start">
              <Link
                href="/3d-animations"
                className="group/cta inline-flex items-center gap-3 px-6 sm:px-8 py-3.5 rounded-xl bg-black hover:bg-neutral-950 border border-cyan-500/50 hover:border-cyan-400 text-white hover:text-cyan-300 font-bold text-xs sm:text-sm tracking-wide transition-all duration-300 shadow-[0_0_20px_rgba(0,217,255,0.18)] hover:shadow-[0_0_30px_rgba(0,217,255,0.35)] active:scale-95 whitespace-nowrap"
              >
                <span>Explore All Animations</span>
                <span className="inline-flex items-center justify-center animate-arrow-glide">
                  <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                </span>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Main Container */}
      <main className="mcq-shell space-y-6 sm:space-y-10 pt-6 sm:pt-10 flex-1">

        {/* ========================================================= */}
        {/* 4. CONTENT ROW 1: CHEMISTRY DIGITAL LIBRARY & 3D VAULT    */}
        {/* ========================================================= */}
        <ChemistryLibraryVault studyMaterials={studyMaterials} student={data?.student} />

        {/* ========================================================= */}
        {/* 5. CONTENT ROW 2: TESTS & SCHEDULED MOCKS (NETFLIX RAILS) */}
        {/* ========================================================= */}
        <section id="tests" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-1">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Available Tests & Exam Series</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono font-bold">
                  {currentAvailableTests.length} Live
                </span>
              </h2>
              <p className="text-xs text-slate-400">Timed, AI-proctored mock exams aligned to your curriculum</p>
            </div>

            <span className="text-xs text-slate-400">
              Curriculum: <strong className="text-cyan-300">{student.board}</strong>
            </span>
          </div>

          {/* Category Folders Grid (Netflix Style Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            
            {/* Live Tests Card */}
            <Link
              href="/dashboard/category/available"
              className="bg-white/[0.02] hover:bg-white/[0.05] border border-green-500/30 hover:border-green-400 p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm shadow-lg group flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-xl bg-green-950 border border-green-600/50 shadow group-hover:scale-110 transition-transform">
                  <PiechemLogo size="sm" showText={false} isGoldMember={
                      student.subscriptionStatus === "COMPLIMENTARY" || 
                      (student.subscriptionStatus === "PAID" && (!student.subscriptionExpiresAt || new Date(student.subscriptionExpiresAt).getTime() > now.getTime()))
                    } />
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-green-500/20 text-green-300 border border-green-500/40 font-mono">
                  {currentAvailableTests.length} Live
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center justify-between group-hover:text-green-300 transition">
                  <span className="flex items-center gap-2">
                    Available Tests
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                  </span>
                  <ChevronRight className="w-5 h-5 text-green-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-slate-300/80 mt-1">Tests ready to attempt right now with instant scorecards</p>
              </div>
            </Link>

            {/* Upcoming Tests Card */}
            <Link
              href="/dashboard/category/upcoming"
              className="bg-white/[0.02] hover:bg-white/[0.05] border border-amber-500/30 hover:border-amber-400 p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm shadow-lg group flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-xl bg-amber-950 border border-amber-600/50 shadow group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5 text-amber-300" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  {upcomingTests.length} Scheduled
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center justify-between group-hover:text-amber-300 transition">
                  <span>Upcoming Tests</span>
                  <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-slate-300/80 mt-1">Upcoming scheduled exams with countdown unlock windows</p>
              </div>
            </Link>

            {/* Expired Tests Card */}
            <Link
              href="/dashboard/category/expired"
              className="bg-white/[0.02] hover:bg-white/[0.05] border border-red-500/30 hover:border-red-400 p-4 sm:p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm shadow-lg group flex flex-col justify-between min-h-[130px] sm:min-h-[160px]"
            >
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-xl bg-red-950 border border-red-600/50 shadow group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5 text-red-300" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-500/20 text-red-300 border border-red-500/40 font-mono">
                  {expiredTests.length} Expired
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center justify-between group-hover:text-red-300 transition">
                  <span>Concluded Archive</span>
                  <ChevronRight className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-slate-300/80 mt-1">Past papers; request admin access for re-attempts</p>
              </div>
            </Link>

          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. CONTENT ROW 3: HALL OF FAME / TOP PERFORMERS          */}
        {/* ========================================================= */}
        {lastExamTopStudents && lastExamTopStudents.length > 0 && (
          <section id="leaderboard" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-1">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-400 animate-pulse" />
                  <span>Top Performers — {lastExamTitle || "Recent Benchmark Test"}</span>
                </h2>
                <p className="text-xs text-slate-400">Honour roll ranked by aggregate score, speed and accuracy</p>
              </div>
              <span className="text-xs bg-amber-500/10 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30 font-bold">
                Hall of Fame
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lastExamTopStudents.map((st: any) => (
                <div
                  key={st.rank}
                  className={`p-5 rounded-2xl border flex items-center justify-between gap-4 transition-all shadow-xl ${
                    st.rank === 1
                      ? "bg-amber-950/20 border-amber-500/30 backdrop-blur-sm shadow-lg"
                      : "bg-white/[0.02] border-white/10 backdrop-blur-sm shadow-lg"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 border shadow-md ${
                        st.rank === 1
                          ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-black border-amber-300"
                          : "bg-gradient-to-br from-slate-200 to-slate-400 text-black border-slate-100"
                      }`}
                    >
                      #{st.rank}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-base truncate flex items-center gap-2">
                        <span>{st.name}</span>
                        {st.rank === 1 && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold uppercase">
                            🥇 1st Rank
                          </span>
                        )}
                        {st.rank === 2 && (
                          <span className="text-[10px] bg-slate-400/20 text-slate-300 px-2 py-0.5 rounded font-bold uppercase">
                            🥈 2nd Rank
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>Accuracy: <strong className="text-cyan-300 font-bold">{st.accuracy}%</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-2xl font-black text-white">{st.score} <span className="text-xs font-normal text-slate-400">pts</span></div>
                    <div className="text-xs font-bold text-cyan-400">{st.percentage != null ? `${Number(st.percentage).toFixed(1)}%` : '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* 7. CONTENT ROW 4: PERFORMANCE JOURNEY & RESULT TRACKER    */}
        {/* ========================================================= */}
        <section id="performance" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-1">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <span>Your Performance Journey</span>
              </h2>
              <p className="text-xs text-slate-400">Historical attempt records, accuracy trajectory and result analysis</p>
            </div>
          </div>

          {testsTaken === 0 ? (
            /* Empty State Banner (Image 1) */
            <div className="bg-transparent text-center space-y-4 py-8 sm:py-14 max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(0,195,255,0.25)]">
                <Medal className="w-8 h-8 text-cyan-300 animate-pulse" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Start Your Performance Journey</h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                You haven't completed any tests yet. Take your first exam from <Link href="/dashboard/category/available" className="text-cyan-300 font-bold hover:underline">Available Tests</Link> to unlock real-time accuracy, score graphs, and leaderboard insights!
              </p>
              <Link
                href="/dashboard/category/available"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm transition shadow-lg shadow-cyan-950/50"
              >
                <span>View Available Tests</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* Active Analytics & Graph View */
            <div className="space-y-6">
              
              {/* 4 Summary Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white/[0.02] border border-white/10 backdrop-blur-sm p-4 sm:p-5 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-blue-900/30 rounded-xl text-blue-400"><BookOpen className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-400">Tests Taken</p>
                    <p className="text-xl sm:text-2xl font-black text-white">{testsTaken}</p>
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/10 backdrop-blur-sm p-4 sm:p-5 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-green-900/30 rounded-xl text-green-400"><TrendingUp className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-400">Average Score</p>
                    <p className="text-xl sm:text-2xl font-black text-white">{avgScore}%</p>
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/10 backdrop-blur-sm p-4 sm:p-5 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-purple-900/30 rounded-xl text-purple-400"><Trophy className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-400">Best Score</p>
                    <p className="text-xl sm:text-2xl font-black text-white">{bestScore}%</p>
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/10 backdrop-blur-sm p-4 sm:p-5 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-amber-900/30 rounded-xl text-amber-400"><Target className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-400">Avg. Accuracy</p>
                    <p className="text-xl sm:text-2xl font-black text-white">{avgAccuracy}%</p>
                  </div>
                </div>
              </div>

              {/* Performance Line Chart */}
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
                <h3 className="text-base sm:text-lg font-bold text-white mb-4">Score Trajectory Across Tests</h3>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={graphData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="attempt" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#02070c', borderColor: '#0284c7', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#00e5ff' }}
                      />
                      <Line type="monotone" dataKey="percentage" name="Percentage (%)" stroke="#00e5ff" strokeWidth={3} dot={{ r: 4, fill: '#00e5ff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Results Table */}
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                <div className="p-4 sm:p-5 flex justify-between items-center">
                  <h3 className="text-base sm:text-lg font-bold text-white">Recent Test Records</h3>
                  <span className="text-xs text-slate-400">Last {last25Attempts.length} tests</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-800">
                    <thead className="bg-transparent border-b border-white/10">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Test Title</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Date</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Score</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Percentage</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">C / I / U</th>
                        <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-transparent text-xs sm:text-sm">
                      {last25Attempts.map((attempt: any) => (
                        <tr key={attempt.id} className="hover:bg-cyan-950/20 transition">
                          <td className="px-5 py-3.5 font-semibold text-white whitespace-nowrap">{attempt.test.title}</td>
                          <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">{new Date(attempt.submittedAt).toLocaleDateString()}</td>
                          <td className="px-5 py-3.5 font-bold text-white whitespace-nowrap">{attempt.score}</td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                              (attempt.percentage ?? 0) >= 80 ? 'bg-green-950 text-green-300 border border-green-800' :
                              (attempt.percentage ?? 0) >= 60 ? 'bg-yellow-950 text-yellow-300 border border-yellow-800' :
                              'bg-red-950 text-red-300 border border-red-800'
                            }`}>
                              {attempt.percentage != null ? `${Number(attempt.percentage).toFixed(1)}%` : '-'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono whitespace-nowrap">
                            <span className="text-green-400 font-bold">{attempt.correctCount}</span> / <span className="text-red-400 font-bold">{attempt.incorrectCount}</span> / <span className="text-slate-400 font-bold">{attempt.unansweredCount}</span>
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <Link href={`/exam/result/${attempt.id}`} className="text-cyan-400 hover:text-cyan-300 font-bold inline-flex items-center gap-1">
                              <span>View</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </section>

        


        {/* AI Floating Summon Button for Mobile & Desktop */}
        <div className="fixed bottom-28 right-4 sm:right-6 z-40">
          <button
            type="button"
            onClick={() => handleOpenAiTutor("tutor")}
            className="group flex items-center gap-2.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-800 hover:from-red-500 hover:to-rose-500 px-4 py-3 text-white shadow-2xl shadow-red-950/70 hover:shadow-red-900/50 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-red-500/40 backdrop-blur-xl"
          >
            <PiechemAiLogo size="xs" animated />
            <span className="font-bold text-xs sm:text-sm tracking-tight pr-1">Ask PIECHEM AI</span>
          </button>
        </div>



        {/* AI Adaptive Drill Modal */}
        <AdaptiveQuizModal
          isOpen={isAdaptiveQuizOpen}
          onClose={() => setIsAdaptiveQuizOpen(false)}
          targetTopic={adaptiveDrillTopic}
        />
      
</main>
      {/* Global Footer - Pinned to very bottom, extending far right & left */}
      <GlobalFooter />
    </div>
  );
}
