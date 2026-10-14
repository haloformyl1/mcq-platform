"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR or before mounting, render a placeholder matching dimensions
  if (!mounted) {
    return (
      <div 
        className={`p-2 sm:p-2.5 rounded-full border border-transparent w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] shrink-0 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`theme-toggle-btn relative flex items-center justify-center p-2 sm:p-2.5 rounded-full transition-all duration-200 shrink-0 cursor-pointer ${
        isDark
          ? "bg-[#111c2e] hover:bg-[#1a2b44] border border-slate-700/80 hover:border-amber-400/60 text-amber-300 hover:text-amber-200 shadow-md shadow-black/20"
          : "bg-white hover:bg-slate-100 border border-slate-300/90 hover:border-indigo-400/80 text-indigo-600 hover:text-indigo-700 shadow-sm shadow-slate-200"
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform duration-300 hover:-rotate-12" />
      )}

      {showLabel && (
        <span className="ml-2 text-xs font-bold hidden sm:inline">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
