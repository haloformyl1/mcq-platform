"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowLeft, Eye } from "lucide-react";

export default function AdminPreviewBanner() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Check if admin_session cookie is present
    const hasAdminSession = document.cookie.split("; ").some(c => c.startsWith("admin_session="));
    setIsAdminLoggedIn(hasAdminSession);
    setLoading(false);
  }, []);

  if (loading || !isAdminLoggedIn) return null;

  const handleReturnToAdmin = () => {
    router.push("/admin");
  };

  return (
    <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 text-sm font-medium flex items-center justify-between shadow-lg z-50 sticky top-0">
      <div className="flex items-center space-x-2">
        <div className="p-1 bg-black/20 rounded-md">
          <Eye className="w-4 h-4 text-amber-200 animate-pulse" />
        </div>
        <span>
          <strong className="font-semibold text-amber-100">Admin Preview Mode:</strong> You are currently testing the platform as a student.
        </span>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={handleReturnToAdmin}
          className="flex items-center space-x-1.5 bg-black/30 hover:bg-black/50 text-white px-3 py-1 rounded-md text-xs font-semibold transition border border-white/20 hover:border-white/40 shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Admin Panel</span>
        </button>
      </div>
    </div>
  );
}
