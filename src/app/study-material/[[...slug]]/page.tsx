"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PiechemLogo from "@/components/PiechemLogo";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import StudyMaterialRepository from "@/components/StudyMaterialRepository";
import CbseCurriculumPage from "@/components/curriculum/CbseCurriculumPage";
import IcseCurriculumPage from "@/components/curriculum/IcseCurriculumPage";
import WbchseCurriculumPage from "@/components/curriculum/WbchseCurriculumPage";
import EntranceCurriculumPage from "@/components/curriculum/EntranceCurriculumPage";
import CurriculumLevelPage from "@/components/curriculum/CurriculumLevelPage";
import CurriculumCategoryPage from "@/components/curriculum/CurriculumCategoryPage";
import { sanitizeMaterials, StudyMaterialItem } from "@/components/curriculum/curriculumData";
import { ArrowLeft } from "lucide-react";

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

  // Parse dynamic slug array: e.g. ["cbse"], ["cbse", "class-xi"], ["cbse", "class-xi", "notes"]
  const slug = resolvedParams.slug || [];

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

  const sanitized = React.useMemo(() => {
    return sanitizeMaterials(studyMaterials);
  }, [studyMaterials]);

  // Route Dispatcher based on slug depth and values
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-purple-500/20 border-b-purple-400 animate-spin [animation-direction:reverse]" />
          </div>
          <p className="text-xs font-mono text-slate-400 tracking-wider">CONNECTING TO CHEMISTRY ARCHIVE...</p>
        </div>
      );
    }

    // 1. Root / Hub page: /study-material
    if (slug.length === 0) {
      return (
        <StudyMaterialRepository
          studyMaterials={studyMaterials}
          student={student}
          basePath="/study-material"
        />
      );
    }

    const firstSegment = slug[0].toLowerCase();

    // 2. Direct single-segment curriculum pages: /study-material/cbse, /study-material/icse, etc.
    if (slug.length === 1) {
      if (firstSegment === "cbse") {
        return <CbseCurriculumPage materials={sanitized} student={student} />;
      }
      if (firstSegment === "icse" || firstSegment === "isc") {
        return <IcseCurriculumPage materials={sanitized} student={student} />;
      }
      if (firstSegment === "wbchse" || firstSegment === "wb") {
        return <WbchseCurriculumPage materials={sanitized} student={student} />;
      }
      if (["entrance", "competitive", "neet-jee", "jee-neet", "entrance-exams"].includes(firstSegment)) {
        return <EntranceCurriculumPage materials={sanitized} student={student} />;
      }
      // If someone routes directly to /study-material/neet or /jee
      if (["neet", "jee", "wbjee", "cuet"].includes(firstSegment)) {
        return <CurriculumLevelPage board="ENTRANCE" level={firstSegment} materials={sanitized} student={student} />;
      }
      // If someone routes directly to /study-material/class-xi or class-xii
      if (["class-xi", "class-xii"].includes(firstSegment)) {
        return <CurriculumLevelPage board="CBSE" level={firstSegment} materials={sanitized} student={student} />;
      }
    }

    // 3. Two segments: /study-material/[board]/[level] (e.g. /study-material/cbse/class-xi, /study-material/wbchse/sem-1)
    if (slug.length === 2) {
      const board = firstSegment === "isc" ? "ICSE" : firstSegment.toUpperCase();
      const level = slug[1];
      return <CurriculumLevelPage board={board} level={level} materials={sanitized} student={student} />;
    }

    // 4. Three segments: /study-material/[board]/[level]/[category] (e.g. /study-material/cbse/class-xi/notes)
    if (slug.length >= 3) {
      const board = firstSegment === "isc" ? "ICSE" : firstSegment.toUpperCase();
      const level = slug[1];
      const category = slug[2];
      return (
        <CurriculumCategoryPage
          board={board}
          level={level}
          category={category}
          materials={sanitized}
          student={student}
        />
      );
    }

    // Fallback
    return (
      <StudyMaterialRepository
        studyMaterials={studyMaterials}
        student={student}
        basePath="/study-material"
      />
    );
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Header */}
      <GlobalHeader
        student={student}
        actions={
          slug.length > 0 ? (
            <Link
              href="/study-material"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-mono transition-all group"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">All Curriculums</span>
              <span className="sm:hidden">Curriculums</span>
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-mono transition-all group"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Link>
          )
        }
      />

      {/* Main Repository Stage */}
      <main className="flex-1 w-full mx-auto pb-12">
        {renderContent()}
      </main>

      {/* Footer */}
      <GlobalFooter />
    </div>
  );
}
