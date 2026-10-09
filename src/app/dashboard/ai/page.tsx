"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AiTutorDrawer from "@/components/ai/AiTutorDrawer";

function AiTutorPageContent() {
  const searchParams = useSearchParams();

  const mode = (searchParams.get("mode") as any) || "tutor";
  const subject = searchParams.get("subject") || "Chemistry";
  const className = searchParams.get("className") || "Class 11";
  const chapter = searchParams.get("chapter") || "Periodic Table";
  const topic = searchParams.get("topic") || "Ionisation Energy";

  return (
    <AiTutorDrawer
      isOpen={true}
      initialMode={mode}
      initialContext={{
        subject,
        className,
        chapter,
        topic,
      }}
    />
  );
}

export default function AiTutorPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-transparent text-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-cyan-400 animate-spin" />
            <span className="text-xs text-slate-400 font-mono tracking-wider uppercase">
              Loading PIECHEM AI...
            </span>
          </div>
        </div>
      }
    >
      <AiTutorPageContent />
    </Suspense>
  );
}
