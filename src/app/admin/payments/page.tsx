"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, Check, X, Clock, RefreshCw, Copy, CheckCheck, 
  QrCode, Users, ShieldAlert, Sparkles, AlertCircle, ArrowUpRight, Search, FileSpreadsheet
} from "lucide-react";

function formatDateTime24(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "-";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "-";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

function calculateRemainingDays(expiresAtInput: string | Date | null | undefined): string {
  if (!expiresAtInput) return "NEVER";
  const exp = new Date(expiresAtInput).getTime();
  const now = Date.now();
  const diffMs = exp - now;

  if (diffMs <= 0) return "EXPIRED";

  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  }
  return `${hours}h ${mins}m remaining`;
}

export default function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeStudents, setActiveStudents] = useState<any[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<any>({
    upiId: "9830507435@upi",
    payeeName: "Arghyadeep Roy",
    monthlyFee: 99.0
  });

  const [paymentForm, setPaymentForm] = useState({
    upiId: "9830507435@upi",
    payeeName: "Arghyadeep Roy",
    monthlyFee: 99.0
  });

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [singleUtrInput, setSingleUtrInput] = useState("");
  const [singleUtrLoading, setSingleUtrLoading] = useState(false);

  const [bulkUtrText, setBulkUtrText] = useState("");
  const [bulkUtrLoading, setBulkUtrLoading] = useState(false);

  const [filterActiveSearch, setFilterActiveSearch] = useState("");

  const fetchPaymentData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/subscriptions");
      if (!res.ok) throw new Error("Failed to fetch payment & subscription data");
      const data = await res.json();
      setRequests(data.requests || []);
      setActiveStudents(data.activeStudents || []);
      if (data.paymentSettings) {
        setPaymentSettings(data.paymentSettings);
        setPaymentForm({
          upiId: data.paymentSettings.upiId || "9830507435@upi",
          payeeName: data.paymentSettings.payeeName || "Arghyadeep Roy",
          monthlyFee: data.paymentSettings.monthlyFee || 99.0
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong fetching payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const handleSubscriptionAction = async (requestId: string, action: "APPROVE" | "REJECT") => {
    setActionLoading(requestId);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Subscription action failed");

      setSuccessMsg(data.message || (action === "APPROVE" ? "Subscription Approved for 30 Days!" : "Subscription Rejected."));
      fetchPaymentData();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process upgrade request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStudentDirectAction = async (studentId: string, action: "REVOKE" | "EXTEND") => {
    if (action === "REVOKE" && !confirm("Are you sure you want to revoke this student's subscription and reset them to FREE?")) {
      return;
    }
    setActionLoading(studentId);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      setSuccessMsg(data.message || (action === "EXTEND" ? "Subscription Extended by 30 Days!" : "Subscription Revoked."));
      fetchPaymentData();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process action");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSingleUtrVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleUtrInput.trim()) return alert("Please enter a 12-digit UTR Ref Number");
    setSingleUtrLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utrQuery: singleUtrInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "UTR verification failed");

      setSuccessMsg(data.message || "Payment verified and student subscription activated!");
      setSingleUtrInput("");
      fetchPaymentData();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to verify UTR");
    } finally {
      setSingleUtrLoading(false);
    }
  };

  const handleBulkUtrVerify = async () => {
    if (!bulkUtrText.trim()) return alert("Please paste bank statement lines or UTR list");
    const matches = bulkUtrText.match(/\b\d{12}\b/g) || [];
    if (matches.length === 0) return alert("No 12-digit UTR numbers detected in the input.");

    setBulkUtrLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchUtrList: matches })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Batch verification failed");

      setSuccessMsg(data.message || `Batch verified! ${data.approvedCount || 0} subscriptions updated.`);
      setBulkUtrText("");
      fetchPaymentData();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "Batch verification failed");
    } finally {
      setBulkUtrLoading(false);
    }
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update payment settings");

      setSuccessMsg("UPI Payment VPA & QR Settings updated! Students now see your new QR code & fee rate.");
      setPaymentSettings(data.settings);
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save settings");
    } finally {
      setPaymentSaving(false);
    }
  };

  const pendingRequests = requests.filter(r => r.status === "PENDING");

  const filteredActiveStudents = activeStudents.filter(s => {
    const q = filterActiveSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      (s.upgradeRequests?.[0]?.utrNumber && s.upgradeRequests[0].utrNumber.includes(q))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#333333] pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-400 shadow-[0_0_20px_rgba(16₹85₹29,0.25)]">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Payment & Subscription Hub</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Manage student UPI payments, UTR verification, 30-day billing cycles, and live QR settings
            </p>
          </div>
        </div>

        <button
          onClick={fetchPaymentData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl text-xs font-bold transition shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-[0_0_15px_rgba(16₹85₹29,0.2)] animate-fade-in">
          <CheckCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-950/80 border border-red-500/60 text-red-300 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Key Metrics Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-gradient-to-br from-amber-950/40 via-[#161208] to-black border border-amber-500/30 p-5 rounded-2xl space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-center text-amber-300 text-xs font-bold">
            <span>Pending Verifications</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{pendingRequests.length}</div>
          <div className="text-[11px] text-amber-200/70">Awaiting Admin UTR Approval</div>
        </div>

        {/* Metric 2 */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-[#0a1811] to-black border border-emerald-500/30 p-5 rounded-2xl space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-center text-emerald-300 text-xs font-bold">
            <span>Active Subscribers</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{activeStudents.length}</div>
          <div className="text-[11px] text-emerald-200/70">Students on 30-Day Premium Pass</div>
        </div>

        {/* Metric 3 */}
        <div className="bg-gradient-to-br from-cyan-950/40 via-[#0a151d] to-black border border-cyan-500/30 p-5 rounded-2xl space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-center text-cyan-300 text-xs font-bold">
            <span>Monthly Plan Fee</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">₹{paymentSettings.monthlyFee || 99}</div>
          <div className="text-[11px] text-cyan-200/70">Current Live Fee Rate</div>
        </div>

        {/* Metric 4 */}
        <div className="bg-gradient-to-br from-purple-950/40 via-[#130b1c] to-black border border-purple-500/30 p-5 rounded-2xl space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-center text-purple-300 text-xs font-bold">
            <span>Live UPI VPA</span>
            <QrCode className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-base font-black text-white font-mono truncate">{paymentSettings.upiId || '9830507435@upi'}</div>
          <div className="text-[11px] text-purple-200/70 truncate">{paymentSettings.payeeName || 'Arghyadeep Roy'}</div>
        </div>
      </div>

      {/* SECTION 1: PENDING SUBSCRIPTION UPGRADE REQUESTS (MOVED OUT OF NOTIFICATIONS) */}
      <section className="bg-[#12161f]/90 border border-amber-500/40 p-6 sm:p-7 rounded-3xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-950/90 rounded-xl border border-amber-500/40 text-amber-400">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                <span>Pending Payment Verification Queue</span>
                {pendingRequests.length > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full shadow">
                    {pendingRequests.length} PENDING
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Review student UPI submissions, match UTR reference numbers, and grant 30-Day Pass</p>
            </div>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="bg-slate-950/60 p-8 text-center text-slate-400 rounded-2xl border border-slate-800">
            <CheckCheck className="w-8 h-8 text-emerald-400/60 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">All caught up!</p>
            <p className="text-xs text-slate-500 mt-0.5">There are currently no pending student payment upgrade requests.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pendingRequests.map((req: any) => {
              const student = req.student;
              const studentName = student?.name || "N/A";
              const studentEmail = student?.email || "N/A";
              const studentPhone = student?.phone || "N/A";

              return (
                <div 
                  key={req.id} 
                  className="bg-gradient-to-b from-[#1c180e] via-[#141007] to-[#0a0803] border border-amber-500/50 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-[0_0_25px_rgba(245₹58₹1,0.15)] hover:border-amber-400 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-amber-500/20 pb-3">
                      <div>
                        <div className="font-black text-white text-base flex items-center gap-2">
                          <span>{studentName}</span>
                        </div>
                        <div className="text-xs text-amber-300 font-mono">{studentEmail}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">Phone: {studentPhone}</div>
                      </div>
                      <span className="bg-amber-950 text-amber-300 border border-amber-500/60 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shrink-0 shadow">
                        PENDING APPROVAL
                      </span>
                    </div>

                    <div className="bg-slate-950/90 p-3.5 rounded-xl border border-amber-500/40 space-y-2 font-mono text-xs">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Amount Paid:</span>
                        <span className="font-extrabold text-green-400 text-sm">₹{req.amount || 99}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800">
                        <span>Payment UTR / Ref:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 tracking-wider">
                            {req.utrNumber || "NOT PROVIDED"}
                          </span>
                          {req.utrNumber && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(req.utrNumber);
                                setCopiedUtr(req.utrNumber);
                                setTimeout(() => setCopiedUtr(null), 2000);
                              }}
                              className="p-1 text-slate-400 hover:text-white transition"
                              title="Copy UTR Ref Number"
                            >
                              {copiedUtr === req.utrNumber ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Submitted: <strong className="text-slate-300 font-mono">{formatDateTime24(req.createdAt)}</strong> (24-Hour Format)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-amber-500/20">
                    <button
                      onClick={() => handleSubscriptionAction(req.id, "REJECT")}
                      disabled={actionLoading === req.id}
                      className="flex-1 bg-[#222222] hover:bg-red-950/70 text-red-400 hover:text-red-300 border border-[#404040] hover:border-red-700/60 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleSubscriptionAction(req.id, "APPROVE")}
                      disabled={actionLoading === req.id}
                      className="flex-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-[0_0_20px_rgba(245₹58₹1,0.4)] cursor-pointer"
                    >
                      <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                      Approve (30 Days)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: ACTIVE PREMIUM SUBSCRIBERS (EXACT ACTIVE SINCE & EXPIRE AT 30 DAYS IN DD/MM/YYYY HH:mm:ss FORMAT) */}
      <section className="bg-[#12161f]/90 border border-emerald-500/40 p-6 sm:p-7 rounded-3xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-emerald-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950/90 rounded-xl border border-emerald-500/40 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                <span>Active Premium Subscribers</span>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-600/50 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {activeStudents.length} Active
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Exact timestamps: <strong>Active Since</strong> (approval date/time) and <strong>Next Payment / Expiry Date</strong> (exact 30 days in DD/MM/YYYY HH:mm:ss format)
              </p>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={filterActiveSearch}
                onChange={(e) => setFilterActiveSearch(e.target.value)}
                placeholder="Search active subscribers..."
                className="w-full bg-[#18202c] border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>
        </div>

        {filteredActiveStudents.length === 0 ? (
          <div className="bg-slate-950/60 p-8 text-center text-slate-400 rounded-2xl border border-slate-800">
            <p className="text-xs">No active subscribers found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 uppercase tracking-wider bg-slate-950/80 border-b border-slate-800 font-bold">
                <tr>
                  <th className="px-4 py-3.5">Student Details</th>
                  <th className="px-4 py-3.5">UTR Reference</th>
                  <th className="px-4 py-3.5 text-emerald-400">Active Since (DD/MM/YYYY HH:MM:SS)</th>
                  <th className="px-4 py-3.5 text-amber-400">Next Payment / Expiry Date (DD/MM/YYYY HH:MM:SS)</th>
                  <th className="px-4 py-3.5">Time Remaining</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredActiveStudents.map((st: any) => {
                  const latestReq = st.upgradeRequests?.[0];
                  // If subscriptionStartedAt is null, fallback to approvedAt or createdAt
                  const activeSince = st.subscriptionStartedAt || latestReq?.approvedAt || st.updatedAt;
                  // If subscriptionExpiresAt is null, compute exactly 30 days from activeSince
                  const expiresAt = st.subscriptionExpiresAt || (activeSince ? new Date(new Date(activeSince).getTime() + 30 * 24 * 60 * 60 * 1000) : null);
                  const remaining = calculateRemainingDays(expiresAt);
                  const isExpired = remaining === "EXPIRED";

                  return (
                    <tr key={st.id} className="hover:bg-slate-900/50 transition">
                      {/* Student Info */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-sm">{st.name || "Student"}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{st.email}</div>
                        {st.phone && <div className="text-[10px] text-slate-500 font-mono">Ph: {st.phone}</div>}
                      </td>

                      {/* UTR Info */}
                      <td className="px-4 py-3.5">
                        {latestReq?.utrNumber ? (
                          <div className="inline-flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 font-mono font-bold text-cyan-300 text-[11px]">
                            <span>{latestReq.utrNumber}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Admin Manual Upgrade</span>
                        )}
                        {latestReq?.amount && (
                          <div className="text-[10px] text-green-400 font-mono mt-0.5">Paid: ₹{latestReq.amount}</div>
                        )}
                      </td>

                      {/* Active Since */}
                      <td className="px-4 py-3.5 font-mono text-emerald-300 font-bold whitespace-nowrap">
                        {formatDateTime24(activeSince)}
                      </td>

                      {/* Next Payment / Expiry Date */}
                      <td className="px-4 py-3.5 font-mono whitespace-nowrap">
                        {expiresAt ? (
                          <span className="text-amber-300 font-bold">{formatDateTime24(expiresAt)}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-purple-950/90 text-purple-300 border border-purple-600/60 px-2.5 py-0.5 rounded text-[11px] font-black tracking-wider uppercase">
                            ♾️ NEVER
                          </span>
                        )}
                      </td>

                      {/* Time Remaining */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {expiresAt ? (
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border font-mono ${
                            isExpired 
                              ? "bg-red-950/80 text-red-400 border-red-800" 
                              : "bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
                          }`}>
                            {remaining}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase font-mono shadow-sm">
                            ♾️ NEVER
                          </span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStudentDirectAction(st.id, "EXTEND")}
                            disabled={actionLoading === st.id}
                            className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 rounded-lg text-[11px] font-bold transition disabled:opacity-50"
                            title="Extend 30 more days"
                          >
                            +30 Days
                          </button>
                          <button
                            onClick={() => handleStudentDirectAction(st.id, "REVOKE")}
                            disabled={actionLoading === st.id}
                            className="px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-400 border border-red-800/60 rounded-lg text-[11px] font-bold transition disabled:opacity-50"
                            title="Revoke subscription and reset to FREE"
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SECTION 3: AUTOMATED UTR VERIFICATION TOOLS (0% GATEWAY FEE) */}
      <section className="bg-[#12161f]/90 border border-cyan-500/40 p-6 sm:p-7 rounded-3xl shadow-xl space-y-5">
        <div className="flex items-center gap-3 border-b border-cyan-500/20 pb-4">
          <div className="p-2.5 bg-cyan-950/90 rounded-xl border border-cyan-500/40 text-cyan-300">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-wide">Automated UTR Verification Tools (0% Gateway Fee)</h2>
            <p className="text-xs text-slate-400">Instantly match single UTR numbers or paste complete UPI bank statement CSVs for batch auto-approvals</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tool 1: Instant Single UTR Lookup */}
          <div className="bg-[#161d28] p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-4 h-4" /> 1-Click Instant UTR Lookup
              </span>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800 font-bold">Fast</span>
            </div>
            <p className="text-xs text-slate-400">Paste student's 12-digit UTR/RRN number from your GPay/PhonePe history to immediately verify and grant 30 days access.</p>

            <form onSubmit={handleSingleUtrVerify} className="flex gap-2">
              <input
                type="text"
                value={singleUtrInput}
                onChange={(e) => setSingleUtrInput(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                placeholder="Paste 12-digit UTR (e.g. 467289946557)"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={singleUtrLoading}
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md disabled:opacity-50 shrink-0"
              >
                {singleUtrLoading ? "Verifying..." : "Verify & Grant"}
              </button>
            </form>
          </div>

          {/* Tool 2: Bulk Statement Batch Importer */}
          <div className="bg-[#161d28] p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4" /> Bulk Statement UTR Auto-Approve
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-bold">Batch</span>
            </div>
            <p className="text-xs text-slate-400">Copy transaction lines or CSV export from PhonePe/GPay statement. Auto-extracts all 12-digit UTRs and activates matching students.</p>

            <div className="flex gap-2">
              <textarea
                rows={2}
                value={bulkUtrText}
                onChange={(e) => setBulkUtrText(e.target.value)}
                placeholder="Paste transaction lines or statement text containing 12-digit UTRs..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={handleBulkUtrVerify}
                disabled={bulkUtrLoading}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md disabled:opacity-50 shrink-0"
              >
                {bulkUtrLoading ? "Matching..." : "Batch Verify"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: LIVE UPI VPA & DYNAMIC QR CODE CONFIGURATION */}
      <section className="bg-[#12161f]/90 border border-slate-800 p-6 sm:p-7 rounded-3xl shadow-xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-wide">Live UPI VPA & Dynamic QR Code Configuration</h2>
            <p className="text-xs text-slate-400">Changes here immediately regenerate student payment QR codes and update monthly fees across all student accounts</p>
          </div>
        </div>

        <form onSubmit={handleSavePaymentSettings} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Live QR Code Preview */}
          <div className="bg-white p-4 rounded-2xl text-center shadow-2xl flex flex-col items-center justify-center space-y-2">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`upi://pay?pa=${paymentForm.upiId || '9830507435@upi'}&pn=${encodeURIComponent(paymentForm.payeeName || 'Arghyadeep Roy')}&am=${paymentForm.monthlyFee || 99}&cu=INR&tn=PIECHEM%20Monthly%20Subscription`)}`}
              alt="Instant Generated QR"
              className="w-40 h-40 mx-auto"
            />
            <div className="text-xs font-black text-slate-900 font-mono tracking-wide">Live Student Payment QR</div>
            <div className="text-[10px] text-slate-600 font-mono">Scan with PhonePe, GPay, Paytm, BHIM</div>
          </div>

          {/* Configuration Form Inputs */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Admin UPI VPA (UPI ID) *
              </label>
              <input
                type="text"
                required
                value={paymentForm.upiId}
                onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })}
                placeholder="e.g. 9830507435@upi or yourname@axl"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Official Payee Name *
                </label>
                <input
                  type="text"
                  required
                  value={paymentForm.payeeName}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payeeName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Monthly Subscription Fee (₹) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={paymentForm.monthlyFee}
                  onChange={(e) => setPaymentForm({ ...paymentForm, monthlyFee: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono font-bold text-green-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={paymentSaving}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {paymentSaving ? "Updating QR Code & Settings..." : "Save Payment VPA & Update Student QR"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
