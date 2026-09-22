"use client";

import React from "react";
import PiechemLogo from "@/components/PiechemLogo";

export interface GlobalHeaderProps {
  isGoldMember?: boolean;
  contextBadge?: React.ReactNode;
  navigation?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  logoHref?: string;
  children?: React.ReactNode;
}

export default function GlobalHeader({
  isGoldMember = false,
  contextBadge,
  navigation,
  actions,
  className = "",
  logoHref = "/dashboard",
  children
}: GlobalHeaderProps) {
  return (
    <header className={`dashboard-header sticky top-0 z-50 w-full bg-black/90 backdrop-blur-2xl border-b border-cyan-500/20 shadow-[0_10px_35px_rgba(0,0,0,0.7)] ${className}`}>
      <div className="site-header-inner w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        {children ? (
          children
        ) : (
          <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-4">
            {/* 1. FAR LEFT: PIE CHEM LOGO (Anchored first element) */}
            <div className="flex items-center gap-2 sm:gap-3.5 shrink-0 min-w-0">
              <PiechemLogo 
                size="md" 
                href={logoHref} 
                isGoldMember={isGoldMember} 
              />
              {contextBadge}
            </div>

            {/* 2. CENTER: Context / Page Navigation */}
            {navigation ? (
              <div className="flex-1 flex items-center justify-center min-w-0 px-2">
                {navigation}
              </div>
            ) : (
              <div className="flex-1 min-w-0" />
            )}

            {/* 3. FAR RIGHT: Header Actions */}
            {actions && (
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {actions}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
