"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, Check, X, Clock, RefreshCw, Copy, CheckCheck, 
  QrCode, Users, ShieldAlert, Sparkles, AlertCircle, ArrowUpRight, Search, FileSpreadsheet,
  Plus, Tag, Trash2, Edit2
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
    monthlyFee: 199.0
  });

  const [paymentForm, setPaymentForm] = useState({
    upiId: "9830507435@upi",
    payeeName: "Arghyadeep Roy",
    monthlyFee: 199.0
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

  const PRESET_FEATURES = [
    { feature: "Chemistry Exam Tests", placeholder: "e.g. Unlimited (or 'Selected tests are free')" },
    { feature: "AI Tutor & Doubt Solver", placeholder: "e.g. Unlimited AI Access (or '5 queries / day')" },
    { feature: "Answer Explanations", placeholder: "e.g. Full Solutions & 3D Models (or 'Standard Answer Key')" },
    { feature: "Study Materials", placeholder: "e.g. Complete Digital Library (or 'Selected Free Chapters')" },
    { feature: "Ranking & Analytics", placeholder: "e.g. Proctored National Percentile (or 'Basic Score Summary')" },
    { feature: "Supported Devices", placeholder: "e.g. Mobile, Tablet, PC / Laptop (Max 2 devices)" },
  ];

  const [plans, setPlans] = useState<any[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState<{
    id: string;
    name: string;
    description: string;
    price: number;
    durationDays: number;
    benefitsList: { feature: string; value: string; isCustom?: boolean }[];
    isActive: boolean;
  }>({
    id: "",
    name: "",
    description: "",
    price: 99.0,
    durationDays: 30,
    benefitsList: PRESET_FEATURES.map(f => ({ feature: f.feature, value: "", isCustom: false })),
    isActive: true
  });
  const [planSaving, setPlanSaving] = useState(false);

  const handleOpenAddPlan = () => {
    setPlanForm({
      id: "",
      name: "",
      description: "",
      price: 299,
      durationDays: 30,
      benefitsList: PRESET_FEATURES.map(f => ({ feature: f.feature, value: "", isCustom: false })),
      isActive: true
    });
    setShowPlanModal(true);
  };

  const handleOpenEditPlan = (plan: any) => {
    const rawBenefits: string[] = Array.isArray(plan.benefits) ? plan.benefits : [];
    const list: { feature: string; value: string; isCustom?: boolean }[] = [];

    rawBenefits.forEach((b: string) => {
      const parts = b.split(":");
      if (parts.length > 1) {
        const feature = parts[0].trim();
        const value = parts.slice(1).join(":").trim();
        const isPreset = PRESET_FEATURES.some(pf => pf.feature.toLowerCase() === feature.toLowerCase());
        list.push({ feature, value, isCustom: !isPreset });
      } else {
        list.push({ feature: b.trim(), value: "", isCustom: true });
      }
    });

    // Ensure all standard preset features are pre-added if not already present
    PRESET_FEATURES.forEach(pf => {
      if (!list.some(item => item.feature.toLowerCase() === pf.feature.toLowerCase())) {
        list.push({ feature: pf.feature, value: "", isCustom: false });
      }
    });

    setPlanForm({
      id: plan.id,
      name: plan.name,
      description: plan.description || "",
      price: Number(plan.price) || 0,
      durationDays: Number(plan.durationDays) || 30,
      benefitsList: list,
      isActive: plan.isActive !== undefined ? !!plan.isActive : true
    });
    setShowPlanModal(true);
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin/subscription-plans");
      const data = await res.json();
      if (res.ok) setPlans(data);
    } catch (err) {
      console.error(err);
    }
  };

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
          monthlyFee: data.paymentSettings.monthlyFee || 199.0
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
    fetchPlans();
  }, []);

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const url = planForm.id ? `/api/admin/subscription-plans/${planForm.id}` : "/api/admin/subscription-plans";
      const method = planForm.id ? "PUT" : "POST";

      const formattedBenefits = planForm.benefitsList
        .filter(item => item.feature.trim() && item.value.trim())
        .map(item => `${item.feature.trim()}: ${item.value.trim()}`);

      if (formattedBenefits.length === 0) {
        throw new Error("Please enter descriptions/benefits for at least one feature.");
      }

      const body = {
        name: planForm.name,
        description: planForm.description,
        price: planForm.price,
        durationDays: planForm.durationDays,
        benefits: formattedBenefits,
        isActive: planForm.isActive
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save plan");
      
      setSuccessMsg("Plan saved successfully!");
      setShowPlanModal(false);
      fetchPlans();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setPlanSaving(false);
    }
  };

  const handleResetDefaultPlans = async () => {
    if (!confirm("This will reset your plans to the 2 default plans (Basic and PIECHEM Pro). Continue?")) return;
    setPlanSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/subscription-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed_defaults" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset plans");
      if (Array.isArray(data)) setPlans(data);
      setSuccessMsg("Reset to default plans (Basic & PIECHEM Pro) successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset plans");
    } finally {
      setPlanSaving(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      await fetch(`/api/admin/subscription-plans/${id}`, { method: "DELETE" });
      fetchPlans();
    } catch (err) {
      console.error(err);
    }
  };

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
              Manage student UPI payments, verify payer UPI ID, 30-day billing cycles, and live QR settings
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
          <div className="text-[11px] text-amber-200/70">Awaiting Admin Approval</div>
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
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">₹{paymentSettings.monthlyFee || 199}</div>
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
              <p className="text-xs text-slate-400">Review student UPI submissions, check student payer UPI ID, and grant 30-Day Pass</p>
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                      <div className="min-w-0">
                        <div className="font-black text-white text-base flex items-center gap-2">
                          <span className="truncate">{studentName}</span>
                        </div>
                        <div className="text-xs text-amber-300 font-mono truncate">{studentEmail}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">Phone: {studentPhone}</div>
                      </div>
                      <span className="bg-amber-950 text-amber-300 border border-amber-500/60 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shrink-0 shadow">
                        PENDING APPROVAL
                      </span>
                    </div>

                    <div className="bg-slate-950/90 p-3.5 rounded-xl border border-amber-500/40 space-y-2 font-mono text-xs">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Amount Paid:</span>
                        <span className="font-extrabold text-green-400 text-sm">₹{req.amount || paymentSettings?.monthlyFee || 199}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 text-slate-300 pt-1 border-t border-slate-800">
                        <span className="text-amber-300 font-bold shrink-0">Student Payer UPI ID:</span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-black text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 tracking-wider truncate max-w-full">
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
                              className="p-1 text-slate-400 hover:text-white transition shrink-0"
                              title="Copy Student Payer UPI ID"
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
          <div>
            {/* Mobile / Tablet Cards View (lg:hidden) */}
            <div className="lg:hidden space-y-3">
              {filteredActiveStudents.map((st: any) => {
                const latestReq = st.upgradeRequests?.[0];
                const activeSince = st.subscriptionStartedAt || latestReq?.approvedAt || st.updatedAt;
                const expiresAt = st.subscriptionExpiresAt || null;
                const remaining = calculateRemainingDays(expiresAt);
                const isExpired = remaining === "EXPIRED";

                return (
                  <div 
                    key={st.id} 
                    className="bg-[#0b1017] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md"
                  >
                    {/* Header: Student Name + Status Badge */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                      <div className="min-w-0">
                        <div className="font-bold text-white text-sm truncate">{st.name || "Student"}</div>
                        <div className="text-xs text-slate-400 font-mono truncate">{st.email}</div>
                        {st.phone && <div className="text-[11px] text-slate-500 font-mono">Ph: {st.phone}</div>}
                      </div>
                      {expiresAt ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono shrink-0 ${
                          isExpired 
                            ? "bg-red-950/80 text-red-400 border-red-800" 
                            : "bg-cyan-950/80 text-cyan-300 border-cyan-600/60"
                        }`}>
                          {remaining}
                        </span>
                      ) : (
                        <span className="bg-blue-950/80 text-blue-300 border border-blue-600/60 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase font-mono shrink-0">
                          ♾️ NEVER
                        </span>
                      )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Payment / UTR</span>
                        {latestReq?.utrNumber ? (
                          <div className="mt-0.5">
                            <span className="font-mono font-bold text-cyan-300 text-[11px] bg-slate-950 px-1.5 py-0.5 rounded border border-cyan-900/60">
                              {latestReq.utrNumber}
                            </span>
                            <div className="text-[10px] text-cyan-400 font-mono font-semibold mt-0.5">
                              ₹{latestReq.amount || paymentSettings?.monthlyFee || 199}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-block mt-0.5 text-blue-300 font-bold text-[10px] uppercase">
                            💎 Complimentary
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Expires / Next Due</span>
                        <div className="mt-0.5 font-mono text-[11px] text-amber-300 font-bold">
                          {expiresAt ? formatDateTime24(expiresAt) : "Never"}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Active: {formatDateTime24(activeSince).split(' ')[0]}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => handleStudentDirectAction(st.id, "EXTEND")}
                        disabled={actionLoading === st.id}
                        className="flex-1 py-1.5 px-3 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 rounded-xl text-xs font-bold transition text-center disabled:opacity-50 touch-target"
                      >
                        +30 Days
                      </button>
                      <button
                        onClick={() => handleStudentDirectAction(st.id, "REVOKE")}
                        disabled={actionLoading === st.id}
                        className="flex-1 py-1.5 px-3 bg-red-950 hover:bg-red-900 text-red-400 border border-red-800/60 rounded-xl text-xs font-bold transition text-center disabled:opacity-50 touch-target"
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (hidden lg:block) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] text-slate-400 uppercase tracking-wider bg-slate-950/80 border-b border-slate-800 font-bold">
                  <tr>
                    <th className="px-4 py-3.5">Student Details</th>
                    <th className="px-4 py-3.5 text-cyan-300">Payer UPI ID</th>
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
                    const expiresAt = st.subscriptionExpiresAt || null;
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
                            <div>
                              <div className="inline-flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded border border-cyan-800 font-mono font-bold text-cyan-300 text-[11px] shadow-[0_0_10px_rgba(6,182,212,0.25)]">
                                <span>{latestReq.utrNumber}</span>
                              </div>
                              <div className="text-[11px] text-cyan-400 font-mono font-bold mt-1">
                                Paid: ₹{latestReq.amount || paymentSettings?.monthlyFee || 199}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-950 via-blue-900 to-black text-blue-300 border border-blue-500/60 px-2.5 py-0.5 rounded text-[11px] font-black tracking-wider uppercase shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                                💎 COMPLIMENTARY
                              </span>
                              <div className="text-[10px] text-blue-300/80 font-mono mt-1">
                                Paid: ₹0 (Complimentary)
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Active Since */}
                        <td className="px-4 py-3.5 font-mono text-cyan-300 font-bold whitespace-nowrap">
                          {formatDateTime24(activeSince)}
                        </td>

                        {/* Next Payment / Expiry Date */}
                        <td className="px-4 py-3.5 font-mono whitespace-nowrap">
                          {expiresAt ? (
                            <span className="text-amber-300 font-bold">{formatDateTime24(expiresAt)}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-blue-950/90 text-blue-300 border border-blue-500/60 px-2.5 py-0.5 rounded text-[11px] font-black tracking-wider uppercase shadow-sm">
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
                                : "bg-cyan-950/80 text-cyan-300 border-cyan-600/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                            }`}>
                              {remaining}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-blue-950/80 text-blue-300 border border-blue-600/60 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase font-mono shadow-sm">
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
          </div>
        )}
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
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`upi://pay?pa=${paymentForm.upiId || '9830507435@upi'}&pn=${encodeURIComponent(paymentForm.payeeName || 'Arghyadeep Roy')}&am=${paymentForm.monthlyFee || 199}&cu=INR&tn=PIECHEM%20Monthly%20Subscription`)}`}
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
      {/* SECTION 5: SUBSCRIPTION PLANS MANAGEMENT */}
      <section className="bg-[#12161f]/90 border border-slate-800 p-6 sm:p-7 rounded-3xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white">
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide">Subscription Plans</h2>
              <p className="text-xs text-slate-400">Manage pricing tiers (max 5 active plans) with auto-regenerating payment QR codes</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleResetDefaultPlans}
              disabled={planSaving}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              title="Reset to default Basic (₹0) and PIECHEM Pro (₹299) plans"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={handleOpenAddPlan}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-950/40"
            >
              <Plus className="w-4 h-4" /> Add Plan
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-700/60 scrollbar-track-slate-900/40">
          <div className="flex flex-row flex-nowrap items-stretch gap-6 min-w-max">
            {plans.map(plan => {
              const hasFee = Number(plan.price) > 0;
              const currentUpiId = paymentSettings?.upiId || "arg9830@axl";
              const currentPayee = paymentSettings?.payeeName || "Arghyadeep Roy";
              const upiUrl = hasFee 
                ? `upi://pay?pa=${currentUpiId}&pn=${encodeURIComponent(currentPayee)}&am=${plan.price}&cu=INR&tn=${encodeURIComponent(plan.name + " Plan Payment")}`
                : null;
              const qrImageUrl = upiUrl 
                ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`
                : null;

              return (
                <div 
                  key={plan.id} 
                  className={`w-[320px] sm:w-[360px] shrink-0 p-6 rounded-2xl border flex flex-col justify-between transition-all duration-200 ${
                    plan.isActive 
                      ? hasFee 
                        ? 'bg-gradient-to-b from-[#101927] to-[#0a101a] border-cyan-500/40 shadow-lg shadow-cyan-950/20' 
                        : 'bg-gradient-to-b from-[#131726] to-[#0a0d17] border-indigo-500/40 shadow-lg shadow-indigo-950/20'
                      : 'bg-slate-950 border-slate-800 opacity-60'
                  }`}
                >
                <div>
                  {/* Top Header: Badge + Actions */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full border ${
                        hasFee 
                          ? 'bg-rose-950/80 text-rose-300 border-rose-700/60' 
                          : 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60'
                      }`}>
                        {hasFee ? 'RECOMMENDED / PAID' : 'FREE TIER'}
                      </span>
                      {plan.isActive ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenEditPlan(plan)} 
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                        title="Edit Plan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePlan(plan.id)} 
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-red-400 hover:text-red-300 transition cursor-pointer"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="text-xl font-black text-white tracking-tight">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">{plan.description}</p>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-5 pb-4 border-b border-slate-800/80">
                    <span className="text-3xl font-black text-white font-mono">₹{plan.price}</span>
                    <span className="text-xs text-slate-400 font-medium">/ {plan.durationDays} days</span>
                  </div>

                  {/* Plan QR Code (If Applicable) */}
                  <div className="mb-5">
                    {hasFee && qrImageUrl ? (
                      <div className="p-4 rounded-xl bg-[#080d15] border border-cyan-500/20 flex flex-col sm:flex-row items-center gap-4">
                        <div className="p-2.5 bg-white rounded-xl shadow-md shrink-0 border border-slate-200">
                          <img 
                            src={qrImageUrl} 
                            alt={`${plan.name} Payment QR`} 
                            className="w-28 h-28 object-contain"
                          />
                        </div>
                        <div className="space-y-1.5 text-center sm:text-left">
                          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-white">
                            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Live Student QR for ₹{plan.price}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono break-all">VPA: {currentUpiId}</p>
                          <p className="text-[10px] text-slate-500">Scan with PhonePe, GPay, Paytm, BHIM</p>
                          <a
                            href={qrImageUrl}
                            download={`${plan.name}_QR_₹${plan.price}.png`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block text-[11px] text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer mt-1"
                          >
                            Download QR
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-[#0b0e17] border border-slate-800 text-center flex items-center justify-center gap-2 text-xs text-slate-400">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Free Plan — No payment QR code required</span>
                      </div>
                    )}
                  </div>

                  {/* Benefits List */}
                  <div className="space-y-2 mb-4">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Plan Benefits:</div>
                    {plan.benefits?.map((b: string, i: number) => {
                      const parts = b.split(":");
                      const hasColon = parts.length > 1;
                      const title = hasColon ? parts[0].trim() : null;
                      const value = hasColon ? parts.slice(1).join(":").trim() : b;

                      return (
                        <div key={i} className="text-xs text-slate-300 flex items-start justify-between gap-3 py-1 border-b border-slate-800/40">
                          {title ? (
                            <>
                              <span className="text-slate-400 font-medium">{title}</span>
                              <span className="font-bold text-white text-right flex items-center gap-1.5">
                                {hasFee && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                <span>{value}</span>
                              </span>
                            </>
                          ) : (
                            <div className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{b}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Duration: {plan.durationDays} Days</span>
                  <span>ID: {plan.id.slice(0, 8)}...</span>
                </div>
              </div>
            );
          })}
            {plans.length === 0 && (
              <div className="w-full py-12 text-center text-slate-500 text-sm border border-dashed border-slate-700 rounded-2xl space-y-3">
                <p>No subscription plans configured yet.</p>
                <button
                  onClick={handleResetDefaultPlans}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
                >
                  Generate Default Plans (Basic & PIECHEM Pro)
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ADD/EDIT PLAN MODAL */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#12161f] border border-slate-700/80 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-[#0d1117] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-950/80 rounded-xl border border-emerald-500/40 text-emerald-400">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">{planForm.id ? "Edit Subscription Plan" : "Add New Subscription Plan"}</h3>
                  <p className="text-[11px] text-slate-400">Pre-added features are ready below. Enter benefits & descriptions for each.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPlanModal(false)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSavePlan} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Plan Name & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Plan Name *</label>
                  <input 
                    required 
                    type="text" 
                    value={planForm.name} 
                    onChange={e => setPlanForm({...planForm, name: e.target.value})} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-cyan-500 outline-none" 
                    placeholder="e.g. PIECHEM Pro" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Tagline / Short Summary</label>
                  <input 
                    type="text" 
                    value={planForm.description} 
                    onChange={e => setPlanForm({...planForm, description: e.target.value})} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-cyan-500 outline-none" 
                    placeholder="e.g. Full access to exams, 3D models & proctored rankings" 
                  />
                </div>
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Price (₹) *</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    value={planForm.price} 
                    onChange={e => setPlanForm({...planForm, price: parseFloat(e.target.value) || 0})} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm font-mono text-emerald-400 font-bold focus:border-cyan-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Duration (Days) *</label>
                  <input 
                    required 
                    type="number" 
                    value={planForm.durationDays} 
                    onChange={e => setPlanForm({...planForm, durationDays: parseInt(e.target.value) || 30})} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm font-mono focus:border-cyan-500 outline-none" 
                  />
                </div>
              </div>

              {/* Dynamic Live QR Code Preview */}
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Live Dynamic QR Code Preview:</span>
                {planForm.price > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-xl shadow shrink-0">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${paymentSettings?.upiId || 'arg9830@axl'}&pn=${encodeURIComponent(paymentSettings?.payeeName || 'Arghyadeep Roy')}&am=${planForm.price}&cu=INR&tn=${encodeURIComponent((planForm.name || 'Subscription') + ' Plan Payment')}`)}`} 
                        alt="Dynamic QR preview" 
                        className="w-18 h-18 object-contain"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-emerald-400">QR for ₹{planForm.price} (Auto-updates with price)</div>
                      <div className="text-[11px] text-slate-400 font-mono">VPA: {paymentSettings?.upiId || 'arg9830@axl'}</div>
                      <div className="text-[10px] text-slate-500">QR automatically updates live whenever price is edited</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Free Tier (₹0) — No payment QR code needed.</p>
                )}
              </div>

              {/* PRE-ADDED FEATURES & BENEFITS LIST */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div>
                    <label className="block text-xs font-black text-white uppercase tracking-wider">
                      Pre-Added Features & Benefits
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Standard features are pre-added. Enter the description or benefit for each (e.g., &quot;Unlimited&quot;).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPlanForm(prev => {
                        const existing = [...prev.benefitsList];
                        PRESET_FEATURES.forEach(pf => {
                          if (!existing.some(item => item.feature.toLowerCase() === pf.feature.toLowerCase())) {
                            existing.push({ feature: pf.feature, value: "", isCustom: false });
                          }
                        });
                        return { ...prev, benefitsList: existing };
                      });
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer shrink-0"
                  >
                    + Restore All Standard Features
                  </button>
                </div>

                <div className="space-y-2.5">
                  {planForm.benefitsList.map((item, idx) => {
                    const preset = PRESET_FEATURES.find(pf => pf.feature.toLowerCase() === item.feature.toLowerCase());
                    const placeholder = preset ? preset.placeholder : "Enter benefit / description e.g. Included";

                    return (
                      <div 
                        key={idx} 
                        className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700/80 focus-within:border-cyan-500/60 transition space-y-2"
                      >
                        {/* Feature Title Row */}
                        <div className="flex items-center justify-between gap-3">
                          {item.isCustom ? (
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 shrink-0">
                                Custom Feature
                              </span>
                              <input
                                type="text"
                                value={item.feature}
                                onChange={e => {
                                  const updated = [...planForm.benefitsList];
                                  updated[idx].feature = e.target.value;
                                  setPlanForm({ ...planForm, benefitsList: updated });
                                }}
                                placeholder="Feature Name (e.g. Mentor Support)"
                                className="bg-transparent border-b border-slate-700 focus:border-cyan-400 text-xs font-bold text-white px-1 py-0.5 outline-none flex-1"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                              <span className="text-xs font-bold text-slate-100">
                                {item.feature}
                              </span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const updated = planForm.benefitsList.filter((_, i) => i !== idx);
                              setPlanForm({ ...planForm, benefitsList: updated });
                            }}
                            className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Remove feature"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Description / Benefit Input Field */}
                        <div>
                          <input
                            type="text"
                            value={item.value}
                            onChange={e => {
                              const updated = [...planForm.benefitsList];
                              updated[idx].value = e.target.value;
                              setPlanForm({ ...planForm, benefitsList: updated });
                            }}
                            placeholder={placeholder}
                            className="w-full bg-slate-950 border border-slate-700/90 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none font-medium"
                          />
                        </div>

                        {/* Quick Fill Preset Chips */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-[10px] text-slate-500 font-semibold">Quick fill:</span>
                          {["Unlimited", "Included", "Basic Access", "Full Solutions & 3D Models", "1 Active Device", "Max 2 devices"].map(chip => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => {
                                const updated = [...planForm.benefitsList];
                                updated[idx].value = chip;
                                setPlanForm({ ...planForm, benefitsList: updated });
                              }}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700/70 transition cursor-pointer"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Custom Feature Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPlanForm({
                          ...planForm,
                          benefitsList: [
                            ...planForm.benefitsList,
                            { feature: "", value: "", isCustom: true }
                          ]
                        });
                      }}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-cyan-400 hover:text-cyan-300 border border-dashed border-cyan-800/60 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Custom Feature</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2.5 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={planForm.isActive} 
                  onChange={e => setPlanForm({...planForm, isActive: e.target.checked})} 
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer" 
                />
                <label htmlFor="isActive" className="text-xs font-bold text-slate-200 cursor-pointer">
                  Active Plan (Visible to students on pricing and upgrade screens)
                </label>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={planSaving} 
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl disabled:opacity-50 transition shadow-lg shadow-emerald-950/40 cursor-pointer"
              >
                {planSaving ? "Saving Plan..." : "Save Plan"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
