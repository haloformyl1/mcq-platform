"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { 
  RotateCcw, 
  Edit3, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Maximize2, 
  AlertTriangle,
  Menu,
  X,
  User,
  CheckCircle2,
  Clock
} from "lucide-react";
import AdminPreviewBanner from "@/components/AdminPreviewBanner";
import PiFiringLoader from "@/components/PiFiringLoader";

export default function ExamSession({ params }: { params: Promise<{ attemptId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [examData, setExamData] = useState<any>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<string>("--:--");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [needsMobileScan, setNeedsMobileScan] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Report Issue Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportNote, setReportNote] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  const [proctoringSettings, setProctoringSettings] = useState<any>({
    enforceFullscreen: true,
    tabSwitchAction: "AUTO_SUBMIT",
    enableMobileEnvironmentScan: true
  });

  useEffect(() => {
    fetch("/api/admin/proctoring-settings")
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setProctoringSettings(data);
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window && window.innerWidth < 1024);
          setIsMobileDevice(isMobile);
          if (isMobile && data.enableMobileEnvironmentScan !== false) {
            setNeedsMobileScan(true);
          }
        }
      })
      .catch(e => console.error(e));
  }, []);
  
  const lastActivityTime = useRef(Date.now());
  const examDataRef = useRef<any>(null);
  const answersRef = useRef<Record<string, string>>({});
  const saveQueueRef = useRef<Map<string, string | null>>(new Map());
  const isSavingRef = useRef<boolean>(false);

  const processSaveQueue = useCallback(async () => {
    if (isSavingRef.current || saveQueueRef.current.size === 0) return;
    isSavingRef.current = true;

    const entry = saveQueueRef.current.entries().next().value;
    if (!entry) {
      isSavingRef.current = false;
      return;
    }
    const [questionId, option] = entry;

    try {
      const res = await fetch("/api/exam/save-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: resolvedParams.attemptId,
          questionId,
          selectedAnswer: option
        })
      });
      if (res.ok) {
        saveQueueRef.current.delete(questionId);
      }
    } catch (e) {
      console.warn("Retrying save-answer in background...", e);
    } finally {
      isSavingRef.current = false;
      if (saveQueueRef.current.size > 0) {
        setTimeout(processSaveQueue, 1000);
      }
    }
  }, [resolvedParams.attemptId]);

  // Load saved current question and marked for review from localStorage
  useEffect(() => {
    try {
      const savedQ = localStorage.getItem(`exam_q_${resolvedParams.attemptId}`);
      if (savedQ !== null) {
        const idx = parseInt(savedQ, 10);
        if (!isNaN(idx) && idx >= 0) {
          setCurrentQ(idx);
        }
      }
      const savedReview = localStorage.getItem(`exam_rev_${resolvedParams.attemptId}`);
      if (savedReview) {
        setMarkedForReview(JSON.parse(savedReview));
      }
      const savedVisited = localStorage.getItem(`exam_vis_${resolvedParams.attemptId}`);
      if (savedVisited) {
        setVisitedQuestions(JSON.parse(savedVisited));
      }
    } catch {}
  }, [resolvedParams.attemptId]);

  useEffect(() => {
    try {
      localStorage.setItem(`exam_q_${resolvedParams.attemptId}`, currentQ.toString());
    } catch {}
  }, [currentQ, resolvedParams.attemptId]);

  // Mark current question as visited
  useEffect(() => {
    if (examData?.questions?.[currentQ]?.id) {
      const qId = examData.questions[currentQ].id;
      setVisitedQuestions(prev => {
        if (prev[qId]) return prev;
        const next = { ...prev, [qId]: true };
        try {
          localStorage.setItem(`exam_vis_${resolvedParams.attemptId}`, JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  }, [currentQ, examData, resolvedParams.attemptId]);

  useEffect(() => {
    if (window.innerWidth >= 1024) setShowPalette(true);

    const loadSession = async () => {
      const localData = localStorage.getItem(`exam_${resolvedParams.attemptId}`);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          setExamData(parsed);
          examDataRef.current = parsed;
          if (parsed.savedAnswers) {
            setAnswers(prev => {
              const merged = { ...parsed.savedAnswers, ...prev };
              answersRef.current = merged;
              return merged;
            });
          }
        } catch (e) {}
      }

      // Fetch fresh session from server to synchronize remaining timer & saved answers
      try {
        const res = await fetch(`/api/exam/session/${resolvedParams.attemptId}`);
        const session = await res.json();
        if (res.ok) {
          if (session.isSubmitted) {
            localStorage.removeItem(`exam_${resolvedParams.attemptId}`);
            router.push(`/exam/result/${resolvedParams.attemptId}`);
            return;
          }
          setExamData(session);
          examDataRef.current = session;
          localStorage.setItem(`exam_${resolvedParams.attemptId}`, JSON.stringify(session));
          if (session.savedAnswers) {
            setAnswers(prev => {
              const merged = { ...session.savedAnswers, ...prev };
              answersRef.current = merged;
              return merged;
            });
          }
        } else if (!localData) {
          alert(session.error || "Exam session data not found. Please contact administrator.");
          router.push("/dashboard");
        }
      } catch (err) {
        if (!localData) {
          alert("Unable to connect to exam server. Please contact administrator.");
          router.push("/dashboard");
        }
      }
    };

    loadSession();

    if (proctoringSettings.enforceFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => console.warn("Fullscreen denied by browser"));
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        (document.documentElement as any).webkitRequestFullscreen();
      }
    }
  }, [resolvedParams.attemptId, router, proctoringSettings.enforceFullscreen]);

  const submitTest = useCallback(async (reason: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: resolvedParams.attemptId,
          reason,
          answers: answersRef.current
        })
      });
      try {
        localStorage.removeItem(`exam_${resolvedParams.attemptId}`);
        localStorage.removeItem(`exam_q_${resolvedParams.attemptId}`);
        localStorage.removeItem(`exam_rev_${resolvedParams.attemptId}`);
        localStorage.removeItem(`exam_vis_${resolvedParams.attemptId}`);
      } catch {}
      router.push(`/exam/result/${resolvedParams.attemptId}`);
    } catch (e) {
      console.error("Submission failed", e);
    }
  }, [resolvedParams.attemptId, router, isSubmitting]);

  useEffect(() => {
    if (!examData) return;
    
    const endTime = new Date(examData.endTime).getTime();
    
    const timerInterval = setInterval(() => {
      const now = Date.now();
      const remainingMs = endTime - now;
      
      if (remainingMs <= 0) {
        clearInterval(timerInterval);
        submitTest("TIME_EXPIRED");
        return;
      }
      
      if (now - lastActivityTime.current >= 240000) { 
        clearInterval(timerInterval);
        submitTest("INACTIVITY_240_SECONDS");
        return;
      }
      
      const mins = Math.floor(remainingMs / 60000);
      const secs = Math.floor((remainingMs % 60000) / 1000);
      setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 1000);

    const isPermissionPromptingRef = { current: true };
    const permissionTimer = setTimeout(() => {
      isPermissionPromptingRef.current = false;
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        if (proctoringSettings.tabSwitchAction === "ALLOW" || isPermissionPromptingRef.current) return;
        submitTest("TAB_SWITCH");
      }
    };
    
    const handleBlur = () => {
      if (isMobileDevice || proctoringSettings.tabSwitchAction === "ALLOW" || isPermissionPromptingRef.current) return;
      if (document.visibilityState !== "visible") {
        submitTest("TAB_SWITCH");
      }
    };

    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement || (document as any).webkitFullscreenElement;
      if (!isFullscreen) {
        setShowFullscreenWarning(true);
        const docEl = document.documentElement as any;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        }
      } else {
        setShowFullscreenWarning(false);
      }
    };

    handleFullscreenChange();

    const updateActivity = () => {
      lastActivityTime.current = Date.now();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    window.addEventListener("blur", handleBlur);
    
    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("click", updateActivity);
    window.addEventListener("scroll", updateActivity);

    return () => {
      clearTimeout(permissionTimer);
      clearInterval(timerInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("scroll", updateActivity);
    };
  }, [examData, submitTest, proctoringSettings.tabSwitchAction]);

  const handleOptionSelect = useCallback((questionId: string, option: string) => {
    lastActivityTime.current = Date.now();
    setAnswers(prev => {
      const isAlreadySelected = prev[questionId] === option;
      const next = { ...prev };
      if (isAlreadySelected) {
        delete next[questionId];
      } else {
        next[questionId] = option;
      }
      answersRef.current = next;
      try {
        const cached = localStorage.getItem(`exam_${resolvedParams.attemptId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          parsed.savedAnswers = next;
          localStorage.setItem(`exam_${resolvedParams.attemptId}`, JSON.stringify(parsed));
        }
      } catch {}

      saveQueueRef.current.set(questionId, isAlreadySelected ? null : option);
      setTimeout(processSaveQueue, 50);

      return next;
    });
  }, [resolvedParams.attemptId, processSaveQueue]);

  const handleClearAnswer = useCallback((questionId: string) => {
    lastActivityTime.current = Date.now();
    setAnswers(prev => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      answersRef.current = next;
      try {
        const cached = localStorage.getItem(`exam_${resolvedParams.attemptId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          parsed.savedAnswers = next;
          localStorage.setItem(`exam_${resolvedParams.attemptId}`, JSON.stringify(parsed));
        }
      } catch {}

      saveQueueRef.current.set(questionId, null);
      setTimeout(processSaveQueue, 50);

      return next;
    });
  }, [resolvedParams.attemptId, processSaveQueue]);

  // Action handlers matching NTA / Reference online exam layout
  const handleMarkForReviewAndNext = () => {
    if (!examData) return;
    const qId = examData.questions[currentQ].id;
    setMarkedForReview(prev => {
      const next = { ...prev, [qId]: true };
      try {
        localStorage.setItem(`exam_rev_${resolvedParams.attemptId}`, JSON.stringify(next));
      } catch {}
      return next;
    });
    if (currentQ < examData.questions.length - 1) {
      setCurrentQ(prev => prev + 1);
    }
  };

  const handleSaveAndMarkForReview = () => {
    if (!examData) return;
    const qId = examData.questions[currentQ].id;
    setMarkedForReview(prev => {
      const next = { ...prev, [qId]: true };
      try {
        localStorage.setItem(`exam_rev_${resolvedParams.attemptId}`, JSON.stringify(next));
      } catch {}
      return next;
    });
    if (currentQ < examData.questions.length - 1) {
      setCurrentQ(prev => prev + 1);
    }
  };

  const handleSaveAndNext = () => {
    if (!examData) return;
    const qId = examData.questions[currentQ].id;
    // If the question was previously marked for review, saving and moving forward unmarks review (standard NTA behavior)
    if (markedForReview[qId]) {
      setMarkedForReview(prev => {
        const next = { ...prev };
        delete next[qId];
        try {
          localStorage.setItem(`exam_rev_${resolvedParams.attemptId}`, JSON.stringify(next));
        } catch {}
        return next;
      });
    }
    if (currentQ < examData.questions.length - 1) {
      setCurrentQ(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentQ(prev => Math.max(0, prev - 1));
  };

  const handleManualSubmit = () => {
    setShowSubmitConfirm(true);
  };

  const toggleSectionCollapse = (sectionName: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  if (!examData) return <PiFiringLoader fullScreen={true} />;

  const questions = examData.questions || [];
  const currentQuestion = questions[currentQ] || {};
  const student = examData.student || {};
  const testInfo = examData.test || {};

  // Group questions by section/category
  const sectionsMap = new Map<string, { questions: any[]; indices: number[] }>();
  questions.forEach((q: any, idx: number) => {
    const sec = q.category || "General";
    if (!sectionsMap.has(sec)) {
      sectionsMap.set(sec, { questions: [], indices: [] });
    }
    sectionsMap.get(sec)!.questions.push(q);
    sectionsMap.get(sec)!.indices.push(idx);
  });

  // Calculate counts for summary badges
  let unattemptedCount = 0;
  let answeredCount = 0;
  let markedForReviewCount = 0;
  let answeredAndMarkedCount = 0;

  questions.forEach((q: any) => {
    const hasAnswer = !!answers[q.id];
    const isMarked = !!markedForReview[q.id];

    if (hasAnswer && isMarked) {
      answeredAndMarkedCount++;
    } else if (isMarked) {
      markedForReviewCount++;
    } else if (hasAnswer) {
      answeredCount++;
    } else {
      unattemptedCount++;
    }
  });

  // Marking scheme
  const positiveMarks = testInfo.marksPerQuestion ?? 1;
  const negativeMarks = testInfo.negativeMarking ? (testInfo.negativeMarks ?? 0) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f7] text-[#1e293b] select-none font-sans" style={{ minHeight: "100dvh" }}>
      <AdminPreviewBanner />

      {/* ============================================================ */}
      {/* 1. TOP HEADER (Royal Deep Navy Blue: #204ecf)                 */}
      {/* ============================================================ */}
      <header className="bg-[#204ecf] text-white px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-md z-30 shrink-0">
        {/* Left: Candidate Profile Avatar & Name */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 max-w-[260px] sm:max-w-xs md:max-w-sm">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300 p-0.5 shrink-0 shadow-inner flex items-center justify-center overflow-hidden border border-white/40">
            {student?.avatarUrl ? (
              <img 
                src={student.avatarUrl} 
                alt="Student" 
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-900" />
            )}
          </div>
          <span className="text-xs sm:text-sm md:text-base font-bold tracking-wider uppercase text-white truncate drop-shadow-sm">
            {student?.name || "STUDENT CANDIDATE"}
          </span>
        </div>

        {/* Center: Test Title */}
        <div className="hidden lg:flex flex-1 justify-center px-4 text-center">
          <h1 className="text-sm md:text-base font-bold text-white max-w-2xl line-clamp-2 leading-snug drop-shadow-sm">
            {testInfo.title || "Examination Assessment"}
          </h1>
        </div>

        {/* Right: Time Remaining Box + Finish (Submit) Button */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex flex-col items-center">
            <span className="text-[10px] sm:text-[11px] font-medium text-blue-100/90 tracking-wide uppercase">
              Time Remaining
            </span>
            <div className="bg-[#688bf5] border border-blue-200/40 rounded-lg px-2.5 sm:px-4 py-0.5 sm:py-1 font-mono text-sm sm:text-lg font-bold text-white shadow-inner tracking-widest flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 hidden sm:inline-block opacity-80" />
              <span>{timeLeft}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualSubmit}
            disabled={isSubmitting}
            className="bg-[#22863a] hover:bg-[#1f7b35] active:bg-[#1a662c] text-white font-extrabold text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg shadow-md transition-all hover:shadow-lg active:scale-95 disabled:opacity-50"
          >
            Finish
          </button>

          {/* Mobile Palette Toggle */}
          <button
            type="button"
            onClick={() => setShowPalette(!showPalette)}
            className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Question Palette"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. SUB-BAR: Question [X / Y] + Refresh + Reset + Report Issue */}
      {/* ============================================================ */}
      <div className="bg-white border-b border-[#e2e8f0] px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-sm sm:text-base font-medium text-[#475569]">
            Question
          </span>
          <div className="bg-[#1546bd] text-white px-3 sm:px-3.5 py-0.5 sm:py-1 rounded-md text-xs sm:text-sm font-bold tracking-wider font-mono shadow-sm">
            {currentQ + 1} / {questions.length}
          </div>
          <button
            type="button"
            onClick={() => handleClearAnswer(currentQuestion.id)}
            title="Clear option selection for current question"
            className="p-1.5 rounded-full hover:bg-slate-100 text-[#475569] hover:text-[#0f172a] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Note icon button */}
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="p-1.5 sm:p-2 rounded-lg bg-[#5d55fa] hover:bg-[#4d44f7] text-white transition-colors shadow-sm"
            title="Feedback / Notes"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Report Issue button */}
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="px-3 sm:px-4 py-1.5 rounded-lg border border-[#cbd5e1] hover:border-[#94a3b8] bg-white hover:bg-slate-50 text-[#334155] text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors shadow-2xs"
          >
            REPORT ISSUE
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MARKING SCHEME STRIP                                      */}
      {/* ============================================================ */}
      <div className="bg-[#244bb5] text-white px-3 sm:px-6 py-1.5 flex items-center justify-end gap-2 text-xs font-semibold shadow-xs shrink-0">
        <span className="tracking-wide">Marking Scheme</span>
        <span className="bg-white text-[#244bb5] font-bold font-mono px-2 py-0.5 rounded text-[11px] shadow-2xs">
          +{positiveMarks}
        </span>
        <span className="bg-white text-[#244bb5] font-bold font-mono px-2 py-0.5 rounded text-[11px] shadow-2xs">
          {negativeMarks > 0 ? `-${negativeMarks}` : "0"}
        </span>
      </div>

      {/* ============================================================ */}
      {/* 4. MAIN EXAM STAGE: QUESTION AREA (LEFT) + PALETTE (RIGHT)   */}
      {/* ============================================================ */}
      <div className="flex flex-1 overflow-hidden relative min-h-0">
        
        {/* LEFT COLUMN: Question Box + Direction + Choices + Bottom Bar */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-white min-h-0">
          
          {/* Direction / Section Instruction Ribbon */}
          <div className="bg-[#e4e7fb] border-b border-[#cbd5e1] px-4 sm:px-8 py-2 text-xs sm:text-sm font-medium text-[#1e293b]">
            <span className="font-semibold text-[#1e293b]">
              Direction:
            </span>{" "}
            Choose the single correct option for the given chemistry problem.
          </div>

          {/* Question Text & Media Container */}
          <div className="flex-1 p-4 sm:p-8 md:p-10 max-w-5xl space-y-6">
            
            {/* Question Text */}
            <div className="text-base sm:text-lg md:text-xl font-medium text-[#0f172a] leading-relaxed break-words whitespace-pre-line">
              {currentQuestion.questionText}
            </div>

            {/* Optional Question Image / Diagram */}
            {currentQuestion.imageUrl && (
              <div className="my-4 flex justify-start">
                <div className="relative max-w-full rounded-xl overflow-hidden border border-[#cbd5e1] bg-slate-50 p-2 shadow-sm">
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Question Diagram"
                    className="max-h-80 sm:max-h-96 w-auto object-contain rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* MCQ Options with Round Circle Letter Badges: A, B, C, D */}
            <div className="space-y-3 sm:space-y-4 pt-2">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const optKey = `option${opt}` as keyof typeof currentQuestion;
                const optText = currentQuestion[optKey];
                const isSelected = answers[currentQuestion.id] === opt;

                return (
                  <div
                    key={opt}
                    onClick={() => handleOptionSelect(currentQuestion.id, opt)}
                    className={`group flex items-center gap-3.5 sm:gap-4 p-3 sm:p-3.5 rounded-xl cursor-pointer transition-all border text-sm sm:text-base ${
                      isSelected
                        ? "bg-[#eef2ff] border-[#2563eb] text-[#1e3a8a] shadow-xs"
                        : "bg-white hover:bg-[#f8fafc] border-[#e2e8f0] text-[#1e293b] hover:border-[#cbd5e1]"
                    }`}
                  >
                    {/* Circle Letter Badge */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm border transition-all shrink-0 ${
                        isSelected
                          ? "bg-[#2563eb] text-white border-[#2563eb] shadow-sm"
                          : "bg-white text-[#334155] border-[#3b82f6] group-hover:border-[#2563eb] group-hover:text-[#2563eb]"
                      }`}
                    >
                      {opt}
                    </div>

                    {/* Option Text */}
                    <span className="flex-1 font-medium leading-relaxed break-words">
                      {optText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* 5. BOTTOM ACTION TOOLBAR                                     */}
          {/* ============================================================ */}
          <div className="bg-[#f1f5f9] border-t border-[#cbd5e1] px-3 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 shrink-0">
            {/* Left Controls: Clear | Mark For Review & Next | Save & Mark For Review */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleClearAnswer(currentQuestion.id)}
                disabled={!answers[currentQuestion.id]}
                className="bg-[#78541e] hover:bg-[#634516] active:bg-[#4d350f] text-white font-bold text-xs sm:text-sm px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-md shadow-xs transition-colors disabled:opacity-40"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={handleMarkForReviewAndNext}
                className="bg-[#1797c2] hover:bg-[#1281a6] active:bg-[#0e6e8e] text-white font-bold text-xs sm:text-sm px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-md shadow-xs transition-colors"
              >
                Mark For Review &amp; Next
              </button>

              <button
                type="button"
                onClick={handleSaveAndMarkForReview}
                className="bg-[#1569b3] hover:bg-[#115897] active:bg-[#0c4475] text-white font-bold text-xs sm:text-sm px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-md shadow-xs transition-colors"
              >
                Save &amp; Mark For Review
              </button>
            </div>

            {/* Right Controls: Previous | Save and Next */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentQ === 0}
                className="bg-[#eb4f47] hover:bg-[#d43f37] active:bg-[#b8332c] text-white font-bold text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5 rounded-md shadow-xs transition-colors disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={handleSaveAndNext}
                className="bg-[#126f37] hover:bg-[#0f5c2e] active:bg-[#0b4723] text-white font-bold text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5 rounded-md shadow-xs transition-colors"
              >
                Save and Next
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: QUESTION PALETTE & ACCORDIONS (Reference Site) */}
        {/* ============================================================ */}
        {showPalette && (
          <>
            {/* Mobile backdrop */}
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
              onClick={() => setShowPalette(false)}
            />

            <aside className="fixed inset-y-0 right-0 z-50 w-[85vw] max-w-sm lg:max-w-xs xl:max-w-sm lg:relative lg:z-10 lg:block bg-white border-l border-[#cbd5e1] overflow-y-auto flex flex-col shadow-xl lg:shadow-none">
              
              {/* Mobile Header in Drawer */}
              <div className="lg:hidden flex items-center justify-between p-3.5 border-b border-[#e2e8f0] bg-slate-50">
                <span className="font-bold text-sm text-[#0f172a]">Question Palette</span>
                <button
                  type="button"
                  onClick={() => setShowPalette(false)}
                  className="p-1 rounded-md text-slate-500 hover:text-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 4 Summary Status Badges Grid */}
              <div className="p-4 grid grid-cols-2 gap-3 border-b border-[#e2e8f0] bg-[#f8fafc]">
                
                {/* 1. Unattempted (Coral Red: #eb5757) */}
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-[#eb5757] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {unattemptedCount}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-[#334155] leading-tight">
                    Unattempted
                  </span>
                </div>

                {/* 2. Marked for Review (Cobalt Blue: #1976d2) */}
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-[#1976d2] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {markedForReviewCount}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-[#334155] leading-tight">
                    Marked for Review
                  </span>
                </div>

                {/* 3. Answered (Vibrant Emerald Green: #1dbf73) */}
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-[#1dbf73] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {answeredCount}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-[#334155] leading-tight">
                    Answered
                  </span>
                </div>

                {/* 4. Answered and Marked for review (Cobalt Blue with Green Pin Dot) */}
                <div className="flex items-center gap-2.5">
                  <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-[#1976d2] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {answeredAndMarkedCount}
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#1dbf73] border-2 border-white" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-[#334155] leading-tight">
                    Answered and Marked for review
                  </span>
                </div>
              </div>

              {/* Collapsible Sections List */}
              <div className="flex-1 divide-y divide-[#e2e8f0]">
                {Array.from(sectionsMap.entries()).map(([sectionName, sectionData]) => {
                  const isCollapsed = !!collapsedSections[sectionName];

                  return (
                    <div key={sectionName} className="border-b border-[#e2e8f0] last:border-b-0">
                      
                      {/* Section Header */}
                      <button
                        type="button"
                        onClick={() => toggleSectionCollapse(sectionName)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-[#1e293b] hover:bg-slate-50 transition-colors"
                      >
                        <span className="truncate pr-2">{sectionName}</span>
                        {isCollapsed ? (
                          <ChevronDown size={16} className="text-[#64748b] shrink-0" />
                        ) : (
                          <ChevronUp size={16} className="text-[#64748b] shrink-0" />
                        )}
                      </button>

                      {/* Section Number Badges Grid */}
                      {!isCollapsed && (
                        <div className="px-4 pb-4 pt-1 flex flex-wrap gap-2.5">
                          {sectionData.indices.map((qIdx) => {
                            const q = questions[qIdx];
                            const hasAnswer = !!answers[q.id];
                            const isMarked = !!markedForReview[q.id];
                            const isCurrent = qIdx === currentQ;

                            let bgClass = "bg-[#f1f5f9] text-[#334155] border border-[#cbd5e1]"; // default unvisited / unattempted neutral
                            let showGreenDot = false;

                            if (hasAnswer && isMarked) {
                              bgClass = "bg-[#1976d2] text-white border-[#1976d2]";
                              showGreenDot = true;
                            } else if (isMarked) {
                              bgClass = "bg-[#1976d2] text-white border-[#1976d2]";
                            } else if (hasAnswer) {
                              bgClass = "bg-[#1dbf73] text-white border-[#1dbf73]";
                            } else if (visitedQuestions[q.id]) {
                              bgClass = "bg-[#eb5757] text-white border-[#eb5757]";
                            }

                            return (
                              <button
                                key={q.id}
                                type="button"
                                onClick={() => {
                                  setCurrentQ(qIdx);
                                  if (window.innerWidth < 1024) setShowPalette(false);
                                }}
                                className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-md font-bold text-xs sm:text-sm flex items-center justify-center transition-all shadow-2xs hover:opacity-90 active:scale-95 ${bgClass} ${
                                  isCurrent ? "ring-2 ring-[#2563eb] ring-offset-2 ring-offset-white font-extrabold scale-105" : ""
                                }`}
                              >
                                {qIdx + 1}
                                {showGreenDot && (
                                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#1dbf73] border-2 border-white" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* 6. REPORT ISSUE MODAL                                        */}
      {/* ============================================================ */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-7 max-w-md w-full border border-slate-200 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-base">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
                <span>Report Issue / Feedback</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReportModal(false);
                  setReportSuccess(false);
                  setReportNote("");
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="font-bold text-base text-slate-900">Feedback Logged</h3>
                <p className="text-xs text-slate-500">
                  Thank you! Your issue for Question {currentQ + 1} has been reported to the academic invigilator team.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Question <span className="font-bold text-slate-900">#{currentQ + 1}</span>: If you notice any typo, incorrect options, or question blueprint error, please describe it below:
                </p>
                <textarea
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="Describe the issue with this question..."
                  rows={4}
                  className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none resize-none"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReportSuccess(true);
                      setTimeout(() => {
                        setShowReportModal(false);
                        setReportSuccess(false);
                        setReportNote("");
                      }, 1800);
                    }}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
                  >
                    Submit Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. FULLSCREEN ENFORCEMENT WARNING MODAL                      */}
      {/* ============================================================ */}
      {showFullscreenWarning && (
        <div className="fixed inset-0 bg-black/95 z-[110] flex items-center justify-center p-4">
          <div className="bg-[#1e293b] rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center border border-red-500/50 text-white">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">CRITICAL WARNING: Fullscreen Exited!</h2>
            <p className="text-gray-300 mb-4 text-sm leading-relaxed">
              You have exited Fullscreen Mode or switched context. PIECHEM Security Rules require all exams to remain in Fullscreen Mode continuously.
            </p>
            <div className="bg-red-950/40 border border-red-500/30 rounded-lg p-3 mb-6">
              <p className="text-red-400 font-bold text-xs">
                ⚠️ Returning to normal view, switching tabs, or using other apps will result in IMMEDIATE AUTOMATIC SUBMISSION of your test!
              </p>
            </div>
            <div className="flex space-x-4">
              <button 
                type="button"
                onClick={() => submitTest("EXITED_FULLSCREEN")}
                disabled={isSubmitting}
                className="flex-1 bg-[#262626] hover:bg-red-900/60 text-red-300 font-medium py-3 rounded-lg border border-red-900/40 text-xs"
              >
                Submit &amp; Exit Test
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(console.error);
                  } else if ((document.documentElement as any).webkitRequestFullscreen) {
                    (document.documentElement as any).webkitRequestFullscreen();
                  }
                  setShowFullscreenWarning(false);
                }}
                disabled={isSubmitting}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg text-xs shadow-lg"
              >
                Return to Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. SUBMIT (FINISH) CONFIRMATION MODAL                        */}
      {/* ============================================================ */}
      {showSubmitConfirm && !showFullscreenWarning && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center border border-slate-200 text-slate-800">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Submit Examination</h2>
            <p className="text-slate-500 mb-6 text-xs sm:text-sm">
              Are you sure you want to finish your test? You will not be able to change your answers after submission.
            </p>

            {/* Test Summary breakdown */}
            <div className="grid grid-cols-4 gap-2 p-3 mb-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div>
                <span className="block text-lg font-extrabold text-[#1dbf73]">
                  {answeredCount}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Answered</span>
              </div>
              <div>
                <span className="block text-lg font-extrabold text-[#1976d2]">
                  {markedForReviewCount}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Review</span>
              </div>
              <div>
                <span className="block text-lg font-extrabold text-[#1976d2]">
                  {answeredAndMarkedCount}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Ans+Rev</span>
              </div>
              <div>
                <span className="block text-lg font-extrabold text-[#eb5757]">
                  {unattemptedCount}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Unattempted</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button 
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                disabled={isSubmitting}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm"
              >
                Back to Test
              </button>
              <button 
                type="button"
                onClick={() => submitTest("MANUAL_SUBMISSION")}
                disabled={isSubmitting}
                className="flex-1 bg-[#22863a] hover:bg-[#1f7b35] text-white font-bold py-2.5 rounded-lg shadow-md text-xs sm:text-sm"
              >
                Yes, Finish &amp; Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
