"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import PiechemLogo from "@/components/PiechemLogo";

type LoginState = 
  | "EMAIL_ENTRY"
  | "EXISTING_PASSWORD_LOGIN"
  | "EXISTING_ACCOUNT_OTP_SETUP"
  | "NEW_ACCOUNT_DETAILS"
  | "OTP_VERIFICATION"
  | "PASSWORD_CREATION"
  | "PASSWORD_RESET_OTP"
  | "PASSWORD_RESET_CREATION";

export default function StudentLogin() {
  const router = useRouter();

  const [step, setStep] = useState<LoginState>("EMAIL_ENTRY");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // For the validation checklist
  const reqLength = password.length >= 8;
  const reqUpper = /[A-Z]/.test(password);
  const reqLower = /[a-z]/.test(password);
  const reqNumber = /[0-9]/.test(password);
  const reqSpecial = /[^A-Za-z0-9]/.test(password);
  const allReqsMet = reqLength && reqUpper && reqLower && reqNumber && reqSpecial;

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && data.student && !data.error) {
          if (data.student.board && data.student.academicLevel) {
            router.replace("/dashboard");
          } else {
            router.replace("/onboarding");
          }
        }
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        router.push('/admin/login');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("piechem_student_email");
    if (savedEmail) setEmail(savedEmail);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccessMsg("");
    localStorage.setItem("piechem_student_email", email);

    try {
      const res = await fetch("/api/auth/student/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      if (data.accountStatus === "ACTIVE") {
        setStep("EXISTING_PASSWORD_LOGIN");
      } else if (data.accountStatus === "UNVERIFIED") {
        setStep("EXISTING_ACCOUNT_OTP_SETUP");
        if (data.name) setName(data.name);
      } else {
        setStep("NEW_ACCOUNT_DETAILS");
      }
    } catch (err: any) {
      setError(err.message || "Failed to identify account");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (isReset = false) => {
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/auth/student/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setResendCooldown(30);
      if (isReset) {
        setStep("PASSWORD_RESET_OTP");
      } else {
        setStep("OTP_VERIFICATION");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (data.isOnboarded) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError("Incorrect email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent, nextStep: LoginState) => {
    e.preventDefault();
    // In our flow, we don't have a separate verification endpoint to hit early, 
    // we actually just move to password creation and submit them together.
    // However, if we wanted to pre-verify we could, but our API is combined.
    // So we just move to the next screen where they type the password.
    setStep(nextStep);
  };

  const handleSetupAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allReqsMet) {
      setError("Your password does not meet the required security requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/student/setup-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp, name, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (data.isOnboarded) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(err.message || "Failed to setup account");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allReqsMet) {
      setError("Your password does not meet the required security requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/student/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSuccessMsg("Your password has been updated successfully.");
      setStep("EXISTING_PASSWORD_LOGIN");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ show }: { show: boolean }) => (
    <svg className="w-5 h-5 text-[#8c8c8c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {show ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      )}
      {show && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />}
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black relative font-sans text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header with PIECHEM logo */}
      <div className="absolute top-0 left-0 w-full z-20 text-center py-2.5 px-4 bg-gradient-to-r from-cyan-500/10 via-blue-500/20 to-purple-500/10 border-b border-cyan-500/20 backdrop-blur-md shadow-sm">
        <p className="text-xs sm:text-sm font-medium text-cyan-300 tracking-wide">
          Designed by <span className="font-semibold text-white">Arghyadeep Roy</span> <span className="text-cyan-400/80 mx-1.5">&bull;</span> <span className="text-slate-300">Contact: <a href="tel:9830507435" className="hover:underline font-mono text-cyan-300">9830507435</a></span>
        </p>
      </div>

      <header className="absolute top-10 left-0 w-full p-6 sm:p-8 flex items-center">
        <PiechemLogo size="lg" />
      </header>

      <div className="sm:mx-auto sm:w-full sm:max-w-[450px] mt-10">
        <div className="py-8 px-4 sm:px-10 w-full max-w-full">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md text-[14px]">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-md text-[14px]">
              {successMsg}
            </div>
          )}

          {step === "EMAIL_ENTRY" && (
            <div>
              <h2 className="text-[28px] sm:text-[32px] leading-tight font-bold tracking-tight text-white mb-2">Welcome to PIECHEM</h2>
              <p className="text-[#a6a6a6] text-[15px] mb-8">Enter your registered email address</p>
              
              <form onSubmit={handleIdentify} className="space-y-6">
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder=" "
                    className="peer w-full bg-[#161616]/80 text-white border border-[#404040] rounded-md pt-6 pb-2 px-4 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition appearance-none text-[16px]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <label 
                    htmlFor="email" 
                    className="absolute left-4 top-2 text-[12px] text-[#8c8c8c] transition-all peer-placeholder-shown:text-[16px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[12px] cursor-text pointer-events-none"
                  >
                    Enter email address
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0099ff] hover:bg-[#007acc] text-white font-semibold text-[16px] py-4 px-4 rounded-md transition duration-200 mt-2 disabled:opacity-70"
                >
                  {loading ? "Checking..." : "Continue"}
                </button>
              </form>
            </div>
          )}

          {step === "EXISTING_PASSWORD_LOGIN" && (
            <div>
              <h2 className="text-[28px] sm:text-[32px] leading-tight font-bold tracking-tight text-white mb-2">Welcome back!</h2>
              <p className="text-[#a6a6a6] text-[15px] mb-8 flex flex-col gap-1">
                <span>Email:</span>
                <span className="text-white bg-[#161616]/80 px-3 py-2 rounded border border-[#404040]">{email}</span>
              </p>
              
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="relative flex items-center">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder=" "
                    className="peer w-full bg-[#161616]/80 text-white border border-[#404040] rounded-md pt-6 pb-2 px-4 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition appearance-none text-[16px]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <label 
                    htmlFor="password" 
                    className="absolute left-4 top-2 text-[12px] text-[#8c8c8c] transition-all peer-placeholder-shown:text-[16px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[12px] cursor-text pointer-events-none"
                  >
                    Enter your password
                  </label>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 p-1 focus:outline-none">
                    <EyeIcon show={showPassword} />
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0099ff] hover:bg-[#007acc] text-white font-semibold text-[16px] py-4 px-4 rounded-md transition duration-200 mt-2 disabled:opacity-70"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>

                <div className="flex justify-between items-center text-[14px] mt-6">
                  <button type="button" onClick={() => handleSendOTP(true)} className="text-[#0099ff] hover:underline">
                    Forgot Password?
                  </button>
                  <button type="button" onClick={() => { setStep("EMAIL_ENTRY"); setPassword(""); }} className="text-[#8c8c8c] hover:text-white transition">
                    &larr; Use another email
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === "EXISTING_ACCOUNT_OTP_SETUP" && (
            <div>
              <h2 className="text-[28px] sm:text-[32px] leading-tight font-bold tracking-tight text-white mb-2">Complete Your Account Setup</h2>
              <p className="text-[#a6a6a6] text-[15px] mb-8">We found your existing student account. To secure your account, verify your email and create a password.</p>
              
              <div className="mb-6 flex flex-col gap-1">
                <span className="text-[#a6a6a6] text-[14px]">Email:</span>
                <span className="text-white bg-[#161616]/80 px-3 py-2 rounded border border-[#404040]">{email}</span>
              </div>
              
              <button
                type="button"
                onClick={() => handleSendOTP(false)}
                disabled={loading}
                className="w-full bg-[#0099ff] hover:bg-[#007acc] text-white font-semibold text-[16px] py-4 px-4 rounded-md transition duration-200 disabled:opacity-70"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
              
              <div className="text-center mt-6">
                <button type="button" onClick={() => setStep("EMAIL_ENTRY")} className="text-[14px] text-[#8c8c8c] hover:text-white transition">
                  &larr; Use another email
                </button>
              </div>
            </div>
          )}

          {step === "NEW_ACCOUNT_DETAILS" && (
            <div>
              <h2 className="text-[28px] sm:text-[32px] leading-tight font-bold tracking-tight text-white mb-2">Create Your Account</h2>
              <p className="text-[#a6a6a6] text-[15px] mb-8">First, tell us your name.</p>
              
              <form onSubmit={(e) => { e.preventDefault(); handleSendOTP(false); }} className="space-y-6">
                <div className="relative">
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder=" "
                    className="peer w-full bg-[#161616]/80 text-white border border-[#404040] rounded-md pt-6 pb-2 px-4 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition appearance-none text-[16px]"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <label 
                    htmlFor="name" 
                    className="absolute left-4 top-2 text-[12px] text-[#8c8c8c] transition-all peer-placeholder-shown:text-[16px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[12px] cursor-text pointer-events-none"
                  >
                    Full Name
                  </label>
                </div>
                
                <div className="flex flex-col gap-1 mb-2">
                  <span className="text-[#a6a6a6] text-[14px]">Email:</span>
                  <span className="text-white/70 bg-[#161616]/80 px-3 py-2 rounded border border-[#404040] opacity-80 cursor-not-allowed">{email}</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0099ff] hover:bg-[#007acc] text-white font-semibold text-[16px] py-4 px-4 rounded-md transition duration-200 mt-2 disabled:opacity-70"
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
                
                <div className="text-center mt-6">
                  <button type="button" onClick={() => setStep("EMAIL_ENTRY")} className="text-[14px] text-[#8c8c8c] hover:text-white transition">
                    &larr; Use another email
                  </button>
                </div>
              </form>
            </div>
          )}

          {(step === "OTP_VERIFICATION" || step === "PASSWORD_RESET_OTP") && (
            <div>
              <h2 className="text-[28px] sm:text-[32px] leading-tight font-bold tracking-tight text-white mb-2">Verify Your Email</h2>
              <p className="text-[#a6a6a6] text-[15px] mb-8 flex flex-col gap-1">
                <span>We sent a verification code to:</span>
                <span className="text-white bg-[#161616]/80 px-3 py-2 rounded border border-[#404040] break-all">{email}</span>
              </p>
              
              <form onSubmit={(e) => handleVerifyOTP(e, step === "OTP_VERIFICATION" ? "PASSWORD_CREATION" : "PASSWORD_RESET_CREATION")} className="space-y-6">
                <div className="relative">
                  <input
                    id="otp"
                    type="text"
                    required
                    maxLength={6}
                    placeholder=" "
                    className="peer w-full bg-[#161616]/80 text-white border border-[#404040] rounded-md pt-6 pb-2 px-4 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition appearance-none text-[18px] tracking-[0.5em] font-mono text-center"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                  <label 
                    htmlFor="otp" 
                    className="absolute left-4 top-2 text-[12px] text-[#8c8c8c] transition-all peer-placeholder-shown:text-[16px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[12px] cursor-text pointer-events-none w-full text-left"
                  >
                    Enter 6-digit OTP
                  </label>
                </div>
                
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-[#0099ff] hover:bg-[#007acc] text-white font-semibold text-[16px] py-4 px-4 rounded-md transition duration-200 mt-2 disabled:opacity-70"
                >
                  Verify OTP
                </button>
              </form>
              
              <div className="flex justify-between items-center text-[14px] mt-6">
                <button 
                  type="button" 
                  onClick={() => handleSendOTP(step === "PASSWORD_RESET_OTP")} 
                  disabled={loading || resendCooldown > 0}
                  className="text-[#0099ff] hover:underline disabled:text-[#8c8c8c] disabled:no-underline"
                >
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                </button>
                <button type="button" onClick={() => setStep("EMAIL_ENTRY")} className="text-[#8c8c8c] hover:text-white transition">
                  Change Email
                </button>
              </div>
            </div>
          )}

          {(step === "PASSWORD_CREATION" || step === "PASSWORD_RESET_CREATION") && (
            <div>
              <h2 className="text-[28px] sm:text-[32px] leading-tight font-bold tracking-tight text-white mb-2">
                {step === "PASSWORD_CREATION" ? "Create Your Password" : "Create New Password"}
              </h2>
              
              <form onSubmit={step === "PASSWORD_CREATION" ? handleSetupAccount : handleResetPassword} className="space-y-6 mt-8">
                <div className="relative flex items-center">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder=" "
                    className="peer w-full bg-[#161616]/80 text-white border border-[#404040] rounded-md pt-6 pb-2 px-4 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition appearance-none text-[16px]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <label 
                    htmlFor="new-password" 
                    className="absolute left-4 top-2 text-[12px] text-[#8c8c8c] transition-all peer-placeholder-shown:text-[16px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[12px] cursor-text pointer-events-none"
                  >
                    Password
                  </label>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 p-1 focus:outline-none">
                    <EyeIcon show={showPassword} />
                  </button>
                </div>
                
                <div className="relative flex items-center">
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder=" "
                    className="peer w-full bg-[#161616]/80 text-white border border-[#404040] rounded-md pt-6 pb-2 px-4 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition appearance-none text-[16px]"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <label 
                    htmlFor="confirm-password" 
                    className="absolute left-4 top-2 text-[12px] text-[#8c8c8c] transition-all peer-placeholder-shown:text-[16px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[12px] cursor-text pointer-events-none"
                  >
                    Confirm Password
                  </label>
                </div>

                <div className="bg-[#161616]/50 p-4 rounded-md border border-[#404040] text-[13px] text-[#a6a6a6]">
                  <p className="font-semibold text-white mb-2">Password requirements:</p>
                  <ul className="space-y-1">
                    <li className={`flex items-center gap-2 ${reqLength ? "text-green-400" : ""}`}>
                      <span>{reqLength ? "✓" : "○"}</span> At least 8 characters
                    </li>
                    <li className={`flex items-center gap-2 ${reqUpper ? "text-green-400" : ""}`}>
                      <span>{reqUpper ? "✓" : "○"}</span> One uppercase letter
                    </li>
                    <li className={`flex items-center gap-2 ${reqLower ? "text-green-400" : ""}`}>
                      <span>{reqLower ? "✓" : "○"}</span> One lowercase letter
                    </li>
                    <li className={`flex items-center gap-2 ${reqNumber ? "text-green-400" : ""}`}>
                      <span>{reqNumber ? "✓" : "○"}</span> One number
                    </li>
                    <li className={`flex items-center gap-2 ${reqSpecial ? "text-green-400" : ""}`}>
                      <span>{reqSpecial ? "✓" : "○"}</span> One special character
                    </li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading || !allReqsMet || password !== confirmPassword}
                  className="w-full bg-[#0099ff] hover:bg-[#007acc] text-white font-semibold text-[16px] py-4 px-4 rounded-md transition duration-200 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (step === "PASSWORD_CREATION" ? "Creating..." : "Resetting...") : (step === "PASSWORD_CREATION" ? "Create Account" : "Reset Password")}
                </button>
              </form>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}
