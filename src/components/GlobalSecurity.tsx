"use client";

import { useEffect } from "react";

export default function GlobalSecurity() {
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable copy
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    // Disable keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === "PrintScreen") {
        e.preventDefault();
        return;
      }

      // Ctrl or Meta (Command on Mac) shortcuts
      if (e.ctrlKey || e.metaKey) {
        // Prevent Print, Save, Find, Copy, Paste, Cut
        if (["p", "s", "f", "c", "v", "x"].includes(e.key.toLowerCase())) {
          e.preventDefault();
          return;
        }
      }

      // Windows/Mac specific Snipping/Screenshot tools (Win+Shift+S / Cmd+Shift+3,4,5)
      if (e.shiftKey && (e.metaKey || e.ctrlKey)) {
        if (["s", "3", "4", "5"].includes(e.key.toLowerCase())) {
          e.preventDefault();
          return;
        }
      }

      // F12 Developer Tools
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }

      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+U
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
        return;
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("copy", handleCopy);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
