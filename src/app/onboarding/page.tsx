"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PiechemLogo from "@/components/PiechemLogo";
import PiFiringLoader from "@/components/PiFiringLoader";
import { CheckCircle2, ChevronRight, GraduationCap, BookOpen, Layers, ArrowLeft } from "lucide-react";

type BoardOption = "CBSE" | "ICSE" | "WBCHSE";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedBoard, setSelectedBoard] = useState<BoardOption | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>("");

  useEffect(() => {
    // Fetch student profile to see current values
    fetch("/api/student/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data.student) {
          if (data.student.board && data.student.academicLevel) {
            return router.replace("/dashboard");
          }
          if (data.student.board) {
            setSelectedBoard(data.student.board as BoardOption);
          }
          if (data.student.academicLevel) {
            setSelectedLevel(data.student.academicLevel);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  const handleBoardSelect = (board: BoardOption) => {
    setSelectedBoard(board);
    // Reset selected level when board changes
    if (board === "WBCHSE") {
      setSelectedLevel("SEM-I");
    } else {
      setSelectedLevel("11");
    }
    setStep(2);
  };

  const handleSave = async () => {
    if (!selectedBoard || !selectedLevel) {
      setError("Please select both your Educational Board and Class/Semester.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board: selectedBoard,
          academicLevel: selectedLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update board details.");

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong saving your selection.");
      setSaving(false);
    }
  };

  if (loading) {
    return <PiFiringLoader fullScreen={true} />;
  }

  const getLevelOptions = () => {
    if (selectedBoard === "WBCHSE") {
      return [
        { id: "SEM-I", label: "Sem-I", desc: "First semester curriculum" },
        { id: "SEM-II", label: "Sem-II", desc: "Second semester curriculum" },
        { id: "SEM-III", label: "Sem-III", desc: "Third semester curriculum" },
        { id: "SEM-IV", label: "Sem-IV", desc: "Fourth semester curriculum" },
      ];
    } else {
      return [
        { id: "11", label: "Class 11", desc: "Higher Secondary Class 11" },
        { id: "12", label: "Class 12", desc: "Higher Secondary Class 12" },
      ];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black relative font-sans text-white flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Header with PIECHEM logo */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10">
        <PiechemLogo size="lg" />
        <span className="text-xs text-slate-400 font-mono bg-cyan-950/60 px-3 py-1.5 rounded-full border border-cyan-500/30">
          Step {step} of 2
        </span>
      </header>

      {/* Main Vertically Centered Content Container */}
      <main className="flex-1 flex flex-col items-center justify-center my-8 z-10">
        <div className="w-full max-w-md bg-gradient-to-b from-[#0d1f2d]/90 via-[#081521]/90 to-[#040a10]/95 border border-cyan-500/30 p-6 sm:p-8 rounded-3xl shadow-[0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-xl space-y-6">
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/60 text-red-300 p-3.5 rounded-xl text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 mx-auto flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Select Educational Board
                </h1>
                <p className="text-xs text-slate-400">
                  Please choose your current board curriculum to personalize your exam platform experience.
                </p>
              </div>

              {/* Vertically 3 middle aligned options */}
              <div className="flex flex-col space-y-3.5 pt-2">
                {(["CBSE", "ICSE", "WBCHSE"] as BoardOption[]).map((b) => {
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleBoardSelect(b)}
                      className="w-full py-4 px-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/90 text-white font-extrabold text-base flex items-center justify-between transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] active:scale-98 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black bg-cyan-950/70 text-cyan-400 border border-cyan-500/30 group-hover:border-cyan-400 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-300">
                          {b.substring(0, 2)}
                        </div>
                        <span className="group-hover:text-cyan-300 transition-colors duration-300">{b}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-300" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Change Board ({selectedBoard})
                </button>
                <span className="text-xs font-bold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                  {selectedBoard}
                </span>
              </div>

              <div className="space-y-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-teal-950/80 border border-teal-500/40 text-teal-300 mx-auto flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                  {selectedBoard === "WBCHSE" ? <Layers className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {selectedBoard === "WBCHSE" ? "Select Semester" : "Select Class"}
                </h2>
                <p className="text-xs text-slate-400">
                  Select your current {selectedBoard === "WBCHSE" ? "Semester" : "Class level"} under <strong className="text-cyan-300">{selectedBoard}</strong>.
                </p>
              </div>

              {/* Dynamic class or semester list */}
              <div className="space-y-3 pt-2">
                {getLevelOptions().map((opt) => {
                  const isSelected = selectedLevel === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedLevel(opt.id)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] cursor-pointer group ${
                        isSelected
                          ? "bg-slate-900 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50"
                          : "bg-slate-900/60 border-slate-800/80 text-slate-200 hover:bg-slate-800/90"
                      }`}
                    >
                      <div>
                        <div className={`font-extrabold text-base transition-colors duration-300 ${isSelected ? 'text-cyan-300' : 'group-hover:text-cyan-300'}`}>{opt.label}</div>
                        <div className="text-xs text-slate-400">{opt.desc}</div>
                      </div>
                      <CheckCircle2 className={`w-5 h-5 shrink-0 transition-all duration-300 ${isSelected ? 'text-cyan-400 opacity-100 scale-110' : 'text-slate-600 opacity-40 group-hover:opacity-100 group-hover:text-cyan-400'}`} />
                    </button>
                  );
                })}
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !selectedLevel}
                  className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-base tracking-wide uppercase shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving ? "Saving Selection..." : "Continue to Dashboard →"}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-slate-500 z-10">
        PIECHEM Chemistry Platform • Designed by Arghyadeep Roy (9830507435)
      </footer>
    </div>
  );
}
