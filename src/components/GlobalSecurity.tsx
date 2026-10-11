"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function GlobalSecurity() {
  const pathname = usePathname();

  useEffect(() => {
    // If user is on PIECHEM AI webpage or related AI pages, completely disable all security restrictions
    // so that Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, right-click, dev tools, and all computer shortcuts work normally.
    const isAiPage = pathname?.startsWith("/dashboard/ai") || pathname?.startsWith("/about-ai");
    if (isAiPage) {
      return;
    }

    // Helper to check if event originated from an AI component or editable user element
    const isEditableOrAi = (target: EventTarget | null) => {
      if (!target || !(target instanceof HTMLElement)) return false;
      return (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        Boolean(target.closest(".ai-workspace-root")) ||
        Boolean(target.closest('[data-ai-workspace="true"]')) ||
        Boolean(target.closest('[data-ai-chat="true"]')) ||
        Boolean(target.closest(".piechem-ai-drawer"))
      );
    };

    // Disable right-click context menu outside AI/input elements
    const handleContextMenu = (e: MouseEvent) => {
      if (isEditableOrAi(e.target)) return;
      e.preventDefault();
    };

    // Disable copy outside AI/input elements
    const handleCopy = (e: ClipboardEvent) => {
      if (isEditableOrAi(e.target)) return;
      e.preventDefault();
    };

    // Disable keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing or interacting inside an AI workspace or input/textarea, allow all computer shortcuts
      if (isEditableOrAi(e.target)) {
        return;
      }

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

    // DevTools Debugger Trap: Freezes the browser if DevTools is opened
    // Uses an anonymous constructor to bypass simple string searches by adblockers
    const devtoolsTrap = setInterval(() => {
      // Use Function constructor to obscure the 'debugger' keyword slightly
      (function () {
        return false;
      }["constructor"]("debugger")["call"]());
    }, 100);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(devtoolsTrap);
    };
  }, [pathname]);

  return null;
}

