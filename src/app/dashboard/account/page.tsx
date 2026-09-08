"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Copy, Check, X, User, Mail, Phone, ShieldCheck, 
  ArrowLeft, KeyRound, CheckCircle2, AlertCircle, LogOut, Sparkles, 
  Clock, RefreshCw, CreditCard, MonitorSmartphone, ChevronRight, 
  ChevronDown, Layers, Laptop, Shield, CheckCircle
} from "lucide-react";
import AdminPreviewBanner from "@/components/AdminPreviewBanner";
import PiechemLogo from "@/components/PiechemLogo";
import PiFiringLoader from "@/components/PiFiringLoader";
import SubscriptionExpiredModal from "@/components/SubscriptionExpiredModal";

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

export default function StudentAccountPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "membership" | "security" | "devices" | "profiles">("overview");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Unisex Avatar Options
  const AVATAR_OPTIONS = [
    { id: "atom", name: "Quantum Atom", url: "/avatars/atom.jpg" },
    { id: "beaker", name: "Magic Beaker", url: "/avatars/beaker.jpg" },
    { id: "dna", name: "Bio Helix", url: "/avatars/dna.jpg" },
    { id: "scholar", name: "Cyber Scholar", url: "/avatars/scholar.jpg" },
    { id: "crystal", name: "Solid Crystal", url: "/avatars/crystal.jpg" },
  ];

  // Profile Details Form States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("Male");
  const [dob, setDob] = useState("");
  const [board, setBoard] = useState("CBSE");
  const [academicLevel, setAcademicLevel] = useState("11");
  const [avatarUrl, setAvatarUrl] = useState("/avatars/atom.jpg");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Upgrade Request State
  const [upgradeReq, setUpgradeReq] = useState<any>(null);
  const [paymentSettings, setPaymentSettings] = useState<any>({ upiId: "9830507435@upi", payeeName: "Arghyadeep Roy", monthlyFee: 199.0 });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHighestPlanModal, setShowHighestPlanModal] = useState(false);
  const [studentUpiId, setStudentUpiId] = useState("");
  const [paymentStep, setPaymentStep] = useState<"input" | "waiting" | "success">("input");
  const [utrNumber, setUtrNumber] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [requestingUpgrade, setRequestingUpgrade] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password Change Form States
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordOtp, setPasswordOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSentMsg, setOtpSentMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Security Policy Requirements
  const reqLength = newPassword.length >= 8;
  const reqUpper = /[A-Z]/.test(newPassword);
  const reqLower = /[a-z]/.test(newPassword);
  const reqNumber = /[0-9]/.test(newPassword);
  const reqSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const allReqsMet = reqLength && reqUpper && reqLower && reqNumber && reqSpecial;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const router = useRouter();

  const fetchUpgradeRequest = () => {
    fetch("/api/student/upgrade-request")
      .then((res) => res.json())
      .then((d) => {
        if (d.request) setUpgradeReq(d.request);
        if (d.paymentSettings) setPaymentSettings(d.paymentSettings);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#renew") {
      setShowPaymentModal(true);
      setActiveTab("membership");
    }
    fetchUpgradeRequest();
  }, []);

  // Auto-polling when payment modal is open in "waiting" step to detect approval in real-time
  useEffect(() => {
    if (!showPaymentModal || paymentStep !== "waiting") return;

    const interval = setInterval(async () => {
      try {
        const [dashRes, upgRes] = await Promise.all([
          fetch("/api/student/dashboard"),
          fetch("/api/student/upgrade-request")
        ]);

        if (dashRes.ok) {
          const dashData = await dashRes.json();
          if (dashData?.student?.subscriptionStatus === "PAID" || dashData?.student?.subscriptionStatus === "COMPLIMENTARY") {
            setData(dashData);
            setPaymentStep("success");
            return;
          }
        }

        if (upgRes.ok) {
          const upgData = await upgRes.json();
          if (upgData?.request) {
            setUpgradeReq(upgData.request);
            if (upgData.request.status === "APPROVED") {
              setPaymentStep("success");
            }
          }
        }
      } catch (err) {
        // silent
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [showPaymentModal, paymentStep]);

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((resData) => {
        setData(resData);
        if (resData.student) {
          setName(resData.student.name || "");
          setPhone(resData.student.phone || "");
          setEmail(resData.student.email || "");
          setGender(resData.student.gender || "Male");
          setDob(resData.student.dob ? new Date(resData.student.dob).toISOString().split("T")[0] : "");
          const b = resData.student.board || "CBSE";
          setBoard(b);
          setAcademicLevel(resData.student.academicLevel || (b === "WBCHSE" ? "SEM-I" : "11"));
          setAvatarUrl(resData.student.avatarUrl || "/avatars/atom.jpg");
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);
  const handleSendUpgradeRequest = async () => {
    const trimmedUpi = studentUpiId.trim();
    if (!trimmedUpi) {
      setUpgradeMsg({ type: "error", text: "Please enter the UPI ID from which you will initiate the payment." });
      return;
    }
    if (!trimmedUpi.includes("@") || trimmedUpi.startsWith("@") || trimmedUpi.endsWith("@")) {
      setUpgradeMsg({ type: "error", text: "Please enter a valid UPI ID format (e.g. username@okhdfcbank or 9830507435@upi)." });
      return;
    }
    setRequestingUpgrade(true);
    setUpgradeMsg(null);

    try {
      const res = await fetch("/api/student/upgrade-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          studentUpiId: trimmedUpi, 
          amount: paymentSettings?.monthlyFee || 199.0 
        })
      });
      const resData = await res.json();

      if (res.ok) {
        setUpgradeMsg({ type: "success", text: resData.message || "Payment request sent successfully!" });
        setUpgradeReq(resData.request);
        setPaymentStep("waiting");
      } else {
        setUpgradeMsg({ type: "error", text: resData.error || "Failed to initiate payment request." });
      }
    } catch (err) {
      setUpgradeMsg({ type: "error", text: "Network error initiating payment request." });
    } finally {
      setRequestingUpgrade(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);

    try {
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          gender,
          dob,
          board,
          academicLevel,
          avatarUrl
        })
      });

      const resData = await res.json();

      if (res.ok) {
        const levelLabel = board === "WBCHSE" ? academicLevel : `Class ${academicLevel}`;
        setProfileMsg({ type: "success", text: `Profile updated successfully! Board set to ${board} (${levelLabel}).` });
        if (resData.student) {
          setData((prev: any) => ({
            ...prev,
            student: {
              ...prev.student,
              ...resData.student
            }
          }));
        }
      } else {
        setProfileMsg({ type: "error", text: resData.error || "Failed to save profile details." });
      }
    } catch (err) {
      setProfileMsg({ type: "error", text: "Something went wrong saving profile details." });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSendPasswordOtp = async () => {
    setSendingOtp(true);
    setOtpSentMsg(null);
    setPassMsg(null);

    try {
      const res = await fetch("/api/auth/student/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), name })
      });
      const resData = await res.json();

      if (res.ok) {
        setOtpSentMsg(`Verification OTP sent to ${email}. Please check your inbox.`);
        setResendCooldown(30);
      } else {
        setPassMsg({ type: "error", text: resData.error || "Failed to send OTP to email." });
      }
    } catch (err) {
      setPassMsg({ type: "error", text: "Network error sending OTP code." });
    } finally {
      setSendingOtp(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    if (!passwordOtp) {
      setPassMsg({ type: "error", text: "Please enter the verification OTP sent to your email." });
      return;
    }

    if (!allReqsMet) {
      setPassMsg({ type: "error", text: "Your new password does not meet the security policy requirements." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassMsg({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    setPassLoading(true);

    try {
      const res = await fetch("/api/student/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: oldPassword,
          otp: passwordOtp,
          newPassword
        })
      });
      const resData = await res.json();

      if (res.ok) {
        setPassMsg({ type: "success", text: "Password updated successfully!" });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordOtp("");
        setOtpSentMsg(null);
      } else {
        setPassMsg({ type: "error", text: resData.error || "Failed to update password." });
      }
    } catch (err) {
      setPassMsg({ type: "error", text: "Something went wrong while updating password." });
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = async () => {
    document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (loading || !data) return <PiFiringLoader fullScreen={true} />;

  const { student, allAttempts = [] } = data;
  const completedAttempts = allAttempts.filter((a: any) => a.status === "SUBMITTED");
  const isGold = student.subscriptionStatus === "PAID" || student.subscriptionStatus === "COMPLIMENTARY";

  // Check if student is currently at the highest plan available
  // Currently, 1 paid plan exists: Gold Membership
  // If admin ever provides multiple active plans, check if student has reached the top tier
  const availablePlans = paymentSettings?.plans || [
    { id: "free", name: "Basic Student Plan", tier: 0 },
    { id: "gold", name: "Gold Membership", tier: 1 }
  ];
  const maxTier = Math.max(...availablePlans.map((p: any) => p.tier ?? 1), 1);
  const studentTier = isGold ? 1 : 0;
  const isAtHighestPlan = studentTier >= maxTier;

  const handleChangePlanClick = () => {
    if (isAtHighestPlan) {
      setShowHighestPlanModal(true);
    } else {
      setShowPaymentModal(true);
      fetchUpgradeRequest();
    }
  };

  const memberSinceFormatted = (() => {
    if (!student.createdAt) return "-";
    const d = new Date(student.createdAt);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  })();

  const nextPaymentFormatted = student.subscriptionExpiresAt
    ? new Date(student.subscriptionExpiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "Never (Lifetime Pass)";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07131e] via-[#040911] to-black text-white font-sans selection:bg-cyan-500 selection:text-black pb-24">
      <AdminPreviewBanner />
      <SubscriptionExpiredModal student={student} />

      {/* 1. TOP NAVBAR (ELECTRIC BLACKISH-BLUE THEME) */}
      <header className="sticky top-0 z-40 bg-[#030910]/95 backdrop-blur-2xl border-b border-cyan-500/20 shadow-[0_10px_35px_rgba(0,0,0,0.7)]">
        <div className="w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Left: Brand Identity & Designer Attribution */}
          <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
            <PiechemLogo size="md" theme="dark" href="/dashboard" />
            
            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-[#061421]/90 text-[9px] sm:text-[10px] text-slate-300 font-medium shadow-sm shrink-0">
              <span className="text-slate-400">Designed by</span>
              <span className="font-semibold text-cyan-400">Arghyadeep Roy</span>
              <span className="text-cyan-500/60">•</span>
              <a 
                href="tel:9830507435" 
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 hover:text-white border border-cyan-500/40 transition font-mono text-[9px]"
                title="Call Arghyadeep Roy"
              >
                <Phone className="w-2.5 h-2.5 text-cyan-400 fill-current" />
                <span>9830507435</span>
              </a>
            </div>
          </div>

          {/* Right: Netflix-Style Profile Dropdown Trigger */}
          <div className="relative flex items-center gap-3 shrink-0">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-white/5 transition cursor-pointer group"
              title="Account Menu"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-cyan-950 ring-1 ring-cyan-500/40 group-hover:ring-cyan-400 transition shrink-0">
                <img
                  src={student?.avatarUrl || "/avatars/atom.jpg"}
                  alt={student?.name || "Avatar"}
                  className="w-full h-full object-cover"
                />
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-cyan-300 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-12 w-64 bg-[#061421]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-cyan-500/30 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-cyan-500/15">
                  <p className="text-sm font-bold text-white truncate">{student.name || "Student"}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">{student.email}</p>
                  <div className="mt-2">
                    {isGold ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                        <Sparkles className="w-3 h-3 text-amber-400" /> Gold Member
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                        Free Account
                      </span>
                    )}
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-cyan-950/50 hover:text-white transition"
                  >
                    <ArrowLeft className="w-4 h-4 text-cyan-400" />
                    <span>Back to Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setActiveTab("profiles");
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-cyan-950/50 hover:text-white transition text-left cursor-pointer"
                  >
                    <User className="w-4 h-4 text-cyan-400" />
                    <span>Edit Profile Details</span>
                  </button>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setActiveTab("security");
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-cyan-950/50 hover:text-white transition text-left cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    <span>Security & Password</span>
                  </button>
                </div>

                <div className="border-t border-cyan-500/15 pt-1 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-950/30 transition text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Sign out of Piechem</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      {/* 2. MAIN LAYOUT (FULL SCREEN NETFLIX ACCOUNT SETTINGS PAGE) */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 sm:space-y-8">
        
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-400 hover:text-cyan-300 transition group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </Link>

          {activeTab !== "overview" && (
            <button
              onClick={() => setActiveTab("overview")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-bold transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Overview</span>
            </button>
          )}
        </div>

            
            {/* Header Titles */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Account
              </h1>
              <p className="text-sm font-medium text-slate-400 mt-1">
                Membership details
              </p>
            </div>

            {/* VIEW A: OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                
                {/* 1. The Iconic Netflix Membership Box (Electric Blue Style) */}
                <div className="bg-gradient-to-b from-[#0a1726]/90 via-[#07111c]/90 to-[#03080e]/95 rounded-2xl border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.12)] p-6 sm:p-7 relative overflow-hidden transition hover:border-cyan-500/50">
                  
                  {/* Member Since Badge */}
                  <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-gradient-to-r from-[#221f52] via-[#4a1236] to-[#6d132c] border border-purple-500/40 text-white text-xs font-semibold shadow-md mb-4">
                    Member since {memberSinceFormatted}
                  </div>

                  {/* Plan Name & Type */}
                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {isGold ? "Premium plan" : "Basic Student Plan"}
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-cyan-400">
                      {isGold 
                        ? (student.subscriptionExpiresAt ? "Active 30-Day Gold Membership" : "Lifetime Unlimited Pass")
                        : "Free Tier / Practice Account"}
                    </p>
                  </div>

                  {/* Payment / Renewal Info */}
                  <div className="pt-3 text-sm text-slate-300 font-medium space-y-2">
                    <p>
                      {isGold ? (
                        <>
                          <span className="text-slate-400">First payment / Next renewal: </span>
                          <span className="font-bold text-amber-300 font-mono">{nextPaymentFormatted}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-400">Status: </span>
                          <span className="font-bold text-cyan-300">Upgrade anytime for unlimited test series & proctored analytics</span>
                        </>
                      )}
                    </p>

                    {/* Payment Handle Pill (UPI / Card) */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#061421] border border-cyan-500/40 text-xs font-mono font-medium text-slate-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="font-bold text-cyan-400">UPI</span>
                        <span>{paymentSettings?.upiId || "9830507435@upi"}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        Payee: {paymentSettings?.payeeName || "Arghyadeep Roy"} (₹{paymentSettings?.monthlyFee || 199}/mo)
                      </span>
                    </div>
                  </div>

                  {/* Divider & Manage Membership Link Row */}
                  <div className="pt-5 mt-5 border-t border-cyan-500/15 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setShowPaymentModal(true);
                        fetchUpgradeRequest();
                      }}
                      className="w-full flex items-center justify-between text-sm font-bold text-white hover:text-cyan-300 transition group cursor-pointer text-left py-1"
                    >
                      <span>Manage membership</span>
                      <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
                {/* 2. Quick Links Card (Electric Blue Style) */}
                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Quick links
                  </h3>

                  <div className="bg-gradient-to-b from-[#0a1726]/90 via-[#07111c]/90 to-[#03080e]/95 rounded-2xl border border-cyan-500/30 shadow-xl divide-y divide-cyan-500/15 overflow-hidden">
                    
                    {/* Change Plan */}
                    <button
                      onClick={handleChangePlanClick}
                      className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-cyan-950/40 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 group-hover:scale-105 transition">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition block">
                            Change plan
                          </span>
                          <span className="text-xs text-slate-400 font-normal">
                            {isAtHighestPlan 
                              ? "You are at the highest enrolled plan (Gold Membership)"
                              : "Upgrade to Gold Pass or renew current active membership"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-cyan-500/70 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    

                    {/* Manage Access and Devices */}
                    <button
                      onClick={() => setActiveTab("devices")}
                      className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-cyan-950/40 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 group-hover:scale-105 transition">
                          <MonitorSmartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition block">
                            Manage access and devices
                          </span>
                          <span className="text-xs text-slate-400 font-normal">
                            View active sessions, proctoring security status & signed-in browsers
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-cyan-500/70 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Edit Student Profile & Curriculum */}
                    <button
                      onClick={() => setActiveTab("profiles")}
                      className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-cyan-950/40 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 group-hover:scale-105 transition">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition block">
                            Edit student & academic profile
                          </span>
                          <span className="text-xs text-slate-400 font-normal">
                            Change avatar, update student name, phone, CBSE / ICSE / WBCHSE board
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-cyan-500/70 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Update Password & Security */}
                    <button
                      onClick={() => setActiveTab("security")}
                      className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-cyan-950/40 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 group-hover:scale-105 transition">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition block">
                            Update password & credentials
                          </span>
                          <span className="text-xs text-slate-400 font-normal">
                            Send verification OTP to email and set a new strong password
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-cyan-500/70 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* 3. Summary Profile Spotlight */}
                <div className="bg-gradient-to-b from-[#0a1726]/90 via-[#07111c]/90 to-[#03080e]/95 rounded-2xl border border-cyan-500/30 shadow-xl p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-cyan-950 ring-2 ring-cyan-500/40 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                      <img
                        src={avatarUrl || "/avatars/atom.jpg"}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{name || "Student"}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{email}</p>
                      <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                        <span className="text-xs font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/40">
                          {board} ({board === "WBCHSE" ? academicLevel : `Class ${academicLevel}`})
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          • {completedAttempts.length} Tests Attempted
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab("profiles")}
                    className="px-4 py-2 rounded-xl border border-cyan-500/40 text-xs font-bold text-cyan-300 hover:bg-cyan-950/60 hover:text-white transition cursor-pointer shrink-0"
                  >
                    Edit Profile
                  </button>
                </div>

              </div>
            )}

            {/* VIEW B: MEMBERSHIP TAB */}
            {activeTab === "membership" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Membership Overview Card */}
                <div className="bg-gradient-to-b from-[#0a1726]/90 via-[#07111c]/90 to-[#03080e]/95 rounded-2xl border border-cyan-500/30 shadow-xl p-6 sm:p-7 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/15 pb-5">
                    <div>
                      <span className="text-xs font-extrabold tracking-wider uppercase text-slate-400 block mb-1">
                        Current Plan
                      </span>
                      <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        {isGold ? "Gold Membership (Unlimited)" : "Free Student Tier"}
                        {isGold && <Sparkles className="w-5 h-5 text-amber-400" />}
                      </h2>
                    </div>

                    <div>
                      {isGold ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                          <CheckCircle className="w-3.5 h-3.5 text-amber-400" /> Active Subscription
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                          Free Account
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/20">
                      <span className="text-slate-400 block">Monthly Rate</span>
                      <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">
                        ₹{paymentSettings?.monthlyFee || 199} <span className="text-xs font-normal text-slate-400">/ 30 Days</span>
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/20">
                      <span className="text-slate-400 block">Payment Details</span>
                      <span className="text-sm font-bold text-slate-200 truncate block mt-1 font-mono">
                        {paymentSettings?.upiId || "9830507435@upi"}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/20">
                      <span className="text-slate-400 block">Next Payment / Expiry</span>
                      <span className="text-sm font-bold text-amber-300 font-mono mt-1 block">
                        {nextPaymentFormatted}
                      </span>
                    </div>
                  </div>

                  {/* Pending Upgrade Alert */}
                  {upgradeReq?.status === "PENDING" && (
                    <div className="p-4 rounded-xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                      <Clock className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
                      <div>
                        <strong className="font-bold text-amber-300 block">Upgrade Verification Pending</strong>
                        <p className="mt-0.5 text-amber-200/80">
                          Your UTR submission (<span className="font-mono font-bold text-white">{upgradeReq.utrNumber}</span>) has been received and is being verified by Admin.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        setShowPaymentModal(true);
                        fetchUpgradeRequest();
                      }}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-98 cursor-pointer"
                    >
                      {isGold ? "Renew / Extend Gold Pass" : "Upgrade to Gold Membership (₹99)"}
                    </button>
                  </div>
                </div>

                {/* Plan Benefits Checklist */}
                <div className="bg-gradient-to-b from-[#0a1726]/90 via-[#07111c]/90 to-[#03080e]/95 rounded-2xl border border-cyan-500/30 shadow-xl p-6 sm:p-7 space-y-4">
                  <h3 className="text-base font-bold text-white">What is included in Gold Membership</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Full Access to All Chemistry Exam Tests</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Instant Step-by-Step Answer Explanations</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Proctored Ranking & Percentile Analytics</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Direct Admin Activation & Phone Support</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
            {/* VIEW C: SECURITY TAB */}
            {activeTab === "security" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                <div className="bg-gradient-to-b from-[#0a1726]/90 via-[#07111c]/90 to-[#03080e]/95 rounded-2xl border border-cyan-500/30 shadow-xl p-6 sm:p-7 space-y-6">
                  
                  <div className="border-b border-cyan-500/15 pb-4">
                    <h2 className="text-xl font-bold text-white">Security & Password</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Update your account credentials to protect your proctored exam history.
                    </p>
                  </div>

                  {/* Email OTP Verification Section */}
                  <div className="bg-slate-950/80 p-4 sm:p-5 rounded-xl border border-cyan-500/30 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider">
                          Email OTP Verification Required
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          To change your password, send a 6-digit code to <strong className="text-white font-mono">{email}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendPasswordOtp}
                        disabled={sendingOtp || resendCooldown > 0}
                        className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 hover:text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                      >
                        {sendingOtp ? "Sending OTP..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Send Email OTP"}
                      </button>
                    </div>

                    {otpSentMsg && (
                      <div className="p-3 rounded-lg bg-green-950/80 border border-green-600/50 text-green-300 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                        <span>{otpSentMsg}</span>
                      </div>
                    )}
                  </div>

                  {/* Feedback Message */}
                  {passMsg && (
                    <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 border ${
                      passMsg.type === "success"
                        ? "bg-green-950/80 border-green-600/60 text-green-300"
                        : "bg-red-950/80 border-red-600/60 text-red-300"
                    }`}>
                      {passMsg.type === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                      )}
                      <span>{passMsg.text}</span>
                    </div>
                  )}

                  {/* Password Form */}
                  <form onSubmit={handlePasswordChange} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* OTP Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex justify-between">
                          <span>Verification OTP *</span>
                          <span className="text-[11px] text-slate-500 font-normal">6 digits</span>
                        </label>
                        <input
                          type="text"
                          value={passwordOtp}
                          onChange={(e) => setPasswordOtp(e.target.value)}
                          placeholder="Enter 6-digit OTP"
                          className="w-full bg-slate-950/90 border border-cyan-500/40 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white font-mono tracking-wider outline-none transition focus:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                        />
                      </div>

                      {/* Current Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Current Password (Optional)
                        </label>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="Enter current password if set"
                          className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* New Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          New Password *
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Create strong password"
                          className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition"
                        />
                      </div>

                      {/* Confirm New Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex justify-between">
                          <span>Confirm New Password *</span>
                          {confirmPassword && (
                            <span className={`text-[11px] font-bold ${newPassword === confirmPassword ? "text-emerald-400" : "text-red-400"}`}>
                              {newPassword === confirmPassword ? "✓ Match" : "✗ Mismatch"}
                            </span>
                          )}
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Password Policy Checklist */}
                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Security Requirements:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className={`flex items-center gap-1.5 ${reqLength ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
                          <span>{reqLength ? "✓" : "○"}</span> 8+ Characters
                        </div>
                        <div className={`flex items-center gap-1.5 ${reqUpper ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
                          <span>{reqUpper ? "✓" : "○"}</span> 1 Uppercase (A-Z)
                        </div>
                        <div className={`flex items-center gap-1.5 ${reqLower ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
                          <span>{reqLower ? "✓" : "○"}</span> 1 Lowercase (a-z)
                        </div>
                        <div className={`flex items-center gap-1.5 ${reqNumber ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
                          <span>{reqNumber ? "✓" : "○"}</span> 1 Number (0-9)
                        </div>
                        <div className={`flex items-center gap-1.5 ${reqSpecial ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
                          <span>{reqSpecial ? "✓" : "○"}</span> 1 Special Char
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={passLoading || !passwordOtp || !allReqsMet || newPassword !== confirmPassword}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {passLoading ? "Updating Password..." : "Update Password"}
                      </button>
                    </div>
                  </form>

                </div>

              </div>
            )}
            {/* VIEW D: PROFILES TAB */}
            {activeTab === "profiles" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                <div className="bg-gradient-to-b from-[#0a1726]/90 via-[#07111c]/90 to-[#03080e]/95 rounded-2xl border border-cyan-500/30 shadow-xl p-6 sm:p-7 space-y-6">
                  
                  <div className="border-b border-cyan-500/15 pb-4">
                    <h2 className="text-xl font-bold text-white">Student & Academic Profile</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Customize your display avatar and update your board details to receive personalized exam recommendations.
                    </p>
                  </div>

                  {/* Feedback Message */}
                  {profileMsg && (
                    <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 border ${
                      profileMsg.type === "success"
                        ? "bg-green-950/80 border-green-600/60 text-green-300"
                        : "bg-red-950/80 border-red-600/60 text-red-300"
                    }`}>
                      {profileMsg.type === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                      )}
                      <span>{profileMsg.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleProfileSave} className="space-y-6">
                    
                    {/* Avatar Picker */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Choose Avatar Icon
                      </label>
                      <div className="grid grid-cols-5 gap-3 max-w-sm">
                        {AVATAR_OPTIONS.map((av) => {
                          const isSelected = avatarUrl === av.url;
                          return (
                            <button
                              key={av.id}
                              type="button"
                              onClick={() => setAvatarUrl(av.url)}
                              className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                                isSelected
                                  ? "border-cyan-400 ring-2 ring-cyan-500/50 scale-105 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                                  : "border-slate-800 hover:border-cyan-500/50 opacity-70 hover:opacity-100"
                              }`}
                              title={av.name}
                            >
                              <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                              {isSelected && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-cyan-500 text-slate-950 rounded-full flex items-center justify-center text-[9px] font-black">
                                  ✓
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Student Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your name"
                          className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="10-digit mobile number"
                          className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none transition"
                        />
                      </div>

                      {/* Mail ID (Read-only) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Registered Email (Read-only)
                        </label>
                        <input
                          type="email"
                          value={email}
                          disabled
                          className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-400 font-mono cursor-not-allowed"
                        />
                      </div>

                      {/* Gender */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Gender
                        </label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>

                      {/* Date of Birth */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition cursor-pointer"
                        />
                      </div>

                      {/* Board */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Education Board
                        </label>
                        <select
                          value={board}
                          onChange={(e) => {
                            const newBoard = e.target.value;
                            setBoard(newBoard);
                            if (newBoard === "WBCHSE") {
                              setAcademicLevel("SEM-I");
                            } else {
                              setAcademicLevel("11");
                            }
                          }}
                          className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition cursor-pointer font-bold text-cyan-300"
                        >
                          <option value="CBSE">CBSE</option>
                          <option value="ICSE">ICSE</option>
                          <option value="WBCHSE">WBCHSE</option>
                        </select>
                      </div>

                      {/* Dynamic Academic Level (Class or Semester) */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                          {board === "WBCHSE" ? "Semester (WBCHSE Curriculum)" : `Class (${board})`}
                        </label>
                        {board === "WBCHSE" ? (
                          <select
                            value={academicLevel}
                            onChange={(e) => setAcademicLevel(e.target.value)}
                            className="w-full bg-slate-950/90 border border-cyan-500/40 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition cursor-pointer font-bold text-cyan-300"
                          >
                            <option value="SEM-I">SEM-I</option>
                            <option value="SEM-II">SEM-II</option>
                            <option value="SEM-III">SEM-III</option>
                            <option value="SEM-IV">SEM-IV</option>
                          </select>
                        ) : (
                          <select
                            value={academicLevel}
                            onChange={(e) => setAcademicLevel(e.target.value)}
                            className="w-full bg-slate-950/90 border border-cyan-500/40 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition cursor-pointer font-bold text-cyan-300"
                          >
                            <option value="11">Class 11</option>
                            <option value="12">Class 12</option>
                          </select>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-[0_0_20px_rgba(20,184,166,0.3)] disabled:opacity-50 cursor-pointer flex items-center gap-2 active:scale-98"
                      >
                        {profileLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>{profileLoading ? "Saving..." : "Save Profile Details"}</span>
                      </button>
                    </div>
                  </form>

                </div>

              </div>
            )}

            {/* VIEW E: DEVICES TAB */}
            {activeTab === "devices" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                <div className="bg-gradient-to-b from-[#0a1726]/90 via-[#07111c]/90 to-[#03080e]/95 rounded-2xl border border-cyan-500/30 shadow-xl p-6 sm:p-7 space-y-6">
                  
                  <div className="border-b border-cyan-500/15 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-white">Access & Devices</h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Review active browsers and security devices connected to your student profile.
                      </p>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-400 text-xs font-bold transition self-start sm:self-auto cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out of all sessions</span>
                    </button>
                  </div>

                  {/* Active Device Card */}
                  <div className="p-5 rounded-xl border border-cyan-500/20 bg-slate-950/80 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="p-3 rounded-xl bg-[#061421] border border-cyan-500/30 shadow-sm text-cyan-400 shrink-0">
                        <Laptop className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">Current Active Web Browser</h4>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Now
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-mono">
                          Account: {student.email}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Last session refresh: {formatDateTime24(new Date())}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Proctoring & Integrity Details */}
                  <div className="p-5 rounded-xl border border-cyan-500/20 bg-slate-950/80 space-y-3">
                    <h4 className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      Exam Integrity & Security Posture
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#061421] border border-cyan-500/20">
                        <span>Anti-Cheat Proctoring:</span>
                        <span className="font-bold text-emerald-400">VERIFIED ACTIVE</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#061421] border border-cyan-500/20">
                        <span>Completed Attempts:</span>
                        <span className="font-mono font-bold text-white">{completedAttempts.length} Submitted</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

      </main>
      {/* 3. INSTANT UPI QR CODE MODAL (ELECTRIC BLACKISH BLUE THEME) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#0a1726] via-[#07111c] to-[#03080e] text-white rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.3)] border border-cyan-500/40 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 sm:p-7 border-b border-cyan-500/20 flex items-center justify-between bg-[#061421]/90">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold mb-1 shadow">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Instant UPI Activation</span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Pay with UPI
                </h3>
              </div>

              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentStep("input");
                  setUpgradeMsg(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-7 space-y-5">

              {/* Plan & Pricing Box */}
              <div className="bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Gold Membership
                    </div>
                    <h4 className="text-base font-black text-white">30 Days All-Access Pass</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      All 50+ Chemistry Exams, 3D Molecular Models, Full Solutions & Proctored Analytics
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      ₹{paymentSettings?.monthlyFee || 199}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-normal">/ 30 Days</span>
                  </div>
                </div>
              </div>

              {/* State: INPUT STEP */}
              {paymentStep === "input" && (
                <div className="space-y-4">
                  
                  {/* Explicit Mandatory Requirement Instruction */}
                  <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-3">
                    <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-cyan-200">
                        Please enter the UPI ID using which you will initiate the payment.
                      </p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Once entered, you can complete the payment directly via Mobile App or by scanning the Dynamic UPI QR Code (with fixed amount ₹{paymentSettings?.monthlyFee || 199}) on PC / Laptop.
                      </p>
                    </div>
                  </div>

                  {/* UPI ID Input Field */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Your UPI ID (VPA):</span>
                      <span className="text-[11px] font-normal text-slate-400 font-mono">e.g. mobile@upi or name@oksbi</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={studentUpiId}
                        onChange={(e) => {
                          setStudentUpiId(e.target.value.trim().toLowerCase());
                          if (upgradeMsg) setUpgradeMsg(null);
                        }}
                        placeholder="Enter your UPI ID (e.g. 9830507435@upi)"
                        className="w-full bg-slate-950/90 text-white border border-cyan-500/40 focus:border-cyan-400 rounded-2xl px-4 py-3.5 text-sm font-mono tracking-wide outline-none transition focus:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                      />
                      {studentUpiId.includes("@") && studentUpiId.split("@")[1]?.length > 1 && (
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Valid Format
                        </span>
                      )}
                    </div>

                    {/* Quick Handle Completion Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-500 font-medium">Quick handle:</span>
                      {["@oksbi", "@okaxis", "@okhdfcbank", "@paytm", "@ybl", "@upi"].map((handle) => (
                        <button
                          key={handle}
                          type="button"
                          onClick={() => {
                            const base = studentUpiId.includes("@") ? studentUpiId.split("@")[0] : studentUpiId;
                            setStudentUpiId((base || "") + handle);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-[11px] font-mono hover:bg-cyan-900/60 hover:border-cyan-400 transition cursor-pointer"
                        >
                          {handle}
                        </button>
                      ))}
                    </div>
                  </div>

                  {upgradeMsg && (
                    <div className={"p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border " + (
                      upgradeMsg.type === "success"
                        ? "bg-green-950/80 border-green-600/60 text-green-300"
                        : "bg-red-950/80 border-red-600/60 text-red-300"
                    )}>
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{upgradeMsg.text}</span>
                    </div>
                  )}

                  <button
                    onClick={handleSendUpgradeRequest}
                    disabled={requestingUpgrade || !studentUpiId.trim()}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(6,182,212,0.4)] transition hover:brightness-110 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {requestingUpgrade ? "Initiating Payment..." : ("PROCEED TO PAY (₹" + (paymentSettings?.monthlyFee || 199) + ")")}
                  </button>

                  <div className="text-[11px] text-slate-400 text-center space-y-1 pt-1">
                    <p>
                      0% Processing Fees • Official Admin UPI • Instant Gold Pass Activation
                    </p>
                  </div>
                </div>
              )}

              {/* State: WAITING / PAYMENT OPTIONS STEP */}
              {paymentStep === "waiting" && (
                <div className="space-y-5 py-1 animate-in fade-in duration-300">
                  
                  {/* Status Banner */}
                  <div className="p-4 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                        Registered Payer UPI ID:
                      </span>
                      <span className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {studentUpiId}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-medium">Locked Amount:</span>
                      <span className="text-lg font-black text-emerald-400 font-mono">
                        ₹{paymentSettings?.monthlyFee || 199}
                      </span>
                    </div>
                  </div>

                  {/* Two Payment Options: Mobile vs PC/Laptop */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    
                    {/* OPTION 1: MOBILE APP DIRECT */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-500/40 text-blue-300 text-[11px] font-bold">
                          <MonitorSmartphone className="w-3.5 h-3.5 text-blue-400" />
                          <span>Mobile Device</span>
                        </div>
                        <h4 className="text-sm font-bold text-white">
                          Pay Directly via UPI App
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          If you are on your smartphone, tap below to launch Google Pay, PhonePe, or Paytm with the fixed amount <strong>₹{paymentSettings?.monthlyFee || 199}</strong> pre-filled.
                        </p>
                      </div>

                      <div className="space-y-2 pt-2">
                        <a
                          href={"upi://pay?pa=" + (paymentSettings?.upiId || "9830507435@upi") + "&pn=" + encodeURIComponent(paymentSettings?.payeeName || "Arghyadeep Roy") + "&am=" + (paymentSettings?.monthlyFee || 199) + "&cu=INR&tn=" + encodeURIComponent("PIECHEM Gold Pass - " + (student.name || "Student"))}
                          className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-98 transition cursor-pointer text-center"
                        >
                          <Sparkles className="w-4 h-4 shrink-0" />
                          <span>Pay ₹{paymentSettings?.monthlyFee || 199} via UPI App</span>
                        </a>

                        <div className="text-[11px] text-slate-400 text-center font-mono">
                          Supports GPay, PhonePe, Paytm, BHIM
                        </div>
                      </div>
                    </div>

                    {/* OPTION 2: PC / LAPTOP (DYNAMIC QR WITH FIXED AMOUNT) */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 text-center flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                          <Laptop className="w-3.5 h-3.5 text-amber-400" />
                          <span>PC / Laptop</span>
                        </div>
                        <h4 className="text-sm font-bold text-white">
                          Scan Dynamic UPI QR
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Scan with any phone UPI app. The amount is locked to <strong>₹{paymentSettings?.monthlyFee || 199}</strong>.
                        </p>
                      </div>

                      {/* QR Code Container with Fixed Amount */}
                      <div className="relative group inline-block mx-auto">
                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 via-amber-400 to-teal-400 opacity-25 blur group-hover:opacity-40 transition" />
                        <div className="relative p-2.5 bg-white rounded-xl shadow-lg">
                          <img
                            src={"https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent("upi://pay?pa=" + (paymentSettings?.upiId || "9830507435@upi") + "&pn=" + encodeURIComponent(paymentSettings?.payeeName || "Arghyadeep Roy") + "&am=" + (paymentSettings?.monthlyFee || 199) + "&cu=INR&tn=" + encodeURIComponent("PIECHEM Gold Pass - " + (student.name || "Student")))}
                            alt="Dynamic UPI Payment QR with Fixed Amount"
                            className="w-36 h-36 mx-auto object-contain"
                          />
                        </div>
                      </div>

                      {/* Fixed Amount Badge */}
                      <div className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold font-mono">
                        <span>🔒 Fixed: ₹{paymentSettings?.monthlyFee || 199}</span>
                      </div>
                    </div>

                  </div>

                  {/* Payee Info & Copy UPI */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/90 border border-cyan-500/20 rounded-xl text-xs">
                    <div className="text-left">
                      <span className="text-slate-400 block text-[11px]">Receiving UPI ID (Admin):</span>
                      <span className="text-white font-mono font-bold text-xs">{paymentSettings?.upiId || "9830507435@upi"}</span>
                      <span className="text-slate-400 text-[11px] ml-2">({paymentSettings?.payeeName || "Arghyadeep Roy"})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(paymentSettings?.upiId || "9830507435@upi");
                          setCopiedUpi(true);
                          setTimeout(() => setCopiedUpi(false), 2000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-700/60 text-cyan-300 text-xs font-mono hover:bg-cyan-900 transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUpi ? "Copied!" : "Copy UPI"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentStep("input")}
                        className="text-xs text-slate-400 hover:text-cyan-300 underline cursor-pointer"
                      >
                        Edit Payer UPI
                      </button>
                    </div>
                  </div>

                  {/* Live Status indicator */}
                  <div className="p-3 bg-slate-950/80 border border-cyan-500/20 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Payment Verification:</span>
                    <span className="text-amber-300 font-bold flex items-center gap-1.5 font-mono">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" /> Awaiting Confirmation
                    </span>
                  </div>

                </div>
              )}

              {/* State: SUCCESS / CONFIRMED STEP */}
              {paymentStep === "success" && (
                <div className="space-y-5 text-center py-4 animate-in zoom-in-95 duration-300">
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping duration-1000" />
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                      <CheckCircle2 className="w-9 h-9 text-slate-950 stroke-[2.5]" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Payment Verified & Approved!</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Welcome to Gold Membership!
                    </h3>
                    <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                      Your ₹{paymentSettings?.monthlyFee || 199} payment has been confirmed by Admin. All 50+ Chemistry Exams, full solutions, and proctored analytics are now fully unlocked for 30 days.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setShowPaymentModal(false);
                        setPaymentStep("input");
                        window.location.reload();
                      }}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:brightness-110 active:scale-98 transition cursor-pointer"
                    >
                      CONTINUE TO DASHBOARD
                    </button>
                  </div>
                </div>
              )}

              {/* Support Contact */}
              <div className="pt-2 text-[11px] text-slate-400 text-center border-t border-cyan-500/15">
                <span>Assistance or query? Contact Arghyadeep Roy: </span>
                <a href="tel:9830507435" className="font-mono font-bold text-cyan-400 hover:underline">
                  9830507435
                </a>
              </div>

            </div>

          </div>
        </div>
      )}


      {/* 4. HIGHEST ENROLLED PLAN MODAL */}
      {showHighestPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#0a1726] via-[#07111c] to-[#03080e] text-white rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.3)] border border-cyan-500/40 p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-200 my-auto">
            
            <button
              onClick={() => setShowHighestPlanModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Trophy / Badge Icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500/20 via-yellow-400/20 to-cyan-400/20 border border-amber-400/40 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              <Sparkles className="w-8 h-8 text-amber-400" />
            </div>

            {/* Top Tier Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-sm">
              <span>★ TOP TIER ENROLLED</span>
            </div>

            {/* Heading & Exact Requested Message */}
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Highest Plan Enrolled
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                You are at the highest enrolled plan currently and no more upgrade option available. Thank you!!
              </p>
            </div>

            {/* Current Plan Card */}
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-4 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Active Membership</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                </span>
              </div>
              <p className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Gold Membership (Premium)
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                You already have full access to all 50+ exams, 3D molecular models, full solutions, and proctored analytics.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                onClick={() => setShowHighestPlanModal(false)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-98 cursor-pointer transition"
              >
                GOT IT, THANK YOU!
              </button>

              <button
                onClick={() => {
                  setShowHighestPlanModal(false);
                  setShowPaymentModal(true);
                  fetchUpgradeRequest();
                }}
                className="text-xs text-slate-400 hover:text-cyan-300 transition underline cursor-pointer"
              >
                Need to renew or extend your 30-day pass instead?
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer Support */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 text-center text-xs text-slate-500 border-t border-cyan-500/15 mt-12">
        <p>
          Need assistance with your PIECHEM account? Contact Administrator Arghyadeep Roy:{" "}
          <a href="tel:9830507435" className="font-bold text-cyan-400 hover:underline font-mono">
            9830507435
          </a>
        </p>
      </footer>
    </div>
  );
}
