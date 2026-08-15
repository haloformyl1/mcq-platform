"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminTests() {
  const [tests, setTests] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchTests = () => {
    fetch("/api/admin/tests")
      .then(async res => {
        const data = await res.json();

        if (!res.ok || !Array.isArray(data)) {
          throw new Error(data.error || "Failed to fetch tests");
        }

        return data;
      })
      .then(data => {
        setTests(data);
        setError(null);
      })
      .catch(error => setError(error.message));
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const createTest = async () => {
    const res = await fetch("/api/admin/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "New Test",
        durationMinutes: 30,
        totalQuestions: 50,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/admin/tests/${data.id}`);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Tests</h1>
        <button onClick={createTest} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
          Create New Test
        </button>
      </div>

      {error && <p className="mb-4 text-red-400">{error}</p>}

      <div className="bg-[#161616]/60 shadow rounded-lg overflow-hidden border border-[#333333] backdrop-blur-sm">
        <table className="min-w-full divide-y divide-[#333333]">
          <thead className="bg-[#1a1a1a]/80">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Questions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-[#333333]">
            {tests.length === 0 && !error ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-[#a6a6a6]">No tests have been created yet.</td>
              </tr>
            ) : tests.map(test => (
              <tr key={test.id} className="hover:bg-[#262626]/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{test.title}</div>
                  <div className="text-sm text-[#a6a6a6]">{test.durationMinutes} mins | {test.marksPerQuestion} marks/q</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    test.status === 'PUBLISHED' ? 'bg-green-900/30 text-green-400 border border-green-800' : 
                    test.status === 'LOCKED' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' :
                    test.status === 'EXPIRED' ? 'bg-red-900/30 text-red-400 border border-red-800' :
                    'bg-gray-800 text-gray-300 border border-gray-700'
                  }`}>
                    {test.status}
                  </span>
                  {test.status === 'LOCKED' && test.lockAt && (
                    <div className="text-[10px] text-[#8c8c8c] mt-1 space-y-0.5">
                      {test.unlockAt && <div><span className="text-blue-400">Unlock:</span> {new Date(test.unlockAt).toLocaleString()}</div>}
                      <div><span className="text-orange-400">Lock / Expire:</span> {new Date(test.lockAt).toLocaleString()}</div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#a6a6a6]">
                  {test._count.questions} / {test.totalQuestions}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link href={`/admin/tests/${test.id}`} className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
