"use client";
import GlobalFooter from "@/components/GlobalFooter";
import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PiechemLogo from "@/components/PiechemLogo";
import StudyMaterialRepository from "@/components/StudyMaterialRepository";
import { ArrowLeft, Atom, Sparkles, LayoutDashboard, Compass } from "lucide-react";

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function StudyMaterialPage({ params, searchParams }: PageProps) {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  const router = useRouter();

  const [student, setStudent] = useState<any>(null);
  const [studyMaterials, setStudyMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Parse Slug
  const slug = resolvedParams.slug || [];
  
  let initialBoard = typeof resolvedSearchParams.board === "string" ? resolvedSearchParams.board : undefined;
  let initialLevel = typeof resolvedSearchParams.level === "string" ? resolvedSearchParams.level : undefined;
  let initialCategory = typeof resolvedSearchParams.category === "string" ? resolvedSearchParams.category : undefined;

  if (slug.length > 0 && !initialBoard) {
    const rawBoard = slug[0].toUpperCase();
    if (["CBSE", "ICSE", "WBCHSE", "ENTRANCE", "COMPETITIVE", "NEET-JEE", "NEET"].includes(rawBoard)) { initialBoard = ["ENTRANCE", "COMPETITIVE", "NEET-JEE", "NEET"].includes(rawBoard) ? "ENTRANCE" : rawBoard; } else if (false) {
      initialBoard = rawBoard;
    }
  }

  if (slug.length > 1 && !initialLevel) {
    const rawLevel = slug[1].toLowerCase().replace("-", "_");
    if (["class_xi", "class_xii", "sem_1", "sem_2", "sem_3", "sem_4", "neet", "jee", "wbjee", "cuet"].includes(rawLevel)) {
      initialLevel = rawLevel.toUpperCase();
    }
  }

  if (slug.length > 2 && !initialCategory) {
    initialCategory = slug[2];
  }

  useEffect(() => {
    // Fetch student session & dashboard data
    fetch("/api/student/dashboard")
      .then(res => res.json())
      .then(dashData => {
        if (!dashData.error) {
          setStudent(dashData.student);
        }
      })
      .catch(() => {});

    // Fetch materials
    fetch("/api/student/study-materials")
      .then(res => res.json())
      .then(mats => {
        if (Array.isArray(mats)) {
          setStudyMaterials(mats);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Header */}
      <header className="dashboard-header sticky top-0 z-50 bg-[#030910]/95 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7)]">
        <div className="site-header-inner w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <PiechemLogo size="md" href="/dashboard" />
          </Link>
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10 text-[11px] font-mono text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>ACADEMIC STUDY REPOSITORY</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/3d-animations"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:text-white hover:bg-emerald-900/60 text-xs font-mono transition-all"
          >
            <Atom className="w-3.5 h-3.5 text-emerald-400" />
            <span>3D Molecular Lab</span>
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
        </div>
      </header>

      {/* Main Repository Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-purple-500/20 border-b-purple-400 animate-spin [animation-direction:reverse]" />
            </div>
            <p className="text-xs font-mono text-slate-400 tracking-wider">CONNECTING TO CHEMISTRY ARCHIVE...</p>
          </div>
        ) : (
          <StudyMaterialRepository
            studyMaterials={studyMaterials}
            student={student}
            basePath="/study-material"
            initialBoard={initialBoard}
            initialLevel={initialLevel}
            initialCategory={initialCategory}
          />
        )}
      </main>

      {/* Footer */}
      
          <GlobalFooter />
    </div>
  );
}
