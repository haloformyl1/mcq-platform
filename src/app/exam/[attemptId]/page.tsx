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
      {/* 1. TOP HEADER (Royal Deep Blue: #2354c4)                     */}
      {/* ============================================================ */}
      <header className="bg-[#2452c9] text-white px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-sm z-30">
        {/* Left: Candidate Profile Avatar & Name */}
        <div className="flex items-center gap-3 min-w-0 max-w-[280px] sm:max-w-sm">
          <div className="w-10 h-10 rounded-full bg-[#fce786] p-0.5 shrink-0 flex items-center justify-center overflow-hidden border-2 border-white/80 shadow-xs">
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
              <div className="w-full h-full rounded-full bg-[#fed7aa] flex items-center justify-center">
                <svg className="w-8 h-8 text-[#ea580c] fill-[#ea580c]" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
            )}
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-white truncate">
            {student?.name || "STUDENT CANDIDATE"}
          </span>
        </div>

        {/* Center: Test Title */}
        <div className="hidden lg:flex flex-1 justify-center px-6 text-center">
          <h1 className="text-sm md:text-base font-bold text-white max-w-3xl line-clamp-2 leading-snug">
            {testInfo.title || "Examination Assessment"}
          </h1>
        </div>

        {/* Right: Time Remaining Box + Finish (Submit) Button */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold text-blue-100 tracking-tight">
              Time Remaining
            </span>
            <div className="bg-[#6b8ff0] rounded px-3.5 sm:px-4 py-0.5 font-sans text-sm sm:text-base font-bold text-white text-center min-w-[70px]">
              {timeLeft}
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualSubmit}
            disabled={isSubmitting}
            className="bg-[#22863a] hover:bg-[#1e7e34] active:bg-[#19692c] text-white font-bold text-sm sm:text-base px-6 sm:px-7 py-2 rounded-md shadow-xs transition-colors active:scale-98 disabled:opacity-50 cursor-pointer"
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
      {/* 2. SUB-BAR: Question [X / Y] + Refresh + Note + Report Issue */}
      {/* ============================================================ */}
      <div className="bg-white px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-3">
          <span className="text-sm sm:text-base font-medium text-[#1e293b]">
            Question
          </span>
          <div className="bg-[#0b5cbe] text-white px-3 py-0.5 rounded text-sm font-bold tracking-wider">
            {currentQ + 1} / {questions.length}
          </div>
          <button
            type="button"
            onClick={() => handleClearAnswer(currentQuestion.id)}
            title="Refresh / reset selection"
            className="p-1 text-[#334155] hover:text-[#0f172a] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Note pencil button */}
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#5c53f5] hover:bg-[#4d44f7] text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
            title="Notes / Issue"
          >
            <Edit3 className="w-4 h-4 fill-white/20" />
          </button>

          {/* Report Issue button */}
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="px-3 sm:px-3.5 py-1 rounded border border-[#cbd5e1] hover:border-[#94a3b8] bg-white hover:bg-slate-50 text-[#334155] text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer"
          >
            REPORT ISSUE
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MARKING SCHEME STRIP (Royal Blue: #2655cc)                */}
      {/* ============================================================ */}
      <div className="bg-[#2452c9] text-white px-4 sm:px-6 py-1 flex items-center justify-end gap-2 text-xs font-semibold shrink-0">
        <span className="tracking-normal font-medium">Marking Scheme</span>
        <span className="bg-white text-[#2452c9] font-bold px-2 py-0.5 rounded text-xs leading-none">
          +{positiveMarks}
        </span>
        <span className="bg-white text-[#2452c9] font-bold px-2 py-0.5 rounded text-xs leading-none">
          {negativeMarks > 0 ? `-${negativeMarks}` : "0"}
        </span>
      </div>

      {/* ============================================================ */}
      {/* 4. MAIN EXAM STAGE: QUESTION AREA (LEFT) + PALETTE (RIGHT)   */}
      {/* ============================================================ */}
      <div className="flex flex-1 overflow-hidden relative min-h-0 bg-white">
        
        {/* LEFT COLUMN: Question Box + Direction + Choices + Bottom Bar */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-white min-h-0">
          
          {/* Direction / Section Instruction Ribbon (Light lavender #dbe4f6) */}
          <div className="bg-[#dbe4f6] px-4 sm:px-6 py-1.5 text-xs sm:text-sm text-[#1e293b]">
            <span className="font-bold text-[#1e293b]">
              Direction:
            </span>{" "}
            Fill in the blank space with a grammatically correct choice.
          </div>

          {/* Question Text & Media Container */}
          <div className="flex-1 p-4 sm:p-6 md:p-8 w-full space-y-6">
            
            {/* Question Text */}
            <div className="text-base sm:text-lg font-medium text-[#1e293b] leading-relaxed break-words whitespace-pre-line">
              {currentQuestion.questionText}
            </div>

            {/* Optional Question Image / Diagram */}
            {currentQuestion.imageUrl && (
              <div className="my-3 flex justify-start">
                <div className="relative max-w-full rounded-lg overflow-hidden border border-[#cbd5e1] bg-slate-50 p-2">
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Question Diagram"
                    className="max-h-80 sm:max-h-96 w-auto object-contain rounded-md"
                  />
                </div>
              </div>
            )}

            {/* MCQ Options with Round Circle Letter Badges: A, B, C, D */}
            <div className="space-y-3 sm:space-y-3.5 pt-1">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const optKey = `option${opt}` as keyof typeof currentQuestion;
                const optText = currentQuestion[optKey];
                const isSelected = answers[currentQuestion.id] === opt;

                return (
                  <div
                    key={opt}
                    onClick={() => handleOptionSelect(currentQuestion.id, opt)}
                    className="flex items-center gap-3.5 sm:gap-4 py-1.5 cursor-pointer text-sm sm:text-base group select-none"
                  >
                    {/* Circle Letter Badge */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-normal text-xs sm:text-sm border transition-colors shrink-0 ${
                        isSelected
                          ? "bg-[#2563eb] text-white border-[#2563eb]"
                          : "bg-white text-[#2563eb] border-[#3b82f6] group-hover:border-[#1d4ed8]"
                      }`}
                    >
                      {opt}
                    </div>

                    {/* Option Text */}
                    <span className={`flex-1 font-medium leading-relaxed break-words ${
                      isSelected ? "text-[#1d4ed8] font-bold" : "text-[#1e293b]"
                    }`}>
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
          <div className="bg-transparent px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Left Controls: Clear | Mark For Review & Next | Save & Mark For Review */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleClearAnswer(currentQuestion.id)}
                className="bg-[#735118] hover:bg-[#604211] active:bg-[#4d340b] text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 rounded shadow-2xs transition-colors cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={handleMarkForReviewAndNext}
                className="bg-[#24a0bd] hover:bg-[#1e89a3] active:bg-[#187288] text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 rounded shadow-2xs transition-colors cursor-pointer"
              >
                Mark For Review &amp; Next
              </button>

              <button
                type="button"
                onClick={handleSaveAndMarkForReview}
                className="bg-[#1266af] hover:bg-[#0f5491] active:bg-[#0c4273] text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 rounded shadow-2xs transition-colors cursor-pointer"
              >
                Save &amp; Mark For Review
              </button>
            </div>

            {/* Right Controls: Previous | Save and Next */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentQ === 0}
                className="bg-[#e74c3c] hover:bg-[#d63031] active:bg-[#c0392b] text-white font-bold text-xs sm:text-sm px-5 sm:px-6 py-2 rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={handleSaveAndNext}
                className="bg-[#0f7938] hover:bg-[#0d6730] active:bg-[#0a5226] text-white font-bold text-xs sm:text-sm px-5 sm:px-6 py-2 rounded shadow-2xs transition-colors cursor-pointer"
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

            <aside className="fixed inset-y-0 right-0 z-50 w-[85vw] max-w-sm lg:w-[380px] xl:w-[420px] lg:relative lg:z-10 lg:block bg-white border-l border-[#e2e8f0] overflow-y-auto flex flex-col shadow-xl lg:shadow-none">
              
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
              <div className="p-4 sm:p-5 grid grid-cols-2 gap-x-4 gap-y-3.5 border-b border-[#e2e8f0] bg-white">
                
                {/* 1. Unattempted (Coral Red: #eb5757) */}
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded bg-[#ef5350] text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {unattemptedCount}
                  </span>
                  <span className="text-xs font-bold text-[#1e293b] leading-tight">
                    Unattempted
                  </span>
                </div>

                {/* 2. Marked for Review (Cobalt Blue: #0288d1) */}
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded bg-[#0288d1] text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {markedForReviewCount}
                  </span>
                  <span className="text-xs font-bold text-[#1e293b] leading-tight">
                    Marked for Review
                  </span>
                </div>

                {/* 3. Answered (Vibrant Emerald Green: #00c853) */}
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded bg-[#00c853] text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {answeredCount}
                  </span>
                  <span className="text-xs font-bold text-[#1e293b] leading-tight">
                    Answered
                  </span>
                </div>

                {/* 4. Answered and Marked for review (Cobalt Blue with Green Pin Dot) */}
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded bg-[#0288d1] text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {answeredAndMarkedCount}
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00e676] border border-white" />
                  </div>
                  <span className="text-xs font-bold text-[#1e293b] leading-tight">
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
                        className="w-full px-5 py-3 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-[#1e293b] hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <span className="truncate pr-2">{sectionName}</span>
                        {isCollapsed ? (
                          <ChevronDown size={18} className="text-[#334155] shrink-0" />
                        ) : (
                          <ChevronUp size={18} className="text-[#334155] shrink-0" />
                        )}
                      </button>

                      {/* Section Number Badges Grid */}
                      {!isCollapsed && (
                        <div className="px-5 pb-5 pt-1 flex flex-wrap gap-2.5">
                          {sectionData.indices.map((qIdx) => {
                            const q = questions[qIdx];
                            const hasAnswer = !!answers[q.id];
                            const isMarked = !!markedForReview[q.id];
                            const isCurrent = qIdx === currentQ;

                            let bgClass = "bg-[#f8fafc] text-[#1e293b]"; // default unvisited neutral soft pill
                            let showGreenDot = false;

                            if (hasAnswer && isMarked) {
                              bgClass = "bg-[#0288d1] text-white";
                              showGreenDot = true;
                            } else if (isMarked) {
                              bgClass = "bg-[#0288d1] text-white";
                            } else if (hasAnswer) {
                              bgClass = "bg-[#00c853] text-white";
                            } else if (visitedQuestions[q.id] || isCurrent) {
                              bgClass = "bg-[#ef5350] text-white"; // current/visited unattempted turns coral red
                            }

                            return (
                              <button
                                key={q.id}
                                type="button"
                                onClick={() => {
                                  setCurrentQ(qIdx);
                                  if (window.innerWidth < 1024) setShowPalette(false);
                                }}
                                className={`relative w-8 h-8 rounded-sm font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${bgClass}`}
                              >
                                {qIdx + 1}
                                {showGreenDot && (
                                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00e676] border border-white" />
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
