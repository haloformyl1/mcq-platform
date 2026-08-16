"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle, XCircle, Clock, Check, X, ShieldAlert } from "lucide-react";
import PiFiringLoader from "@/components/PiFiringLoader";

export default function AdminNotifications() {
  const [requests, setRequests] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
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
        setRequests(Array.isArray(data.requests) ? data.requests : Array.isArray(data) ? data : []);
        setViolations(Array.isArray(data.violations) ? data.violations : []);
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
            <h1 className="text-2xl font-bold">Notifications & Access Requests</h1>
            <p className="text-sm text-[#a6a6a6]">Review student requests to unlock expired tests for their accounts.</p>
          </div>
        </div>
        <div className="text-sm font-semibold bg-[#1a1a1a] px-3.5 py-1.5 rounded-full border border-[#333333]">
          Pending Requests: <span className="text-amber-400 font-bold ml-1">{pendingRequests.length}</span>
        </div>
      </div>

      {error && <p className="text-red-400 bg-red-950/20 border border-red-800 p-4 rounded-lg">{error}</p>}

      {/* Pending Requests Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Pending Requests</span>
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
      {/* AI Proctoring Incidents Section */}
      <section className="space-y-4 pt-6 border-t border-[#333333]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
            <span>AI Proctoring Incidents & Photo Evidence</span>
            <span className="text-xs bg-red-950 text-red-400 px-2.5 py-0.5 rounded-full border border-red-800 font-mono font-bold">
              {violations.length} Violation{violations.length !== 1 ? 's' : ''} Logged
            </span>
          </h2>
        </div>

        {violations.length === 0 ? (
          <div className="bg-[#161616]/60 p-6 text-center text-[#a6a6a6] rounded-xl border border-[#333333]">
            No proctoring violations recorded yet. All exam sessions clean!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {violations.map((v: any) => {
              const studentName = v.student?.name || v.student?.email?.split('@')[0] || "Student";
              const isPhone = v.violationType === "CELL_PHONE_DETECTED";
              const isMultiPerson = v.violationType === "MULTIPLE_PERSONS_DETECTED";

              return (
                <div key={v.id} className="bg-[#161616]/90 border border-red-500/40 rounded-xl p-4 space-y-3 shadow-lg hover:border-red-500 transition">
                  <div className="flex justify-between items-start gap-2 border-b border-[#262626] pb-2">
                    <div>
                      <h3 className="font-bold text-white text-base">{studentName}</h3>
                      <p className="text-xs text-blue-400 font-mono">ID: {v.studentId}</p>
                      <p className="text-xs text-[#a6a6a6]">{v.student?.email}</p>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      isPhone ? 'bg-red-950 text-red-300 border-red-700' : isMultiPerson ? 'bg-orange-950 text-orange-300 border-orange-700' : 'bg-amber-950 text-amber-300 border-amber-700'
                    }`}>
                      {isPhone ? '📱 CELL PHONE' : isMultiPerson ? '👥 MULTI-PERSON' : '👁️ EYE SLIP'}
                    </span>
                  </div>

                  <p className="text-xs text-cyan-300 font-medium truncate">
                    Test: <strong className="text-white">{v.test?.title}</strong>
                  </p>

                  <p className="text-xs text-red-300 font-semibold bg-red-950/40 p-2 rounded border border-red-900/60">
                    Warning {v.warningNumber} of 3: {v.message}
                  </p>

                  {/* Snapshot Photo Preview */}
                  {v.snapshotBase64 ? (
                    <div className="relative group rounded-lg overflow-hidden border border-gray-700 bg-black cursor-pointer" onClick={() => setSelectedSnapshot(v.snapshotBase64)}>
                      <img src={v.snapshotBase64} alt="Violation Snapshot" className="w-full h-36 object-cover group-hover:opacity-80 transition" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition text-xs font-bold text-white">
                        🔍 Click to Enlarge Snapshot
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-[#777777] bg-[#111111] p-3 rounded text-center border border-[#222222]">
                      No image snapshot captured
                    </div>
                  )}

                  <div className="text-[11px] text-[#888888] flex items-center justify-between pt-1 border-t border-[#262626]">
                    <span>{new Date(v.createdAt).toLocaleString()}</span>
                    <span className="font-mono text-amber-400 font-bold">Attempt: {v.attemptId.slice(0, 8)}...</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Snapshot Enlarge Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4" onClick={() => setSelectedSnapshot(null)}>
          <div className="bg-[#161616] p-4 rounded-xl border border-red-500/60 max-w-3xl w-full space-y-3 relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-[#333333] pb-2">
              <h3 className="text-base font-bold text-red-400">📸 Violation Webcam Snapshot Evidence</h3>
              <button onClick={() => setSelectedSnapshot(null)} className="text-[#a6a6a6] hover:text-white text-sm font-bold">✕ Close</button>
            </div>
            <img src={selectedSnapshot} alt="Snapshot Evidence" className="w-full max-h-[70vh] object-contain rounded border border-gray-800 bg-black" />
          </div>
        </div>
      )}
    </div>
  );
}
