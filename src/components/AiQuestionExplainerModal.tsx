"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle, CheckCircle2, BookOpen, Lightbulb, Atom, Loader2 } from "lucide-react";

interface AiExplainerProps {
  isOpen: boolean;
  onClose: () => void;
  question: {
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    explanation?: string;
  };
  selectedAnswer: string;
  correctAnswer: string;
}

export default function AiQuestionExplainerModal({
  isOpen,
  onClose,
  question,
  selectedAnswer,
  correctAnswer
}: AiExplainerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);

    const optionsMap: Record<string, string> = {
      A: question.optionA,
      B: question.optionB,
      C: question.optionC,
      D: question.optionD
    };

    fetch("/api/ai/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionText: question.questionText,
        options: optionsMap,
        selectedAnswer,
        correctAnswer,
        originalExplanation: question.explanation
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setDiagnosis(data);
      })
      .catch(err => {
        setError(err.message || "Failed to load AI explanation");
      })
      .finally(() => setLoading(false));
  }, [isOpen, question, selectedAnswer, correctAnswer]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#07131f] border border-cyan-500/40 rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl shadow-cyan-950/80 space-y-5 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-cyan-950 pb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
            <Atom className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-3 h-3" />
              <span>Pi-Chem AI Question Diagnostic</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mt-1">
              Why did I miss this question?
            </h3>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-400 font-mono">
              Pi-Chem AI is analyzing the chemical reaction mechanisms and distractor trap...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        {!loading && diagnosis && (
          <div className="space-y-4 text-xs sm:text-sm">
            {/* Answer Comparison Pill */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/40 flex items-center justify-between">
                <span className="text-slate-400">Your Answer:</span>
                <span className="font-extrabold text-red-400">Option {selectedAnswer}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between">
                <span className="text-slate-400">Verified Answer:</span>
                <span className="font-extrabold text-emerald-400">Option {correctAnswer}</span>
              </div>
            </div>

            {/* Misconception Trap */}
            <div className="p-4 rounded-xl bg-[#030a12] border border-cyan-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>The Distractor Trap (Why you picked Option {selectedAnswer})</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                {diagnosis.misconceptionAnalysis}
              </p>
            </div>

            {/* Step by step solution */}
            <div className="p-4 rounded-xl bg-[#030a12] border border-cyan-500/20 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Step-by-Step Chemistry Derivation</span>
              </div>
              <p className="text-slate-200 leading-relaxed text-xs whitespace-pre-line font-sans">
                {diagnosis.stepByStepSolution}
              </p>
            </div>

            {/* Key Formula */}
            {diagnosis.keyRuleOrFormula && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/30 space-y-1">
                <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider block">
                  Core Formula / Rule to Memorize
                </span>
                <p className="text-xs font-mono text-cyan-100 whitespace-pre-line">
                  {diagnosis.keyRuleOrFormula}
                </p>
              </div>
            )}

            {/* Memory Trick */}
            {diagnosis.memoryTrick && (
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>NEET / JEE Exam Trick</span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  {diagnosis.memoryTrick}
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Close Diagnostic
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
