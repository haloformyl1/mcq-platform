"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import PiechemLogo from "@/components/PiechemLogo";
import { 
  ChevronRight, 
  ShieldCheck, 
  Clock, 
  BarChart3, 
  Sparkles, 
  Lock, 
  AlertCircle, 
  Phone,
  ArrowRight,
  Sparkle
} from "lucide-react";

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

  // Validation checklist
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

  const validateEmail = (e: string) => /^[^s@]+@[^s@]+.[^s@]+$/.test(e);

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
      
      if (data.isAdmin || data.redirectUrl) {
        router.push(data.redirectUrl || "/admin");
      } else if (data.isOnboarded) {
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
    <div className="min-h-screen bg-[#030910] text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* ========================================================= */}
      {/* 1. UPPER SIDE (HERO SECTION - NETFLIX INSPIRATION)       */}
      {/* ========================================================= */}
      <section className="relative min-h-[90vh] sm:min-h-screen flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#051829] via-[#030e18] to-[#030910]">
        
        {/* Ambient Glows & Chemical Grid Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(0,210,255,0.22),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(0,140,255,0.08),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_40%,rgba(147,51,234,0.06),transparent_50%)] pointer-events-none" />
        
        {/* Subtle grid pattern for exam/tech feel */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)",
            backgroundSize: "28px 28px"
          }} 
        />

        {/* --- Top Navigation Header --- */}
        <header className="relative z-20 w-full px-4 sm:px-8 py-5 sm:py-6 flex items-start justify-between gap-4">
          {/* Logo & Compact Designer Badge (Image 2 style) */}
          <div className="flex flex-col items-start gap-1.5 sm:gap-2">
            <PiechemLogo size="md" isGoldMember={false} />
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full border border-cyan-500/30 bg-[#03111c]/90 backdrop-blur-md shadow-sm">
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium whitespace-nowrap">
                Designed by <span className="font-semibold text-cyan-400">Arghyadeep Roy</span>
              </span>
              <span className="text-cyan-400/80 text-[10px]">•</span>
              <a
                href="tel:9830507435"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-cyan-500/50 bg-[#041d2d]/80 text-cyan-300 hover:text-cyan-200 hover:border-cyan-400 transition-colors text-[10px] sm:text-[11px] font-semibold tracking-wide whitespace-nowrap"
              >
                <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current text-cyan-400 shrink-0" />
                <span>9830507435</span>
              </a>
            </div>
          </div>

                  </header>

        {/* --- Center Hero Content --- */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center my-auto pt-6 pb-12 w-full">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-semibold mb-4 tracking-wide shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI-Proctored Chemistry Examination Platform</span>
          </div>

          {/* Big Hero Headline (Netflix Inspiration) */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-3 sm:mb-4 leading-tight">
            Unlimited practice, real-time analysis & more
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl font-medium text-cyan-100/90 mb-2">
            Targeting WBCHSE • CBSE • ISC • JEE & NEET Chemistry Excellence
          </p>
          <p className="text-xs sm:text-base text-slate-300/80 mb-8 max-w-2xl mx-auto">
            Ready to test your knowledge? Enter your student email to access or set up your examination portal.
          </p>

          {/* Interactive Login Flows */}
          <div className="w-full">
            {step === "EMAIL_ENTRY" ? (
              /* Netflix-Style Email Input Bar */
              <form onSubmit={handleIdentify} className="w-full max-w-xl mx-auto">
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5 sm:gap-3">
                  <div className="relative flex-1">
                    <input
                      id="student-email"
                      type="email"
                      required
                      placeholder=" "
                      className="peer w-full h-12 sm:h-14 bg-[#061421]/90 backdrop-blur-md text-white border border-cyan-500/40 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 rounded-xl px-4 pt-4 pb-1 text-sm sm:text-base outline-none transition"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <label
                      htmlFor="student-email"
                      className="absolute left-4 top-1.5 text-[10px] sm:text-[11px] text-cyan-300/80 font-semibold tracking-wide transition-all peer-placeholder-shown:top-3.5 sm:peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm sm:peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] sm:peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-cyan-300/80 pointer-events-none"
                    >
                      Student Email Address
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-12 sm:h-14 px-6 sm:px-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-[0_0_20px_rgba(0,195,255,0.4)] hover:shadow-[0_0_30px_rgba(0,195,255,0.6)] flex items-center justify-center gap-2 shrink-0 disabled:opacity-70 active:scale-[0.98]"
                  >
                    <span>{loading ? "Checking..." : "Get Started"}</span>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                {error && (
                  <div className="mt-4 bg-red-500/15 border border-red-500/40 text-red-300 px-4 py-2.5 rounded-xl text-xs sm:text-sm text-left flex items-center gap-2 shadow-md">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="mt-4 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl text-xs sm:text-sm text-left flex items-center gap-2 shadow-md">
                    <Sparkle className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{successMsg}</span>
                  </div>
                )}
              </form>
            ) : (
              /* Elevated Glassmorphism Card for Subsequent Auth Steps */
              <div className="max-w-md mx-auto w-full bg-[#061422]/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl text-left">
                {error && (
                  <div className="mb-5 bg-red-500/15 border border-red-500/40 text-red-300 px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="mb-5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2">
                    <Sparkle className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {step === "EXISTING_PASSWORD_LOGIN" && (
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Enter Password</h2>
                    <p className="text-slate-400 text-xs sm:text-sm mb-6 flex items-center gap-1.5 break-all">
                      <span>Signing in as:</span>
                      <span className="text-cyan-300 font-medium">{email}</span>
                    </p>
                    
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="relative flex items-center">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder=" "
                          className="peer w-full bg-[#091e30]/80 text-white border border-cyan-500/30 focus:border-cyan-400 rounded-xl pt-5 pb-2 px-4 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition text-sm sm:text-base"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <label 
                          htmlFor="password" 
                          className="absolute left-4 top-1.5 text-[11px] text-cyan-300/80 font-medium transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-cyan-300/80 pointer-events-none"
                        >
                          Your Password
                        </label>
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 p-1 focus:outline-none text-slate-400 hover:text-white">
                          <EyeIcon show={showPassword} />
                        </button>
                      </div>

                      <div className="flex justify-between items-center text-xs mt-2">
                        {email.trim().toLowerCase() !== "piechemotp@gmail.com" && (
                          <button 
                            type="button" 
                            onClick={() => handleSendOTP(true)} 
                            className="text-cyan-400 hover:text-cyan-300 hover:underline transition"
                          >
                            Forgot your password?
                          </button>
                        )}
                        <button type="button" onClick={() => setStep("EMAIL_ENTRY")} className="text-slate-400 hover:text-white transition">
                          Change Email
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3.5 px-4 rounded-xl transition duration-200 mt-4 disabled:opacity-70 shadow-lg shadow-cyan-950/50"
                      >
                        {loading ? "Signing in..." : "Sign In to Exam Platform"}
                      </button>
                    </form>
                  </div>
                )}

                {step === "NEW_ACCOUNT_DETAILS" && (
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Create Account</h2>
                    <p className="text-slate-400 text-xs sm:text-sm mb-6">First time here? Tell us your full name to proceed.</p>
                    
                    <form onSubmit={(e) => { e.preventDefault(); handleSendOTP(false); }} className="space-y-4">
                      <div className="relative">
                        <input
                          id="name"
                          type="text"
                          required
                          placeholder=" "
                          className="peer w-full bg-[#091e30]/80 text-white border border-cyan-500/30 focus:border-cyan-400 rounded-xl pt-5 pb-2 px-4 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition text-sm sm:text-base"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                        <label 
                          htmlFor="name" 
                          className="absolute left-4 top-1.5 text-[11px] text-cyan-300/80 font-medium transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[11px] pointer-events-none"
                        >
                          Full Student Name
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !name.trim()}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3.5 px-4 rounded-xl transition duration-200 mt-2 disabled:opacity-70 shadow-lg"
                      >
                        {loading ? "Sending Code..." : "Send Verification Code"}
                      </button>
                      
                      <div className="text-center mt-3">
                        <button type="button" onClick={() => setStep("EMAIL_ENTRY")} className="text-xs text-slate-400 hover:text-white transition">
                          &larr; Use another email
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {step === "EXISTING_ACCOUNT_OTP_SETUP" && (
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Account Setup</h2>
                    <p className="text-slate-400 text-xs sm:text-sm mb-6">Verify your email to complete password creation.</p>
                    
                    <form onSubmit={(e) => { e.preventDefault(); handleSendOTP(false); }} className="space-y-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3.5 px-4 rounded-xl transition duration-200 shadow-lg"
                      >
                        {loading ? "Sending Code..." : "Send Verification Code"}
                      </button>
                      
                      <div className="text-center mt-3">
                        <button type="button" onClick={() => setStep("EMAIL_ENTRY")} className="text-xs text-slate-400 hover:text-white transition">
                          &larr; Use another email
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {(step === "OTP_VERIFICATION" || step === "PASSWORD_RESET_OTP") && (
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Verify Your Email</h2>
                    <p className="text-slate-400 text-xs sm:text-sm mb-6 flex flex-col gap-1">
                      <span>We sent a 6-digit verification code to:</span>
                      <span className="text-cyan-300 font-semibold bg-[#091e30] px-3 py-1.5 rounded-lg border border-cyan-500/30 break-all">{email}</span>
                    </p>
                    
                    <form onSubmit={(e) => handleVerifyOTP(e, step === "OTP_VERIFICATION" ? "PASSWORD_CREATION" : "PASSWORD_RESET_CREATION")} className="space-y-4">
                      <div className="relative">
                        <input
                          id="otp"
                          type="text"
                          required
                          maxLength={6}
                          placeholder=" "
                          className="peer w-full bg-[#091e30]/80 text-white border border-cyan-500/30 focus:border-cyan-400 rounded-xl pt-5 pb-2 px-4 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition appearance-none text-lg tracking-[0.5em] font-mono text-center"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        />
                        <label 
                          htmlFor="otp" 
                          className="absolute left-4 top-1.5 text-[11px] text-cyan-300/80 font-medium transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[11px] pointer-events-none w-full text-center"
                        >
                          Enter 6-digit OTP
                        </label>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={loading || otp.length < 6}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3.5 px-4 rounded-xl transition duration-200 mt-2 disabled:opacity-70 shadow-lg"
                      >
                        Verify OTP
                      </button>
                    </form>
                    
                    <div className="flex justify-between items-center text-xs mt-5">
                      <button 
                        type="button" 
                        onClick={() => handleSendOTP(step === "PASSWORD_RESET_OTP")} 
                        disabled={loading || resendCooldown > 0}
                        className="text-cyan-400 hover:underline disabled:text-slate-500 disabled:no-underline"
                      >
                        {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                      </button>
                      <button type="button" onClick={() => setStep("EMAIL_ENTRY")} className="text-slate-400 hover:text-white transition">
                        Change Email
                      </button>
                    </div>
                  </div>
                )}

                {(step === "PASSWORD_CREATION" || step === "PASSWORD_RESET_CREATION") && (
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-4">
                      {step === "PASSWORD_CREATION" ? "Create Your Password" : "Create New Password"}
                    </h2>
                    
                    <form onSubmit={step === "PASSWORD_CREATION" ? handleSetupAccount : handleResetPassword} className="space-y-4">
                      <div className="relative flex items-center">
                        <input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder=" "
                          className="peer w-full bg-[#091e30]/80 text-white border border-cyan-500/30 focus:border-cyan-400 rounded-xl pt-5 pb-2 px-4 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition text-sm sm:text-base"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <label 
                          htmlFor="new-password" 
                          className="absolute left-4 top-1.5 text-[11px] text-cyan-300/80 font-medium transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[11px] pointer-events-none"
                        >
                          Password
                        </label>
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 p-1 focus:outline-none text-slate-400 hover:text-white">
                          <EyeIcon show={showPassword} />
                        </button>
                      </div>
                      
                      <div className="relative flex items-center">
                        <input
                          id="confirm-password"
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder=" "
                          className="peer w-full bg-[#091e30]/80 text-white border border-cyan-500/30 focus:border-cyan-400 rounded-xl pt-5 pb-2 px-4 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition text-sm sm:text-base"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <label 
                          htmlFor="confirm-password" 
                          className="absolute left-4 top-1.5 text-[11px] text-cyan-300/80 font-medium transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[11px] pointer-events-none"
                        >
                          Confirm Password
                        </label>
                      </div>

                      <div className="bg-[#091e30]/60 p-3.5 rounded-xl border border-cyan-500/20 text-xs text-slate-300 space-y-1">
                        <p className="font-semibold text-white mb-1.5">Password requirements:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                          <div className={`flex items-center gap-1.5 ${reqLength ? "text-emerald-400 font-semibold" : "text-slate-400"}`}>
                            <span>{reqLength ? "✓" : "•"}</span> At least 8 characters
                          </div>
                          <div className={`flex items-center gap-1.5 ${reqUpper ? "text-emerald-400 font-semibold" : "text-slate-400"}`}>
                            <span>{reqUpper ? "✓" : "•"}</span> One uppercase letter
                          </div>
                          <div className={`flex items-center gap-1.5 ${reqLower ? "text-emerald-400 font-semibold" : "text-slate-400"}`}>
                            <span>{reqLower ? "✓" : "•"}</span> One lowercase letter
                          </div>
                          <div className={`flex items-center gap-1.5 ${reqNumber ? "text-emerald-400 font-semibold" : "text-slate-400"}`}>
                            <span>{reqNumber ? "✓" : "•"}</span> One number
                          </div>
                          <div className={`flex items-center gap-1.5 ${reqSpecial ? "text-emerald-400 font-semibold" : "text-slate-400"}`}>
                            <span>{reqSpecial ? "✓" : "•"}</span> Special character
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !allReqsMet || password !== confirmPassword}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3.5 px-4 rounded-xl transition duration-200 mt-2 disabled:opacity-70 shadow-lg"
                      >
                        {loading ? (step === "PASSWORD_CREATION" ? "Creating..." : "Resetting...") : (step === "PASSWORD_CREATION" ? "Create Account" : "Reset Password")}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* --- SIGNATURE CURVED GLOWING ARC DIVIDER (Image 4 bottom / Image 3 top) --- */}
        <div className="relative w-full overflow-hidden leading-none z-10 -mb-[1px]">
          <div className="w-full h-12 sm:h-20 relative flex items-center justify-center">
            {/* Ambient backlight glow behind curve apex */}
            <div className="absolute -top-4 sm:-top-8 left-1/2 -translate-x-1/2 w-3/4 sm:w-2/3 h-10 sm:h-16 bg-gradient-to-r from-cyan-500/20 via-sky-400/30 to-blue-500/20 blur-2xl rounded-full pointer-events-none" />
            
            {/* Curved SVG Arch */}
            <svg
              viewBox="0 0 1440 100"
              fill="none"
              preserveAspectRatio="none"
              className="w-full h-full text-[#030910]"
            >
              <path d="M0,100 Q720,-20 1440,100 L1440,100 L0,100 Z" fill="#030910" />
              <path d="M0,100 Q720,-20 1440,100" stroke="url(#arcCyanGlow)" strokeWidth="2.5" fill="none" />
              <defs>
                <linearGradient id="arcCyanGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00e5ff" stopOpacity="0" />
                  <stop offset="25%" stopColor="#00e5ff" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
                  <stop offset="75%" stopColor="#00e5ff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. DOWNSIDE (NEWS & "MORE REASONS TO JOIN" - IMAGE 3)     */}
      {/* ========================================================= */}
      <section className="relative z-10 bg-[#030910] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        
        {/* News Announcement Banner */}
        <div className="mb-8 p-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#071929]/90 via-[#0a233a]/80 to-[#071929]/90 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-start sm:items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              Platform News
            </span>
            <p className="text-xs sm:text-sm text-slate-200">
              <span className="font-bold text-white">2026 Examination Sessions Active:</span> Weekly timed mock tests for WBCHSE, CBSE, ISC, and JEE/NEET with immediate AI evaluation are now live!
            </p>
          </div>
          <span className="text-[11px] font-semibold text-cyan-300/80 shrink-0 self-end sm:self-center bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-500/20">
            Session 2026-27
          </span>
        </div>

        {/* Section Heading (Image 3 Style) */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 sm:mb-8 tracking-tight">
          More reasons to join
        </h2>

        {/* 4 Feature/News Cards Grid (Image 3 Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Card 1: Live Exam Simulation */}
          <div className="relative bg-gradient-to-b from-[#0e1d2c] to-[#050e17] border border-cyan-500/20 hover:border-cyan-400/50 rounded-2xl p-6 flex flex-col justify-between min-h-[250px] sm:min-h-[280px] shadow-lg hover:shadow-[0_10px_30px_rgba(0,195,255,0.15)] hover:-translate-y-1 transition-all duration-300 group">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Live Exam Simulation
              </h3>
              <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed">
                Attempt authentic board and competitive mock papers with negative marking, custom timers, and question shuffling.
              </p>
            </div>
            {/* Visual bottom-right glowing icon */}
            <div className="self-end mt-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500/30 to-blue-600/40 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,195,255,0.3)] group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-cyan-300" />
              </div>
            </div>
          </div>

          {/* Card 2: Smart AI Proctoring */}
          <div className="relative bg-gradient-to-b from-[#0e1d2c] to-[#050e17] border border-cyan-500/20 hover:border-cyan-400/50 rounded-2xl p-6 flex flex-col justify-between min-h-[250px] sm:min-h-[280px] shadow-lg hover:shadow-[0_10px_30px_rgba(168,85,247,0.15)] hover:-translate-y-1 transition-all duration-300 group">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                AI Proctoring & Integrity
              </h3>
              <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed">
                Automated full-screen lock and tab monitoring ensure a tamper-free test environment and credible benchmark rankings.
              </p>
            </div>
            {/* Visual bottom-right glowing icon */}
            <div className="self-end mt-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500/30 to-indigo-600/40 border border-purple-400/50 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-purple-300" />
              </div>
            </div>
          </div>

          {/* Card 3: In-Depth Question Analytics */}
          <div className="relative bg-gradient-to-b from-[#0e1d2c] to-[#050e17] border border-cyan-500/20 hover:border-cyan-400/50 rounded-2xl p-6 flex flex-col justify-between min-h-[250px] sm:min-h-[280px] shadow-lg hover:shadow-[0_10px_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition-all duration-300 group">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                Instant Score & Solutions
              </h3>
              <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed">
                Review step-by-step chemistry explanations, KaTeX formulas, accuracy metrics, and pinpoint weak topics instantly.
              </p>
            </div>
            {/* Visual bottom-right glowing icon */}
            <div className="self-end mt-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500/30 to-teal-600/40 border border-emerald-400/50 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-emerald-300" />
              </div>
            </div>
          </div>

          {/* Card 4: Gold Study Materials */}
          <div className="relative bg-gradient-to-b from-[#0e1d2c] to-[#050e17] border border-cyan-500/20 hover:border-cyan-400/50 rounded-2xl p-6 flex flex-col justify-between min-h-[250px] sm:min-h-[280px] shadow-lg hover:shadow-[0_10px_30px_rgba(245,158,11,0.15)] hover:-translate-y-1 transition-all duration-300 group">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                Curated Study Vault
              </h3>
              <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed">
                Access chapter-wise revision notes, high-yield organic mechanism sheets, and premium question banks anytime.
              </p>
            </div>
            {/* Visual bottom-right glowing icon */}
            <div className="self-end mt-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500/30 to-yellow-600/40 border border-amber-400/50 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-amber-300" />
              </div>
            </div>
          </div>

        </div>

        {/* --- Footer Note --- */}
        <footer className="mt-14 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            Questions or Guidance? Call/WhatsApp:{" "}
            <a href="tel:9830507435" className="text-cyan-400 font-semibold hover:underline">
              9830507435
            </a>{" "}
            (Arghyadeep Roy)
          </div>
          <div className="flex items-center gap-4">
            <span>© 2026 PIE CHEM Platform</span>
          </div>
        </footer>

      </section>

    </div>
  );
}
