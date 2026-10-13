"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, Mail, ArrowLeft, KeyRound, CheckCircle2, AlertCircle, Sparkles, 
  RefreshCw, ChevronRight, Shield, Phone, Calendar, Lock
} from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import AdminPreviewBanner from "@/components/AdminPreviewBanner";
import PiFiringLoader from "@/components/PiFiringLoader";
import { resolveEffectivePlanTier } from "@/lib/planTier";

// Unisex Avatar Options
const AVATAR_OPTIONS = [
  { id: "atom", name: "Quantum Atom", url: "/avatars/atom.jpg" },
  { id: "beaker", name: "Magic Beaker", url: "/avatars/beaker.jpg" },
  { id: "dna", name: "Bio Helix", url: "/avatars/dna.jpg" },
  { id: "scholar", name: "Cyber Scholar", url: "/avatars/scholar.jpg" },
  { id: "crystal", name: "Solid Crystal", url: "/avatars/crystal.jpg" },
];

export default function StudentAccountPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "profiles" | "security">("overview");

  // Profile Form States
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

  // Security & Password Form States
  const [passwordOtp, setPasswordOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSentMsg, setOtpSentMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password Policy Checks
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

  // Load student dashboard data
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
      })
      .catch((err) => {
        console.error("Failed to load student account:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const student = data?.student;
  const subStatus = (student?.subscriptionStatus || "").trim().toUpperCase();
  const isUltra = subStatus === "ULTRA" || subStatus === "COMPLIMENTARY" || (subStatus === "PAID" && (!student?.subscriptionExpiresAt || new Date(student.subscriptionExpiresAt).getTime() > Date.now()));

  const memberSinceFormatted = student?.createdAt
    ? new Date(student.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "Recently";

  // Handle Profile Save
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);

    try {
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
    } catch {
      setProfileMsg({ type: "error", text: "Something went wrong saving profile details." });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Send Password OTP
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
        setOtpSentMsg(`Verification code sent to ${email}. Please check your inbox.`);
        setResendCooldown(30);
      } else {
        setPassMsg({ type: "error", text: resData.error || "Failed to send OTP to email." });
      }
    } catch {
      setPassMsg({ type: "error", text: "Network error sending OTP code." });
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle Password Change
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
          otp: passwordOtp,
          newPassword
        })
      });
      const resData = await res.json();

      if (res.ok) {
        setPassMsg({ type: "success", text: "Password updated successfully!" });
        setNewPassword("");
        setConfirmPassword("");
        setPasswordOtp("");
        setOtpSentMsg(null);
      } else {
        setPassMsg({ type: "error", text: resData.error || "Failed to update password." });
      }
    } catch {
      setPassMsg({ type: "error", text: "Something went wrong while updating password." });
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) {
    return <PiFiringLoader fullScreen />;
  }

  return (
    <div className="min-h-screen bg-[#02050a] text-slate-100 flex flex-col font-sans selection:bg-red-500/30 selection:text-red-200">
      <AdminPreviewBanner />
      
      <GlobalHeader
        student={student}
        isGoldMember={isUltra}
      />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          {activeTab === "overview" ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-400 hover:text-cyan-300 transition group"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </Link>
          ) : (
            <button
              onClick={() => setActiveTab("overview")}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-cyan-400 hover:text-cyan-300 transition group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Overview</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "overview"
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("profiles")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "profiles"
                  ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "security"
                  ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Password
            </button>
          </div>
        </div>

        {/* Header Title */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {activeTab === "profiles"
              ? "Student Profile & Curriculum"
              : activeTab === "security"
              ? "Security & Password"
              : "Account Overview"}
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-1">
            {activeTab === "profiles"
              ? "Update your avatar, contact details, education board, and academic cohort."
              : activeTab === "security"
              ? "Update your account password with email verification."
              : "View your student identity details and current PIE Chem membership status."}
          </p>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: OVERVIEW TAB                                      */}
        {/* ========================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* VIP Passport Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0b131e] via-[#070c14] to-black border border-slate-800/90 p-6 sm:p-9 shadow-xl">
              <div className="relative z-10 space-y-6">
                
                {/* Top Meta: Avatar + Status Badge */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-cyan-500/40 shadow-lg bg-black/50 shrink-0">
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white leading-tight">
                        {student?.name || "Student"}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{student?.email}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Member since {memberSinceFormatted}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isUltra ? (
                      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-red-950 via-[#26050a] to-black border border-red-500/60 text-red-200 text-xs font-extrabold uppercase tracking-wider shadow-[0_0_20px_rgba(229,9,20,0.35)]">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span>⚡ PIE ULTRA (ACTIVE VIP)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider">
                        <span>🔓 FREE ACCOUNT</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Tier Description & Curriculum Badge */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-950/70 text-cyan-300 font-bold border border-cyan-500/30">
                      Board: {board}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 font-bold border border-slate-700">
                      {board === "WBCHSE" ? `Semester: ${academicLevel}` : `Class ${academicLevel}`}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                    {isUltra
                      ? "Your account has full VIP access to all chemistry exam series, 3D molecular spatial models, DPPs, chapter derivations, and instant AI tutoring."
                      : "You are currently on standard free access. Free tier includes access to baseline practice exams and chapter notes."}
                  </p>
                </div>

                {/* Free Tier Notice (Strictly Admin Upgrade Only — No Payment Links) */}
                {!isUltra && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#180407]/60 via-[#100305]/60 to-black border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-300">
                        <Lock className="w-3.5 h-3.5 text-red-400" />
                        <span>⚡ PIE Ultra Exclusive</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        To unlock unlimited test attempts, 3D spatial chemistry simulations, and full NCERT answer bibles, contact your teacher or administrator to upgrade your account to PIE Ultra.
                      </p>
                    </div>
                    <div className="shrink-0 px-3.5 py-2 rounded-xl bg-red-950/80 border border-red-600/40 text-red-300 text-xs font-bold text-center select-none whitespace-nowrap">
                      Admin Upgrade Only
                    </div>
                  </div>
                )}

                {/* Perks Showcase Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs sm:text-sm text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${isUltra ? "text-emerald-400" : "text-slate-600"}`} />
                    <span>Live Test Series & Speed Mock Examinations</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${isUltra ? "text-emerald-400" : "text-slate-600"}`} />
                    <span>Interactive 3D Spatial Chemistry Simulations</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${isUltra ? "text-emerald-400" : "text-slate-600"}`} />
                    <span>Chapter DPPs, Formula Bibles & Solution Sets</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${isUltra ? "text-emerald-400" : "text-slate-600"}`} />
                    <span>Real-Time State Percentiles & Detailed Analytics</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Action Bento Grid */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white tracking-tight">Quick Actions</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Edit Profile */}
                <button
                  type="button"
                  onClick={() => setActiveTab("profiles")}
                  className="p-5 rounded-2xl bg-[#08101a] hover:bg-[#0c1828] border border-slate-800 hover:border-cyan-500/50 text-left transition duration-200 group flex items-start justify-between cursor-pointer shadow-md"
                >
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                      <User size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-white pt-2 group-hover:text-cyan-300 transition">
                      Edit Student Profile
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Update your avatar, name, phone, education board, and academic cohort.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-transform shrink-0 mt-2" />
                </button>

                {/* 2. Security & Password */}
                <button
                  type="button"
                  onClick={() => setActiveTab("security")}
                  className="p-5 rounded-2xl bg-[#08101a] hover:bg-[#0c1828] border border-slate-800 hover:border-cyan-500/50 text-left transition duration-200 group flex items-start justify-between cursor-pointer shadow-md"
                >
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                      <KeyRound size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-white pt-2 group-hover:text-amber-300 transition">
                      Change Password
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Send a verification code to your registered email and set a new password.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-transform shrink-0 mt-2" />
                </button>

                {/* 3. Examination Dashboard */}
                <Link
                  href="/dashboard"
                  className="p-5 rounded-2xl bg-[#08101a] hover:bg-[#0c1828] border border-slate-800 hover:border-cyan-500/50 text-left transition duration-200 group flex items-start justify-between cursor-pointer shadow-md"
                >
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                      <Sparkles size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-white pt-2 group-hover:text-emerald-300 transition">
                      Examination Catalog
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Attempt live MCQ tests, chapter speed exams, and view your detailed scorecards.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0 mt-2" />
                </Link>

                {/* 4. 3D Spatial Animations */}
                <Link
                  href="/3d-animations"
                  className="p-5 rounded-2xl bg-[#08101a] hover:bg-[#0c1828] border border-slate-800 hover:border-cyan-500/50 text-left transition duration-200 group flex items-start justify-between cursor-pointer shadow-md"
                >
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                      <Shield size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-white pt-2 group-hover:text-purple-300 transition">
                      3D Spatial Chemistry
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Explore interactive molecular geometries, reaction mechanisms, and crystal lattices.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-transform shrink-0 mt-2" />
                </Link>

              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: PROFILE & CURRICULUM TAB                          */}
        {/* ========================================================= */}
        {activeTab === "profiles" && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="rounded-3xl bg-gradient-to-b from-[#0b1424] via-[#060d18] to-black border border-white/10 shadow-2xl p-6 sm:p-9 space-y-7 backdrop-blur-xl">
              
              <div className="border-b border-white/10 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase tracking-widest mb-2">
                  <User className="w-3 h-3 text-cyan-400" />
                  <span>Personalization</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Student &amp; Academic Profile</h2>
                <p className="text-xs sm:text-sm text-slate-300/80 mt-1">
                  Customize your avatar and curriculum details to ensure test papers match your academic cohort.
                </p>
              </div>

              {profileMsg && (
                <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 border shadow-md ${
                  profileMsg.type === "success"
                    ? "bg-green-950/80 border-green-500/50 text-green-300"
                    : "bg-red-950/80 border-red-500/50 text-red-300"
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
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-300 uppercase tracking-widest block">
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
                          className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "border-cyan-400 ring-2 ring-cyan-500/60 scale-105 shadow-[0_0_20px_rgba(6,182,212,0.6)]"
                              : "border-white/10 hover:border-cyan-500/40 opacity-70 hover:opacity-100 bg-black/40"
                          }`}
                          title={av.name}
                        >
                          <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-cyan-400 text-slate-950 rounded-full flex items-center justify-center text-[10px] font-black shadow-md">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  
                  {/* Name (Read-only) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Student Name (Read-only)
                    </label>
                    <input
                      type="text"
                      value={name}
                      disabled
                      readOnly
                      className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-400 cursor-not-allowed select-none"
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
                      className="w-full bg-[#030712]/90 border border-white/10 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none transition"
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Registered Email (Read-only)
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-400 font-mono cursor-not-allowed select-none"
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
                      className="w-full bg-[#030712]/90 border border-white/10 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white outline-none transition cursor-pointer"
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
                      className="w-full bg-[#030712]/90 border border-white/10 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white outline-none transition cursor-pointer"
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
                      className="w-full bg-[#030712]/90 border border-white/10 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm font-bold text-cyan-300 outline-none transition cursor-pointer"
                    >
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE</option>
                      <option value="WBCHSE">WBCHSE</option>
                    </select>
                  </div>

                  {/* Academic Level */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                      {board === "WBCHSE" ? "Semester (WBCHSE Curriculum)" : `Class (${board})`}
                    </label>
                    {board === "WBCHSE" ? (
                      <select
                        value={academicLevel}
                        onChange={(e) => setAcademicLevel(e.target.value)}
                        className="w-full bg-[#030712]/90 border border-cyan-500/40 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm font-bold text-cyan-300 outline-none transition cursor-pointer"
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
                        className="w-full bg-[#030712]/90 border border-cyan-500/40 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm font-bold text-cyan-300 outline-none transition cursor-pointer"
                      >
                        <option value="11">Class 11</option>
                        <option value="12">Class 12</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-white/10">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="px-8 py-3.5 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 hover:brightness-110 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-[0_0_25px_rgba(6,182,212,0.4)] disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {profileLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{profileLoading ? "Saving..." : "Save Profile Details"}</span>
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: SECURITY & PASSWORD TAB                           */}
        {/* ========================================================= */}
        {activeTab === "security" && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="rounded-3xl bg-gradient-to-b from-[#0a1726] via-[#07111c] to-black border border-cyan-500/30 shadow-2xl p-6 sm:p-8 space-y-6">
              
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white">Security &amp; Password</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Update your account password with email verification to protect your test records.
                </p>
              </div>

              {/* Email OTP Verification Section */}
              <div className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-cyan-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider">
                      Email OTP Verification Required
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      To change your password, send a 6-digit verification code to <strong className="text-white font-mono">{email}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendPasswordOtp}
                    disabled={sendingOtp || resendCooldown > 0}
                    className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 hover:text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                  >
                    {sendingOtp ? "Sending Code..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Send Email OTP"}
                  </button>
                </div>

                {otpSentMsg && (
                  <div className="p-3 rounded-xl bg-green-950/80 border border-green-600/50 text-green-300 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    <span>{otpSentMsg}</span>
                  </div>
                )}
              </div>

              {passMsg && (
                <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 border ${
                  passMsg.type === "success"
                    ? "bg-green-950/80 border-green-600/60 text-green-300"
                    : "bg-red-950/80 border-red-600/60 text-red-300"
                }`}>
                  {passMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{passMsg.text}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-5">
                
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
                    placeholder="Enter 6-digit code"
                    className="w-full bg-slate-950/90 border border-cyan-500/40 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white font-mono tracking-wider outline-none transition"
                  />
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
                      placeholder="Enter new password"
                      className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white outline-none transition"
                    />
                  </div>

                  {/* Confirm Password */}
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
                      className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white outline-none transition"
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
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-[0_0_25px_rgba(6,182,212,0.4)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {passLoading ? "Updating Password..." : "Update Password"}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </main>

      <GlobalFooter />
    </div>
  );
}
