"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import PiechemLogo from "@/components/PiechemLogo";
import {
  Atom,
  ChevronRight, 
  ShieldCheck, 
  Clock, 
  BarChart3, 
  Sparkles, 
  Lock, 
  AlertCircle, 
  Phone,
  ArrowRight,
  Sparkle,
  Eye,
  EyeOff,
  CheckCircle2,
  Check,
  Layers,
  Zap,
  BookOpen,
  Award
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

  // If user visits /login directly without viewing the landing intro first, redirect to landing page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const visited = sessionStorage.getItem("visited_landing");
      if (!visited) {
        router.replace("/");
      }
    }
  }, [router]);

  // Validation checklist
  const reqLength = password.length >= 8;
  const reqUpper = /[A-Z]/.test(password);
  const reqLower = /[a-z]/.test(password);
  const reqNumber = /[0-9]/.test(password);
  const reqSpecial = /[^A-Za-z0-9]/.test(password);
  const allReqsMet = reqLength && reqUpper && reqLower && reqNumber && reqSpecial;

  useEffect(() => {
    // Check if redirected due to concurrent device login
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("reason") === "concurrent_device") {
        setError("You have been logged out because your account was logged into on another device. Only 1 active device is permitted at a time.");
        return;
      }
    }

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

  return (
    <div className="min-h-screen bg-[#020712] text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200 flex flex-col justify-between overflow-x-hidden">
      
      {/* ========================================================= */}
      {/* 1. UPPER HERO SECTION WITH DEEP COSMIC CHEMISTRY LIGHTING */}
      {/* ========================================================= */}
      <section className="relative min-h-[92vh] flex flex-col justify-between overflow-hidden">
        
        {/* Layered High-Tech Chemistry Radial Glows */}
        <div className="absolute top-0 inset-x-0 h-[650px] bg-[radial-gradient(ellipse_75%_55%_at_50%_-10%,rgba(0,242,254,0.18),transparent_75%)] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(37,99,235,0.12),transparent_70%)] pointer-events-none" />
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-[radial-gradient(circle,rgba(16,185,129,0.08),transparent_65%)] pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-[radial-gradient(circle,rgba(139,92,246,0.08),transparent_65%)] pointer-events-none" />
        
        {/* Isometric Scientific Grid Backdrop */}
        <div 
          className="absolute inset-0 opacity-[0.025] pointer-events-none" 
          style={{
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px)",
            backgroundSize: "32px 32px"
          }} 
        />

        {/* Dynamic Orbital Geometry Lines (Bohr / Quantum Rings) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none opacity-25">
          <div className="w-full h-full rounded-full border border-cyan-500/20 [animation:spin_60s_linear_infinite]" />
          <div className="absolute inset-16 rounded-full border border-blue-500/20 [animation:spin_45s_linear_infinite_reverse]" />
          <div className="absolute inset-32 rounded-full border border-teal-500/15 [animation:spin_30s_linear_infinite]" />
        </div>

        {/* --- Top Navigation Header --- */}
        <header className="relative z-20 w-full px-4 sm:px-8 lg:px-12 py-4 sm:py-6 flex items-center justify-between gap-4">
          {/* Logo on Far Left (Locked to Standard Cyan/White logo per user rule) */}
          <div className="flex items-center">
            <PiechemLogo size="md" isGoldMember={false} subtitle="Learning Platform" />
          </div>

          {/* Designer Badge & Quick Hotline on Far Right */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-[#04111d]/90 backdrop-blur-xl shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] sm:text-xs text-slate-300 font-medium whitespace-nowrap">
                Designed by <strong className="font-semibold text-cyan-300">Arghyadeep Roy</strong>
              </span>
              <span className="text-cyan-500/60 text-[10px] hidden xs:inline">•</span>
              <a
                href="tel:9830507435"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-cyan-500/40 bg-cyan-950/80 text-cyan-300 hover:text-white hover:border-cyan-300 transition-all text-[10px] sm:text-[11px] font-mono font-semibold tracking-wide whitespace-nowrap shadow-sm hover:shadow-[0_0_12px_rgba(0,242,254,0.4)]"
                title="Call / WhatsApp Arghyadeep Roy"
              >
                <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current text-cyan-400 shrink-0" />
                <span>9830507435</span>
              </a>
            </div>
          </div>
        </header>

        {/* --- Center Hero Content --- */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center my-auto pt-4 sm:pt-8 pb-14 w-full flex flex-col items-center">
          
          {/* Scientific Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/35 bg-[#031525]/85 backdrop-blur-xl text-cyan-300 text-[11px] sm:text-xs font-mono tracking-wider mb-5 shadow-[0_0_20px_rgba(0,242,254,0.18)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <span className="uppercase font-bold tracking-widest text-[10.5px]">AI-Proctored Chemistry Examination Engine</span>
          </div>

          {/* Grand Hero Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4 leading-[1.12] drop-shadow-md">
            Unlimited practice, <br className="hidden sm:inline" />
            <span className="font-serif italic font-normal bg-gradient-to-r from-cyan-300 via-sky-200 to-teal-300 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(0,242,254,0.35)]">
              real-time analysis & more
            </span>
          </h1>

          <p className="text-xs sm:text-base text-slate-300/90 mb-8 max-w-xl mx-auto font-light leading-relaxed">
            Ready to test your knowledge? Enter your student email to access or initialize your examination portal.
          </p>

          {/* Interactive Login Flows */}
          <div className="w-full">
            {step === "EMAIL_ENTRY" ? (
              /* Ultra-Luxe Obsidian Ingestion Bar */
              <div className="w-full max-w-xl mx-auto">
                <form 
                  onSubmit={handleIdentify} 
                  className="relative p-1.5 sm:p-2 rounded-2xl bg-gradient-to-b from-[#06182a]/95 via-[#030d17]/95 to-[#01060b]/98 border border-cyan-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(0,210,255,0.18)] backdrop-blur-2xl transition-all duration-300 hover:border-cyan-400/60"
                >
                  {/* Subtle top edge illumination */}
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent rounded-t-2xl" />

                  <div className="flex flex-col sm:flex-row items-stretch gap-2">
                    <div className="relative flex-1">
                      <input
                        id="student-email"
                        type="email"
                        required
                        placeholder=" "
                        className="peer w-full h-12 sm:h-14 bg-white/[0.03] text-white border border-transparent focus:border-cyan-500/40 rounded-xl px-4 pt-4 pb-1 text-sm sm:text-base outline-none transition font-sans placeholder-transparent focus:bg-white/[0.05]"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <label
                        htmlFor="student-email"
                        className="absolute left-4 top-1.5 text-[10px] sm:text-[11px] text-cyan-300 font-mono font-semibold tracking-wider transition-all peer-placeholder-shown:top-3.5 sm:peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm sm:peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] sm:peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-cyan-300 pointer-events-none"
                      >
                        Student Email Address
                      </label>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="group/btn relative h-12 sm:h-14 px-6 sm:px-8 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm sm:text-base rounded-xl transition-all duration-300 shadow-[0_0_25px_rgba(0,210,255,0.45)] hover:shadow-[0_0_35px_rgba(0,210,255,0.65)] flex items-center justify-center gap-2 shrink-0 disabled:opacity-70 active:scale-[0.98] uppercase tracking-wider overflow-hidden"
                    >
                      <span className="relative z-10 font-sans">{loading ? "Verifying..." : "Get Started"}</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 transition-transform group-hover/btn:translate-x-1 relative z-10" />
                    </button>
                  </div>
                </form>

                {error && (
                  <div className="mt-4 bg-red-950/60 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-xs sm:text-sm text-left flex items-center gap-2.5 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="mt-4 bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl text-xs sm:text-sm text-left flex items-center gap-2.5 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
                    <Sparkle className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Micro-Trust Signals beneath bar */}
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mt-5 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Single-Device Lock</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Instant AI Evaluation</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Atom className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>100% NCERT & Board Calibrated</span>
                  </span>
                </div>

                {/* Divider / Try without login option */}
                <div className="relative my-7 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.08]" />
                  </div>
                  <span className="relative px-3.5 bg-[#020710] text-[10.5px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                    or try without login (limited features)
                  </span>
                </div>

                {/* Try Without Login (Limited Features) Card */}
                <div className="relative rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[#061c28]/85 via-[#03131d]/85 to-[#020e17]/90 border border-teal-500/35 hover:border-teal-400/60 shadow-[0_12px_36px_rgba(0,0,0,0.65),0_0_20px_rgba(20,184,166,0.15)] transition-all duration-300 backdrop-blur-xl group text-left">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left space-y-1">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-950/90 border border-teal-500/40 text-teal-300 uppercase">
                          <Check className="w-2.5 h-2.5" />
                          <span>No Account Required</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          (Limited Features)
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white group-hover:text-teal-200 transition-colors">
                        Try Without Login
                      </h4>
                      <p className="text-xs text-slate-300/85 font-light leading-relaxed max-w-md">
                        Access all free CBSE, WBCHSE, ICSE, and NEET/JEE chapter notes, DPPs, and 3D molecular labs randomly without creating an account.
                      </p>
                    </div>

                    <Link
                      href="/study-material"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-sky-400 hover:from-teal-300 hover:to-sky-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all hover:scale-105 shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Explore Free Stuff</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>

                  {/* Fast curriculum selector chips */}
                  <div className="mt-3.5 pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-[11px] font-mono">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mr-1">Free Curricula:</span>
                    <Link
                      href="/study-material/cbse"
                      className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-white transition-colors"
                    >
                      CBSE (All Classes)
                    </Link>
                    <Link
                      href="/study-material/wbchse"
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 hover:text-white transition-colors"
                    >
                      WBCHSE (All Semesters)
                    </Link>
                    <Link
                      href="/study-material/icse"
                      className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-white transition-colors"
                    >
                      ICSE / ISC (All Classes)
                    </Link>
                    <Link
                      href="/study-material/entrance"
                      className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/30 hover:border-rose-400 text-rose-300 hover:text-white transition-colors"
                    >
                      NEET & JEE
                    </Link>
                    <Link
                      href="/3d-animations"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-950/60 hover:bg-teal-900/80 border border-teal-500/30 hover:border-teal-400 text-teal-300 hover:text-white transition-colors"
                    >
                      <Atom className="w-3 h-3 text-teal-400 animate-spin [animation-duration:10s]" />
                      <span>Free 3D Labs</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* Elevated Obsidian Vault Card for Subsequent Auth Steps */
              <div className="max-w-md mx-auto w-full relative rounded-3xl bg-gradient-to-br from-[#06182c]/95 via-[#030d17]/95 to-black/98 border border-cyan-500/40 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(0,210,255,0.18)] backdrop-blur-2xl text-left">
                {/* Ambient top highlight */}
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

                {error && (
                  <div className="mb-5 bg-red-950/60 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="mb-5 bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2.5">
                    <Sparkle className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {step === "EXISTING_PASSWORD_LOGIN" && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-serif">Enter Password</h2>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 font-bold uppercase">Active Account</span>
                    </div>

                    <div className="mb-5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Authenticating Student</div>
                        <div className="text-xs sm:text-sm font-mono text-cyan-300 font-bold truncate">{email}</div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setStep("EMAIL_ENTRY")} 
                        className="text-[11px] font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 border border-white/10 transition"
                      >
                        Change
                      </button>
                    </div>
                    
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder=" "
                          className="peer w-full bg-[#040e1b] text-white border border-cyan-500/30 focus:border-cyan-400 rounded-xl pt-5 pb-2 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition text-sm sm:text-base font-sans"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <label 
                          htmlFor="password" 
                          className="absolute left-4 top-1.5 text-[10px] sm:text-[11px] text-cyan-300 font-mono font-semibold tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-cyan-300 pointer-events-none"
                        >
                          Account Password
                        </label>
                        <button
                          type="button"
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5 text-cyan-400" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleSendOTP(true)}
                          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:underline transition"
                        >
                          Forgot Password?
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black py-3.5 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(0,210,255,0.4)] disabled:opacity-70 uppercase tracking-wider text-sm flex items-center justify-center gap-2"
                      >
                        <Lock className="w-4 h-4 text-slate-950" />
                        <span>{loading ? "Authenticating..." : "Sign In to Exam Portal"}</span>
                      </button>
                    </form>
                  </div>
                )}

                {step === "NEW_ACCOUNT_DETAILS" && (
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-serif mb-1">Create Student Account</h2>
                    <p className="text-slate-400 text-xs sm:text-sm mb-5">First time here? Enter your full student name to proceed.</p>
                    
                    <form onSubmit={(e) => { e.preventDefault(); handleSendOTP(false); }} className="space-y-4">
                      <div className="relative">
                        <input
                          id="name"
                          type="text"
                          required
                          placeholder=" "
                          className="peer w-full bg-[#040e1b] text-white border border-cyan-500/30 focus:border-cyan-400 rounded-xl pt-5 pb-2 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition text-sm sm:text-base font-sans"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                        <label 
                          htmlFor="name" 
                          className="absolute left-4 top-1.5 text-[10px] sm:text-[11px] text-cyan-300 font-mono font-semibold tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-cyan-300 pointer-events-none"
                        >
                          Full Student Name
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !name.trim()}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black py-3.5 px-4 rounded-xl transition duration-200 mt-2 disabled:opacity-70 shadow-lg uppercase tracking-wider text-sm"
                      >
                        {loading ? "Sending Code..." : "Send Verification Code"}
                      </button>
                      
                      <div className="text-center mt-3">
                        <button type="button" onClick={() => setStep("EMAIL_ENTRY")} className="text-xs font-mono text-slate-400 hover:text-white transition">
                          ← Use another email
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {step === "EXISTING_ACCOUNT_OTP_SETUP" && (
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-serif mb-1">Account Setup</h2>
                    <p className="text-slate-400 text-xs sm:text-sm mb-5">Verify your email to complete initial password setup.</p>
                    
                    <form onSubmit={(e) => { e.preventDefault(); handleSendOTP(false); }} className="space-y-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black py-3.5 px-4 rounded-xl transition duration-200 shadow-lg uppercase tracking-wider text-sm"
                      >
                        {loading ? "Sending Code..." : "Send Verification Code"}
                      </button>
                      
                      <div className="text-center mt-3">
                        <button type="button" onClick={() => setStep("EMAIL_ENTRY")} className="text-xs font-mono text-slate-400 hover:text-white transition">
                          ← Use another email
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {(step === "OTP_VERIFICATION" || step === "PASSWORD_RESET_OTP") && (
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-serif mb-1">Verify Your Email</h2>
                    <p className="text-slate-400 text-xs sm:text-sm mb-4">
                      Enter the 6-digit verification code dispatched to:
                    </p>
                    <div className="mb-5 p-2 rounded-xl bg-white/[0.04] border border-cyan-500/30 text-xs font-mono text-cyan-300 font-bold break-all text-center">
                      {email}
                    </div>
                    
                    <form onSubmit={(e) => handleVerifyOTP(e, step === "OTP_VERIFICATION" ? "PASSWORD_CREATION" : "PASSWORD_RESET_CREATION")} className="space-y-4">
                      <div className="relative">
                        <input
                          id="otp"
                          type="text"
                          required
                          maxLength={6}
                          placeholder=" "
                          className="peer w-full bg-[#040e1b] text-white border border-cyan-500/40 focus:border-cyan-400 rounded-xl pt-5 pb-2 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition appearance-none text-2xl tracking-[0.6em] font-mono text-center font-bold"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        />
                        <label 
                          htmlFor="otp" 
                          className="absolute left-4 top-1.5 text-[10px] sm:text-[11px] text-cyan-300 font-mono font-semibold tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[11px] pointer-events-none w-full text-center"
                        >
                          6-Digit OTP Code
                        </label>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={loading || otp.length < 6}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black py-3.5 px-4 rounded-xl transition duration-200 mt-2 disabled:opacity-70 shadow-lg uppercase tracking-wider text-sm"
                      >
                        Verify OTP
                      </button>
                    </form>
                    
                    <div className="flex justify-between items-center text-xs font-mono mt-5 pt-3 border-t border-white/[0.08]">
                      <button 
                        type="button" 
                        onClick={() => handleSendOTP(step === "PASSWORD_RESET_OTP")} 
                        disabled={loading || resendCooldown > 0}
                        className="text-cyan-400 hover:text-cyan-300 hover:underline disabled:text-slate-500 disabled:no-underline"
                      >
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                      </button>
                      <button type="button" onClick={() => setStep("EMAIL_ENTRY")} className="text-slate-400 hover:text-white transition">
                        Change Email
                      </button>
                    </div>
                  </div>
                )}

                {(step === "PASSWORD_CREATION" || step === "PASSWORD_RESET_CREATION") && (
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-serif mb-1">
                      {step === "PASSWORD_CREATION" ? "Create Security Password" : "Create New Password"}
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm mb-4">Set a strong credential for your proctored exam portal.</p>
                    
                    <form onSubmit={step === "PASSWORD_CREATION" ? handleSetupAccount : handleResetPassword} className="space-y-4">
                      <div className="relative">
                        <input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder=" "
                          className="peer w-full bg-[#040e1b] text-white border border-cyan-500/30 focus:border-cyan-400 rounded-xl pt-5 pb-2 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition text-sm sm:text-base font-sans"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <label 
                          htmlFor="new-password" 
                          className="absolute left-4 top-1.5 text-[10px] sm:text-[11px] text-cyan-300 font-mono font-semibold tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-cyan-300 pointer-events-none"
                        >
                          New Password
                        </label>
                        <button
                          type="button"
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5 text-cyan-400" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          id="confirm-password"
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder=" "
                          className="peer w-full bg-[#040e1b] text-white border border-cyan-500/30 focus:border-cyan-400 rounded-xl pt-5 pb-2 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition text-sm sm:text-base font-sans"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <label 
                          htmlFor="confirm-password" 
                          className="absolute left-4 top-1.5 text-[10px] sm:text-[11px] text-cyan-300 font-mono font-semibold tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-cyan-300 pointer-events-none"
                        >
                          Confirm Password
                        </label>
                      </div>

                      {/* Password Requirements Checklist */}
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1.5 text-[11px] font-mono">
                        <div className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Security Standards:</div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className={`flex items-center gap-1.5 ${reqLength ? "text-emerald-400" : "text-slate-500"}`}>
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>8+ characters</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${reqUpper ? "text-emerald-400" : "text-slate-500"}`}>
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>Uppercase letter</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${reqLower ? "text-emerald-400" : "text-slate-500"}`}>
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>Lowercase letter</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${reqNumber ? "text-emerald-400" : "text-slate-500"}`}>
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>Number</span>
                          </div>
                          <div className={`flex items-center gap-1.5 col-span-2 ${reqSpecial ? "text-emerald-400" : "text-slate-500"}`}>
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>Special symbol (!@#$%^&*)</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !allReqsMet || password !== confirmPassword}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black py-3.5 px-4 rounded-xl transition duration-200 mt-2 disabled:opacity-50 shadow-lg uppercase tracking-wider text-sm flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-950" />
                        <span>{loading ? "Securing Account..." : "Finalize & Enter Platform"}</span>
                      </button>
                    </form>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

      </section>

      {/* ========================================================= */}
      {/* 2. MORE REASONS TO JOIN - LUXURY BENTO GRID SHOWCASE      */}
      {/* ========================================================= */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16 sm:py-24 border-t border-white/[0.08]">
        
        {/* Ambient background glows for bento */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Live Examination Sessions Broadcast Ticker */}
        <div className="relative mb-12 sm:mb-16 overflow-hidden rounded-2xl bg-gradient-to-r from-[#031526]/90 via-[#071d33]/90 to-[#031526]/90 border border-cyan-500/40 p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(0,210,255,0.15)] backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[10px] font-mono font-bold tracking-widest text-cyan-300 uppercase shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                PLATFORM BROADCAST
              </span>
              <p className="text-xs sm:text-sm text-slate-200 font-medium">
                <strong className="text-white font-bold">2026 Examination Sessions Active:</strong> Weekly timed mock tests for WBCHSE, CBSE, ISC, and JEE/NEET with immediate AI evaluation are now live!
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider bg-white/[0.05] border border-white/10 text-cyan-300 shrink-0">
              Session 2026–27
            </span>
          </div>
        </div>

        {/* Section Heading */}
        <div className="mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Advantages</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-serif italic">
            More reasons to join Piechem
          </h2>
          <p className="text-xs sm:text-base text-slate-400 font-light mt-2 max-w-2xl">
            A state-of-the-art chemistry ecosystem designed for rigorous board derivations and top-percentile competitive ranks.
          </p>
        </div>

        {/* 4 Bento Showcase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          
          {/* Card 1: Live Exam Simulation */}
          <div className="group relative rounded-3xl bg-gradient-to-br from-[#06182c]/90 via-[#030d17]/90 to-black/95 border border-cyan-500/25 hover:border-cyan-400/60 p-6 sm:p-7 flex flex-col justify-between shadow-xl hover:shadow-[0_20px_45px_rgba(0,210,255,0.18)] hover:-translate-y-1.5 transition-all duration-300 backdrop-blur-xl overflow-hidden min-h-[300px]">
            {/* Top accent highlight */}
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent group-hover:via-cyan-400 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 uppercase">
                  TIMED EXAM SERIES
                </span>
              </div>
              <h3 className="text-xl font-black text-white mb-2.5 font-serif group-hover:text-cyan-200 transition-colors">
                Live Exam Simulation
              </h3>
              <p className="text-xs sm:text-sm text-slate-300/80 font-light leading-relaxed">
                Attempt authentic board and competitive mock papers with negative marking, custom timers, and question shuffling.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between">
              <span className="text-[11px] font-mono text-cyan-400 font-medium">Automatic Scoring</span>
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,242,254,0.2)] group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </div>

          {/* Card 2: AI Proctoring & Integrity */}
          <div className="group relative rounded-3xl bg-gradient-to-br from-[#120a24]/90 via-[#070312]/90 to-black/95 border border-purple-500/25 hover:border-purple-400/60 p-6 sm:p-7 flex flex-col justify-between shadow-xl hover:shadow-[0_20px_45px_rgba(168,85,247,0.18)] hover:-translate-y-1.5 transition-all duration-300 backdrop-blur-xl overflow-hidden min-h-[300px]">
            {/* Top accent highlight */}
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-purple-400/50 to-transparent group-hover:via-purple-400 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 uppercase">
                  TAMPER-PROOF GUARD
                </span>
              </div>
              <h3 className="text-xl font-black text-white mb-2.5 font-serif group-hover:text-purple-200 transition-colors">
                AI Proctoring & Integrity
              </h3>
              <p className="text-xs sm:text-sm text-slate-300/80 font-light leading-relaxed">
                Automated full-screen lock and tab monitoring ensure a tamper-free test environment and credible benchmark rankings.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between">
              <span className="text-[11px] font-mono text-purple-400 font-medium">Single-Device Lock</span>
              <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)] group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Card 3: PIECHEM Molecular Lab */}
          <div className="group relative rounded-3xl bg-gradient-to-br from-[#051c24]/90 via-[#020e13]/90 to-black/95 border border-teal-500/30 hover:border-teal-400/60 p-6 sm:p-7 flex flex-col justify-between shadow-xl hover:shadow-[0_20px_45px_rgba(20,184,166,0.22)] hover:-translate-y-1.5 transition-all duration-300 backdrop-blur-xl overflow-hidden min-h-[300px]">
            {/* Top accent highlight */}
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-teal-400/50 to-transparent group-hover:via-teal-400 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full bg-teal-950/80 border border-teal-500/40 text-teal-300 uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  3D Interactive
                </span>
              </div>
              <h3 className="text-xl font-black text-white mb-2.5 font-serif group-hover:text-teal-200 transition-colors">
                PIECHEM Molecular Lab
              </h3>
              <p className="text-xs sm:text-sm text-slate-300/80 font-light leading-relaxed">
                Rotate crystal lattices, examine VSEPR spatial bond angles, and inspect unit cell voids in immersive real-time 3D.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between">
              <Link
                href="/3d-animations"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-teal-300 hover:text-white transition-colors"
              >
                <span>Explore 3D Lab</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
              <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-300 shadow-[0_0_18px_rgba(20,184,166,0.25)] group-hover:scale-110 transition-transform">
                <Atom className="w-5 h-5 text-teal-400 animate-spin [animation-duration:12s]" />
              </div>
            </div>
          </div>

          {/* Card 4: Academic Study Repository */}
          <div className="group relative rounded-3xl bg-gradient-to-br from-[#1f1704]/90 via-[#0e0a02]/90 to-black/95 border border-amber-500/30 hover:border-amber-400/60 p-6 sm:p-7 flex flex-col justify-between shadow-xl hover:shadow-[0_20px_45px_rgba(245,158,11,0.22)] hover:-translate-y-1.5 transition-all duration-300 backdrop-blur-xl overflow-hidden min-h-[300px]">
            {/* Top accent highlight */}
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent group-hover:via-amber-400 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 uppercase">
                  CBSE • ICSE • WBCHSE
                </span>
              </div>
              <h3 className="text-xl font-black text-white mb-2.5 font-serif group-hover:text-amber-200 transition-colors">
                Academic Study Repository
              </h3>
              <p className="text-xs sm:text-sm text-slate-300/80 font-light leading-relaxed">
                Structured chapter-wise notes, DPPs, PYQs, and semester question banks organized strictly by board and curriculum.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between">
              <Link
                href="/study-material"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 hover:text-white transition-colors"
              >
                <span>Browse Materials</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.25)] group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* 3. ULTRA-LUXE SCIENTIFIC FOOTER                           */}
      {/* ========================================================= */}
      <footer className="w-full bg-[#01040a]/95 border-t border-white/[0.08] backdrop-blur-2xl py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
            {/* Left: Designer Attribution & Hotline */}
            <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F2FE]" />
                <span className="text-xs font-mono text-slate-300">
                  Questions?
                </span>
              </div>
              <a
                href="tel:9830507435"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-300 transition-all font-mono text-xs font-semibold shadow-sm"
              >
                <Phone className="w-3 h-3 fill-current text-cyan-400" />
                <span>9830507435</span>
                <span className="text-cyan-500/60 font-normal">(Arghyadeep Roy)</span>
              </a>
            </div>

            {/* Right: Security & Compliance Badges */}
            <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI-Proctored</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                <span>Single-Device Lock</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Atom className="w-3.5 h-3.5 text-emerald-400" />
                <span>Piechem Engine</span>
              </span>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
            <div>
              © 2026 PIE CHEM Platform. Precision Chemistry Learning Ecosystem.
            </div>
            <div className="flex items-center gap-5 text-slate-400">
              <Link href="/study-material" className="hover:text-cyan-300 transition-colors">
                Curriculum Archive
              </Link>
              <span>•</span>
              <Link href="/3d-animations" className="hover:text-cyan-300 transition-colors">
                3D Molecular Lab
              </Link>
              <span>•</span>
              <Link href="/admin" className="hover:text-cyan-300 transition-colors">
                Faculty Portal
              </Link>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
