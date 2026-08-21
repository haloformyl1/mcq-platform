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
  const [proctoringLoading, setProctoringLoading] = useState(false);
  const [proctoringSaving, setProctoringSaving] = useState(false);
  const [proctoringSuccess, setProctoringSuccess] = useState("");
  const [proctoringError, setProctoringError] = useState("");

  const [proctoringForm, setProctoringForm] = useState({
    enforceFullscreen: true,
    tabSwitchAction: "AUTO_SUBMIT"
  });

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
    { name: "Announcements", href: "/admin/announcements" },
    { name: "Notifications", href: "/admin/notifications" },
    { name: "Content Upload", href: "/admin/study-materials" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black flex flex-col font-sans text-white">
      <nav className="bg-[#161616]/40 border-b border-[#404040]">
        <div className="w-full px-3 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <div className="flex-shrink-0 flex items-center space-x-2 sm:space-x-3">
                <PiechemLogo size="sm" />
                <span className="border-l border-gray-700 pl-2 sm:pl-3 text-xs sm:text-sm text-gray-300 font-medium tracking-wide whitespace-nowrap">Admin Panel</span>
              </div>
              <div className="hidden md:block min-w-0">
                <div className="ml-2 lg:ml-6 flex items-baseline space-x-1 lg:space-x-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-2 lg:px-2.5 py-1.5 rounded-md text-xs lg:text-sm font-medium transition whitespace-nowrap ${
                        pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin")
                          ? "bg-[#262626] text-white"
                          : "text-[#a6a6a6] hover:bg-[#333333] hover:text-white"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-3 overflow-x-auto py-2">
              <button
                onClick={handleTestAsStudent}
                className="bg-amber-600/80 hover:bg-amber-600 text-white px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition flex items-center space-x-1 shadow-sm border border-amber-500/30 whitespace-nowrap shrink-0"
              >
                <span>🎓 Test as Student</span>
              </button>
              <button
                onClick={() => {
                  setShowProctoringModal(true);
                  fetchProctoringSettings();
                }}
                className="bg-red-950/60 hover:bg-red-900/80 text-red-400 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition flex items-center space-x-1.5 shadow-sm border border-red-500/40 whitespace-nowrap shrink-0"
                title="Security Protocols & Proctoring Rules"
              >
                <Shield size={15} />
                <span className="hidden sm:inline">Security Protocols</span>
                <span className="sm:hidden">Security</span>
              </button>
              <button
                onClick={() => {
                  setModalError("");
                  setModalSuccess("");
                  setShowPasswordModal(true);
                }}
                className="text-[#a6a6a6] hover:bg-[#333333] hover:text-white p-2 rounded-md transition border border-transparent hover:border-[#404040] shrink-0"
                title="Change Password & Credentials"
              >
                <KeyRound size={18} />
              </button>
              <button
                onClick={handleLogout}
                className="text-[#a6a6a6] hover:bg-[#333333] hover:text-white px-2.5 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition shrink-0"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 text-white">
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
    </div>
  );
}
