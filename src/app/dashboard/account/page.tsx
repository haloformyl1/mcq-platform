"use client";
import GlobalFooter from "@/components/GlobalFooter";
import GlobalHeader from "@/components/GlobalHeader";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Copy, Check, X, User, Mail, ShieldCheck, 
  ArrowLeft, KeyRound, CheckCircle2, AlertCircle, LogOut, Sparkles, 
  Clock, RefreshCw, CreditCard, MonitorSmartphone, ChevronRight, 
  ChevronDown, Layers, Laptop, Shield, CheckCircle, Smartphone, Tablet, Monitor, Receipt, Tag, History, Phone
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
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
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
  const [purchasedBoard, setPurchasedBoard] = useState("CBSE");
  const [purchasedClass, setPurchasedClass] = useState("11");
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
          purchasedBoard,
          purchasedClass,
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
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("piechem_is_gold");
        localStorage.removeItem("piechem_gold_expires_at");
        localStorage.removeItem("piechem_is_complimentary");
        window.dispatchEvent(new Event("piechem_gold_status_changed"));
      } catch {}
    }
    document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  // Reactively synchronize localStorage to active subscription state (must be before early return)
  useEffect(() => {
    const student = data?.student;
    if (!student) return;
    const isComp = student.subscriptionStatus === "COMPLIMENTARY";
    const isPaid = student.subscriptionStatus === "PAID" && (!student.subscriptionExpiresAt || new Date(student.subscriptionExpiresAt).getTime() > now.getTime());
    const isGoldStatus = isComp || isPaid;

    if (typeof window !== "undefined") {
      try {
        if (isGoldStatus) {
          localStorage.setItem("piechem_is_gold", "true");
          if (isComp) {
            localStorage.setItem("piechem_is_complimentary", "true");
            localStorage.removeItem("piechem_gold_expires_at");
          } else if (student.subscriptionExpiresAt) {
            localStorage.setItem("piechem_gold_expires_at", new Date(student.subscriptionExpiresAt).toISOString());
            localStorage.removeItem("piechem_is_complimentary");
          }
        } else {
          localStorage.removeItem("piechem_is_gold");
          localStorage.removeItem("piechem_gold_expires_at");
          localStorage.removeItem("piechem_is_complimentary");
        }
        window.dispatchEvent(new Event("piechem_gold_status_changed"));
      } catch {}
    }
  }, [data?.student, now]);

  if (loading || !data) return <PiFiringLoader fullScreen={true} />;

  const { student, allAttempts = [] } = data;
  const completedAttempts = allAttempts.filter((a: any) => a.status === "SUBMITTED");
  const isComplimentary = student.subscriptionStatus === "COMPLIMENTARY" || (!student.subscriptionExpiresAt && student.subscriptionStatus === "PAID");
  const isPaidActive = student.subscriptionStatus === "PAID" && (!student.subscriptionExpiresAt || new Date(student.subscriptionExpiresAt).getTime() > now.getTime());
  const isGold = isComplimentary || isPaidActive;

  const isPaymentPending = upgradeReq?.status === "PENDING";
  const paymentPendingHours = isPaymentPending && upgradeReq?.createdAt 
    ? (now.getTime() - new Date(upgradeReq.createdAt).getTime()) / (1000 * 60 * 60) 
    : 0;
  const isPaymentPendingOver24h = paymentPendingHours >= 24;

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
    if (isPaymentPending) {
      navigateToTab("overview");
      return;
    }
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

  const isLifetime = isComplimentary;
  const is30Day = isGold && !!student.subscriptionExpiresAt;

  const latestApprovedReq = (data?.allRequests || []).find((r: any) => r.status === "APPROVED" && r.utrNumber?.includes("@"));
  const rawPayerUpi = latestApprovedReq?.utrNumber || null;

  const displayUpiId = rawPayerUpi ? (() => {
    const [user, domain] = rawPayerUpi.split("@");
    return `${user.slice(0, 1)}•••@${domain}`;
  })() : null;

  const isPhonePe = rawPayerUpi ? (rawPayerUpi.toLowerCase().endsWith("@ybl") || 
                    rawPayerUpi.toLowerCase().endsWith("@ibl") || 
                    rawPayerUpi.toLowerCase().endsWith("@axl")) : false;

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-white font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden">
      <AdminPreviewBanner />
      <SubscriptionExpiredModal student={student} />
      <GoldUpgradeCelebrationModal student={student} />

      {/* 1. TOP NAVBAR (UNIFIED RESPONSIVE GLOBAL HEADER WITH MOBILE DRAWER) */}
      <GlobalHeader
        student={student}
        upgradeReq={upgradeReq}
        isGoldMember={isGold}
      />
      {/* 2. MAIN LAYOUT (FULL SCREEN NETFLIX ACCOUNT SETTINGS PAGE) */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 sm:space-y-8 flex-1">
        
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

            {/* VIEW A: OVERVIEW TAB (Ultra-Premium Luxury Suite) */}
            {activeTab === "overview" && (
              <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
                
                {isPaymentPending && (
                  <div className="rounded-2xl bg-[#0b131e] border border-amber-500/20 p-6 sm:p-8 space-y-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6 text-amber-500" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <h2 className="text-xl font-bold text-white">Payment Verification In Progress</h2>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          Your payment has been submitted and is awaiting verification by the PIECHEM administration team.
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-[#111a27] rounded-xl p-4 sm:p-5 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Payment ID</div>
                        <div className="text-sm text-white font-mono">{upgradeReq.id}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Plan</div>
                        <div className="text-sm text-white font-medium">Gold Membership (Premium)</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Amount</div>
                        <div className="text-sm text-amber-500 font-bold font-mono">₹{upgradeReq.amount || paymentSettings?.monthlyFee || 199.0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Submitted</div>
                        <div className="text-sm text-slate-300 font-mono">{formatDateTime24(upgradeReq.createdAt)}</div>
                      </div>
                      <div className="sm:col-span-2 pt-2 border-t border-slate-800">
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Status</div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>Pending Admin Verification</span>
                        </div>
                      </div>
                    </div>
                    
                    {isPaymentPendingOver24h && (
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 mt-4 space-y-3">
                        <p className="text-sm text-slate-300 font-medium">
                          Your payment has been awaiting verification for more than 24 hours. If your payment status has still not been verified, please contact PIECHEM support.
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                          <a href="tel:9830507435" className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                            <Phone className="w-4 h-4" /> Call / WhatsApp: 9830507435
                          </a>
                          <a href="mailto:mailarghyadeeproy@gmail.com" className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                            <Mail className="w-4 h-4" /> Email: mailarghyadeeproy@gmail.com
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 1. Ultra-Luxury VIP Membership Passport Card */}
                <div className="relative overflow-hidden rounded-2xl bg-[#0b131e] border border-slate-800 p-7 sm:p-9 shadow-sm transition-all duration-300">
                  <div className="relative z-10 space-y-6">
                    {/* Top Meta: Member Since Pill + VIP Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Member since {memberSinceFormatted}</span>
                      </div>

                      {isGold && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/10 text-xs font-bold tracking-wider uppercase border border-emerald-500/20 text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>ACTIVE ACCESS</span>
                        </span>
                      )}
                    </div>

                    {/* Plan Name & VIP Perks Header */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-baseline gap-3">
                        {isGold ? (
                          <div className="flex items-center gap-1">
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">PIECHEM</h2>
                            <div className="relative ml-2 sm:ml-3 inline-flex items-center justify-center mb-1">
                              <div className="absolute inset-0 bg-blue-500/60 blur-md rounded-full"></div>
                              <span className="relative z-10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#181c25] text-slate-100 text-[9px] sm:text-[11px] font-bold tracking-wide normal-case border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.5)] leading-none flex items-center justify-center">
                                Pro
                              </span>
                            </div>
                          </div>
                        ) : (
                          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">Basic Student Plan</h2>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300/80 font-light max-w-xl leading-relaxed">
                        {isGold 
                          ? "Full VIP entitlement to chemistry exam series, 3D molecular simulations, comprehensive study material repositories, and instant proctored analytics."
                          : "Standard access to open practice tests and fundamental chemistry modules."}
                      </p>
                    </div>

                    {/* Plan Perks Showcase Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>All Live Examination Series & Speed Tests</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Interactive 3D Chemistry Simulations</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Curriculum Notes, DPPs & Suggestion Sets</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Real-Time State Percentiles & Accuracy</span>
                      </div>
                    </div>

                    {/* 30-Day Renewal & UPI Details */}
                    {is30Day && (
                      <div className="pt-4 text-sm text-slate-300 font-medium space-y-2 border-t border-slate-800">
                        <p>
                          <span className="text-slate-400">Next renewal: </span>
                          <span className="font-bold text-white">{nextPaymentFormatted}</span>
                        </p>
                        <div className="flex items-center gap-2 pt-0.5">
                          {isPhonePe ? (
                            <div className="w-6 h-6 rounded bg-[#5f259f] flex items-center justify-center text-white text-[11px] font-bold shadow-sm select-none shrink-0">
                              पे
                            </div>
                          ) : (
                            <div className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300 font-mono shrink-0">
                              UPI
                            </div>
                          )}
                          <span className="text-sm font-medium text-slate-300 font-mono">
                            {displayUpiId}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Divider & Manage Membership Link Row */}
                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => navigateToTab("membership")}
                        className="w-full flex items-center justify-between text-sm font-bold text-slate-300 hover:text-white transition group cursor-pointer text-left py-1"
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-slate-400" />
                          <span>Manage membership details & subscriptions</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. State-of-the-Art Luxury Quick Action Bento Grid */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <span>Quick links</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. Change Plan */}
                    {!isPaymentPending && (
                      <button
                        onClick={handleChangePlanClick}
                        className="group p-5 sm:p-6 rounded-2xl bg-[#0b131e] hover:bg-[#111a27] border border-slate-800 transition-colors cursor-pointer text-left flex flex-col justify-between min-h-[140px]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-slate-400 group-hover:text-amber-400 transition-colors">
                            <Layers className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {isAtHighestPlan ? "MAX TIER" : "UPGRADE"}
                          </span>
                        </div>

                        <div className="pt-4">
                          <div className="flex items-center justify-between text-base font-bold text-white">
                            <span>Change plan</span>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                          </div>
                          <p className="text-sm text-slate-400 mt-1">
                            {isAtHighestPlan 
                              ? "You are currently enrolled in the highest possible plan"
                              : "Explore available plans and upgrade to Premium"}
                          </p>
                        </div>
                      </button>
                    )}

                    {/* 2. Manage Access and Devices */}
                    <button
                      onClick={() => navigateToTab("devices")}
                      className="group p-5 sm:p-6 rounded-2xl bg-[#0b131e] hover:bg-[#111a27] border border-slate-800 transition-colors cursor-pointer text-left flex flex-col justify-between min-h-[140px]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-slate-400 group-hover:text-amber-400 transition-colors">
                          <MonitorSmartphone className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="pt-4">
                        <div className="flex items-center justify-between text-base font-bold text-white">
                          <span>Manage access and devices</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <p className="text-sm text-slate-400 mt-1">
                          View active sessions & signed-in browsers
                        </p>
                      </div>
                    </button>

                    {/* 3. Edit Student Profile & Curriculum */}
                    <button
                      onClick={() => navigateToTab("profiles")}
                      className="group p-5 sm:p-6 rounded-2xl bg-[#0b131e] hover:bg-[#111a27] border border-slate-800 transition-colors cursor-pointer text-left flex flex-col justify-between min-h-[140px]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-slate-400 group-hover:text-amber-400 transition-colors">
                          <User className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {student.board || "CBSE"} • {student.academicLevel || "11"}
                        </span>
                      </div>

                      <div className="pt-4">
                        <div className="flex items-center justify-between text-base font-bold text-white">
                          <span>Edit student & academic profile</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <p className="text-sm text-slate-400 mt-1">
                          Change avatar, update student name, phone, board
                        </p>
                      </div>
                    </button>

                    {/* 4. Update Password & Security */}
                    <button
                      onClick={() => navigateToTab("security")}
                      className="group p-5 sm:p-6 rounded-2xl bg-[#0b131e] hover:bg-[#111a27] border border-slate-800 transition-colors cursor-pointer text-left flex flex-col justify-between min-h-[140px]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-slate-400 group-hover:text-amber-400 transition-colors">
                          <KeyRound className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="pt-4">
                        <div className="flex items-center justify-between text-base font-bold text-white">
                          <span>Security & credentials</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <p className="text-sm text-slate-400 mt-1">
                          Set a new strong password
                        </p>
                      </div>
                    </button>
                  </div>
                </div>



              </div>
            )}

            {/* VIEW B: MEMBERSHIP TAB */}
            {activeTab === "membership" && (
              <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
                
                {/* 1. Plan Details Card */}
                <div className="bg-[#0b131e] rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
                  <div className="h-1 w-full bg-amber-500" />
                  
                  <div className="p-6 sm:p-8 space-y-2">
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      {isGold ? (
                        <div className="flex items-center">
                          <span>PIECHEM</span>
                          <div className="relative ml-2 sm:ml-3 inline-flex items-center justify-center mb-0.5">
                            <div className="absolute inset-0 bg-blue-500/60 blur-md rounded-full"></div>
                            <span className="relative z-10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#181c25] text-slate-100 text-[9px] sm:text-[11px] font-bold tracking-wide normal-case border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.5)] leading-none flex items-center justify-center">
                              Pro
                            </span>
                          </div>
                        </div>
                      ) : (
                        "Basic Student Plan"
                      )}
                    </h3>
                    {!isGold && (
                      <p className="text-sm font-semibold text-amber-500">
                        Free Tier
                      </p>
                    )}
                    <p className="text-sm text-slate-400 pt-1 leading-relaxed max-w-2xl">
                      {isGold
                        ? "Full access to Chemistry exam test series, detailed answer explanations, and proctored ranking analytics."
                        : "Standard access to chemistry practice tests with instant automated grading."}
                    </p>

                    {!isPaymentPending && (
                      <div className="border-t border-slate-800 mt-6 pt-2">
                        <button
                          onClick={handleChangePlanClick}
                          className="w-full py-4 flex items-center justify-between text-left hover:bg-[#111a27] transition-colors rounded-xl px-4 -mx-4 group cursor-pointer"
                        >
                          <span className="text-sm font-bold text-white">
                            Change plan
                          </span>
                          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Payment Info Section */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Payment info
                  </h3>

                  <div className="bg-[#0b131e] rounded-2xl border border-slate-800 divide-y divide-slate-800 overflow-hidden shadow-sm">
                    
                    {/* Next Renewal / Payment Handle Row */}
                    <div className="p-6 sm:p-7 space-y-1">
                      <h4 className="text-base font-bold text-white">
                        {is30Day ? "Next renewal" : isLifetime ? "Membership" : "Payment status"}
                      </h4>
                      <p className="text-sm text-slate-400">
                        {is30Day ? nextPaymentFormatted : isComplimentary ? "Complimentary Pass" : "No payment method on file"}
                      </p>

                      {is30Day && displayUpiId && (
                        <div className="flex items-center gap-2 pt-2">
                          {isPhonePe ? (
                            <div className="w-6 h-6 rounded bg-[#5f259f] flex items-center justify-center text-white text-xs font-bold shadow-sm select-none shrink-0">
                              पे
                            </div>
                          ) : (
                            <div className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300 font-mono shrink-0">
                              UPI
                            </div>
                          )}
                          <span className="text-sm font-medium text-slate-300 font-mono">
                            {displayUpiId}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Detailed Payment Status Row */}
                    <div className="p-6 sm:p-7 space-y-4">
                      {!upgradeReq ? (
                        <div className="text-sm font-medium text-slate-400">
                          Not Applicable
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {upgradeReq.status === "PENDING" && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>Under Verification by Admin</span>
                            </div>
                          )}
                          {upgradeReq.status === "APPROVED" && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Payment Accepted</span>
                            </div>
                          )}
                          {upgradeReq.status === "REJECTED" && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Payment Rejected</span>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                            <div>
                              <span className="block text-slate-500 mb-0.5">Submitted On:</span>
                              <span className="text-slate-300">{formatDateTime24(upgradeReq.createdAt)}</span>
                            </div>
                            {upgradeReq.status !== "PENDING" && (
                              <div>
                                <span className="block text-slate-500 mb-0.5">Admin Verified On:</span>
                                <span className="text-slate-300">
                                  {upgradeReq.approvedAt 
                                    ? formatDateTime24(upgradeReq.approvedAt) 
                                    : formatDateTime24(upgradeReq.updatedAt)}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="pt-2">
                            <p className="text-xs text-slate-400 leading-relaxed">
                              After payment, please allow us up to 24 hours to check and verify your payment. If you don't receive any resolution from us within this timeframe, please contact our support helpline:<br/>
                              <a href="tel:9830507435" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors mt-1 inline-block">
                                📞 9830507435
                              </a>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

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
                      <span>Unlimited 24/7 AI Tutor & Doubt Solver</span>
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
              <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
                
                <div className="bg-gradient-to-b from-[#0a1726]/90 via-[#07111c]/90 to-[#03080e]/95 rounded-2xl border border-cyan-500/30 shadow-xl p-6 sm:p-7 space-y-6">
                  
                  <div className=" pb-4">
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
              <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
                
                <div className="bg-gradient-to-b from-[#0a1726]/90 via-[#07111c]/90 to-[#03080e]/95 rounded-2xl border border-cyan-500/30 shadow-xl p-6 sm:p-7 space-y-6">
                  
                  <div className=" pb-4">
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
                          disabled={isGold}
                          className={"w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none transition cursor-pointer " + (isGold ? "bg-slate-900/50 border border-slate-800 text-slate-500 cursor-not-allowed" : "bg-slate-950/90 border border-slate-800 focus:border-cyan-400 text-cyan-300")}
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
                            disabled={isGold}
                            className={"w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none transition cursor-pointer " + (isGold ? "bg-slate-900/50 border border-slate-800 text-slate-500 cursor-not-allowed" : "bg-slate-950/90 border border-cyan-500/40 focus:border-cyan-400 text-cyan-300")}
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
                            disabled={isGold}
                            className={"w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none transition cursor-pointer " + (isGold ? "bg-slate-900/50 border border-slate-800 text-slate-500 cursor-not-allowed" : "bg-slate-950/90 border border-cyan-500/40 focus:border-cyan-400 text-cyan-300")}
                          >
                            <option value="11">Class 11</option>
                            <option value="12">Class 12</option>
                          </select>
                        )}
                      </div>

                      {isGold && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-amber-500/80 italic font-medium flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            You cannot modify your board and {board === "WBCHSE" ? "semester" : "class"} while your current plan is active.
                          </p>
                        </div>
                      )}
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
              <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
                
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
                {isPaymentPending ? (
                  <div className="max-w-4xl mx-auto rounded-2xl bg-[#0b131e] border border-amber-500/20 p-6 sm:p-8 space-y-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6 text-amber-500" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <h2 className="text-xl font-bold text-white">Payment Verification In Progress</h2>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          Your payment has been submitted and is awaiting verification by the PIECHEM administration team. You cannot change your plan while a payment is being verified.
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-[#111a27] rounded-xl p-4 sm:p-5 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Payment ID</div>
                        <div className="text-sm text-white font-mono">{upgradeReq.id}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Plan</div>
                        <div className="text-sm text-white font-medium">Gold Membership (Premium)</div>
                      </div>
                      <div className="sm:col-span-2 pt-2 border-t border-slate-800">
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Status</div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>Pending Admin Verification</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                      <button
                        onClick={() => navigateToTab("overview")}
                        className="px-6 py-3 rounded-xl bg-[#111a27] hover:bg-slate-800 border border-slate-700 text-white font-bold transition-colors cursor-pointer"
                      >
                        Return to Overview
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                        <span className="text-slate-300 font-medium">AI Tutor & Doubt Solver</span>
                        <span className="font-semibold text-slate-200">Basic Access (5 queries / day)</span>
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
                      <div className="flex items-center mt-1">
                        <h3 className="text-2xl font-black text-white tracking-tight">PIECHEM</h3>
                        <div className="relative ml-2 sm:ml-3 inline-flex items-center justify-center mb-0.5">
                          <div className="absolute inset-0 bg-blue-500/60 blur-md rounded-full"></div>
                          <span className="relative z-10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#181c25] text-slate-100 text-[9px] sm:text-[11px] font-bold tracking-wide normal-case border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.5)] leading-none flex items-center justify-center">
                            Pro
                          </span>
                        </div>
                      </div>
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
                        <span className="text-slate-300 font-medium">AI Tutor & Doubt Solver</span>
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Unlimited AI Access
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
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Mobile, Tablet, PC / Laptop (Max 2 devices)
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

                  </>
                )}
              </div>
            )}

      </main>
      {/* 3. INSTANT UPI QR CODE MODAL (PREMIUM SAAS THEME) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] bg-[#06101a] text-slate-200 overflow-y-auto no-scrollbar flex flex-col animate-in fade-in duration-300">
          
          {/* Subtle Atmospheric Background Gradients */}
          <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-900/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Top Navbar */}
          <header className="sticky top-0 z-40 bg-[#06101a]/80 backdrop-blur-xl border-b border-slate-800/80">
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between gap-3">
              
              {/* Left: Brand Identity */}
              <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
                <PiechemLogo size="sm" theme="dark" href="/dashboard" isGoldMember={isGold} />
              </div>

              {/* Right: Close & Secure */}
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Secure Checkout
                </span>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            </div>
          </header>

          {/* Full Screen Main Content */}
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-10 items-start">
              
              {/* LEFT COLUMN: PAYMENT STEPS */}
              <div className="space-y-6 order-last lg:order-first">


            {/* State: INPUT STEP */}
            {paymentStep === "input" && (
              <div className="space-y-6">
                
                <div className="space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Payment Method</h2>
                  <p className="text-sm text-slate-400">Complete your payment securely using UPI.</p>
                </div>
                
                <div className="bg-[#0b131e] p-6 rounded-2xl border border-slate-800 shadow-sm space-y-6">
                  
                  {/* Board and Class Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Board</label>
                      <select 
                        value={purchasedBoard}
                        onChange={(e) => {
                          setPurchasedBoard(e.target.value);
                          if (e.target.value === "WBCHSE") setPurchasedClass("SEM-I");
                          else setPurchasedClass("11");
                        }}
                        className="w-full bg-[#111a27] text-white rounded-xl px-4 py-3 text-sm font-medium border border-slate-700 outline-none focus:border-cyan-500/80"
                      >
                        <option value="CBSE">CBSE</option>
                        <option value="ICSE">ICSE</option>
                        <option value="WBCHSE">WBCHSE</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Class</label>
                      <select 
                        value={purchasedClass}
                        onChange={(e) => setPurchasedClass(e.target.value)}
                        className="w-full bg-[#111a27] text-white rounded-xl px-4 py-3 text-sm font-medium border border-slate-700 outline-none focus:border-cyan-500/80"
                      >
                        {purchasedBoard === "WBCHSE" ? (
                          <>
                            <option value="SEM-I">Semester I</option>
                            <option value="SEM-II">Semester II</option>
                            <option value="SEM-III">Semester III</option>
                            <option value="SEM-IV">Semester IV</option>
                          </>
                        ) : (
                          <>
                            <option value="11">Class 11</option>
                            <option value="12">Class 12</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* UPI ID Input Field */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>UPI ID / VPA</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={studentUpiId}
                        onChange={(e) => {
                          setStudentUpiId(e.target.value.trim().toLowerCase());
                          if (upgradeMsg) setUpgradeMsg(null);
                        }}
                        placeholder="e.g. mobile@upi or name@okbank"
                        className={"w-full bg-[#111a27] text-white rounded-xl px-4 py-3.5 text-base font-mono outline-none transition border focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/80 " + (
                          studentUpiId.trim()
                            ? isValidUpiId(studentUpiId)
                              ? "border-emerald-500/40"
                              : "border-rose-500/40"
                            : "border-slate-700"
                        )}
                      />
                      {studentUpiId.trim().length > 0 && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                          {isValidUpiId(studentUpiId) ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-rose-500" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick Handle Completion Pills */}
                    <div className="pt-2">
                      <div className="text-[11px] text-slate-500 font-medium mb-2">Popular handles</div>
                      <div className="flex flex-wrap items-center gap-2">
                        {POPULAR_UPI_HANDLES.map((handle) => (
                          <button
                            key={handle}
                            type="button"
                            onClick={() => {
                              const base = studentUpiId.includes("@") ? studentUpiId.split("@")[0] : studentUpiId;
                              setStudentUpiId((base || "") + handle);
                              if (upgradeMsg) setUpgradeMsg(null);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#111a27] border border-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-800 hover:text-white transition cursor-pointer"
                          >
                            {handle}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {upgradeMsg && (
                    <div className={"p-3.5 rounded-xl text-sm font-medium flex items-center gap-2 border " + (
                      upgradeMsg.type === "success"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    )}>
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{upgradeMsg.text}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleProceedClick}
                      disabled={requestingUpgrade || !studentUpiId.trim() || !isValidUpiId(studentUpiId)}
                      className="w-full h-14 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-sm uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Continue to Payment</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* State: NOTICE STEP */}
            {paymentStep === "notice" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                <div className="space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Confirm Payment</h2>
                  <p className="text-sm text-slate-400">Review your details before initiating the payment.</p>
                </div>
                
                <div className="bg-[#0b131e] p-6 rounded-2xl border border-slate-800 shadow-sm space-y-6">
                  
                  {/* Payment Details Recap */}
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400">Subscription Tier</span>
                      <span className="font-bold text-slate-200">Gold Membership — 30 Days</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400">Amount</span>
                      <span className="font-bold text-amber-400 font-mono text-base">₹{paymentSettings?.monthlyFee || 199}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400">Registered UPI</span>
                      <span className="font-mono font-medium text-white">{studentUpiId}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-400">Verification Timeline</span>
                      <span className="text-slate-300">Up to 24 hours</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleSendUpgradeRequest}
                      disabled={requestingUpgrade}
                      className="w-full h-14 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-sm uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>{requestingUpgrade ? "Initiating..." : "I Understand, Proceed to Pay"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentStep("input");
                        setUpgradeMsg(null);
                      }}
                      className="w-full py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-center"
                    >
                      Change UPI ID
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* State: WAITING / PAYMENT OPTIONS STEP */}
            {paymentStep === "waiting" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                <div className="space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Complete Payment</h2>
                  <p className="text-sm text-slate-400">Scan or tap to securely pay the subscription amount.</p>
                </div>

                <div className="bg-[#0b131e] p-6 rounded-2xl border border-slate-800 shadow-sm space-y-6">
                  
                  {/* Status Banner */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#111a27] border border-slate-800/80">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium mb-0.5">UPI ID (VPA)</span>
                      <span className="text-sm font-semibold text-white font-mono flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {studentUpiId}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-medium mb-0.5">Amount</span>
                      <span className="text-lg font-bold text-amber-400 font-mono">
                        ₹{paymentSettings?.monthlyFee || 199}
                      </span>
                    </div>
                  </div>

                  {/* Two Payment Options: Responsive Logic */}
                  <div className="grid grid-cols-1 gap-5">
                    
                    {/* OPTION 1: MOBILE APP DIRECT (Only on Mobile) */}
                    <div className="block md:hidden border border-slate-800 rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <MonitorSmartphone className="w-4 h-4 text-slate-400" />
                          Pay via UPI App
                        </div>
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded">
                          Recommended
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Tap below to launch GPay, PhonePe, or Paytm with the exact amount pre-filled.
                      </p>

                      <a
                        href={"upi://pay?pa=" + (paymentSettings?.upiId || "9830507435@upi") + "&pn=" + encodeURIComponent(paymentSettings?.payeeName || "Arghyadeep Roy") + "&am=" + (paymentSettings?.monthlyFee || 199) + "&cu=INR&tn=" + encodeURIComponent("PIECHEM Gold Pass - " + (student.name || "Student"))}
                        className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-sm transition-colors text-center"
                      >
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>Pay ₹{paymentSettings?.monthlyFee || 199} via UPI App</span>
                      </a>
                    </div>

                    {/* OPTION 2: COMPUTER BROWSER (DYNAMIC QR) */}
                    <div className="border border-slate-800 rounded-xl p-6 text-center space-y-4">
                      <div className="flex items-center justify-center gap-2 text-sm font-bold text-white mb-2">
                        <Monitor className="w-4 h-4 text-slate-400" />
                        Scan Dynamic UPI QR
                      </div>
                      <p className="text-xs text-slate-400">
                        Scan with any phone UPI app to complete your payment.
                      </p>

                      {/* QR Code Container */}
                      <div className="inline-block p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                        <img
                          src={"https://api.qrserver.com/v1/create-qr-code/?size=190x190&data=" + encodeURIComponent("upi://pay?pa=" + (paymentSettings?.upiId || "9830507435@upi") + "&pn=" + encodeURIComponent(paymentSettings?.payeeName || "Arghyadeep Roy") + "&am=" + (paymentSettings?.monthlyFee || 199) + "&cu=INR&tn=" + encodeURIComponent("PIECHEM Gold Pass - " + (student.name || "Student")))}
                          alt="Dynamic UPI Payment QR"
                          className="w-40 h-40 mx-auto object-contain"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Student Action: PAYMENT DONE */}
                  {!paymentDoneAcknowledged ? (
                    <div className="pt-4 border-t border-slate-800 text-center space-y-3">
                      <p className="text-xs text-slate-400">
                        After transferring the amount in your UPI app, please confirm below.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentDoneAcknowledged(true);
                          openModal("payment-done");
                        }}
                        className="w-full h-12 rounded-xl bg-[#111a27] hover:bg-slate-800 border border-slate-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>I have completed the payment</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-slate-800 space-y-2 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Payment Confirmation Logged</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Your payment submission has been recorded. Admin verification usually takes up to 24 hours.
                      </p>
                      <button
                        type="button"
                        onClick={() => openModal("payment-done")}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline mt-2 block"
                      >
                        View confirmation notice
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* State: SUCCESS / CONFIRMED STEP */}
            {paymentStep === "success" && (
              <div className="bg-[#0b131e] border border-emerald-500/30 p-8 rounded-3xl text-center shadow-sm animate-in zoom-in-95 duration-300 mt-10">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>

                <div className="space-y-2 mb-8">
                  <h3 className="text-2xl font-bold text-white">Payment Verified</h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Your ₹{paymentSettings?.monthlyFee || 199} payment has been confirmed. All Chemistry Exams, solutions, and analytics are now unlocked for 30 days.
                  </p>
                </div>

                <div className="max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPaymentStep("input");
                      window.location.reload();
                    }}
                    className="w-full h-12 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-bold text-sm transition-colors cursor-pointer"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )}
              </div>

              {/* RIGHT COLUMN: ORDER SUMMARY */}
              <div className="order-first lg:order-last space-y-6 lg:sticky lg:top-24">
                {/* Plan & Pricing Box */}
                <div className="bg-[#0b131e] border border-slate-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-widest mb-2 bg-amber-500/10 px-2.5 py-1 rounded">
                        <Sparkles className="w-3.5 h-3.5" /> Gold Membership
                      </div>
                      <h3 className="text-xl font-bold text-white tracking-tight">30 Days All-Access</h3>
                      <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                        Full access to all 50+ Chemistry Exams, 3D Molecular Models, Full Solutions & Proctored Analytics
                      </p>
                    </div>
                    <div className="pt-4 border-t border-slate-800">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-amber-400 font-mono tracking-tight">
                          ₹{paymentSettings?.monthlyFee || 199}
                        </span>
                        <span className="text-sm text-slate-500">/ 30 Days</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Support Contact */}
                <div className="pt-2 text-xs text-slate-500 text-center">
                  <span>Need assistance? Contact Support: </span>
                  <a href="tel:9830507435" className="font-mono font-medium text-slate-300 hover:text-white transition-colors block mt-1">
                    9830507435
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* 3.1 PAYMENT DONE CONFIRMATION DIALOG (PREMIUM SAAS THEME) */}
      {showPaymentDoneDialog && (
        <div className="fixed inset-0 z-[100] bg-[#06101a] text-slate-200 overflow-y-auto no-scrollbar flex flex-col animate-in fade-in duration-300">
          
          <header className="sticky top-0 z-40 bg-[#06101a]/80 backdrop-blur-xl border-b border-slate-800/80">
            <div className="w-full px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between gap-3">
              <div className="flex items-center min-w-0">
                <PiechemLogo size="sm" theme="dark" href="/dashboard" isGoldMember={isGold} />
              </div>
              <span className="text-xs font-semibold text-slate-400">Confirmation</span>
            </div>
          </header>

          <main className="flex-1 w-full max-w-lg mx-auto px-4 sm:px-8 py-12 flex flex-col items-center justify-center text-center">
            
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="space-y-2 mb-8">
              <h3 className="text-2xl font-bold text-white tracking-tight">Payment Submitted</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                Your payment is currently awaiting administrative confirmation. This process may take up to 24 hours.
              </p>
            </div>

            <div className="w-full bg-[#0b131e] border border-slate-800 rounded-xl p-6 text-left space-y-4 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Payer UPI ID</span>
                <span className="font-mono font-medium text-white">{studentUpiId || rawPayerUpi}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Status</span>
                <span className="font-medium text-amber-400">Awaiting Confirmation</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Review Window</span>
                <span className="font-medium text-slate-200">Up to 24 Hours</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCloseModal("change-plan")}
              className="w-full h-12 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-bold text-sm transition-colors cursor-pointer"
            >
              Return to Account
            </button>

          </main>
        </div>
      )}

      {/* 5. REDEEM GIFT OR PROMO CODE MODAL */}
      {showPromoModal && (
        <div className="fixed inset-0 z-[100] bg-[#030910]/95 backdrop-blur-3xl text-white overflow-y-auto no-scrollbar flex flex-col animate-in fade-in duration-300">
          
          {/* Top Navbar - Piechem Logo at Far Left Visible as Always, Back & Close Terminated */}
          <header className="sticky top-0 z-40 bg-[#030910]/95 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7)]">
            <div className="w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
              
              {/* Left: Brand Identity & Designer Attribution */}
              <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
                <PiechemLogo size="md" theme="dark" href="/dashboard" isGoldMember={isGold} />
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
              <div className="w-16 h-16 mx-auto rounded-full bg-[#0b131e] border border-slate-800 flex items-center justify-center text-slate-400">
                <Tag className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Apply Voucher or Promo Code
              </h3>
              <p className="text-sm text-slate-400">
                Enter your voucher or discount code provided by administration.
              </p>
            </div>

            <div className="bg-[#0b131e] p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
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
                  className="w-full bg-[#111a27] text-white rounded-xl px-5 py-4 text-base font-mono tracking-widest outline-none transition border border-slate-700 focus:border-slate-500 uppercase"
                />
              </div>

              {promoMsg && (
                <div className={"p-4 rounded-xl text-sm font-medium flex items-center gap-2 border " + (
                  promoMsg.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
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
                className="w-full h-14 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-bold text-sm transition-colors cursor-pointer"
              >
                Apply Code
              </button>
            </div>

          </main>
        </div>
      )}

      {/* 6. PAYMENT HISTORY MODAL (NETFLIX STYLE) */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[100] bg-[#030910]/95 backdrop-blur-3xl text-white overflow-y-auto no-scrollbar flex flex-col animate-in fade-in duration-300">
          
          {/* Top Navbar - Piechem Logo at Far Left Visible as Always, Back & Close Terminated */}
          <header className="sticky top-0 z-40 bg-[#030910]/95 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7)]">
            <div className="w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
              
              {/* Left: Brand Identity & Designer Attribution */}
              <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
                <PiechemLogo size="md" theme="dark" href="/dashboard" isGoldMember={isGold} />
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
            
            <div className="bg-[#0b131e] rounded-2xl border border-slate-800 overflow-hidden shadow-sm p-4 sm:p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <th className="pb-4 px-4">Date</th>
                      <th className="pb-4 px-4">Description</th>
                      <th className="pb-4 px-4">Payer UPI ID</th>
                      <th className="pb-4 px-4">Amount</th>
                      <th className="pb-4 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {allUpgradeReqs && allUpgradeReqs.length > 0 ? (
                      allUpgradeReqs.map((req: any) => (
                        <tr key={req.id} className="hover:bg-[#111a27] transition-colors">
                          <td className="py-4 px-4 text-slate-300 font-mono text-xs">
                            {formatDateTime24(req.createdAt)}
                          </td>
                          <td className="py-4 px-4 text-white font-medium">
                            30-Day Gold Pass
                          </td>
                          <td className="py-4 px-4 text-slate-400 font-mono text-xs">
                            {req.utrNumber || "-"}
                          </td>
                          <td className="py-4 px-4 text-amber-500 font-bold font-mono">
                            ₹{req.amount || paymentSettings?.monthlyFee || 199}
                          </td>
                          <td className="py-4 px-4">
                            <span className={"inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold " + (
                              req.status === "APPROVED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : req.status === "PENDING"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            )}>
                              {req.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                          No previous payment records found.
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
        <div className="fixed inset-0 z-[100] bg-[#030910]/95 backdrop-blur-3xl text-white overflow-y-auto no-scrollbar flex flex-col animate-in fade-in duration-300">
          
          {/* Top Navbar - Piechem Logo at Far Left Visible as Always, Back & Close Terminated */}
          <header className="sticky top-0 z-40 bg-[#030910]/95 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7)]">
            <div className="w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
              
              {/* Left: Brand Identity & Designer Attribution */}
              <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
                <PiechemLogo size="md" theme="dark" href="/dashboard" isGoldMember={isGold} />
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
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-amber-500" />
            </div>

            {/* Top Tier Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider">
              <span>Top Tier Enrolled</span>
            </div>

            {/* Heading & Exact Requested Message */}
            <div className="space-y-2">
              <h3 className="text-3xl font-bold text-white tracking-tight">
                Highest Plan Active
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                You are currently enrolled in the highest possible plan on PieChem.
              </p>
            </div>

            {/* Current Plan Card */}
            <div className="w-full bg-[#0b131e] border border-slate-800 rounded-2xl p-6 text-left space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400 font-medium">Active Membership</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                </span>
              </div>
              <p className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> {isComplimentary ? "Complimentary Premium Access" : "Gold Membership (Premium)"}
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">
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
      
          <GlobalFooter />
    </div>
  );
}
