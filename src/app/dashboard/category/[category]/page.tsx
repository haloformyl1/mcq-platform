"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, FolderOpen, LogOut } from 'lucide-react';
import AdminPreviewBanner from "@/components/AdminPreviewBanner";
import PiechemLogo from "@/components/PiechemLogo";
import PiFiringLoader from "@/components/PiFiringLoader";

export default function CategoryTestsPage({ params }: { params: Promise<{ category: string }> }) {
  const resolvedParams = use(params);
  const categoryKey = resolvedParams.category.toLowerCase();

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

  if (loading || !data) return <PiFiringLoader fullScreen={true} />;

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

  const { student, availableTests = [], allAttempts = [] } = data;

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
    // 2. EXPIRED / CLOSED / LOCKED: Selected as expired -> Expired Tests category
    else if (test.status === "EXPIRED" || test.status === "CLOSED" || test.status === "LOCKED") {
      if (test.hasIndividualAccess) {
        currentAvailableTests.push({ ...test, category: "LIVE", lockState: "INDIVIDUAL_OVERRIDE", lockDate });
      } else {
        expiredTests.push({ ...test, category: "EXPIRED", lockState: "LOCKED_ADMIN_ONLY" });
      }
    } 
    // 3. SCHEDULE_EXPIRED: Under Available Tests until expire date & time -> after expire date, put into Expired Tests category
    else if (test.status === "SCHEDULE_EXPIRED") {
      if (!lockDate || now < lockDate) {
        currentAvailableTests.push({ ...test, category: "LIVE", lockState: "SCHEDULED_OPEN", lockDate });
      } else if (test.hasIndividualAccess) {
        currentAvailableTests.push({ ...test, category: "LIVE", lockState: "INDIVIDUAL_OVERRIDE", lockDate });
      } else {
        expiredTests.push({ ...test, category: "EXPIRED", lockState: "EXPIRED_AFTER_LOCK", lockDate });
      }
    } 
    // 4. UPCOMING: In Upcoming category until re-locked AND post-lock holding period expires -> then Available Tests category
    else if (test.status === "UPCOMING") {
      const holdMinutes = test.postLockHoldMinutes ?? 0;
      const autoLiveDate = lockDate ? new Date(lockDate.getTime() + holdMinutes * 60 * 1000) : null;

      if (!lockDate || (autoLiveDate && now < autoLiveDate)) {
        // Stays under Upcoming category
        upcomingTests.push({ 
          ...test, 
          category: unlockDate && now < unlockDate ? "UPCOMING" : (lockDate && now >= lockDate ? "HOLDING" : "UPCOMING_LIVE"), 
          lockState: unlockDate && now < unlockDate ? "WAITING_UNLOCK" : (lockDate && now >= lockDate ? "HOLDING_BEFORE_AUTO_LIVE" : "SCHEDULED_OPEN"), 
          unlockDate, 
          lockDate, 
          autoLiveDate 
        });
      } else {
        // After re-lock AND post-lock holding period expired -> put into Available Tests category
        currentAvailableTests.push({ ...test, category: "LIVE", lockState: "AUTO_RELEASED_LIVE", lockDate, autoLiveDate });
      }
    }
    // 5. DRAFT / unlisted -> Excluded (Not visible to public/students)
  });

  let selectedTitle = "Available Tests";
  let selectedIcon = "📂";
  let selectedBadgeColor = "bg-green-950 text-green-400 border-green-700";
  let selectedHeaderBg = "border-green-500/40 bg-[#0f1f17]/80";
  let displayTests: any[] = [];

  if (categoryKey === "upcoming") {
    selectedTitle = "Upcoming / Scheduled Tests";
    selectedIcon = "📁";
    selectedBadgeColor = "bg-amber-950 text-amber-300 border-amber-700";
    selectedHeaderBg = "border-amber-500/40 bg-[#1a1610]/80";
    displayTests = upcomingTests;
  } else if (categoryKey === "expired") {
    selectedTitle = "Expired Tests";
    selectedIcon = "🗂️";
    selectedBadgeColor = "bg-red-950 text-red-400 border-red-800";
    selectedHeaderBg = "border-red-900/50 bg-[#1f1012]/80";
    displayTests = expiredTests;
  } else {
    // default to available tests
    selectedTitle = "Available Tests";
    selectedIcon = "📂";
    selectedBadgeColor = "bg-green-950 text-green-400 border-green-700";
    selectedHeaderBg = "border-green-500/40 bg-[#0f1f17]/80";
    displayTests = currentAvailableTests;
  }

  const renderTestCard = (test: any) => {
    const attemptsForThisTest = allAttempts.filter((att: any) => att.testId === test.id);
    const submittedAttempt = attemptsForThisTest.find((att: any) => att.status === "SUBMITTED");
    const activeAttempt = attemptsForThisTest.find((att: any) => att.status === "IN_PROGRESS");

    const isLiveStage = test.category === "LIVE" || test.category === "UPCOMING_LIVE";
    const isUpcomingStage = test.category === "UPCOMING";
    const isHoldingStage = test.category === "HOLDING";
    const isLockedStage = test.category === "EXPIRED";

    return (
      <div 
        key={test.id}
        className={`bg-[#161616]/90 rounded-xl border ${
          isLiveStage ? 'border-green-500/40 hover:border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.15)]' :
          isUpcomingStage ? 'border-amber-500/40' :
          isHoldingStage ? 'border-orange-500/40' : 'border-red-900/40 opacity-85'
        } transition-all flex flex-col justify-between overflow-hidden shadow-xl`}
      >
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
          ) : isHoldingStage ? (
            <button disabled className="w-full text-center py-2.5 px-4 rounded-md text-xs sm:text-sm font-semibold text-orange-300 bg-orange-950/60 border border-orange-800/80 cursor-not-allowed">
              ⌛ In Holding Period
            </button>
          ) : isLockedStage ? (
            <button disabled className="w-full text-center py-2.5 px-4 rounded-md text-xs sm:text-sm font-semibold text-red-300 bg-red-950/60 border border-red-800/80 cursor-not-allowed">
              ⌛ Test Concluded
            </button>
          ) : submittedAttempt ? (
            <div className="flex gap-2">
              <Link 
                href={`/exam/result/${submittedAttempt.id}`}
                className="flex-1 text-center py-2.5 px-3 rounded-md text-xs sm:text-sm font-semibold text-[#a6a6a6] bg-[#222222] hover:bg-[#333333] hover:text-white border border-[#333333] transition"
              >
                Take Again / View
              </Link>
            </div>
          ) : activeAttempt ? (
            <Link 
              href={`/exam/${activeAttempt.id}`}
              className="w-full block text-center py-2.5 px-4 rounded-md text-xs sm:text-sm font-bold text-black bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 transition shadow-lg animate-pulse"
            >
              Resume Test →
            </Link>
          ) : (
            <Link 
              href={`/exam/start/${test.id}`}
              className="w-full block text-center py-2.5 px-4 rounded-md text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 transition shadow-lg active:scale-[0.98]"
            >
              Start Test
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black text-white font-sans pb-20">
      <AdminPreviewBanner />

      {/* Header */}
      <header className="border-b border-[#333333] bg-[#161616]/60 backdrop-blur-md sticky top-0 z-40">
        <div className="w-full py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-4">
          <div className="flex items-center space-x-4 shrink-0">
            <PiechemLogo size="md" href="/dashboard" />
          </div>

          <div className="px-4 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] text-xs text-slate-300 font-medium tracking-wide flex items-center space-x-2">
            <span className="text-slate-400 hidden xs:inline">Prepared by</span>
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400">
              Arghyadeep Roy
            </span>
            <span className="text-slate-600">•</span>
            <a 
              href="tel:9830507435" 
              className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 hover:text-white hover:bg-cyan-600/60 border border-cyan-500/40 transition-all font-mono shadow-sm"
              title="Call Arghyadeep Roy"
            >
              <svg className="w-3 h-3 mr-1 text-cyan-400 fill-current" viewBox="0 0 24 24">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              <span>9830507435</span>
            </a>
          </div>

          <button 
            onClick={() => {
              document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
              router.push("/");
            }} 
            className="hidden md:flex items-center text-sm text-[#a6a6a6] hover:text-white transition px-3 py-2 rounded-md hover:bg-[#262626] shrink-0"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </header>

      <main className="w-full py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 font-semibold bg-cyan-950/40 border border-cyan-800/50 px-4 py-2 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>

        {/* Moving Important Notice Ticker Banner (Renders ONLY on Available Tests page) */}
        {categoryKey === "available" && (() => {
          const rawItems: any[] = [];
          (availableTests || []).forEach((t: any) => {
            const lock = t.lockAt ? new Date(t.lockAt) : null;

            if (t.status === "SCHEDULE_EXPIRED" || lock) {
              if (!lock || now < lock) {
                rawItems.push({
                  type: "SCHEDULE_EXPIRED_LIVE",
                  test: t,
                  message: `🔥 Scheduled Test <strong class="text-white bg-amber-900/80 px-2 py-0.5 rounded border border-amber-600/50">${t.title}</strong> is NOW LIVE! Last day to take test: <strong class="text-amber-300 font-mono">${lock ? formatDateTime(lock) : "N/A"}</strong>.`
                });
              }
            } else if (t.status === "LIVE" || t.status === "PUBLISHED") {
              rawItems.push({
                type: "LIVE_NOW",
                test: t,
                message: `🔥 Live Test <strong class="text-white bg-green-950 px-2 py-0.5 rounded border border-green-600/60">${t.title}</strong> is NOW LIVE and available to attempt!`
              });
            }
          });

          const cfg = data.testAlertSettings || {
            badgeText: "IMPORTANT",
            bgGradient: "from-amber-950/90 via-yellow-900/70 to-amber-950/90",
            badgeColor: "bg-amber-500 text-black",
            textColor: "text-amber-200",
            marqueeSpeed: "normal",
            customNotice: ""
          };
          const speedDuration = cfg.marqueeSpeed === 'slow' ? '40s' : cfg.marqueeSpeed === 'fast' ? '12s' : '25s';

          const hasContent = rawItems.length > 0 || (cfg.customNotice && cfg.customNotice.trim().length > 0);
          if (!hasContent) return null;

          return (
            <div className={`bg-gradient-to-r ${cfg.bgGradient || "from-amber-950/90 via-yellow-900/70 to-amber-950/90"} border border-amber-500/50 rounded-xl overflow-hidden py-3 px-4 shadow-[0_0_20px_rgba(245,158,11,0.25)]`}>
              <div className="flex items-center gap-3 overflow-hidden">
                <span className={`shrink-0 text-xs font-bold ${cfg.badgeColor || "bg-amber-500 text-black"} px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 shadow`}>
                  <span className="w-2 h-2 rounded-full bg-black animate-ping"></span>
                  {cfg.badgeText || "IMPORTANT"}
                </span>
                <div className="flex-1 overflow-hidden relative">
                  <div 
                    className={`animate-marquee whitespace-nowrap inline-block text-sm font-semibold ${cfg.textColor || "text-amber-200"}`}
                    style={{ animationDuration: speedDuration }}
                  >
                    {rawItems.map((item: any) => (
                      <span
                        key={item.test.id}
                        className="mr-16"
                        dangerouslySetInnerHTML={{ __html: item.message }}
                      />
                    ))}
                    {cfg.customNotice && (
                      <span className="mr-16">
                        📢 <strong>Notice:</strong> {cfg.customNotice}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Category Header Box */}
        <div className={`rounded-2xl border ${selectedHeaderBg} p-6 shadow-xl flex justify-between items-center`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black/40 rounded-xl border border-white/10 shrink-0">
              <PiechemLogo size="md" showText={false} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{selectedTitle}</h1>
              <p className="text-sm text-slate-300 mt-1">Showing all tests under this category</p>
            </div>
          </div>
          <span className={`text-xs px-4 py-1.5 rounded-full border font-mono font-bold ${selectedBadgeColor}`}>
            {displayTests.length} Tests Total
          </span>
        </div>

        {/* Tests Grid */}
        {displayTests.length === 0 ? (
          <div className="bg-[#121212]/90 border border-[#333333] p-10 rounded-2xl text-center text-[#a6a6a6] space-y-3">
            <p className="text-lg">No tests found in this category right now.</p>
            <Link href="/dashboard" className="inline-block text-sm text-cyan-400 underline">Return to Dashboard</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTests.map(test => renderTestCard(test))}
          </div>
        )}
      </main>
    </div>
  );
}
