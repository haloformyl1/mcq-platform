"use client";
import GlobalFooter from "@/components/GlobalFooter";
import GlobalHeader from "@/components/GlobalHeader";
import AdaptiveQuizModal from "@/components/ai/AdaptiveQuizModal";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Atom, BookOpen, Trophy, Target, TrendingUp, ChevronRight, ChevronDown, 
  LogOut, Medal, AlertCircle, FileText, Image as ImageIcon, Link as LinkIcon, 
  Download, ExternalLink, FolderOpen, Clock, User, Play, Info, Sparkles, 
  Flame, ShieldCheck, CheckCircle2, Award, Bell, X, Check, Lock as LockIcon
, ArrowRight } from 'lucide-react';
import AdminPreviewBanner from "@/components/AdminPreviewBanner";
import PiechemLogo from "@/components/PiechemLogo";
import MolecularOrbitalCanvas from "@/components/3d/MolecularOrbitalCanvas";
import PiechemAiLogo from "@/components/ai/PiechemAiLogo";
import PiFiringLoader from "@/components/PiFiringLoader";
import SubscriptionExpiredModal from "@/components/SubscriptionExpiredModal";
import GoldUpgradeCelebrationModal from "@/components/GoldUpgradeCelebrationModal";
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
    const isUltra = data.student.subscriptionStatus === "ULTRA" || data.student.subscriptionStatus === "COMPLIMENTARY";
    const isPaid = data.student.subscriptionStatus === "PAID" && (!data.student.subscriptionExpiresAt || new Date(data.student.subscriptionExpiresAt).getTime() > now.getTime());
    const isGold = isUltra || isPaid;

    if (typeof window !== "undefined") {
      try {
        if (isGold) {
          localStorage.setItem("piechem_is_gold", "true");
          if (isUltra) {
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
    window.location.href = "/";
  };

  if (loading) {
    return <PiFiringLoader fullScreen={true} />;
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-transparent text-white flex flex-col items-center justify-center p-4">
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



  // Upcoming Alert Banner Items - Track the complete UPCOMING workflow
  const bannerItems: any[] = [];
  (availableTests || []).forEach((t: any) => {
    const lockDate = t.lockAt ? new Date(t.lockAt) : null;
    const unlockDate = t.unlockAt ? new Date(t.unlockAt) : null;
    const holdMinutes = t.postLockHoldMinutes ?? 0;
    const autoLiveDate = lockDate ? new Date(lockDate.getTime() + holdMinutes * 60 * 1000) : null;

    if (t.status === "UPCOMING") {
      if (unlockDate && now < unlockDate) {
        bannerItems.push({
          type: "UPCOMING",
          test: t,
          message: `Upcoming Test <strong class="text-white bg-amber-900/80 px-2 py-0.5 rounded border border-amber-600/50">${t.title}</strong> is scheduled to go live on <strong class="text-amber-300 font-mono">${formatDateTime(unlockDate)}</strong>. Please prepare to attempt!`
        });
      } else if (!unlockDate && (!lockDate || now < lockDate)) {
        bannerItems.push({
          type: "UPCOMING",
          test: t,
          message: `Upcoming Test <strong class="text-white bg-amber-900/80 px-2 py-0.5 rounded border border-amber-600/50">${t.title}</strong> is scheduled to go live soon. Please prepare to attempt!`
        });
      } else if (unlockDate && now >= unlockDate && (!lockDate || now < lockDate)) {
        bannerItems.push({
          type: "LIVE",
          test: t,
          message: `Live Now: <strong class="text-white bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-600/50">${t.title}</strong> is currently active. Attempt now before it concludes!`
        });
      } else if (lockDate && now >= lockDate && autoLiveDate && now < autoLiveDate) {
        bannerItems.push({
          type: "HOLDING",
          test: t,
          message: `Test <strong class="text-white bg-orange-900/80 px-2 py-0.5 rounded border border-orange-600/50">${t.title}</strong> has concluded. It will be released for all students on <strong class="text-orange-300 font-mono">${formatDateTime(autoLiveDate)}</strong>.`
        });
      }
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      <AdminPreviewBanner />
      <SubscriptionExpiredModal student={data?.student} />
      <GoldUpgradeCelebrationModal student={student || data?.student} />

      {/* ========================================================= */}
      {/* 1. TOP NAVBAR (NETFLIX GLOBAL HEADER INSPIRATION)         */}
      {/* ========================================================= */}
      {/* 1. TOP NAVBAR (UNIFIED RESPONSIVE GLOBAL HEADER WITH MOBILE DRAWER) */}
      <GlobalHeader
        student={student}
        upgradeReq={data?.upgradeReq || (Array.isArray(student?.upgradeRequests) ? student.upgradeRequests[0] : null)}
        onCurriculumChange={handleCurriculumChange}
        updatingCurriculum={updatingCurriculum}
        isGoldMember={
          student.subscriptionStatus === "ULTRA" ||
          student.subscriptionStatus === "COMPLIMENTARY" || 
          (student.subscriptionStatus === "PAID" && (!student.subscriptionExpiresAt || new Date(student.subscriptionExpiresAt).getTime() > now.getTime()))
        }
      />

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
                <div className="animate-marquee whitespace-nowrap inline-block text-xs sm:text-sm font-semibold">
                  {bannerItems.map((item: any, idx: number) => {
                    let textColor = "text-amber-200";
                    if (item.type === "LIVE") textColor = "text-emerald-200";
                    else if (item.type === "HOLDING") textColor = "text-orange-200";
                    return (
                      <span key={idx} className={`mr-16 ${textColor}`} dangerouslySetInnerHTML={{ __html: item.message }} />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* ========================================================= */}
      {/* 3. FEATURED 3D ANIMATIONS SPOTLIGHT (GATEWAY HERO)       */}
      {/* ========================================================= */}
      <section id="overview" className="dashboard-hero relative w-full overflow-hidden bg-transparent !pt-12 sm:!pt-14 pb-6 sm:pb-8 transition-all duration-300 group">
        {/* Content Container - Far Left Aligned */}
        <div className="relative z-10 w-full px-3 sm:px-6 lg:px-8 flex flex-col justify-between">
          
          <div className="space-y-4 max-w-3xl">
            {/* Top Row: Icon & Pill Badge */}
            <div className="flex items-center gap-3">
              <div className="p-3 sm:p-3.5 rounded-2xl border border-cyan-400/30 bg-gradient-to-b from-[#0e172a] to-black text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center">
                <Atom className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400 animate-spin [animation-duration:18s]" />
              </div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase tracking-widest shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Interactive Lab
              </span>
            </div>

            {/* Title & Subtitle */}
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

            {/* Positioned OLED Black Button with Animated Arrow */}
            <div className="pt-2 sm:pt-3 flex items-center justify-start">
              <Link
                href="/3d-animations"
                className="group/cta inline-flex items-center gap-3 px-7 sm:px-9 py-3.5 rounded-xl bg-black hover:bg-neutral-950 border border-cyan-500/50 hover:border-cyan-400 text-white hover:text-cyan-300 font-bold text-xs sm:text-sm tracking-wide transition-all duration-300 shadow-[0_0_25px_rgba(0,217,255,0.25)] hover:shadow-[0_0_35px_rgba(0,217,255,0.45)] active:scale-95 whitespace-nowrap"
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

      {/* ========================================================= */}
      {/* 4. CONTENT ROW 1: CHEMISTRY DIGITAL LIBRARY & 3D VAULT    */}
      {/* ========================================================= */}
      <section className="dashboard-hero relative w-full overflow-hidden bg-transparent py-2 transition-all duration-300">
        <ChemistryLibraryVault studyMaterials={studyMaterials} student={data?.student} />
      </section>

      {/* ========================================================= */}
      {/* 5. CONTENT ROW 2: TESTS & SCHEDULED MOCKS (NETFLIX RAILS) */}
      {/* ========================================================= */}
      <section id="tests" className="dashboard-hero relative w-full overflow-hidden bg-transparent py-4 sm:py-6 transition-all duration-300">
        <div className="w-full px-3 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-1">
            <div className="space-y-4 max-w-3xl">
              {/* Top Row: Icon & Pill Badge */}
              <div className="flex items-center gap-3">
                <div className="p-3 sm:p-3.5 rounded-2xl border border-cyan-400/30 bg-gradient-to-b from-[#0e172a] to-black text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center">
                  <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400 animate-pulse" />
                </div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase tracking-widest shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Examination Arena
                </span>
              </div>

              {/* Title & Introduction */}
              <div className="space-y-2 pt-1">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] font-serif flex items-center gap-2">
                  <span>Available Tests &amp; Exam Series</span>
                </h1>

                {/* Subtitle - matching 3D animations & Study Materials */}
                <p className="text-base sm:text-xl text-slate-200/95 font-semibold leading-relaxed drop-shadow">
                  Timed, AI-proctored mock exams aligned to your curriculum
                </p>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-400/90 font-light max-w-2xl leading-relaxed pt-0.5">
                  Real-time exam hall simulation with instant ranking, detailed diagnostic analytics, and negative marking enforcement.
                </p>
              </div>
            </div>

            <span className="text-xs text-slate-400 font-mono bg-white/[0.03] border border-white/10 px-3 py-1.5 rounded-xl">
              Curriculum: <strong className="text-cyan-300">{student.board}</strong>
            </span>
          </div>

          {/* Category Folders Grid (Netflix Style Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            
            {/* Live Tests Card */}
            <Link
              href="/dashboard/category/available"
              className="bg-white/[0.02] hover:bg-white/[0.05] border border-green-500/30 hover:border-green-400 p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm shadow-lg group flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-xl bg-green-950 border border-green-600/50 shadow group-hover:scale-110 transition-transform">
                  <PiechemLogo size="sm" showText={false} isGoldMember={
                      student.subscriptionStatus === "ULTRA" ||
                      student.subscriptionStatus === "COMPLIMENTARY" || 
                      (student.subscriptionStatus === "PAID" && (!student.subscriptionExpiresAt || new Date(student.subscriptionExpiresAt).getTime() > now.getTime()))
                    } />
                </div>
                
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
        </div>
      </section>

      {/* Main Container */}
      <main className="mcq-shell space-y-6 sm:space-y-10 pt-6 sm:pt-10 flex-1">

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
            /* Premium Full-Width Performance Onboarding Hero */
            <div className="dashboard-performance-banner relative w-full rounded-3xl bg-gradient-to-b from-[#091524]/90 via-[#050c18]/90 to-[#02050a]/98 border border-white/10 p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-xl">
              {/* Ambient Radial Backlight */}
              <div className="pointer-events-none absolute -top-16 -right-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl" />

              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
                {/* Left: Heading & Call to Action */}
                <div className="space-y-4 max-w-xl text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-black uppercase tracking-widest shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    Analytics Awaiting First Test
                  </div>

                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    Start Your Performance Journey
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed font-light">
                    You haven't completed any exams yet. Attempt your first test from <Link href="/dashboard/category/available" className="text-cyan-300 font-bold hover:underline">Available Tests</Link> to unlock AI-powered accuracy trajectory, speed percentiles, score distribution, and leaderboard ranking!
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                    <Link
                      href="/dashboard/category/available"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:brightness-110 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-95"
                    >
                      <span>Take Available Test</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>

                    <Link
                      href="/dashboard/category/upcoming"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white font-bold text-xs transition"
                    >
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>View Upcoming Schedule</span>
                    </Link>
                  </div>
                </div>

                {/* Right: 3 Interactive Feature Benefit Highlights (Utilizing Empty Space) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3.5 w-full lg:max-w-md shrink-0">
                  <div className="flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm hover:border-cyan-500/30 transition">
                    <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">Accuracy Trajectory</h4>
                      <p className="text-[11px] text-slate-400 leading-snug mt-0.5">Real-time percentage curves plotted across every chapter test.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm hover:border-amber-500/30 transition">
                    <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <Trophy className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">National Percentiles</h4>
                      <p className="text-[11px] text-slate-400 leading-snug mt-0.5">Automated benchmark comparison against state toppers.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm hover:border-purple-500/30 transition">
                    <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">Chapter-Wise Diagnostic</h4>
                      <p className="text-[11px] text-slate-400 leading-snug mt-0.5">Weakness identification in Physical, Inorganic &amp; Organic Chemistry.</p>
                    </div>
                  </div>
                </div>
              </div>
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
                <div className="dashboard-chart-container w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={graphData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="attempt" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10 }} /><YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10 }} domain={[0, 100]} />
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

                <div className="overflow-x-auto dashboard-results-table-wrap -webkit-overflow-scrolling-touch">
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



