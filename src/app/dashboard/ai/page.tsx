"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AiTutorDrawer from "@/components/ai/AiTutorDrawer";

function AiTutorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = (searchParams.get("mode") as any) || "tutor";
  const subject = searchParams.get("subject") || "Chemistry";
  const className = searchParams.get("className") || "Class 11";
  const chapter = searchParams.get("chapter") || "Periodic Table";
  const topic = searchParams.get("topic") || "Ionisation Energy";

  const handleClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <AiTutorDrawer
      isOpen={true}
      onClose={handleClose}
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
        <div className="fixed inset-0 bg-[#070203] text-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
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
