"use client";

import { useState, useEffect } from "react";
import { 
  Upload, FileText, Image as ImageIcon, Link as LinkIcon, Trash2, 
  Plus, ExternalLink, Download, File, CheckCircle2, BookOpen, 
  Atom, CheckSquare, Flame, Award, GraduationCap, FileCheck, 
  Search, Filter, Sparkles, Eye, Tag
} from "lucide-react";
import PiFiringLoader from "@/components/PiFiringLoader";
import { 
  LIBRARY_CATEGORIES, 
  LibraryCategoryType,
  SUBJECT_DISCIPLINES,
  SubjectDisciplineType 
} from "@/lib/studyMaterialMetadata";

export default function AdminStudyMaterials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Upload Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "PDF",
    category: "3D animations" as LibraryCategoryType,
    discipline: "GENERAL" as SubjectDisciplineType,
    url: "",
    isPremium: false,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Catalog Filter States
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterTier, setFilterTier] = useState<"ALL" | "FREE" | "PREMIUM">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchMaterials = () => {
    fetch("/api/admin/study-materials")
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load study materials");
        return data;
      })
      .then(data => {
        setMaterials(data);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return alert("Please enter a title");
    if (form.type === "LINK" && !form.url.trim()) return alert("Please enter a valid link URL");
    if ((form.type === "PDF" || form.type === "IMAGE") && !selectedFile && !form.url.trim()) {
      return alert("Please select a file to upload or provide a URL");
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("type", form.type);
      formData.append("category", form.category);
      formData.append("discipline", form.discipline);
      formData.append("isPremium", String(form.isPremium));
      formData.append("url", form.url.trim());
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await fetch("/api/admin/study-materials", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("Study material published into " + form.category + " successfully!");
        setForm({
          title: "",
          description: "",
          type: "PDF",
          category: "3D animations",
          discipline: "GENERAL",
          url: "",
          isPremium: false
        });
        setSelectedFile(null);
        fetchMaterials();
        setTimeout(() => setSuccess(null), 4500);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to process upload request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this study material permanently?")) return;
    try {
      const res = await fetch(`/api/admin/study-materials?id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSuccess("Material deleted successfully");
        setMaterials(prev => prev.filter(m => m.id !== id));
        setTimeout(() => setSuccess(null), 3000);
      } else {
        alert("Failed to delete material");
      }
    } catch {
      alert("Error deleting material");
    }
  };

  const handleToggleTier = async (item: any) => {
    setUpdatingId(item.id);
    try {
      const res = await fetch("/api/admin/study-materials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isPremium: !item.isPremium })
      });
      if (res.ok) {
        setMaterials(prev =>
          prev.map(m => (m.id === item.id ? { ...m, isPremium: !item.isPremium } : m))
        );
      } else {
        alert("Failed to update plan tier");
      }
    } catch {
      alert("Error updating plan tier");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateCategory = async (id: string, newCategory: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/study-materials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, category: newCategory })
      });
      if (res.ok) {
        setMaterials(prev =>
          prev.map(m => (m.id === id ? { ...m, category: newCategory } : m))
        );
      }
    } catch {
      alert("Failed to update shelf category");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateDiscipline = async (id: string, newDiscipline: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/study-materials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, discipline: newDiscipline })
      });
      if (res.ok) {
        setMaterials(prev =>
          prev.map(m => (m.id === id ? { ...m, discipline: newDiscipline } : m))
        );
      }
    } catch {
      alert("Failed to update branch");
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter materials for catalog display
  const filteredMaterials = materials.filter((item: any) => {
    if (filterCategory !== "ALL" && item.category !== filterCategory) return false;
    if (filterTier === "FREE" && item.isPremium) return false;
    if (filterTier === "PREMIUM" && !item.isPremium) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchDesc = (item.cleanDescription || item.description)?.toLowerCase().includes(q);
      const matchCat = item.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  if (loading) {
    return <PiFiringLoader fullScreen={false} />;
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-16">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#262626] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>STUDENT DIGITAL LIBRARY MANAGEMENT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Study Materials & Library Vault Manager
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Categorise resources into the 7 library shelves, upload PDF notes, DPPs, PYQs, and 3D simulation links.
          </p>
        </div>

        <div className="bg-[#111] border border-[#2a2a2a] px-4 py-2 rounded-xl text-center">
          <span className="text-xl font-black text-cyan-400 font-mono block">
            {materials.length}
          </span>
          <span className="text-[11px] text-gray-400 uppercase tracking-wide">Total Live Items</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/80 border border-red-800 text-red-200 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 text-emerald-200 rounded-xl text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 2. UPLOAD & CATEGORISE FORM */}
      <section className="bg-[#111111] border border-[#262626] p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
        <div className="border-b border-[#222] pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            <span>Publish New Material into Library</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Select the exact library shelf category and subject branch so students find it in their dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                Material Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. CHEMICAL BONDING (3D Visualised) or DPP-01: Mole Concept"
                className="w-full bg-[#181818] border border-[#333] focus:border-cyan-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
                required
              />
            </div>

            {/* Shelf Category Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                <span>Library Shelf Category <span className="text-red-400">*</span></span>
              </label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value as LibraryCategoryType })}
                className="w-full bg-[#181818] border border-cyan-500/40 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 transition cursor-pointer font-medium"
              >
                {LIBRARY_CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-[#181818] text-white">
                    {cat}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500">Determines which tab this material appears under in the student vault.</p>
            </div>

            {/* Chemistry Branch / Discipline Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                Subject Branch / Discipline
              </label>
              <select
                value={form.discipline}
                onChange={e => setForm({ ...form, discipline: e.target.value as SubjectDisciplineType })}
                className="w-full bg-[#181818] border border-[#333] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition cursor-pointer"
              >
                <option value="GENERAL">General / All Branches</option>
                <option value="PHYSICAL">Physical Chemistry</option>
                <option value="INORGANIC">Inorganic Chemistry</option>
                <option value="ORGANIC">Organic Chemistry</option>
              </select>
            </div>

            {/* Resource Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                Format Type <span className="text-red-400">*</span>
              </label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full bg-[#181818] border border-[#333] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition cursor-pointer"
              >
                <option value="PDF">PDF Document</option>
                <option value="LINK">External Link / 3D Simulation</option>
                <option value="IMAGE">Image</option>
              </select>
            </div>

            {/* Premium / Free Checkbox */}
            <div className="space-y-1.5 flex flex-col justify-center">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wide mb-1">
                Access Plan Tier
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer bg-[#181818] border border-[#333] px-4 py-2 rounded-xl hover:border-[#444] transition">
                <input
                  type="checkbox"
                  checked={form.isPremium}
                  onChange={e => setForm({ ...form, isPremium: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 bg-[#222] border-gray-600 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>⭐ Mark as Premium</span>
                  <span className="text-[11px] text-gray-400 font-normal">(Requires Gold Subscription)</span>
                </span>
              </label>
            </div>

            {/* URL Input */}
            {(form.type === "LINK" || !selectedFile) && (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                  {form.type === "LINK" ? "Interactive Lab URL / Link *" : "External File URL (Optional if uploading file below)"}
                </label>
                <input
                  type="url"
                  value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                  placeholder={form.type === "LINK" ? "https://molview.org/?cid=222" : "https://example.com/notes.pdf"}
                  className="w-full bg-[#181818] border border-[#333] focus:border-cyan-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
                  required={form.type === "LINK"}
                />
              </div>
            )}

            {/* File Upload for PDF/IMAGE */}
            {form.type !== "LINK" && (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                  Upload Local {form.type} File
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept={form.type === "PDF" ? "application/pdf" : "image/*"}
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#252525] file:text-white hover:file:bg-[#303030] cursor-pointer"
                  />
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-xs text-red-400 hover:underline shrink-0"
                    >
                      Clear File
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                Description / Syllabus Notes (Optional)
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Brief summary of topics covered, derivations, question count, or instructions..."
                rows={3}
                className="w-full bg-[#181818] border border-[#333] focus:border-cyan-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm uppercase tracking-wider transition shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Publishing to Digital Vault..." : "Publish Material to Student Vault"}
          </button>
        </form>
      </section>

      {/* 3. UPLOADED CATALOG & CATEGORY CONTROLS */}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#262626] pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>Library Catalog & Categorisation</span>
              <span className="text-xs bg-[#222] text-gray-300 px-2.5 py-0.5 rounded-full border border-[#333]">
                {filteredMaterials.length} of {materials.length} displayed
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Organise, re-categorise into the 7 shelves, toggle access tiers, and manage resources.
            </p>
          </div>

          {/* Search & Tier Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search catalog..."
                className="w-full bg-[#161616] border border-[#333] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#161616] p-1 rounded-lg border border-[#333]">
              <button
                type="button"
                onClick={() => setFilterTier("ALL")}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${filterTier === "ALL" ? "bg-cyan-950 text-cyan-300 border border-cyan-700/60" : "text-gray-400 hover:text-white"}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterTier("FREE")}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${filterTier === "FREE" ? "bg-emerald-950 text-emerald-300 border border-emerald-700/60" : "text-gray-400 hover:text-white"}`}
              >
                Free
              </button>
              <button
                type="button"
                onClick={() => setFilterTier("PREMIUM")}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${filterTier === "PREMIUM" ? "bg-amber-950 text-amber-300 border border-amber-700/60" : "text-gray-400 hover:text-white"}`}
              >
                Premium
              </button>
            </div>
          </div>
        </div>

        {/* Shelf Category Tabs Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setFilterCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 border transition cursor-pointer ${
              filterCategory === "ALL"
                ? "bg-cyan-500 text-black border-cyan-400 shadow-md font-extrabold"
                : "bg-[#141414] text-gray-400 border-[#2a2a2a] hover:text-white hover:border-[#3a3a3a]"
            }`}
          >
            All Shelves ({materials.length})
          </button>
          {LIBRARY_CATEGORIES.map(cat => {
            const count = materials.filter((m: any) => m.category === cat).length;
            const isCatActive = filterCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 border transition cursor-pointer flex items-center gap-1.5 ${
                  isCatActive
                    ? "bg-cyan-950 text-cyan-300 border-cyan-600 shadow"
                    : "bg-[#141414] text-gray-400 border-[#2a2a2a] hover:text-white hover:border-[#3a3a3a]"
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isCatActive ? "bg-cyan-800/80 text-white" : "bg-[#222] text-gray-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Catalog Grid */}
        {filteredMaterials.length === 0 ? (
          <div className="bg-[#141414] p-10 text-center text-gray-400 rounded-2xl border border-[#2a2a2a] space-y-2">
            <BookOpen className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-sm font-semibold text-white">No materials found matching this filter.</p>
            <p className="text-xs text-gray-500">Use the form above to add study materials into this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMaterials.map((item: any) => {
              const isPdf = item.type === "PDF";
              const isImage = item.type === "IMAGE";
              const isUpdatingThis = updatingId === item.id;

              return (
                <div 
                  key={item.id} 
                  className="bg-[#141414] border border-[#282828] hover:border-cyan-500/40 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-lg transition duration-200"
                >
                  <div className="space-y-3">
                    {/* Top Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                          {item.category || "3D animations"}
                        </span>
                        {item.discipline && item.discipline !== "GENERAL" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#222] text-gray-300 border border-[#333]">
                            {item.discipline}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-900 text-slate-400">
                          {item.type}
                        </span>
                      </div>

                      {/* Access Tier Tag */}
                      {item.isPremium ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-950/90 text-amber-300 border border-amber-600/60 flex items-center gap-1">
                          <span>⭐</span> PREMIUM
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-600/60 flex items-center gap-1">
                          <span>🔓</span> FREE
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-base leading-snug">{item.title}</h3>
                      {(item.cleanDescription || item.description) && (
                        <p className="text-xs text-gray-400 leading-relaxed mt-1 line-clamp-3">
                          {item.cleanDescription || item.description}
                        </p>
                      )}
                    </div>

                    {/* Quick Category / Branch Changer */}
                    <div className="p-2.5 rounded-xl bg-[#0c0c0c] border border-[#222] space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase shrink-0">Change Shelf:</span>
                        <select
                          value={item.category || "3D animations"}
                          onChange={e => handleUpdateCategory(item.id, e.target.value)}
                          disabled={isUpdatingThis}
                          className="bg-[#1a1a1a] border border-[#333] text-cyan-300 rounded px-2 py-1 text-[11px] focus:outline-none cursor-pointer font-medium w-full sm:w-auto max-w-full sm:max-w-[190px]"
                        >
                          {LIBRARY_CATEGORIES.map(cat => (
                            <option key={cat} value={cat} className="bg-[#1a1a1a] text-white">
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase shrink-0">Branch:</span>
                        <select
                          value={item.discipline || "GENERAL"}
                          onChange={e => handleUpdateDiscipline(item.id, e.target.value)}
                          disabled={isUpdatingThis}
                          className="bg-[#1a1a1a] border border-[#333] text-gray-300 rounded px-2 py-1 text-[11px] focus:outline-none cursor-pointer w-full sm:w-auto"
                        >
                          <option value="GENERAL">General</option>
                          <option value="PHYSICAL">Physical</option>
                          <option value="INORGANIC">Inorganic</option>
                          <option value="ORGANIC">Organic</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#222] flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleTier(item)}
                      disabled={isUpdatingThis}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        item.isPremium
                          ? "bg-[#222] hover:bg-emerald-950 text-gray-300 hover:text-emerald-300 border-[#333] hover:border-emerald-600"
                          : "bg-[#222] hover:bg-amber-950 text-gray-300 hover:text-amber-300 border-[#333] hover:border-amber-600"
                      }`}
                    >
                      {isUpdatingThis ? "Updating..." : item.isPremium ? "Set as Free" : "Set as Premium"}
                    </button>

                    <div className="flex items-center gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-cyan-400 hover:underline inline-flex items-center gap-1 bg-[#1c1c1c] px-2.5 py-1.5 rounded-lg border border-[#333]"
                      >
                        <span>{item.type === "LINK" ? "Open" : "View"}</span>
                        {item.type === "LINK" ? <ExternalLink className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                      </a>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                        title="Delete material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
