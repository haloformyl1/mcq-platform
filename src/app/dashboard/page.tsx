"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BookOpen, Trophy, Target, TrendingUp, ChevronRight, ChevronDown, LogOut, Medal, AlertCircle, FileText, Image as ImageIcon, Link as LinkIcon, Download, ExternalLink, FolderOpen, Clock, User } from 'lucide-react';
import AdminPreviewBanner from "@/components/AdminPreviewBanner";
import PiechemLogo from "@/components/PiechemLogo";
import PiFiringLoader from "@/components/PiFiringLoader";

export default function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [studyMaterials, setStudyMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // Collapsible Folder Accordion States
  const [openUpcoming, setOpenUpcoming] = useState(true);
  const [openLive, setOpenLive] = useState(true);
  const [openExpired, setOpenExpired] = useState(true);
  const router = useRouter();

  const [updatingCurriculum, setUpdatingCurriculum] = useState(false);

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
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-4">Unable to load dashboard</h2>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#262626] rounded-md hover:bg-[#333333]">Retry</button>
      </div>
    );
  }

  const { student, availableTests, allAttempts, lastExamTopStudents, lastExamTitle } = data;
  const completedAttempts = allAttempts.filter((a: any) => a.status === 'SUBMITTED');
  
  // Analytics Calculations
  const testsTaken = completedAttempts.length;
  const avgScore = testsTaken > 0 ? (completedAttempts.reduce((acc: number, a: any) => acc + (a.percentage || 0), 0) / testsTaken).toFixed(1) : 0;
  const bestScore = testsTaken > 0 ? Math.max(...completedAttempts.map((a: any) => a.percentage || 0)).toFixed(1) : 0;
  
  const totalCorrect = completedAttempts.reduce((acc: number, a: any) => acc + (a.correctCount || 0), 0);
  const totalQuestionsAttempted = completedAttempts.reduce((acc: number, a: any) => acc + (a.correctCount || 0) + (a.incorrectCount || 0), 0);
  const avgAccuracy = totalQuestionsAttempted > 0 ? ((totalCorrect / totalQuestionsAttempted) * 100).toFixed(1) : 0;

  // Graph Data (Oldest to Newest for chronological graph)
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

  const bannerItems: any[] = [];
  (availableTests || []).forEach((t: any) => {
    const unlock = t.unlockAt ? new Date(t.unlockAt) : null;
    const lock = t.lockAt ? new Date(t.lockAt) : null;

    if (t.status === "UPCOMING") {
      if (unlock && now < unlock) {
        // State 3: Before getting live (not live yet)
        bannerItems.push({
          type: "UPCOMING",
          test: t,
          message: `📢 Upcoming Test <strong class="text-white bg-amber-900/80 px-2 py-0.5 rounded border border-amber-600/50">${t.title}</strong> is scheduled to go live on <strong class="text-amber-300 font-mono">${formatDateTime(unlock)}</strong>. Please prepare to attempt the test!`
        });
      } else if (!lock || now < lock) {
        // State 1: At unlock state (currently live)
        bannerItems.push({
          type: "UPCOMING",
          test: t,
          message: `🔥 Upcoming Test <strong class="text-white bg-green-950 px-2 py-0.5 rounded border border-green-600/60">${t.title}</strong> is currently live! ${lock ? `It will conclude on <strong class="text-green-300 font-mono">${formatDateTime(lock)}</strong>.` : 'Available for all students.'}`
        });
      } else {
        // State 2: Concluded (live window passed)
        // Show notification for next 72 hours from the time it concluded; after that stop the notification.
        const concludedAt = lock;
        const msSinceConclusion = concludedAt ? now.getTime() - concludedAt.getTime() : Infinity;
        const maxHoldMs = 72 * 60 * 60 * 1000; // 72 hours

        if (concludedAt && msSinceConclusion >= 0 && msSinceConclusion <= maxHoldMs) {
          bannerItems.push({
            type: "UPCOMING",
            test: t,
            message: `⌛ Upcoming Test <strong class="text-white bg-red-950 px-2 py-0.5 rounded border border-red-600/60">${t.title}</strong> concluded at <strong class="text-red-300 font-mono">${formatDateTime(lock)}</strong>. Students who missed this test may request the Admin to unlock access.`
          });
        }
      }
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black text-white font-sans pb-20">
      <AdminPreviewBanner />

            {/* Unified Navigation & Curriculum Command Bar */}
      <header className="border-b border-cyan-500/25 bg-[#061019]/95 backdrop-blur-2xl sticky top-0 z-40 shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
        <div className="w-full py-2.5 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap lg:flex-nowrap justify-between items-center gap-3 sm:gap-4">
            
            {/* Left: Brand Identity & Designer Contact */}
            <div className="flex items-center gap-3 shrink-0">
              <PiechemLogo size="md" href="/dashboard" />
              
              <div className="hidden sm:flex px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)] text-[11px] text-slate-300 font-semibold tracking-wide items-center space-x-1.5">
                <span className="text-slate-400">Designed by</span>
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400">
                  Arghyadeep Roy
                </span>
                <span className="text-cyan-500/40">·</span>
                <a 
                  href="tel:9830507435" 
                  className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 hover:text-white hover:bg-cyan-600/80 border border-cyan-500/40 transition-all font-mono text-[10px]"
                  title="Call Arghyadeep Roy"
                >
                  <svg className="w-2.5 h-2.5 mr-0.5 text-cyan-400 fill-current" viewBox="0 0 24 24">
                    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                  <span>9830507435</span>
                </a>
              </div>
            </div>

            {/* Center: Integrated Active Curriculum Switcher */}
            <div className="order-3 lg:order-2 w-full lg:w-auto flex items-center justify-center sm:justify-start lg:justify-center gap-2 bg-slate-950/70 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.12)]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 hidden xl:inline">Curriculum:</span>
              </div>

              {/* Board Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Board:</span>
                <select
                  value={student.board || 'CBSE'}
                  disabled={updatingCurriculum}
                  onChange={(e) => {
                    const nb = e.target.value;
                    const defaultLevel = nb === 'WBCHSE' ? 'SEM-I' : '11';
                    handleCurriculumChange(nb, defaultLevel);
                  }}
                  className="bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 hover:border-cyan-400 rounded-lg px-2.5 py-1 text-xs font-black tracking-wide focus:outline-none cursor-pointer transition shadow-inner"
                >
                  <option value="CBSE" className="bg-[#08131e] text-cyan-300 font-bold">CBSE</option>
                  <option value="ICSE" className="bg-[#08131e] text-cyan-300 font-bold">ICSE</option>
                  <option value="WBCHSE" className="bg-[#08131e] text-cyan-300 font-bold">WBCHSE</option>
                </select>
              </div>

              {/* Semester / Class Selector */}
              <div className="flex items-center gap-1.5 ml-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {student.board === 'WBCHSE' ? 'Sem:' : 'Class:'}
                </span>
                {student.board === 'WBCHSE' ? (
                  <select
                    value={student.academicLevel || 'SEM-I'}
                    disabled={updatingCurriculum}
                    onChange={(e) => handleCurriculumChange(student.board || 'WBCHSE', e.target.value)}
                    className="bg-teal-950/80 text-teal-300 border border-teal-500/50 hover:border-teal-400 rounded-lg px-2.5 py-1 text-xs font-black tracking-wide focus:outline-none cursor-pointer transition shadow-inner"
                  >
                    <option value="SEM-I" className="bg-[#08131e] text-teal-300 font-bold">SEM-I</option>
                    <option value="SEM-II" className="bg-[#08131e] text-teal-300 font-bold">SEM-II</option>
                    <option value="SEM-III" className="bg-[#08131e] text-teal-300 font-bold">SEM-III</option>
                    <option value="SEM-IV" className="bg-[#08131e] text-teal-300 font-bold">SEM-IV</option>
                  </select>
                ) : (
                  <select
                    value={student.academicLevel || '11'}
                    disabled={updatingCurriculum}
                    onChange={(e) => handleCurriculumChange(student.board || 'CBSE', e.target.value)}
                    className="bg-teal-950/80 text-teal-300 border border-teal-500/50 hover:border-teal-400 rounded-lg px-2.5 py-1 text-xs font-black tracking-wide focus:outline-none cursor-pointer transition shadow-inner"
                  >
                    <option value="11" className="bg-[#08131e] text-teal-300 font-bold">Class 11</option>
                    <option value="12" className="bg-[#08131e] text-teal-300 font-bold">Class 12</option>
                  </select>
                )}
              </div>

              {updatingCurriculum ? (
                <span className="text-[10px] text-cyan-400 font-mono animate-pulse ml-1">Updating...</span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              )}
            </div>

            {/* Right: Greeting + My Account + Logout */}
            <div className="order-2 lg:order-3 flex items-center gap-2.5 shrink-0">
              {/* Student Greeting */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-xs text-slate-300 shadow-sm">
                <span className="text-slate-400 text-[11px]">Welcome,</span>
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-teal-200">
                  {studentName.split(' ')[0]}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              {/* My Account Button */}
              <Link 
                href="/dashboard/account"
                className="flex items-center text-xs font-bold text-cyan-300 hover:text-white transition-all px-3 sm:px-4 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-600/90 border border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <User className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                <span>My Account</span>
              </Link>

              {/* Logout Button */}
              <button 
                onClick={handleLogout} 
                className="flex items-center text-xs font-bold text-slate-400 hover:text-red-400 transition-all p-2 rounded-xl hover:bg-red-950/40 border border-slate-800 hover:border-red-900/50 cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Developer Contact Ribbon */}
          <div className="flex sm:hidden justify-between items-center w-full pt-2 mt-2 border-t border-cyan-500/15 text-[10px]">
            <div className="flex items-center space-x-1 text-slate-400">
              <span>Designed by</span>
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Arghyadeep Roy
              </span>
            </div>
            <a 
              href="tel:9830507435" 
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono"
            >
              <span>📞 9830507435</span>
            </a>
          </div>
        </div>
      </header>

      <main className="w-full py-6 px-4 sm:px-6 lg:px-8 space-y-6">

        {/* 1. UPCOMING TEST ALERT BANNER (Shown at Top of Main Page) */}
        {(() => {
          const upcomingBannerItems = bannerItems.filter((item: any) => item.type === "UPCOMING");
          const cfg = data.testAlertSettings || {
            badgeText: "TEST ALERT",
            bgGradient: "from-amber-950/90 via-yellow-900/70 to-amber-950/90",
            badgeColor: "bg-amber-500 text-black",
            textColor: "text-amber-200",
            marqueeSpeed: "normal"
          };
          const speedDuration = cfg.marqueeSpeed === 'slow' ? '40s' : cfg.marqueeSpeed === 'fast' ? '12s' : '25s';

          if (upcomingBannerItems.length === 0) return null;

          return (
            <div className={`bg-gradient-to-r ${cfg.bgGradient || "from-amber-950/90 via-yellow-900/70 to-amber-950/90"} border border-amber-500/50 rounded-xl overflow-hidden py-3 px-4 shadow-[0_0_20px_rgba(245,158,11,0.25)]`}>
              <div className="flex items-center gap-3 overflow-hidden">
                <span className={`shrink-0 text-xs font-bold ${cfg.badgeColor || "bg-amber-500 text-black"} px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 shadow`}>
                  <span className="w-2 h-2 rounded-full bg-black animate-ping"></span>
                  TEST ALERT
                </span>
                <div className="flex-1 overflow-hidden relative">
                  <div 
                    className={`animate-marquee whitespace-nowrap inline-block text-sm font-semibold ${cfg.textColor || "text-amber-200"}`}
                    style={{ animationDuration: speedDuration }}
                  >
                    {upcomingBannerItems.map((item: any) => (
                      <span
                        key={item.test.id}
                        className="mr-16"
                        dangerouslySetInnerHTML={{ __html: item.message }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        
        {/* Study Materials & Reference Resources Section */}
        <section className="bg-gradient-to-b from-[#122230]/90 via-[#0d1722]/90 to-[#080d14]/90 border border-cyan-500/30 p-6 rounded-2xl backdrop-blur-xl shadow-[0_10px_30px_rgba(6,182,212,0.1)] space-y-6">
          <div className="flex justify-between items-center border-b border-cyan-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl border border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <FolderOpen className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-wide">Study Materials & Notes</h2>
                <p className="text-xs text-slate-400">Interactive 3D models, visual guides, and reference resources</p>
              </div>
            </div>
            <span className="text-xs bg-gradient-to-r from-cyan-950/80 to-blue-950/80 text-cyan-300 px-3.5 py-1 rounded-full border border-cyan-500/40 font-mono font-bold shadow">
              {studyMaterials.length} Available
            </span>
          </div>

          {studyMaterials.length === 0 ? (
            <div className="bg-slate-950/60 border border-cyan-900/30 p-8 rounded-xl text-center text-slate-400 space-y-2">
              <BookOpen className="w-8 h-8 text-cyan-500/50 mx-auto" />
              <p className="text-sm font-medium">No study materials published yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {studyMaterials.map((mat: any) => {
                const isPdf = mat.type === "PDF";
                const isImage = mat.type === "IMAGE";

                return (
                  <div 
                    key={mat.id} 
                    className="group bg-gradient-to-br from-[#121c27] via-[#0d1620] to-[#0a0f16] border border-cyan-500/20 hover:border-cyan-400/60 p-5 rounded-xl flex flex-col justify-between gap-4 shadow-lg hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/10 via-blue-500/5 to-transparent rounded-bl-full pointer-events-none group-hover:from-cyan-400/20 transition-all"></div>

                    <div className="space-y-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-md text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 shadow ${
                          isPdf
                            ? "bg-red-950/90 text-red-300 border border-red-800/60"
                            : isImage
                            ? "bg-purple-950/90 text-purple-300 border border-purple-800/60"
                            : "bg-blue-950/90 text-cyan-300 border border-cyan-500/50"
                        }`}>
                          
                        {isPdf && <FileText className="w-3.5 h-3.5" />}
                          {isImage && <ImageIcon className="w-3.5 h-3.5" />}
                          {!isPdf && !isImage && <LinkIcon className="w-3.5 h-3.5" />}
                          {mat.type}
                        </span>
                        {mat.fileSize && <span className="text-[11px] text-slate-400 font-mono font-semibold">{mat.fileSize}</span>}
                      </div>

                      <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">{mat.title}</h3>
                      {mat.description && <p className="text-xs text-slate-300/90 line-clamp-3 leading-relaxed">{mat.description}</p>}
                    </div>

                    <div className="pt-3 border-t border-cyan-950 flex justify-end relative z-10">
                      {mat.isPremium && (student?.subscriptionStatus !== "PAID" && student?.subscriptionStatus !== "COMPLIMENTARY") ? (
                        <Link
                          href="/dashboard/account"
                          className="w-full text-center py-2 px-3 rounded-lg text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition shadow-md uppercase tracking-wider"
                        >
                          🔒 Subscribe to Access
                        </Link>
                      ) : (
                        <a
                        href={mat.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95"
                      >
                        <span>{mat.type === "LINK" ? "Open Link" : "View / Download"}</span>
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
        
        {/* Top Summary Cards */}
        {testsTaken > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#161616]/60 border border-[#333333] p-3.5 sm:p-6 rounded-xl flex items-center gap-2.5 sm:gap-4 backdrop-blur-sm">
              <div className="p-2.5 sm:p-3 bg-blue-900/30 rounded-lg text-blue-400 shrink-0"><BookOpen className="w-5 h-5 sm:w-6 sm:h-6" /></div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-[#a6a6a6] truncate">Tests Taken</p>
                <p className="text-lg sm:text-2xl font-bold text-white leading-tight">{testsTaken}</p>
              </div>
            </div>
            <div className="bg-[#161616]/60 border border-[#333333] p-3.5 sm:p-6 rounded-xl flex items-center gap-2.5 sm:gap-4 backdrop-blur-sm">
              <div className="p-2.5 sm:p-3 bg-green-900/30 rounded-lg text-green-400 shrink-0"><TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" /></div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-[#a6a6a6] truncate">Average Score</p>
                <p className="text-base sm:text-2xl font-bold text-white leading-tight">{avgScore}%</p>
              </div>
            </div>
            <div className="bg-[#161616]/60 border border-[#333333] p-3.5 sm:p-6 rounded-xl flex items-center gap-2.5 sm:gap-4 backdrop-blur-sm">
              <div className="p-2.5 sm:p-3 bg-purple-900/30 rounded-lg text-purple-400 shrink-0"><Trophy className="w-5 h-5 sm:w-6 sm:h-6" /></div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-[#a6a6a6] truncate">Best Score</p>
                <p className="text-base sm:text-2xl font-bold text-white leading-tight">{bestScore}%</p>
              </div>
            </div>
            <div className="bg-[#161616]/60 border border-[#333333] p-3.5 sm:p-6 rounded-xl flex items-center gap-2.5 sm:gap-4 backdrop-blur-sm">
              <div className="p-2.5 sm:p-3 bg-amber-900/30 rounded-lg text-amber-400 shrink-0"><Target className="w-5 h-5 sm:w-6 sm:h-6" /></div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-[#a6a6a6] truncate">Avg. Accuracy</p>
                <p className="text-base sm:text-2xl font-bold text-white leading-tight">{avgAccuracy}%</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-[#0a1b2a]/90 via-[#0d2336]/90 to-[#081522]/90 border border-cyan-500/30 p-8 sm:p-10 rounded-2xl text-center backdrop-blur-xl shadow-[0_10px_35px_rgba(0,153,255,0.15)] space-y-4 relative overflow-hidden">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.25)]">
              <Medal className="w-7 h-7 text-cyan-300 animate-pulse" />
            </div>
            
            <div className="space-y-1.5 max-w-lg mx-auto">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">Start Your Performance Journey</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                You haven't completed any tests yet. Take your first test from <strong className="text-cyan-300 font-semibold">Available Tests</strong> to unlock real-time accuracy, score graphs, and leaderboard insights!
              </p>
            </div>
          </div>
        )}

        {/* Top 2 Performers of Last Exam (Excluding Admin) */}
        {lastExamTopStudents && lastExamTopStudents.length > 0 && (
          <div className="bg-gradient-to-r from-[#0d2a3e]/90 via-[#0a1e2b]/90 to-[#122838]/90 border border-[#0099ff]/30 p-5 rounded-xl backdrop-blur-md shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#0099ff]/20 pb-3">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Top Performers — {lastExamTitle || "Last Exam"}
                </span>
              </div>
              <span className="text-xs text-[#7dd3fc] bg-[#0099ff]/10 px-3 py-1 rounded-full border border-[#0099ff]/30 font-medium">
                Ranked by Score, Accuracy & Speed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lastExamTopStudents.map((st: any) => (
                <div
                  key={st.rank}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                    st.rank === 1
                      ? "bg-gradient-to-r from-amber-950/40 via-[#1e190e]/60 to-[#2a210d]/50 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                      : "bg-gradient-to-r from-slate-900/60 via-[#16202c]/60 to-[#0e1620]/50 border-slate-400/40 shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-base shrink-0 border ${
                        st.rank === 1
                          ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-black border-amber-300 shadow-[0_0_10px_#f59e0b]"
                          : "bg-gradient-to-br from-slate-300 to-slate-500 text-black border-slate-200"
                      }`}
                    >
                      #{st.rank}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-base truncate flex items-center gap-2">
                        <span>{st.name}</span>
                        {st.rank === 1 && (
                          <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 font-semibold shrink-0">
                            👑 1st Rank
                          </span>
                        )}
                        {st.rank === 2 && (
                          <span className="text-[11px] bg-slate-400/20 text-slate-300 px-2 py-0.5 rounded border border-slate-400/40 font-semibold shrink-0">
                            🥈 2nd Rank
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#a6a6a6] mt-0.5 flex items-center gap-2">
                        <span>Avg Accuracy: <strong className="text-[#00e5ff] font-bold">{st.accuracy}%</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xl font-extrabold text-white">{st.score} <span className="text-xs font-normal text-[#a6a6a6]">pts</span></div>
                    <div className="text-xs font-bold text-blue-400">{st.percentage != null ? `${Number(st.percentage).toFixed(1)}%` : '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categorized Tests Sections */}
        {(() => {
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

          const currentAvailableTests: any[] = [];
          const upcomingTests: any[] = [];
          const expiredTests: any[] = [];

          availableTests.forEach((test: any) => {
            const lockDate = test.lockAt ? new Date(test.lockAt) : null;
            const unlockDate = test.unlockAt ? new Date(test.unlockAt) : null;

            // 1. LIVE / PUBLISHED: Selected as live by admin -> Available Tests category
            if (test.status === "LIVE" || test.status === "PUBLISHED") {
              currentAvailableTests.push({ ...test, category: "LIVE", lockState: "PUBLISHED_ALWAYS" });
            } 
            // 2. EXPIRED / CLOSED / LOCKED: Selected as expired -> Expired Tests category (unless student has individual access override)
            else if (test.status === "EXPIRED" || test.status === "CLOSED" || test.status === "LOCKED") {
              if (test.hasIndividualAccess) {
                currentAvailableTests.push({ ...test, category: "LIVE", lockState: "INDIVIDUAL_ACCESS_GRANTED" });
              } else {
                expiredTests.push({ ...test, category: "EXPIRED", lockState: "EXPIRED_STATUS", lockDate });
              }
            } 
            // 3. SCHEDULE_EXPIRED: Under Available Tests until lockDate arrives -> after lockDate arrives, put in Expired Tests category
            else if (test.status === "SCHEDULE_EXPIRED") {
              if (!lockDate || now < lockDate) {
                currentAvailableTests.push({ ...test, category: "LIVE", lockState: "SCHEDULED_OPEN", lockDate });
              } else if (test.hasIndividualAccess) {
                currentAvailableTests.push({ ...test, category: "LIVE", lockState: "INDIVIDUAL_ACCESS_GRANTED" });
              } else {
                expiredTests.push({ ...test, category: "EXPIRED", lockState: "EXPIRED_STATUS", lockDate });
              }
            } 
            // 4. UPCOMING: In Upcoming category until re-locked AND post-lock holding period expires -> then Available Tests category
            else if (test.status === "UPCOMING") {
              const holdMinutes = test.postLockHoldMinutes ?? 0;
              const autoLiveDate = lockDate ? new Date(lockDate.getTime() + holdMinutes * 60 * 1000) : null;

              if (!lockDate || (autoLiveDate && now < autoLiveDate)) {
                // Before re-lock or during post-lock holding period -> stays in Upcoming category
                upcomingTests.push({ 
                  ...test, 
                  category: unlockDate && now < unlockDate ? "UPCOMING" : (lockDate && now >= lockDate ? "HOLDING" : "UPCOMING_LIVE"), 
                  lockState: unlockDate && now < unlockDate ? "BEFORE_UNLOCK" : (lockDate && now >= lockDate ? "POST_LOCK_HOLDING" : "SCHEDULED_OPEN"), 
                  unlockDate, 
                  lockDate, 
                  autoLiveDate 
                });
              } else {
                // After re-lock AND post-lock holding period expired -> put into Available Tests category
                currentAvailableTests.push({ ...test, category: "LIVE", lockState: "AUTO_RELEASED_LIVE", unlockDate, lockDate, autoLiveDate });
              }
            }
            // 5. DRAFT or any unlisted status -> Excluded (Not visible to students)
          });

          const renderTestCard = (test: any) => {
            const hasAttempted = allAttempts.some((a: any) => a.testId === test.id && a.status === 'SUBMITTED');
            const activeAttempt = allAttempts.find((a: any) => a.testId === test.id && a.status === 'IN_PROGRESS');

            const isUpcomingStage = test.lockState === "BEFORE_UNLOCK";
            const isLiveStage = test.lockState === "SCHEDULED_OPEN" || test.lockState === "PUBLISHED_ALWAYS" || test.lockState === "AUTO_RELEASED_LIVE" || test.lockState === "INDIVIDUAL_ACCESS_GRANTED";
            const isHoldingStage = test.lockState === "POST_LOCK_HOLDING";
            const isLockedStage = test.lockState === "AFTER_LOCK" || test.lockState === "EXPIRED_STATUS";

            return (
              <div key={test.id} className={`bg-[#1a1a1a] border rounded-xl overflow-hidden flex flex-col transition duration-300 shadow-lg relative ${isLiveStage ? 'border-[#0099ff]/60 hover:border-[#0099ff] shadow-[0_0_15px_rgba(0,153,255,0.15)]' : isUpcomingStage ? 'border-amber-500/40 hover:border-amber-500' : isHoldingStage ? 'border-orange-500/50 hover:border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)]' : 'border-[#333333] hover:border-[#4d4d4d]'}`}>
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-white break-words leading-snug flex-1 min-w-0">{test.title}</h3>
                    {isLiveStage && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-950/80 text-green-400 border border-green-700/60 shrink-0 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
                        {test.lockState === "AUTO_RELEASED_LIVE" ? "LIVE TEST" : "LIVE NOW"}
                      </span>
                    )}
                    {isUpcomingStage && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60 shrink-0 whitespace-nowrap animate-pulse">
                        🔒 UPCOMING
                      </span>
                    )}
                    {isHoldingStage && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-950/80 text-orange-400 border border-orange-700/60 shrink-0 whitespace-nowrap">
                        ⌛ CONCLUDED
                      </span>
                    )}
                    {isLockedStage && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-950/80 text-red-400 border border-red-800/60 shrink-0 whitespace-nowrap">
                        ⌛ EXPIRED
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div className="flex items-center text-[#a6a6a6]">
                      <span className="font-semibold text-white mr-2">{test.totalQuestions}</span> Qs
                    </div>
                    <div className="flex items-center text-[#a6a6a6]">
                      <Clock className="w-4 h-4 mr-1.5 opacity-70" />
                      <span className="font-semibold text-white mr-1">{test.durationMinutes}</span> min
                    </div>
                    <div className="flex items-center text-[#a6a6a6]">
                      <span className="font-semibold text-white mr-1">{test.totalQuestions * test.marksPerQuestion}</span> Marks
                    </div>
                    {test.negativeMarking && (
                      <div className="flex items-center text-red-400">
                        -{test.negativeMarks} per wrong
                      </div>
                    )}
                  </div>
                  
                  {/* Status Banner */}
                  <div className="mt-3 text-xs bg-[#111111]/80 p-2.5 rounded border border-[#333333] overflow-hidden">
                    {isUpcomingStage && test.unlockDate && (
                      <div className="text-amber-300 font-medium truncate">
                        <span>🔒 Unlock At: <strong className="font-mono font-semibold">{formatDateTime(test.unlockDate)}</strong></span>
                      </div>
                    )}
                    {isLiveStage && test.lockState === "SCHEDULED_OPEN" && test.lockDate && (
                      <div className="text-green-400 font-medium truncate">
                        <span>🔥 Available Until: <strong className="font-mono">{formatDateTime(test.lockDate)}</strong></span>
                      </div>
                    )}
                    {isLiveStage && (test.lockState === "PUBLISHED_ALWAYS" || test.lockState === "AUTO_RELEASED_LIVE") && (
                      <div className="flex items-center text-green-400 font-medium truncate">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-2 shrink-0"></span>
                        <span>🟢 Auto-Released Live Test</span>
                      </div>
                    )}
                    {isHoldingStage && test.autoLiveDate && (
                      <div className="text-orange-300 font-medium text-[11px] leading-tight">
                        <div>⌛ Concluded at {formatDateTime(test.lockDate)}</div>
                        <div className="text-green-400 font-mono mt-0.5">Auto-lives: {formatDateTime(test.autoLiveDate)}</div>
                      </div>
                    )}
                    {isLockedStage && (
                      <div className="text-red-400 font-medium truncate">
                        <span>⚠️ Contact Admin for access</span>
                      </div>
                    )}
                    {activeAttempt && (
                      <div className="mt-1 flex items-center text-yellow-400 font-semibold">
                        <span>▶ Active attempt in progress</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-[#111111] border-t border-[#333333]">
                  {isUpcomingStage ? (
                    <button disabled className="w-full text-center py-2.5 px-4 rounded-md text-xs sm:text-sm font-bold text-amber-300 bg-amber-950/60 border border-amber-700/60 cursor-not-allowed tracking-wide shadow">
                      🎯 Best of Luck!
                    </button>
                  ) : activeAttempt ? (
                    <Link href={`/exam/start/${test.id}`} className="block w-full text-center py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-yellow-600 hover:bg-yellow-700 transition shadow-[0_0_15px_rgba(202,138,4,0.3)] animate-pulse">
                      Continue Test
                    </Link>
                  ) : isHoldingStage ? (
                    test.userRequestStatus === "PENDING" ? (
                      <button disabled className="w-full text-center py-2.5 px-4 rounded-md text-xs sm:text-sm font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/80 cursor-not-allowed">
                        ⏳ Request Pending Admin Review
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/student/request-access", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ testId: test.id })
                            });
                            const data = await res.json();
                            if (res.ok) {
                              alert("Your request to live this test has been sent to the Admin!");
                              window.location.reload();
                            } else {
                              alert(data.error || "Failed to submit request.");
                            }
                          } catch (err) {
                            alert("Something went wrong requesting access.");
                          }
                        }}
                        className="w-full text-center py-2.5 px-4 rounded-md text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 transition shadow-[0_0_15px_rgba(249,115,22,0.3)] flex items-center justify-center gap-1.5"
                      >
                        📩 Request Admin to Live Test
                      </button>
                    )
                  ) : isLockedStage ? (
                    test.userRequestStatus === "PENDING" ? (
                      <button disabled className="w-full text-center py-2.5 px-4 rounded-md text-xs sm:text-sm font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/80 cursor-not-allowed">
                        ⏳ Request Pending Admin Review
                      </button>
                    ) : test.userRequestStatus === "APPROVED" || test.hasIndividualAccess ? (
                      <Link href={`/exam/start/${test.id}`} className="block w-full text-center py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                        {activeAttempt ? 'Continue Test (Access Granted)' : hasAttempted ? 'Take Again (Access Granted)' : 'Start Test (Access Granted)'}
                      </Link>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/student/request-access", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ testId: test.id })
                            });
                            const data = await res.json();
                            if (res.ok) {
                              alert("Your request to live this test has been sent to the Admin!");
                              window.location.reload();
                            } else {
                              alert(data.error || "Failed to submit request");
                            }
                          } catch (e) {
                            alert("Error sending request");
                          }
                        }}
                        className="w-full text-center py-2.5 px-4 rounded-md text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.25)] flex items-center justify-center gap-1.5"
                      >
                        📩 Request Admin to Live Test
                      </button>
                    )
                  ) : activeAttempt ? (
                    <Link href={`/exam/start/${test.id}`} className="block w-full text-center py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-yellow-600 hover:bg-yellow-700 transition shadow-[0_0_15px_rgba(202,138,4,0.3)]">
                      Continue Test
                    </Link>
                  ) : hasAttempted ? (
                    <Link href={`/exam/start/${test.id}`} className="block w-full text-center py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-[#262626] border border-[#404040] hover:bg-[#333333] transition">
                      Take Again / View
                    </Link>
                  ) : (
                    <Link href={`/exam/start/${test.id}`} className="block w-full text-center py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-[#0099ff] hover:bg-[#007acc] transition shadow-[0_0_15px_rgba(0,153,255,0.3)]">
                      Start Test
                    </Link>
                  )}
                </div>
              </div>
            );
          };

          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 1. Folder 1: Upcoming Tests */}
              <div className="bg-[#121212]/90 border border-amber-500/40 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.08)] hover:border-amber-400 transition-all duration-300 transform hover:-translate-y-1">
                <Link
                  href="/dashboard/category/upcoming"
                  className="w-full h-full flex flex-col justify-between p-6 bg-gradient-to-b from-[#1a1610]/90 to-[#120e0a]/90 hover:from-[#2a2218] hover:to-[#1a140e] transition-colors text-left cursor-pointer group space-y-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-3 rounded-xl bg-amber-950/90 border border-amber-700/60 shadow group-hover:scale-110 transition-transform flex items-center justify-center shrink-0">
                      <PiechemLogo size="sm" showText={false} />
                    </div>
                    <span className="text-xs bg-amber-950 text-amber-300 px-3 py-1 rounded-full border border-amber-700 font-mono font-bold shrink-0 shadow">
                      {upcomingTests.length} Scheduled
                    </span>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide flex items-center justify-between group-hover:text-amber-300 transition-colors">
                      <span>Upcoming / Scheduled</span>
                      <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0" />
                    </h2>
                    <p className="text-xs text-amber-200/70 leading-relaxed">Click to view all scheduled upcoming tests →</p>
                  </div>
                </Link>
              </div>

              {/* 2. Folder 2: Available Tests */}
              <div className="bg-[#121212]/90 border border-green-500/40 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(34,197,94,0.08)] hover:border-green-400 transition-all duration-300 transform hover:-translate-y-1">
                <Link
                  href="/dashboard/category/available"
                  className="w-full h-full flex flex-col justify-between p-6 bg-gradient-to-b from-[#0f1f17]/90 to-[#0a1610]/90 hover:from-[#162e22] hover:to-[#0f2118] transition-colors text-left cursor-pointer group space-y-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-3 rounded-xl bg-green-950/90 border border-green-700/60 shadow group-hover:scale-110 transition-transform flex items-center justify-center shrink-0">
                      <PiechemLogo size="sm" showText={false} />
                    </div>
                    <span className="text-xs bg-green-950 text-green-400 px-3 py-1 rounded-full border border-green-700 font-mono font-bold shrink-0 shadow">
                      {currentAvailableTests.length} Live
                    </span>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide flex items-center justify-between group-hover:text-green-300 transition-colors">
                      <span className="flex items-center gap-2">
                        Available Tests
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                      </span>
                      <ChevronRight className="w-5 h-5 text-green-400 group-hover:translate-x-1 transition-transform shrink-0" />
                    </h2>
                    <p className="text-xs text-green-200/70 leading-relaxed">Click to view all tests ready to attempt →</p>
                  </div>
                </Link>
              </div>

              {/* 3. Folder 3: Expired Tests */}
              <div className="bg-[#121212]/90 border border-red-900/50 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.05)] hover:border-red-600 transition-all duration-300 transform hover:-translate-y-1">
                <Link
                  href="/dashboard/category/expired"
                  className="w-full h-full flex flex-col justify-between p-6 bg-gradient-to-b from-[#1f1012]/90 to-[#140b0c]/90 hover:from-[#2c1719] hover:to-[#1e1011] transition-colors text-left cursor-pointer group space-y-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-3 rounded-xl bg-red-950/90 border border-red-800/60 shadow group-hover:scale-110 transition-transform flex items-center justify-center shrink-0">
                      <PiechemLogo size="sm" showText={false} />
                    </div>
                    <span className="text-xs bg-red-950 text-red-400 px-3 py-1 rounded-full border border-red-800 font-mono font-bold shrink-0 shadow">
                      {expiredTests.length} Expired
                    </span>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide flex items-center justify-between group-hover:text-red-300 transition-colors">
                      <span>Expired Tests</span>
                      <ChevronRight className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform shrink-0" />
                    </h2>
                    <p className="text-xs text-red-200/70 leading-relaxed">Click to view all past concluded tests →</p>
                  </div>
                </Link>
              </div>
            </div>
          );
        })()}

        {/* Performance Overview (Only if tests taken) */}
        {testsTaken > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section className="lg:col-span-2 bg-[#161616]/60 border border-[#333333] rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-[#0099ff]" />
                Performance Overview
              </h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
                    <XAxis dataKey="attempt" stroke="#a6a6a6" tick={{fill: '#a6a6a6', fontSize: 12}} />
                    <YAxis stroke="#a6a6a6" tick={{fill: '#a6a6a6', fontSize: 12}} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333333', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#0099ff' }}
                    />
                    <Line type="monotone" dataKey="percentage" name="Percentage (%)" stroke="#0099ff" strokeWidth={3} dot={{r: 4, fill: '#0099ff'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Recent Performance Cards */}
            <section className="bg-[#161616]/60 border border-[#333333] rounded-xl p-5 sm:p-6 backdrop-blur-sm flex flex-col">
              <h2 className="text-lg sm:text-xl font-bold mb-4">Recent Performance</h2>
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {recentAttempts.map((attempt: any) => (
                  <Link key={attempt.id} href={`/exam/result/${attempt.id}`} className="block bg-[#1a1a1a] border border-[#333333] p-3.5 sm:p-4 rounded-lg hover:border-[#4d4d4d] transition group">
                    <p className="font-semibold text-xs sm:text-sm text-white mb-2 break-words line-clamp-2 leading-snug group-hover:text-[#0099ff] transition-colors">{attempt.test.title}</p>
                    <div className="flex justify-between items-center text-xs sm:text-sm pt-1 border-t border-[#262626]">
                      <span className="text-[#a6a6a6]">{new Date(attempt.submittedAt).toLocaleDateString()}</span>
                      <span className={`font-bold ${(attempt.percentage ?? 0) >= 80 ? 'text-green-400' : (attempt.percentage ?? 0) >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {attempt.percentage != null ? `${Number(attempt.percentage).toFixed(1)}%` : '-'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Result Tracker Table */}
        {testsTaken > 0 && (
          <section className="bg-[#161616]/60 border border-[#333333] rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="p-4 sm:p-6 border-b border-[#333333] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
              <h2 className="text-lg sm:text-xl font-bold">Result Tracker</h2>
              <span className="text-xs sm:text-sm text-[#a6a6a6]">Showing last {last25Attempts.length} tests</span>
            </div>

            {/* Dedicated Mobile Card View (md:hidden) */}
            <div className="md:hidden p-4 space-y-3">
              {last25Attempts.map((attempt: any) => (
                <div key={attempt.id} className="bg-[#1a1a1a] border border-[#333333] p-4 rounded-lg space-y-3">
                  <div className="text-sm font-semibold text-white break-words line-clamp-2 leading-snug">
                    {attempt.test.title}
                  </div>
                  <div className="flex justify-between items-center text-xs text-[#a6a6a6] pt-1 border-t border-[#262626]">
                    <div>
                      <span>Date: </span>
                      <span className="text-white font-medium">{new Date(attempt.submittedAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span>Score: </span>
                      <span className="text-white font-bold text-sm">{attempt.score}</span>
                      <span className={`ml-1.5 px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        (attempt.percentage ?? 0) >= 80 ? 'bg-green-900/40 text-green-300 border border-green-700/50' : 
                        (attempt.percentage ?? 0) >= 60 ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50' : 
                        'bg-red-900/40 text-red-300 border border-red-700/50'
                      }`}>
                        {attempt.percentage != null ? `${Number(attempt.percentage).toFixed(1)}%` : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1">
                    <div className="font-mono text-[#a6a6a6]">
                      <span className="text-green-400 font-bold">{attempt.correctCount}</span> C / <span className="text-red-400 font-bold">{attempt.incorrectCount}</span> I / <span className="text-[#a6a6a6] font-bold">{attempt.unansweredCount}</span> U
                    </div>
                    <Link href={`/exam/result/${attempt.id}`} className="inline-flex items-center text-xs font-semibold text-[#0099ff] bg-[#0099ff]/10 hover:bg-[#0099ff]/20 px-3 py-1.5 rounded-md border border-[#0099ff]/30 transition-colors">
                      View Result <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-[#333333]">
                <thead className="bg-[#1a1a1a]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Test</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">%</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">C / I / U</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333333] bg-[#161616]/40">
                  {last25Attempts.map((attempt: any) => (
                    <tr key={attempt.id} className="hover:bg-[#262626]/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{attempt.test.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#a6a6a6]">
                        {new Date(attempt.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                        {attempt.score}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2.5 py-0.5 rounded-full font-medium ${
                          (attempt.percentage ?? 0) >= 80 ? 'bg-green-900/30 text-green-400 border border-green-800' : 
                          (attempt.percentage ?? 0) >= 60 ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800' : 
                          'bg-red-900/30 text-red-400 border border-red-800'
                        }`}>
                          {attempt.percentage != null ? `${Number(attempt.percentage).toFixed(1)}%` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className="text-green-400">{attempt.correctCount}</span>
                        <span className="text-[#666666] mx-1">/</span>
                        <span className="text-red-400">{attempt.incorrectCount}</span>
                        <span className="text-[#666666] mx-1">/</span>
                        <span className="text-[#a6a6a6]">{attempt.unansweredCount}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/exam/result/${attempt.id}`} className="inline-flex items-center text-[#0099ff] hover:text-[#33adff] transition-colors">
                          View <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Mobile-Only Bottom Logout Footer Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#121212]/95 backdrop-blur-lg border-t border-[#333333] px-4 py-2.5 flex justify-center items-center shadow-[0_-4px_20px_rgba(0,0,0,0.6)]">
        <button
          onClick={handleLogout}
          className="w-full max-w-xs flex items-center justify-center text-sm font-semibold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 py-2 px-4 rounded-lg transition-all shadow-md active:scale-95"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout from Account
        </button>
      </div>
    </div>
  );
}
