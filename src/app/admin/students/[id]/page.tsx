"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PiFiringLoader from "@/components/PiFiringLoader";

interface StudentDetails {
  student: {
    id: string;
    name: string | null;
    email: string;
    status: string;
    subscriptionStatus?: string;
    createdAt: string;
    lastLogin: string | null;
  };
  statistics: {
    totalAttempted: number;
    totalCompleted: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
  };
  history: {
    id: string;
    testName: string;
    testId: string;
    date: string;
    score: number | null;
    percentage: number | null;
    attemptNumber: number;
    status: string;
  }[];
}

function formatWhatsAppLastSeen(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "Never";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Never";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const diffDays = Math.round((today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today at ${timeStr}`;
  } else if (diffDays === 1) {
    return `Yesterday at ${timeStr}`;
  } else {
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    return `${dateStr} at ${timeStr}`;
  }
}

export default function AdminStudentDetails() {
  const [data, setData] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/students/${id}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (res.ok) {
        setData(await res.json());
      } else {
        router.push("/admin/students");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchStudent();
  }, [id]);

  const toggleStatus = async () => {
    if (!data) return;
    const newStatus = data.student.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/students/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchStudent();
        setConfirmSuspend(false);
      }
    } catch (err) {
      console.error("Failed to update status");
    }
  };

  const deleteStudent = async () => {
    if (deleteInput !== "DELETE") return;
    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        router.push("/admin/students");
      }
    } catch (err) {
      console.error("Failed to delete");
    }
  };

  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [overrideUnlock, setOverrideUnlock] = useState<string | null>(null);
  const [overrideLock, setOverrideLock] = useState<string | null>(null);
  const [savingOverride, setSavingOverride] = useState(false);
  const [overrideMessage, setOverrideMessage] = useState<string | null>(null);

  useEffect(() => {
    // fetch tests for override selection
    fetch('/api/admin/tests')
      .then(r => r.json())
      .then(d => setTests(d || []))
      .catch(() => setTests([]));
  }, []);

  const saveOverride = async () => {
    if (!selectedTestId) {
      setOverrideMessage('Please select a test to override');
      return;
    }
    // basic validation
    if (overrideUnlock && overrideLock) {
      const u = new Date(overrideUnlock);
      const l = new Date(overrideLock);
      if (isNaN(u.getTime()) || isNaN(l.getTime())) {
        setOverrideMessage('Invalid date(s) provided');
        return;
      }
      if (u >= l) {
        setOverrideMessage('Unlock time must be before Lock time');
        return;
      }
    }
    setSavingOverride(true);
    setOverrideMessage(null);
    try {
      const body: any = { testId: selectedTestId };
      if (overrideUnlock) body.unlockAt = new Date(overrideUnlock).toISOString();
      if (overrideLock) body.lockAt = new Date(overrideLock).toISOString();
      const url = `/api/admin/students/${id}/override`;
      console.log('Saving override', url, body);
      const headers: any = { 'Content-Type': 'application/json' };
      try {
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          headers['Authorization'] = 'Bearer dev-token';
        }
      } catch (e) {}
      const res = await fetch(url, {
        method: 'POST',
        headers,
        credentials: 'same-origin',
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => null);
      console.log('Override response', res.status, data);
      if (res.ok) {
        setOverrideMessage('Override saved');
        fetchStudent();
        setSelectedTestId(null);
        setOverrideLock(null);
        setOverrideUnlock(null);
      } else {
        const detail = data?.error || (data ? JSON.stringify(data) : res.statusText);
        console.error('Save override failed', res.status, detail);
        setOverrideMessage(`Error ${res.status}: ${detail}`);
      }
    } catch (err) {
      console.error('Failed to save override', err);
      setOverrideMessage(String(err instanceof Error ? err.message : 'Network error'));
    } finally {
      setSavingOverride(false);
    }
  };

  if (loading || !data) {
    return <PiFiringLoader fullScreen={true} />;
  }

  const { student, statistics, history } = data;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <Link href="/admin/students" className="text-blue-400 hover:underline mb-2 inline-block">
            &larr; Back to Students
          </Link>
          <h1 className="text-2xl font-bold text-gray-100">Student Details</h1>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setConfirmSuspend(true)}
            className={`px-4 py-2 rounded font-medium ${student.status === "ACTIVE" ? "bg-yellow-600 hover:bg-yellow-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}`}
          >
            {student.status === "ACTIVE" ? "Suspend Student" : "Unsuspend Student"}
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
          >
            Delete Student
          </button>
        </div>
      </div>

      {confirmSuspend && (
        <div className="bg-[#2A2A2A] p-6 rounded-xl border border-yellow-600/50">
          <h2 className="text-xl font-bold text-gray-100 mb-2">
            {student.status === "ACTIVE" ? "Suspend Student?" : "Restore Student Access?"}
          </h2>
          <p className="text-gray-300 mb-4">
            {student.status === "ACTIVE"
              ? "Suspending this student will prevent them from logging into the PIECHeM platform."
              : "This will allow the student to log in again."}
          </p>
          <div className="flex gap-4">
            <button onClick={() => setConfirmSuspend(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white">Cancel</button>
            <button onClick={toggleStatus} className={`px-4 py-2 rounded text-white ${student.status === "ACTIVE" ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"}`}>
              {student.status === "ACTIVE" ? "Confirm Suspend" : "Restore Access"}
            </button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="bg-[#2A2A2A] p-6 rounded-xl border border-red-600/50">
          <h2 className="text-xl font-bold text-red-500 mb-2 uppercase">PERMANENTLY DELETE STUDENT?</h2>
          <p className="text-gray-300 mb-4 font-bold">WARNING: This action will permanently delete the student's account and associated data from the database.</p>
          <p className="text-gray-400 mb-4">This includes student profile, login credentials, test attempts, responses, and results. This action cannot be undone.</p>
          <div className="mb-4">
            <label className="block text-gray-400 mb-1 text-sm">Type DELETE to confirm:</label>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              className="w-full md:w-64 bg-[#111] border border-[#444] text-gray-100 p-2 rounded"
              placeholder="DELETE"
            />
          </div>
          <div className="flex gap-4">
            <button onClick={() => { setConfirmDelete(false); setDeleteInput(""); }} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white">Cancel</button>
            <button 
              onClick={deleteStudent}
              disabled={deleteInput !== "DELETE"}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white"
            >
              Permanently Delete Student
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1A1A1A] p-6 rounded-xl border border-[#333]">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">Account Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Student ID</span> <span className="text-gray-300 font-mono">{student.id}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Name</span> <span className="text-gray-300">{student.name || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email</span> <span className="text-gray-300">{student.email}</span></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Subscription Plan</span>
              <select
                value={student.subscriptionStatus || "FREE"}
                onChange={async (e) => {
                  const newSub = e.target.value;
                  try {
                    const res = await fetch(`/api/admin/students/${id}/status`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ subscriptionStatus: newSub })
                    });
                    if (res.ok) fetchStudent();
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className={`text-xs font-bold px-2 py-1 rounded border outline-none cursor-pointer ${
                  student.subscriptionStatus === "PAID"
                    ? "bg-amber-950/90 text-amber-300 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                    : "bg-slate-900 text-slate-400 border-slate-700"
                }`}
              >
                <option value="FREE" className="bg-slate-900 text-slate-300">FREE</option>
                <option value="PAID" className="bg-amber-950 text-amber-300 font-bold">PAID (GOLD)</option>
              </select>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className={`px-2 rounded font-medium ${student.status === "ACTIVE" ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                {student.status}
              </span>
            </div>
            <div className="flex justify-between"><span className="text-gray-500">Registered</span> <span className="text-gray-300">{new Date(student.createdAt).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Last Seen</span> <span className="text-[#00e5ff] font-medium">{formatWhatsAppLastSeen(student.lastLogin)}</span></div>
          </div>
        </div>

        <div className="bg-[#1A1A1A] p-6 rounded-xl border border-[#333]">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">Examination Statistics</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Total Attempts</span> <span className="text-gray-300">{statistics.totalAttempted}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Completed Tests</span> <span className="text-gray-300">{statistics.totalCompleted}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Average Score</span> <span className="text-gray-300">{statistics?.averageScore != null ? Number(statistics.averageScore).toFixed(2) : "0.00"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Highest Score</span> <span className="text-gray-300">{statistics.highestScore}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Lowest Score</span> <span className="text-gray-300">{statistics.lowestScore}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-[#1A1A1A] p-6 rounded-xl border border-[#333]">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Per-student Test Override</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Select Test</label>
            <select value={selectedTestId ?? ''} onChange={(e) => setSelectedTestId(e.target.value || null)} className="w-full bg-[#111] border border-[#444] text-gray-100 p-2 rounded">
              <option value="">-- Choose Test --</option>
              {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Unlock At (student local)</label>
            <input type="datetime-local" value={overrideUnlock ?? ''} onChange={(e) => setOverrideUnlock(e.target.value)} className="w-full bg-[#111] border border-[#444] text-gray-100 p-2 rounded" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Lock At (student local)</label>
            <input type="datetime-local" value={overrideLock ?? ''} onChange={(e) => setOverrideLock(e.target.value)} className="w-full bg-[#111] border border-[#444] text-gray-100 p-2 rounded" />
          </div>
          <div className="flex items-end">
            <button onClick={saveOverride} disabled={savingOverride || !selectedTestId} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed">
              {savingOverride ? 'Saving...' : 'Save Override'}
            </button>
          </div>
          {overrideMessage && (
            <div className="mt-3 text-sm" role="status">
              <span className="text-gray-300">{overrideMessage}</span>
            </div>
          )}
        </div>
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Recent Test History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs text-gray-500 uppercase bg-[#222]">
              <tr>
                <th className="px-4 py-3">Test Name</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Attempt #</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {history.map((a) => (
                <tr key={a.id} className="border-b border-[#333] hover:bg-[#222]">
                  <td className="px-4 py-3 font-medium text-gray-300">{a.testName}</td>
                  <td className="px-4 py-3">{new Date(a.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${a.status === "SUBMITTED" ? "bg-green-900/30 text-green-400" : "bg-blue-900/30 text-blue-400"}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{a.attemptNumber}</td>
                  <td className="px-4 py-3">{a.score !== null ? a.score : "-"}</td>
                  <td className="px-4 py-3">{a.percentage != null ? `${Number(a.percentage).toFixed(1)}%` : "-"}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6">No test history.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
