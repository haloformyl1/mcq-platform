"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, MinusCircle, ArrowLeft, Clock, User, Award, HelpCircle } from "lucide-react";
import PiechemLogo from "@/components/PiechemLogo";
import PiFiringLoader from "@/components/PiFiringLoader";

export default function ExamResult({ params }: { params: Promise<{ attemptId: string }> }) {
  const resolvedParams = use(params);
  const [result, setResult] = useState<any>(null);
  const [filter, setFilter] = useState<'All' | 'Correct' | 'Incorrect' | 'Unanswered'>('All');
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/exam/result/${resolvedParams.attemptId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) router.push("/dashboard");
        else setResult(data);
      });
  }, [resolvedParams.attemptId, router]);

  if (!result) return <PiFiringLoader fullScreen={true} />;

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
    <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black py-10 px-4 sm:px-6 lg:px-8 text-white font-sans">
      <div className="max-w-6xl mx-auto space-y-6 pb-24 md:pb-8">
        
        {/* Top Header & Logo */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#161616]/70 border border-[#333333] p-4 rounded-xl backdrop-blur-md">
          <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
            <PiechemLogo size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] sm:text-xs font-semibold text-blue-400 uppercase tracking-widest truncate">Exam Scrutiny & Performance</div>
              <h1 className="text-base sm:text-lg font-bold text-white break-words line-clamp-2 leading-tight">{result.test.title}</h1>
            </div>
          </div>
          <Link href="/dashboard" className="w-full sm:w-auto text-center flex items-center justify-center gap-2 text-xs bg-[#222222] hover:bg-[#333333] text-white px-4 py-2.5 rounded-lg border border-[#404040] transition font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>

        {/* Overview Header & Timing Stats Grid */}
        <div className="bg-[#161616]/80 border border-[#333333] p-4 sm:p-6 rounded-xl backdrop-blur-md space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-[#2d2d2d] pb-4">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-semibold uppercase text-blue-400 tracking-wider">Exam Scrutiny Report</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5 break-words line-clamp-2 leading-tight">{result.test.title}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#333333] flex items-center gap-3">
              <User className="w-8 h-8 text-blue-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-[#a6a6a6]">Student Profile</div>
                <div className="text-sm font-bold text-white leading-tight truncate">{studentName}</div>
                <div className="text-xs text-blue-400 font-mono truncate">{studentEmail}</div>
              </div>
            </div>

            <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#333333] flex items-center gap-3">
              <Clock className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs text-[#a6a6a6]">Start & Submit Time</div>
                <div className="text-xs font-medium text-white">{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                <div className="text-xs text-[#a6a6a6]">{submitTime ? submitTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "Not submitted"}</div>
              </div>
            </div>

            <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#333333] flex items-center gap-3">
              <Award className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs text-[#a6a6a6]">Total Duration</div>
                <div className="text-sm font-bold text-white">{durationText}</div>
                <div className="text-xs text-[#a6a6a6]">Allowed: {result.test?.durationMinutes} mins</div>
              </div>
            </div>

            <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#333333] flex items-center gap-3">
              <HelpCircle className="w-8 h-8 text-purple-400 shrink-0" />
              <div>
                <div className="text-xs text-[#a6a6a6]">Average Speed</div>
                <div className="text-sm font-bold text-white">{avgTimePerQuestion} s</div>
                <div className="text-xs text-[#a6a6a6]">per question</div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Score Breakdown Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#161616]/80 p-5 rounded-xl border border-[#333333] backdrop-blur-md text-center">
            <div className="text-xs font-medium text-[#a6a6a6] mb-1">Final Score</div>
            <div className="text-3xl font-extrabold text-white">{result.score != null ? result.score : '-'}</div>
            <div className="text-xs font-bold text-blue-400 mt-1">{result.percentage != null ? `${Number(result.percentage).toFixed(1)}%` : '-'}</div>
          </div>

          <div className="bg-green-950/20 p-5 rounded-xl border border-green-900/50 backdrop-blur-md text-center">
            <div className="text-xs font-medium text-green-400 mb-1">Correct Answers</div>
            <div className="text-3xl font-extrabold text-green-400">{correctCount}</div>
            <div className="text-xs text-green-500/80 mt-1">+{result.test?.marksPerQuestion || 1} mark each</div>
          </div>

          <div className="bg-red-950/20 p-5 rounded-xl border border-red-900/50 backdrop-blur-md text-center">
            <div className="text-xs font-medium text-red-400 mb-1">Wrong Answers</div>
            <div className="text-3xl font-extrabold text-red-400">{incorrectCount}</div>
            <div className="text-xs text-red-500/80 mt-1">
              {result.test?.negativeMarking ? `-${result.test?.negativeMarks} penalty` : "No penalty"}
            </div>
          </div>

          <div className="bg-[#161616]/80 p-5 rounded-xl border border-[#333333] backdrop-blur-md text-center">
            <div className="text-xs font-medium text-[#a6a6a6] mb-1">Not Attempted</div>
            <div className="text-3xl font-extrabold text-[#a6a6a6]">{unansweredCount}</div>
            <div className="text-xs text-[#737373] mt-1">Unanswered</div>
          </div>
        </div>

        {/* Question-by-Question Scrutiny Header & Filter */}
        <div className="bg-[#161616]/80 border border-[#333333] p-4 rounded-xl backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base sm:text-lg font-bold text-white">Question-by-Question Scrutiny</h3>
            <span className="text-xs bg-[#262626] border border-[#404040] text-[#a6a6a6] px-2.5 py-0.5 rounded-full font-mono">
              Showing {filteredAnswers.length} of {result.answers.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 bg-[#1a1a1a] p-1 rounded-lg border border-[#333333] w-full sm:w-auto">
            {(['All', 'Correct', 'Incorrect', 'Unanswered'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-all text-center ${
                  filter === f 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-[#a6a6a6] hover:text-white hover:bg-[#262626]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Question Cards List */}
        <div className="space-y-4">
          {filteredAnswers.length === 0 ? (
            <div className="bg-[#161616]/60 p-8 text-center text-[#a6a6a6] rounded-xl border border-[#333333]">
              No questions match the selected filter standard.
            </div>
          ) : (
            filteredAnswers.map((ans: any, idx: number) => {
              const q = ans.question;
              const status = ans.isCorrect ? 'correct' : (ans.selectedAnswer ? 'incorrect' : 'unanswered');

              return (
                <div 
                  key={ans.id || idx} 
                  className={`p-4 sm:p-5 rounded-xl border backdrop-blur-md transition-all ${
                    status === 'correct' 
                      ? 'border-green-900/50 bg-green-950/10' 
                      : status === 'incorrect' 
                      ? 'border-red-900/50 bg-red-950/10' 
                      : 'border-[#333333] bg-[#161616]/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0">
                      {status === 'correct' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      {status === 'incorrect' && <XCircle className="w-5 h-5 text-red-500" />}
                      {status === 'unanswered' && <MinusCircle className="w-5 h-5 text-[#737373]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-sm sm:text-base text-white leading-relaxed break-words">
                            <span className="text-blue-400 font-bold mr-2">Q{idx + 1}.</span>
                            {q.questionText}
                          </p>
                          {q.imageUrl && (
                            <div className="mt-3 mb-2 flex justify-center">
                              <div className="relative max-w-full rounded-lg overflow-hidden border border-[#404040] bg-black/40 p-1.5 shadow-md">
                                <img
                                  src={q.imageUrl}
                                  alt="Question diagram"
                                  className="max-h-72 w-auto object-contain rounded"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                          status === 'correct' ? 'bg-green-900/40 text-green-300 border border-green-700' :
                          status === 'incorrect' ? 'bg-red-900/40 text-red-300 border border-red-700' :
                          'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}>
                          {status}
                        </span>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-4">
                        {['A', 'B', 'C', 'D'].map((opt) => {
                          const shufflings = result.questionShufflings as Record<string, Record<string, string>> | null;
                          const mapping = shufflings?.[q.id];
                          const originalKey = mapping ? (mapping[opt] || opt) : opt;
                          const optionText = q[`option${originalKey}`];

                          const isSelected = ans.selectedAnswer === opt;
                          let isCorrectAnswer = q.correctAnswer === originalKey;

                          if (!mapping && ans.isCorrect && isSelected) {
                            isCorrectAnswer = true;
                          }

                          let optStyle = "border-[#333333] bg-[#222222]/50 text-[#a6a6a6]";
                          if (isSelected && isCorrectAnswer) {
                            optStyle = "border-green-500 bg-green-950/40 text-green-200 font-medium ring-1 ring-green-500/50";
                          } else if (isSelected && !isCorrectAnswer) {
                            optStyle = "border-red-500 bg-red-950/40 text-red-200 font-medium ring-1 ring-red-500/50";
                          } else if (!isSelected && isCorrectAnswer) {
                            optStyle = "border-green-500/60 bg-green-950/20 text-green-400 font-medium";
                          }

                          return (
                            <div key={opt} className={`p-3 rounded-lg border text-sm flex items-center justify-between gap-2 break-words ${optStyle}`}>
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="font-bold w-6 h-6 flex items-center justify-center rounded bg-black/40 text-xs shrink-0 border border-white/10">
                                  {opt}
                                </span>
                                <span className="break-words leading-snug">{optionText}</span>
                              </div>
                              {isSelected && (
                                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/40 shrink-0">
                                  Your Pick
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="mt-3 p-3.5 rounded-lg bg-[#222222] border border-[#333333] text-xs text-[#cccccc] break-words">
                          <span className="font-bold text-white block mb-1">Explanation:</span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
