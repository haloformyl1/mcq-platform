"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RotateCcw, AlertCircle, CheckCircle2, X } from "lucide-react";

interface AttemptItem {
  id: string;
  status: string;
  startedAt: string | Date;
  submittedAt?: string | Date | null;
  submissionReason?: string | null;
  score?: number | null;
  percentage?: number | null;
  student?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
  test?: {
    id: string;
    title: string;
    durationMinutes?: number;
    totalQuestions?: number;
  } | null;
}

interface AttemptDetails {
  id: string;
  student: { id: string; name: string; email: string };
  test: { id: string; title: string; durationMinutes: number; totalQuestions: number };
  status: string;
  submissionReason: string | null;
  timeSpentSeconds: number;
  remainingSeconds: number;
  totalDurationSeconds: number;
  answeredCount: number;
  extraTimeMinutes: number;
}
import PiFiringLoader from "@/components/PiFiringLoader";

export default function AdminResults() {
  const [results, setResults] = useState<AttemptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const router = useRouter();

  // Reopen/Resume modal state
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptItem | null>(null);
  const [attemptDetails, setAttemptDetails] = useState<AttemptDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [extraMinutes, setExtraMinutes] = useState<number>(0);

  useEffect(() => {
    fetch("/api/admin/results")
      .then(async res => {
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) {
          throw new Error(data.error || "Failed to fetch results");
        }
        return data;
      })
      .then(data => {
        setResults(data);
      })
      .catch(error => setError(error.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteAttempt = async (attemptId: string, studentName: string, testTitle: string) => {
    if (!confirm(`Are you sure you want to permanently delete the test record for "${studentName}" (${testTitle})?\n\nThis will remove the score, attempt answers, and proctoring records from everywhere (Student Dashboard, Admin Results, & Analytics).`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/results/${attemptId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        setResults(prev => prev.filter(r => r.id !== attemptId));
        setNotification(`Test record for "${studentName}" has been deleted.`);
        setTimeout(() => setNotification(null), 5000);
      } else {
        alert(data.error || "Failed to delete test record.");
      }
    } catch {
      alert("Error deleting test record.");
    }
  };

  const handleOpenResumeModal = async (result: AttemptItem) => {
    setSelectedAttempt(result);
    setAttemptDetails(null);
    setExtraMinutes(0);
    setResumeModalOpen(true);
    setLoadingDetails(true);

    try {
      const res = await fetch(`/api/admin/results/${result.id}/reopen`);
      const data = await res.json();
      if (res.ok) {
        setAttemptDetails(data);
        if (data.remainingSeconds <= 0) {
          setExtraMinutes(10); // default suggested extra time if completely expired
        }
      } else {
        alert(data.error || "Could not fetch attempt timing details.");
      }
    } catch (e) { console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleConfirmResume = async () => {
    if (!selectedAttempt) return;
    setReopening(true);
    try {
      const res = await fetch(`/api/admin/results/${selectedAttempt.id}/reopen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraMinutes: Number(extraMinutes) || 0 })
      });
      const data = await res.json();
      if (res.ok) {
        // Update row in state to IN_PROGRESS
        setResults(prev => prev.map(r => {
          if (r.id === selectedAttempt.id) {
            return {
              ...r,
              status: "IN_PROGRESS",
              score: null,
              percentage: null,
              submissionReason: null
            };
          }
          return r;
        }));
        setResumeModalOpen(false);
        const studentName = selectedAttempt.student?.name || selectedAttempt.student?.email || "Student";
        setNotification(`Test successfully reopened for ${studentName}! The student can now continue from where they left off.`);
        setTimeout(() => setNotification(null), 6000);
      } else {
        alert(data.error || "Failed to resume test.");
      }
    } catch {
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

  if (loading) return <PiFiringLoader fullScreen={false} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Test Results</h1>
        <div className="text-sm text-[#a6a6a6]">Total Attempts: <span className="text-white font-bold">{results.length}</span></div>
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

      {error && <p className="mb-4 text-red-400">{error}</p>}

      {results.length === 0 && !error ? (
        <div className="bg-[#161616]/60 p-8 text-center text-[#a6a6a6] rounded-lg border border-[#333333]">
          No test results are available yet.
        </div>
      ) : (
        <>
          {/* Mobile Card View (Visible on small screens) */}
          <div className="md:hidden space-y-4">
            {results.map((result: AttemptItem) => {
              const studentName = result.student?.name || (result.student?.email ? result.student.email.split("@")[0] : "Student");
              const studentEmail = result.student?.email || "No email";
              const startDate = new Date(result.startedAt);
              const formattedDate = startDate.toLocaleDateString();
              const formattedTime = startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

              return (
                <div 
                  key={result.id} 
                  className="bg-[#161616]/90 border border-[#333333] p-4 rounded-lg space-y-3 shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-white text-base">{studentName}</div>
                      <div className="text-xs text-[#a6a6a6] font-mono">{studentEmail}</div>
                    </div>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      result.status === "SUBMITTED" ? "bg-green-900/40 text-green-300 border border-green-700/50" : "bg-yellow-900/40 text-yellow-300 border border-yellow-700/50"
                    }`}>
                      {result.status}
                    </span>
                  </div>

                  <div className="text-sm font-medium text-white bg-[#222222] p-2.5 rounded border border-[#333333] line-clamp-2">
                    {result.test?.title}
                  </div>

                  <div className="flex justify-between items-center text-xs text-[#a6a6a6] pt-1">
                    <div>
                      <span className="text-[#737373]">Score: </span>
                      <span className="font-bold text-white text-base">{result.score != null ? result.score : "-"}</span>
                      {result.percentage != null && (
                        <span className="text-blue-400 font-semibold ml-1.5">({Number(result.percentage).toFixed(1)}%)</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{formattedDate}</div>
                      <div className="text-[#737373] text-[11px]">{formattedTime}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-[#262626]">
                    {result.status === "SUBMITTED" && (
                      <button
                        type="button"
                        onClick={() => handleOpenResumeModal(result)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 font-bold py-2 px-3 rounded-md transition shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Start Test Again (Resume where left off)
                      </button>
                    )}
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/admin/results/${result.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3 rounded-md shadow transition"
                      >
                        Inspect Details →
                      </Link>
                      <button
                        onClick={() => handleDeleteAttempt(result.id, studentName, result.test?.title || "Test")}
                        className="px-3 py-2 bg-red-950/80 hover:bg-red-900 text-red-400 hover:text-white text-xs font-bold rounded-md border border-red-800/60 transition shrink-0"
                      >
                        Delete Record
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (Visible on medium & larger screens) */}
          <div className="hidden md:block bg-[#161616]/60 shadow rounded-lg overflow-x-auto border border-[#333333] backdrop-blur-sm">
            <table className="w-full divide-y divide-[#333333]">
              <thead className="bg-[#1a1a1a]/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Student Name & Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Test Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Status & Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Score & %</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Date & Start Time</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-[#333333]">
                {results.map((result: AttemptItem) => {
                  const studentName = result.student?.name || (result.student?.email ? result.student.email.split("@")[0] : "Student");
                  const studentEmail = result.student?.email || "No email";
                  const startDate = new Date(result.startedAt);
                  const formattedDate = startDate.toLocaleDateString();
                  const formattedTime = startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                  return (
                    <tr 
                      key={result.id} 
                      onClick={() => router.push(`/admin/results/${result.id}`)}
                      className="hover:bg-[#262626]/70 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{studentName}</div>
                        <div className="text-xs text-[#a6a6a6]">{studentEmail}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-white max-w-xs truncate">{result.test?.title}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          result.status === "SUBMITTED" ? "bg-green-900/30 text-green-400 border border-green-800" : "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
                        }`}>
                          {result.status}
                        </span>
                        {result.submissionReason && (
                          <div className="text-xs text-[#a6a6a6] mt-1">{result.submissionReason.replace(/_/g, " ")}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {result.status === "SUBMITTED" ? (
                          <div>
                            <div className="text-sm font-bold text-white">{result.score != null ? result.score : "-"}</div>
                            <div className="text-xs text-blue-400 font-medium">{result.percentage != null ? `${Number(result.percentage).toFixed(1)}%` : ""}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-[#a6a6a6]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-[#a6a6a6]">
                        <div>{formattedDate}</div>
                        <div className="text-xs text-[#737373]">{formattedTime}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2 shrink-0">
                          {result.status === "SUBMITTED" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenResumeModal(result);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 px-3 py-1.5 rounded transition-all font-semibold shrink-0 shadow-sm"
                              title="Start test again from where student left off"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Resume Test
                            </button>
                          )}
                          <Link 
                            href={`/admin/results/${result.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white border border-blue-500/30 px-3 py-1.5 rounded transition-all font-semibold shrink-0"
                          >
                            Inspect Details →
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAttempt(result.id, studentName, result.test?.title || "Test");
                            }}
                            className="inline-flex items-center gap-1 text-xs bg-red-950/80 hover:bg-red-700 text-red-300 hover:text-white border border-red-800/60 px-3 py-1.5 rounded transition-all font-semibold shrink-0"
                            title="Delete Test Record from Everywhere"
                          >
                            Delete Record
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Interactive Resume Test Confirmation Modal */}
      {resumeModalOpen && selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
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
