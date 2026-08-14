"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import PiFiringLoader from "@/components/PiFiringLoader";

export default function AdminResults() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      <div className="bg-[#161616]/60 shadow rounded-lg overflow-hidden border border-[#333333] backdrop-blur-sm">
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
            {results.length === 0 && !error ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-[#a6a6a6]">No test results are available yet.</td>
              </tr>
            ) : results.map((result: any) => {
              const studentName = result.student?.name || (result.student?.email ? result.student.email.split('@')[0] : "Student");
              const studentEmail = result.student?.email || "No email";
              const startDate = new Date(result.startedAt);
              const formattedDate = startDate.toLocaleDateString();
              const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <tr key={result.id} className="hover:bg-[#262626]/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-white">{studentName}</div>
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
                        <div className="text-sm font-bold text-white">{result.score}</div>
                        <div className="text-xs text-blue-400 font-medium">{result.percentage?.toFixed(1)}%</div>
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
                      className="inline-flex items-center gap-1 text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border border-blue-500/30 px-3 py-1.5 rounded transition-colors font-semibold"
                    >
                      Inspect Details
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
