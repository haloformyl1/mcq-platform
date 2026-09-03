"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDateTime24 } from "@/lib/subscription";
import { useRouter } from "next/navigation";
import PiFiringLoader from "@/components/PiFiringLoader";

function formatWhatsAppLastSeen(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "-";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "-";

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

interface Student {
  id: string;
  name: string | null;
  email: string;
  status: string;
  subscriptionStatus?: string;
  subscriptionStartedAt?: string | null;
  subscriptionExpiresAt?: string | null;
  hasActiveUpi?: boolean;
  createdAt: string;
  lastLogin: string | null;
  _count: {
    attempts: number;
  }
}

interface Stats {
  totalStudents: number;
  activeStudents: number;
  suspendedStudents: number;
}

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const router = useRouter();

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/students?search=${encodeURIComponent(search)}&status=${statusFilter}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      if (data.students) {
        setStudents(data.students);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, statusFilter]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Student Management</h1>
        <p className="text-gray-400">Monitor and manage all student accounts.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1A1A1A] p-6 rounded-xl border border-[#333]">
            <h3 className="text-gray-400 text-sm mb-1">TOTAL STUDENTS</h3>
            <p className="text-3xl font-bold text-gray-100">{stats.totalStudents}</p>
          </div>
          <div className="bg-[#1A1A1A] p-6 rounded-xl border border-[#333]">
            <h3 className="text-gray-400 text-sm mb-1">ACTIVE STUDENTS</h3>
            <p className="text-3xl font-bold text-green-400">{stats.activeStudents}</p>
          </div>
          <div className="bg-[#1A1A1A] p-6 rounded-xl border border-[#333]">
            <h3 className="text-gray-400 text-sm mb-1">SUSPENDED STUDENTS</h3>
            <p className="text-3xl font-bold text-red-400">{stats.suspendedStudents}</p>
          </div>
        </div>
      )}

      <div className="bg-[#1A1A1A] p-6 rounded-xl border border-[#333]">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by ID, Name, or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-[#222] border border-[#333] text-gray-100 p-2 rounded focus:outline-none focus:border-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#222] border border-[#333] text-gray-100 p-2 rounded focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        {loading ? (
          <PiFiringLoader fullScreen={false} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs text-gray-500 uppercase bg-[#222]">
                <tr>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Subscription</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3">Last Seen</th>
                  <th className="px-4 py-3">Tests</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-[#333] hover:bg-[#222]">
                    <td className="px-4 py-3 font-medium text-gray-300">{student.id.substring(0, 8)}...</td>
                    <td className="px-4 py-3 text-gray-300">{student.name || "-"}</td>
                    <td className="px-4 py-3">{student.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${student.status === "ACTIVE" ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {student.hasActiveUpi ? (
                        <div 
                          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-950 via-cyan-950 to-black px-2.5 py-1.5 rounded-lg border border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.35)] text-cyan-300 text-xs font-bold cursor-not-allowed select-none"
                          title={`Locked: Student has an active paid subscription validated by UPI UTR until ${formatDateTime24(student.subscriptionExpiresAt)}. Automatically reverts to FREE after expiry, after which admin can edit.`}
                        >
                          <span className="text-xs">🔒</span>
                          <span className="font-extrabold tracking-wide">PAID (UPI)</span>
                        </div>
                      ) : (
                        <select
                          value={student.subscriptionStatus === "COMPLIMENTARY" ? "COMPLIMENTARY" : "FREE"}
                          onChange={async (e) => {
                            const newSub = e.target.value;
                            try {
                              const res = await fetch(`/api/admin/students/${student.id}/status`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ subscriptionStatus: newSub })
                              });
                              const resData = await res.json();
                              if (res.ok) {
                                setStudents(prev => prev.map(s => s.id === student.id ? { ...s, subscriptionStatus: newSub, subscriptionExpiresAt: null, hasActiveUpi: false } : s));
                              } else {
                                alert(resData.error || "Failed to update subscription");
                              }
                            } catch (err) {
                              console.error("Failed to update subscription", err);
                            }
                          }}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer transition ${
                            student.subscriptionStatus === "COMPLIMENTARY"
                              ? "bg-gradient-to-r from-blue-950 via-blue-900 to-black text-blue-300 border-blue-500/60 shadow-[0_0_14px_rgba(59,130,246,0.35)]"
                              : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500"
                          }`}
                        >
                          <option value="FREE" className="bg-slate-900 text-slate-300">🔓 FREE</option>
                          <option value="COMPLIMENTARY" className="bg-blue-950 text-blue-300 font-bold">💎 COMPLIMENTARY</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-gray-200">{new Date(student.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-[#737373]">{new Date(student.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#00e5ff] font-medium text-xs">
                      {formatWhatsAppLastSeen(student.lastLogin)}
                    </td>
                    <td className="px-4 py-3">{student._count.attempts}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/students/${student.id}`} className="text-blue-400 hover:text-blue-300">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-6">No students found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
