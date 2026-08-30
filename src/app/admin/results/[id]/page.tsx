"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, MinusCircle, ArrowLeft, Clock, User, Award, CheckCircle, HelpCircle, RotateCcw, X, AlertCircle } from "lucide-react";
import PiFiringLoader from "@/components/PiFiringLoader";

export default function AdminAttemptDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Correct' | 'Incorrect' | 'Unanswered'>('All');
  const router = useRouter();

  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [attemptDetails, setAttemptDetails] = useState<Record<string, any> | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [extraMinutes, setExtraMinutes] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);

  const handleOpenResumeModal = async () => {
    setAttemptDetails(null);
    setExtraMinutes(0);
    setResumeModalOpen(true);
    setLoadingDetails(true);

    try {
      const res = await fetch(`/api/admin/results/${resolvedParams.id}/reopen`);
      const data = await res.json();
      if (res.ok) {
        setAttemptDetails(data);
        if (data.remainingSeconds <= 0) {
          setExtraMinutes(10);
        }
      } else {
        alert(data.error || "Could not fetch timing details.");
      }
    } catch (e) { console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleConfirmResume = async () => {
    setReopening(true);
    try {
      const res = await fetch(`/api/admin/results/${resolvedParams.id}/reopen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraMinutes: Number(extraMinutes) || 0 })
      });
      const data = await res.json();
      if (res.ok) {
        setResult((prev: Record<string, any>) => ({
          ...prev,
          status: "IN_PROGRESS",
          submissionReason: null,
          score: null,
          percentage: null
        }));
        setResumeModalOpen(false);
        setNotification("Test reopened successfully! The student can now continue from where they left off.");
        setTimeout(() => setNotification(null), 6000);
      } else {
        alert(data.error || "Failed to resume test.");
      }
    } catch (e) {
      alert("Error resuming test.");
    } finally {
      setReopening(false);
    }
  };

  const formatSeconds = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

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

      {notification && (
        <div className="p-4 bg-green-950/80 border border-green-700/60 rounded-xl flex items-center justify-between shadow-lg text-green-300 text-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
            <span className="font-medium">{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-green-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Title & Student Overview Header */}
      <div className="bg-[#161616]/70 border border-[#333333] p-6 rounded-lg backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-[#2d2d2d] pb-4">
          <div>
            <span className="text-xs font-semibold uppercase text-blue-400 tracking-wider">Exam Scrutiny Report</span>
            <h1 className="text-2xl font-bold text-white mt-0.5">{result.test?.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {result.status === "SUBMITTED" && (
              <button
                type="button"
                onClick={handleOpenResumeModal}
                className="inline-flex items-center gap-1.5 text-xs bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 px-3 py-1.5 rounded transition-all font-bold shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Resume Test for Student
              </button>
            )}
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
          <div className="text-2xl font-black text-white">{result.score != null ? result.score : '-'}</div>
          <div className="text-xs font-bold text-blue-400 mt-0.5">{result.percentage != null ? `${Number(result.percentage).toFixed(1)}%` : '-'}</div>
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
      {/* Interactive Resume Test Confirmation Modal */}
      {resumeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#181818] border border-[#333333] w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 text-white relative">
            <button
              onClick={() => setResumeModalOpen(false)}
              className="absolute top-5 right-5 text-[#a6a6a6] hover:text-white transition"
              disabled={reopening}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-[#2d2d2d] pb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Resume Test for Student</h3>
                <p className="text-xs text-[#a6a6a6]">Test will start again from where the student left off</p>
              </div>
            </div>

            {loadingDetails ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-[#a6a6a6]">Calculating remaining test time & answers...</p>
              </div>
            ) : attemptDetails ? (
              <div className="space-y-4 text-sm">
                <div className="bg-[#222222] p-4 rounded-xl border border-[#333333] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#a6a6a6]">Student:</span>
                    <span className="font-semibold text-white">{attemptDetails.student.name} ({attemptDetails.student.email})</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#a6a6a6]">Test:</span>
                    <span className="font-semibold text-white truncate max-w-[280px]">{attemptDetails.test.title}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#a6a6a6]">Submission Reason:</span>
                    <span className="font-mono text-amber-300 font-semibold">{attemptDetails.submissionReason?.replace(/_/g, " ") || "MANUAL SUBMISSION"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#a6a6a6]">Saved Answers:</span>
                    <span className="font-semibold text-cyan-400">{attemptDetails.answeredCount} / {attemptDetails.test.totalQuestions} questions answered</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#222222] p-3.5 rounded-xl border border-[#333333] space-y-1">
                    <div className="text-xs text-[#a6a6a6]">Time Spent Before Stop</div>
                    <div className="text-lg font-bold text-white font-mono">{formatSeconds(attemptDetails.timeSpentSeconds)}</div>
                    <div className="text-[11px] text-[#737373]">of {attemptDetails.test.durationMinutes}m test</div>
                  </div>
                  <div className="bg-amber-950/30 p-3.5 rounded-xl border border-amber-600/40 space-y-1">
                    <div className="text-xs text-amber-300/80">Remaining Time When Resumed</div>
                    <div className="text-lg font-bold text-amber-400 font-mono">
                      {formatSeconds(Math.max(0, attemptDetails.remainingSeconds) + (Number(extraMinutes) || 0) * 60)}
                    </div>
                    <div className="text-[11px] text-amber-200/70">
                      {attemptDetails.remainingSeconds > 0 ? "Timer starts here" : "Needs extra time"}
                    </div>
                  </div>
                </div>

                {attemptDetails.remainingSeconds <= 0 && (
                  <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-red-300">Test time had expired:</span> The student had used all test time before submission. Please specify additional minutes below to reopen.
                    </div>
                  </div>
                )}

                <div className="bg-[#202020] p-3 rounded-xl border border-[#333333] space-y-2">
                  <label className="text-xs font-semibold text-[#cfcfcf] flex justify-between items-center">
                    <span>Add Extra Grace Minutes (Optional):</span>
                    <span className="text-amber-400 font-mono text-xs">+{Number(extraMinutes) || 0} mins</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="180"
                      value={extraMinutes}
                      onChange={(e) => setExtraMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                      className="flex-1 bg-[#141414] border border-[#444444] rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
                      placeholder="0"
                    />
                    <div className="flex gap-1.5">
                      {[5, 10, 15].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setExtraMinutes(mins)}
                          className="px-2.5 py-1 text-xs bg-[#2b2b2b] hover:bg-amber-600 hover:text-black text-[#a6a6a6] rounded-md transition font-mono"
                        >
                          +{mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-200 leading-relaxed">
                  ✓ The student will see <strong>Continue Test</strong> on their dashboard.<br />
                  ✓ All {attemptDetails.answeredCount} answered questions will remain pre-selected.<br />
                  ✓ The timer will resume at <strong>{formatSeconds(Math.max(0, attemptDetails.remainingSeconds) + (Number(extraMinutes) || 0) * 60)}</strong>.
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2d2d2d]">
              <button
                type="button"
                onClick={() => setResumeModalOpen(false)}
                disabled={reopening}
                className="px-4 py-2 text-xs font-semibold text-[#a6a6a6] hover:text-white bg-[#262626] hover:bg-[#333333] rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResume}
                disabled={reopening || loadingDetails}
                className="px-5 py-2 text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition shadow-md flex items-center gap-1.5"
              >
                {reopening ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Reopening...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    Confirm & Start Test Again
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
