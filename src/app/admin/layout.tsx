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
    { name: "Notifications", href: "/admin/notifications" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black flex flex-col font-sans text-white">
      <nav className="bg-[#161616]/40 border-b border-[#404040]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center space-x-3">
                <PiechemLogo size="sm" />
                <span className="border-l border-gray-700 pl-3 text-sm text-gray-300 font-medium tracking-wide">Admin Panel</span>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition ${
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
            <div className="flex items-center space-x-3">
              <button
                onClick={handleTestAsStudent}
                className="bg-amber-600/80 hover:bg-amber-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center space-x-1.5 shadow-sm border border-amber-500/30"
              >
                <span>🎓 Test as Student</span>
              </button>
              <button
                onClick={() => {
                  setModalError("");
                  setModalSuccess("");
                  setShowPasswordModal(true);
                }}
                className="text-[#a6a6a6] hover:bg-[#333333] hover:text-white p-2 rounded-md transition border border-transparent hover:border-[#404040]"
                title="Change Password & Credentials"
              >
                <KeyRound size={18} />
              </button>
              <button
                onClick={handleLogout}
                className="text-[#a6a6a6] hover:bg-[#333333] hover:text-white px-3 py-2 rounded-md text-sm font-medium transition"
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
    </div>
  );
}
