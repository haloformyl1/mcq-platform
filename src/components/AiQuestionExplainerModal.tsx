"use client";

import { useState, useEffect } from "react";
import { 
  X, Sparkles, AlertCircle, CheckCircle2, BookOpen, Lightbulb, 
  Atom, Loader2, ArrowRight, RefreshCw, Languages, HelpCircle 
} from "lucide-react";
import FormattedAiMessage from "./ai/FormattedAiMessage";

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
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [hintLevel, setHintLevel] = useState<number>(1);
  const [showFullSolution, setShowFullSolution] = useState(false);
  
  // Persistent language state (synchronized with other AI tools)
  const [language, setLanguage] = useState<'en' | 'bn'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('piechem_ai_lang') as 'en' | 'bn') || 'en';
    }
    return 'en';
  });

  // Listen for language changes from other modals/drawers
  useEffect(() => {
    const handleGlobalLang = (e: any) => {
      if (e?.detail && (e.detail === 'en' || e.detail === 'bn')) {
        setLanguage(e.detail);
      }
    };
    window.addEventListener('piechem-language-changed', handleGlobalLang);
    return () => window.removeEventListener('piechem-language-changed', handleGlobalLang);
  }, []);

  const fetchDoubtSolution = (level: number, full: boolean, lang: 'en' | 'bn') => {
    setLoading(true);
    setError(null);
    setIsQuotaExceeded(false);

    const optionsMap: Record<string, string> = {
      A: question.optionA,
      B: question.optionB,
      C: question.optionC,
      D: question.optionD
    };

    fetch("/api/ai/doubt-solver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionText: question.questionText,
        options: optionsMap,
        selectedAnswer,
        correctAnswer,
        hintLevel: level,
        revealFullSolution: full,
        language: lang
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          if (data.requiresSubscription) setIsQuotaExceeded(true);
          throw new Error(data.error);
        }
        setDiagnosis(data.doubtSolution);
      })
      .catch(err => {
        const msg = err.message || "Failed to load AI pedagogical guidance.";
        if (msg.includes("limit reached") || msg.includes("Daily free AI")) {
          setIsQuotaExceeded(true);
        }
        setError(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isOpen) return;
    setHintLevel(1);
    setShowFullSolution(false);
    fetchDoubtSolution(1, false, language);
  }, [isOpen, question, selectedAnswer, correctAnswer]);

  const handleNextHint = () => {
    const next = Math.min(hintLevel + 1, 3);
    setHintLevel(next);
    fetchDoubtSolution(next, false, language);
  };

  const handleRevealFull = () => {
    setShowFullSolution(true);
    fetchDoubtSolution(hintLevel, true, language);
  };

  const handleToggleLang = (lang: 'en' | 'bn') => {
    setLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('piechem_ai_lang', lang);
      window.dispatchEvent(new CustomEvent('piechem-language-changed', { detail: lang }));
    }
    fetchDoubtSolution(hintLevel, showFullSolution, lang);
  };

  if (!isOpen) return null;

  const isCorrect = selectedAnswer === correctAnswer;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#081a28] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/80 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#091f30] p-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>PIECHEM AI Doubt Solver & Explainer</span>
                <span className="text-[10px] bg-cyan-950 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded-full font-mono">
                  Socratic Guide
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Grounded academic reasoning &bull; Progressive hints
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switch */}
            <div className="flex items-center rounded-lg border border-white/10 bg-black/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => handleToggleLang('en')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  language === 'en' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => handleToggleLang('bn')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  language === 'bn' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                বাংলা
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Question Review Strip with KaTeX formula support */}
        <div className="bg-black/40 border-b border-white/10 p-4 space-y-2">
          <div className="text-xs sm:text-sm font-semibold text-slate-200 leading-relaxed break-words">
            <FormattedAiMessage content={question.questionText} className="text-slate-200 font-semibold" />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <span className={`font-mono px-2 py-0.5 rounded border ${
              isCorrect 
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
                : 'bg-red-950/60 border-red-500/40 text-red-300'
            }`}>
              Your Pick: <strong>{selectedAnswer}</strong>
            </span>

            {showFullSolution && (
              <span className="font-mono px-2 py-0.5 rounded border bg-emerald-950/60 border-emerald-500/40 text-emerald-300">
                Correct Key: <strong>{correctAnswer}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">
                {language === 'bn' ? "শিক্ষাগত ব্যাখ্যা প্রস্তুত করা হচ্ছে..." : "Formulating step-by-step educational analysis..."}
              </p>
            </div>
          ) : error ? (
            isQuotaExceeded ? (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#120608] via-[#1a080c] to-[#0d0305] border border-amber-500/40 text-center space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-white">Daily Free AI Limit Reached (5/5)</h4>
                  <p className="text-xs text-amber-200/80 max-w-md mx-auto leading-relaxed">
                    You have used your 5 free AI queries for today. Upgrade to <strong>PIECHEM Gold (₹99/month)</strong> for unlimited AI doubts, progressive hints, and adaptive mocks — or return tomorrow for 5 new queries!
                  </p>
                </div>
                <div className="pt-2 flex justify-center items-center gap-3">
                  <a
                    href="/dashboard/account"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs shadow-lg shadow-amber-950/50 transition-all active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Upgrade to Gold (₹99)</span>
                  </a>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-300 text-center">
                {error}
              </div>
            )
          ) : diagnosis ? (
            <div className="space-y-4">
              
              {/* Progressive Hint Box with KaTeX Equations */}
              {!showFullSolution && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      {language === 'bn' ? `ইঙ্গিত ধাপ ${hintLevel} / ৩` : `Progressive Hint Level ${hintLevel} / 3`}
                    </span>
                    <span className="text-[11px] text-amber-400/70">
                      {hintLevel === 1 ? "Conceptual Clue" : hintLevel === 2 ? "Specific Guidance" : "Approach"}
                    </span>
                  </div>
                  
                  {/* KaTeX Equation Rendered Hint Content */}
                  <div className="text-sm text-amber-100 leading-relaxed font-medium">
                    <FormattedAiMessage 
                      content={diagnosis.content || diagnosis.hint || diagnosis.explanation} 
                      className="text-amber-100 [&_p]:text-amber-100 [&_.katex]:text-amber-200"
                    />
                  </div>

                  <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2">
                    {hintLevel < 3 ? (
                      <button
                        type="button"
                        onClick={handleNextHint}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white bg-amber-950/80 border border-amber-500/40 hover:bg-amber-900 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        <span>{language === 'bn' ? "পরবর্তী ইঙ্গিত" : "Need Next Hint"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-xs text-amber-400/80 italic">All hints unlocked!</span>
                    )}

                    <button
                      type="button"
                      onClick={handleRevealFull}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-white bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-900 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? "সম্পূর্ণ সমাধান দেখুন" : "Reveal Full Solution"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Full Detailed Solution with KaTeX Equations */}
              {showFullSolution && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {/* Why Choice was Incorrect */}
                  {!isCorrect && diagnosis.whyIncorrect && (
                    <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3.5 space-y-1">
                      <div className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {language === 'bn' ? "আপনার উত্তরটি কেন ভুল ছিল" : "Why Your Answer Was Incorrect"}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                        <FormattedAiMessage content={diagnosis.whyIncorrect} className="text-slate-200" />
                      </div>
                    </div>
                  )}

                  {/* Core Scientific Concept */}
                  {diagnosis.correctConcept && (
                    <div className="rounded-xl border border-cyan-500/30 bg-[#091f30] p-3.5 space-y-1">
                      <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Atom className="w-3.5 h-3.5" />
                        {language === 'bn' ? "মূল অ্যাকাডেমিক ধারণা" : "Core Academic Concept"}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                        <FormattedAiMessage content={diagnosis.correctConcept} className="text-slate-200" />
                      </div>
                    </div>
                  )}

                  {/* Step-by-Step Reasoning */}
                  {(diagnosis.explanation || diagnosis.content) && (
                    <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {language === 'bn' ? "ধাপে ধাপে বিশ্লেষণ ও সমাধান" : "Step-by-Step Explanation"}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        <FormattedAiMessage content={diagnosis.content || diagnosis.explanation} className="text-slate-200" />
                      </div>
                    </div>
                  )}

                  {/* Common Mistake Trap */}
                  {diagnosis.commonMistake && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-3 text-xs text-amber-200">
                      <strong className="text-amber-300 font-bold block mb-1">
                        {language === 'bn' ? "সাধারণ পরীক্ষার ফাঁদ:" : "Common Exam Mistake Trap:"}
                      </strong>
                      <FormattedAiMessage content={diagnosis.commonMistake} className="text-amber-200" />
                    </div>
                  )}

                  {/* Similar Example / Exercise */}
                  {diagnosis.similarExample && (
                    <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-slate-300">
                      <strong className="text-cyan-300 font-bold block mb-1">
                        {language === 'bn' ? "অনুরূপ অ্যাকাডেমিক প্রয়োগ:" : "Similar Academic Application:"}
                      </strong>
                      <FormattedAiMessage content={diagnosis.similarExample} className="text-slate-300" />
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : null}
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-white/10 bg-[#091f30] p-4 flex items-center justify-between text-xs text-slate-400">
          <span>PIECHEM Socratic Tutor Core</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all cursor-pointer"
          >
            {language === 'bn' ? "বুঝেছি" : "Got It"}
          </button>
        </div>

      </div>
    </div>
  );
}
