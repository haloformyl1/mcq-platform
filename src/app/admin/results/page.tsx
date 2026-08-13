"use client";
import { useState, useEffect } from "react";

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

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Test Results</h1>

      {error && <p className="mb-4 text-red-400">{error}</p>}

      <div className="bg-[#161616]/60 shadow rounded-lg overflow-hidden border border-[#333333] backdrop-blur-sm">
        <table className="min-w-full divide-y divide-[#333333]">
          <thead className="bg-[#1a1a1a]/80">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Test</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Status & Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-[#333333]">
            {results.length === 0 && !error ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-[#a6a6a6]">No test results are available yet.</td>
              </tr>
            ) : results.map((result: any) => (
              <tr key={result.id} className="hover:bg-[#262626]/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">Student</div>
                  <div className="text-sm text-[#a6a6a6]">{result.student?.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{result.test?.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                      <div className="text-xs text-[#a6a6a6]">{result.percentage?.toFixed(2)}%</div>
                    </div>
                  ) : (
                    <span className="text-sm text-[#a6a6a6]">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#a6a6a6]">
                  {new Date(result.startedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
