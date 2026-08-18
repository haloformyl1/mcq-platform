"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";

import { useRouter } from "next/navigation";
import { Menu, X, Minimize2, Maximize2, AlertTriangle } from "lucide-react";
import { useProctoring } from "@/hooks/useProctoring";
import { useAudioProctoring } from "@/hooks/useAudioProctoring";
import { useRollingRecorder } from "@/hooks/useRollingRecorder";
import AdminPreviewBanner from "@/components/AdminPreviewBanner";
import PiechemLogo from "@/components/PiechemLogo";
import PiFiringLoader from "@/components/PiFiringLoader";
import MobileEnvironmentScanner from "@/components/MobileEnvironmentScanner";

export default function ExamSession({ params }: { params: Promise<{ attemptId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [examData, setExamData] = useState<any>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<string>("--:--");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [isCameraMinimized, setIsCameraMinimized] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [needsMobileScan, setNeedsMobileScan] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const [proctoringSettings, setProctoringSettings] = useState<any>({
    enforceFullscreen: true,
    enableAiProctoring: true,
    faceAbsenceDelaySeconds: 30,
    maxAllowedWarnings: 5,
    tabSwitchAction: "AUTO_SUBMIT",
    enableAudioProctoring: true,
    audioNoiseDelaySeconds: 10,
    maxAudioWarnings: 3,
    enableMobileEnvironmentScan: true
  });

  const { get1MinClipBlob } = useRollingRecorder(mediaStream);

  const handleWarningTrigger = useCallback(async (warningType: "EYE_SLIP" | "AUDIO_NOISE", message: string) => {
    try {
      const clipBlob = await get1MinClipBlob();
      const formData = new FormData();
      formData.append("attemptId", resolvedParams.attemptId);
      formData.append("warningType", warningType);
      formData.append("message", message);
      
      const qNum = currentQ + 1;
      const qText = examData?.questions?.[currentQ]?.questionText || "";
      formData.append("questionNumber", qNum.toString());
      formData.append("questionText", qText);

      if (clipBlob) {
        formData.append("file", clipBlob, `clip_${warningType}_${Date.now()}.webm`);
      }

      await fetch("/api/exam/log-warning", {
        method: "POST",
        body: formData
      });
    } catch (err) {
      console.error("Failed to upload proctoring warning clip:", err);
    }
  }, [resolvedParams.attemptId, get1MinClipBlob, currentQ, examData]);

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (window.innerWidth >= 1024) setShowPalette(true);
    const data = localStorage.getItem(`exam_${resolvedParams.attemptId}`);
    if (data) {
      const parsed = JSON.parse(data);
      setExamData(parsed);
      examDataRef.current = parsed;
    } else {
      alert("Exam session data not found. Please contact administrator.");
      router.push("/dashboard");
    }
    
    if (proctoringSettings.enforceFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => console.warn("Fullscreen denied by browser"));
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        (document.documentElement as any).webkitRequestFullscreen();
      }
    }

    if (proctoringSettings.enableAiProctoring || proctoringSettings.enableAudioProctoring) {
      // Request camera and microphone access for proctoring
      navigator.mediaDevices.getUserMedia({
        video: proctoringSettings.enableAiProctoring ?? true,
        audio: proctoringSettings.enableAudioProctoring ?? true
      })
        .then(stream => {
          streamRef.current = stream;
          setMediaStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Camera/Microphone access denied or failed", err);
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [resolvedParams.attemptId, router, proctoringSettings.enforceFullscreen, proctoringSettings.enableAiProctoring, proctoringSettings.enableAudioProctoring]);

  const submitTest = useCallback(async (reason: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: resolvedParams.attemptId, reason })
      });
      localStorage.removeItem(`exam_${resolvedParams.attemptId}`);
      router.push(`/exam/result/${resolvedParams.attemptId}`);
    } catch (e) {
      console.error("Submission failed", e);
    }
  }, [resolvedParams.attemptId, router, isSubmitting]);

  const { warningsLeft, showSlipWarning, setShowSlipWarning, isAiActive } = useProctoring(
    videoRef,
    submitTest,
    !!examData,
    proctoringSettings.faceAbsenceDelaySeconds ?? 10,
    proctoringSettings.maxAllowedWarnings ?? 5,
    proctoringSettings.enableAiProctoring ?? true,
    handleWarningTrigger
  );

  const { audioWarningsLeft, showAudioWarning, setShowAudioWarning } = useAudioProctoring(
    streamRef.current,
    submitTest,
    !!examData,
    proctoringSettings.audioNoiseDelaySeconds ?? 10,
    proctoringSettings.maxAudioWarnings ?? 3,
    proctoringSettings.enableAudioProctoring ?? true,
    handleWarningTrigger
  );


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
      if (proctoringSettings.tabSwitchAction === "ALLOW" || isPermissionPromptingRef.current) return;
      submitTest("WINDOW_BLUR");
    };

    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement || (document as any).webkitFullscreenElement;
      if (!isFullscreen) {
        setShowFullscreenWarning(true);
        // Instant enforcement: Attempt immediate re-entry into fullscreen
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

    // Check immediately on mount if browser is not in fullscreen
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
  }, [examData, submitTest]);

  const handleOptionSelect = async (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
    lastActivityTime.current = Date.now();
    
    fetch("/api/exam/save-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId: resolvedParams.attemptId,
        questionId,
        selectedAnswer: option
      })
    }).catch(console.error);
  };

  const handleManualSubmit = () => {
    setShowSubmitConfirm(true);
  };

  if (!examData) return <PiFiringLoader fullScreen={true} />;

  const questions = examData.questions;
  const currentQuestion = questions[currentQ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black text-white select-none font-sans">
      <AdminPreviewBanner />
      <header className="bg-[#161616]/40 p-4 flex flex-col md:flex-row md:justify-between md:items-center border-b border-[#404040] gap-4">
        <div className="flex justify-between items-center w-full md:w-auto gap-3">
          <PiechemLogo size="sm" showText={false} />
          <div className="pr-2">
            <h1 className="text-lg md:text-xl font-bold tracking-wide break-words">{examData.test.title}</h1>
            <p className="text-sm text-[#a6a6a6] mt-0.5">Question {currentQ + 1} of {questions.length}</p>
          </div>
          <div className="text-lg md:text-2xl font-mono font-semibold bg-[#262626] px-3 py-1.5 md:py-2 md:px-4 rounded-lg text-white shrink-0">
            {timeLeft}
          </div>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <button
            onClick={() => {
              const docEl = document.documentElement as any;
              if (docEl.requestFullscreen) docEl.requestFullscreen().catch((e: any) => console.warn(e));
              else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
            }}
            className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-[#262626] hover:bg-[#333333] rounded-md text-cyan-400 border border-cyan-500/40 text-sm md:text-base"
            title="Enter Fullscreen"
          >
            <Maximize2 size={18} />
            <span className="font-medium hidden sm:inline text-xs">Fullscreen</span>
          </button>
          <button 
            onClick={handleManualSubmit}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md shadow-sm disabled:opacity-50 text-sm md:text-base flex-1 md:flex-none"
          >
            Submit
          </button>
          <button
            onClick={() => setShowPalette(!showPalette)}
            className="flex items-center justify-center space-x-2 py-2 px-3 md:px-4 bg-[#262626] hover:bg-[#333333] rounded-md text-white transition-colors border border-[#404040] text-sm md:text-base flex-1 md:flex-none"
            title="Toggle Question Palette"
            aria-label={showPalette ? "Hide question palette" : "Show question palette"}
          >
            <Menu size={20} />
            <span className="font-medium hidden sm:inline">{showPalette ? 'Hide Palette' : 'Show Palette'}</span>
            <span className="font-medium sm:hidden">Questions</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-4xl mx-auto w-full bg-[#161616]/80 border border-[#404040] rounded-xl p-4 sm:p-8 shadow-2xl">
            {/* Inline Camera Preview (Responsive & Safe) */}
            <div className="mb-6 flex justify-between items-start gap-4">
              <h2 className="text-xl font-medium text-[#a6a6a6] pt-1">
                Question <span className="font-bold text-white text-2xl">{currentQ + 1}</span>
              </h2>
              <div className={`transition-all duration-300 bg-black rounded-lg overflow-hidden shadow-lg border border-gray-700 relative flex-shrink-0 ${isCameraMinimized ? 'w-20 sm:w-24' : 'w-28 sm:w-36 md:w-48'}`}>
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent p-1.5 sm:p-2">
                  <div className="flex items-center text-[10px] sm:text-xs text-white font-bold tracking-wider drop-shadow-md">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-pulse mr-1.5"></div>
                    REC
                    {isAiActive && <span className="ml-2 text-[9px] text-green-400 bg-black/40 px-1 rounded border border-green-500/30">AI On</span>}
                  </div>
                  <button 
                    onClick={() => setIsCameraMinimized(!isCameraMinimized)} 
                    className="text-white hover:text-gray-300 p-0.5 sm:p-1 bg-black/40 rounded transition-colors" 
                    title={isCameraMinimized ? "Expand Camera" : "Minimize Camera"}
                    aria-label={isCameraMinimized ? "Expand Camera" : "Minimize Camera"}
                  >
                    {isCameraMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                  </button>
                </div>
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full object-cover transform -scale-x-100 transition-all duration-300 ${isCameraMinimized ? 'h-7 sm:h-8 opacity-40' : 'h-auto opacity-100'}`}
                ></video>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-medium mb-8 leading-relaxed">
              {currentQuestion.questionText}
            </h2>
            
            <div className="space-y-4">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const optKey = `option${opt}` as keyof typeof currentQuestion;
                const optText = currentQuestion[optKey];
                const isSelected = answers[currentQuestion.id] === opt;
                
                return (
                  <div 
                    key={opt}
                    onClick={() => handleOptionSelect(currentQuestion.id, opt)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors duration-150 ${
                      isSelected 
                        ? 'border-[#0099ff] bg-[#0099ff]/20' 
                        : 'border-[#404040] hover:border-white hover:bg-[#262626]'
                    }`}
                  >
                    <span className="font-bold mr-3">{opt}.</span> {optText}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mt-12 pt-6 border-t border-[#404040] gap-4">
              <div className="flex justify-between w-full sm:hidden order-2 gap-4">
                <button 
                  onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
                  disabled={currentQ === 0}
                  className="flex-1 px-4 py-3 bg-[#262626] text-[#a6a6a6] font-medium rounded-md hover:bg-[#333333] hover:text-white disabled:opacity-50 transition"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setCurrentQ(prev => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentQ === questions.length - 1}
                  className="flex-1 px-4 py-3 bg-[#0099ff] text-white font-medium rounded-md hover:bg-[#007acc] disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>

              <button 
                onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
                disabled={currentQ === 0}
                className="hidden sm:block order-1 px-6 py-2 bg-[#262626] text-[#a6a6a6] font-medium rounded-md hover:bg-[#333333] hover:text-white disabled:opacity-50 transition"
              >
                Previous
              </button>
              
              <button 
                onClick={() => setMarkedForReview(prev => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }))}
                className={`order-1 sm:order-2 px-4 py-3 sm:py-2 font-medium rounded-md border-2 transition-colors duration-150 w-full sm:w-auto text-center ${
                  markedForReview[currentQuestion.id] 
                    ? 'bg-purple-900/50 border-purple-500 text-purple-300 hover:bg-purple-800/50' 
                    : 'bg-transparent border-[#404040] text-purple-400 hover:bg-[#262626] hover:border-purple-400'
                }`}
              >
                {markedForReview[currentQuestion.id] ? "Marked for Review" : "Mark for Review"}
              </button>

              <button 
                onClick={() => setCurrentQ(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentQ === questions.length - 1}
                className="hidden sm:block order-3 px-6 py-2 bg-[#0099ff] text-white font-medium rounded-md hover:bg-[#007acc] disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
            
            {/* Modern Glassmorphic Author Badge */}
            <div className="mt-8 flex justify-center pb-4">
              <div className="px-4 py-2 rounded-full bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] text-xs text-slate-300 font-medium tracking-wide flex items-center space-x-2">
                <span className="text-slate-400">Prepared by</span>
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400">
                  Arghyadeep Roy
                </span>
                <span className="text-slate-600">•</span>
                <a 
                  href="tel:9830507435" 
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-cyan-950/70 text-cyan-300 hover:text-white hover:bg-cyan-600/60 border border-cyan-500/40 transition-all font-mono shadow-sm"
                  title="Call Arghyadeep Roy"
                >
                  <svg className="w-3 h-3 mr-1 text-cyan-400 fill-current" viewBox="0 0 24 24">
                    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                  <span>9830507435</span>
                </a>
              </div>
            </div>
          </div>
        </main>

        {showPalette && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setShowPalette(false)}
            />
            <aside className="fixed inset-y-0 right-0 z-50 w-[85vw] sm:w-80 bg-[#161616] border-l border-[#404040] p-6 overflow-y-auto shadow-2xl lg:relative lg:z-10 lg:block lg:bg-[#161616]/40 transition-transform flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-[#a6a6a6] uppercase tracking-wider">Question Palette</h3>
                <button 
                  onClick={() => setShowPalette(false)} 
                  className="lg:hidden p-2 bg-[#262626] rounded-md text-[#a6a6a6] hover:text-white flex items-center space-x-1"
                  aria-label="Close palette"
                >
                  <X size={16} />
                  <span className="text-sm font-medium">Close</span>
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2 sm:gap-3 flex-1 content-start">
            {questions.map((q: any, i: number) => {
              const isAnswered = !!answers[q.id];
              const isMarked = !!markedForReview[q.id];
              const isCurrent = i === currentQ;
              
              let btnClass = "";
              if (isMarked && isAnswered) {
                btnClass = "bg-purple-600 text-white border border-purple-500 shadow-sm";
              } else if (isMarked) {
                btnClass = "bg-purple-900/40 text-purple-300 border border-purple-500";
              } else if (isAnswered) {
                btnClass = "bg-[#0099ff] text-white border border-[#0099ff] shadow-sm";
              } else {
                btnClass = "bg-[#262626] text-[#a6a6a6] hover:bg-[#333333] hover:text-white border border-[#404040]";
              }
              
              if (isCurrent) {
                btnClass += " ring-2 ring-white ring-offset-2 ring-offset-[#161616]";
              }
              
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentQ(i);
                    if (window.innerWidth < 1024) {
                      setShowPalette(false);
                    }
                  }}
                  className={`h-11 w-11 sm:h-10 sm:w-10 flex items-center justify-center rounded-md text-sm font-medium transition-all ${btnClass}`}
                  aria-label={`Question ${i + 1}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          
          <div className="mt-8 space-y-3 text-sm text-[#a6a6a6] pt-6 border-t border-[#404040]">
            <div className="flex items-center"><span className="w-4 h-4 rounded bg-[#0099ff] border border-[#0099ff] mr-3"></span> Answered</div>
            <div className="flex items-center"><span className="w-4 h-4 rounded bg-purple-600 border border-purple-500 mr-3"></span> Answered & Review</div>
            <div className="flex items-center"><span className="w-4 h-4 rounded bg-purple-900/40 border border-purple-500 mr-3"></span> Review (No Answer)</div>
            <div className="flex items-center"><span className="w-4 h-4 rounded bg-[#262626] border border-[#404040] mr-3"></span> Unanswered</div>
            <div className="flex items-center"><span className="w-4 h-4 rounded bg-[#262626] ring-1 ring-white border border-[#404040] mr-3"></span> Current Question</div>
          </div>
            </aside>
          </>
        )}
      </div>

      {/* Mobile 360 Pre-Exam Scanner */}
      {needsMobileScan && (
        <MobileEnvironmentScanner
          onComplete={() => setNeedsMobileScan(false)}
          onCancel={() => router.push('/dashboard')}
        />
      )}

      {/* Fullscreen Warning Modal */}
      {showFullscreenWarning && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#161616] rounded-xl shadow-2xl p-8 max-w-md w-full text-center border border-red-500/50">
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
                onClick={() => submitTest("EXITED_FULLSCREEN")}
                disabled={isSubmitting}
                className="flex-1 bg-[#262626] hover:bg-red-900/60 text-red-300 font-medium py-3 rounded-lg border border-red-900/40 text-xs"
              >
                Submit & Exit Test
              </button>
              <button 
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

      {/* Slip Warning Modal */}
      {showSlipWarning && !showFullscreenWarning && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#161616] rounded-xl shadow-2xl p-8 max-w-md w-full text-center border border-red-500/50">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Warning: Eye Tracking</h2>
            <p className="text-[#a6a6a6] mb-4 text-lg">
              You looked away from the screen for over {proctoringSettings.faceAbsenceDelaySeconds ?? 10} seconds. This is a violation of the test rules.
            </p>
            <div className="bg-red-500/10 border border-red-500/20 rounded p-4 mb-8">
              <p className="text-red-400 font-bold text-xl">
                {warningsLeft} warning{warningsLeft !== 1 ? 's' : ''} remaining
              </p>
              <p className="text-sm text-red-400/80 mt-1">before automatic submission</p>
            </div>
            <button 
              onClick={() => setShowSlipWarning(false)}
              className="w-full bg-[#262626] hover:bg-[#333333] text-white font-medium py-3 rounded-lg border border-[#404040]"
            >
              I Understand, Return to Test
            </button>
          </div>
        </div>
      )}

      {/* Audio Noise Warning Modal */}
      {showAudioWarning && !showFullscreenWarning && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#161616] rounded-xl shadow-2xl p-8 max-w-md w-full text-center border border-red-500/50">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Warning: Microphone Audio Detection</h2>
            <p className="text-[#a6a6a6] mb-4 text-lg">
              Continuous background sound / speech was detected for over {proctoringSettings.audioNoiseDelaySeconds ?? 10} seconds. Please maintain complete silence.
            </p>
            <div className="bg-red-500/10 border border-red-500/20 rounded p-4 mb-8">
              <p className="text-red-400 font-bold text-xl">
                {audioWarningsLeft} warning{audioWarningsLeft !== 1 ? 's' : ''} remaining
              </p>
              <p className="text-sm text-red-400/80 mt-1">before automatic submission</p>
            </div>
            <button 
              onClick={() => setShowAudioWarning(false)}
              className="w-full bg-[#262626] hover:bg-[#333333] text-white font-medium py-3 rounded-lg border border-[#404040]"
            >
              I Understand, Return to Test
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && !showFullscreenWarning && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#161616] rounded-xl shadow-2xl p-8 max-w-md w-full text-center border border-[#404040]">
            <div className="w-16 h-16 bg-[#0099ff]/10 text-[#0099ff] border border-[#0099ff]/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Submit Test</h2>
            <p className="text-[#a6a6a6] mb-8 text-lg">
              Are you sure you want to submit your test? You will not be able to change your answers after submission.
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={() => setShowSubmitConfirm(false)}
                disabled={isSubmitting}
                className="flex-1 bg-[#262626] hover:bg-[#333333] text-white font-medium py-3 rounded-lg border border-[#404040]"
              >
                Cancel
              </button>
              <button 
                onClick={() => submitTest("MANUAL_SUBMISSION")}
                disabled={isSubmitting}
                className="flex-1 bg-[#0099ff] hover:bg-[#007acc] text-white font-medium py-3 rounded-lg"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
