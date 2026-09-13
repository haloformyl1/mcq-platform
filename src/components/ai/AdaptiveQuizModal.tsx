"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, X, CheckCircle2, XCircle, ArrowRight, RefreshCw, 
  Lightbulb, Award, Target, HelpCircle, ChevronRight, BookOpen, Languages
} from "lucide-react";
import FormattedAiMessage from "./FormattedAiMessage";

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
  // Persistent language state (synchronized with all PIECHEM AI tools)
  const [language, setLanguage] = useState<'en' | 'bn'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('piechem_ai_lang') as 'en' | 'bn') || 'en';
    }
    return 'en';
  });

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

  const fetchAdaptiveQuestions = async (lang: 'en' | 'bn' = language) => {
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
          language: lang,
          topic: targetTopic || drillTopic
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate adaptive quiz");
      }

      if (!data.questions || data.questions.length === 0) {
        throw new Error(
          lang === 'bn' 
            ? "কোনো প্রশ্ন প্রস্তুত করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।" 
            : "No questions generated. Please try again."
        );
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

  useEffect(() => {
    if (isOpen) {
      fetchAdaptiveQuestions(language);
    }
  }, [isOpen, targetTopic]);

  const handleToggleLanguage = (newLang: 'en' | 'bn') => {
    if (newLang === language) return;
    setLanguage(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('piechem_ai_lang', newLang);
      window.dispatchEvent(new CustomEvent('piechem-language-changed', { detail: newLang }));
    }
    fetchAdaptiveQuestions(newLang);
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
          language
        })
      });

      const data = await res.json();
      if (data.success && data.doubtSolution) {
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
        
        {/* Header Bar with AI Language Toggle */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#091b29] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white shadow-md shadow-emerald-500/30">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  {language === 'bn' ? "এআই অ্যাডাপ্টিভ ড্রিল" : "AI Adaptive Mastery Drill"}
                </h3>
                <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/40">
                  {language === 'bn' ? "ডায়নামিক স্তর" : "Dynamic Difficulty"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'bn' ? "চিহ্নিত দুর্বল বিষয়সমূহের অনুশীলন • " : "Targeting identified weak topics • "}
                <span className="text-cyan-300 font-medium">{drillTopic}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bilingual AI Language Option [EN | বাংলা] */}
            <div className="flex items-center rounded-lg border border-white/10 bg-black/50 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => handleToggleLanguage('en')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  language === 'en' 
                    ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Display questions in English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => handleToggleLanguage('bn')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  language === 'bn' 
                    ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Display questions in Bengali (বাংলা)"
              >
                বাংলা
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <RefreshCw className="h-10 w-10 text-cyan-400 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  {language === 'bn' ? "আপনার শেখার প্যাটার্ন বিশ্লেষণ করা হচ্ছে..." : "Analyzing Your Learning Telemetry..."}
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {language === 'bn'
                    ? "আপনার সাম্প্রতিক ভুল ও ধারণাগত ফাঁদ বিশ্লেষণ করে অ্যাডাপ্টিভ প্রশ্ন প্রস্তুত করা হচ্ছে।"
                    : "Generating validated MCQs tailored to your recent mistake patterns and difficulty thresholds."}
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
                onClick={() => fetchAdaptiveQuestions(language)}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" /> {language === 'bn' ? "পুনরায় চেষ্টা করুন" : "Try Again"}
              </button>
            </div>
          ) : isFinished ? (
            /* Results Screen */
            <div className="py-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white shadow-xl shadow-emerald-500/30 mx-auto">
                <Award className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-white">
                  {language === 'bn' ? "অ্যাডাপ্টিভ ড্রিল সম্পন্ন হয়েছে!" : "Adaptive Drill Completed!"}
                </h3>
                <p className="text-sm text-slate-300">
                  {language === 'bn' ? (
                    <>আপনি <strong className="font-mono text-base">{questions.length}</strong> টির মধ্যে <strong className="text-emerald-400 font-mono text-base">{correctCount}</strong> টি সঠিক করেছেন ({Math.round((correctCount / questions.length) * 100)}%)</>
                  ) : (
                    <>You scored <strong className="text-emerald-400 font-mono text-base">{correctCount}</strong> out of <strong className="font-mono text-base">{questions.length}</strong> ({Math.round((correctCount / questions.length) * 100)}%)</>
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 p-4 max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>{language === 'bn' ? "বিষয়:" : "Topic Targeted:"}</span>
                  <span className="font-semibold text-cyan-300">{drillTopic}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{language === 'bn' ? "দক্ষতা মূল্যায়ন:" : "Adaptive Telemetry:"}</span>
                  <span className="text-emerald-300 font-semibold">
                    {correctCount >= 4 ? (language === 'bn' ? "+১৫% আত্মবিশ্বাস বৃদ্ধি" : "+15% Mastery Confidence") : (language === 'bn' ? "+৮% ধারণা জোরদার" : "+8% Conceptual Reinforcement")}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{language === 'bn' ? "পরামর্শ:" : "Recommended Next Step:"}</span>
                  <span className="text-slate-200 font-medium">
                    {correctCount === 5 
                      ? (language === 'bn' ? "HOTS (উচ্চতর স্তর) অনুশীলন করুন" : "Advance to HOTS level") 
                      : (language === 'bn' ? "ভুল উত্তরের ব্যাখ্যা পর্যালোচনা করুন" : "Review mistake explanations below")}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fetchAdaptiveQuestions(language)}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" /> {language === 'bn' ? "পরবর্তী অ্যাডাপ্টিভ ড্রিল" : "Next Adaptive Drill"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFinished(false);
                    setCurrentIdx(0);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-medium text-slate-200 transition-all cursor-pointer"
                >
                  <BookOpen className="h-4 w-4" /> {language === 'bn' ? "প্রশ্নোত্তর পর্যালোচনা" : "Review Questions"}
                </button>
              </div>
            </div>
          ) : currentQ ? (
            /* Question Card */
            <div className="space-y-4">
              {/* Question Progress & Meta */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-400">
                  {language === 'bn' ? `প্রশ্ন ${currentIdx + 1} এর ${questions.length}` : `Question ${currentIdx + 1} of ${questions.length}`}
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

              {/* Question Text with KaTeX Math Formula Rendering */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <FormattedAiMessage 
                  content={currentQ.questionText} 
                  className="text-sm sm:text-base font-semibold leading-relaxed text-white" 
                />
              </div>

              {/* Options Grid with KaTeX Math Rendering */}
              <div className="grid grid-cols-1 gap-2.5">
                {(['A', 'B', 'C', 'D'] as const).map(opt => {
                  const optText = currentQ[`option${opt}` as keyof Question] as string;
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
                      className={`flex items-start gap-3 rounded-xl border p-3 sm:p-3.5 text-left text-xs sm:text-sm font-medium transition-all ${style} ${
                        !isAnswered ? 'cursor-pointer hover:border-cyan-500/40 active:scale-[0.99]' : 'cursor-default'
                      }`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                        isAnswered && isOptCorrect
                          ? 'bg-emerald-500 text-white'
                          : isAnswered && isSelected && !isOptCorrect
                          ? 'bg-red-500 text-white'
                          : 'bg-black/40 text-slate-300'
                      }`}>
                        {opt}
                      </span>
                      <div className="flex-1 pt-0.5 leading-relaxed">
                        <FormattedAiMessage content={optText} className="text-inherit [&_p]:text-inherit [&_.katex]:text-inherit" />
                      </div>
                      {isAnswered && isOptCorrect && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
                      )}
                      {isAnswered && isSelected && !isOptCorrect && (
                        <XCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Progressive Hint Drawer with KaTeX Math Rendering */}
              {!isAnswered && (
                <div className="pt-1">
                  {hints[currentIdx] ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                          {language === 'bn' ? `ইঙ্গিত ধাপ ${hintLevel[currentIdx]} / ৩` : `Progressive Hint Level ${hintLevel[currentIdx]} / 3`}
                        </span>
                        <span className="text-[10px] text-amber-400/80">
                          {hints[currentIdx].title || (language === 'bn' ? "ধারণাগত সূত্র" : "Conceptual Clue")}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm text-amber-100 leading-relaxed font-medium">
                        <FormattedAiMessage 
                          content={hints[currentIdx].content || hints[currentIdx].hint || hints[currentIdx].explanation}
                          className="text-amber-100 [&_p]:text-amber-100 [&_.katex]:text-amber-200"
                        />
                      </div>
                      {(hintLevel[currentIdx] || 0) < 3 && (
                        <button
                          type="button"
                          onClick={handleFetchHint}
                          disabled={loadingHint === currentIdx}
                          className="text-[11px] text-amber-400 hover:text-amber-200 underline font-semibold cursor-pointer pt-1 inline-block"
                        >
                          {loadingHint === currentIdx 
                            ? (language === 'bn' ? "পরবর্তী ইঙ্গিত লোড হচ্ছে..." : "Loading next hint...") 
                            : (language === 'bn' ? "আরও বিস্তারিত ইঙ্গিত চান? (ধাপ " + ((hintLevel[currentIdx] || 0) + 1) + ")" : "Need a more specific hint? (Level " + ((hintLevel[currentIdx] || 0) + 1) + ")")}
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFetchHint}
                      disabled={loadingHint === currentIdx}
                      className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer py-1"
                    >
                      <Lightbulb className="h-3.5 w-3.5" />
                      <span>
                        {loadingHint === currentIdx 
                          ? (language === 'bn' ? "ধারণাগত ইঙ্গিত প্রস্তুত হচ্ছে..." : "Formulating Conceptual Hint...") 
                          : (language === 'bn' ? "ধারণাগত ইঙ্গিত দরকার?" : "Need a Conceptual Hint?")}
                      </span>
                    </button>
                  )}
                </div>
              )}

              {/* Answer Explanation Box with KaTeX Math Rendering */}
              {isAnswered && (
                <div className={`rounded-xl border p-4 space-y-2 animate-in fade-in duration-200 ${
                  isCorrect 
                    ? 'border-emerald-500/30 bg-emerald-950/20' 
                    : 'border-cyan-500/30 bg-[#091f30]'
                }`}>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    {isCorrect ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        {language === 'bn' ? "সঠিক উত্তর!" : "Correct! Verified Key"}
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        {language === 'bn' ? `সঠিক উত্তর হলো বিকল্প ${currentQ.correctAnswer}` : `Incorrect. Correct Answer is Option ${currentQ.correctAnswer}`}
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                    <FormattedAiMessage content={currentQ.explanation} className="text-slate-200" />
                  </div>
                </div>
              )}

            </div>
          ) : null}
        </div>

        {/* Footer Navigation Strip */}
        <div className="border-t border-white/10 bg-[#091b29] p-4 flex items-center justify-between">
          <button
            type="button"
            disabled={currentIdx === 0 || isFinished || loading}
            onClick={() => setCurrentIdx(prev => Math.max(prev - 1, 0))}
            className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {language === 'bn' ? "পূর্ববর্তী" : "Previous"}
          </button>

          {/* Dots Indicator */}
          {!isFinished && questions.length > 0 && (
            <div className="flex items-center gap-1.5">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIdx 
                      ? 'w-6 bg-cyan-400' 
                      : selectedAnswers[idx] 
                      ? 'w-2 bg-emerald-500' 
                      : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}

          {!isFinished && currentIdx < questions.length - 1 ? (
            <button
              type="button"
              disabled={!isAnswered}
              onClick={() => setCurrentIdx(prev => Math.min(prev + 1, questions.length - 1))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-1.5 text-xs font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>{language === 'bn' ? "পরবর্তী প্রশ্ন" : "Next Question"}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : !isFinished && questions.length > 0 ? (
            <button
              type="button"
              disabled={!isAnswered}
              onClick={() => {
                setIsFinished(true);
                onFinished?.();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>{language === 'bn' ? "অনুশীলন সমাপ্ত" : "Finish Drill"}</span>
              <CheckCircle2 className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-cyan-500 cursor-pointer"
            >
              {language === 'bn' ? "বন্ধ করুন" : "Close"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
