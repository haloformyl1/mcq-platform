"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Lock,
  User,
  ShieldAlert,
} from "lucide-react";
import PiechemLogo from "@/components/PiechemLogo";

type PageMode = "LOGIN" | "RECOVERY_REQUEST" | "RECOVERY_OTP" | "RECOVERY_RESET";

export default function AdminLogin() {
  const router = useRouter();

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Flow navigation state
  const [mode, setMode] = useState<PageMode>("LOGIN");

  // Recovery state
  const [otp, setOtp] = useState("");
  const [recoveredUsername, setRecoveredUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status & timing
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Standard login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        router.push("/admin");
      } else {
        setError(data.error || "Invalid username or password");
      }
    } catch {
      setLoading(false);
      setError("Authentication failed. Please check connection.");
    }
  };

  // Step 1: Send OTP to admin recovery email
  const handleSendRecoveryCode = async () => {
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/admin/send-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setMode("RECOVERY_OTP");
        setCooldown(60);
        setSuccessMsg(data.message || "Verification code sent to authorized recovery email.");
      } else {
        setError(data.error || "Unable to send verification code. Please try again.");
      }
    } catch {
      setLoading(false);
      setError("Failed to reach server. Please try again.");
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/admin/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otp.trim() }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        const foundUser = data.username || "admin";
        setRecoveredUsername(foundUser);
        setNewUsername(foundUser);
        setMode("RECOVERY_RESET");
        setSuccessMsg("Code verified! You can now review your username and set a new password.");
      } else {
        setError(data.error || "Invalid verification code.");
      }
    } catch {
      setLoading(false);
      setError("Verification failed. Please try again.");
    }
  };

  // Step 3: Save new credentials and login
  const handleResetCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/admin/reset-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword,
          newUsername: newUsername.trim() || recoveredUsername,
        }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setSuccessMsg("Credentials updated! Accessing admin panel...");
        setTimeout(() => {
          router.push("/admin");
        }, 1200);
      } else {
        setError(data.error || "Failed to update credentials.");
      }
    } catch {
      setLoading(false);
      setError("Update failed. Please try again.");
    }
  };

  // Password validation requirements
  const reqLength = newPassword.length >= 8;
  const reqUpper = /[A-Z]/.test(newPassword);
  const reqLower = /[a-z]/.test(newPassword);
  const reqNumber = /[0-9]/.test(newPassword);
  const reqSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmitReset =
    reqLength && reqUpper && reqLower && reqNumber && reqSpecial && passwordsMatch;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black relative font-sans text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header with PIECHEM logo */}
      <header className="absolute top-0 left-0 w-full p-6 sm:p-8 flex items-center">
        <PiechemLogo size="lg" />
      </header>

      {/* Header Icon & Title */}
      <div className="sm:mx-auto sm:w-full sm:max-w-[450px] mt-10">
        <div className="flex justify-center mb-3">
          <div className="p-3 bg-cyan-950/60 border border-cyan-500/30 rounded-2xl text-cyan-400 shadow-lg">
            {mode === "LOGIN" && <ShieldCheck className="w-8 h-8" />}
            {mode === "RECOVERY_REQUEST" && <KeyRound className="w-8 h-8 text-cyan-400" />}
            {mode === "RECOVERY_OTP" && <Mail className="w-8 h-8 text-cyan-400" />}
            {mode === "RECOVERY_RESET" && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
          </div>
        </div>
        <h2 className="text-center text-[28px] sm:text-[32px] leading-tight font-bold tracking-tight text-white">
          {mode === "LOGIN" && "Admin Portal"}
          {mode === "RECOVERY_REQUEST" && "Credential Recovery"}
          {mode === "RECOVERY_OTP" && "Enter Verification Code"}
          {mode === "RECOVERY_RESET" && "Set New Credentials"}
        </h2>
        <p className="mt-2 text-center text-[#a6a6a6] text-[15px]">
          {mode === "LOGIN" && "Enter your admin credentials to access control panel"}
          {mode === "RECOVERY_REQUEST" && "Recover username or reset forgotten password"}
          {mode === "RECOVERY_OTP" && "Code sent to administrator recovery email"}
          {mode === "RECOVERY_RESET" && "Verification successful. Update your admin credentials."}
        </p>
      </div>

      {/* Main Container */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-[450px]">
        <div className="py-8 px-4 sm:px-10 bg-[#161616]/70 border border-[#333333] rounded-2xl backdrop-blur-md shadow-2xl">
          {/* Status Banners */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl text-sm font-medium">
              {successMsg}
            </div>
          )}

          {/* VIEW 1: STANDARD LOGIN */}
          {mode === "LOGIN" && (
            <form className="space-y-5" onSubmit={handleLogin}>
              {/* Username Input */}
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  placeholder=" "
                  className="peer w-full bg-[#1e293b]/50 text-white border border-[#404040] rounded-xl pt-6 pb-2 px-4 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition appearance-none text-[15px]"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <label
                  htmlFor="username"
                  className="absolute left-4 top-2 text-[12px] text-[#8c8c8c] transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[12px] cursor-text pointer-events-none"
                >
                  Username or Email
                </label>
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder=" "
                  className="peer w-full bg-[#1e293b]/50 text-white border border-[#404040] rounded-xl pt-6 pb-2 pl-4 pr-12 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition appearance-none text-[15px]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label
                  htmlFor="password"
                  className="absolute left-4 top-2 text-[12px] text-[#8c8c8c] transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[12px] cursor-text pointer-events-none"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-[#8c8c8c] hover:text-white transition focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-[15px] py-3.5 px-4 rounded-xl transition duration-200 shadow-lg disabled:opacity-70 mt-2"
                >
                  {loading ? "Authenticating..." : "Login to Admin Portal"}
                </button>
              </div>

              {/* Forgot Credentials Link */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setSuccessMsg("");
                    setMode("RECOVERY_REQUEST");
                  }}
                  className="text-[13px] text-cyan-400/90 hover:text-cyan-300 transition hover:underline focus:outline-none"
                >
                  Forgot Username or Password?
                </button>
              </div>
            </form>
          )}

          {/* VIEW 2: REQUEST RECOVERY CODE */}
          {mode === "RECOVERY_REQUEST" && (
            <div className="space-y-6">
              <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-xl p-4 text-[13px] text-cyan-200/90 leading-relaxed flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white mb-1">Administrative Security Notice</p>
                  <p>
                    A secure 6-digit verification code will be dispatched directly to the
                    administrator&apos;s authorized recovery email.
                  </p>
                  <p className="text-[#94a3b8] mt-1 text-[12px]">
                    To maintain strict privacy and safety, the email address is concealed from site visibility.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendRecoveryCode}
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-[15px] py-3.5 px-4 rounded-xl transition duration-200 shadow-lg disabled:opacity-70"
              >
                {loading ? "Sending Verification Code..." : "Send Verification Code"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setSuccessMsg("");
                    setMode("LOGIN");
                  }}
                  className="inline-flex items-center gap-1.5 text-[13px] text-[#8c8c8c] hover:text-white transition focus:outline-none"
                >
                  <ArrowLeft size={15} /> Back to Login
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: ENTER OTP CODE */}
          {mode === "RECOVERY_OTP" && (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-3 text-center text-xs sm:text-sm text-cyan-300">
                Please check the administrator&apos;s recovery inbox and enter the 6-digit code.
              </div>

              <div className="relative">
                <input
                  id="admin-recovery-otp"
                  type="text"
                  required
                  maxLength={6}
                  placeholder="••••••"
                  className="w-full bg-[#1e293b]/60 text-white border border-[#404040] rounded-xl py-3.5 px-4 text-center font-mono text-2xl tracking-[0.5em] focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-[15px] py-3.5 px-4 rounded-xl transition duration-200 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying Code..." : "Verify Code"}
              </button>

              <div className="flex justify-between items-center text-[13px] pt-1">
                <button
                  type="button"
                  onClick={handleSendRecoveryCode}
                  disabled={loading || cooldown > 0}
                  className="text-cyan-400 hover:underline disabled:text-[#8c8c8c] disabled:no-underline focus:outline-none"
                >
                  {cooldown > 0 ? `Resend Code in ${cooldown}s` : "Resend Code"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setSuccessMsg("");
                    setMode("LOGIN");
                  }}
                  className="text-[#8c8c8c] hover:text-white transition focus:outline-none"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}

          {/* VIEW 4: CREDENTIAL RESET & USERNAME RECOVERY */}
          {mode === "RECOVERY_RESET" && (
            <form className="space-y-5" onSubmit={handleResetCredentials}>
              {/* Recovered Username Display */}
              <div className="p-4 bg-cyan-950/40 border border-cyan-500/30 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-[#94a3b8] font-medium flex items-center gap-1.5">
                    <User size={15} className="text-cyan-400" />
                    Recovered Admin Username:
                  </span>
                  <span className="font-mono font-bold text-cyan-300 bg-cyan-900/60 px-2.5 py-0.5 rounded border border-cyan-500/30 text-sm">
                    {recoveredUsername}
                  </span>
                </div>
                <p className="text-[11px] text-[#8c8c8c]">
                  You can keep this username or update it below.
                </p>
              </div>

              {/* Username Input */}
              <div className="relative">
                <input
                  id="newUsername"
                  type="text"
                  required
                  placeholder=" "
                  className="peer w-full bg-[#1e293b]/50 text-white border border-[#404040] rounded-xl pt-6 pb-2 px-4 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition appearance-none text-[15px]"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
                <label
                  htmlFor="newUsername"
                  className="absolute left-4 top-2 text-[12px] text-[#8c8c8c] transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[12px] cursor-text pointer-events-none"
                >
                  Admin Username
                </label>
              </div>

              {/* New Password Input */}
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  placeholder=" "
                  className="peer w-full bg-[#1e293b]/50 text-white border border-[#404040] rounded-xl pt-6 pb-2 pl-4 pr-12 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition appearance-none text-[15px]"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <label
                  htmlFor="newPassword"
                  className="absolute left-4 top-2 text-[12px] text-[#8c8c8c] transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[12px] cursor-text pointer-events-none"
                >
                  New Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-4 text-[#8c8c8c] hover:text-white transition focus:outline-none"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  placeholder=" "
                  className="peer w-full bg-[#1e293b]/50 text-white border border-[#404040] rounded-xl pt-6 pb-2 px-4 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition appearance-none text-[15px]"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <label
                  htmlFor="confirmPassword"
                  className="absolute left-4 top-2 text-[12px] text-[#8c8c8c] transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[12px] cursor-text pointer-events-none"
                >
                  Confirm New Password
                </label>
              </div>

              {/* Security Policy Checklist */}
              <div className="bg-[#1e293b]/30 p-3.5 rounded-xl border border-[#333333] text-[12px] text-[#a6a6a6] space-y-1.5">
                <p className="font-semibold text-white flex items-center gap-1">
                  <Lock size={13} className="text-cyan-400" /> Password Security Requirements:
                </p>
                <ul className="space-y-1 pl-1">
                  <li className={`flex items-center gap-2 ${reqLength ? "text-emerald-400" : ""}`}>
                    <span>{reqLength ? "✓" : "○"}</span> At least 8 characters
                  </li>
                  <li className={`flex items-center gap-2 ${reqUpper ? "text-emerald-400" : ""}`}>
                    <span>{reqUpper ? "✓" : "○"}</span> One uppercase letter
                  </li>
                  <li className={`flex items-center gap-2 ${reqLower ? "text-emerald-400" : ""}`}>
                    <span>{reqLower ? "✓" : "○"}</span> One lowercase letter
                  </li>
                  <li className={`flex items-center gap-2 ${reqNumber ? "text-emerald-400" : ""}`}>
                    <span>{reqNumber ? "✓" : "○"}</span> One number
                  </li>
                  <li className={`flex items-center gap-2 ${reqSpecial ? "text-emerald-400" : ""}`}>
                    <span>{reqSpecial ? "✓" : "○"}</span> One special character
                  </li>
                  <li className={`flex items-center gap-2 ${passwordsMatch ? "text-emerald-400" : ""}`}>
                    <span>{passwordsMatch ? "✓" : "○"}</span> Passwords match
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading || !canSubmitReset}
                className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-[15px] py-3.5 px-4 rounded-xl transition duration-200 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {loading ? "Updating Credentials..." : "Save Credentials & Access Admin"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setSuccessMsg("");
                    setMode("LOGIN");
                  }}
                  className="text-[13px] text-[#8c8c8c] hover:text-white transition focus:outline-none"
                >
                  Cancel and Return to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
