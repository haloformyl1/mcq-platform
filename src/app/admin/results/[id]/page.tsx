"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, MinusCircle, ArrowLeft, Clock, User, Award, CheckCircle, HelpCircle } from "lucide-react";
import PiFiringLoader from "@/components/PiFiringLoader";

export default function AdminAttemptDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Correct' | 'Incorrect' | 'Unanswered'>('All');
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/admin/results/${resolvedParams.id}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch result details");
        return data;
      })
      .then(data => {
        setResult(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [resolvedParams.id]);

  if (loading) {
    return <PiFiringLoader fullScreen={true} />;
  }

  if (error || !result) {
    return (
      <div className="p-8 space-y-4">
        <Link href="/admin/results" className="inline-flex items-center gap-2 text-sm text-[#a6a6a6] hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Results
        </Link>
        <div className="p-4 bg-red-900/20 border border-red-800 text-red-300 rounded-md">
          {error || "Result not found."}
        </div>
      </div>
    );
  }

  const studentName = result.student?.name || (result.student?.email ? result.student.email.split('@')[0] : "Student");
  const studentEmail = result.student?.email || "No email";
  
  const startTime = new Date(result.startedAt);
  const submitTime = result.submittedAt ? new Date(result.submittedAt) : null;
  
  // Format total duration taken
  let durationText = "In Progress";
  let secondsSpent = 0;
  if (submitTime) {
    const diffMs = submitTime.getTime() - startTime.getTime();
    secondsSpent = Math.max(0, Math.floor(diffMs / 1000));
    const mins = Math.floor(secondsSpent / 60);
    const secs = secondsSpent % 60;
    durationText = `${mins}m ${secs}s`;
  }

  const totalQCount = result.test?.totalQuestions || result.answers.length;
  const avgTimePerQuestion = (secondsSpent > 0 && totalQCount > 0) ? (secondsSpent / totalQCount).toFixed(1) : "N/A";

  const correctCount = result.answers.filter((a: any) => a.isCorrect).length;
  const incorrectCount = result.answers.filter((a: any) => !a.isCorrect && a.selectedAnswer).length;
  const unansweredCount = result.answers.filter((a: any) => !a.selectedAnswer).length;

  const filteredAnswers = result.answers.filter((ans: any) => {
    if (filter === 'Correct') return ans.isCorrect === true;
    if (filter === 'Incorrect') return ans.isCorrect === false && ans.selectedAnswer;
    if (filter === 'Unanswered') return !ans.selectedAnswer;
    return true;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Link href="/admin/results" className="inline-flex items-center gap-2 text-sm text-[#a6a6a6] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Test Results
        </Link>
        <span className="text-xs bg-[#262626] border border-[#404040] text-[#a6a6a6] px-3 py-1 rounded-full">
          Attempt ID: {result.id.slice(0, 8)}
        </span>
      </div>

      {/* Main Title & Student Overview Header */}
      <div className="bg-[#161616]/70 border border-[#333333] p-6 rounded-lg backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-[#2d2d2d] pb-4">
          <div>
            <span className="text-xs font-semibold uppercase text-blue-400 tracking-wider">Exam Scrutiny Report</span>
            <h1 className="text-2xl font-bold text-white mt-0.5">{result.test?.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
              result.status === 'SUBMITTED' ? 'bg-green-900/40 text-green-300 border border-green-700/50' : 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50'
            }`}>
              {result.status}
            </span>
            {result.submissionReason && (
              <span className="text-xs text-[#a6a6a6] bg-[#262626] border border-[#404040] px-2.5 py-1 rounded">
                Reason: {result.submissionReason.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Student Info & Exam Timing Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="bg-[#1e1e1e] p-4 rounded-md border border-[#333333] flex items-center gap-3">
            <User className="w-8 h-8 text-blue-400 shrink-0" />
            <div>
              <div className="text-xs text-[#a6a6a6]">Student Profile</div>
              <div className="text-sm font-bold text-white leading-tight">{studentName}</div>
              <div className="text-xs text-blue-400 font-mono truncate max-w-[180px]">{studentEmail}</div>
            </div>
          </div>

          <div className="bg-[#1e1e1e] p-4 rounded-md border border-[#333333] flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs text-[#a6a6a6]">Start & Submit Time</div>
              <div className="text-xs font-medium text-white">{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
              <div className="text-xs text-[#a6a6a6]">{submitTime ? submitTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "Not submitted"}</div>
            </div>
          </div>

          <div className="bg-[#1e1e1e] p-4 rounded-md border border-[#333333] flex items-center gap-3">
            <Award className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs text-[#a6a6a6]">Total Duration</div>
              <div className="text-sm font-bold text-white">{durationText}</div>
              <div className="text-xs text-[#a6a6a6]">Allowed: {result.test?.durationMinutes} mins</div>
            </div>
          </div>

          <div className="bg-[#1e1e1e] p-4 rounded-md border border-[#333333] flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-purple-400 shrink-0" />
            <div>
              <div className="text-xs text-[#a6a6a6]">Average Speed</div>
              <div className="text-sm font-bold text-white">{avgTimePerQuestion} s</div>
              <div className="text-xs text-[#a6a6a6]">per question</div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#161616] p-4 rounded-lg border border-[#333333] text-center">
          <div className="text-xs text-[#a6a6a6] mb-1">Final Score</div>
          <div className="text-2xl font-black text-white">{result.score}</div>
          <div className="text-xs font-bold text-blue-400 mt-0.5">{result.percentage?.toFixed(1)}%</div>
        </div>
        <div className="bg-green-950/20 p-4 rounded-lg border border-green-900/40 text-center">
          <div className="text-xs text-green-400 mb-1">Correct Answers</div>
          <div className="text-2xl font-black text-green-400">{correctCount}</div>
          <div className="text-xs text-[#a6a6a6] mt-0.5">+{result.test?.marksPerQuestion} mark each</div>
        </div>
        <div className="bg-red-950/20 p-4 rounded-lg border border-red-900/40 text-center">
          <div className="text-xs text-red-400 mb-1">Wrong Answers</div>
          <div className="text-2xl font-black text-red-400">{incorrectCount}</div>
          <div className="text-xs text-[#a6a6a6] mt-0.5">
            {result.test?.negativeMarking ? `-${result.test?.negativeMarks} penalty` : "No penalty"}
          </div>
        </div>
        <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333333] text-center">
          <div className="text-xs text-[#a6a6a6] mb-1">Not Attempted</div>
          <div className="text-2xl font-black text-[#8c8c8c]">{unansweredCount}</div>
          <div className="text-xs text-[#a6a6a6] mt-0.5">Unanswered</div>
        </div>
      </div>

      {/* AI Proctoring Integrity Audit Report */}
      <div className="bg-[#121212] border border-blue-900/40 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#262626] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🤖</span>
            <div>
              <h2 className="text-lg font-bold text-white">AI Proctoring Integrity Audit</h2>
              <p className="text-xs text-[#a6a6a6]">Webcam vision logs, device detection, and camera evidence snapshots captured during exam</p>
            </div>
          </div>
          <div>
            {(!result.proctoringViolations || result.proctoringViolations.length === 0) ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-950 text-green-400 border border-green-700">
                🟢 HIGH TRUST (0 Violations)
              </span>
            ) : result.proctoringViolations.length <= 2 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-700">
                🟡 MODERATE RISK ({result.proctoringViolations.length} Violations)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-950 text-red-400 border border-red-800 animate-pulse">
                🔴 HIGH RISK / FLAGGED ({result.proctoringViolations.length} Violations)
              </span>
            )}
          </div>
        </div>

        {(!result.proctoringViolations || result.proctoringViolations.length === 0) ? (
          <div className="bg-[#181818] p-4 rounded-lg text-xs text-slate-400 border border-[#262626] text-center">
            No proctoring violations recorded for this attempt. Student completed the exam with a clean webcam record.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {result.proctoringViolations.map((v: any) => (
              <div key={v.id} className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-3 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 uppercase tracking-wider">
                      ⚠️ {v.violationType.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-[#a6a6a6]">
                      Warning {v.warningNumber}
                    </span>
                  </div>
                  <p className="text-xs text-white font-medium line-clamp-2">{v.message}</p>
                  <p className="text-[10px] text-[#888888] font-mono">
                    Logged: {new Date(v.timestamp).toLocaleString()}
                  </p>
                </div>

                {v.snapshotBase64 ? (
                  <div className="pt-2">
                    <p className="text-[10px] text-slate-400 mb-1">Captured Camera Snapshot:</p>
                    <img
                      src={v.snapshotBase64}
                      alt="Proctoring violation snapshot"
                      className="w-full h-32 object-cover rounded border border-[#404040] hover:scale-[1.02] transition cursor-pointer"
                      onClick={() => {
                        const w = window.open("");
                        if (w) {
                          w.document.write(`<title>Evidence Snapshot</title><body style="background:#000;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;"><img src="${v.snapshotBase64}" style="max-width:90vw;max-height:90vh;border-radius:12px;border:3px solid #f59e0b;"/></body>`);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 italic pt-2">No camera snapshot available</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Tabs Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#161616] p-4 rounded-lg border border-[#333333]">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          Question-by-Question Scrutiny
          <span className="text-xs font-normal bg-[#262626] border border-[#404040] text-[#a6a6a6] px-2.5 py-0.5 rounded-full">
            Showing {filteredAnswers.length} of {result.answers.length}
          </span>
        </h2>
        
        <div className="flex gap-1.5 bg-[#0f0f0f] p-1 rounded-md border border-[#2d2d2d] text-xs">
          {(['All', 'Correct', 'Incorrect', 'Unanswered'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded transition-all font-medium ${
                filter === f ? 'bg-[#333333] text-white shadow' : 'text-[#a6a6a6] hover:text-white hover:bg-[#262626]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Question Breakdown List */}
      <div className="space-y-4">
        {filteredAnswers.map((ans: any, idx: number) => {
          const q = ans.question;
          const status = ans.isCorrect ? 'correct' : (ans.selectedAnswer ? 'incorrect' : 'unanswered');

          // Retrieve option shuffling mapping if recorded for this attempt
          const shufflings = result.questionShufflings as Record<string, Record<string, string>> | null;
          const mapping = shufflings?.[q.id];

          return (
            <div
              key={ans.id}
              className={`p-5 rounded-lg border transition-colors ${
                status === 'correct'
                  ? 'border-green-900/60 bg-green-950/10'
                  : status === 'incorrect'
                  ? 'border-red-900/60 bg-red-950/10'
                  : 'border-[#333333] bg-[#161616]'
              }`}
            >
              {/* Question Header & Status Badge */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm bg-[#262626] border border-[#404040] text-white px-2.5 py-1 rounded">
                    Q{idx + 1}
                  </span>
                  {status === 'correct' && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-900/30 border border-green-800 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                    </span>
                  )}
                  {status === 'incorrect' && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-900/30 border border-red-800 px-2.5 py-1 rounded-full">
                      <XCircle className="w-3.5 h-3.5" /> Wrongly Answered
                    </span>
                  )}
                  {status === 'unanswered' && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#a6a6a6] bg-[#262626] border border-[#404040] px-2.5 py-1 rounded-full">
                      <MinusCircle className="w-3.5 h-3.5" /> Not Attempted
                    </span>
                  )}
                </div>

                {ans.answeredAt && (
                  <span className="text-xs text-[#8c8c8c] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Answered at {new Date(ans.answeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Question Text */}
              <p className="font-medium text-base text-white mb-4 whitespace-pre-wrap leading-relaxed">
                {q.questionText}
              </p>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {['A', 'B', 'C', 'D'].map((optKey) => {
                  let originalKey = mapping ? (mapping[optKey] || optKey) : optKey;
                  let optionText = q[`option${originalKey}`];

                  const isStudentSelection = ans.selectedAnswer === optKey;
                  const isCorrectKey = q.correctAnswer === originalKey;

                  let cardStyle = "border-[#3a3a3a] bg-[#1e1e1e] text-[#a6a6a6]";
                  let badgeText = null;

                  if (isStudentSelection && isCorrectKey) {
                    cardStyle = "border-green-500 bg-green-950/40 text-green-200 font-medium shadow-sm";
                    badgeText = "Student Choice (Correct)";
                  } else if (isStudentSelection && !isCorrectKey) {
                    cardStyle = "border-red-500 bg-red-950/40 text-red-200 font-medium shadow-sm";
                    badgeText = "Student Choice (Wrong)";
                  } else if (!isStudentSelection && isCorrectKey) {
                    cardStyle = "border-green-500/60 bg-green-950/20 text-green-300 font-medium";
                    badgeText = "Correct Answer Key";
                  }

                  return (
                    <div key={optKey} className={`p-3 rounded-md border text-sm flex items-center justify-between gap-3 ${cardStyle}`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-bold w-6 h-6 flex items-center justify-center rounded bg-black/40 text-xs shrink-0 border border-white/10">
                          {optKey}
                        </span>
                        <span className="truncate">{optionText}</span>
                      </div>
                      {badgeText && (
                        <span className="text-[10px] uppercase font-bold shrink-0 px-2 py-0.5 rounded bg-black/40 border border-white/10">
                          {badgeText}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation (if any) */}
              {q.explanation && (
                <div className="mt-3 p-3 rounded bg-[#1e1e1e] border border-[#333333] text-sm text-[#cccccc]">
                  <span className="font-semibold text-white block mb-1">Explanation:</span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
