"use client";

import React, { useState } from "react";
import { Download, AlertCircle, X, Loader2 } from "lucide-react";

interface DownloadLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyMaterialId: string;
  downloadUrl: string;
  isPremiumUser: boolean;
}

export default function DownloadLimitModal({
  isOpen,
  onClose,
  studyMaterialId,
  downloadUrl,
  isPremiumUser
}: DownloadLimitModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      setIsProcessing(true);
      const res = await fetch("/api/student/track-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyMaterialId }),
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.allowed) {
        alert(data.message || "Download limit reached");
        setIsProcessing(false);
        return;
      }

      // Trigger the actual download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank";
      link.download = "";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to process download");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 text-amber-400">
          <AlertCircle className="w-8 h-8" />
          <h2 className="text-lg font-bold">Download Limitation Notice</h2>
        </div>

        <div className="space-y-4 text-sm text-slate-300">
          <p className="font-semibold text-white">LIMIT DOWNLOADS!!</p>
          <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 space-y-2">
            <p>
              <strong className="text-cyan-400">FREE USERS:</strong> Can download all free contents but a maximum of <strong>3 per day & 10 per week</strong>.
            </p>
            <p>
              <strong className="text-amber-400">PREMIUM USERS:</strong> Can download all contents but a maximum of <strong>5 per day & 18 per week</strong>.
            </p>
          </div>
          <p className="text-xs text-slate-400 italic">
            This action will consume your download quota. Do you want to proceed?
          </p>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black transition-all shadow-[0_0_12px_rgba(0,217,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Confirm Download
          </button>
        </div>
      </div>
    </div>
  );
}
