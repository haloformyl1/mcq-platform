"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, Mail, Phone, Calendar, ShieldCheck, ArrowLeft, KeyRound, 
  CheckCircle2, AlertCircle, LogOut, Sparkles, BookOpen, Trophy, Clock, RefreshCw 
} from "lucide-react";
import AdminPreviewBanner from "@/components/AdminPreviewBanner";
import PiechemLogo from "@/components/PiechemLogo";
import PiFiringLoader from "@/components/PiFiringLoader";

export default function StudentAccountPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
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
  const [academicLevel, setAcademicLevel] = useState("11"); // Class 11/12 OR SEM-I/SEM-II/SEM-III/SEM-IV
  const [avatarUrl, setAvatarUrl] = useState("/avatars/atom.jpg");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Upgrade Request State
  const [upgradeReq, setUpgradeReq] = useState<any>(null);
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
      .then(res => res.json())
      .then(d => {
        if (d.request) setUpgradeReq(d.request);
      })
      .catch(() => {});
  };

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
          setDob(resData.student.dob ? new Date(resData.student.dob).toISOString().split('T')[0] : "");
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

    fetchUpgradeRequest();
  }, [router]);

  const handleSendUpgradeRequest = async () => {
    setRequestingUpgrade(true);
    setUpgradeMsg(null);

    try {
      const res = await fetch("/api/student/upgrade-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
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
        setProfileMsg({ type: "success", text: `Profile saved successfully! Main screen view updated for ${board} (${levelLabel}).` });
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
        setOtpSentMsg(`Verification OTP sent to your registered email (${email}). Please check your inbox/spam folder.`);
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
  const completedAttempts = allAttempts.filter((a: any) => a.status === 'SUBMITTED');
  const studentName = student.name || student.email.split('@')[0];
  const joinedDate = student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Active Student';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07131e] via-[#040911] to-black text-white font-sans pb-20">
      <AdminPreviewBanner />

      {/* Modern Netflix-Style Header Bar */}
      <header className="border-b border-cyan-500/20 bg-[#061019]/90 backdrop-blur-xl sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
        <div className="w-full py-3 px-4 sm:px-6 lg:px-8 space-y-2 sm:space-y-0">
          <div className="flex justify-between items-center gap-2">
            <div className="flex flex-col items-start gap-1 shrink-0">
              <PiechemLogo size="md" href="/dashboard" />
              
              <div className="hidden sm:flex px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-[11px] text-slate-300 font-semibold tracking-wide items-center space-x-1.5 mt-0.5">
                <span className="text-slate-400">Designed by</span>
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400">
                  Arghyadeep Roy
                </span>
                <span className="text-cyan-500/60">•</span>
                <a href="tel:9830507435" className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 hover:text-white border border-cyan-500/50 transition-all font-mono">
                  <span>9830507435</span>
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-white transition-all px-3 sm:px-4 py-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-600/80 shadow-[0_0_15px_rgba(6,182,212,0.2)] whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Back to</span> Dashboard
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center text-xs font-bold text-red-400 hover:text-white transition-all px-2.5 sm:px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-600/80 border border-red-800/50 shadow"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Student Contact Badge on Mobile (Full width row under logo) */}
          <div className="flex sm:hidden justify-between items-center w-full pt-1.5 border-t border-cyan-500/15">
            <div className="px-2.5 py-1 rounded-full bg-slate-950/90 border border-cyan-500/30 text-[10px] text-slate-300 font-semibold tracking-wide flex items-center space-x-1.5 w-full justify-between">
              <div className="flex items-center space-x-1">
                <span className="text-slate-400">Designed by</span>
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  Arghyadeep Roy
                </span>
              </div>
              <a 
                href="tel:9830507435" 
                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono text-[10px]"
              >
                <span>📞 9830507435</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-6 sm:py-10 px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
        
        {/* Netflix-Style Account Profile Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 bg-gradient-to-r from-[#0d1d2b] via-[#091520] to-[#050b11] p-5 sm:p-10 shadow-[0_10px_40px_rgba(0,153,255,0.15)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 via-blue-600/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-5 sm:gap-6 text-center md:text-left">
            {/* Avatar Pill with Glowing Ring */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-blue-600 p-1 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                <div className="w-full h-full bg-[#07111a] rounded-[22px] overflow-hidden flex items-center justify-center">
                  <img
                    src={avatarUrl || "/avatars/atom.jpg"}
                    alt="Student Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 border-2 border-[#07111a] rounded-full animate-pulse" title="Active Account"></span>
            </div>

            {/* Profile Info */}
            <div className="space-y-3 flex-1 w-full min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight break-words">{studentName}</h1>
                {student.subscriptionStatus === "PAID" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 border border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] tracking-wide uppercase shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-slate-950" /> Subscribed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Student Account
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap justify-center md:justify-start items-center gap-2 sm:gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5 break-all max-w-full">
                  <Mail className="w-4 h-4 text-cyan-400 shrink-0" /> {student.email || 'N/A'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-teal-400 shrink-0" /> {student.phone || 'Not Linked'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-400" /> Enrolled: {joinedDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details & Security Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Membership Info & Quick Overview (1 col) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Membership Plan Card */}
            <div className="bg-gradient-to-b from-[#0e1a26]/90 via-[#0a131d]/90 to-[#060c13]/90 border border-cyan-500/30 p-6 rounded-2xl shadow-xl space-y-5">
              <div className="flex items-center gap-3 border-b border-cyan-500/20 pb-4">
                <div className="p-2.5 bg-cyan-950/80 rounded-xl border border-cyan-500/40 text-cyan-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Membership & Plan</h3>
                  <p className="text-xs text-slate-400">Exam Platform Subscription</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300">Account Type</span>
                  {student.subscriptionStatus === "PAID" ? (
                    <span className="text-xs font-black text-amber-300 bg-amber-950/90 px-2.5 py-1 rounded-md border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]">Paid Subscriber</span>
                  ) : (
                    <span className="text-xs font-bold text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-md border border-cyan-700/60">Free Account</span>
                  )}
                </div>

                <div className="flex justify-between items-center bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300">Tests Completed</span>
                  <span className="text-xs font-mono font-bold text-green-400">{completedAttempts.length} Attempted</span>
                </div>

                <div className="flex justify-between items-center bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300">Proctoring Status</span>
                  <span className="text-xs font-bold text-teal-300 bg-teal-950 px-2.5 py-1 rounded-md border border-teal-700/60">Verified Active</span>
                </div>
              </div>

              {/* Upgrade to Gold Action Section (For FREE Students) */}
              {student.subscriptionStatus !== "PAID" && (
                <div className="pt-2 border-t border-cyan-500/20 space-y-3">
                  {upgradeMsg && (
                    <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                      upgradeMsg.type === "success" ? "bg-green-950/80 border-green-600/60 text-green-300" : "bg-red-950/80 border-red-600/60 text-red-300"
                    }`}>
                      <span>{upgradeMsg.text}</span>
                    </div>
                  )}

                  {upgradeReq?.status === "PENDING" ? (
                    <div className="w-full text-center py-3 px-4 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-bold space-y-1 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                        <span>Upgrade Request Pending Admin Approval</span>
                      </div>
                      <p className="text-[11px] text-amber-200/80 font-normal">Admin will review and approve your Gold subscription shortly.</p>
                    </div>
                  ) : upgradeReq?.status === "REJECTED" ? (
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-red-950/80 border border-red-600/60 text-red-300 text-xs space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span>Previous Upgrade Request Declined</span>
                        </div>
                        <p className="text-[11px] text-red-200/80">You are currently on the Free plan. You may submit a new request below.</p>
                      </div>
                      <button
                        onClick={handleSendUpgradeRequest}
                        disabled={requestingUpgrade}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.4)] transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4 fill-slate-950" />
                        <span>{requestingUpgrade ? "Sending Request..." : "Request Upgrade to Gold"}</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleSendUpgradeRequest}
                      disabled={requestingUpgrade}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.4)] transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 fill-slate-950" />
                      <span>{requestingUpgrade ? "Sending Request..." : "Upgrade to Gold"}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quick Access Card */}
            <div className="bg-gradient-to-br from-cyan-950/40 via-slate-950/60 to-blue-950/40 border border-cyan-500/20 p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" /> Academic Profile Verified
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Keep your Board and Class / Semester details up to date to receive customized mock exams and study notes tailored to your curriculum!
              </p>
            </div>
          </div>

          {/* Right Column: Personal Details & Password Security Forms (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. Personal & Academic Profile Details Form */}
            <div className="bg-gradient-to-b from-[#0e1a26]/90 via-[#0a131d]/90 to-[#060c13]/90 border border-cyan-500/30 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-cyan-500/20 pb-4">
                <div className="p-2.5 bg-teal-950/80 rounded-xl border border-teal-500/40 text-teal-300">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">Personal & Academic Details</h3>
                  <p className="text-xs text-slate-400">Manage your profile information and board curriculum settings</p>
                </div>
              </div>

              {/* Profile Save Feedback Alert */}
              {profileMsg && (
                <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 border ${
                  profileMsg.type === "success" 
                    ? "bg-green-950/80 border-green-600/60 text-green-300" 
                    : "bg-red-950/80 border-red-600/60 text-red-300"
                }`}>
                  {profileMsg.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleProfileSave} className="space-y-6">
                
                {/* Unisex Avatar Selector Grid */}
                <div className="space-y-2.5">
                  <label className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Choose Profile Avatar</span>
                    <span className="text-[11px] text-slate-400 font-normal">Click to switch avatar</span>
                  </label>
                  <div className="grid grid-cols-5 gap-3 p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                    {AVATAR_OPTIONS.map((av) => {
                      const isSelected = avatarUrl === av.url;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setAvatarUrl(av.url)}
                          className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer group ${
                            isSelected
                              ? "border-cyan-400 ring-2 ring-cyan-500/50 scale-105 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                              : "border-slate-800 hover:border-cyan-500/50 opacity-70 hover:opacity-100"
                          }`}
                          title={av.name}
                        >
                          <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                          {isSelected && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center text-slate-950 text-[10px] font-black">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Student Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition font-mono"
                    />
                  </div>

                  {/* Mail ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Mail ID (Read-only)</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-400 cursor-not-allowed font-mono"
                    />
                  </div>

                  {/* Gender Options (Male, Female, Others) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white outline-none transition cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white outline-none transition cursor-pointer"
                    />
                  </div>

                  {/* Board (CBSE, ICSE, WBCHSE) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Board</label>
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
                      className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white outline-none transition cursor-pointer"
                    >
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE</option>
                      <option value="WBCHSE">WBCHSE</option>
                    </select>
                  </div>

                  {/* Dynamic Field: Class (for CBSE/ICSE) OR Semester (for WBCHSE) */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider">
                      {board === "WBCHSE" ? "Semester (WBCHSE)" : `Class (${board})`}
                    </label>
                    {board === "WBCHSE" ? (
                      <select
                        value={academicLevel}
                        onChange={(e) => setAcademicLevel(e.target.value)}
                        className="w-full bg-slate-950/90 border border-cyan-500/40 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white outline-none transition cursor-pointer font-bold text-cyan-300"
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
                        className="w-full bg-slate-950/90 border border-cyan-500/40 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white outline-none transition cursor-pointer font-bold text-cyan-300"
                      >
                        <option value="11">Class 11</option>
                        <option value="12">Class 12</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white text-xs font-extrabold tracking-wide uppercase transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {profileLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{profileLoading ? "Saving Changes..." : "Save Profile Details"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Security & Credentials Card */}
            <div className="bg-gradient-to-b from-[#0e1a26]/90 via-[#0a131d]/90 to-[#060c13]/90 border border-cyan-500/30 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-cyan-500/20 pb-4">
                <div className="p-2.5 bg-blue-950/80 rounded-xl border border-blue-500/40 text-blue-300">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">Security & Password</h3>
                  <p className="text-xs text-slate-400">Update your account password to protect your test attempts</p>
                </div>
              </div>

              {/* OTP Verification & Password Policy Instructions */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h4 className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider">Email OTP Verification Required</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Send a verification code to <strong className="text-white font-mono">{email}</strong> to verify student identity</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendPasswordOtp}
                    disabled={sendingOtp || resendCooldown > 0}
                    className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 hover:text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {sendingOtp ? "Sending OTP..." : resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Send Email OTP"}
                  </button>
                </div>
                {otpSentMsg && (
                  <div className="p-3 rounded-lg bg-green-950/80 border border-green-600/50 text-green-300 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{otpSentMsg}</span>
                  </div>
                )}
              </div>

              {/* Password Feedback Alerts */}
              {passMsg && (
                <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 border ${
                  passMsg.type === "success" 
                    ? "bg-green-950/80 border-green-600/60 text-green-300" 
                    : "bg-red-950/80 border-red-600/60 text-red-300"
                }`}>
                  {passMsg.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                  <span>{passMsg.text}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* OTP Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Verification OTP *</span>
                      <span className="text-[11px] text-slate-400 font-normal">Check your inbox</span>
                    </label>
                    <input
                      type="text"
                      value={passwordOtp}
                      onChange={(e) => setPasswordOtp(e.target.value)}
                      placeholder="6-digit OTP code"
                      className="w-full bg-slate-950/90 border border-cyan-500/40 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition font-mono tracking-widest"
                    />
                  </div>

                  {/* Current Password (Optional) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Current Password (Optional)</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Enter current password if set"
                      className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">New Password *</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter strong new password"
                      className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Confirm New Password *</span>
                      {confirmPassword && (
                        <span className={`text-[11px] font-bold ${newPassword === confirmPassword ? "text-green-400" : "text-red-400"}`}>
                          {newPassword === confirmPassword ? "✓ Passwords Match" : "✗ Passwords Mismatch"}
                        </span>
                      )}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>
                </div>

                {/* Password Policy Security Checklist */}
                <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                    Password Security Policy Checklist:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center gap-2 font-medium ${reqLength ? "text-green-400 font-bold" : "text-slate-500"}`}>
                      <span>{reqLength ? "✓" : "○"}</span> Minimum 8 characters long
                    </div>
                    <div className={`flex items-center gap-2 font-medium ${reqUpper ? "text-green-400 font-bold" : "text-slate-500"}`}>
                      <span>{reqUpper ? "✓" : "○"}</span> At least 1 uppercase letter (A-Z)
                    </div>
                    <div className={`flex items-center gap-2 font-medium ${reqLower ? "text-green-400 font-bold" : "text-slate-500"}`}>
                      <span>{reqLower ? "✓" : "○"}</span> At least 1 lowercase letter (a-z)
                    </div>
                    <div className={`flex items-center gap-2 font-medium ${reqNumber ? "text-green-400 font-bold" : "text-slate-500"}`}>
                      <span>{reqNumber ? "✓" : "○"}</span> At least 1 numeric digit (0-9)
                    </div>
                    <div className={`flex items-center gap-2 font-medium ${reqSpecial ? "text-green-400 font-bold" : "text-slate-500"}`}>
                      <span>{reqSpecial ? "✓" : "○"}</span> At least 1 special character (@, #, $, %, etc.)
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={passLoading || !passwordOtp || !allReqsMet || newPassword !== confirmPassword}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-extrabold tracking-wide uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {passLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    <span>{passLoading ? "Updating Password..." : "Verify OTP & Save Password"}</span>
                  </button>
                </div>
              </form>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
