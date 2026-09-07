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
  const [paymentSettings, setPaymentSettings] = useState<any>({ upiId: "9830507435@upi", payeeName: "Arghyadeep Roy", monthlyFee: 99.0 });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
    if (!utrNumber.trim()) {
      setUpgradeMsg({ type: "error", text: "Please enter your 12-digit UTR / Payment Reference Number." });
      return;
    }
    setRequestingUpgrade(true);
    setUpgradeMsg(null);

    try {
      const res = await fetch("/api/student/upgrade-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utrNumber: utrNumber.trim(), amount: paymentSettings?.monthlyFee || 99.0 })
      });
      const resData = await res.json();

      if (res.ok) {
        setUpgradeMsg({ type: "success", text: resData.message });
        setUpgradeReq(resData.request);
      } else {
        setUpgradeMsg({ type: "error", text: resData.error || "Failed to send request." });
      }
    } catch (err) {
      setUpgradeMsg({ type: "error", text: "Network error sending upgrade request." });
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

  const memberSinceFormatted = student.createdAt
    ? new Date(student.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "August 2026";

  const nextPaymentFormatted = student.subscriptionExpiresAt
    ? new Date(student.subscriptionExpiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "Never (Lifetime Pass)";

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-neutral-900 font-sans selection:bg-red-500 selection:text-white pb-24">
      <AdminPreviewBanner />
      <SubscriptionExpiredModal student={student} />

      {/* 1. TOP NAVBAR (NETFLIX MINIMAL WHITE HEADER INSPIRATION) */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Brand Identity & Designer Attribution */}
          <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
            <PiechemLogo size="md" theme="light" href="/dashboard" />
            
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-neutral-200 bg-neutral-100 text-[10px] text-neutral-600 font-medium">
              <span>Designed by</span>
              <span className="font-semibold text-neutral-900">Arghyadeep Roy</span>
              <span className="text-neutral-400">•</span>
              <a 
                href="tel:9830507435" 
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-neutral-200 text-neutral-800 hover:text-red-600 transition font-mono text-[9px]"
                title="Call Arghyadeep Roy"
              >
                <Phone className="w-2.5 h-2.5 text-red-600 fill-current" />
                <span>9830507435</span>
              </a>
            </div>
          </div>

          {/* Right: Netflix-Style Profile Dropdown Trigger */}
          <div className="relative flex items-center gap-3 shrink-0">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-neutral-100 transition cursor-pointer group"
              title="Account Menu"
            >
              <div className="w-8 h-8 rounded-md overflow-hidden bg-neutral-900 ring-1 ring-neutral-300 group-hover:ring-neutral-400 transition shrink-0">
                <img
                  src={student?.avatarUrl || "/avatars/atom.jpg"}
                  alt={student?.name || "Avatar"}
                  className="w-full h-full object-cover"
                />
              </div>
              <ChevronDown className={`w-4 h-4 text-neutral-600 group-hover:text-neutral-900 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-neutral-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-neutral-100">
                  <p className="text-sm font-bold text-neutral-900 truncate">{student.name || "Student"}</p>
                  <p className="text-xs text-neutral-500 truncate mt-0.5 font-mono">{student.email}</p>
                  <div className="mt-2">
                    {isGold ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <Sparkles className="w-3 h-3 text-amber-600" /> Gold Member
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                        Free Account
                      </span>
                    )}
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition"
                  >
                    <ArrowLeft className="w-4 h-4 text-neutral-400" />
                    <span>Back to Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setActiveTab("profiles");
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition text-left cursor-pointer"
                  >
                    <User className="w-4 h-4 text-neutral-400" />
                    <span>Edit Profile Details</span>
                  </button>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setActiveTab("security");
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition text-left cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-neutral-400" />
                    <span>Security & Password</span>
                  </button>
                </div>

                <div className="border-t border-neutral-100 pt-1 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Sign out of Piechem</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      {/* 2. MAIN LAYOUT (TWO-COLUMN NETFLIX ACCOUNT SETTINGS PAGE) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT SIDEBAR NAVIGATION (Exact Netflix Image 1 Style) */}
          <aside className="lg:col-span-3 space-y-6 shrink-0">
            
            {/* Back Link with Arrow */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-bold text-neutral-800 hover:text-red-600 transition group"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-500 group-hover:text-red-600 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Dashboard</span>
            </Link>

            {/* Vertical Navigation Rail for Desktop */}
            <nav className="hidden lg:flex flex-col space-y-1 pt-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition text-left cursor-pointer ${
                  activeTab === "overview"
                    ? "font-black text-neutral-950 bg-neutral-200/70 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/40"
                }`}
              >
                <div className={`w-5 h-5 flex items-center justify-center ${activeTab === "overview" ? "text-neutral-950 font-bold" : "text-neutral-500"}`}>
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                  </svg>
                </div>
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab("membership")}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition text-left cursor-pointer ${
                  activeTab === "membership"
                    ? "font-black text-neutral-950 bg-neutral-200/70 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/40"
                }`}
              >
                <CreditCard className={`w-5 h-5 ${activeTab === "membership" ? "text-neutral-950 stroke-[2.5]" : "text-neutral-500"}`} />
                <span>Membership</span>
              </button>

              <button
                onClick={() => setActiveTab("security")}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition text-left cursor-pointer ${
                  activeTab === "security"
                    ? "font-black text-neutral-950 bg-neutral-200/70 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/40"
                }`}
              >
                <ShieldCheck className={`w-5 h-5 ${activeTab === "security" ? "text-neutral-950 stroke-[2.5]" : "text-neutral-500"}`} />
                <span>Security</span>
              </button>

              <button
                onClick={() => setActiveTab("devices")}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition text-left cursor-pointer ${
                  activeTab === "devices"
                    ? "font-black text-neutral-950 bg-neutral-200/70 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/40"
                }`}
              >
                <MonitorSmartphone className={`w-5 h-5 ${activeTab === "devices" ? "text-neutral-950 stroke-[2.5]" : "text-neutral-500"}`} />
                <span>Devices</span>
              </button>

              <button
                onClick={() => setActiveTab("profiles")}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition text-left cursor-pointer ${
                  activeTab === "profiles"
                    ? "font-black text-neutral-950 bg-neutral-200/70 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/40"
                }`}
              >
                <User className={`w-5 h-5 ${activeTab === "profiles" ? "text-neutral-950 stroke-[2.5]" : "text-neutral-500"}`} />
                <span>Profiles</span>
              </button>
            </nav>

            {/* Horizontal Pill Tabs for Mobile / Tablet */}
            <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 pt-1 -mx-4 px-4 border-b border-neutral-200">
              {[
                { id: "overview", label: "Overview", icon: Sparkles },
                { id: "membership", label: "Membership", icon: CreditCard },
                { id: "security", label: "Security", icon: ShieldCheck },
                { id: "devices", label: "Devices", icon: MonitorSmartphone },
                { id: "profiles", label: "Profiles", icon: User },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      isSelected
                        ? "bg-neutral-900 text-white shadow-sm"
                        : "bg-white text-neutral-600 hover:bg-neutral-200/70 border border-neutral-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* RIGHT MAIN CONTENT AREA */}
          <div className="lg:col-span-9 space-y-6 sm:space-y-8">
            
            {/* Header Titles */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
                Account
              </h1>
              <p className="text-sm font-medium text-neutral-500 mt-1">
                Membership details
              </p>
            </div>

            {/* VIEW A: OVERVIEW TAB (Exact match to Netflix Image 1) */}
            {activeTab === "overview" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                
                {/* 1. The Iconic Netflix Membership Box */}
                <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-6 sm:p-7 relative overflow-hidden transition hover:shadow-md">
                  
                  {/* Member Since Badge (Purple/crimson pill as in Image 1) */}
                  <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-gradient-to-r from-[#221f52] to-[#6d132c] text-white text-xs font-semibold shadow-sm mb-4">
                    Member since {memberSinceFormatted}
                  </div>

                  {/* Plan Name & Type */}
                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                      {isGold ? "Premium plan" : "Basic Student Plan"}
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-neutral-500">
                      {isGold 
                        ? (student.subscriptionExpiresAt ? "Active 30-Day Gold Membership" : "Lifetime Unlimited Pass")
                        : "Free Tier / Practice Account"}
                    </p>
                  </div>

                  {/* Payment / Renewal Info */}
                  <div className="pt-3 text-sm text-neutral-700 font-medium space-y-2">
                    <p>
                      {isGold ? (
                        <>
                          <span className="text-neutral-500">First payment / Next renewal: </span>
                          <span className="font-bold text-neutral-900 font-mono">{nextPaymentFormatted}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-neutral-500">Status: </span>
                          <span className="font-bold text-neutral-800">Upgrade anytime for unlimited test series & proctored analytics</span>
                        </>
                      )}
                    </p>

                    {/* Payment Handle Pill (UPI / Card) */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 border border-neutral-200 text-xs font-mono font-medium text-neutral-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-bold text-purple-700">UPI</span>
                        <span>{paymentSettings?.upiId || "9830507435@upi"}</span>
                      </div>
                      <span className="text-xs text-neutral-400 font-mono">
                        Payee: {paymentSettings?.payeeName || "Arghyadeep Roy"} (₹{paymentSettings?.monthlyFee || 99}/mo)
                      </span>
                    </div>
                  </div>

                  {/* Divider & Manage Membership Link Row */}
                  <div className="pt-5 mt-5 border-t border-neutral-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setShowPaymentModal(true);
                        fetchUpgradeRequest();
                      }}
                      className="w-full flex items-center justify-between text-sm font-bold text-neutral-900 hover:text-red-600 transition group cursor-pointer text-left py-1"
                    >
                      <span>Manage membership</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
                {/* 2. Quick Links Card (Exact match to Netflix Image 1) */}
                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
                    Quick links
                  </h3>

                  <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm divide-y divide-neutral-100 overflow-hidden">
                    
                    {/* Change Plan */}
                    <button
                      onClick={() => {
                        setShowPaymentModal(true);
                        fetchUpgradeRequest();
                      }}
                      className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-neutral-50/80 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2 rounded-xl bg-neutral-100 text-neutral-700 group-hover:text-red-600 transition">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-neutral-900 group-hover:text-red-600 transition block">
                            Change plan
                          </span>
                          <span className="text-xs text-neutral-500 font-normal">
                            Upgrade to Gold Pass or renew current active membership
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Manage Payment Method */}
                    <button
                      onClick={() => {
                        setShowPaymentModal(true);
                        fetchUpgradeRequest();
                      }}
                      className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-neutral-50/80 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2 rounded-xl bg-neutral-100 text-neutral-700 group-hover:text-red-600 transition">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-neutral-900 group-hover:text-red-600 transition block">
                            Manage payment method
                          </span>
                          <span className="text-xs text-neutral-500 font-normal">
                            Scan UPI QR code (GPay, PhonePe, Paytm) & submit UTR verification
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Manage Access and Devices */}
                    <button
                      onClick={() => setActiveTab("devices")}
                      className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-neutral-50/80 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2 rounded-xl bg-neutral-100 text-neutral-700 group-hover:text-red-600 transition">
                          <MonitorSmartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-neutral-900 group-hover:text-red-600 transition block">
                            Manage access and devices
                          </span>
                          <span className="text-xs text-neutral-500 font-normal">
                            View active sessions, proctoring security status & signed-in browsers
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Edit Student Profile & Curriculum */}
                    <button
                      onClick={() => setActiveTab("profiles")}
                      className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-neutral-50/80 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2 rounded-xl bg-neutral-100 text-neutral-700 group-hover:text-red-600 transition">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-neutral-900 group-hover:text-red-600 transition block">
                            Edit student & academic profile
                          </span>
                          <span className="text-xs text-neutral-500 font-normal">
                            Change avatar, update student name, phone, CBSE / ICSE / WBCHSE board
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Update Password & Security */}
                    <button
                      onClick={() => setActiveTab("security")}
                      className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-neutral-50/80 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2 rounded-xl bg-neutral-100 text-neutral-700 group-hover:text-red-600 transition">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-neutral-900 group-hover:text-red-600 transition block">
                            Update password & credentials
                          </span>
                          <span className="text-xs text-neutral-500 font-normal">
                            Send verification OTP to email and set a new strong password
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* 3. Summary Profile Spotlight */}
                <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-900 ring-2 ring-neutral-200 shrink-0 shadow-sm">
                      <img
                        src={avatarUrl || "/avatars/atom.jpg"}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-neutral-900">{name || "Student"}</h4>
                      <p className="text-xs text-neutral-500 font-mono mt-0.5">{email}</p>
                      <div className="flex items-center gap-2 mt-1.5 justify-center sm:justify-start">
                        <span className="text-xs font-bold text-neutral-800 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200">
                          {board} ({board === "WBCHSE" ? academicLevel : `Class ${academicLevel}`})
                        </span>
                        <span className="text-xs text-neutral-500 font-medium">
                          • {completedAttempts.length} Tests Attempted
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab("profiles")}
                    className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-800 hover:bg-neutral-100 transition cursor-pointer shrink-0"
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
                <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-6 sm:p-7 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
                    <div>
                      <span className="text-xs font-extrabold tracking-wider uppercase text-neutral-500 block mb-1">
                        Current Plan
                      </span>
                      <h2 className="text-2xl font-black text-neutral-900 flex items-center gap-2">
                        {isGold ? "Gold Membership (Unlimited)" : "Free Student Tier"}
                        {isGold && <Sparkles className="w-5 h-5 text-amber-500" />}
                      </h2>
                    </div>

                    <div>
                      {isGold ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle className="w-3.5 h-3.5" /> Active Subscription
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-700 border border-neutral-300">
                          Free Account
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
                      <span className="text-neutral-500 block">Monthly Rate</span>
                      <span className="text-lg font-black text-neutral-900 font-mono mt-0.5 block">
                        ₹{paymentSettings?.monthlyFee || 99} <span className="text-xs font-normal text-neutral-500">/ 30 Days</span>
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
                      <span className="text-neutral-500 block">Payment Details</span>
                      <span className="text-sm font-bold text-neutral-800 truncate block mt-1 font-mono">
                        {paymentSettings?.upiId || "9830507435@upi"}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
                      <span className="text-neutral-500 block">Next Payment / Expiry</span>
                      <span className="text-sm font-bold text-neutral-900 font-mono mt-1 block">
                        {nextPaymentFormatted}
                      </span>
                    </div>
                  </div>

                  {/* Pending Upgrade Alert */}
                  {upgradeReq?.status === "PENDING" && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-3">
                      <Clock className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
                      <div>
                        <strong className="font-bold block">Upgrade Verification Pending</strong>
                        <p className="text-amber-800 mt-0.5">
                          Your UTR submission (<span className="font-mono font-bold">{upgradeReq.utrNumber}</span>) has been received and is being verified by Admin.
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
                      className="px-6 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
                    >
                      {isGold ? "Renew / Extend Gold Pass" : "Upgrade to Gold Membership (₹99)"}
                    </button>
                  </div>
                </div>

                {/* Plan Benefits Checklist */}
                <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-6 sm:p-7 space-y-4">
                  <h3 className="text-base font-bold text-neutral-900">What is included in Gold Membership</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-700">
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Full Access to All 50+ Chemistry Exam Tests</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Instant Step-by-Step Answer Explanations</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Proctored Ranking & Percentile Analytics</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Direct Admin Activation & WhatsApp Support</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
            {/* VIEW C: SECURITY TAB */}
            {activeTab === "security" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-6 sm:p-7 space-y-6">
                  
                  <div className="border-b border-neutral-100 pb-4">
                    <h2 className="text-xl font-bold text-neutral-900">Security & Password</h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      Update your account credentials to protect your proctored exam history.
                    </p>
                  </div>

                  {/* Email OTP Verification Section */}
                  <div className="bg-neutral-50 p-4 sm:p-5 rounded-xl border border-neutral-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider">
                          Email OTP Verification Required
                        </h4>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          To change your password, send a 6-digit code to <strong className="text-neutral-900 font-mono">{email}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendPasswordOtp}
                        disabled={sendingOtp || resendCooldown > 0}
                        className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                      >
                        {sendingOtp ? "Sending OTP..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Send Email OTP"}
                      </button>
                    </div>

                    {otpSentMsg && (
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{otpSentMsg}</span>
                      </div>
                    )}
                  </div>

                  {/* Feedback Message */}
                  {passMsg && (
                    <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 border ${
                      passMsg.type === "success"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                        : "bg-red-50 border-red-300 text-red-900"
                    }`}>
                      {passMsg.type === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                      )}
                      <span>{passMsg.text}</span>
                    </div>
                  )}

                  {/* Password Form */}
                  <form onSubmit={handlePasswordChange} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* OTP Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex justify-between">
                          <span>Verification OTP *</span>
                          <span className="text-[11px] text-neutral-400 font-normal">6 digits</span>
                        </label>
                        <input
                          type="text"
                          value={passwordOtp}
                          onChange={(e) => setPasswordOtp(e.target.value)}
                          placeholder="Enter 6-digit OTP"
                          className="w-full bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-xl px-4 py-2.5 text-sm text-neutral-900 font-mono tracking-wider outline-none transition"
                        />
                      </div>

                      {/* Current Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                          Current Password (Optional)
                        </label>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="Enter current password if set"
                          className="w-full bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-xl px-4 py-2.5 text-sm text-neutral-900 outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* New Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                          New Password *
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Create strong password"
                          className="w-full bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-xl px-4 py-2.5 text-sm text-neutral-900 outline-none transition"
                        />
                      </div>

                      {/* Confirm New Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex justify-between">
                          <span>Confirm New Password *</span>
                          {confirmPassword && (
                            <span className={`text-[11px] font-bold ${newPassword === confirmPassword ? "text-emerald-600" : "text-red-600"}`}>
                              {newPassword === confirmPassword ? "✓ Match" : "✗ Mismatch"}
                            </span>
                          )}
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="w-full bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-xl px-4 py-2.5 text-sm text-neutral-900 outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Password Policy Checklist */}
                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2">
                      <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                        Security Requirements:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className={`flex items-center gap-1.5 ${reqLength ? "text-emerald-700 font-bold" : "text-neutral-400"}`}>
                          <span>{reqLength ? "✓" : "○"}</span> 8+ Characters
                        </div>
                        <div className={`flex items-center gap-1.5 ${reqUpper ? "text-emerald-700 font-bold" : "text-neutral-400"}`}>
                          <span>{reqUpper ? "✓" : "○"}</span> 1 Uppercase (A-Z)
                        </div>
                        <div className={`flex items-center gap-1.5 ${reqLower ? "text-emerald-700 font-bold" : "text-neutral-400"}`}>
                          <span>{reqLower ? "✓" : "○"}</span> 1 Lowercase (a-z)
                        </div>
                        <div className={`flex items-center gap-1.5 ${reqNumber ? "text-emerald-700 font-bold" : "text-neutral-400"}`}>
                          <span>{reqNumber ? "✓" : "○"}</span> 1 Number (0-9)
                        </div>
                        <div className={`flex items-center gap-1.5 ${reqSpecial ? "text-emerald-700 font-bold" : "text-neutral-400"}`}>
                          <span>{reqSpecial ? "✓" : "○"}</span> 1 Special Char
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={passLoading || !passwordOtp || !allReqsMet || newPassword !== confirmPassword}
                        className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                
                <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-6 sm:p-7 space-y-6">
                  
                  <div className="border-b border-neutral-100 pb-4">
                    <h2 className="text-xl font-bold text-neutral-900">Student & Academic Profile</h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      Customize your display avatar and update your board details to receive personalized exam recommendations.
                    </p>
                  </div>

                  {/* Feedback Message */}
                  {profileMsg && (
                    <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 border ${
                      profileMsg.type === "success"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                        : "bg-red-50 border-red-300 text-red-900"
                    }`}>
                      {profileMsg.type === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                      )}
                      <span>{profileMsg.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleProfileSave} className="space-y-6">
                    
                    {/* Avatar Picker */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
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
                                  ? "border-neutral-900 ring-2 ring-neutral-400 scale-105 shadow-md"
                                  : "border-neutral-200 hover:border-neutral-400 opacity-70 hover:opacity-100"
                              }`}
                              title={av.name}
                            >
                              <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                              {isSelected && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-neutral-900 text-white rounded-full flex items-center justify-center text-[9px] font-black">
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
                        <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                          Student Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your name"
                          className="w-full bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-xl px-4 py-2.5 text-sm text-neutral-900 outline-none transition"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="10-digit mobile number"
                          className="w-full bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-xl px-4 py-2.5 text-sm text-neutral-900 font-mono outline-none transition"
                        />
                      </div>

                      {/* Mail ID (Read-only) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                          Registered Email (Read-only)
                        </label>
                        <input
                          type="email"
                          value={email}
                          disabled
                          className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-500 font-mono cursor-not-allowed"
                        />
                      </div>

                      {/* Gender */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                          Gender
                        </label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-xl px-4 py-2.5 text-sm text-neutral-900 outline-none transition cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>

                      {/* Date of Birth */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-xl px-4 py-2.5 text-sm text-neutral-900 outline-none transition cursor-pointer"
                        />
                      </div>

                      {/* Board */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
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
                          className="w-full bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-xl px-4 py-2.5 text-sm text-neutral-900 outline-none transition cursor-pointer font-bold"
                        >
                          <option value="CBSE">CBSE</option>
                          <option value="ICSE">ICSE</option>
                          <option value="WBCHSE">WBCHSE</option>
                        </select>
                      </div>

                      {/* Dynamic Academic Level (Class or Semester) */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                          {board === "WBCHSE" ? "Semester (WBCHSE Curriculum)" : `Class (${board})`}
                        </label>
                        {board === "WBCHSE" ? (
                          <select
                            value={academicLevel}
                            onChange={(e) => setAcademicLevel(e.target.value)}
                            className="w-full bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-xl px-4 py-2.5 text-sm text-neutral-900 outline-none transition cursor-pointer font-bold"
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
                            className="w-full bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-xl px-4 py-2.5 text-sm text-neutral-900 outline-none transition cursor-pointer font-bold"
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
                        className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-2"
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
                
                <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-6 sm:p-7 space-y-6">
                  
                  <div className="border-b border-neutral-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-neutral-900">Access & Devices</h2>
                      <p className="text-xs text-neutral-500 mt-1">
                        Review active browsers and security devices connected to your student profile.
                      </p>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition border border-red-200 self-start sm:self-auto cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out of all sessions</span>
                    </button>
                  </div>

                  {/* Active Device Card */}
                  <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-50 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="p-3 rounded-xl bg-white border border-neutral-200 shadow-sm text-neutral-900 shrink-0">
                        <Laptop className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-neutral-900">Current Active Web Browser</h4>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Now
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1 font-mono">
                          Account: {student.email}
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Last session refresh: {formatDateTime24(new Date())}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Proctoring & Integrity Details */}
                  <div className="p-5 rounded-xl border border-neutral-200 bg-white space-y-3">
                    <h4 className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      Exam Integrity & Security Posture
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-600">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                        <span>Anti-Cheat Proctoring:</span>
                        <span className="font-bold text-emerald-600">VERIFIED ACTIVE</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                        <span>Completed Attempts:</span>
                        <span className="font-mono font-bold text-neutral-900">{completedAttempts.length} Submitted</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        </div>
      </main>
      {/* 3. INSTANT UPI QR CODE MODAL (NETFLIX STYLE POPUP) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 sm:p-7 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold mb-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>Instant UPI Activation</span>
                </div>
                <h3 className="text-xl font-black text-neutral-900 tracking-tight">
                  Scan QR to Pay with any UPI App
                </h3>
              </div>

              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-7 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* QR Code Column */}
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-md inline-block">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`upi://pay?pa=${paymentSettings?.upiId || '9830507435@upi'}&pn=${encodeURIComponent(paymentSettings?.payeeName || 'Arghyadeep Roy')}&am=${paymentSettings?.monthlyFee || 99}&cu=INR&tn=PIECHEM%20Monthly%20Subscription`)}`}
                    alt="UPI Payment QR Code"
                    className="w-44 h-44 sm:w-48 sm:h-48 mx-auto object-contain"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-neutral-500 block">Monthly Subscription</span>
                  <span className="text-2xl font-black text-neutral-900 font-mono">
                    ₹{paymentSettings?.monthlyFee || 99} <span className="text-xs font-normal text-neutral-500">/ 30 Days</span>
                  </span>
                </div>

                {/* Copy UPI ID */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 border border-neutral-200 text-xs font-mono text-neutral-800">
                  <span>{paymentSettings?.upiId || "9830507435@upi"}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(paymentSettings?.upiId || "9830507435@upi");
                      setCopiedUpi(true);
                      setTimeout(() => setCopiedUpi(false), 2000);
                    }}
                    className="text-neutral-500 hover:text-neutral-900 cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Step 2 Column: Enter UTR */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-neutral-900">
                    Step 2: Submit 12-Digit UTR
                  </h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    After scanning and completing the transaction in GPay, PhonePe, Paytm, or BHIM, enter your 12-digit UTR reference number below.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                    12-Digit UTR / Ref No:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9A-Za-z]/g, ""))}
                      placeholder="e.g. 423456789012"
                      maxLength={18}
                      className="w-full bg-white text-neutral-900 border border-neutral-300 focus:border-neutral-900 rounded-xl px-4 py-3 text-sm font-mono tracking-wider outline-none transition"
                    />
                    {utrNumber.length >= 12 && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Valid Format
                      </span>
                    )}
                  </div>
                </div>

                {upgradeMsg && (
                  <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                    upgradeMsg.type === "success"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                      : "bg-red-50 border-red-300 text-red-900"
                  }`}>
                    <span>{upgradeMsg.text}</span>
                  </div>
                )}

                <button
                  onClick={async () => {
                    await handleSendUpgradeRequest();
                    if (utrNumber.trim()) {
                      setTimeout(() => setShowPaymentModal(false), 2000);
                    }
                  }}
                  disabled={requestingUpgrade || !utrNumber.trim()}
                  className="w-full py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider shadow-md transition active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {requestingUpgrade ? "Submitting Verification..." : "SUBMIT PAYMENT FOR ACTIVATION"}
                </button>

                <div className="pt-2 text-[11px] text-neutral-500 text-center">
                  <span>Assistance / Issues? Call Arghyadeep Roy: </span>
                  <a href="tel:9830507435" className="font-mono font-bold text-neutral-900 hover:underline">
                    9830507435
                  </a>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Footer Support */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 text-center text-xs text-neutral-400 border-t border-neutral-200 mt-12">
        <p>
          Need assistance with your PIECHEM account? Contact Administrator Arghyadeep Roy:{" "}
          <a href="tel:9830507435" className="font-bold text-neutral-700 hover:underline font-mono">
            9830507435
          </a>
        </p>
      </footer>
    </div>
  );
}
