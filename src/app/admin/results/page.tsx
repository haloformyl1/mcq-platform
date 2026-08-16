"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PiFiringLoader from "@/components/PiFiringLoader";

export default function AdminResults() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  if (loading) return <PiFiringLoader fullScreen={false} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Test Results</h1>
        <div className="text-sm text-[#a6a6a6]">Total Attempts: <span className="text-white font-bold">{results.length}</span></div>
      </div>

      {error && <p className="mb-4 text-red-400">{error}</p>}

      {results.length === 0 && !error ? (
        <div className="bg-[#161616]/60 p-8 text-center text-[#a6a6a6] rounded-lg border border-[#333333]">
          No test results are available yet.
        </div>
      ) : (
        <>
          {/* Mobile Card View (Visible on small screens) */}
          <div className="md:hidden space-y-4">
            {results.map((result: any) => {
              const studentName = result.student?.name || (result.student?.email ? result.student.email.split('@')[0] : "Student");
              const studentEmail = result.student?.email || "No email";
              const startDate = new Date(result.startedAt);
              const formattedDate = startDate.toLocaleDateString();
              const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
                      result.status === 'SUBMITTED' ? 'bg-green-900/40 text-green-300 border border-green-700/50' : 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50'
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
                      <span className="font-bold text-white text-base">{result.score != null ? result.score : '-'}</span>
                      {result.percentage != null && (
                        <span className="text-blue-400 font-semibold ml-1.5">({Number(result.percentage).toFixed(1)}%)</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{formattedDate}</div>
                      <div className="text-[#737373] text-[11px]">{formattedTime}</div>
                    </div>
                  </div>

                  <Link 
                    href={`/admin/results/${result.id}`}
                    className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-md shadow-md transition-all active:scale-[0.98]"
                  >
                    Inspect Details →
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (Visible on medium & larger screens) */}
          <div className="hidden md:block bg-[#161616]/60 shadow rounded-lg overflow-x-auto border border-[#333333] backdrop-blur-sm">
            <table className="min-w-full divide-y divide-[#333333]">
              <thead className="bg-[#1a1a1a]/80">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Student Name & Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Test Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Status & Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Score & %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Date & Start Time</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-[#333333]">
                {results.map((result: any) => {
                  const studentName = result.student?.name || (result.student?.email ? result.student.email.split('@')[0] : "Student");
                  const studentEmail = result.student?.email || "No email";
                  const startDate = new Date(result.startedAt);
                  const formattedDate = startDate.toLocaleDateString();
                  const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr 
                      key={result.id} 
                      onClick={() => router.push(`/admin/results/${result.id}`)}
                      className="hover:bg-[#262626]/70 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{studentName}</div>
                        <div className="text-xs text-[#a6a6a6]">{studentEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white max-w-xs truncate">{result.test?.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          result.status === 'SUBMITTED' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
                        }`}>
                          {result.status}
                        </span>
                        {result.submissionReason && (
                          <div className="text-xs text-[#a6a6a6] mt-1">{result.submissionReason.replace(/_/g, ' ')}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.status === 'SUBMITTED' ? (
                          <div>
                            <div className="text-sm font-bold text-white">{result.score != null ? result.score : '-'}</div>
                            <div className="text-xs text-blue-400 font-medium">{result.percentage != null ? `${Number(result.percentage).toFixed(1)}%` : ''}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-[#a6a6a6]">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#a6a6a6]">
                        <div>{formattedDate}</div>
                        <div className="text-xs text-[#737373]">{formattedTime}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          href={`/admin/results/${result.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white border border-blue-500/30 px-3 py-1.5 rounded transition-all font-semibold"
                        >
                          Inspect Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
