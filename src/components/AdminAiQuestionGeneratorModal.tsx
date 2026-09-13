"use client";

import { useState } from "react";
import { X, Sparkles, Loader2, CheckCircle2, AlertCircle, Plus, BookOpen, Trash2 } from "lucide-react";

interface AdminAiGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  testId: string;
  onQuestionsAdded: () => void;
}

export default function AdminAiQuestionGeneratorModal({
  isOpen,
  onClose,
  testId,
  onQuestionsAdded
}: AdminAiGeneratorProps) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState("3");
  const [difficulty, setDifficulty] = useState("Medium");
  const [targetExam, setTargetExam] = useState("NEET / JEE Mains");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Please enter a chemistry topic or chapter.");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedQuestions([]);

    try {
      const res = await fetch("/api/admin/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          count: parseInt(count, 10) || 3,
          difficulty,
          targetExam
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to generate questions");

      setGeneratedQuestions(data.questions || []);
    } catch (err: any) {
      setError(err.message || "Error generating questions");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (generatedQuestions.length === 0) return;

    setSaving(true);
    setError(null);

    try {
      for (const q of generatedQuestions) {
        const res = await fetch("/api/admin/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testId,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || ""
          })
        });

        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Failed to insert some questions");
        }
      }

      onQuestionsAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save questions to test");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveQuestion = (index: number) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0e1622] border border-cyan-500/40 rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl shadow-cyan-950/90 overflow-hidden relative">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#08101a] border-b border-cyan-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base sm:text-lg">AI MCQ Question Generator</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  Gemini Powered
                </span>
              </div>
              <p className="text-xs text-slate-400">Instantly generate authentic NEET, JEE, & Board MCQs with full solutions</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Generator Form */}
          <form onSubmit={handleGenerate} className="bg-[#060c14] border border-cyan-950 p-4 sm:p-5 rounded-2xl space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Chemistry Chapter or Specific Concept *
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., SN1 vs SN2 Reaction Mechanisms, Nernst Equation, Coordination Isomers..."
                className="w-full bg-[#0a1524] border border-cyan-900/60 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 block">Number of MCQs</label>
                <select
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#0a1524] border border-cyan-900/60 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="1">1 Question</option>
                  <option value="3">3 Questions</option>
                  <option value="5">5 Questions</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 block">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#0a1524] border border-cyan-900/60 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="Easy">Easy (Board / Basic NEET)</option>
                  <option value="Medium">Medium (Standard NEET / JEE Main)</option>
                  <option value="Hard">Hard (JEE Advanced / Top Tier)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 block">Target Exam Standard</label>
                <select
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#0a1524] border border-cyan-900/60 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="NEET">NEET</option>
                  <option value="JEE Mains">JEE (Main)</option>
                  <option value="JEE Advanced">JEE (Advanced)</option>
                  <option value="WBJEE">WBJEE</option>
                  <option value="WBCHSE / CBSE">Boards (CBSE/WBCHSE)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing MCQs & Explanations with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Generate Questions Now</span>
                </>
              )}
            </button>
          </form>

          {/* Generated Questions List Preview */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Generated Questions Preview ({generatedQuestions.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Review and click "Add All to Test" below
                </span>
              </div>

              {generatedQuestions.map((q, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#08121e] border border-cyan-900/60 space-y-3 relative">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                      <span className="text-cyan-400 font-bold mr-1.5">Q{idx + 1}.</span>
                      {q.questionText}
                    </p>
                    <button
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-slate-500 hover:text-red-400 p-1 transition"
                      title="Discard this question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Options 2x2 grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    {['A', 'B', 'C', 'D'].map(opt => {
                      const isCorrect = q.correctAnswer === opt;
                      const text = q[`option${opt}`];
                      return (
                        <div
                          key={opt}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                            isCorrect
                              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold'
                              : 'bg-[#040a12] border-slate-800 text-slate-300'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                            isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {opt}
                          </span>
                          <span className="truncate">{text}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation preview */}
                  {q.explanation && (
                    <p className="text-[11px] text-slate-400 leading-relaxed bg-[#040a12] p-2.5 rounded-xl border border-slate-900">
                      <strong className="text-cyan-400 mr-1">Explanation:</strong>
                      {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {generatedQuestions.length > 0 && (
          <div className="p-4 bg-[#08101a] border-t border-cyan-950 flex items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-slate-400 font-mono">
              Ready to insert {generatedQuestions.length} question(s)
            </span>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-900/40 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding to Test...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add All to Test</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
