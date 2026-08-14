"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BookOpen, Trophy, Target, TrendingUp, ChevronRight, LogOut, Medal, Clock, AlertCircle } from 'lucide-react';
import AdminPreviewBanner from "@/components/AdminPreviewBanner";

export default function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          router.push("/");
          return;
        }
        setData(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black text-white flex items-center justify-center">
        <AdminPreviewBanner />
        <div className="text-xl font-medium animate-pulse text-[#0099ff]">Loading your performance data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black text-white flex flex-col items-center justify-center p-4">
        <AdminPreviewBanner />
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-4">Unable to load dashboard</h2>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#262626] rounded-md hover:bg-[#333333]">Retry</button>
      </div>
    );
  }

  const { student, availableTests, allAttempts } = data;
  const completedAttempts = allAttempts.filter((a: any) => a.status === 'SUBMITTED');
  
  // Analytics Calculations
  const testsTaken = completedAttempts.length;
  const avgScore = testsTaken > 0 ? (completedAttempts.reduce((acc: number, a: any) => acc + (a.percentage || 0), 0) / testsTaken).toFixed(1) : 0;
  const bestScore = testsTaken > 0 ? Math.max(...completedAttempts.map((a: any) => a.percentage || 0)).toFixed(1) : 0;
  
  const totalCorrect = completedAttempts.reduce((acc: number, a: any) => acc + (a.correctCount || 0), 0);
  const totalQuestionsAttempted = completedAttempts.reduce((acc: number, a: any) => acc + (a.correctCount || 0) + (a.incorrectCount || 0), 0);
  const avgAccuracy = totalQuestionsAttempted > 0 ? ((totalCorrect / totalQuestionsAttempted) * 100).toFixed(1) : 0;

  // Graph Data (Oldest to Newest for chronological graph)
  const graphData = [...completedAttempts].reverse().map((a: any, i: number) => ({
    attempt: `Test ${i + 1}`,
    percentage: a.percentage || 0,
    score: a.score || 0
  }));

  const recentAttempts = completedAttempts.slice(0, 5);
  const last25Attempts = completedAttempts.slice(0, 25);

  const studentName = student.name || student.email.split('@')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black text-white font-sans pb-20">
      <AdminPreviewBanner />

      {/* Header */}
      <header className="border-b border-[#333333] bg-[#161616]/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-wide">Student Dashboard</h1>
            <p className="text-[#a6a6a6] text-sm mt-1">Welcome back, <span className="text-white font-medium capitalize">{studentName}</span></p>
          </div>
          <button onClick={handleLogout} className="flex items-center text-sm text-[#a6a6a6] hover:text-white transition px-3 py-2 rounded-md hover:bg-[#262626]">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Summary Cards */}
        {testsTaken > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#161616]/60 border border-[#333333] p-6 rounded-xl flex items-center gap-4 backdrop-blur-sm">
              <div className="p-3 bg-blue-900/30 rounded-lg text-blue-400"><BookOpen className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-medium text-[#a6a6a6]">Tests Taken</p>
                <p className="text-2xl font-bold text-white">{testsTaken}</p>
              </div>
            </div>
            <div className="bg-[#161616]/60 border border-[#333333] p-6 rounded-xl flex items-center gap-4 backdrop-blur-sm">
              <div className="p-3 bg-green-900/30 rounded-lg text-green-400"><TrendingUp className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-medium text-[#a6a6a6]">Average Score</p>
                <p className="text-2xl font-bold text-white">{avgScore}%</p>
              </div>
            </div>
            <div className="bg-[#161616]/60 border border-[#333333] p-6 rounded-xl flex items-center gap-4 backdrop-blur-sm">
              <div className="p-3 bg-purple-900/30 rounded-lg text-purple-400"><Trophy className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-medium text-[#a6a6a6]">Best Score</p>
                <p className="text-2xl font-bold text-white">{bestScore}%</p>
              </div>
            </div>
            <div className="bg-[#161616]/60 border border-[#333333] p-6 rounded-xl flex items-center gap-4 backdrop-blur-sm">
              <div className="p-3 bg-amber-900/30 rounded-lg text-amber-400"><Target className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-medium text-[#a6a6a6]">Avg. Accuracy</p>
                <p className="text-2xl font-bold text-white">{avgAccuracy}%</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#161616]/60 border border-[#333333] p-8 rounded-xl text-center backdrop-blur-sm">
            <Medal className="w-12 h-12 text-[#0099ff] mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl font-bold mb-2">Start Your Performance Journey</h2>
            <p className="text-[#a6a6a6] mb-6">You haven't completed any tests yet. Take your first test to unlock powerful analytics!</p>
          </div>
        )}

        {/* Available Tests */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Available Tests</h2>
          </div>
          {availableTests.length === 0 ? (
            <p className="text-[#a6a6a6] bg-[#161616]/40 p-4 rounded-lg border border-[#333333]">No tests available at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {availableTests.map((test: any) => {
                const hasAttempted = allAttempts.some((a: any) => a.testId === test.id && a.status === 'SUBMITTED');
                const activeAttempt = allAttempts.find((a: any) => a.testId === test.id && a.status === 'IN_PROGRESS');
                
                let isLocked = false;
                let lockedMessage = "";
                let lockedState = "AVAILABLE"; // AVAILABLE, BEFORE_UNLOCK, AFTER_LOCK

                if (test.status === "LOCKED") {
                  if (test.unlockAt && now < new Date(test.unlockAt)) {
                    isLocked = true;
                    lockedState = "BEFORE_UNLOCK";
                    lockedMessage = `Opens: ${new Date(test.unlockAt).toLocaleString()}`;
                  } else if (test.lockAt && now >= new Date(test.lockAt)) {
                    isLocked = true;
                    lockedState = "AFTER_LOCK";
                    lockedMessage = `Access closed: ${new Date(test.lockAt).toLocaleString()}`;
                  }
                }

                return (
                  <div key={test.id} className="bg-[#1a1a1a] border border-[#333333] rounded-xl overflow-hidden flex flex-col hover:border-[#4d4d4d] transition duration-300 shadow-lg relative">
                    <div className="p-5 flex-1">
                      <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 pr-12">{test.title}</h3>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                        <div className="flex items-center text-[#a6a6a6]">
                          <span className="font-semibold text-white mr-2">{test.totalQuestions}</span> Qs
                        </div>
                        <div className="flex items-center text-[#a6a6a6]">
                          <Clock className="w-4 h-4 mr-1.5 opacity-70" />
                          <span className="font-semibold text-white mr-1">{test.durationMinutes}</span> min
                        </div>
                        <div className="flex items-center text-[#a6a6a6]">
                          <span className="font-semibold text-white mr-1">{test.totalQuestions * test.marksPerQuestion}</span> Marks
                        </div>
                        {test.negativeMarking && (
                          <div className="flex items-center text-red-400">
                            -{test.negativeMarks} per wrong
                          </div>
                        )}
                      </div>
                      
                      {test.status === "LOCKED" && (
                        <div className="mt-3 text-xs bg-[#111111]/80 p-2.5 rounded border border-[#333333]">
                          {lockedState === "BEFORE_UNLOCK" && (
                            <div className="flex items-start text-[#a6a6a6]">
                              <span className="text-orange-400 font-medium mr-1.5 flex-shrink-0">🔒 Locked</span>
                              <span className="leading-tight">{lockedMessage}</span>
                            </div>
                          )}
                          {lockedState === "AFTER_LOCK" && !activeAttempt && (
                            <div className="flex items-start text-[#a6a6a6]">
                              <span className="text-red-400 font-medium mr-1.5 flex-shrink-0">🔒 Closed</span>
                              <span className="leading-tight">{lockedMessage}</span>
                            </div>
                          )}
                          {lockedState === "AVAILABLE" && (
                            <div className="flex items-start text-[#a6a6a6]">
                              <span className="text-green-400 font-medium mr-1.5 flex-shrink-0">🟢 Available</span>
                              <span className="leading-tight">Open until {new Date(test.lockAt).toLocaleString()}</span>
                            </div>
                          )}
                          {activeAttempt && lockedState === "AFTER_LOCK" && (
                            <div className="flex items-start text-yellow-400">
                              <span className="font-medium mr-1.5 flex-shrink-0">▶ Active</span>
                              <span className="leading-tight">You can continue your attempt</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-[#111111] border-t border-[#333333]">
                      {activeAttempt ? (
                        <Link href={`/exam/start/${test.id}`} className="block w-full text-center py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-yellow-600 hover:bg-yellow-700 transition shadow-[0_0_15px_rgba(202,138,4,0.3)]">
                          Continue Test
                        </Link>
                      ) : hasAttempted ? (
                        <Link href={`/exam/start/${test.id}`} className="block w-full text-center py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-[#262626] border border-[#404040] hover:bg-[#333333] transition">
                          Take Again / View
                        </Link>
                      ) : (
                        <Link href={isLocked ? '#' : `/exam/start/${test.id}`} className={`block w-full text-center py-2.5 px-4 rounded-md text-sm font-semibold text-white transition ${isLocked ? 'bg-[#262626] text-[#666666] cursor-not-allowed border border-[#333333]' : 'bg-[#0099ff] hover:bg-[#007acc] shadow-[0_0_15px_rgba(0,153,255,0.3)]'}`}>
                          {isLocked && lockedState === "BEFORE_UNLOCK" ? 'Not Available Yet' : isLocked && lockedState === "AFTER_LOCK" ? 'No Longer Available' : 'Start Test'}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Performance Overview (Only if tests taken) */}
        {testsTaken > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section className="lg:col-span-2 bg-[#161616]/60 border border-[#333333] rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-[#0099ff]" />
                Performance Overview
              </h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
                    <XAxis dataKey="attempt" stroke="#a6a6a6" tick={{fill: '#a6a6a6', fontSize: 12}} />
                    <YAxis stroke="#a6a6a6" tick={{fill: '#a6a6a6', fontSize: 12}} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333333', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#0099ff' }}
                    />
                    <Line type="monotone" dataKey="percentage" name="Percentage (%)" stroke="#0099ff" strokeWidth={3} dot={{r: 4, fill: '#0099ff'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Recent Performance Cards */}
            <section className="bg-[#161616]/60 border border-[#333333] rounded-xl p-6 backdrop-blur-sm flex flex-col">
              <h2 className="text-xl font-bold mb-4">Recent Performance</h2>
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {recentAttempts.map((attempt: any) => (
                  <Link key={attempt.id} href={`/exam/result/${attempt.id}`} className="block bg-[#1a1a1a] border border-[#333333] p-4 rounded-lg hover:border-[#4d4d4d] transition group">
                    <p className="font-semibold text-white mb-1 line-clamp-1 group-hover:text-[#0099ff] transition-colors">{attempt.test.title}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#a6a6a6]">{new Date(attempt.submittedAt).toLocaleDateString()}</span>
                      <span className={`font-bold ${attempt.percentage >= 80 ? 'text-green-400' : attempt.percentage >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {attempt.percentage?.toFixed(1)}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Result Tracker Table */}
        {testsTaken > 0 && (
          <section className="bg-[#161616]/60 border border-[#333333] rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 border-b border-[#333333] flex justify-between items-center">
              <h2 className="text-xl font-bold">Result Tracker</h2>
              <span className="text-sm text-[#a6a6a6]">Showing last {last25Attempts.length} tests</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#333333]">
                <thead className="bg-[#1a1a1a]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Test</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">%</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">C / I / U</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333333] bg-[#161616]/40">
                  {last25Attempts.map((attempt: any) => (
                    <tr key={attempt.id} className="hover:bg-[#262626]/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{attempt.test.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#a6a6a6]">
                        {new Date(attempt.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                        {attempt.score}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2.5 py-0.5 rounded-full font-medium ${
                          attempt.percentage >= 80 ? 'bg-green-900/30 text-green-400 border border-green-800' : 
                          attempt.percentage >= 60 ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800' : 
                          'bg-red-900/30 text-red-400 border border-red-800'
                        }`}>
                          {attempt.percentage?.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className="text-green-400">{attempt.correctCount}</span>
                        <span className="text-[#666666] mx-1">/</span>
                        <span className="text-red-400">{attempt.incorrectCount}</span>
                        <span className="text-[#666666] mx-1">/</span>
                        <span className="text-[#a6a6a6]">{attempt.unansweredCount}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/exam/result/${attempt.id}`} className="inline-flex items-center text-[#0099ff] hover:text-[#33adff] transition-colors">
                          View <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
