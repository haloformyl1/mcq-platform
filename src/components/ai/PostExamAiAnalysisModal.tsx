"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, X, Brain, CheckCircle2, AlertTriangle, 
  ArrowRight, Target, RefreshCw, BookOpen, Zap, Award, Layers, Languages
} from "lucide-react";
import AdaptiveQuizModal from "./AdaptiveQuizModal";
import FormattedAiMessage from "./FormattedAiMessage";

interface PostExamAiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  attemptId: string;
  testTitle?: string;
}

export default function PostExamAiAnalysisModal({
  isOpen,
  onClose,
  attemptId,
  testTitle
}: PostExamAiAnalysisModalProps) {
  // Persistent language state (synchronized with all PIECHEM AI tools)
  const [language, setLanguage] = useState<'en' | 'bn'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('piechem_ai_lang') as 'en' | 'bn') || 'en';
    }
    return 'en';
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);
  const [report, setReport] = useState<any>(null);
  const [showAdaptiveDrill, setShowAdaptiveDrill] = useState(false);
  const [drillTopic, setDrillTopic] = useState<string | undefined>(undefined);

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

  const fetchPerformanceReport = (lang: 'en' | 'bn' = language) => {
    if (!attemptId) return;
    setLoading(true);
    setError(null);
    setIsQuotaExceeded(false);

    fetch("/api/ai/performance-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, language: lang })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setReport(data.report);
        if (data.report?.weakTopics?.[0]?.topic) {
          setDrillTopic(data.report.weakTopics[0].topic);
        }
      })
      .catch(err => {
        console.error("Post exam AI report error:", err);
        setError(err.message || "Failed to formulate performance report");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen && attemptId) {
      fetchPerformanceReport(language);
    }
  }, [isOpen, attemptId]);

  const handleToggleLanguage = (newLang: 'en' | 'bn') => {
    if (newLang === language) return;
    setLanguage(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('piechem_ai_lang', newLang);
      window.dispatchEvent(new CustomEvent('piechem-language-changed', { detail: newLang }));
    }
    fetchPerformanceReport(newLang);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
        <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#071622] text-white shadow-2xl shadow-cyan-950/80 max-h-[92vh] flex flex-col">
          
          {/* Top Modal Header with AI Language Switcher */}
          <div className="flex items-center justify-between border-b border-white/10 bg-[#091b29] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
                <Brain className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base sm:text-lg text-white tracking-tight">
                    {language === 'bn' ? "PIECHEM এআই পরীক্ষার বিশ্লেষণ রিপোর্ট" : "PIECHEM AI Diagnostic Exam Report"}
                  </h3>
                  <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/40">
                    {language === 'bn' ? "গভীর মূল্যায়ন" : "Deep Scrutiny"}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {testTitle || (language === 'bn' ? "পরীক্ষার ফলাফলের বিশদ ব্যাখ্যা" : "Examination Performance Breakdown")} &bull; Grounded in Student Attempt Telemetry
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Switcher [EN | বাংলা] */}
              <div className="flex items-center rounded-lg border border-white/10 bg-black/50 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => handleToggleLanguage('en')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    language === 'en' 
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="English Report"
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleLanguage('bn')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    language === 'bn' 
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="বাংলা প্রতিবেদন"
                >
                  বাংলা
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {loading ? (
              <div className="py-20 text-center space-y-4">
                <RefreshCw className="h-12 w-12 text-cyan-400 animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">
                    {language === 'bn' ? "ভুলের প্যাটার্ন ও ধারণাগত ফাঁদ বিশ্লেষণ করা হচ্ছে..." : "Analyzing Cognitive Error Patterns..."}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {language === 'bn'
                      ? "আপনার নির্বাচিত উত্তরগুলো বিশ্লেষণ করে সিলেবাসের সাথে মিলিয়ে বিভ্রান্তিকর ফাঁদগুলো শনাক্ত করা হচ্ছে।"
                      : "Correlating your submitted answers against PIECHEM's academic syllabus to detect distractor traps and weak sub-concepts."}
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
                  onClick={onClose}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 cursor-pointer"
                >
                  {language === 'bn' ? "বন্ধ করুন" : "Close"}
                </button>
              </div>
            ) : report ? (
              <div className="space-y-6">
                
                {/* Score & Key Metrics Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-center">
                    <div className="text-[11px] text-slate-400">{language === 'bn' ? "মোট নম্বর" : "Total Score"}</div>
                    <div className="text-2xl font-extrabold text-white mt-0.5">{report.overallScore}</div>
                    <div className="text-[10px] text-cyan-400 font-semibold">{language === 'bn' ? "সর্বোচ্চ" : "Max"} {report.totalQuestions}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-center">
                    <div className="text-[11px] text-slate-400">{language === 'bn' ? "সঠিকতার হার" : "Accuracy Rate"}</div>
                    <div className="text-2xl font-extrabold text-emerald-400 mt-0.5">{report.accuracy}%</div>
                    <div className="text-[10px] text-slate-400">{report.correctAnswers} / {report.attemptedQuestions} {language === 'bn' ? "সঠিক" : "correct"}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-center">
                    <div className="text-[11px] text-slate-400">{language === 'bn' ? "ভুল / ফাঁদ" : "Mistakes / Traps"}</div>
                    <div className="text-2xl font-extrabold text-red-400 mt-0.5">{report.incorrectAnswers}</div>
                    <div className="text-[10px] text-red-400/80">{language === 'bn' ? "ভুল উত্তর" : "Distractor slips"}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-center">
                    <div className="text-[11px] text-slate-400">{language === 'bn' ? "গড় সময়" : "Speed Benchmark"}</div>
                    <div className="text-2xl font-extrabold text-amber-300 mt-0.5">{report.averageTimePerQuestion || 'N/A'}s</div>
                    <div className="text-[10px] text-slate-400">{language === 'bn' ? "প্রশ্ন প্রতি গড়" : "Avg per question"}</div>
                  </div>
                </div>

                {/* Overall Executive Performance Summary with KaTeX */}
                <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-black/40 p-4 sm:p-5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                    <Zap className="h-4 w-4 text-cyan-400" /> {language === 'bn' ? "এআই শিক্ষাগত মূল্যায়ন" : "AI Pedagogical Evaluation"}
                  </div>
                  <div className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                    <FormattedAiMessage content={report.overallSummary} className="text-slate-200 font-medium" />
                  </div>
                </div>

                {/* Strong vs Weak Topics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strong Topics */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {language === 'bn' ? "শক্তিশালী বিষয়সমূহ" : "Strong Mastery Areas"}
                      </h4>
                      <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                        {report.strongTopics?.length || 0} {language === 'bn' ? "টি বিষয়" : "Topics"}
                      </span>
                    </div>

                    {report.strongTopics && report.strongTopics.length > 0 ? (
                      <div className="space-y-2">
                        {report.strongTopics.map((item: any, idx: number) => (
                          <div key={idx} className="rounded-lg bg-black/40 border border-emerald-500/20 p-2.5 text-xs flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-white">{typeof item === "string" ? item : item.topic}</div>
                              <div className="text-[10px] text-slate-400">{typeof item === "string" ? "Chemistry Topic" : item.chapter}</div>
                            </div>
                            <div className="text-right font-mono">
                              <span className="text-emerald-400 font-bold">{typeof item === "string" ? "85%" : item.masteryScore + "%"}</span>
                              <div className="text-[10px] text-slate-500">{item.correct}/{item.questionsAttempted} {language === 'bn' ? "সঠিক" : "correct"}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        {language === 'bn' ? "পর্যাপ্ত ডেটা নেই।" : "No distinct strong topics recorded in this test attempt."}
                      </p>
                    )}
                  </div>

                  {/* Weak Topics */}
                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/15 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-amber-400" /> {language === 'bn' ? "উন্নতি প্রয়োজন এমন বিষয়" : "Weak Concepts / Revision Needed"}
                      </h4>
                      <span className="text-[10px] text-amber-300 font-semibold bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                        {report.weakTopics?.length || 0} {language === 'bn' ? "টি বিষয়" : "Topics"}
                      </span>
                    </div>

                    {report.weakTopics && report.weakTopics.length > 0 ? (
                      <div className="space-y-2">
                        {report.weakTopics.map((item: any, idx: number) => (
                          <div key={idx} className="rounded-lg bg-black/40 border border-amber-500/20 p-2.5 text-xs flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-white">{typeof item === "string" ? item : item.topic}</div>
                              <div className="text-[10px] text-slate-400">{typeof item === "string" ? "Chemistry Topic" : item.chapter}</div>
                            </div>
                            <div className="text-right font-mono">
                              <span className="text-amber-400 font-bold">{typeof item === "string" ? "30%" : item.masteryScore + "%"}</span>
                              <div className="text-[10px] text-slate-500">{item.correct}/{item.questionsAttempted} {language === 'bn' ? "সঠিক" : "correct"}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        {language === 'bn' ? "কোনো উল্লেখযোগ্য দুর্বল বিষয় শনাক্ত হয়নি।" : "Excellent work! No major weak topic bottlenecks detected."}
                      </p>
                    )}
                  </div>
                </div>

                {/* Conceptual Traps Identified with KaTeX */}
                {report.conceptualTrapsIdentified && report.conceptualTrapsIdentified.length > 0 && (
                  <div className="rounded-xl border border-white/10 bg-black/40 p-5 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                      <AlertTriangle className="h-4 w-4 text-rose-400" /> {language === 'bn' ? "শনাক্তকৃত ধারণাগত ফাঁদসমূহ" : "Detected Conceptual Traps & Distractor Misconceptions"}
                    </div>

                    <div className="space-y-3">
                      {report.conceptualTrapsIdentified.map((trap: any, idx: number) => (
                        <div key={idx} className="rounded-xl border border-rose-500/25 bg-rose-950/10 p-4 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs sm:text-sm">
                              {language === 'bn' ? `প্রশ্ন ${trap.questionIndex || idx + 1}` : `Question ${trap.questionIndex || idx + 1}`}
                            </span>
                            <div className="flex items-center gap-2 font-mono text-[11px]">
                              <span className="text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/40">
                                {language === 'bn' ? "আপনার উত্তর:" : "Your Pick:"} {trap.selectedAnswer}
                              </span>
                              <span className="text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                                {language === 'bn' ? "সঠিক উত্তর:" : "Correct:"} {trap.correctAnswer}
                              </span>
                            </div>
                          </div>

                          <div className="text-slate-300">
                            <FormattedAiMessage content={trap.questionText} className="text-slate-300" />
                          </div>

                          <div className="rounded-lg bg-black/50 p-2.5 space-y-1.5 border border-white/5">
                            <div className="text-amber-300 font-semibold flex items-center gap-1">
                              <Zap className="h-3 w-3 text-amber-400" /> {language === 'bn' ? "কেন আপনি এই ভুলটি করলেন:" : "Why You Slipped:"}
                            </div>
                            <div className="text-slate-300">
                              <FormattedAiMessage content={trap.trapReason} className="text-slate-300" />
                            </div>

                            <div className="text-emerald-300 font-semibold flex items-center gap-1 pt-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" /> {language === 'bn' ? "ধারণাগত সংশোধন:" : "Conceptual Remedy:"}
                            </div>
                            <div className="text-slate-300">
                              <FormattedAiMessage content={trap.remedy} className="text-slate-300" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : null}
          </div>

          {/* Bottom Action Bar */}
          <div className="border-t border-white/10 bg-[#091b29] p-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              {language === 'bn' ? "ব্যক্তিগত এআই ফলাফল বিশ্লেষণ" : "Personalized AI Diagnostic Matrix"}
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowAdaptiveDrill(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Target className="h-4 w-4" />
                <span>{language === 'bn' ? "দুর্বল বিষয়ের ড্রিল শুরু করুন" : "Launch Weak Topic Adaptive Drill"}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
              >
                {language === 'bn' ? "বন্ধ করুন" : "Close"}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Adaptive Drill Modal */}
      <AdaptiveQuizModal
        isOpen={showAdaptiveDrill}
        onClose={() => setShowAdaptiveDrill(false)}
        targetTopic={drillTopic}
      />
    </>
  );
}
