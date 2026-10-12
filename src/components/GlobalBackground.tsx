"use client";

import React from "react";

export default function GlobalBackground() {
  return (
    <div 
      aria-hidden="true" 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden w-full max-w-full bg-black select-none"
      style={{ overflow: "hidden", maxWidth: "100vw" }}
    />
  );
}
