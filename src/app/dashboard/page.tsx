"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BookOpen, Trophy, Target, TrendingUp, ChevronRight, LogOut, Medal, Clock, AlertCircle } from 'lucide-react';
import AdminPreviewBanner from "@/components/AdminPreviewBanner";
import PiechemLogo from "@/components/PiechemLogo";
import PiFiringLoader from "@/components/PiFiringLoader";

export default function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const router = useRouter();

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
  }, [router]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black text-white font-sans pb-20">
      <AdminPreviewBanner />

      {/* Header */}
      <header className="border-b border-[#333333] bg-[#161616]/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-4">
          <div className="flex items-center space-x-4 shrink-0">
            <PiechemLogo size="md" />
          </div>

          {/* Center Badge */}
          <div className="flex px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-[#121824]/90 backdrop-blur-md border border-[#334155]/60 shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[10px] sm:text-xs text-slate-300 font-medium tracking-wide items-center justify-center gap-1 sm:gap-1.5 text-center">
            <span className="text-slate-400 hidden xs:inline">Designed & Prepared by</span>
            <span className="font-semibold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">Arghyadeep Roy</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 hidden xs:inline">Contact:</span>
            <a href="tel:9830507435" className="font-semibold text-cyan-400 hover:underline">9830507435</a>
          </div>

          <button onClick={handleLogout} className="flex items-center text-sm text-[#a6a6a6] hover:text-white transition px-3 py-2 rounded-md hover:bg-[#262626] shrink-0">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        
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
          <div className="bg-[#161616]/60 border border-[#333333] p-8 rounded-xl text-center backdrop-blur-sm">
            <Medal className="w-12 h-12 text-[#0099ff] mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl font-bold mb-2">Start Your Performance Journey</h2>
            <p className="text-[#a6a6a6] mb-6">You haven't completed any tests yet. Take your first test to unlock powerful analytics!</p>
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
                Ranked by Score & Avg Accuracy
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
                    <div className="text-xs font-bold text-blue-400">{st.percentage?.toFixed(1)}%</div>
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

            if (test.status === "SCHEDULE_EXPIRED" || test.status === "EXPIRED" || test.status === "CLOSED") {
              if (lockDate && now < lockDate) {
                // Before scheduled expiration: currently LIVE & available for all students!
                currentAvailableTests.push({ ...test, category: "LIVE", lockState: "SCHEDULED_OPEN", lockDate });
              } else if (test.hasIndividualAccess) {
                currentAvailableTests.push({ ...test, category: "LIVE", lockState: "INDIVIDUAL_ACCESS_GRANTED" });
              } else {
                // Scheduled expiration date has passed -> Expired & requires admin approval
                expiredTests.push({ ...test, category: "EXPIRED", lockState: "EXPIRED_STATUS", lockDate });
              }
            } else if (test.status === "PUBLISHED") {
              if (lockDate && now >= lockDate && !test.hasIndividualAccess) {
                expiredTests.push({ ...test, category: "EXPIRED", lockState: "AFTER_LOCK", lockDate });
              } else {
                currentAvailableTests.push({ ...test, category: "LIVE", lockState: "PUBLISHED_ALWAYS", lockDate });
              }
            } else if (test.status === "LOCKED") {
              if (unlockDate && now < unlockDate) {
                upcomingTests.push({ ...test, category: "UPCOMING", lockState: "BEFORE_UNLOCK", unlockDate, lockDate });
              } else if (!lockDate || now < lockDate) {
                // Unlocked (or no unlock required) & lockDate in future -> LIVE & Available
                currentAvailableTests.push({ ...test, category: "LIVE", lockState: "SCHEDULED_OPEN", unlockDate, lockDate });
              } else {
                if (test.hasIndividualAccess) {
                  currentAvailableTests.push({ ...test, category: "LIVE", lockState: "INDIVIDUAL_ACCESS_GRANTED" });
                } else {
                  expiredTests.push({ ...test, category: "EXPIRED", lockState: "AFTER_LOCK", unlockDate, lockDate });
                }
              }
            }
          });

          const renderTestCard = (test: any) => {
            const hasAttempted = allAttempts.some((a: any) => a.testId === test.id && a.status === 'SUBMITTED');
            const activeAttempt = allAttempts.find((a: any) => a.testId === test.id && a.status === 'IN_PROGRESS');

            const isUpcomingStage = test.lockState === "BEFORE_UNLOCK";
            const isLiveStage = test.lockState === "SCHEDULED_OPEN" || test.lockState === "PUBLISHED_ALWAYS" || test.lockState === "INDIVIDUAL_ACCESS_GRANTED";
            const isLockedStage = test.lockState === "AFTER_LOCK" || test.lockState === "EXPIRED_STATUS";

            return (
              <div key={test.id} className={`bg-[#1a1a1a] border rounded-xl overflow-hidden flex flex-col transition duration-300 shadow-lg relative ${isLiveStage ? 'border-[#0099ff]/60 hover:border-[#0099ff] shadow-[0_0_15px_rgba(0,153,255,0.15)]' : isUpcomingStage ? 'border-amber-500/40 hover:border-amber-500' : 'border-[#333333] hover:border-[#4d4d4d]'}`}>
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-white break-words leading-snug flex-1 min-w-0">{test.title}</h3>
                    {isLiveStage && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-950/80 text-green-400 border border-green-700/60 shrink-0 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
                        LIVE TEST
                      </span>
                    )}
                    {isUpcomingStage && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60 shrink-0 whitespace-nowrap animate-pulse">
                        🔒 UPCOMING
                      </span>
                    )}
                    {isLockedStage && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-950/80 text-red-400 border border-red-800/60 shrink-0 whitespace-nowrap">
                        🔒 LOCKED
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
                  <div className="mt-3 text-xs bg-[#111111]/80 p-2.5 rounded border border-[#333333] overflow-hidden relative">
                    {isUpcomingStage && test.unlockDate && (
                      <div className="animate-marquee whitespace-nowrap text-amber-300 font-medium">
                        <span>🔒 Unlock At: <strong className="font-mono font-semibold">{formatDateTime(test.unlockDate)}</strong></span>
                      </div>
                    )}
                    {isLiveStage && test.lockDate && (
                      <div className="animate-marquee whitespace-nowrap text-green-400 font-medium">
                        <span>🔥 Available Until: <strong className="font-mono">{formatDateTime(test.lockDate)}</strong></span>
                      </div>
                    )}
                    {isLiveStage && !test.lockDate && (
                      <div className="flex items-center text-green-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-2"></span>
                        <span>🟢 Available Anytime</span>
                      </div>
                    )}
                    {isLockedStage && (
                      <div className="animate-marquee whitespace-nowrap text-red-400 font-medium">
                        <span>⚠️ Not Available: Please contact Admin to request live access.</span>
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

          // Filter tests qualifying for moving announcement banner:
          // 1. Upcoming tests: Display on the unlock day AND 1 day prior to unlock
          // 2. Live tests: Display if live and scheduled to expire soon
          // 3. Locked tests: Display for 24 hours after locking
          const bannerItems: any[] = [];

          availableTests.forEach((t: any) => {
            const unlock = t.unlockAt ? new Date(t.unlockAt) : null;
            const lock = t.lockAt ? new Date(t.lockAt) : null;

            if (unlock) {
              const bannerStart = new Date(unlock.getFullYear(), unlock.getMonth(), unlock.getDate() - 1, 0, 0, 0, 0);
              if (now >= bannerStart && now < unlock) {
                bannerItems.push({
                  type: "UPCOMING",
                  test: t,
                  message: `📢 Upcoming Test <strong class="text-white bg-amber-900/80 px-2 py-0.5 rounded border border-amber-600/50">${t.title}</strong> will go live on <strong class="text-amber-300 font-mono">${formatDateTime(t.unlockAt)}</strong>. Please prepare to attempt the test!`
                });
              } else if (now >= unlock && lock && now < lock) {
                bannerItems.push({
                  type: "LIVE_EXPIRING",
                  test: t,
                  message: `🔥 Live Test <strong class="text-white bg-green-950 px-2 py-0.5 rounded border border-green-600/60">${t.title}</strong> is NOW LIVE! It will expire on <strong class="text-green-300 font-mono">${formatDateTime(t.lockAt)}</strong>. Please attempt the test before it closes!`
                });
              }
            } else if (lock && now < lock) {
              bannerItems.push({
                type: "LIVE_EXPIRING",
                test: t,
                message: `🔥 Scheduled Test <strong class="text-white bg-green-950 px-2 py-0.5 rounded border border-green-600/60">${t.title}</strong> is NOW LIVE! Last day to take test: <strong class="text-amber-300 font-mono">${formatDateTime(t.lockAt)}</strong>.`
              });
            }

            // Check if test locked within the last 24 hours
            if (lock) {
              const postLock24h = new Date(lock.getTime() + 24 * 60 * 60 * 1000);
              if (now >= lock && now < postLock24h) {
                bannerItems.push({
                  type: "RECENTLY_LOCKED",
                  test: t,
                  message: `⌛ Test <strong class="text-white bg-red-950 px-2 py-0.5 rounded border border-red-600/60">${t.title}</strong> was live until <strong class="text-red-300 font-mono">${formatDateTime(t.lockAt)}</strong> and has now concluded. If you missed submitting your test in time, please contact the Admin to request access.`
                });
              }
            }
          });

          return (
            <div className="space-y-10">
              {/* Moving Announcement Banner */}
              {bannerItems.length > 0 && (
                <div className="bg-gradient-to-r from-amber-950/90 via-yellow-900/70 to-amber-950/90 border border-amber-500/50 rounded-xl overflow-hidden py-3 px-4 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="shrink-0 text-xs font-bold bg-amber-500 text-black px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 shadow">
                      <span className="w-2 h-2 rounded-full bg-black animate-ping"></span>
                      ANNOUNCEMENT
                    </span>
                    <div className="flex-1 overflow-hidden relative">
                      <div className="animate-marquee whitespace-nowrap inline-block text-sm font-semibold text-amber-200">
                        {bannerItems.map((item: any) => (
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
              )}

              {/* 1. Box 1: Upcoming Tests (Always at Top) */}
              <div className="bg-[#121212]/90 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-[0_0_20px_rgba(245,158,11,0.08)] space-y-4">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-700/50 text-base">🔒</span>
                    <h2 className="text-xl font-bold text-white tracking-wide">Upcoming Tests</h2>
                  </div>
                  <span className="text-xs bg-amber-950 text-amber-300 px-3 py-1 rounded-full border border-amber-700 font-mono font-bold">
                    {upcomingTests.length} Scheduled
                  </span>
                </div>
                {upcomingTests.length === 0 ? (
                  <p className="text-[#a6a6a6] bg-[#1a1a1a]/50 p-4 rounded-xl border border-[#333333] text-sm">No upcoming tests scheduled at the moment.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {upcomingTests.map(test => renderTestCard(test))}
                  </div>
                )}
              </div>

              {/* 2. Box 2: Current Available Tests */}
              <div className="bg-[#121212]/90 border border-[#0099ff]/30 rounded-2xl p-5 sm:p-6 shadow-[0_0_20px_rgba(0,153,255,0.08)] space-y-4">
                <div className="flex items-center justify-between border-b border-[#0099ff]/20 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-3.5 w-3.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500"></span>
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-wide">Current Available Tests</h2>
                  </div>
                  <span className="text-xs bg-green-950 text-green-400 px-3 py-1 rounded-full border border-green-700 font-mono font-bold">
                    {currentAvailableTests.length} Available
                  </span>
                </div>
                {currentAvailableTests.length === 0 ? (
                  <p className="text-[#a6a6a6] bg-[#1a1a1a]/50 p-4 rounded-xl border border-[#333333] text-sm">No current published tests available.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {currentAvailableTests.map(test => renderTestCard(test))}
                  </div>
                )}
              </div>

              {/* 3. Box 3: Expired Tests */}
              <div className="bg-[#121212]/90 border border-red-900/40 rounded-2xl p-5 sm:p-6 shadow-[0_0_20px_rgba(239,68,68,0.05)] space-y-4">
                <div className="flex items-center justify-between border-b border-red-900/30 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-lg bg-red-950/80 text-red-400 border border-red-800/50 text-base">⌛</span>
                    <h2 className="text-xl font-bold text-white tracking-wide">Expired Tests</h2>
                  </div>
                  <span className="text-xs bg-red-950 text-red-400 px-3 py-1 rounded-full border border-red-800 font-mono font-bold">
                    {expiredTests.length} Expired
                  </span>
                </div>
                {expiredTests.length === 0 ? (
                  <p className="text-[#a6a6a6] bg-[#1a1a1a]/50 p-4 rounded-xl border border-[#333333] text-sm">No expired tests.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {expiredTests.map(test => renderTestCard(test))}
                  </div>
                )}
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
                      <span className={`font-bold ${attempt.percentage >= 80 ? 'text-green-400' : attempt.percentage >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {attempt.percentage?.toFixed(1)}%
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
                        attempt.percentage >= 80 ? 'bg-green-900/40 text-green-300 border border-green-700/50' : 
                        attempt.percentage >= 60 ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50' : 
                        'bg-red-900/40 text-red-300 border border-red-700/50'
                      }`}>
                        {attempt.percentage?.toFixed(1)}%
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
                          attempt.percentage >= 80 ? 'bg-green-900/30 text-green-400 border border-green-800' : 
                          attempt.percentage >= 60 ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800' : 
                          'bg-red-900/30 text-red-400 border border-red-800'
                        }`}>
                          {attempt.percentage?.toFixed(1)}%
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
    </div>
  );
}
