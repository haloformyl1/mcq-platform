"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Copy, Check, X, User, Mail, Phone, ShieldCheck, 
  ArrowLeft, KeyRound, CheckCircle2, AlertCircle, LogOut, Sparkles, 
  Clock, RefreshCw, CreditCard, MonitorSmartphone, ChevronRight, 
  ChevronDown, Layers, Laptop, Shield, CheckCircle, Smartphone, Tablet, Monitor, Receipt, Tag, History
} from "lucide-react";
import AdminPreviewBanner from "@/components/AdminPreviewBanner";
import PiechemLogo from "@/components/PiechemLogo";
import PiFiringLoader from "@/components/PiFiringLoader";
import SubscriptionExpiredModal from "@/components/SubscriptionExpiredModal";
import GoldUpgradeCelebrationModal from "@/components/GoldUpgradeCelebrationModal";
import NotificationCenterDropdown from "@/components/NotificationCenterDropdown";

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


const POPULAR_UPI_HANDLES = [
  "@oksbi", "@okhdfcbank", "@okaxis", "@okicici",
  "@ybl", "@ibl", "@axl", "@paytm", "@upi",
  "@sbi", "@icici", "@hdfcbank", "@axisbank",
  "@kotak", "@indus", "@barodampay", "@federal", "@postbank"
];

function isValidUpiId(upi: string): boolean {
  if (!upi || typeof upi !== "string") return false;
  const clean = upi.trim().toLowerCase();
  const upiRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,48}[a-zA-Z0-9]@[a-zA-Z]{2,30}$/;
  if (!upiRegex.test(clean)) return false;
  if (clean.includes("..") || clean.includes("--") || clean.includes("__")) return false;
  return true;
}

