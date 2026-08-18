"use client";

import { useState, useEffect } from "react";
import { Bell, Check, X, Clock, RefreshCw } from "lucide-react";

export default function NotificationsPage() {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      setPendingRequests(data.pendingRequests || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (requestId: string, action: "APPROVE" | "REJECT") => {
    setActionLoading(requestId);
    try {
      const res = await fetch("/api/admin/notifications/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (err: any) {
      alert(err.message || "Failed to process request");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-[#333333] pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-950/60 border border-indigo-500/40 rounded-lg text-indigo-400">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notifications & Access Requests</h1>
            <p className="text-sm text-[#a6a6a6]">Review student access and account registration requests.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold bg-[#1a1a1a] px-3.5 py-1.5 rounded-full border border-[#333333]">
            Pending Requests: <span className="text-amber-400 font-bold ml-1">{pendingRequests.length}</span>
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 bg-red-950/20 border border-red-800 p-4 rounded-lg">{error}</p>}

      {/* Pending Requests Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Pending Access Requests</span>
          {pendingRequests.length > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
          )}
        </h2>

        {pendingRequests.length === 0 ? (
          <div className="bg-[#161616]/60 p-6 text-center text-[#a6a6a6] rounded-xl border border-[#333333]">
            No pending access requests.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req: any) => {
              const student = req.student;
              const studentName = student?.name || "N/A";
              const studentEmail = student?.email || "N/A";
              const studentPhone = student?.phone || "N/A";
              const testTitle = req.test?.title || "General Platform Access";

              return (
                <div key={req.id} className="bg-[#161616]/90 border border-[#333333] p-5 rounded-xl flex flex-col justify-between gap-4 shadow-lg hover:border-cyan-500/40 transition">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2 border-b border-[#2a2a2a] pb-3">
                      <div>
                        <div className="font-bold text-white text-base">{studentName}</div>
                        <div className="text-xs text-blue-400 font-mono">{studentEmail}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">Phone: {studentPhone}</div>
                      </div>
                      <span className="bg-amber-950/80 text-amber-400 border border-amber-800/60 px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
                        {req.requestType || "ACCESS_REQUEST"}
                      </span>
                    </div>

                    <p className="text-xs text-cyan-300 font-medium pt-1">
                      Requesting Access To: <strong className="text-white">{testTitle}</strong>
                    </p>

                    {req.reason && (
                      <p className="text-xs text-gray-300 bg-[#222222] p-2.5 rounded-lg border border-[#333333]">
                        "{req.reason}"
                      </p>
                    )}

                    <div className="text-xs text-[#8c8c8c] flex items-center gap-1.5 pt-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{new Date(req.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-[#262626]">
                    <button
                      onClick={() => handleAction(req.id, "REJECT")}
                      disabled={actionLoading === req.id}
                      className="flex-1 bg-[#262626] hover:bg-red-950/60 text-red-400 hover:border-red-800 border border-[#404040] py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(req.id, "APPROVE")}
                      disabled={actionLoading === req.id}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md"
                    >
                      <Check className="w-4 h-4" />
                      Approve Access
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
