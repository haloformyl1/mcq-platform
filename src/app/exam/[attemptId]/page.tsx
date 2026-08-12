"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";

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
  
  const lastActivityTime = useRef(Date.now());
  const examDataRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    const data = localStorage.getItem(`exam_${resolvedParams.attemptId}`);
    if (data) {
      const parsed = JSON.parse(data);
      setExamData(parsed);
      examDataRef.current = parsed;
    } else {
      alert("Exam session data not found. Please contact administrator.");
      router.push("/dashboard");
    }
    
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => console.warn("Fullscreen denied by browser"));
    } else if ((document.documentElement as any).webkitRequestFullscreen) {
      (document.documentElement as any).webkitRequestFullscreen();
    }

    // Request camera access for proctoring
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Camera access denied or failed", err);
        alert("Camera access is required for proctoring this exam. Please allow camera permissions.");
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [resolvedParams.attemptId, router]);

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

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        submitTest("TAB_SWITCH");
      }
    };
    
    const handleBlur = () => {
      // Don't auto-submit if the fullscreen warning is showing, as they might have just hit escape
      submitTest("WINDOW_BLUR");
    };

    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement || (document as any).webkitFullscreenElement;
      if (!isFullscreen) {
        setShowFullscreenWarning(true);
      }
    };

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

  if (!examData) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const questions = examData.questions;
  const currentQuestion = questions[currentQ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black text-white select-none font-sans">
      <header className="bg-[#161616]/40 px-6 py-4 flex justify-between items-center border-b border-[#404040]">
        <div>
          <h1 className="text-xl font-bold tracking-wide">{examData.test.title}</h1>
          <p className="text-sm text-[#a6a6a6]">Question {currentQ + 1} of {questions.length}</p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-2xl font-mono font-semibold bg-[#262626] px-4 py-2 rounded-lg text-white">
            {timeLeft}
          </div>
          <button 
            onClick={handleManualSubmit}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-md shadow-sm disabled:opacity-50"
          >
            Submit Test
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto bg-[#161616]/80 border border-[#404040] rounded-xl p-8 shadow-2xl">
            <h2 className="text-xl font-medium mb-6">
              <span className="font-bold mr-2">{currentQ + 1}.</span>
              {currentQuestion.questionText}
            </h2>
            
            <div className="space-y-4 mt-8">
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

            <div className="flex justify-between items-center mt-12 pt-6 border-t border-[#404040]">
              <button 
                onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
                disabled={currentQ === 0}
                className="px-6 py-2 bg-[#262626] text-[#a6a6a6] font-medium rounded-md hover:bg-[#333333] hover:text-white disabled:opacity-50 transition"
              >
                Previous
              </button>
              
              <button 
                onClick={() => setMarkedForReview(prev => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }))}
                className={`px-6 py-2 font-medium rounded-md border-2 transition-colors duration-150 ${
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
                className="px-6 py-2 bg-[#0099ff] text-white font-medium rounded-md hover:bg-[#007acc] disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        </main>

        <aside className="w-80 bg-[#161616]/40 border-l border-[#404040] p-6 overflow-y-auto shadow-sm z-10">
          <h3 className="text-sm font-bold text-[#a6a6a6] uppercase tracking-wider mb-4">Question Palette</h3>
          <div className="grid grid-cols-5 gap-2">
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
                  onClick={() => setCurrentQ(i)}
                  className={`h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-all ${btnClass}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          
          <div className="mt-8 space-y-3 text-sm text-[#a6a6a6]">
            <div className="flex items-center"><span className="w-4 h-4 rounded bg-[#0099ff] border border-[#0099ff] mr-3"></span> Answered</div>
            <div className="flex items-center"><span className="w-4 h-4 rounded bg-purple-600 border border-purple-500 mr-3"></span> Answered & Review</div>
            <div className="flex items-center"><span className="w-4 h-4 rounded bg-purple-900/40 border border-purple-500 mr-3"></span> Review (No Answer)</div>
            <div className="flex items-center"><span className="w-4 h-4 rounded bg-[#262626] border border-[#404040] mr-3"></span> Unanswered</div>
            <div className="flex items-center"><span className="w-4 h-4 rounded bg-[#262626] ring-1 ring-white border border-[#404040] mr-3"></span> Current Question</div>
          </div>
        </aside>
      </div>

      {/* Floating Proctoring Camera */}
      <div className="fixed bottom-6 left-6 w-48 bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-gray-800 z-50">
        <div className="absolute top-2 left-2 flex items-center bg-black/60 px-2 py-1 rounded text-xs text-white font-medium z-10">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
          Recording
        </div>
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted 
          className="w-full h-auto object-cover transform -scale-x-100"
        ></video>
      </div>

      {/* Fullscreen Warning Modal */}
      {showFullscreenWarning && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#161616] rounded-xl shadow-2xl p-8 max-w-md w-full text-center border border-[#404040]">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Warning!</h2>
            <p className="text-[#a6a6a6] mb-8 text-lg">
              Exiting full-screen mode during the test isn't allowed. Are you sure you want to leave the test?
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={() => submitTest("EXITED_FULLSCREEN")}
                disabled={isSubmitting}
                className="flex-1 bg-[#262626] hover:bg-[#333333] text-white font-medium py-3 rounded-lg border border-[#404040]"
              >
                Leave Test
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
                className="flex-1 bg-[#0099ff] hover:bg-[#007acc] text-white font-medium py-3 rounded-lg"
              >
                Return to Test
              </button>
            </div>
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
