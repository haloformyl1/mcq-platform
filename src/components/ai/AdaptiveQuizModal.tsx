"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, X, CheckCircle2, XCircle, ArrowRight, RefreshCw, 
  Lightbulb, Award, Target, HelpCircle, ChevronRight, BookOpen
} from "lucide-react";

interface Question {
  id?: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty?: string;
  chapter?: string;
  topic?: string;
}

interface AdaptiveQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTopic?: string;
  onFinished?: () => void;
}

export default function AdaptiveQuizModal({
  isOpen,
  onClose,
  targetTopic,
  onFinished
}: AdaptiveQuizModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [hintLevel, setHintLevel] = useState<Record<number, number>>({});
  const [hints, setHints] = useState<Record<number, any>>({});
  const [loadingHint, setLoadingHint] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [drillTopic, setDrillTopic] = useState<string>(targetTopic || "Periodic Trends & Atomic Structure");

  useEffect(() => {
    if (!isOpen) return;
    fetchAdaptiveQuestions();
  }, [isOpen, targetTopic]);

  const fetchAdaptiveQuestions = async () => {
    setLoading(true);
    setError(null);
    setIsFinished(false);
    setCurrentIdx(0);
    setSelectedAnswers({});
    setShowExplanation({});
    setHintLevel({});
    setHints({});

    try {
      const res = await fetch("/api/ai/quiz/adaptive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "Chemistry",
          count: 5,
          language: "en"
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate adaptive quiz");
      }

      if (!data.questions || data.questions.length === 0) {
        throw new Error("No questions generated. Please try again.");
      }

      setQuestions(data.questions);
      if (data.targetTopic) setDrillTopic(data.targetTopic);
    } catch (err: any) {
      console.error("Adaptive quiz load error:", err);
      setError(err.message || "Failed to generate adaptive quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (selectedAnswers[currentIdx]) return; // already answered
    setSelectedAnswers(prev => ({ ...prev, [currentIdx]: opt }));
    setShowExplanation(prev => ({ ...prev, [currentIdx]: true }));
  };

  const handleFetchHint = async () => {
    const q = questions[currentIdx];
    if (!q || loadingHint === currentIdx) return;

    const currentHintLvl = hintLevel[currentIdx] || 0;
    const nextLvl = Math.min(currentHintLvl + 1, 3);

    setLoadingHint(currentIdx);
    try {
      const res = await fetch("/api/ai/doubt-solver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: q.questionText,
          options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
          correctAnswer: q.correctAnswer,
          hintLevel: nextLvl,
          language: "en"
        })
      });

      const data = await res.json();
      if (data.success) {
        setHints(prev => ({ ...prev, [currentIdx]: data.doubtSolution }));
        setHintLevel(prev => ({ ...prev, [currentIdx]: nextLvl }));
      }
    } catch (err) {
      console.error("Hint fetch failed:", err);
    } finally {
      setLoadingHint(null);
    }
  };

  if (!isOpen) return null;

  const currentQ = questions[currentIdx];
  const userPick = selectedAnswers[currentIdx];
  const isAnswered = !!userPick;
  const isCorrect = userPick === currentQ?.correctAnswer;

  const correctCount = Object.entries(selectedAnswers).filter(
    ([idx, ans]) => questions[Number(idx)]?.correctAnswer === ans
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#071622] text-white shadow-2xl shadow-cyan-950/80 max-h-[92vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#091b29] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white shadow-md shadow-emerald-500/30">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">AI Adaptive Mastery Drill</h3>
                <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/40">
                  Dynamic Difficulty
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Targeting identified weak topics &bull; <span className="text-cyan-300 font-medium">{drillTopic}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <RefreshCw className="h-10 w-10 text-cyan-400 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Analyzing Your Learning Telemetry...</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Generating validated MCQs tailored to your recent mistake patterns and difficulty thresholds.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-3">
              <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300 max-w-md mx-auto">
                {error}
              </div>
              <button
                type="button"
                onClick={fetchAdaptiveQuestions}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" /> Try Again
              </button>
            </div>
          ) : isFinished ? (
            /* Results Screen */
            <div className="py-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white shadow-xl shadow-emerald-500/30 mx-auto">
                <Award className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-white">Adaptive Drill Completed!</h3>
                <p className="text-sm text-slate-300">
                  You scored <strong className="text-emerald-400 font-mono text-base">{correctCount}</strong> out of <strong className="font-mono text-base">{questions.length}</strong> ({Math.round((correctCount / questions.length) * 100)}%)
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 p-4 max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Topic Targeted:</span>
                  <span className="font-semibold text-cyan-300">{drillTopic}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Adaptive Telemetry:</span>
                  <span className="text-emerald-300 font-semibold">
                    {correctCount >= 4 ? "+15% Mastery Confidence" : "+8% Conceptual Reinforcement"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Recommended Next Step:</span>
                  <span className="text-slate-200 font-medium">
                    {correctCount === 5 ? "Advance to HOTS level" : "Review mistake explanations below"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={fetchAdaptiveQuestions}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" /> Next Adaptive Drill
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFinished(false);
                    setCurrentIdx(0);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-medium text-slate-200 transition-all cursor-pointer"
                >
                  <BookOpen className="h-4 w-4" /> Review Questions
                </button>
              </div>
            </div>
          ) : currentQ ? (
            /* Question Card */
            <div className="space-y-4">
              {/* Question Progress & Meta */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-400">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-black/50 border border-white/10 px-2 py-0.5 text-[10px] text-slate-300 font-medium">
                    {currentQ.difficulty || 'Moderate'}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {currentQ.topic || drillTopic}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-sm sm:text-base font-semibold leading-relaxed text-white">
                  {currentQ.questionText}
                </p>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 gap-2.5">
                {(['A', 'B', 'C', 'D'] as const).map(opt => {
                  const optText = currentQ[`option${opt}` as keyof Question];
                  const isSelected = userPick === opt;
                  const isOptCorrect = currentQ.correctAnswer === opt;

                  let style = "border-white/10 bg-white/5 hover:bg-white/10 text-slate-200";
                  if (isAnswered) {
                    if (isOptCorrect) {
                      style = "border-emerald-500/80 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-500/40";
                    } else if (isSelected && !isOptCorrect) {
                      style = "border-red-500/80 bg-red-950/40 text-red-200 ring-1 ring-red-500/40";
                    } else {
                      style = "border-white/5 bg-black/20 text-slate-500 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(opt)}
                      className={`flex items-center justify-between rounded-xl border p-3.5 text-left text-xs sm:text-sm font-medium transition-all cursor-pointer ${style}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/40 text-xs font-bold shrink-0 border border-white/10">
                          {opt}
                        </span>
                        <span className="break-words leading-snug">{optText}</span>
                      </div>

                      {isAnswered && (
                        <div>
                          {isOptCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
                          {isSelected && !isOptCorrect && <XCircle className="h-5 w-5 text-red-400 shrink-0" />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Progressive Hint Drawer (Before or After Answering) */}
              {!isAnswered && (
                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleFetchHint}
                    disabled={loadingHint === currentIdx}
                    className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span>
                      {loadingHint === currentIdx 
                        ? "Thinking..." 
                        : (hintLevel[currentIdx] ? `Get Hint ${hintLevel[currentIdx] + 1}` : "Need a Conceptual Hint?")}
                    </span>
                  </button>
                </div>
              )}

              {/* Displayed Hint Box */}
              {hints[currentIdx] && !isAnswered && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs text-amber-200 animate-in fade-in space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300 uppercase text-[10px] tracking-wider">
                    <Lightbulb className="h-3.5 w-3.5" /> Hint Level {hintLevel[currentIdx]}
                  </div>
                  <p className="leading-relaxed">{hints[currentIdx].content || hints[currentIdx].hint || hints[currentIdx].explanation}</p>
                </div>
              )}

              {/* Explanation Box After Answering */}
              {isAnswered && (
                <div className="rounded-xl border border-cyan-500/30 bg-[#091f2f] p-4 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-xs uppercase tracking-wider ${isCorrect ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isCorrect ? "Correct Concept!" : "Conceptual Clarification"}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Correct Answer: <strong className="text-emerald-300 font-bold">{currentQ.correctAnswer}</strong>
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed break-words font-medium">
                    {currentQ.explanation}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer Navigation Bar */}
        {!loading && !error && !isFinished && currentQ && (
          <div className="flex items-center justify-between border-t border-white/10 bg-[#091b29] p-4">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(prev => prev - 1)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>

            <div className="flex items-center gap-1.5">
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIdx 
                      ? 'w-6 bg-cyan-400' 
                      : selectedAnswers[idx] 
                      ? (selectedAnswers[idx] === questions[idx].correctAnswer ? 'w-2 bg-emerald-400' : 'w-2 bg-red-400')
                      : 'w-2 bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {currentIdx < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIdx(prev => prev + 1)}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsFinished(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <span>Finish Drill</span>
                <CheckCircle2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
