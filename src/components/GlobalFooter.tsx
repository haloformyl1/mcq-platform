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
    <div className="fixed bottom-4 right-4 text-white text-[13px] md:text-sm font-semibold z-[9999] opacity-80 hover:opacity-100 transition-opacity drop-shadow-md pointer-events-none">
      Designed & Prepared By- Arghyadeep Roy Contact- 9830507435.
    </div>
  );
}
