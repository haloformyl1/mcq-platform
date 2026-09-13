"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, X, Brain, CheckCircle2, AlertTriangle, 
  ArrowRight, Target, RefreshCw, BookOpen, Zap, Award, Layers
} from "lucide-react";
import AdaptiveQuizModal from "./AdaptiveQuizModal";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [showAdaptiveDrill, setShowAdaptiveDrill] = useState(false);
  const [drillTopic, setDrillTopic] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isOpen || !attemptId) return;

    setLoading(true);
    setError(null);

    fetch("/api/ai/performance-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, language: "en" })
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
        setError(err.message || "Failed to generate AI performance report.");
      })
      .finally(() => setLoading(false));
  }, [isOpen, attemptId]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
        <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#071622] text-white shadow-2xl shadow-cyan-950/80 max-h-[92vh] flex flex-col">
          
          {/* Top Modal Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-[#091b29] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
                <Brain className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base sm:text-lg text-white tracking-tight">
                    PIECHEM AI Diagnostic Exam Report
                  </h3>
                  <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/40">
                    Deep Scrutiny
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {testTitle || "Examination Performance Breakdown"} &bull; Grounded in Student Attempt Telemetry
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

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {loading ? (
              <div className="py-20 text-center space-y-4">
                <RefreshCw className="h-12 w-12 text-cyan-400 animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Analyzing Cognitive Error Patterns...</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Correlating your submitted answers against PIECHEM's academic syllabus to detect distractor traps and weak sub-concepts.
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
                  Close
                </button>
              </div>
            ) : report ? (
              <div className="space-y-6">
                
                {/* Score & Key Metrics Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-center">
                    <div className="text-[11px] text-slate-400">Total Score</div>
                    <div className="text-2xl font-extrabold text-white mt-0.5">{report.overallScore}</div>
                    <div className="text-[10px] text-cyan-400 font-semibold">Max {report.totalQuestions}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-center">
                    <div className="text-[11px] text-slate-400">Accuracy Rate</div>
                    <div className="text-2xl font-extrabold text-emerald-400 mt-0.5">{report.accuracy}%</div>
                    <div className="text-[10px] text-slate-400">{report.correctAnswers} of {report.attemptedQuestions} correct</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-center">
                    <div className="text-[11px] text-slate-400">Mistakes / Traps</div>
                    <div className="text-2xl font-extrabold text-red-400 mt-0.5">{report.incorrectAnswers}</div>
                    <div className="text-[10px] text-red-400/80">Distractor slips</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 text-center">
                    <div className="text-[11px] text-slate-400">Speed Benchmark</div>
                    <div className="text-2xl font-extrabold text-amber-300 mt-0.5">{report.averageTimePerQuestion || 'N/A'}s</div>
                    <div className="text-[10px] text-slate-400">Avg per question</div>
                  </div>
                </div>

                {/* Overall Executive Performance Summary */}
                <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-black/40 p-4 sm:p-5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                    <Zap className="h-4 w-4 text-cyan-400" /> AI Pedagogical Evaluation
                  </div>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                    {report.overallSummary}
                  </p>
                </div>

                {/* Strong vs Weak Topics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strong Topics */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Strong Mastery Areas
                      </h4>
                      <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                        {report.strongTopics?.length || 0} Topics
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
                              <div className="text-[10px] text-slate-500">{item.correct}/{item.questionsAttempted} correct</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">
                        No clear strengths registered in this exam attempt.
                      </p>
                    )}
                  </div>

                  {/* Weak Topics */}
                  <div className="rounded-xl border border-red-500/30 bg-red-950/15 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-red-400" /> Critical Weak Areas
                      </h4>
                      <span className="text-[10px] text-red-300 font-semibold bg-red-950 px-2 py-0.5 rounded border border-red-500/30">
                        {report.weakTopics?.length || 0} Needs Revision
                      </span>
                    </div>

                    {report.weakTopics && report.weakTopics.length > 0 ? (
                      <div className="space-y-2">
                        {report.weakTopics.map((item: any, idx: number) => (
                          <div key={idx} className="rounded-lg bg-black/40 border border-red-500/20 p-2.5 text-xs flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-white">{item.topic}</div>
                              <div className="text-[10px] text-slate-400">{item.chapter}</div>
                            </div>
                            <div className="text-right font-mono">
                              <span className="text-red-400 font-bold">{typeof item === "string" ? "42%" : item.masteryScore + "%"}</span>
                              <div className="text-[10px] text-red-300/80">{item.incorrect} incorrect</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">
                        Outstanding! Zero recurring weak topic clusters detected.
                      </p>
                    )}
                  </div>
                </div>

                {/* Cognitive Distractor Trap & Mistake Pattern Analysis */}
                {report.mistakePatterns && report.mistakePatterns.length > 0 && (
                  <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-amber-400" /> Cognitive Mistake Traps Detected
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {report.mistakePatterns.map((pattern: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-white/5 p-2.5 rounded-lg border border-white/5">
                          <span className="text-amber-400 font-bold mt-0.5">&bull;</span>
                          <span className="leading-relaxed">{pattern}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Action Plan & Recommended Recovery Drill */}
                <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/30 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Target className="h-4 w-4 text-cyan-400" /> Recommended AI Action Plan
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        {report.personalizedStudyPlan || "Revise identified weak sub-topics and practice targeted adaptive questions."}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAdaptiveDrill(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 px-4 py-2.5 text-xs font-bold text-black shadow-lg shadow-cyan-500/30 transition-all shrink-0 cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Start Adaptive Recovery Drill</span>
                    </button>
                  </div>
                </div>

              </div>
            ) : null}
          </div>

          {/* Footer Bar */}
          <div className="border-t border-white/10 bg-[#091b29] p-4 flex items-center justify-between text-xs text-slate-400">
            <span>PIECHEM Grounded Academic Telemetry</span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-medium text-white transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>
      </div>

      {/* Adaptive Drill Modal if launched */}
      {showAdaptiveDrill && (
        <AdaptiveQuizModal
          isOpen={showAdaptiveDrill}
          onClose={() => setShowAdaptiveDrill(false)}
          targetTopic={drillTopic}
        />
      )}
    </>
  );
}
