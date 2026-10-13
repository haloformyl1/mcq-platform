"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Shield, X, Check, QrCode } from "lucide-react";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";
import AdminCommandPalette from "./components/AdminCommandPalette";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Navigation & Shell State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Security Credentials Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // Proctoring Modal State
  const [showProctoringModal, setShowProctoringModal] = useState(false);
  const [proctoringLoading, setProctoringLoading] = useState(false);
  const [proctoringSaving, setProctoringSaving] = useState(false);
  const [proctoringSuccess, setProctoringSuccess] = useState("");
  const [proctoringError, setProctoringError] = useState("");
  const [proctoringForm, setProctoringForm] = useState({
    enforceFullscreen: true,
    tabSwitchAction: "AUTO_SUBMIT"
  });

  // Payment Settings & UPI Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ upiId: "9830507435@upi", payeeName: "Arghyadeep Roy", monthlyFee: 199.0 });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState("");
  const [subRequests, setSubRequests] = useState<Array<{
    id: string;
    status?: string;
    student?: { name?: string; email?: string };
    utrNumber?: string;
    amount?: number;
  }>>([]);

  // Pending Payments Polling
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0);

  useEffect(() => {
    setPendingPaymentCount(0);
  }, []);

  const fetchPaymentSettings = async () => {
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/admin/payment-settings");
      const data = await res.json();
      if (res.ok && data.settings) {
        setPaymentForm({
          upiId: data.settings.upiId || "9830507435@upi",
          payeeName: data.settings.payeeName || "Arghyadeep Roy",
          monthlyFee: data.settings.monthlyFee || 199.0
        });
      }
      const subRes = await fetch("/api/admin/subscriptions");
      const subData = await subRes.json();
      if (subRes.ok && subData.requests) {
        setSubRequests(subData.requests);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentSaving(true);
    setPaymentSuccess("");
    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentForm)
      });
      if (res.ok) {
        setPaymentSuccess("UPI Payment VPA & Subscription Settings Updated!");
        setTimeout(() => setPaymentSuccess(""), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleProcessSubRequest = async (requestId: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action })
      });
      if (res.ok) {
        setSubRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: action === "APPROVE" ? "APPROVED" : "REJECTED" } : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProctoringSettings = async () => {
    setProctoringLoading(true);
    try {
      const res = await fetch("/api/admin/proctoring-settings");
      const data = await res.json();
      if (res.ok) {
        setProctoringForm({
          enforceFullscreen: data.enforceFullscreen ?? true,
          tabSwitchAction: data.tabSwitchAction ?? "AUTO_SUBMIT"
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProctoringLoading(false);
    }
  };

  const handleSaveProctoringSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setProctoringSaving(true);
    setProctoringSuccess("");
    setProctoringError("");
    try {
      const res = await fetch("/api/admin/proctoring-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proctoringForm)
      });
      const data = await res.json();
      if (res.ok) {
        setProctoringSuccess("Security protocols updated successfully!");
        setTimeout(() => setProctoringSuccess(""), 3000);
      } else {
        setProctoringError(data.error || "Failed to save settings");
      }
    } catch (err) {
      setProctoringError("Network error. Failed to save.");
    } finally {
      setProctoringSaving(false);
    }
  };

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("piechem_is_gold");
        localStorage.removeItem("piechem_gold_expires_at");
        localStorage.removeItem("piechem_is_complimentary");
        window.dispatchEvent(new Event("piechem_gold_status_changed"));
      } catch {}
    }
    document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const handleTestAsStudent = async () => {
    try {
      const res = await fetch("/api/admin/test-as-student", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        alert(data.error || "Failed to switch to test student mode.");
      }
    } catch (err) {
      console.error(err);
      alert("Error switching to student mode.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError("");
    setModalSuccess("");

    try {
      const res = await fetch("/api/admin/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          newUsername: newUsername ? newUsername.trim() : undefined,
        }),
      });
      const data = await res.json();
      setModalLoading(false);

      if (res.ok) {
        setModalSuccess("Security credentials updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setNewUsername("");
        setTimeout(() => setShowPasswordModal(false), 2000);
      } else {
        setModalError(data.error || "Failed to update credentials");
      }
    } catch (err) {
      setModalLoading(false);
      setModalError("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans antialiased selection:bg-red-900/60 selection:text-white">
      {/* Main Shell Container */}
      <div className="flex flex-1 min-h-screen">
        {/* Netflix-inspired Cinematic Sidebar */}
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          pendingPaymentCount={pendingPaymentCount}
          onOpenPasswordModal={() => setShowPasswordModal(true)}
          onOpenProctoringModal={() => {
            setShowProctoringModal(true);
            fetchProctoringSettings();
          }}
          onOpenPaymentModal={() => {
            setShowPaymentModal(true);
            fetchPaymentSettings();
          }}
          onTestAsStudent={handleTestAsStudent}
          onLogout={handleLogout}
        />

        {/* Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Sticky Header with Telemetry & Command Trigger */}
          <AdminHeader
            onOpenMobile={() => setMobileOpen(true)}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            pendingPaymentCount={pendingPaymentCount}
            onOpenPasswordModal={() => setShowPasswordModal(true)}
            onOpenProctoringModal={() => {
              setShowProctoringModal(true);
              fetchProctoringSettings();
            }}
            onTestAsStudent={handleTestAsStudent}
            onLogout={handleLogout}
          />

          {/* Main Dashboard / Page Workspace */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>

      {/* Command Palette (Ctrl+K) */}
      <AdminCommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenProctoringModal={() => {
          setShowProctoringModal(true);
          fetchProctoringSettings();
        }}
        onOpenPaymentModal={() => {
          setShowPaymentModal(true);
          fetchPaymentSettings();
        }}
        onOpenPasswordModal={() => setShowPasswordModal(true)}
        onTestAsStudent={handleTestAsStudent}
      />

      {/* Security Credentials & Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0e131f] border border-cyan-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-5">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/40 rounded-xl text-cyan-400">
                <KeyRound size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Security Credentials</h3>
                <p className="text-xs text-slate-400">Update administrator username and root access password</p>
              </div>
            </div>

            {modalError && (
              <div className="bg-red-950/80 border border-red-500/50 text-red-300 p-3 rounded-xl text-xs font-semibold">
                {modalError}
              </div>
            )}

            {modalSuccess && (
              <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Check size={16} />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Username (Optional)</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full bg-[#161c2b] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter existing password"
                  className="w-full bg-[#161c2b] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter secure new password"
                  className="w-full bg-[#161c2b] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition disabled:opacity-50 shadow-lg"
                >
                  {modalLoading ? "Saving Credentials..." : "Update Credentials"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Security Protocols & Proctoring Rules Modal */}
      {showProctoringModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0e131f] border border-red-500/50 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowProctoringModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-red-950/80 border border-red-500/40 rounded-xl text-red-400">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Security Protocols & Anti-Cheating Rules</h3>
                <p className="text-xs text-slate-400">Configure global examination proctoring and focus enforcement</p>
              </div>
            </div>

            {proctoringError && (
              <div className="bg-red-950/80 border border-red-500/50 text-red-300 p-3 rounded-xl text-xs font-semibold">
                {proctoringError}
              </div>
            )}

            {proctoringSuccess && (
              <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Check size={16} />
                <span>{proctoringSuccess}</span>
              </div>
            )}

            {proctoringLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">Loading current security protocols...</div>
            ) : (
              <form onSubmit={handleSaveProctoringSettings} className="space-y-4">
                {/* 1. Fullscreen Protocol */}
                <div className="bg-[#141a29] p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">1. Fullscreen Mode Protocol</h4>
                      <p className="text-[11px] text-slate-400">Force browser fullscreen mode when student starts exam</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={proctoringForm.enforceFullscreen}
                        onChange={(e) => setProctoringForm({ ...proctoringForm, enforceFullscreen: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E50914]"></div>
                    </label>
                  </div>
                </div>

                {/* 2. Tab Switch Action */}
                <div className="bg-[#141a29] p-4 rounded-xl border border-slate-800 space-y-2">
                  <div>
                    <h4 className="text-xs font-bold text-white">2. Tab Switch / Window Minimization Action</h4>
                    <p className="text-[11px] text-slate-400">Specify penalty action when student switches window or minimizes browser</p>
                  </div>
                  <select
                    value={proctoringForm.tabSwitchAction}
                    onChange={(e) => setProctoringForm({ ...proctoringForm, tabSwitchAction: e.target.value })}
                    className="w-full bg-[#1b2336] border border-slate-700 text-white rounded-xl p-2.5 text-xs focus:ring-red-500 font-medium"
                  >
                    <option value="AUTO_SUBMIT">🚨 Auto-Submit Exam Immediately (Default Strict)</option>
                    <option value="WARNING">⚠️ Issue Warning (Count towards Max Warnings limit)</option>
                    <option value="ALLOW">🟢 Allow Tab Switching (No penalty)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowProctoringModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={proctoringSaving}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#E50914] hover:bg-red-700 rounded-xl transition disabled:opacity-50 shadow-lg shadow-red-950/50"
                  >
                    {proctoringSaving ? "Saving Security Rules..." : "Save Security Protocols"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* UPI Payment Settings & Subscription Control Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0e131f] border border-emerald-500/50 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-400">
                <QrCode size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">UPI Payment Settings & Subscriptions</h3>
                <p className="text-xs text-slate-400">Configure admin UPI VPA, subscription fee, and process student payments</p>
              </div>
            </div>

            {paymentSuccess && (
              <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Check size={16} />
                <span>{paymentSuccess}</span>
              </div>
            )}

            {paymentLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">Loading payment configuration...</div>
            ) : (
              <div className="space-y-6">
                {/* Live QR & VPA Config */}
                <form onSubmit={handleSavePaymentSettings} className="bg-[#141a29] p-5 rounded-2xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-emerald-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                    ⚡ Live UPI VPA & Dynamic QR Code Configuration
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Instant Generated QR Code Preview */}
                    <div className="bg-white p-3 rounded-xl text-center shadow-md">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${paymentForm.upiId || '9830507435@upi'}&pn=${encodeURIComponent(paymentForm.payeeName || 'Arghyadeep Roy')}&am=${paymentForm.monthlyFee || 199}&cu=INR&tn=PIECHEM%20Monthly%20Subscription`)}`}
                        alt="Instant Generated QR"
                        className="w-32 h-32 mx-auto"
                      />
                      <span className="text-[10px] text-gray-800 font-bold block mt-1">Live Student QR</span>
                    </div>

                    {/* VPA Inputs */}
                    <div className="md:col-span-2 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Admin UPI VPA (UPI ID) *</label>
                        <input
                          type="text"
                          required
                          value={paymentForm.upiId}
                          onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })}
                          placeholder="e.g. 9830507435@upi"
                          className="w-full bg-[#1b2336] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Payee Name *</label>
                          <input
                            type="text"
                            required
                            value={paymentForm.payeeName}
                            onChange={(e) => setPaymentForm({ ...paymentForm, payeeName: e.target.value })}
                            className="w-full bg-[#1b2336] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Fee (₹) *</label>
                          <input
                            type="number"
                            required
                            value={paymentForm.monthlyFee}
                            onChange={(e) => setPaymentForm({ ...paymentForm, monthlyFee: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-[#1b2336] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={paymentSaving}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg disabled:opacity-50"
                      >
                        {paymentSaving ? "Saving..." : "Save Payment VPA & Update Student QR"}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Quick UTR Lookup & Bulk Statement Importer Tools */}
                <div className="bg-[#141a29] p-5 rounded-2xl border border-cyan-500/40 space-y-4">
                  <h4 className="text-xs font-bold text-cyan-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                    ⚡ Automated UTR Verification Tools (0% Gateway Fee)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#1b2336] p-3.5 rounded-xl border border-slate-700 space-y-2">
                      <label className="block text-xs font-bold text-slate-300">1-Click UTR Verification Lookup</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Paste 12-digit UTR/RRN"
                          id="singleUtrInput"
                          className="flex-1 bg-[#141a29] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const input = document.getElementById("singleUtrInput") as HTMLInputElement;
                            const val = input?.value?.trim();
                            if (!val) return alert("Please paste a 12-digit UTR Ref Number");
                            try {
                              const res = await fetch("/api/admin/subscriptions", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ utrQuery: val })
                              });
                              const data = await res.json();
                              alert(data.message || data.error);
                              if (res.ok) {
                                input.value = "";
                                fetchPaymentSettings();
                              }
                            } catch (e) {
                              alert("Network error verifying UTR");
                            }
                          }}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg transition shrink-0"
                        >
                          Verify & Grant
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#1b2336] p-3.5 rounded-xl border border-slate-700 space-y-2">
                      <label className="block text-xs font-bold text-slate-300">Bulk Statement UTR Batch Auto-Approve</label>
                      <div className="flex gap-2">
                        <textarea
                          rows={1}
                          placeholder="Paste UPI statement lines / CSV"
                          id="bulkUtrTextarea"
                          className="flex-1 bg-[#141a29] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const area = document.getElementById("bulkUtrTextarea") as HTMLTextAreaElement;
                            const text = area?.value;
                            if (!text) return alert("Please paste statement transaction lines");
                            const matches = text.match(/\b\d{12}\b/g) || [];
                            if (matches.length === 0) return alert("No 12-digit UTR numbers found in text");
                            try {
                              const res = await fetch("/api/admin/subscriptions", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ batchUtrList: matches })
                              });
                              const data = await res.json();
                              alert(data.message || data.error);
                              if (res.ok) {
                                area.value = "";
                                fetchPaymentSettings();
                              }
                            } catch (e) {
                              alert("Error executing batch verification");
                            }
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition shrink-0"
                        >
                          Batch Verify
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Queue Summary */}
                <div className="bg-[#141a29] p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-400 border-b border-slate-800 pb-2">
                    📋 Student Payment Verification Queue ({subRequests.length})
                  </h4>

                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {subRequests.map((req) => (
                      <div key={req.id} className="bg-[#1b2336] p-3 rounded-xl border border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{req.student?.name || 'Student'}</span>
                            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                              {req.student?.email}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap gap-3">
                            <span>UTR: <strong className="font-mono text-amber-300">{req.utrNumber || 'N/A'}</strong></span>
                            <span>Amount: <strong className="text-emerald-400 font-mono">₹{req.amount || 199}</strong></span>
                            <span>Status: <strong className={req.status === 'APPROVED' ? 'text-emerald-400' : req.status === 'REJECTED' ? 'text-red-400' : 'text-amber-400'}>{req.status}</strong></span>
                          </div>
                        </div>

                        {req.status === "PENDING" && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleProcessSubRequest(req.id, "APPROVE")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleProcessSubRequest(req.id, "REJECT")}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] rounded-lg transition"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {subRequests.length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-4">No student payment verification requests yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}