"use client";
import GlobalFooter from "@/components/GlobalFooter";
import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Search, SlidersHorizontal, Sparkles, Atom, Play, ArrowLeft, 
  CheckCircle2, Layers, Compass, Crown, RotateCcw, Filter, ArrowRight
} from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";
import MolecularOrbitalCanvas from "@/components/3d/MolecularOrbitalCanvas";
import AnimationCatalogCard from "@/components/3d/AnimationCatalogCard";
import PremiumUpgradeModal from "@/components/3d/PremiumUpgradeModal";

function ThreeDAnimationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [animations, setAnimations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGold, setIsGold] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [accessFilter, setAccessFilter] = useState<"ALL" | "FREE" | "PREMIUM">("ALL");
  const [sortBy, setSortBy] = useState<"featured" | "az" | "newest">("featured");

  // Upgrade Modal states
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedLockedItem, setSelectedLockedItem] = useState<any | null>(null);

  // Initialize filters from search parameters if provided (e.g. ?category=Chemical+Bonding)
  useEffect(() => {
    const topicParam = searchParams.get("topic") || searchParams.get("category");
    if (topicParam) {
      const lower = topicParam.toLowerCase();
      if (lower.includes("organic") && !lower.includes("inorganic")) {
        setActiveCategory("ORGANIC");
      } else if (lower.includes("inorganic") || lower.includes("bond")) {
        setActiveCategory("INORGANIC");
      } else if (lower.includes("physical") || lower.includes("solid")) {
        setActiveCategory("PHYSICAL");
      }
    }
  }, [searchParams]);


  // Fetch verified student and study materials data from backend
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [dashRes, matRes] = await Promise.all([
          fetch("/api/student/dashboard").catch(() => null),
          fetch("/api/student/study-materials").catch(() => null)
        ]);

        if (dashRes && dashRes.ok) {
          const dashData = await dashRes.json();
          if (dashData?.student && mounted) {
            setStudent(dashData.student);
            const isComp = dashData.student.subscriptionStatus === "COMPLIMENTARY";
            const isPaid = 
              dashData.student.subscriptionStatus === "PAID" && 
              (!dashData.student.subscriptionExpiresAt || new Date(dashData.student.subscriptionExpiresAt).getTime() > Date.now());
            setIsGold(isComp || isPaid);
          }
        }

        if (matRes && matRes.ok) {
          const mats = await matRes.json();
          if (Array.isArray(mats) && mounted) {
            // Filter strictly for 3D simulation experiences
            const sims = mats.filter((m: any) => {
              const lower = (m.title || "").toLowerCase();
              return (
                m.type === "LINK" || 
                m.category === "3D animations" || 
                (m.url && m.url.includes("lab-viewer")) ||
                lower.includes("3d") ||
                lower.includes("solid state") ||
                lower.includes("bonding")
              );
            });
            setAnimations(sims);
          }
        }
      } catch (err) {
        console.error("Error loading 3D animations catalog:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // Fallback default simulations if DB is being seeded or offline
  const effectiveAnimations = useMemo(() => {
    if (animations.length > 0) return animations;
    if (loading) return [];
    return [
      {
        id: "fff042ca-a686-4e84-a35b-271fac192ad9",
        title: "SOLID STATE CHEMISTRY (Interactive 3D models)",
        description: "Explore, visualize, and calculate 3D crystal structures, voids, packing efficiency, and point defects in a premium interactive laboratory.",
        type: "LINK",
        isPremium: false,
        discipline: "PHYSICAL",
        category: "3D animations"
      },
      {
        id: "5f10cd48-de6c-4dfc-8d0c-56b157708208",
        title: "CHEMICAL BONDING (Bonding visualised)",
        description: "From atomic trends to orbital shapes—see, manipulate and test every core idea behind chemical bonding.",
        type: "LINK",
        isPremium: true,
        discipline: "INORGANIC",
        category: "3D animations"
      },
      {
        id: "7a82bc19-f431-4b3d-9d7a-12e0947b1928",
        title: "ORGANIC STEREOCHEMISTRY & MOLECULAR GEOMETRY",
        description: "Interactive 3D conformations, chirality, Newman projections, and reaction intermediates visualized in real-time.",
        type: "LINK",
        isPremium: false,
        discipline: "ORGANIC",
        category: "3D animations"
      }
    ];
  }, [animations, loading]);

  // Filtering & Search
  const filteredAnimations = useMemo(() => {
    return effectiveAnimations.filter((item) => {
      const titleLower = (item.title || "").toLowerCase();
      const descLower = (item.description || "").toLowerCase();
      const discLower = (item.discipline || "").toLowerCase();
      const query = searchQuery.trim().toLowerCase();

      // Search query check
      if (query) {
        const matchesQuery = 
          titleLower.includes(query) || 
          descLower.includes(query) || 
          discLower.includes(query);
        if (!matchesQuery) return false;
      }

      // Access Filter check (Strictly based on backend isPremium state)
      if (accessFilter === "FREE" && item.isPremium) return false;
      if (accessFilter === "PREMIUM" && !item.isPremium) return false;

      // Category filter check
      if (activeCategory === "ORGANIC") {
        return (
          item.discipline === "ORGANIC" ||
          (discLower.includes("organic") && !discLower.includes("inorganic")) ||
          titleLower.includes("organic") ||
          titleLower.includes("hydrocarbon") ||
          titleLower.includes("isomer") ||
          titleLower.includes("reaction mechanism")
        );
      }
      if (activeCategory === "INORGANIC") {
        return (
          item.discipline === "INORGANIC" ||
          discLower.includes("inorganic") ||
          titleLower.includes("inorganic") ||
          titleLower.includes("bond") ||
          titleLower.includes("orbital") ||
          titleLower.includes("hybrid") ||
          titleLower.includes("block") ||
          titleLower.includes("coordination") ||
          titleLower.includes("periodic")
        );
      }
      if (activeCategory === "PHYSICAL") {
        return (
          item.discipline === "PHYSICAL" ||
          discLower.includes("physical") ||
          titleLower.includes("physical") ||
          titleLower.includes("solid") ||
          titleLower.includes("lattice") ||
          titleLower.includes("void") ||
          titleLower.includes("thermo") ||
          titleLower.includes("kinetics") ||
          titleLower.includes("electro") ||
          titleLower.includes("equilibrium")
        );
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "az") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      // "featured": prioritize solid state & chemical bonding
      return (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0);
    });
  }, [effectiveAnimations, searchQuery, activeCategory, accessFilter, sortBy]);

  // Handle click on locked premium card
  const handleLockedClick = (item: any) => {
    setSelectedLockedItem(item);
    setUpgradeModalOpen(true);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setActiveCategory("ALL");
    setAccessFilter("ALL");
    setSortBy("featured");
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* ========================================================= */}
      {/* 1. GLOBAL UNIFIED HEADER (PERMANENTLY ANCHORED LEFT LOGO) */}
      {/* ========================================================= */}
      <GlobalHeader
        isGoldMember={isGold}
        logoHref="/dashboard"
      />

      {/* ========================================================= */}
      {/* 2. HERO SECTION WITH MOLECULAR ORBITAL CANVAS             */}
      {/* ========================================================= */}
      <section className="relative w-full pt-10 sm:pt-16 pb-14 sm:pb-20 overflow-hidden bg-transparent">

        {/* Ambient Radial Lights */}
        <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="pointer-events-none absolute top-1/2 right-10 w-[400px] h-[250px] bg-indigo-500/10 blur-[100px] rounded-full" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5 sm:space-y-6">
          
          {/* Scientific Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-400/35 text-cyan-300 text-xs font-mono font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(0,217,255,0.15)]">
            <Atom className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <span>PIECHEM VIRTUAL MOLECULAR LAB</span>
          </div>

          {/* Flagship Headline */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Interactive Chemistry, <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00F2FE] via-[#38BDF8] to-[#818CF8] drop-shadow-[0_4px_24px_rgba(0,242,254,0.3)]">
                in Three Dimensions
              </span>
            </h1>
          </div>

          {/* Supporting Copy */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300/90 font-light leading-relaxed">
            Explore real-time 3D simulations of solid state crystal lattices, atomic voids, and spatial chemical bonding directly in your browser. Visualise complex VSEPR geometries, hybridisation orbitals, and unit cell structures with interactive rotation and slicing.
          </p>

          {/* High-Level Feature Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-mono">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>WebGL 2.0 Spatial Engine</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>NCERT • JEE • NEET Aligned</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full Interactive Controls</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. MAIN CATALOG SHELF & DISCOVERY SECTION                 */}
      {/* ========================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        
        {/* Section Title & Metrics */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                CURATED SIMULATION SHELF
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Virtual Laboratory Catalog
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Select any virtual lab below to inspect interactive lattice models, electron clouds, and atomic geometry.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-lg bg-[#061524] border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
              {filteredAnimations.length} {filteredAnimations.length === 1 ? "Experience" : "Experiences"} Available
            </span>
          </div>
        </div>

        {/* Discovery & Filter Bar */}
        <div className="bg-[#050e18]/90 border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg backdrop-blur-md">
          
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Realtime Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search simulations (e.g. Solid State, Hybridization, Voids, Carbon)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-400 text-white placeholder-slate-500 text-xs sm:text-sm transition focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            {/* Access Tier Toggle Chips */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800/90 shrink-0">
              <button
                type="button"
                onClick={() => setAccessFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                  accessFilter === "ALL" 
                    ? "bg-slate-800 text-white shadow-sm" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All Access
              </button>
              <button
                type="button"
                onClick={() => setAccessFilter("FREE")}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                  accessFilter === "FREE" 
                    ? "bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 shadow-sm" 
                    : "text-slate-400 hover:text-emerald-300"
                }`}
              >
                <span>✓ FREE</span>
              </button>
              <button
                type="button"
                onClick={() => setAccessFilter("PREMIUM")}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                  accessFilter === "PREMIUM" 
                    ? "bg-amber-950/80 border border-amber-400/50 text-amber-300 shadow-sm" 
                    : "text-slate-400 hover:text-amber-300"
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>✦ PREMIUM</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="py-2.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-semibold text-slate-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="featured">Featured First</option>
                <option value="az">Title (A – Z)</option>
                <option value="newest">Recently Added</option>
              </select>
            </div>

          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {[
              { id: "ALL", label: "All Experiences" },
              { id: "ORGANIC", label: "Organic" },
              { id: "INORGANIC", label: "Inorganic" },
              { id: "PHYSICAL", label: "Physical" }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
                  activeCategory === cat.id
                    ? "bg-cyan-950 border-cyan-400/50 text-cyan-300 font-bold shadow-[0_0_12px_rgba(0,217,255,0.15)]"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

        </div>

        {/* ========================================================= */}
        {/* 4. ANIMATION CATALOG GRID                                 */}
        {/* ========================================================= */}
        {loading ? (
          /* Skeletons matching exact card structure */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl border border-slate-800/80 bg-[#060e1a]/60 overflow-hidden flex flex-col justify-between animate-pulse"
              >
                <div className="w-full h-48 bg-slate-900/80 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-slate-800/60" />
                </div>
                <div className="p-5 space-y-3">
                  <div className="h-3 w-20 bg-slate-800 rounded" />
                  <div className="h-5 w-4/5 bg-slate-800 rounded" />
                  <div className="h-3 w-full bg-slate-800/60 rounded" />
                  <div className="h-3 w-2/3 bg-slate-800/60 rounded" />
                  <div className="pt-3 border-t border-slate-800/60 flex gap-2">
                    <div className="h-9 w-full bg-slate-800/80 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAnimations.length > 0 ? (
          /* Main 3-Column Responsive Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnimations.map((sim, idx) => (
              <AnimationCatalogCard
                key={sim.id}
                item={sim}
                isGold={isGold}
                student={student}
                onLockedClick={handleLockedClick}
                featured={idx === 0}
              />
            ))}
          </div>
        ) : (
          /* Scientific Empty State */
          <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-[#05101c] to-[#02070e] p-10 sm:p-14 text-center space-y-4 max-w-xl mx-auto shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,217,255,0.2)]">
              <Atom className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white">
                No 3D Experiences Found
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                No virtual simulation matched your search query or filter selection. Try adjusting your search term or exploring all categories.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-400/40 text-cyan-300 font-bold text-xs transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters & Show All</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* 5. PREMIUM UPGRADE MODAL                                  */}
      {/* ========================================================= */}
      <PremiumUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        animationTitle={selectedLockedItem?.title?.replace(/\(.*?\)/g, "").trim()}
        lockedItem={selectedLockedItem}
      />

      {/* Global Footer */}
      <GlobalFooter />

    </div>
  );
}

export default function ThreeDAnimationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    }>
      <ThreeDAnimationsContent />
    </Suspense>
  );
}
