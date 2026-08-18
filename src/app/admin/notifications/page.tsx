"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle, XCircle, Clock, Check, X, ShieldAlert, Video, Eye, Mic } from "lucide-react";
import PiFiringLoader from "@/components/PiFiringLoader";

export default function AdminNotifications() {
  const [requests, setRequests] = useState<any[]>([]);
  const [warningLogs, setWarningLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchNotifications = () => {
    fetch("/api/admin/notifications")
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load notifications");
        return data;
      })
      .then(data => {
        setRequests(data.accessRequests || []);
        setWarningLogs(data.warningLogs || []);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleAction = async (requestId: string, action: "APPROVE" | "REJECT") => {
    setActionLoadingId(requestId);
    try {
      const res = await fetch("/api/admin/notifications/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchNotifications();
      } else {
        alert(data.error || "Action failed");
      }
    } catch (e) {
      alert("Error processing action");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) return <PiFiringLoader fullScreen={false} />;

  const pendingRequests = requests.filter(r => r.status === "PENDING");
  const processedRequests = requests.filter(r => r.status !== "PENDING");

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-[#333333] pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-950/60 border border-indigo-500/40 rounded-lg text-indigo-400">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notifications & Security Alerts</h1>
            <p className="text-sm text-[#a6a6a6]">Review student access requests and AI proctoring security violation video clips.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold bg-[#1a1a1a] px-3.5 py-1.5 rounded-full border border-[#333333]">
            Warnings Logged: <span className="text-red-400 font-bold ml-1">{warningLogs.length}</span>
          </div>
          <div className="text-sm font-semibold bg-[#1a1a1a] px-3.5 py-1.5 rounded-full border border-[#333333]">
            Pending Requests: <span className="text-amber-400 font-bold ml-1">{pendingRequests.length}</span>
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 bg-red-950/20 border border-red-800 p-4 rounded-lg">{error}</p>}

      {/* Security Violations & Video Clips Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <span>Proctoring Security Violations & Clips</span>
          {warningLogs.length > 0 && (
            <span className="bg-red-950/80 text-red-400 border border-red-800 text-xs px-2 py-0.5 rounded-full font-bold">
              {warningLogs.length}
            </span>
          )}
        </h2>

        {warningLogs.length === 0 ? (
          <div className="bg-[#161616]/60 p-6 text-center text-[#a6a6a6] rounded-xl border border-[#333333]">
            No security violation warnings reported.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warningLogs.map((log: any) => {
              const student = log.student;
              const studentName = student?.name || "N/A";
              const studentEmail = student?.email || "N/A";
              const studentId = student?.id || log.studentId;
              const isEyeSlip = log.warningType === "EYE_SLIP";

              return (
                <div key={log.id} className="bg-[#161616]/90 border border-red-500/30 p-5 rounded-xl flex flex-col justify-between gap-4 shadow-lg">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2 border-b border-[#2a2a2a] pb-3">
                      <div>
                        <div className="font-bold text-white text-base">{studentName}</div>
                        <div className="text-xs text-blue-400 font-mono">{studentEmail}</div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">ID: {studentId}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 ${
                        isEyeSlip 
                          ? "bg-amber-950/80 text-amber-400 border border-amber-800/60" 
                          : "bg-red-950/80 text-red-400 border border-red-800/60"
                      }`}>
                        {isEyeSlip ? <Eye className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        {isEyeSlip ? "EYE SLIP / FACE ABSENCE" : "VOICE / AUDIO NOISE"}
                      </span>
                    </div>

                    <p className="text-xs text-cyan-300 font-medium pt-1">
                      Test: <strong className="text-white">{log.test?.title || "Exam Session"}</strong>
                    </p>
                    {log.questionNumber && (
                      <div className="text-xs text-amber-300 bg-amber-950/30 border border-amber-800/40 p-2 rounded-md space-y-0.5">
                        <span className="font-bold text-amber-400">Solving Question #{log.questionNumber}:</span>
                        {log.questionText && <p className="text-[#ddd] italic line-clamp-2">{log.questionText}</p>}
                      </div>
                    )}
                    <p className="text-xs text-gray-300 bg-red-950/20 border border-red-900/40 p-2.5 rounded-lg">
                      ⚠️ {log.message}
                    </p>
                    
                    <div className="text-xs text-[#8c8c8c] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-red-400" />
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {log.mediaUrl ? (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-cyan-400" />
                          <span>1-Minute Incident Clip (30s Prior + 30s Event)</span>
                        </div>
                        <a 
                          href={log.mediaUrl} 
                          download={`warning_${log.id}.webm`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline text-[11px]"
                        >
                          Download Clip
                        </a>
                      </div>
                      <div className="rounded-lg overflow-hidden border border-[#333333] bg-black p-1">
                        <video
                          src={log.mediaUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full max-h-56 rounded object-contain bg-black"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 italic bg-[#111] p-3 rounded text-center border border-[#222]">
                      No video clip attached
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Pending Requests Section */}
      <section className="space-y-4 pt-4 border-t border-[#333333]">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Pending Access Requests</span>
          {pendingRequests.length > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
          )}
        </h2>

        {pendingRequests.length === 0 ? (
          <div className="bg-[#161616]/60 p-6 text-center text-[#a6a6a6] rounded-xl border border-[#333333]">
            No pending access requests at the moment.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req: any) => {
              const studentName = req.student?.name || req.student?.email.split('@')[0];
              return (
                <div key={req.id} className="bg-[#161616]/90 border border-amber-500/30 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{studentName}</span>
                      <span className="text-xs text-blue-400 font-mono">({req.student?.email})</span>
                    </div>
                    <p className="text-sm text-cyan-300 font-medium">
                      Requested live access for: <strong className="text-white">{req.test?.title}</strong>
                    </p>
                    <div className="text-xs text-[#8c8c8c] flex items-center gap-1.5 pt-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Submitted on {new Date(req.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleAction(req.id, "APPROVE")}
                      disabled={actionLoadingId === req.id}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow transition disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Approve & Grant Live Access
                    </button>
                    <button
                      onClick={() => handleAction(req.id, "REJECT")}
                      disabled={actionLoadingId === req.id}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#262626] hover:bg-red-900/40 text-red-400 border border-red-800/60 text-xs font-bold py-2.5 px-4 rounded-lg shadow transition disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Previously Processed Requests */}
      {processedRequests.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-[#333333]">
          <h2 className="text-lg font-bold text-white">Processed Requests History</h2>
          <div className="bg-[#161616]/60 border border-[#333333] rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-[#333333]">
              <thead className="bg-[#1a1a1a]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Test Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#a6a6a6] uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333333] bg-[#161616]/40">
                {processedRequests.map((req: any) => (
                  <tr key={req.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-white">{req.student?.name || req.student?.email}</div>
                      <div className="text-xs text-[#a6a6a6]">{req.student?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                      {req.test?.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                        req.status === 'APPROVED' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'
                      }`}>
                        {req.status === 'APPROVED' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-[#a6a6a6]">
                      {new Date(req.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

