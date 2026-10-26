"use client";

import React from "react";
import { Bell } from "lucide-react";

interface ContentUpdateNoticeProps {
  className?: string;
  variant?: "cyan" | "amber" | "emerald" | "rose" | "purple" | "default";
}

export default function ContentUpdateNotice({
  className = "",
  variant = "cyan"
}: ContentUpdateNoticeProps) {
  const colorStyles = {
    cyan: {
      border: "border-cyan-500/30",
      containerBg: "bg-cyan-950/20",
      badgeBg: "bg-cyan-400 text-black",
      pingBg: "bg-black",
      badgeText: "CONTENT ALERT",
      textColor: "text-cyan-200"
    },
    amber: {
      border: "border-amber-500/30",
      containerBg: "bg-amber-950/20",
      badgeBg: "bg-amber-500 text-black",
      pingBg: "bg-black",
      badgeText: "CONTENT ALERT",
      textColor: "text-amber-200"
    },
    emerald: {
      border: "border-emerald-500/30",
      containerBg: "bg-emerald-950/20",
      badgeBg: "bg-emerald-400 text-black",
      pingBg: "bg-black",
      badgeText: "CONTENT ALERT",
      textColor: "text-emerald-200"
    },
    rose: {
      border: "border-rose-500/30",
      containerBg: "bg-rose-950/20",
      badgeBg: "bg-rose-500 text-white",
      pingBg: "bg-white",
      badgeText: "CONTENT ALERT",
      textColor: "text-rose-200"
    },
    purple: {
      border: "border-purple-500/30",
      containerBg: "bg-purple-950/20",
      badgeBg: "bg-purple-500 text-white",
      pingBg: "bg-white",
      badgeText: "CONTENT ALERT",
      textColor: "text-purple-200"
    },
    default: {
      border: "border-cyan-500/30",
      containerBg: "bg-cyan-950/20",
      badgeBg: "bg-cyan-400 text-black",
      pingBg: "bg-black",
      badgeText: "CONTENT ALERT",
      textColor: "text-cyan-200"
    }
  };

  const style = colorStyles[variant] || colorStyles.default;

  return (
    <div className={`w-full ${className}`}>
      <div className={`${style.containerBg} border ${style.border} rounded-2xl overflow-hidden py-2.5 px-4 backdrop-blur-sm shadow-lg`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <span className={`shrink-0 text-[11px] font-extrabold ${style.badgeBg} px-2.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1.5 shadow`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.pingBg} animate-ping`} />
            <Bell className="w-3 h-3" />
            {style.badgeText}
          </span>
          <div className="flex-1 overflow-hidden relative">
            <div className="animate-marquee whitespace-nowrap inline-block text-xs sm:text-sm font-semibold">
              <span className={`mr-16 ${style.textColor}`}>
                📢 We are uploading new content everyday. If your desired topic is yet to be discussed, kindly cooperate with us as our faculty updates the library. In the meantime, please check all our latest and already available contents below!
              </span>
              <span className={`mr-16 ${style.textColor}`}>
                ✨ Daily Curriculum Expansion: Notes, DPPs, Solved Papers, and Formula Compendiums are updated regularly.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
