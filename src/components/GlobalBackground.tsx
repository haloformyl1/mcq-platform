"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function GlobalBackground() {
  const pathname = usePathname();
  const isIntroPage = pathname === '/';

  return (
    <div 
      aria-hidden="true" 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden w-full max-w-full bg-black select-none"
      style={{ overflow: "hidden", maxWidth: "100vw" }}
    >
      {!isIntroPage && (
        <div 
          className="absolute inset-0 pointer-events-none z-0 bg-black"
        />
      )}
    </div>
  );
}
