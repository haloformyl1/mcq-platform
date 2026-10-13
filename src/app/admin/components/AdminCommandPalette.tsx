"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  FileText,
  PlusCircle,
  BookOpen,
  BarChart3,
  Users,
  CreditCard,
  Wallet,
  Bell,
  Megaphone,
  Shield,
  QrCode,
  KeyRound,
  GraduationCap,
  ArrowRight,
  X
} from "lucide-react";

interface AdminCommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenProctoringModal: () => void;
  onOpenPaymentModal: () => void;
  onOpenPasswordModal: () => void;
  onTestAsStudent: () => void;
}

interface PaletteItem {
  id: string;
  title: string;
  category: "Navigation" | "Quick Action" | "System Control";
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href?: string;
  action?: () => void;
  shortcut?: string;
}

export default function AdminCommandPalette({
  open,
  onClose,
  onOpenProctoringModal,
  onOpenPaymentModal,
  onOpenPasswordModal,
  onTestAsStudent,
}: AdminCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: PaletteItem[] = [
    {
      id: "dash",
      title: "Dashboard Overview",
      category: "Navigation",
      icon: LayoutDashboard,
      href: "/admin",
    },
    {
      id: "tests",
      title: "Manage Tests & MCQs",
      category: "Navigation",
      icon: FileText,
      href: "/admin/tests",
    },
    {
      id: "test-new",
      title: "Create New MCQ Test",
      category: "Quick Action",
      icon: PlusCircle,
      href: "/admin/tests/new",
    },
    {
      id: "materials",
      title: "Study Materials & Notes Repository",
      category: "Navigation",
      icon: BookOpen,
      href: "/admin/study-materials",
    },
    {
      id: "results",
      title: "Examination Results & Logs",
      category: "Navigation",
      icon: BarChart3,
      href: "/admin/results",
    },
    {
      id: "students",
      title: "Students Directory & Enrollments",
      category: "Navigation",
      icon: Users,
      href: "/admin/students",
    },
    {
      id: "notifs",
      title: "Broadcast Notification Center",
      category: "Navigation",
      icon: Bell,
      href: "/admin/notifications",
    },
    {
      id: "alerts",
      title: "Live Marquee Alerts Ticker",
      category: "Navigation",
      icon: Megaphone,
      href: "/admin/test-alerts",
    },
    {
      id: "proctoring",
      title: "Anti-Cheating & Proctoring Rules",
      category: "System Control",
      icon: Shield,
      action: onOpenProctoringModal,
    },
    {
      id: "creds",
      title: "Change Admin Password & Credentials",
      category: "System Control",
      icon: KeyRound,
      action: onOpenPasswordModal,
    },
    {
      id: "student-view",
      title: "Preview Site as Test Student",
      category: "Quick Action",
      icon: GraduationCap,
      action: onTestAsStudent,
    },
  ];

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setQuery("");
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleSelect = (item: PaletteItem) => {
    onClose();
    if (item.href) {
      router.push(item.href);
    } else if (item.action) {
      item.action();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-xl bg-[#0e131f] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 border-b border-slate-800 bg-[#090d16]">
          <Search size={18} className="text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search admin pages, tools, or system controls..."
            className="w-full h-14 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800/80 rounded border border-slate-700">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching administrative actions found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-xs transition ${
                    isSelected
                      ? "bg-red-950/50 text-white border border-red-500/40 shadow-sm"
                      : "text-slate-300 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? "bg-red-600/30 text-red-300"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <IconComp size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{item.title}</div>
                      <div className="text-[10px] text-slate-400">{item.category}</div>
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className={`shrink-0 transition-opacity ${
                      isSelected ? "opacity-100 text-red-400" : "opacity-0"
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Legend */}
        <div className="px-4 py-2 bg-[#090d16] border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="font-mono text-[10px] text-red-400/90 font-bold">PIE Chem Admin</span>
        </div>
      </div>
    </div>
  );
}