export default function StudentAccountPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "membership" | "security" | "devices" | "profiles" | "change-plan">("overview");

  const validTabs: Array<"overview" | "membership" | "security" | "devices" | "profiles" | "change-plan"> = [
    "overview", "membership", "security", "devices", "profiles", "change-plan"
  ];

  const lastBaseTabRef = useRef<"overview" | "membership" | "security" | "devices" | "profiles" | "change-plan">("overview");

  type ModalType = "pay" | "promo" | "billing-history" | "plan-status" | "payment-done";

  const closeAllModals = () => {
    setShowPaymentModal(false);
    setShowPromoModal(false);
    setShowHistoryModal(false);
    setShowHighestPlanModal(false);
    setShowPaymentDoneDialog(false);
    setPaymentStep("input");
    setUpgradeMsg(null);
  };

  const openModal = (modalName: ModalType) => {
    if (typeof window !== "undefined") {
      const targetHash = `#${modalName}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState({ modal: modalName, fromTab: activeTab }, "", `${window.location.pathname}${targetHash}`);
      }
    }
    if (modalName === "pay") {
      setShowPaymentModal(true);
      setShowPromoModal(false);
      setShowHistoryModal(false);
      setShowHighestPlanModal(false);
      setShowPaymentDoneDialog(false);
      fetchUpgradeRequest();
    } else if (modalName === "promo") {
      setShowPromoModal(true);
      setShowPaymentModal(false);
      setShowHistoryModal(false);
      setShowHighestPlanModal(false);
      setShowPaymentDoneDialog(false);
    } else if (modalName === "billing-history") {
      setShowHistoryModal(true);
      setShowPaymentModal(false);
      setShowPromoModal(false);
      setShowHighestPlanModal(false);
      setShowPaymentDoneDialog(false);
    } else if (modalName === "plan-status") {
      setShowHighestPlanModal(true);
      setShowPaymentModal(false);
      setShowPromoModal(false);
      setShowHistoryModal(false);
      setShowPaymentDoneDialog(false);
    } else if (modalName === "payment-done") {
      setShowPaymentDoneDialog(true);
    }
  };

  const handleCloseModal = (fallbackTab?: "overview" | "membership" | "security" | "devices" | "profiles" | "change-plan") => {
    if (typeof window !== "undefined") {
      const currentHash = window.location.hash.replace(/^#/, "").toLowerCase();
      const modalHashes = ["pay", "renew", "promo", "redeem-promo", "billing-history", "history", "plan-status", "highest-plan", "payment-done"];
      if (modalHashes.includes(currentHash)) {
        if (window.history.length > 1) {
          window.history.back();
          setTimeout(() => {
            const checkHash = window.location.hash.replace(/^#/, "").toLowerCase();
            if (modalHashes.includes(checkHash)) {
              closeAllModals();
              navigateToTab(fallbackTab || lastBaseTabRef.current || "overview", true);
            }
          }, 150);
          return;
        }
      }
    }
    closeAllModals();
    navigateToTab(fallbackTab || lastBaseTabRef.current || "overview", true);
  };

  const navigateToTab = (tab: "overview" | "membership" | "security" | "devices" | "profiles" | "change-plan", replace = false) => {
    setActiveTab(tab);
    lastBaseTabRef.current = tab;
    closeAllModals();
    if (typeof window !== "undefined") {
      const targetHash = tab === "overview" ? "" : `#${tab}`;
      const targetUrl = targetHash ? `${window.location.pathname}${targetHash}` : window.location.pathname;
      if (window.location.hash !== targetHash) {
        if (replace) {
          window.history.replaceState({ tab }, "", targetUrl);
        } else {
          window.history.pushState({ tab }, "", targetUrl);
        }
      }
    }
  };

  const handleBackNavigation = () => {
    if (typeof window !== "undefined") {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        navigateToTab("overview");
      }
    } else {
      setActiveTab("overview");
    }
  };
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
  const [allUpgradeReqs, setAllUpgradeReqs] = useState<any[]>([]);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoMsg, setPromoMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<any>({ upiId: "9830507435@upi", payeeName: "Arghyadeep Roy", monthlyFee: 199.0 });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHighestPlanModal, setShowHighestPlanModal] = useState(false);
  const [studentUpiId, setStudentUpiId] = useState("");
  const [paymentStep, setPaymentStep] = useState<"input" | "notice" | "waiting" | "success">("input");
  const [utrNumber, setUtrNumber] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [requestingUpgrade, setRequestingUpgrade] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [paymentDoneAcknowledged, setPaymentDoneAcknowledged] = useState(false);
  const [showPaymentDoneDialog, setShowPaymentDoneDialog] = useState(false);

  // Netflix-style Manage Access and Devices States
  const [devicesList, setDevicesList] = useState<any[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>("");
  const [expandedDeviceIds, setExpandedDeviceIds] = useState<Record<string, boolean>>({});
  const [revokingDeviceId, setRevokingDeviceId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [deviceActionMsg, setDeviceActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password Change Form States
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
        if (d.allRequests) setAllUpgradeReqs(d.allRequests);
        if (d.paymentSettings) setPaymentSettings(d.paymentSettings);
      })
      .catch(() => {});
  };

  useEffect(() => {
    const handleUrlChange = () => {
      if (typeof window === "undefined") return;
      const rawHash = window.location.hash.replace(/^#/, "").toLowerCase();

      if (rawHash === "pay" || rawHash === "renew") {
        setShowPaymentModal(true);
        setShowPromoModal(false);
        setShowHistoryModal(false);
        setShowHighestPlanModal(false);
        setShowPaymentDoneDialog(false);
        if (rawHash === "renew") {
          setActiveTab("membership");
          lastBaseTabRef.current = "membership";
        }
        return;
      }

      if (rawHash === "payment-done") {
        setShowPaymentDoneDialog(true);
        setShowPromoModal(false);
        setShowHistoryModal(false);
        setShowHighestPlanModal(false);
        return;
      }

      if (rawHash === "promo" || rawHash === "redeem-promo") {
        setShowPromoModal(true);
        setShowPaymentModal(false);
        setShowHistoryModal(false);
        setShowHighestPlanModal(false);
        setShowPaymentDoneDialog(false);
        return;
      }

      if (rawHash === "billing-history" || rawHash === "history") {
        setShowHistoryModal(true);
        setShowPaymentModal(false);
        setShowPromoModal(false);
        setShowHighestPlanModal(false);
        setShowPaymentDoneDialog(false);
        return;
      }

      if (rawHash === "plan-status" || rawHash === "highest-plan") {
        setShowHighestPlanModal(true);
        setShowPaymentModal(false);
        setShowPromoModal(false);
        setShowHistoryModal(false);
        setShowPaymentDoneDialog(false);
        return;
      }

      // Base tab navigation: Close all modals and show active tab
      setShowPaymentModal(false);
      setShowPromoModal(false);
      setShowHistoryModal(false);
      setShowHighestPlanModal(false);
      setShowPaymentDoneDialog(false);
      setPaymentStep("input");

      if (validTabs.includes(rawHash as any)) {
        setActiveTab(rawHash as any);
        lastBaseTabRef.current = rawHash as any;
      } else {
        setActiveTab("overview");
        lastBaseTabRef.current = "overview";
      }
    };

    handleUrlChange();

    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("hashchange", handleUrlChange);

    fetchUpgradeRequest();

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("hashchange", handleUrlChange);
    };
  }, []);

  // Prevent background body scroll when any full-screen modal/window is open (eliminates double scrollbars)
  useEffect(() => {
    const isModalOpen = showPaymentModal || showPromoModal || showHistoryModal || showHighestPlanModal || showPaymentDoneDialog;
    if (typeof document !== "undefined") {
      if (isModalOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [showPaymentModal, showPromoModal, showHistoryModal, showHighestPlanModal, showPaymentDoneDialog]);

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
        if (resData.devices) {
          setDevicesList(resData.devices);
        }
        if (resData.currentDeviceId) {
          setCurrentDeviceId(resData.currentDeviceId);
        }
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
  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/student/devices");
      if (res.ok) {
        const d = await res.json();
        if (d.devices) setDevicesList(d.devices);
        if (d.currentDeviceId) setCurrentDeviceId(d.currentDeviceId);
      }
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    if (activeTab === "devices") {
      fetchDevices();
      const interval = setInterval(fetchDevices, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const toggleDeviceExpand = (id: string) => {
    setExpandedDeviceIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSignOutDevice = async (id: string) => {
    setRevokingDeviceId(id);
    setDeviceActionMsg(null);
    try {
      const res = await fetch("/api/student/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signout_device", targetId: id }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to sign out device");
      if (resData.signedOutCurrent) {
        router.push("/login");
        return;
      }
      if (resData.devices) {
        setDevicesList(resData.devices);
      } else {
        setDevicesList(prev => prev.filter(d => d.id !== id && d.deviceId !== id));
      }
      setDeviceActionMsg({ type: "success", text: "Signed out of device successfully." });
    } catch (err: any) {
      setDeviceActionMsg({ type: "error", text: err.message || "Failed to sign out device." });
    } finally {
      setRevokingDeviceId(null);
    }
  };

  const handleSignOutAllDevices = async () => {
    if (!confirm("Are you sure you want to sign out of all devices? You will need to sign in again.")) return;
    setRevokingAll(true);
    setDeviceActionMsg(null);
    try {
      const res = await fetch("/api/student/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signout_all" }),
      });
      if (res.ok) {
        router.push("/login");
      }
    } catch (err) {
      setDeviceActionMsg({ type: "error", text: "Failed to sign out of all devices." });
    } finally {
      setRevokingAll(false);
    }
  };

  
  const handleProceedClick = () => {
    const trimmedUpi = studentUpiId.trim().toLowerCase();
    if (!isValidUpiId(trimmedUpi)) {
      setUpgradeMsg({ 
        type: "error", 
        text: "Please enter a valid UPI ID (e.g. 9830507435@upi or name@oksbi). Only strictly valid UPI formats can proceed." 
      });
      return;
    }
    setUpgradeMsg(null);
    setPaymentStep("notice");
  };

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
      openModal("plan-status");
    } else {
      navigateToTab("change-plan");
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
    : "Never (Complimentary Pass)";

  const isComplimentary = student.subscriptionStatus === "COMPLIMENTARY" || (isGold && !student.subscriptionExpiresAt);
  const isLifetime = isComplimentary;
  const is30Day = isGold && !!student.subscriptionExpiresAt;

  const rawPayerUpi = (upgradeReq?.utrNumber && upgradeReq.utrNumber.includes("@"))
    ? upgradeReq.utrNumber
    : (paymentSettings?.upiId || "arg9830@axl");

  const displayUpiId = (() => {
    if (rawPayerUpi.includes("@")) {
      const [user, domain] = rawPayerUpi.split("@");
      return `${user.slice(0, 1)}•••@${domain}`;
    }
    return rawPayerUpi;
  })();

  const isPhonePe = rawPayerUpi.toLowerCase().endsWith("@ybl") || 
                    rawPayerUpi.toLowerCase().endsWith("@ibl") || 
                    rawPayerUpi.toLowerCase().endsWith("@axl");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07131e] via-[#040911] to-black text-white font-sans selection:bg-cyan-500 selection:text-black pb-24">
      <AdminPreviewBanner />
      <SubscriptionExpiredModal student={student} />
      <GoldUpgradeCelebrationModal student={student} />

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
            {/* Option 3: Golden Status Pill */}
            {isGold && (
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("piechem:show-celebration"));
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-500/50 text-amber-300 hover:text-amber-200 text-xs font-black tracking-wide shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:scale-105 transition-all cursor-pointer"
                title="Gold Membership Active - Click to view validity & perks"
              >
                <span className="text-sm">⭐</span>
                <span>GOLD MEMBER</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            )}

            {/* Option 4: Notification Center Dropdown */}
            <NotificationCenterDropdown student={student} upgradeReq={upgradeReq} />
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
                      navigateToTab("profiles");
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-cyan-950/50 hover:text-white transition text-left cursor-pointer"
                  >
                    <User className="w-4 h-4 text-cyan-400" />
                    <span>Edit Profile Details</span>
                  </button>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigateToTab("security");
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
              onClick={handleBackNavigation}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-cyan-400 hover:text-cyan-300 transition group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Overview</span>
            </button>
          )}

          {activeTab !== "overview" && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/30 text-slate-400 hover:text-cyan-300 text-xs font-bold transition cursor-pointer"
            >
              <span>Exit to Dashboard</span>
            </Link>
          )}
        </div>

        {/* Header Titles */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {activeTab === "change-plan"
              ? "Change plan"
              : activeTab === "devices"
              ? "Manage Access and Devices"
              : activeTab === "security"
              ? "Security & Password"
              : activeTab === "profiles"
              ? "Student Profile & Curriculum"
              : activeTab === "membership"
              ? "Membership"
              : "Account"}
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-1">
            {activeTab === "change-plan" ? (
              "Choose the plan that's right for you. Upgrade anytime to unlock all chemistry exams and features."
            ) : activeTab === "devices" ? (
              <>
                These signed-in devices have recently been active on this account. You can sign out any unfamiliar devices or{" "}
                <button
                  onClick={() => navigateToTab("security")}
                  className="text-cyan-400 underline hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  change your password
                </button>{" "}
                for added security.
              </>
            ) : activeTab === "security" ? (
              "Update your account credentials to protect your proctored exam history."
            ) : activeTab === "profiles" ? (
              "Customize your display avatar, personal details, and academic board."
            ) : activeTab === "membership" ? (
              "Plan Details"
            ) : (
              "Membership details"
            )}
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
                      {!isGold
                        ? "Free Tier"
                        : is30Day
                        ? "30-Day Premium Access"
                        : "Complimentary"}
                    </p>
                  </div>

                  {/* Payment / Renewal Info - Only for 30-Day Premium Access */}
                  {is30Day && (
                    <div className="pt-2 text-sm text-slate-300 font-medium space-y-2">
                      <p>
                        <span className="text-slate-400">Next renewal: </span>
                        <span className="font-bold text-amber-300 font-mono">{nextPaymentFormatted}</span>
                      </p>

                      {/* Netflix-style UPI handle without payee name */}
                      <div className="flex items-center gap-2 pt-0.5">
                        {isPhonePe ? (
                          <div className="w-5 h-5 rounded bg-[#5f259f] flex items-center justify-center text-white text-[11px] font-bold shadow-sm select-none shrink-0">
                            पे
                          </div>
                        ) : (
                          <div className="px-1.5 py-0.5 rounded bg-[#061421] border border-cyan-500/30 text-[10px] font-bold text-cyan-400 font-mono shrink-0">
                            UPI
                          </div>
                        )}
                        <span className="text-xs sm:text-sm font-medium text-slate-200 font-mono">
                          {displayUpiId}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Divider & Manage Membership Link Row */}
                  <div className="pt-5 mt-5 border-t border-cyan-500/15 flex items-center justify-between">
                    <button
                      onClick={() => navigateToTab("membership")}
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
                              ? "You are currently enrolled in the highest possible plan on PieChem"
                              : "Explore available plans and upgrade to Premium Pass"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-cyan-500/70 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    

                    {/* Manage Access and Devices */}
                    <button
                      onClick={() => navigateToTab("devices")}
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
                      onClick={() => navigateToTab("profiles")}
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
                      onClick={() => navigateToTab("security")}
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
                    onClick={() => navigateToTab("profiles")}
                    className="px-4 py-2 rounded-xl border border-cyan-500/40 text-xs font-bold text-cyan-300 hover:bg-cyan-950/60 hover:text-white transition cursor-pointer shrink-0"
                  >
                    Edit Profile
                  </button>
                </div>

              </div>
            )}

            {/* VIEW B: MEMBERSHIP TAB (NETFLIX STYLE) */}
            {activeTab === "membership" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* 1. Plan Details Card (Netflix Red/Purple Gradient Top Accent) */}
                <div className="bg-gradient-to-b from-[#0a1726]/90 via-[#07111c]/90 to-[#03080e]/95 rounded-2xl border border-cyan-500/30 shadow-xl overflow-hidden">
                  <div className="h-1.5 w-full bg-gradient-to-r from-[#221f52] via-[#e50914] to-[#e50914]" />
                  
                  <div className="p-6 sm:p-7 space-y-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {isGold ? "Premium plan" : "Basic Student Plan"}
                    </h3>
                    <p className="text-sm font-semibold text-cyan-400">
                      {!isGold
                        ? "Free Tier"
                        : is30Day
                        ? "30-Day Premium Access"
                        : "Complimentary"}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-400 pt-1 leading-relaxed">
                      {isGold
                        ? "Full access to Chemistry exam test series, detailed answer explanations, and proctored ranking analytics."
                        : "Standard access to chemistry practice tests with instant automated grading."}
                    </p>

                    <div className="border-t border-cyan-500/15 mt-5 pt-1">
                      <button
                        onClick={handleChangePlanClick}
                        className="w-full py-4 flex items-center justify-between text-left hover:bg-cyan-950/30 transition group cursor-pointer"
                      >
                        <span className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition">
                          Change plan
                        </span>
                        <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Payment Info Section */}
                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Payment info
                  </h3>

                  <div className="bg-gradient-to-b from-[#0a1726]/90 via-[#07111c]/90 to-[#03080e]/95 rounded-2xl border border-cyan-500/30 shadow-xl divide-y divide-cyan-500/15 overflow-hidden">
                    
                    {/* Next Renewal / Payment Handle Row */}
                    <div className="p-6 sm:p-7 space-y-1.5">
                      <h4 className="text-base sm:text-lg font-bold text-white">
                        {is30Day ? "Next renewal" : isLifetime ? "Membership" : "Payment status"}
                      </h4>
                      <p className="text-sm text-slate-300 font-mono font-medium">
                        {is30Day ? nextPaymentFormatted : isComplimentary ? "Complimentary Pass" : "No payment method on file"}
                      </p>

                      {is30Day && (
                        <div className="flex items-center gap-2 pt-1.5">
                          {isPhonePe ? (
                            <div className="w-5 h-5 rounded bg-[#5f259f] flex items-center justify-center text-white text-[11px] font-bold shadow-sm select-none shrink-0">
                              पे
                            </div>
                          ) : (
                            <div className="px-1.5 py-0.5 rounded bg-[#061421] border border-cyan-500/30 text-[10px] font-bold text-cyan-400 font-mono shrink-0">
                              UPI
                            </div>
                          )}
                          <span className="text-xs sm:text-sm font-medium text-slate-200 font-mono">
                            {displayUpiId}
                          </span>
                        </div>
                      )}
                    </div>


                    {/* Redeem Gift or Promo Code Link */}
                    <button
                      onClick={() => {
                        setPromoMsg(null);
                        setPromoCodeInput("");
                        openModal("promo");
                      }}
                      className="w-full px-6 sm:px-7 py-4 flex items-center justify-between text-left hover:bg-cyan-950/30 transition group cursor-pointer"
                    >
                      <span className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition">
                        Redeem gift or promo code
                      </span>
                      <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* View Payment History Link */}
                    <button
                      onClick={() => openModal("billing-history")}
                      className="w-full px-6 sm:px-7 py-4 flex items-center justify-between text-left hover:bg-cyan-950/30 transition group cursor-pointer"
                    >
                      <span className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition">
                        View payment history
                      </span>
                      <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                  </div>
                </div>

                {/* What is included in Gold Membership Checklist */}
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
                
                {/* Global Status Notification */}
                {deviceActionMsg && (
                  <div
                    className={`p-4 rounded-xl text-xs font-medium border flex items-center justify-between gap-3 ${
                      deviceActionMsg.type === "success"
                        ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                        : "bg-red-950/80 border-red-500/40 text-red-300"
                    }`}
                  >
                    <span>{deviceActionMsg.text}</span>
                    <button onClick={() => setDeviceActionMsg(null)} className="cursor-pointer text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Sign out of all devices header card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#0a1726]/90 via-[#07111c]/90 to-[#03080e]/95 p-4 sm:p-5 rounded-2xl border border-cyan-500/25 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shadow-sm">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Signed-in Devices ({devicesList.length || 1})</h3>
                      <p className="text-xs text-slate-400">
                        Active web browsers and device sessions authenticated with {student.email}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleSignOutAllDevices}
                    disabled={revokingAll}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-400 hover:text-red-300 text-xs font-bold transition self-start sm:self-auto cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{revokingAll ? "Signing out..." : "Sign out of all devices"}</span>
                  </button>
                </div>

                {/* Device Cards List (Netflix inspired) */}
                <div className="space-y-3.5">
                  {devicesList.length === 0 ? (
                    <div className="bg-gradient-to-b from-[#0a1726]/90 via-[#07111c]/90 to-[#03080e]/95 rounded-2xl border border-cyan-500/20 p-6 text-center text-slate-400 text-xs">
                      <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin mx-auto mb-2" />
                      Loading signed-in devices...
                    </div>
                  ) : (
                    devicesList.map((dev: any, idx: number) => {
                      const devKey = dev.id || dev.deviceId || String(idx);
                      const isExpanded = !!expandedDeviceIds[devKey];
                      const isCurrent = Boolean(dev.isCurrent || (idx === 0 && devicesList.length === 1));

                      return (
                        <div
                          key={devKey}
                          className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-gradient-to-b from-[#0a1726]/90 via-[#07111c]/90 to-[#03080e]/95 ${
                            isCurrent
                              ? "border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.1)]"
                              : "border-cyan-500/20 hover:border-cyan-500/40"
                          }`}
                        >
                          {/* Card Header Row */}
                          <div
                            onClick={() => toggleDeviceExpand(devKey)}
                            className="p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer select-none"
                          >
                            <div className="flex items-start gap-4">
                              {/* Device Icon */}
                              <div className="p-3 rounded-xl bg-[#061421] border border-cyan-500/30 text-slate-300 shrink-0 mt-0.5 shadow-sm">
                                {dev.deviceType === "mobile" ? (
                                  <Smartphone className="w-5 h-5 text-cyan-400" />
                                ) : dev.deviceType === "tablet" ? (
                                  <Tablet className="w-5 h-5 text-cyan-400" />
                                ) : (
                                  <Laptop className="w-5 h-5 text-cyan-400" />
                                )}
                              </div>

                              <div className="space-y-1">
                                {/* CURRENT DEVICE Badge */}
                                {isCurrent && (
                                  <div className="mb-1.5">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 shadow-sm">
                                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                      CURRENT DEVICE
                                    </span>
                                  </div>
                                )}

                                {/* Device Name (Netflix style) */}
                                <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                  {dev.deviceName || "PC Chrome - Web browser"}
                                </h4>

                                {/* Activity Line with Clock */}
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 font-medium pt-0.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{dev.lastActiveFormatted || formatDateTime24(dev.lastActive || new Date())}</span>
                                  {(dev.isActiveNow || isCurrent) && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 ml-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active now
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Expand / Collapse Chevron */}
                            <button
                              type="button"
                              aria-label="Toggle device details"
                              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-cyan-950/40 transition shrink-0"
                            >
                              <ChevronDown
                                className={`w-5 h-5 transition-transform duration-200 ${
                                  isExpanded ? "rotate-180 text-cyan-400" : ""
                                }`}
                              />
                            </button>
                          </div>

                          {/* Accordion Expanded Body */}
                          {isExpanded && (
                            <div className="px-5 sm:px-6 pb-6 pt-1 border-t border-cyan-500/15 space-y-4 animate-in fade-in duration-150">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
                                <div className="p-3 rounded-xl bg-[#061421] border border-cyan-500/20">
                                  <span className="text-slate-500 block font-medium">Account Profile</span>
                                  <span className="text-slate-200 font-mono font-semibold truncate block mt-0.5">
                                    {student.email}
                                  </span>
                                </div>

                                <div className="p-3 rounded-xl bg-[#061421] border border-cyan-500/20">
                                  <span className="text-slate-500 block font-medium">Approximate IP / Network</span>
                                  <span className="text-slate-200 font-mono font-semibold block mt-0.5">
                                    {dev.ipAddress || "India"}
                                  </span>
                                </div>

                                <div className="p-3 rounded-xl bg-[#061421] border border-cyan-500/20">
                                  <span className="text-slate-500 block font-medium">Session Registered</span>
                                  <span className="text-slate-200 font-mono font-semibold block mt-0.5">
                                    {dev.createdAtFormatted || dev.lastActiveFormatted || "-"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[11px] text-slate-500">
                                  Device ID: <span className="font-mono">{dev.deviceId ? dev.deviceId.slice(0, 18) + "..." : "dev_current"}</span>
                                </span>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isCurrent) {
                                      handleLogout();
                                    } else {
                                      handleSignOutDevice(dev.id || dev.deviceId);
                                    }
                                  }}
                                  disabled={revokingDeviceId === (dev.id || dev.deviceId)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-400 hover:text-red-300 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                >
                                  <LogOut className="w-3.5 h-3.5" />
                                  <span>
                                    {revokingDeviceId === (dev.id || dev.deviceId)
                                      ? "Signing out..."
                                      : isCurrent
                                      ? "Sign out of this device"
                                      : "Sign out"}
                                  </span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Exam Integrity & Security Posture Card */}
                <div className="p-5 sm:p-6 rounded-2xl border border-cyan-500/20 bg-slate-950/80 space-y-3 mt-6">
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
            )}


            {/* VIEW F: CHANGE PLAN TAB (NETFLIX-INSPIRED) */}
            {activeTab === "change-plan" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                
                {/* Plan Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
                  
                  {/* Card 1: Basic Student Plan (Netflix-Inspired Standard Blue/Purple Gradient) */}
                  <div className="rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-b from-[#0e1c2e]/95 via-[#081320]/95 to-[#03080e]/95 shadow-[0_0_50px_rgba(99,102,241,0.18)] flex flex-col justify-between overflow-hidden relative transition hover:border-indigo-400 hover:shadow-[0_0_60px_rgba(99,102,241,0.28)]">
                    
                    {/* Card Head (Netflix Standard Vibrant Blue/Purple Gradient Banner) */}
                    <div className="p-6 bg-gradient-to-r from-[#203a94] via-[#4338ca] to-[#723abb] text-white relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-black tracking-widest uppercase bg-black/30 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white border border-white/20">
                          FREE TIER
                        </span>
                        {!isGold && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-cyan-300 text-xs font-black shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Current plan
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-black text-white tracking-tight">Basic</h3>
                      <p className="text-xs text-white/80 mt-1">Foundational practice tier for chemistry students</p>
                    </div>

                    {/* Features Comparison Rows */}
                    <div className="p-6 space-y-4 flex-1 text-sm divide-y divide-indigo-500/15">
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-300 font-medium">Monthly price</span>
                        <span className="font-bold text-white font-mono text-base">₹0</span>
                      </div>
                      <div className="flex justify-between items-center pt-3">
                        <span className="text-slate-300 font-medium">Chemistry Exam Tests</span>
                        <span className="font-semibold text-slate-200">Selected tests are free.</span>
                      </div>
                      <div className="flex justify-between items-center pt-3">
                        <span className="text-slate-300 font-medium">Answer Explanations</span>
                        <span className="font-semibold text-slate-200">Standard Answer Key</span>
                      </div>
                      <div className="flex justify-between items-center pt-3">
                        <span className="text-slate-300 font-medium">Study Materials</span>
                        <span className="font-semibold text-slate-200">Selected Free Chapters</span>
                      </div>
                      <div className="flex justify-between items-center pt-3">
                        <span className="text-slate-300 font-medium">Ranking & Analytics</span>
                        <span className="font-semibold text-slate-200">Basic Score Summary</span>
                      </div>
                      <div className="flex justify-between items-center pt-3">
                        <span className="text-slate-300 font-medium">Supported Devices</span>
                        <span className="font-semibold text-slate-200">1 Active Device</span>
                      </div>
                    </div>

                    {/* Card CTA */}
                    <div className="p-6 pt-0 mt-auto">
                      {!isGold ? (
                        <div className="w-full py-4 rounded-xl bg-gradient-to-r from-[#203a94]/40 via-[#4338ca]/30 to-[#723abb]/40 border border-indigo-500/40 text-indigo-200 font-bold text-xs uppercase tracking-wider text-center select-none flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.2)]">
                          <Check className="w-4 h-4 text-cyan-400" />
                          <span>Enrolled (Current Plan)</span>
                        </div>
                      ) : (
                        <div className="w-full py-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-slate-400 text-xs font-semibold text-center select-none">
                          Standard Free Tier
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Premium Plan (Netflix-Inspired Crimson/Indigo Gradient) */}
                  <div className="rounded-2xl border-2 border-rose-500/50 bg-gradient-to-b from-[#0e1c2e]/95 via-[#081320]/95 to-[#03080e]/95 shadow-[0_0_50px_rgba(225,29,72,0.18)] flex flex-col justify-between overflow-hidden relative transition hover:border-rose-500 hover:shadow-[0_0_60px_rgba(225,29,72,0.28)]">
                    
                    {/* Card Head (Vibrant Gradient Banner) */}
                    <div className="p-6 bg-gradient-to-r from-[#4338ca] via-[#6366f1] to-[#e50914] text-white relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-black tracking-widest uppercase bg-black/30 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white border border-white/20">
                          RECOMMENDED
                        </span>
                        {isGold ? (
                          <span className="inline-flex items-center gap-1 text-xs font-black text-amber-300 bg-black/30 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-amber-400/30">
                            <Sparkles className="w-3.5 h-3.5" /> Current plan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-black text-amber-300">
                            <Sparkles className="w-3.5 h-3.5" /> 30-Day Pass
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-black text-white tracking-tight">Premium</h3>
                      <p className="text-xs text-white/80 mt-1">Full access to 50+ exams, 3D models & proctored rankings</p>
                    </div>

                    {/* Features Comparison Rows */}
                    <div className="p-6 space-y-4 flex-1 text-sm divide-y divide-cyan-500/15">
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-300 font-medium">Monthly price</span>
                        <div className="text-right">
                          <span className="text-xl font-black text-amber-300 font-mono">₹{paymentSettings?.monthlyFee || 199}</span>
                          <span className="text-xs text-slate-400 block">/ 30 days</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-3">
                        <span className="text-slate-300 font-medium">Chemistry Exam Tests</span>
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Unlimited
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-3">
                        <span className="text-slate-300 font-medium">Answer Explanations</span>
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Full Solutions & 3D Models
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-3">
                        <span className="text-slate-300 font-medium">Study Materials</span>
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Complete Digital Library
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-3">
                        <span className="text-slate-300 font-medium">Ranking & Analytics</span>
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Proctored National Percentile
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-3">
                        <span className="text-slate-300 font-medium">Supported Devices</span>
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Mobile, Tablet, PC / Laptop (Max 2 device)
                        </span>
                      </div>
                    </div>

                    {/* Card CTA Button */}
                    <div className="p-6 pt-0 mt-auto">
                      {!isGold ? (
                        <button
                          onClick={() => {
                            openModal("pay");
                          }}
                          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#e50914] via-[#b81d24] to-[#4338ca] hover:from-[#f40612] hover:to-[#4f46e5] text-white font-black text-sm tracking-wider uppercase shadow-[0_0_35px_rgba(229,9,20,0.45)] hover:shadow-[0_0_45px_rgba(229,9,20,0.65)] hover:scale-[1.01] active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>Upgrade to Premium</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="w-full py-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider text-center select-none flex items-center justify-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Enrolled ({isComplimentary ? "Complimentary" : "Active Pass"})</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Footer Assurance Banner */}
                <div className="text-center pt-2 space-y-2 text-xs text-slate-400 max-w-2xl mx-auto">
                  <p className="flex items-center justify-center gap-1.5 font-medium">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                    Instant activation upon PhonePe, Google Pay, or Paytm UPI verification.
                  </p>
                  <p>
                    Have a promo voucher?{" "}
                    <button
                      onClick={() => {
                        setPromoMsg(null);
                        setPromoCodeInput("");
                        openModal("promo");
                      }}
                      className="text-cyan-400 underline hover:text-cyan-300 font-semibold cursor-pointer"
                    >
                      Redeem gift or promo code
                    </button>
                  </p>
                </div>

              </div>
            )}

      </main>
      {/* 3. INSTANT UPI QR CODE MODAL (NETFLIX PREMIUM CRIMSON/INDIGO THEME) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-[#030811] text-white overflow-y-auto no-scrollbar flex flex-col animate-in fade-in duration-200">
          
          {/* Top Navbar - Piechem Logo at Far Left Visible as Always, Back & Close Terminated */}
          <header className="sticky top-0 z-40 bg-[#030910]/95 backdrop-blur-2xl border-b border-cyan-500/20 shadow-[0_10px_35px_rgba(0,0,0,0.7)]">
            <div className="w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
              
              {/* Left: Brand Identity & Designer Attribution */}
              <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
                <PiechemLogo size="md" theme="dark" href="/dashboard" />
                
                <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-[#061421]/90 text-[9px] sm:text-[10px] text-slate-300 font-medium shadow-sm shrink-0">
                  <span className="text-slate-400">Designed by</span>
                  <span className="font-semibold text-cyan-400">Arghyadeep Roy</span>
                  <span className="text-cyan-500/60"> </span>
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

              {/* Right: Instant UPI Badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-red-950/80 via-[#1e1028] to-indigo-950/80 border border-rose-500/30 text-rose-300 text-xs font-black uppercase tracking-wider shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pay with UPI</span>
                </span>
              </div>

            </div>
          </header>

          {/* Full Screen Main Content */}
          <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
            
            {/* Plan & Pricing Box */}
            <div className="bg-slate-950/90 border border-rose-500/30 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Gold Membership
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white">30 Days All-Access Pass</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Full access to all 50+ Chemistry Exams, 3D Molecular Models, Full Solutions & Proctored Analytics
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <span className="text-3xl font-black text-amber-300 font-mono">
                    ₹{paymentSettings?.monthlyFee || 199}
                  </span>
                  <span className="text-xs text-slate-400 block font-normal">/ 30 Days</span>
                </div>
              </div>
            </div>

            {/* State: INPUT STEP */}
            {paymentStep === "input" && (
              <div className="space-y-5 bg-[#0a1524]/70 p-5 sm:p-7 rounded-3xl border border-rose-500/30 shadow-xl">
                
                {/* Instruction */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-rose-950/40 border border-rose-500/30 flex items-start gap-3">
                  <div className="p-1.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-rose-200">
                      Please enter the UPI ID using which you will initiate the payment.
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Once entered, you can complete the payment directly via Mobile App or by scanning the Dynamic UPI QR Code (with fixed amount ₹{paymentSettings?.monthlyFee || 199}) on PC / Laptop.
                    </p>
                  </div>
                </div>

                {/* UPI ID Input Field */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Your UPI ID (VPA):</span>
                    <span className="text-xs font-normal text-slate-400 font-mono">e.g. mobile@upi or name@oksbi</span>
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
                      className={"w-full bg-slate-950/90 text-white rounded-2xl px-5 py-4 text-sm font-mono tracking-wide outline-none transition border " + (
                        studentUpiId.trim()
                          ? isValidUpiId(studentUpiId)
                            ? "border-emerald-500/60 focus:border-emerald-400 focus:shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                            : "border-rose-500/60 focus:border-rose-400 focus:shadow-[0_0_25px_rgba(225,29,72,0.3)]"
                          : "border-rose-500/40 focus:border-rose-400 focus:shadow-[0_0_25px_rgba(225,29,72,0.3)]"
                      )}
                    />
                    {studentUpiId.trim().length > 0 && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                        {isValidUpiId(studentUpiId) ? (
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Valid UPI Format</span>
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-rose-400 flex items-center gap-1 font-mono">
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                            <span className="text-xs">Strict format required</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Handle Completion Pills */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span>Quick handles (tap to append):</span>
                      <span className="text-[11px] text-slate-500 font-mono">18 available</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 py-1">
                      {POPULAR_UPI_HANDLES.map((handle) => (
                        <button
                          key={handle}
                          type="button"
                          onClick={() => {
                            const base = studentUpiId.includes("@") ? studentUpiId.split("@")[0] : studentUpiId;
                            setStudentUpiId((base || "") + handle);
                            if (upgradeMsg) setUpgradeMsg(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs font-mono hover:bg-rose-900/60 hover:border-rose-400 hover:text-white transition cursor-pointer"
                        >
                          {handle}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {upgradeMsg && (
                  <div className={"p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border " + (
                    upgradeMsg.type === "success"
                      ? "bg-green-950/80 border-green-600/60 text-green-300"
                      : "bg-red-950/80 border-red-600/60 text-red-300"
                  )}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{upgradeMsg.text}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleProceedClick}
                  disabled={requestingUpgrade || !studentUpiId.trim() || !isValidUpiId(studentUpiId)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#e50914] via-[#b81d24] to-[#4338ca] hover:from-[#f40612] hover:to-[#4f46e5] text-white font-black text-sm uppercase tracking-wider shadow-[0_0_35px_rgba(229,9,20,0.45)] hover:shadow-[0_0_45px_rgba(229,9,20,0.65)] hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{"PROCEED TO PAY (₹" + (paymentSettings?.monthlyFee || 199) + ")"}</span>
                  <ChevronRight className="w-5 h-5" />
                </button>

                <p className="text-xs text-slate-400 text-center pt-1">
                  0% Processing Fees • Official Admin UPI • Instant Gold Pass Activation
                </p>
              </div>
            )}

            {/* State: NOTICE STEP */}
            {paymentStep === "notice" && (
              <div className="space-y-6 bg-[#0a1524]/70 p-6 sm:p-8 rounded-3xl border border-rose-500/30 shadow-xl animate-in fade-in duration-300">
                
                {/* Warning / Timeline Notice Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/40 via-rose-950/30 to-[#0a1726] border-2 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)] space-y-3">
                  <div className="flex items-center gap-2.5 text-amber-300">
                    <Clock className="w-6 h-6 text-amber-400 shrink-0 animate-pulse" />
                    <h4 className="text-base font-black uppercase tracking-wider">
                      Important Verification Notice
                    </h4>
                  </div>

                  <p className="text-base sm:text-lg text-slate-100 font-semibold leading-relaxed">
                    After completing your payment, please allow up to 24 hours for transaction confirmation and premium access grant by our administration.
                  </p>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-2 border-t border-amber-500/20">
                    Our team manually validates each payment against your registered UPI ID to ensure account integrity and exam security. Your dashboard access will unlock automatically as soon as verification is approved.
                  </p>
                </div>

                {/* Payment Details Recap */}
                <div className="p-5 rounded-2xl bg-slate-950/90 border border-rose-500/30 space-y-3 text-sm">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Registered Payer UPI ID:</span>
                    <span className="font-mono font-bold text-white text-base">{studentUpiId}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Payable Amount:</span>
                    <span className="font-mono font-bold text-amber-300 text-base">₹{paymentSettings?.monthlyFee || 199}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Subscription Tier:</span>
                    <span className="font-bold text-slate-200">Gold Membership (30-Day Pass)</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSendUpgradeRequest}
                    disabled={requestingUpgrade}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#e50914] via-[#b81d24] to-[#4338ca] hover:from-[#f40612] hover:to-[#4f46e5] text-white font-black text-sm uppercase tracking-wider shadow-[0_0_35px_rgba(229,9,20,0.45)] hover:shadow-[0_0_45px_rgba(229,9,20,0.65)] hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{requestingUpgrade ? "Initiating Payment..." : "I Understand, Proceed to Pay"}</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentStep("input");
                      setUpgradeMsg(null);
                    }}
                    className="w-full py-3 rounded-xl text-xs text-slate-400 hover:text-white transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Change UPI ID</span>
                  </button>
                </div>

              </div>
            )}

            {/* State: WAITING / PAYMENT OPTIONS STEP */}
            {paymentStep === "waiting" && (
              <div className="space-y-6 bg-[#0a1524]/70 p-6 sm:p-8 rounded-3xl border border-rose-500/30 shadow-xl animate-in fade-in duration-300">
                
                {/* 24-Hour Confirmation Timeline Banner */}
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center gap-3 text-xs sm:text-sm text-amber-200 shadow-md">
                  <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>
                    <strong>Verification Timeline:</strong> After completing payment via UPI, please allow up to 24 hours for administrative confirmation and access grant.
                  </span>
                </div>

                {/* Status Banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/50 to-rose-950/50 border border-rose-500/30 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                      Registered Payer UPI ID:
                    </span>
                    <span className="text-base font-bold text-white font-mono flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      {studentUpiId}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-medium">Locked Amount:</span>
                    <span className="text-xl font-black text-amber-300 font-mono">
                      ₹{paymentSettings?.monthlyFee || 199}
                    </span>
                  </div>
                </div>

                {/* Two Payment Options: Mobile vs PC/Laptop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                  
                  {/* OPTION 1: MOBILE APP DIRECT */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/90 border border-rose-500/30 flex flex-col justify-between space-y-5">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold">
                        <MonitorSmartphone className="w-4 h-4 text-rose-400" />
                        <span>Mobile Device</span>
                      </div>
                      <h4 className="text-base font-bold text-white">
                        Pay Directly via UPI App
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        If you are on your smartphone, tap below to launch Google Pay, PhonePe, or Paytm with the fixed amount <strong>₹{paymentSettings?.monthlyFee || 199}</strong> pre-filled.
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      <a
                        href={"upi://pay?pa=" + (paymentSettings?.upiId || "9830507435@upi") + "&pn=" + encodeURIComponent(paymentSettings?.payeeName || "Arghyadeep Roy") + "&am=" + (paymentSettings?.monthlyFee || 199) + "&cu=INR&tn=" + encodeURIComponent("PIECHEM Gold Pass - " + (student.name || "Student"))}
                        className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gradient-to-r from-[#e50914] via-[#b81d24] to-[#4338ca] hover:from-[#f40612] hover:to-[#4f46e5] text-white font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(225,29,72,0.4)] hover:brightness-110 active:scale-98 transition cursor-pointer text-center"
                      >
                        <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
                        <span>Pay ₹{paymentSettings?.monthlyFee || 199} via UPI App</span>
                      </a>

                      <div className="text-xs text-slate-400 text-center font-mono">
                        Supports GPay, PhonePe, Paytm, BHIM
                      </div>
                    </div>
                  </div>

                  {/* OPTION 2: COMPUTER BROWSER (DYNAMIC QR) */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/90 border border-rose-500/30 text-center flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold">
                        <Monitor className="w-4 h-4 text-amber-400" />
                        <span>Computer Browser</span>
                      </div>
                      <h4 className="text-base font-bold text-white">
                        Scan Dynamic UPI QR
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Scan with any phone UPI app to complete your payment.
                      </p>
                    </div>

                    {/* QR Code Container */}
                    <div className="relative group inline-block mx-auto">
                      <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 opacity-35 blur group-hover:opacity-60 transition" />
                      <div className="relative p-3 bg-white rounded-xl shadow-2xl">
                        <img
                          src={"https://api.qrserver.com/v1/create-qr-code/?size=190x190&data=" + encodeURIComponent("upi://pay?pa=" + (paymentSettings?.upiId || "9830507435@upi") + "&pn=" + encodeURIComponent(paymentSettings?.payeeName || "Arghyadeep Roy") + "&am=" + (paymentSettings?.monthlyFee || 199) + "&cu=INR&tn=" + encodeURIComponent("PIECHEM Gold Pass - " + (student.name || "Student")))}
                          alt="Dynamic UPI Payment QR"
                          className="w-40 h-40 mx-auto object-contain"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Payee Info & Copy UPI */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950/90 border border-rose-500/20 rounded-2xl text-xs">
                  <div className="text-left">
                    <span className="text-slate-400 block text-xs">Receiving UPI ID (Admin):</span>
                    <span className="text-white font-mono font-bold text-sm">{paymentSettings?.upiId || "9830507435@upi"}</span>
                    <span className="text-slate-400 text-xs ml-2">({paymentSettings?.payeeName || "Arghyadeep Roy"})</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(paymentSettings?.upiId || "9830507435@upi");
                        setCopiedUpi(true);
                        setTimeout(() => setCopiedUpi(false), 2000);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-950 border border-rose-700/60 text-rose-300 text-xs font-mono hover:bg-rose-900 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedUpi ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedUpi ? "Copied!" : "Copy UPI"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentStep("input")}
                      className="text-xs text-slate-400 hover:text-rose-300 underline cursor-pointer"
                    >
                      Edit Payer UPI
                    </button>
                  </div>
                </div>

                {/* Live Status indicator */}
                <div className="p-4 bg-slate-950/80 border border-rose-500/20 rounded-2xl flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-400 font-medium">Payment Verification:</span>
                  <span className="text-amber-300 font-bold flex items-center gap-2 font-mono">
                    <RefreshCw className="w-4 h-4 animate-spin text-rose-400" /> Awaiting Confirmation
                  </span>
                </div>

                {/* Student Action: PAYMENT DONE */}
                {!paymentDoneAcknowledged ? (
                  <div className="space-y-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentDoneAcknowledged(true);
                        openModal("payment-done");
                      }}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#e50914] via-[#b81d24] to-[#4338ca] hover:from-[#f40612] hover:to-[#4f46e5] text-white font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(225,29,72,0.4)] hover:shadow-[0_0_35px_rgba(225,29,72,0.6)] hover:scale-[1.01] active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>PAYMENT DONE</span>
                    </button>
                    <p className="text-xs text-slate-400 text-center">
                      Tap above once you have transferred the amount in your UPI app.
                    </p>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-950/80 to-teal-950/60 border border-emerald-500/40 space-y-2 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Payment Submission Logged</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                      We will notify you once your plan has been upgraded, or you may check your account after 24 hours. Thank you.
                    </p>
                    <p className="text-xs text-amber-300/95 font-medium leading-relaxed">
                      Please do not reattempt payment during this time. If you face any issues regarding this payment, please contact us at <a href="tel:9830507435" className="underline font-mono font-bold text-cyan-300">9830507435</a>.
                    </p>
                    <button
                      type="button"
                      onClick={() => openModal("payment-done")}
                      className="text-xs text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer block pt-1"
                    >
                      View confirmation notice
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* State: SUCCESS / CONFIRMED STEP */}
            {paymentStep === "success" && (
              <div className="space-y-6 text-center py-8 bg-[#0a1524]/70 p-8 rounded-3xl border border-emerald-500/40 shadow-xl animate-in zoom-in-95 duration-300">
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping duration-1000" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.5)]">
                    <CheckCircle2 className="w-10 h-10 text-slate-950 stroke-[2.5]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Payment Verified & Approved!</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    Welcome to Gold Membership!
                  </h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    Your ₹{paymentSettings?.monthlyFee || 199} payment has been confirmed by Admin. All 50+ Chemistry Exams, full solutions, and proctored analytics are now fully unlocked for 30 days.
                  </p>
                </div>

                <div className="pt-4 max-w-sm mx-auto">
                  <button
                    type="button"
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
            <div className="pt-4 text-xs text-slate-400 text-center border-t border-rose-500/20">
              <span>Assistance or query? Contact Arghyadeep Roy: </span>
              <a href="tel:9830507435" className="font-mono font-bold text-rose-400 hover:underline">
                9830507435
              </a>
            </div>

          </main>
        </div>
      )}

      {/* 3.1 PAYMENT DONE CONFIRMATION DIALOG */}
      {showPaymentDoneDialog && (
        <div className="fixed inset-0 z-[60] bg-[#030811] text-white overflow-y-auto no-scrollbar flex flex-col animate-in fade-in duration-200">
          
          {/* Top Navbar - Piechem Logo at Far Left Visible as Always, Back & Close Terminated */}
          <header className="sticky top-0 z-40 bg-[#030910]/95 backdrop-blur-2xl border-b border-cyan-500/20 shadow-[0_10px_35px_rgba(0,0,0,0.7)]">
            <div className="w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
              
              {/* Left: Brand Identity & Designer Attribution */}
              <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
                <PiechemLogo size="md" theme="dark" href="/dashboard" />
                
                <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-[#061421]/90 text-[9px] sm:text-[10px] text-slate-300 font-medium shadow-sm shrink-0">
                  <span className="text-slate-400">Designed by</span>
                  <span className="font-semibold text-cyan-400">Arghyadeep Roy</span>
                  <span className="text-cyan-500/60"> </span>
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

              {/* Right: Payment Recorded Status */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Payment Recorded</span>
                </span>
              </div>

            </div>
          </header>

          <main className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-8 py-10 flex flex-col items-center justify-center text-center space-y-6 my-auto">
            
            {/* Glowing Icon */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border-2 border-emerald-400/40 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.35)]">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>

            {/* Status Pill */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>PAYMENT RECORDED</span>
            </div>

            {/* Official Message */}
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Payment Submission Received
              </h3>
              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-semibold">
                We will notify you once your plan has been upgraded, or you may check your account after 24 hours. Thank you.
              </p>
            </div>

            {/* Details Box */}
            <div className="w-full bg-slate-950/90 border border-rose-500/30 rounded-2xl p-5 text-left space-y-3 text-xs sm:text-sm shadow-xl">
              <div className="flex justify-between items-center text-slate-400">
                <span>Registered Payer UPI:</span>
                <span className="font-mono font-bold text-white text-sm">{studentUpiId || rawPayerUpi}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Verification Status:</span>
                <span className="font-bold text-amber-300 font-mono">Awaiting Confirmation</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Review Window:</span>
                <span className="font-bold text-slate-200">Up to 24 Hours</span>
              </div>
            </div>

            {/* Reattempt Advisory Notice & Contact Box */}
            <div className="w-full p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-left space-y-1.5 text-xs text-amber-200 shadow-md">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Important Payment Notice:</span>
              </div>
              <p className="leading-relaxed text-slate-200">
                Please do not reattempt payment during this time. If you face any problem related to this payment, please contact us at <a href="tel:9830507435" className="font-bold text-cyan-400 underline hover:text-cyan-300 font-mono">9830507435</a>.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full pt-3 space-y-3">
              <button
                type="button"
                onClick={() => handleCloseModal("change-plan")}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#e50914] via-[#b81d24] to-[#4338ca] hover:from-[#f40612] hover:to-[#4f46e5] text-white font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(225,29,72,0.4)] hover:brightness-110 active:scale-98 transition cursor-pointer"
              >
                GOT IT, CLOSE
              </button>

              <button
                type="button"
                onClick={() => openModal("pay")}
                className="text-xs text-slate-400 hover:text-cyan-300 transition underline cursor-pointer"
              >
                Keep payment screen open
              </button>
            </div>

          </main>
        </div>
      )}

      {/* 5. REDEEM GIFT OR PROMO CODE MODAL */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 bg-[#030811] text-white overflow-y-auto no-scrollbar flex flex-col animate-in fade-in duration-200">
          
          {/* Top Navbar - Piechem Logo at Far Left Visible as Always, Back & Close Terminated */}
          <header className="sticky top-0 z-40 bg-[#030910]/95 backdrop-blur-2xl border-b border-cyan-500/20 shadow-[0_10px_35px_rgba(0,0,0,0.7)]">
            <div className="w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
              
              {/* Left: Brand Identity & Designer Attribution */}
              <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
                <PiechemLogo size="md" theme="dark" href="/dashboard" />
                
                <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-[#061421]/90 text-[9px] sm:text-[10px] text-slate-300 font-medium shadow-sm shrink-0">
                  <span className="text-slate-400">Designed by</span>
                  <span className="font-semibold text-cyan-400">Arghyadeep Roy</span>
                  <span className="text-cyan-500/60"> </span>
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

              {/* Right: Promo Voucher Badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-black uppercase tracking-wider shadow-sm">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Promo Voucher</span>
                </span>
              </div>

            </div>
          </header>

          <main className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-8 py-10 flex flex-col justify-center space-y-6 my-auto">
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.25)]">
                <Tag className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                Apply Voucher or Promo Code
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Enter your voucher or discount code provided by administration.
              </p>
            </div>

            <div className="bg-[#0a1524]/80 p-6 rounded-3xl border border-cyan-500/30 space-y-4 shadow-xl">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Voucher / Promo Code:
                </label>
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => {
                    setPromoCodeInput(e.target.value.toUpperCase());
                    if (promoMsg) setPromoMsg(null);
                  }}
                  placeholder="e.g. PIECHEM2026 or GOLD30"
                  className="w-full bg-slate-950/90 text-white rounded-2xl px-5 py-4 text-base font-mono tracking-widest outline-none transition border border-cyan-500/40 focus:border-cyan-400 focus:shadow-[0_0_25px_rgba(6,182,212,0.3)] uppercase"
                />
              </div>

              {promoMsg && (
                <div className={"p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border " + (
                  promoMsg.type === "success"
                    ? "bg-green-950/80 border-green-600/60 text-green-300"
                    : "bg-red-950/80 border-red-600/60 text-red-300"
                )}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{promoMsg.text}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (!promoCodeInput.trim()) {
                    setPromoMsg({ type: "error", text: "Please enter a voucher or promo code." });
                    return;
                  }
                  setPromoMsg({ type: "error", text: "Invalid or expired promo code. Please check with administrator." });
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-98 transition cursor-pointer"
              >
                APPLY CODE
              </button>
            </div>

          </main>
        </div>
      )}

      {/* 6. PAYMENT HISTORY MODAL (NETFLIX STYLE) */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-[#030811] text-white overflow-y-auto no-scrollbar flex flex-col animate-in fade-in duration-200">
          
          {/* Top Navbar - Piechem Logo at Far Left Visible as Always, Back & Close Terminated */}
          <header className="sticky top-0 z-40 bg-[#030910]/95 backdrop-blur-2xl border-b border-cyan-500/20 shadow-[0_10px_35px_rgba(0,0,0,0.7)]">
            <div className="w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
              
              {/* Left: Brand Identity & Designer Attribution */}
              <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
                <PiechemLogo size="md" theme="dark" href="/dashboard" />
                
                <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-[#061421]/90 text-[9px] sm:text-[10px] text-slate-300 font-medium shadow-sm shrink-0">
                  <span className="text-slate-400">Designed by</span>
                  <span className="font-semibold text-cyan-400">Arghyadeep Roy</span>
                  <span className="text-cyan-500/60"> </span>
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

              {/* Right: Payment History Badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-black uppercase tracking-wider shadow-sm">
                  <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Payment History</span>
                </span>
              </div>

            </div>
          </header>

          <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
            
            <div className="bg-[#0a1524]/80 rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl p-4 sm:p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-cyan-500/20 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="pb-3 px-3">Date</th>
                      <th className="pb-3 px-3">Description</th>
                      <th className="pb-3 px-3">Payer UPI ID</th>
                      <th className="pb-3 px-3">Amount</th>
                      <th className="pb-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {allUpgradeReqs && allUpgradeReqs.length > 0 ? (
                      allUpgradeReqs.map((req: any) => (
                        <tr key={req.id} className="hover:bg-cyan-950/20 transition">
                          <td className="py-4 px-3 text-slate-300 font-mono text-xs">
                            {formatDateTime24(req.createdAt)}
                          </td>
                          <td className="py-4 px-3 text-white font-medium">
                            30-Day Gold Pass
                          </td>
                          <td className="py-4 px-3 text-slate-400 font-mono text-xs">
                            {req.utrNumber || "-"}
                          </td>
                          <td className="py-4 px-3 text-amber-300 font-bold font-mono">
                            ₹{req.amount || paymentSettings?.monthlyFee || 199}
                          </td>
                          <td className="py-4 px-3">
                            <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold " + (
                              req.status === "APPROVED"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                                : req.status === "PENDING"
                                ? "bg-amber-950 text-amber-300 border border-amber-500/40"
                                : "bg-red-950 text-red-300 border border-red-500/40"
                            )}>
                              {req.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No previous payment records found on file.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </main>
        </div>
      )}

      {/* 4. HIGHEST ENROLLED PLAN MODAL */}
      {showHighestPlanModal && (
        <div className="fixed inset-0 z-50 bg-[#030811] text-white overflow-y-auto no-scrollbar flex flex-col animate-in fade-in duration-200">
          
          {/* Top Navbar - Piechem Logo at Far Left Visible as Always, Back & Close Terminated */}
          <header className="sticky top-0 z-40 bg-[#030910]/95 backdrop-blur-2xl border-b border-cyan-500/20 shadow-[0_10px_35px_rgba(0,0,0,0.7)]">
            <div className="w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
              
              {/* Left: Brand Identity & Designer Attribution */}
              <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
                <PiechemLogo size="md" theme="dark" href="/dashboard" />
                
                <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-[#061421]/90 text-[9px] sm:text-[10px] text-slate-300 font-medium shadow-sm shrink-0">
                  <span className="text-slate-400">Designed by</span>
                  <span className="font-semibold text-cyan-400">Arghyadeep Roy</span>
                  <span className="text-cyan-500/60"> </span>
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

              {/* Right: Top Tier Badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Top Tier Enrolled</span>
                </span>
              </div>

            </div>
          </header>

          <main className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-8 py-10 flex flex-col items-center justify-center text-center space-y-6 my-auto">
            
            {/* Glowing Trophy / Badge Icon */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500/20 via-yellow-400/20 to-cyan-400/20 border-2 border-amber-400/40 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.35)]">
              <Sparkles className="w-10 h-10 text-amber-400" />
            </div>

            {/* Top Tier Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-sm">
              <span>★ TOP TIER ENROLLED</span>
            </div>

            {/* Heading & Exact Requested Message */}
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Highest Plan Active
              </h3>
              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-semibold">
                You are currently enrolled in the highest possible plan on PieChem.
              </p>
            </div>

            {/* Current Plan Card */}
            <div className="w-full bg-slate-950/80 border border-cyan-500/30 rounded-3xl p-5 text-left space-y-2.5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Active Membership</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active
                </span>
              </div>
              <p className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> {isComplimentary ? "Complimentary Premium Access" : "Gold Membership (Premium)"}
              </p>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                You already have full access to all 50+ exams, 3D molecular models, full solutions, and proctored analytics.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-3 pt-2">
              <button
                type="button"
                onClick={() => handleCloseModal()}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-98 cursor-pointer transition"
              >
                GOT IT, THANK YOU!
              </button>

              {is30Day && (
                <button
                  type="button"
                  onClick={() => {
                    openModal("pay");
                  }}
                  className="text-xs text-slate-400 hover:text-cyan-300 transition underline cursor-pointer block mx-auto"
                >
                  Need to renew or extend your 30-day pass instead?
                </button>
              )}
            </div>

          </main>
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
