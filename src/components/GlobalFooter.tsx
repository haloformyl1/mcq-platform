"use client";
import { usePathname } from "next/navigation";

export default function GlobalFooter() {
  const pathname = usePathname();
  
  // Check if we are precisely on the active exam taking page
  // The route is typically /exam/[attemptId]
  // We want to avoid matching /exam/start/[testId] or /exam/result/[attemptId]
  const isExamActivePage = pathname?.startsWith("/exam/") && 
                           !pathname?.includes("/start/") && 
                           !pathname?.includes("/result/");

  if (isExamActivePage) {
    // Return null during active exam to avoid overlapping test content.
    // The exam page explicitly includes the footer at the bottom of its scrollable container.
    return null;
  }

  return (
    <footer className="w-full mt-auto py-4 px-4 flex justify-center md:fixed md:bottom-3 md:right-4 md:w-auto md:py-0 md:px-0 md:mt-0 z-[9999] opacity-90 hover:opacity-100 transition-all pointer-events-auto">
      <div className="px-3.5 py-1.5 rounded-full bg-[#121824]/90 backdrop-blur-md border border-[#334155]/60 shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[10px] sm:text-[12px] text-slate-300 font-medium tracking-wide flex flex-wrap items-center justify-center gap-1.5">
        <span className="text-slate-400">Designed & Prepared by</span>
        <span className="font-semibold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">Arghyadeep Roy</span>
        <span className="text-slate-500">•</span>
        <span className="text-slate-400">Contact:</span>
        <a href="tel:9830507435" className="font-mono text-cyan-300 hover:underline">9830507435</a>
      </div>
    </footer>
  );
}
