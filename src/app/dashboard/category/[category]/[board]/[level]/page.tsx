"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Clock, FolderOpen, LogOut, User, Sparkles, 
  HelpCircle, Award, CheckCircle2, AlertCircle, ArrowRight,
  Flame, Check, Lock, ChevronRight, BookOpen, Layers, Download
} from "lucide-react";
import AdminPreviewBanner from "@/components/AdminPreviewBanner";
import PiechemLogo from "@/components/PiechemLogo";
import PiFiringLoader from "@/components/PiFiringLoader";
import NotificationCenterDropdown from "@/components/NotificationCenterDropdown";

export default function CategoryCurriculumTestsPage({ params }: { params: Promise<{ category: string, board: string, level: string }> }) {
  const resolvedParams = use(params);
  const categoryKey = resolvedParams.category.toLowerCase();
  const board = decodeURIComponent(resolvedParams.board).toUpperCase();
  const level = decodeURIComponent(resolvedParams.level).toUpperCase();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch(`/api/student/curriculum/${board}/${level}`)
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
  }, [router, board, level]);

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
    const isComplimentary = student?.subscriptionStatus === "COMPLIMENTARY";
  const isPaidActive = student?.subscriptionStatus === "PAID" && (!student?.subscriptionExpiresAt || new Date(student.subscriptionExpiresAt).getTime() > now.getTime());
  const isGoldActive = isComplimentary || isPaidActive;

  const currentAvailableTests: any[] = [];
  const upcomingTests: any[] = [];
  const expiredTests: any[] = [];

  availableTests.forEach((test: any) => {
    const lockDate = test.lockAt ? new Date(test.lockAt) : null;
    const unlockDate = test.unlockAt ? new Date(test.unlockAt) : null;

    // 1. LIVE / PUBLISHED: Selected as live by admin -> Available Tests category
    if (test.status === "LIVE" || test.status === "PUBLISHED") {
      currentAvailableTests.push({ ...test, category: "LIVE", lockState: "PUBLISHED_ALWAYS", lockDate });
    } 
    // 2. EXPIRED / CLOSED / LOCKED: Concluded -> Expired Tests category (unless student has individual access)
    else if (test.status === "EXPIRED" || test.status === "CLOSED" || test.status === "LOCKED") {
      if (test.hasIndividualAccess) {
        currentAvailableTests.push({ ...test, category: "LIVE", lockState: "INDIVIDUAL_ACCESS_GRANTED", lockDate });
      } else {
        expiredTests.push({ ...test, category: "EXPIRED", lockState: "ADMIN_EXPIRED", lockDate });
      }
    } 
    // 3. OVERRIDDEN: Student-specific lock overrides
    else if (test.status === "OVERRIDDEN") {
      if (lockDate && now < lockDate) {
        currentAvailableTests.push({ ...test, category: "LIVE", lockState: "INDIVIDUAL_OVERRIDE", lockDate });
      } else {
        expiredTests.push({ ...test, category: "EXPIRED", lockState: "EXPIRED_AFTER_LOCK", lockDate });
      }
    }
    // 4. SCHEDULE_EXPIRED: LIVE until Future Expiry Date
    else if (test.status === "SCHEDULE_EXPIRED") {
      if (!lockDate || now < lockDate) {
        currentAvailableTests.push({ ...test, category: "LIVE", lockState: "SCHEDULED_OPEN", lockDate });
      } else if (test.hasIndividualAccess) {
        currentAvailableTests.push({ ...test, category: "LIVE", lockState: "INDIVIDUAL_ACCESS_GRANTED", lockDate });
      } else {
        expiredTests.push({ ...test, category: "EXPIRED", lockState: "EXPIRED_STATUS", lockDate });
      }
    }
    // 5. UPCOMING: In Upcoming category until re-locked AND post-lock holding period expires -> then Available Tests category
    else if (test.status === "UPCOMING") {
      const holdMinutes = test.postLockHoldMinutes ?? 0;
      const autoLiveDate = lockDate ? new Date(lockDate.getTime() + holdMinutes * 60 * 1000) : null;

      if (!lockDate || (autoLiveDate && now < autoLiveDate)) {
        upcomingTests.push({ 
          ...test, 
          category: unlockDate && now < unlockDate ? "UPCOMING" : (lockDate && now >= lockDate ? "HOLDING" : "UPCOMING_LIVE"), 
          lockState: unlockDate && now < unlockDate ? "WAITING_UNLOCK" : (lockDate && now >= lockDate ? "HOLDING_BEFORE_AUTO_LIVE" : "SCHEDULED_OPEN"), 
          unlockDate, 
          lockDate, 
          autoLiveDate 
        });
      } else {
        currentAvailableTests.push({ ...test, category: "LIVE", lockState: "AUTO_RELEASED_LIVE", lockDate, autoLiveDate });
      }
    }
  });

  // Config based on current category
  let selectedTitle = `Available Tests (${board} ${level})`;
  let selectedSubtitle = `Showing all ${board} ${level} tests ready to attempt right now`;
  let themeConfig = {
    gradient: "from-emerald-950/40 via-[#071912]/50 to-[#020d09]/90",
    border: "border-emerald-500/30 hover:border-emerald-500/50",
    glow: "bg-emerald-500/10",
    iconBox: "bg-emerald-950/80",
    iconBorder: "border-emerald-500/40",
    tagLabel: "LIVE EXAMINATION SERIES",
    tagBg: "bg-emerald-950/80",
    tagBorder: "border-emerald-500/40",
    tagText: "text-emerald-300",
    tagDot: "bg-emerald-400",
    badge: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]",
    ambientColor: "rgba(16,185,129,0.15)"
  };
  let displayTests: any[] = [];

  if (categoryKey === "upcoming") {
    selectedTitle = `Upcoming ${board} ${level} Tests`;
    selectedSubtitle = `Timed ${board} ${level} examination windows scheduled by faculty`;
    themeConfig = {
      gradient: "from-amber-950/40 via-[#1a1405]/50 to-[#0a0701]/90",
      border: "border-amber-500/30 hover:border-amber-500/50",
      glow: "bg-amber-500/10",
      iconBox: "bg-amber-950/80",
      iconBorder: "border-amber-500/40",
      tagLabel: "SCHEDULED EXAM WINDOWS",
      tagBg: "bg-amber-950/80",
      tagBorder: "border-amber-500/40",
      tagText: "text-amber-300",
      tagDot: "bg-amber-400",
      badge: "bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]",
      ambientColor: "rgba(245,158,11,0.15)"
    };
    displayTests = upcomingTests;
  } else if (categoryKey === "expired") {
    selectedTitle = "Expired Tests";
    selectedSubtitle = "Concluded examinations and previous benchmark papers in the curriculum archive";
    themeConfig = {
      gradient: "from-rose-950/40 via-[#19070c]/50 to-[#0c0205]/90",
      border: "border-rose-500/30 hover:border-rose-500/50",
      glow: "bg-rose-500/10",
      iconBox: "bg-rose-950/80",
      iconBorder: "border-rose-500/40",
      tagLabel: "CONCLUDED ARCHIVE",
      tagBg: "bg-rose-950/80",
      tagBorder: "border-rose-500/40",
      tagText: "text-rose-300",
      tagDot: "bg-rose-400",
      badge: "bg-rose-950/80 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.25)]",
      ambientColor: "rgba(244,63,94,0.15)"
    };
    displayTests = expiredTests;
  } else {
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
        className="group relative flex flex-col justify-between bg-[#0a0a0a] border border-white/10 hover:border-white/20 rounded-[24px] p-6 transition-all duration-300 hover:shadow-2xl overflow-hidden"
      >
        {/* Ambient Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="relative z-10 flex flex-col flex-grow">
          {/* Top section: Tag & Status */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-[11px] font-semibold tracking-wider text-cyan-300 uppercase">
              {test.discipline || "CHEMISTRY"}
            </span>

            {isLiveStage && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/10 text-emerald-400 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE</span>
              </span>
            )}
            {isUpcomingStage && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-amber-500/10 text-amber-400 shrink-0">
                <Clock className="w-3 h-3" />
                <span>UPCOMING</span>
              </span>
            )}
            {isHoldingStage && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-orange-500/10 text-orange-400 shrink-0">
                <span>HOLDING</span>
              </span>
            )}
            {isLockedStage && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-rose-500/10 text-rose-400 shrink-0">
                <span>CONCLUDED</span>
              </span>
            )}
          </div>
          
          {/* Title */}
          <h3 className="text-lg sm:text-xl font-bold text-slate-100 group-hover:text-white transition-colors leading-snug mb-5 line-clamp-2">
            {test.title}
          </h3>
          
          {/* Stats Flex Row instead of heavy grid */}
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-400 mb-6">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-slate-200">{test.totalQuestions}</span> Qs
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-slate-200">{test.durationMinutes}</span> mins
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-slate-200">{test.totalQuestions * test.marksPerQuestion}</span> marks
            </div>
          </div>
          
          {/* Status capsule */}
          <div className="mt-auto mb-5">
            <div className="text-xs bg-white/[0.03] px-4 py-3 rounded-xl border border-white/[0.05]">
              {isUpcomingStage && test.unlockDate && (
                <div className="text-amber-300 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Unlocks <span className="font-medium">{formatDateTime(test.unlockDate)}</span></span>
                </div>
              )}
              {isLiveStage && test.lockState === "SCHEDULED_OPEN" && test.lockDate && (
                <div className="text-emerald-400 flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Available until <span className="font-medium">{formatDateTime(test.lockDate)}</span></span>
                </div>
              )}
              {isLiveStage && (test.lockState === "PUBLISHED_ALWAYS" || test.lockState === "AUTO_RELEASED_LIVE") && (
                <div className="flex items-center text-emerald-400 gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Always Available</span>
                </div>
              )}
              {isHoldingStage && test.autoLiveDate && (
                <div className="text-slate-300 space-y-1">
                  <div className="flex items-center gap-2 text-rose-400">
                     <Lock className="w-3.5 h-3.5" />
                     <span>Concluded {formatDateTime(test.lockDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                     <Clock className="w-3.5 h-3.5" />
                     <span>Results on {formatDateTime(test.autoLiveDate)}</span>
                  </div>
                </div>
              )}
              {isLockedStage && (
                <div className="text-rose-400 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Test Window Closed</span>
                </div>
              )}
              {activeAttempt && (
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center text-amber-400 gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Attempt in progress</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button Section */}
        <div className="relative z-10 pt-2">
          {isUpcomingStage ? (
            <button disabled className="w-full text-center py-3 px-4 rounded-[14px] text-sm font-medium text-slate-400 bg-white/[0.02] border border-white/[0.05] cursor-not-allowed">
              Available Soon
            </button>
          ) : activeAttempt ? (
            <Link 
              href={`/exam/start/${test.id}`}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[14px] text-sm font-bold text-black bg-white hover:bg-slate-200 transition-colors shadow-lg"
            >
              <span>Resume Test</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : isHoldingStage ? (
             <button disabled className="w-full text-center py-3 px-4 rounded-[14px] text-sm font-medium text-slate-400 bg-white/[0.02] border border-white/[0.05] cursor-not-allowed">
               In Holding Period
             </button>
          ) : isLockedStage ? (
            <button disabled className="w-full text-center py-3 px-4 rounded-[14px] text-sm font-medium text-slate-400 bg-white/[0.02] border border-white/[0.05] cursor-not-allowed">
              Test Concluded
            </button>
          ) : submittedAttempt ? (
            (() => {
              const maxAttempts = test.maximumAttempts || 1;
              const attemptsUsed = submittedAttempt.attemptNumber || 1;
              const canRetake = attemptsUsed < maxAttempts;

              if (canRetake) {
                return (
                  <div className="flex gap-2">
                    <Link 
                      href={`/exam/start/${test.id}`}
                      className="flex-1 flex items-center justify-center text-center py-3 px-3 rounded-[14px] text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                      Retake ({attemptsUsed}/{maxAttempts})
                    </Link>
                    <Link 
                      href={`/exam/result/${submittedAttempt.id}`}
                      className="flex-1 flex items-center justify-center text-center py-3 px-3 rounded-[14px] text-sm font-semibold text-black bg-cyan-400 hover:bg-cyan-300 transition-colors"
                    >
                      Results
                    </Link>
                  </div>
                );
              }

              return (
                <div className="flex flex-col gap-2 w-full">
                  <Link 
                    href={`/exam/result/${submittedAttempt.id}`}
                    className="w-full flex items-center justify-center text-center py-3 px-4 rounded-[14px] text-sm font-semibold text-black bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                  >
                    View Result {maxAttempts > 1 ? `(${attemptsUsed}/${maxAttempts})` : ""}
                  </Link>
                  {isLiveStage && test.questionPaperUrl && (
                    <a 
                      href={test.questionPaperUrl}
                      download 
                      target="_blank" 
                      rel="noreferrer" 
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[14px] text-sm font-medium text-slate-300 bg-white/[0.03] hover:bg-white/[0.08] transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Question Paper
                    </a>
                  )}
                </div>
              );
            })()
          ) : test.isPremium && (student?.subscriptionStatus !== "PAID" && student?.subscriptionStatus !== "COMPLIMENTARY") ? (
              <Link
                href="/dashboard/account"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[14px] text-sm font-bold text-black bg-gradient-to-r from-amber-200 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 transition-colors shadow-lg"
              >
                <Lock className="w-4 h-4" />
                <span>Unlock Premium</span>
              </Link>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                <Link 
                  href={`/exam/start/${test.id}`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[14px] text-sm font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]"
                >
                  <span>Start Test</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {isLiveStage && test.questionPaperUrl && (
                  <button 
                    onClick={() => alert("Please attempt the test first to download the question paper.")}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[14px] text-sm font-medium text-slate-300 bg-white/[0.03] hover:bg-white/[0.08] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Question Paper
                  </button>
                )}
              </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      <AdminPreviewBanner />

      {/* Chemistry Ambient Glow for this category */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none -z-10" 
        style={{ background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${themeConfig.ambientColor}, transparent 70%)` }}
      />

      {/* Top Header matching Front Page / Dashboard / Account */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7)]">
        <div className="w-full py-2.5 sm:py-3 px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center gap-2 min-w-0">
            {/* Left: Logo & Attribution */}
            <div className="flex items-center gap-1.5 sm:gap-3.5 min-w-0">
              <PiechemLogo size="md" href="/dashboard" isGoldMember={isGoldActive} />
            </div>

            {/* Right: Notifications + Account Button matching Front Page */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <NotificationCenterDropdown student={student} upgradeReq={data?.upgradeReq} />

              <Link 
                href="/dashboard/account"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/40 text-xs font-bold text-cyan-300 hover:text-white transition shadow-sm shrink-0 cursor-pointer"
                title="My Account"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden bg-cyan-600 flex items-center justify-center shrink-0">
                  <img
                    src={student?.avatarUrl || "/avatars/atom.jpg"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e: any) => { e.target.style.display = 'none'; }}
                  />
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className="hidden sm:inline">My Account</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 flex-1">
        {/* Top Action Row: Back Button + Announcement Ticker Banner */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <Link 
            href={`/dashboard/category/${categoryKey}`}
            className="inline-flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 font-semibold bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-cyan-500/40 px-4 py-2 sm:py-2.5 rounded-xl transition shadow-sm shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>


        </div>

        {/* Category Hero Box (Front Page Theme) */}
        <div className={`relative overflow-hidden rounded-3xl border ${themeConfig.border} bg-gradient-to-br ${themeConfig.gradient} p-6 sm:p-8 backdrop-blur-2xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6`}>
          {/* Subtle glowing radial ball */}
          <div className={`absolute -right-8 -top-8 w-64 h-64 rounded-full blur-3xl pointer-events-none ${themeConfig.glow}`} />

          <div className="flex items-center gap-4 sm:gap-5 min-w-0 z-10">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${themeConfig.iconBox} border ${themeConfig.iconBorder} flex items-center justify-center shrink-0 shadow-lg`}>
              <PiechemLogo size="md" showText={false} isGoldMember={isGoldActive} />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-widest uppercase border ${themeConfig.tagBorder} ${themeConfig.tagBg} ${themeConfig.tagText}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${themeConfig.tagDot} animate-pulse`} />
                  {themeConfig.tagLabel}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-black text-white tracking-tight break-words">
                {selectedTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-light">
                {selectedSubtitle}
              </p>
            </div>
          </div>

          <div className="self-start sm:self-center shrink-0 z-10">
            <span className={`text-[10px] sm:text-xs px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border font-mono font-bold whitespace-nowrap inline-flex items-center gap-2 ${themeConfig.badge}`}>
              <span className="font-extrabold text-xs sm:text-sm">{displayTests.length}</span>
              <span>Tests Total</span>
            </span>
          </div>
        </div>

        {/* Tests Grid or WOW Empty State */}
        {displayTests.length === 0 ? (
          categoryKey === "upcoming" ? (
            /* WOW Empty State for Upcoming Tests (Image 2) */
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.03] via-white/[0.01] to-transparent border border-white/10 backdrop-blur-2xl p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-2xl space-y-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
                <Clock className="w-10 h-10 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  No Upcoming Exams Scheduled
                </h2>
                <p className="text-xs sm:text-sm text-slate-300/80 font-light max-w-md mx-auto leading-relaxed">
                  Faculty has not scheduled future examination windows for your curriculum yet. When new tests are scheduled, countdown alerts will appear right here.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link 
                  href={`/dashboard/category/${categoryKey}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs sm:text-sm transition shadow-lg active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Dashboard</span>
                </Link>
                <Link 
                  href="/dashboard/category/available"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-semibold text-xs sm:text-sm transition cursor-pointer"
                >
                  <span>Attempt Live Tests ({currentAvailableTests.length})</span>
                </Link>
              </div>
            </div>
          ) : (
            /* WOW Empty State for Expired Tests (Image 3) */
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.03] via-white/[0.01] to-transparent border border-white/10 backdrop-blur-2xl p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-2xl space-y-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_40px_rgba(244,63,94,0.2)]">
                <BookOpen className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Test Archive is Clear
                </h2>
                <p className="text-xs sm:text-sm text-slate-300/80 font-light max-w-md mx-auto leading-relaxed">
                  There are currently no concluded or expired exam papers under your active curriculum profile. You can take any active paper directly from the live tests shelf.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link 
                  href={`/dashboard/category/${categoryKey}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-bold text-xs sm:text-sm transition shadow-lg active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Dashboard</span>
                </Link>
                <Link 
                  href="/dashboard/category/available"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-semibold text-xs sm:text-sm transition cursor-pointer"
                >
                  <span>View Live Tests ({currentAvailableTests.length})</span>
                </Link>
              </div>
            </div>
          )
        ) : (
          /* Live Tests Grid (Image 1) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {displayTests.map(test => renderTestCard(test))}
          </div>
        )}
      </main>
    </div>
  );
}
