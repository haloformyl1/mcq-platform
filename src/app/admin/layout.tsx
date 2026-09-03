"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { KeyRound, Shield, X, Check, Lock } from "lucide-react";
import PiechemLogo from "@/components/PiechemLogo";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const [showProctoringModal, setShowProctoringModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ upiId: "9830507435@upi", payeeName: "Arghyadeep Roy", monthlyFee: 99.0 });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState("");
  const [subRequests, setSubRequests] = useState<any[]>([]);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [proctoringLoading, setProctoringLoading] = useState(false);
  const [proctoringSaving, setProctoringSaving] = useState(false);
  const [proctoringSuccess, setProctoringSuccess] = useState("");
  const [proctoringError, setProctoringError] = useState("");

  const [proctoringForm, setProctoringForm] = useState({
    enforceFullscreen: true,
    tabSwitchAction: "AUTO_SUBMIT"
  });

  const fetchPaymentSettings = async () => {
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/admin/payment-settings");
      const data = await res.json();
      if (res.ok && data.settings) {
        setPaymentForm({
          upiId: data.settings.upiId || "9830507435@upi",
          payeeName: data.settings.payeeName || "Arghyadeep Roy",
          monthlyFee: data.settings.monthlyFee || 99.0
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

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
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

  const navItems = [
    { name: "Dashboard", href: "/admin" },
    { name: "Tests", href: "/admin/tests" },
    { name: "Students", href: "/admin/students" },
    { name: "Results", href: "/admin/results" },
    { name: "Test Alerts", href: "/admin/test-alerts" },
    { name: "Notifications", href: "/admin/notifications" },
    { name: "Content Upload", href: "/admin/study-materials" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black flex flex-col font-sans text-white">
            <nav className="bg-[#0b1724]/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* Left Brand & Title */}
            <div className="flex items-center space-x-3 shrink-0">
              <PiechemLogo size="sm" />
              <span className="border-l border-slate-700/80 pl-2.5 text-xs sm:text-sm text-cyan-400 font-bold tracking-wide whitespace-nowrap">
                Admin Panel
              </span>
            </div>

            {/* Middle Nav Links with horizontal scroll container */}
            <div className="flex-1 flex items-center overflow-x-auto scrollbar-none py-1 mx-2">
              <div className="flex items-center space-x-1 whitespace-nowrap">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                      pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin")
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-sm"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Action Tools Bar */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={handleTestAsStudent}
                className="bg-amber-600/90 hover:bg-amber-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 border border-amber-500/40 shrink-0"
              >
                <span>🎓 Student View</span>
              </button>

              <button
                onClick={() => {
                  setShowPaymentModal(true);
                  fetchPaymentSettings();
                }}
                className="bg-emerald-600/90 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 border border-emerald-500/40 shrink-0"
              >
                <span>💰 Payment</span>
              </button>

              <button
                onClick={() => {
                  setShowProctoringModal(true);
                  fetchProctoringSettings();
                }}
                className="bg-red-950/80 hover:bg-red-900 text-red-300 hover:text-white p-1.5 rounded-lg transition border border-red-500/40 shrink-0"
                title="Security Protocols"
              >
                <Shield size={16} />
              </button>

              <button
                onClick={() => {
                  setModalError("");
                  setModalSuccess("");
                  setShowPasswordModal(true);
                }}
                className="text-slate-300 hover:bg-slate-800 hover:text-white p-1.5 rounded-lg transition border border-slate-700/60 shrink-0"
                title="Change Credentials"
              >
                <KeyRound size={16} />
              </button>

              <button
                onClick={handleLogout}
                className="text-red-400 hover:bg-red-950/60 hover:text-red-300 px-2 py-1 rounded-lg transition border border-red-900/40 shrink-0 text-xs font-bold"
                title="Logout"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <div className="w-full py-6 px-4 sm:px-6 lg:px-8 text-white">
          {children}
        </div>
      </main>

      {/* Security Credentials Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-[#404040] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#262626]"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2.5 bg-cyan-950/60 border border-cyan-500/30 rounded-xl text-cyan-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Security Settings</h3>
                <p className="text-xs text-gray-400">Update your Admin Password & Username</p>
              </div>
            </div>

            {modalError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/40 text-red-400 p-3 rounded-xl text-xs font-medium">
                {modalError}
              </div>
            )}

            {modalSuccess && (
              <div className="mb-4 bg-green-500/10 border border-green-500/40 text-green-400 p-3 rounded-xl text-xs font-medium flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">New Username (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave empty to keep current username"
                  className="w-full bg-[#262626] border border-[#404040] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter current admin password"
                  className="w-full bg-[#262626] border border-[#404040] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Enter new admin password"
                  className="w-full bg-[#262626] border border-[#404040] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-300 bg-[#262626] hover:bg-[#333333] rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition disabled:opacity-50"
                >
                  {modalLoading ? "Saving..." : "Update Security"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Security Protocols & Proctoring Rules Modal */}
      {showProctoringModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-red-500/50 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowProctoringModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#262626]"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 border-b border-[#333333] pb-4">
              <div className="p-2.5 bg-red-950/60 border border-red-500/40 rounded-xl text-red-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Security Protocols & Proctoring Rules</h3>
                <p className="text-xs text-gray-400">Configure global examination anti-cheating enforcement</p>
              </div>
            </div>

            {proctoringError && (
              <div className="bg-red-500/10 border border-red-500/40 text-red-400 p-3 rounded-xl text-xs font-medium">
                {proctoringError}
              </div>
            )}

            {proctoringSuccess && (
              <div className="bg-green-500/10 border border-green-500/40 text-green-400 p-3 rounded-xl text-xs font-medium flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>{proctoringSuccess}</span>
              </div>
            )}

            {proctoringLoading ? (
              <div className="py-12 text-center text-sm text-gray-400">Loading current security protocols...</div>
            ) : (
              <form onSubmit={handleSaveProctoringSettings} className="space-y-5">
                {/* 1. Fullscreen Protocol */}
                <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333333] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">1. Fullscreen Mode Protocol</h4>
                      <p className="text-xs text-[#888888]">Force browser fullscreen mode when student starts exam</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={proctoringForm.enforceFullscreen}
                        onChange={(e) => setProctoringForm({ ...proctoringForm, enforceFullscreen: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#333333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>

                {/* 2. Tab Switch / App Minimization Protocol */}
                <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333333] space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">2. Tab Switch / App Minimization Action</h4>
                    <p className="text-xs text-[#888888]">Specify action when student switches window or minimizes browser</p>
                  </div>

                  <select
                    value={proctoringForm.tabSwitchAction}
                    onChange={(e) => setProctoringForm({ ...proctoringForm, tabSwitchAction: e.target.value })}
                    className="w-full bg-[#262626] border border-[#404040] text-white rounded-lg p-2.5 text-xs focus:ring-red-500 font-medium"
                  >
                    <option value="AUTO_SUBMIT">🚨 Auto-Submit Exam Immediately (Default)</option>
                    <option value="WARNING">⚠️ Issue Warning (Count towards Max Warnings limit)</option>
                    <option value="ALLOW">🟢 Allow Tab Switching (No penalty)</option>
                  </select>
                </div>



                <div className="flex justify-end space-x-3 pt-2 border-t border-[#333333]">
                  <button
                    type="button"
                    onClick={() => setShowProctoringModal(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-300 bg-[#262626] hover:bg-[#333333] rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={proctoringSaving}
                    className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition disabled:opacity-50 shadow-lg"
                  >
                    {proctoringSaving ? "Saving Security Rules..." : "Save Security Protocols"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Admin UPI Payment & Subscription Control Window Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-emerald-500/50 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#262626]"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 border-b border-[#333333] pb-4">
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-400">
                💰
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">UPI Payment Settings & Subscriptions</h3>
                <p className="text-xs text-gray-400">Configure admin UPI VPA, subscription fee, and process student payments</p>
              </div>
            </div>

            {paymentSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 p-3 rounded-xl text-xs font-medium flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>{paymentSuccess}</span>
              </div>
            )}

            {paymentLoading ? (
              <div className="py-12 text-center text-sm text-gray-400">Loading payment configuration...</div>
            ) : (
              <div className="space-y-6">
                {/* Section 1: Live QR & VPA Config */}
                <form onSubmit={handleSavePaymentSettings} className="bg-[#1a1a1a] p-5 rounded-2xl border border-[#333333] space-y-4">
                  <h4 className="text-sm font-bold text-emerald-400 border-b border-[#333333] pb-2 flex items-center gap-2">
                    ⚡ Live UPI VPA & Dynamic QR Code Configuration
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Instant Regenerated QR Code Preview */}
                    <div className="bg-white p-3 rounded-xl text-center shadow-md">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${paymentForm.upiId || '9830507435@upi'}&pn=${encodeURIComponent(paymentForm.payeeName || 'Arghyadeep Roy')}&am=${paymentForm.monthlyFee || 99}&cu=INR&tn=PIECHEM%20Monthly%20Subscription`)}`}
                        alt="Instant Generated QR"
                        className="w-32 h-32 mx-auto"
                      />
                      <span className="text-[10px] text-gray-800 font-bold block mt-1">Live Student QR</span>
                    </div>

                    {/* VPA Inputs */}
                    <div className="md:col-span-2 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Admin UPI VPA (UPI ID) *</label>
                        <input
                          type="text"
                          required
                          value={paymentForm.upiId}
                          onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })}
                          placeholder="e.g. 9830507435@upi"
                          className="w-full bg-[#262626] border border-[#404040] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">Payee Name *</label>
                          <input
                            type="text"
                            required
                            value={paymentForm.payeeName}
                            onChange={(e) => setPaymentForm({ ...paymentForm, payeeName: e.target.value })}
                            className="w-full bg-[#262626] border border-[#404040] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">Monthly Fee (₹) *</label>
                          <input
                            type="number"
                            required
                            value={paymentForm.monthlyFee}
                            onChange={(e) => setPaymentForm({ ...paymentForm, monthlyFee: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-[#262626] border border-[#404040] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
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

                {/* Section 2: Student Payment UTR Verification Requests */}
                                {/* Layer 1 & 2: Quick UTR Lookup & Bulk Statement Importer Tools */}
                <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-cyan-500/40 space-y-4">
                  <h4 className="text-sm font-bold text-cyan-400 border-b border-[#333333] pb-2 flex items-center gap-2">
                    ⚡ Automated UTR Verification Tools (0% Gateway Fee)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Layer 1: Instant Single UTR Search */}
                    <div className="bg-[#262626] p-3.5 rounded-xl border border-[#404040] space-y-2">
                      <label className="block text-xs font-bold text-slate-300">1-Click UTR Verification Lookup</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Paste 12-digit UTR/RRN"
                          id="singleUtrInput"
                          className="flex-1 bg-[#1a1a1a] border border-[#404040] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
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

                    {/* Layer 2: Bulk Statement Importer */}
                    <div className="bg-[#262626] p-3.5 rounded-xl border border-[#404040] space-y-2">
                      <label className="block text-xs font-bold text-slate-300">Bulk Statement UTR Batch Auto-Approve</label>
                      <div className="flex gap-2">
                        <textarea
                          rows={1}
                          placeholder="Paste UPI statement lines / CSV"
                          id="bulkUtrTextarea"
                          className="flex-1 bg-[#1a1a1a] border border-[#404040] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const area = document.getElementById("bulkUtrTextarea") as HTMLTextAreaElement;
                            const text = area?.value;
                            if (!text) return alert("Please paste statement transaction lines");
                            // Extract 12-digit numbers
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
                          Batch Verify ({`CSV`})
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-[#333333] space-y-3">
                  <h4 className="text-sm font-bold text-amber-400 border-b border-[#333333] pb-2">
                    📋 Student Payment UTR Verification Queue ({subRequests.length})
                  </h4>

                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {subRequests.map((req) => (
                      <div key={req.id} className="bg-[#262626] p-3 rounded-xl border border-[#404040] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{req.student?.name || 'Student'}</span>
                            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                              {req.student?.email}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-400 mt-1 flex flex-wrap gap-3">
                            <span>UTR/Ref: <strong className="font-mono text-amber-300">{req.utrNumber || 'N/A'}</strong></span>
                            <span>Amount: <strong className="text-green-400 font-mono">₹{req.amount || 99}</strong></span>
                            <span>Status: <strong className={req.status === 'APPROVED' ? 'text-green-400' : req.status === 'REJECTED' ? 'text-red-400' : 'text-amber-400'}>{req.status}</strong></span>
                          </div>
                        </div>

                        {req.status === "PENDING" && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleProcessSubRequest(req.id, "APPROVE")}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white font-bold text-[11px] rounded-lg transition"
                            >
                              Approve (30 Days)
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
                      <p className="text-xs text-gray-500 text-center py-4">No student payment verification requests yet.</p>
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