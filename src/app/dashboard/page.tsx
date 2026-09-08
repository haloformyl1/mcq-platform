"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  BookOpen, Trophy, Target, TrendingUp, ChevronRight, ChevronDown, 
  LogOut, Medal, AlertCircle, FileText, Image as ImageIcon, Link as LinkIcon, 
  Download, ExternalLink, FolderOpen, Clock, User, Play, Info, Sparkles, 
  Flame, ShieldCheck, CheckCircle2, Award, Bell, Phone
} from 'lucide-react';
import AdminPreviewBanner from "@/components/AdminPreviewBanner";
import PiechemLogo from "@/components/PiechemLogo";
import PiFiringLoader from "@/components/PiFiringLoader";
import SubscriptionExpiredModal from "@/components/SubscriptionExpiredModal";
import GoldUpgradeCelebrationModal from "@/components/GoldUpgradeCelebrationModal";
import NotificationCenterDropdown from "@/components/NotificationCenterDropdown";

export default function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [studyMaterials, setStudyMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  const router = useRouter();
  const [updatingCurriculum, setUpdatingCurriculum] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "tests" | "materials" | "leaderboard" | "performance">("overview");

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
          router.push("/");
          return;
        }
        setData(data);
        if (typeof window !== "undefined") {
          const isGold = data.student?.subscriptionStatus === "PAID" || data.student?.subscriptionStatus === "COMPLIMENTARY";
          localStorage.setItem("piechem_is_gold", isGold ? "true" : "false");
          window.dispatchEvent(new Event("piechem_gold_status_changed"));
        }
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

  const handleLogout = async () => {
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

  // Pick Spotlight Featured Item (Netflix Billboard)
  const activeAttemptTest = currentAvailableTests.find((t: any) => 
    allAttempts.some((a: any) => a.testId === t.id && a.status === 'IN_PROGRESS')
  );
  const unattemptedTest = currentAvailableTests.find((t: any) => 
    !allAttempts.some((a: any) => a.testId === t.id && a.status === 'SUBMITTED')
  );
  const spotlightTest = activeAttemptTest || unattemptedTest || currentAvailableTests[0] || upcomingTests[0] || null;

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
    <div className="min-h-screen bg-[#030910] text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200 pb-20">
      <AdminPreviewBanner />
      <SubscriptionExpiredModal student={data?.student} />
      <GoldUpgradeCelebrationModal student={student || data?.student} />

      {/* ========================================================= */}
      {/* 1. TOP NAVBAR (NETFLIX GLOBAL HEADER INSPIRATION)         */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 bg-[#030910]/95 backdrop-blur-2xl border-b border-cyan-500/20 shadow-[0_10px_35px_rgba(0,0,0,0.7)]">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            
            {/* Left Group: Brand Identity & Designer Attribution at Far Left for Mobile & Desktop */}
            <div className="flex items-center gap-3 sm:gap-5 min-w-0 shrink-0">
              
              {/* Horizontal Logo + Designer Badge Side-by-Side (Image 1 style) */}
              <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
                <PiechemLogo size="md" href="/dashboard" isGoldMember={student.subscriptionStatus === "PAID" || student.subscriptionStatus === "COMPLIMENTARY"} />
                
                <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-[#061421]/90 text-[9px] sm:text-[10px] font-medium shadow-sm shrink-0">
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

              {/* Netflix-Style Nav Tabs (Desktop - directly adjacent to logo) */}
              <nav className="hidden lg:flex items-center gap-1.5 shrink-0">
                <a 
                  href="#overview" 
                  onClick={() => setActiveTab("overview")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === "overview" 
                      ? "bg-white text-black shadow-md shadow-white/10" 
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Overview
                </a>
                <a 
                  href="#tests" 
                  onClick={() => setActiveTab("tests")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === "tests" 
                      ? "bg-white text-black shadow-md shadow-white/10" 
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Available Tests
                </a>
                <a 
                  href="#materials" 
                  onClick={() => setActiveTab("materials")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === "materials" 
                      ? "bg-white text-black shadow-md shadow-white/10" 
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  3D Notes & Lab
                </a>
                <a 
                  href="#leaderboard" 
                  onClick={() => setActiveTab("leaderboard")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === "leaderboard" 
                      ? "bg-white text-black shadow-md shadow-white/10" 
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Top Performers
                </a>
                <a 
                  href="#performance" 
                  onClick={() => setActiveTab("performance")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === "performance" 
                      ? "bg-white text-black shadow-md shadow-white/10" 
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  My Tracker
                </a>
              </nav>
            </div>

            {/* Right Group: Curriculum Switcher + Account Profile + Logout */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              


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

              {/* Logout Button */}
              <button 
                onClick={handleLogout} 
                className="p-1.5 rounded-xl bg-red-950/30 hover:bg-red-900/60 border border-red-800/40 text-red-400 hover:text-red-300 transition shrink-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile / Tablet Dedicated Navigation Rail (Zero Scrollbar) */}
          <div className="lg:hidden w-full pt-2.5 mt-2 border-t border-cyan-500/15 overflow-x-auto no-scrollbar flex items-center gap-1.5">
            <a 
              href="#overview" 
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "overview" 
                  ? "bg-white text-black shadow-sm" 
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              Overview
            </a>
            <a 
              href="#tests" 
              onClick={() => setActiveTab("tests")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "tests" 
                  ? "bg-white text-black shadow-sm" 
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              Available Tests
            </a>
            <a 
              href="#materials" 
              onClick={() => setActiveTab("materials")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "materials" 
                  ? "bg-white text-black shadow-sm" 
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              3D Notes & Lab
            </a>
            <a 
              href="#leaderboard" 
              onClick={() => setActiveTab("leaderboard")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "leaderboard" 
                  ? "bg-white text-black shadow-sm" 
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              Top Performers
            </a>
            <a 
              href="#performance" 
              onClick={() => setActiveTab("performance")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "performance" 
                  ? "bg-white text-black shadow-sm" 
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              My Tracker
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 pt-6">

        {/* ========================================================= */}
        {/* 2. UPCOMING TEST MARQUEE ALERT BANNER                    */}
        {/* ========================================================= */}
        {bannerItems.length > 0 && (
          <div className="bg-gradient-to-r from-amber-950/80 via-[#1a140d]/90 to-amber-950/80 border border-amber-500/40 rounded-2xl overflow-hidden py-2.5 px-4 shadow-lg shadow-amber-950/30">
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
        )}

        {/* ========================================================= */}
        {/* 3. FEATURED SPOTLIGHT BILLBOARD (NETFLIX HERO - IMAGE 2) */}
        {/* ========================================================= */}
        <section id="overview" className="relative rounded-3xl overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-[#061524] via-[#040e18] to-[#02070c] shadow-[0_20px_60px_rgba(0,180,255,0.15)]">
          
          {/* Ambient Lighting & Abstract Chemistry Backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_75%_35%,rgba(0,195,255,0.18),transparent_65%)] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#02070c] via-transparent to-transparent pointer-events-none" />
          
          {/* Faint Orbital Graphic Texture */}
          <div className="absolute -right-10 -bottom-10 w-96 h-96 border border-cyan-500/10 rounded-full pointer-events-none blur-[1px]" />
          <div className="absolute -right-20 -bottom-20 w-[500px] h-[500px] border border-cyan-500/5 rounded-full pointer-events-none" />

          {/* Billboard Content */}
          <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-3xl flex flex-col justify-between min-h-[360px] sm:min-h-[420px]">
            
            <div>
              {/* Category / Meta Badges Row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(0,195,255,0.4)] uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  {spotlightTest ? (spotlightTest.lockState === "SCHEDULED_OPEN" ? "Live Now" : "Featured Mock") : "Master Series"}
                </span>
                
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-slate-200 border border-white/10">
                  {student.board || 'CBSE'} • {student.board === 'WBCHSE' ? student.academicLevel : `Class ${student.academicLevel}`}
                </span>

                {spotlightTest?.durationMinutes && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-cyan-300 border border-white/10 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {spotlightTest.durationMinutes} Mins
                  </span>
                )}

                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  AI Proctored
                </span>

                {student.subscriptionStatus === "PAID" && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/30 to-yellow-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Gold Pass Active • Unlimited Attempts
                  </span>
                )}
              </div>

              {/* Big Stylized Title (Image 2 Netflix billboard title) */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase leading-tight mb-4 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                {spotlightTest ? spotlightTest.title : "PIE CHEM EXAM SERIES 2026"}
              </h1>

              {/* Description */}
              <p className="text-sm sm:text-base text-slate-200/90 max-w-2xl leading-relaxed mb-8 drop-shadow">
                {spotlightTest?.description 
                  ? spotlightTest.description 
                  : "Practice full-length timed chemistry mocks designed specifically for board exam perfection and competitive entrance benchmark rankings with instant AI evaluation."}
              </p>
            </div>

            {/* Actions & Floating Tags Row (Netflix Style) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-cyan-500/20">
              
              {/* Action CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {spotlightTest ? (
                  activeAttemptTest ? (
                    <Link
                      href={`/exam/start/${spotlightTest.id}`}
                      className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-xl bg-white hover:bg-slate-200 text-black font-extrabold text-sm sm:text-base transition duration-200 shadow-[0_0_25px_rgba(255,255,255,0.4)] active:scale-95"
                    >
                      <Play className="w-5 h-5 fill-current text-black" />
                      <span>Resume Test</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/exam/start/${spotlightTest.id}`}
                      className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-xl bg-white hover:bg-slate-200 text-black font-extrabold text-sm sm:text-base transition duration-200 shadow-[0_0_25px_rgba(255,255,255,0.4)] active:scale-95"
                    >
                      <Play className="w-5 h-5 fill-current text-black" />
                      <span>Start Test</span>
                    </Link>
                  )
                ) : (
                  <a
                    href="#tests"
                    className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-xl bg-white hover:bg-slate-200 text-black font-extrabold text-sm sm:text-base transition duration-200 shadow-[0_0_25px_rgba(255,255,255,0.4)] active:scale-95"
                  >
                    <Play className="w-5 h-5 fill-current text-black" />
                    <span>Explore Tests</span>
                  </a>
                )}

                <a
                  href="#materials"
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base border border-white/20 backdrop-blur-md transition duration-200 active:scale-95"
                >
                  <Info className="w-5 h-5 text-cyan-300" />
                  <span>3D Notes & Lab</span>
                </a>
              </div>

              {/* Floating Bottom-Right Badges (Image 2 style: "Highly rewatched", "Emmy Nominee") */}
              <div className="flex items-center gap-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/30 text-xs font-bold text-cyan-300 shadow">
                  <Flame className="w-3.5 h-3.5 fill-current text-cyan-400" />
                  <span>Most Attempted Mock</span>
                </div>
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-500/30 text-xs font-bold text-amber-300 shadow">
                  <Sparkles className="w-3.5 h-3.5 fill-current text-amber-400" />
                  <span>High Yield Content</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. CONTENT ROW 1: TESTS & SCHEDULED MOCKS (NETFLIX RAILS) */}
        {/* ========================================================= */}
        <section id="tests" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-cyan-500/20 pb-3">
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
              className="bg-gradient-to-b from-[#0e241b]/90 to-[#07130e]/90 border border-green-500/40 hover:border-green-400 p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] shadow-xl group flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-xl bg-green-950 border border-green-600/50 shadow group-hover:scale-110 transition-transform">
                  <PiechemLogo size="sm" showText={false} />
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
              className="bg-gradient-to-b from-[#241a0e]/90 to-[#130e07]/90 border border-amber-500/40 hover:border-amber-400 p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] shadow-xl group flex flex-col justify-between min-h-[160px]"
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
              className="bg-gradient-to-b from-[#240e11]/90 to-[#130708]/90 border border-red-500/40 hover:border-red-400 p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] shadow-xl group flex flex-col justify-between min-h-[160px]"
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
        {/* 5. CONTENT ROW 2: STUDY MATERIALS & 3D CHEMISTRY LAB      */}
        {/* ========================================================= */}
        <section id="materials" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-cyan-500/20 pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Interactive 3D Laboratory & Study Vault</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono font-bold">
                  {studyMaterials.length} Available
                </span>
              </h2>
              <p className="text-xs text-slate-400">Manipulate molecular lattices, 3D crystal voids & download curated PDF guides</p>
            </div>
          </div>

          {studyMaterials.length === 0 ? (
            <div className="bg-[#071420]/80 border border-cyan-900/30 p-8 rounded-2xl text-center text-slate-400 space-y-2">
              <BookOpen className="w-8 h-8 text-cyan-500/50 mx-auto" />
              <p className="text-sm font-medium">No study materials published yet for this curriculum.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {studyMaterials.map((mat: any) => {
                const isPdf = mat.type === "PDF";
                const isImage = mat.type === "IMAGE";

                return (
                  <div 
                    key={mat.id} 
                    className="group bg-gradient-to-b from-[#0c1a27] to-[#061019] border border-cyan-500/25 hover:border-cyan-400/60 p-6 rounded-2xl flex flex-col justify-between gap-5 shadow-xl hover:shadow-[0_0_30px_rgba(0,195,255,0.2)] transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
                  >
                    <div className="space-y-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-md text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 shadow ${
                          isPdf
                            ? "bg-red-950/90 text-red-300 border border-red-800/60"
                            : isImage
                            ? "bg-purple-950/90 text-purple-300 border border-purple-800/60"
                            : "bg-cyan-950/90 text-cyan-300 border border-cyan-500/50"
                        }`}>
                          {isPdf && <FileText className="w-3.5 h-3.5" />}
                          {isImage && <ImageIcon className="w-3.5 h-3.5" />}
                          {!isPdf && !isImage && <LinkIcon className="w-3.5 h-3.5" />}
                          {mat.type === "LINK" ? "3D Interactive Lab" : mat.type}
                        </span>
                        {mat.fileSize && <span className="text-[11px] text-slate-400 font-mono">{mat.fileSize}</span>}
                      </div>

                      <h3 className="font-bold text-white text-base sm:text-lg group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                        {mat.title}
                      </h3>
                      {mat.description && (
                        <p className="text-xs text-slate-300/80 line-clamp-3 leading-relaxed">
                          {mat.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-cyan-950 flex justify-end relative z-10">
                      {mat.isPremium && (student?.subscriptionStatus !== "PAID" && student?.subscriptionStatus !== "COMPLIMENTARY") ? (
                        <Link
                          href="/dashboard/account"
                          className="w-full text-center py-2.5 px-4 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition shadow-md uppercase tracking-wider"
                        >
                          ⭐ Gold Member Access Required
                        </Link>
                      ) : (
                        <a
                          href={mat.url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,195,255,0.3)] active:scale-95"
                        >
                          <span>{mat.type === "LINK" ? "Open Interactive Model" : "View / Download"}</span>
                          {mat.type === "LINK" ? <ExternalLink className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* 6. CONTENT ROW 3: HALL OF FAME / TOP PERFORMERS          */}
        {/* ========================================================= */}
        {lastExamTopStudents && lastExamTopStudents.length > 0 && (
          <section id="leaderboard" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-cyan-500/20 pb-3">
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
                      ? "bg-gradient-to-r from-[#241a0c] via-[#140e06] to-[#0c0803] border-amber-500/50 shadow-amber-950/20"
                      : "bg-gradient-to-r from-[#141b24] via-[#0b1016] to-[#070a0e] border-slate-400/40"
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-cyan-500/20 pb-3">
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
            <div className="bg-gradient-to-r from-[#061524] via-[#040e18] to-[#02070c] border border-cyan-500/30 p-8 sm:p-12 rounded-3xl text-center shadow-xl space-y-4 relative overflow-hidden">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(0,195,255,0.25)]">
                <Medal className="w-8 h-8 text-cyan-300 animate-pulse" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Start Your Performance Journey</h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                You haven't completed any tests yet. Take your first exam from <strong className="text-cyan-300">Available Tests</strong> to unlock real-time accuracy, score graphs, and leaderboard insights!
              </p>
              <a
                href="#tests"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm transition shadow-lg shadow-cyan-950/50"
              >
                <span>View Available Tests</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          ) : (
            /* Active Analytics & Graph View */
            <div className="space-y-6">
              
              {/* 4 Summary Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-[#07131f]/90 border border-cyan-500/20 p-4 sm:p-5 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-blue-900/30 rounded-xl text-blue-400"><BookOpen className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-400">Tests Taken</p>
                    <p className="text-xl sm:text-2xl font-black text-white">{testsTaken}</p>
                  </div>
                </div>
                <div className="bg-[#07131f]/90 border border-cyan-500/20 p-4 sm:p-5 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-green-900/30 rounded-xl text-green-400"><TrendingUp className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-400">Average Score</p>
                    <p className="text-xl sm:text-2xl font-black text-white">{avgScore}%</p>
                  </div>
                </div>
                <div className="bg-[#07131f]/90 border border-cyan-500/20 p-4 sm:p-5 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-purple-900/30 rounded-xl text-purple-400"><Trophy className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-400">Best Score</p>
                    <p className="text-xl sm:text-2xl font-black text-white">{bestScore}%</p>
                  </div>
                </div>
                <div className="bg-[#07131f]/90 border border-cyan-500/20 p-4 sm:p-5 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-amber-900/30 rounded-xl text-amber-400"><Target className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-400">Avg. Accuracy</p>
                    <p className="text-xl sm:text-2xl font-black text-white">{avgAccuracy}%</p>
                  </div>
                </div>
              </div>

              {/* Performance Line Chart */}
              <div className="bg-[#061421]/90 border border-cyan-500/25 rounded-2xl p-6 shadow-xl">
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
              <div className="bg-[#061421]/90 border border-cyan-500/25 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 sm:p-5 border-b border-cyan-500/20 flex justify-between items-center">
                  <h3 className="text-base sm:text-lg font-bold text-white">Recent Test Records</h3>
                  <span className="text-xs text-slate-400">Last {last25Attempts.length} tests</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-800">
                    <thead className="bg-[#030910]">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Test Title</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Date</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Score</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Percentage</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">C / I / U</th>
                        <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-[#040e17]/50 text-xs sm:text-sm">
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

      </main>
    </div>
  );
}
