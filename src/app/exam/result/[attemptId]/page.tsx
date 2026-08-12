"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, MinusCircle, ChevronLeft } from "lucide-react";

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

  if (!result) return <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black text-white flex items-center justify-center font-sans">Loading...</div>;

  const durationSec = result.submittedAt 
    ? Math.floor((new Date(result.submittedAt).getTime() - new Date(result.startedAt).getTime()) / 1000)
    : 0;
  
  const min = Math.floor(durationSec / 60);
  const sec = durationSec % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black py-12 px-4 sm:px-6 lg:px-8 text-white font-sans">
      <div className="max-w-3xl mx-auto bg-[#161616]/80 shadow-2xl rounded-lg p-8 border border-[#404040]">
        <h1 className="text-3xl font-bold mb-2 text-center tracking-wide">Test Completed</h1>
        <h2 className="text-xl text-[#a6a6a6] mb-8 text-center">{result.test.title}</h2>
        
        <div className="bg-[#262626] border border-[#404040] rounded-lg p-6 mb-8">
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-lg items-center">
            <div className="font-medium text-[#a6a6a6]">Score:</div>
            <div className="font-bold text-2xl text-[#0099ff]">{result.score} / {result.test.totalQuestions}</div>
            
            <div className="font-medium text-[#a6a6a6]">Percentage:</div>
            <div className="font-bold">{result.percentage?.toFixed(2)}%</div>
            
            <div className="font-medium text-[#a6a6a6]">Correct:</div>
            <div className="text-green-400 font-bold">{result.correctCount}</div>
            
            <div className="font-medium text-[#a6a6a6]">Incorrect:</div>
            <div className="text-red-400 font-bold">{result.incorrectCount}</div>
            
            <div className="font-medium text-[#a6a6a6]">Unanswered:</div>
            <div className="text-[#8c8c8c] font-bold">{result.unansweredCount}</div>
            
            <div className="font-medium text-[#a6a6a6]">Time Used:</div>
            <div className="font-mono">{min}:{sec.toString().padStart(2, '0')}</div>
            
            <div className="font-medium text-[#a6a6a6]">Submission Reason:</div>
            <div>
              <span className="text-sm px-3 py-1 bg-[#161616] text-[#a6a6a6] rounded-full font-medium border border-[#404040]">
                {result.submissionReason?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>
        
        {/* Navigation & Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <Link href="/dashboard" className="flex items-center px-4 py-2 bg-[#262626] text-white hover:bg-[#333333] transition rounded-md border border-[#404040]">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex space-x-2 bg-[#1a1a1a] p-1 rounded-md border border-[#333333]">
            {['All', 'Correct', 'Incorrect', 'Unanswered'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${filter === f ? 'bg-[#333333] text-white shadow-sm' : 'text-[#a6a6a6] hover:text-white hover:bg-[#262626]'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Question Review */}
        {result.answers && result.answers.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold border-b border-[#333333] pb-2">Question Review</h3>
            {result.answers
              .filter((ans: any) => {
                if (filter === 'Correct') return ans.isCorrect === true;
                if (filter === 'Incorrect') return ans.isCorrect === false && ans.selectedAnswer;
                if (filter === 'Unanswered') return !ans.selectedAnswer;
                return true;
              })
              .map((ans: any, index: number) => {
                const q = ans.question;
                const status = ans.isCorrect ? 'correct' : (ans.selectedAnswer ? 'incorrect' : 'unanswered');
                
                return (
                  <div key={ans.id} className={`p-5 rounded-lg border ${status === 'correct' ? 'border-green-900/50 bg-green-900/10' : status === 'incorrect' ? 'border-red-900/50 bg-red-900/10' : 'border-[#404040] bg-[#1a1a1a]'}`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0">
                        {status === 'correct' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                        {status === 'incorrect' && <XCircle className="w-5 h-5 text-red-500" />}
                        {status === 'unanswered' && <MinusCircle className="w-5 h-5 text-[#8c8c8c]" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[15px] mb-4 text-white">
                          <span className="text-[#a6a6a6] mr-2">Q.</span>
                          {q.questionText}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          {['A', 'B', 'C', 'D'].map((opt) => {
                            const optionText = q[`option${opt}`];
                            const isSelected = ans.selectedAnswer === opt;
                            const isCorrectAnswer = q.correctAnswer === opt;
                            
                            let optStyle = "border-[#404040] text-[#a6a6a6]";
                            if (isSelected && isCorrectAnswer) optStyle = "border-green-500 bg-green-900/20 text-green-300";
                            else if (isSelected && !isCorrectAnswer) optStyle = "border-red-500 bg-red-900/20 text-red-300";
                            else if (!isSelected && isCorrectAnswer) optStyle = "border-green-500/50 bg-green-900/10 text-green-400";

                            return (
                              <div key={opt} className={`p-3 rounded-md border text-sm flex items-center gap-2 ${optStyle}`}>
                                <span className="font-bold w-5 h-5 flex items-center justify-center rounded bg-black/30 text-xs">
                                  {opt}
                                </span>
                                {optionText}
                              </div>
                            );
                          })}
                        </div>
                        
                        {q.explanation && (
                          <div className="mt-4 p-3 rounded bg-[#262626] border border-[#404040] text-sm text-[#cccccc]">
                            <span className="font-semibold text-white block mb-1">Explanation:</span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
