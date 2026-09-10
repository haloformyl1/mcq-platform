"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, Image as ImageIcon, Link as LinkIcon, Trash2, Plus, ExternalLink, Download, File, CheckCircle2 } from "lucide-react";
import PiFiringLoader from "@/components/PiFiringLoader";

export default function AdminStudyMaterials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "PDF",
    url: "",
    isPremium: false,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filterTier, setFilterTier] = useState<"ALL" | "FREE" | "PREMIUM">("ALL");
  const [updatingTierId, setUpdatingTierId] = useState<string | null>(null);

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
        setSuccess("Study material uploaded successfully!");
        setForm({ title: "", description: "", type: "PDF", url: "", isPremium: false });
        setSelectedFile(null);
        fetchMaterials();
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to process upload request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTier = async (item: any) => {
    const nextPremium = !item.isPremium;
    setUpdatingTierId(item.id);
    try {
      const res = await fetch("/api/admin/study-materials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isPremium: nextPremium })
      });
      if (res.ok) {
        setMaterials(prev => prev.map(m => m.id === item.id ? { ...m, isPremium: nextPremium } : m));
        setSuccess(`"${item.title}" is now set to ${nextPremium ? "⭐ PREMIUM (Subscription Required to Access)" : "🔓 FREE PLAN (Accessible to All Students)"}`);
        setTimeout(() => setSuccess(null), 4000);
      } else {
        alert("Failed to update access tier for material");
      }
    } catch {
      alert("Error updating access tier");
    } finally {
      setUpdatingTierId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this study material?")) return;

    try {
      const res = await fetch(`/api/admin/study-materials?id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchMaterials();
      } else {
        alert("Failed to delete material");
      }
    } catch (err) {
      alert("Error deleting material");
    }
  };

  if (loading) return <PiFiringLoader fullScreen={false} />;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-[#333333] pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-950/60 border border-cyan-500/40 rounded-lg text-cyan-400">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Content & Study Material Upload</h1>
            <p className="text-sm text-[#a6a6a6]">Upload PDF documents, reference images, and web links for students.</p>
          </div>
        </div>
        <div className="text-sm font-semibold bg-[#1a1a1a] px-3.5 py-1.5 rounded-full border border-[#333333]">
          Total Materials: <span className="text-cyan-400 font-bold ml-1">{materials.length}</span>
        </div>
      </div>

      {error && <p className="text-red-400 bg-red-950/20 border border-red-800 p-4 rounded-lg">{error}</p>}
      {success && (
        <div className="text-green-400 bg-green-950/20 border border-green-800 p-4 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Upload Form Card */}
      <div className="bg-[#161616]/90 border border-cyan-500/30 p-6 rounded-xl shadow-xl space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Plus className="w-5 h-5 text-cyan-400" />
          <span>Upload New Material</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-300">Material Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Solid State Chemistry Chapter Notes PDF"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-[#262626] border border-[#404040] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-300">Material Type *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { key: "PDF", label: "PDF File", icon: FileText },
                  { key: "IMAGE", label: "Image / Diagram", icon: ImageIcon },
                  { key: "LINK", label: "Web Link", icon: LinkIcon },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = form.type === item.key;
                  return (
                    <button
                      type="button"
                      key={item.key}
                      onClick={() => {
                        setForm({ ...form, type: item.key });
                        setSelectedFile(null);
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition ${
                        isSelected
                          ? "bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md"
                          : "bg-[#262626] border-[#404040] text-gray-400 hover:text-white"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2 bg-[#121212] p-3.5 rounded-lg border border-[#2d2d2d]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <span>Access Plan Tier: Who can view/open this content?</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                  form.isPremium ? "bg-amber-950 text-amber-300 border border-amber-600/60" : "bg-emerald-950 text-emerald-300 border border-emerald-600/60"
                }`}>
                  {form.isPremium ? "⭐ PREMIUM (Subscription Required)" : "🔓 FREE (All Students)"}
                </span>
              </label>
            </div>
            <select
              value={form.isPremium ? "PREMIUM" : "FREE"}
              onChange={(e) => setForm({ ...form, isPremium: e.target.value === "PREMIUM" })}
              className="w-full bg-[#262626] border border-amber-500/50 text-amber-300 font-bold rounded-lg px-3.5 py-2.5 text-xs outline-none cursor-pointer"
            >
              <option value="FREE" className="bg-[#1a1a1a] text-emerald-300 font-semibold">
                🔓 FREE PLAN — Accessible to all registered students without subscription
              </option>
              <option value="PREMIUM" className="bg-amber-950 text-amber-300 font-bold">
                ⭐ PREMIUM PLAN — Requires active paid/complimentary subscription to access
              </option>
            </select>
            <p className="text-[11px] text-gray-400">
              {form.isPremium
                ? "🔒 Premium Content: Students without an active subscription will see 'Gold Member Access Required' and cannot open this link or file."
                : "🌐 Free Content: Any registered student can immediately open the link, view diagrams, or download PDFs."}
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-300">Description / Instructions (Optional)</label>
            <textarea
              rows={2}
              placeholder="Add brief details about this study material..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[#262626] border border-[#404040] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 resize-none"
            />
          </div>

          {/* File Picker or Link Input */}
          {form.type === "LINK" ? (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-300">External URL Link *</label>
              <input
                type="url"
                required
                placeholder="https://example.com/reference-resource"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="w-full bg-[#262626] border border-[#404040] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-300">
                Select {form.type === "PDF" ? "PDF Document (.pdf)" : "Image File (.png, .jpg, .svg)"} *
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer bg-[#262626] border border-dashed border-[#555] hover:border-cyan-400 p-4 rounded-lg text-center transition">
                  <input
                    type="file"
                    accept={form.type === "PDF" ? "application/pdf" : "image/*"}
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-1.5">
                    <Upload className="w-5 h-5 text-cyan-400" />
                    <span className="text-xs font-medium text-gray-300">
                      {selectedFile ? selectedFile.name : `Click to choose ${form.type === "PDF" ? "PDF" : "Image"} file`}
                    </span>
                    {selectedFile && (
                      <span className="text-[11px] text-cyan-400 font-mono">
                        ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    )}
                  </div>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg text-xs transition disabled:opacity-50 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{submitting ? "Uploading..." : "Publish Study Material"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Uploaded Materials List */}
      <section className="space-y-4 pt-4 border-t border-[#333333]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Uploaded Materials Catalog</span>
              <span className="text-xs bg-[#222] text-gray-300 px-2.5 py-0.5 rounded-full border border-[#333]">
                {materials.length} total
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Review and toggle access permissions (Free vs Premium) for all links, 3D labs, and PDF resources.
            </p>
          </div>

          {/* Access Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-[#1a1a1a] p-1 rounded-lg border border-[#333] shrink-0">
            <button
              type="button"
              onClick={() => setFilterTier("ALL")}
              className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                filterTier === "ALL" ? "bg-cyan-950 text-cyan-300 border border-cyan-700/60 shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              All ({materials.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTier("FREE")}
              className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                filterTier === "FREE" ? "bg-emerald-950 text-emerald-300 border border-emerald-700/60 shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              <span>🔓</span> Free ({materials.filter((m: any) => !m.isPremium).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTier("PREMIUM")}
              className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                filterTier === "PREMIUM" ? "bg-amber-950 text-amber-300 border border-amber-700/60 shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              <span>⭐</span> Premium ({materials.filter((m: any) => m.isPremium).length})
            </button>
          </div>
        </div>

        {materials.length === 0 ? (
          <div className="bg-[#161616]/60 p-6 text-center text-[#a6a6a6] rounded-xl border border-[#333333]">
            No study materials uploaded yet. Use the form above to add PDFs, images, or reference links.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials
              .filter((item: any) => {
                if (filterTier === "FREE") return !item.isPremium;
                if (filterTier === "PREMIUM") return item.isPremium;
                return true;
              })
              .map((item: any) => {
                const isPdf = item.type === "PDF";
                const isImage = item.type === "IMAGE";
                const isUpdatingThis = updatingTierId === item.id;

                return (
                  <div key={item.id} className="bg-[#161616]/90 border border-[#333333] hover:border-cyan-500/40 p-5 rounded-xl flex flex-col justify-between gap-4 shadow-lg transition">
                    <div className="space-y-3">
                      {/* Top Badges Row: Type & Access Plan Tier */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                            isPdf
                              ? "bg-red-950/80 text-red-400 border border-red-800/60"
                              : isImage
                              ? "bg-purple-950/80 text-purple-400 border border-purple-800/60"
                              : "bg-blue-950/80 text-blue-400 border border-blue-800/60"
                          }`}>
                            {isPdf && <FileText className="w-3.5 h-3.5" />}
                            {isImage && <ImageIcon className="w-3.5 h-3.5" />}
                            {!isPdf && !isImage && <LinkIcon className="w-3.5 h-3.5" />}
                            {item.type}
                          </span>

                          {/* Access Plan Tier Badge */}
                          {item.isPremium ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-950/90 text-amber-300 border border-amber-600/60 flex items-center gap-1 shadow">
                              <span>⭐</span> PREMIUM
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-950/90 text-emerald-300 border border-emerald-600/60 flex items-center gap-1 shadow">
                              <span>🔓</span> FREE PLAN
                            </span>
                          )}
                        </div>

                        {item.fileSize && (
                          <span className="text-[11px] text-gray-400 font-mono">{item.fileSize}</span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-white text-base leading-snug">{item.title}</h3>
                        {item.description && (
                          <p className="text-xs text-gray-400 leading-relaxed mt-1">{item.description}</p>
                        )}
                      </div>

                      {/* Access Tier Quick Controls Bar */}
                      <div className="p-2.5 rounded-lg bg-[#111111] border border-[#262626] flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-gray-400">
                          {item.isPremium ? "Requires subscription to access" : "Open to all free students"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleTier(item)}
                          disabled={isUpdatingThis}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer ${
                            item.isPremium
                              ? "bg-[#222] hover:bg-emerald-950 text-gray-300 hover:text-emerald-300 border-[#444] hover:border-emerald-600"
                              : "bg-[#222] hover:bg-amber-950 text-gray-300 hover:text-amber-300 border-[#444] hover:border-amber-600"
                          }`}
                        >
                          {isUpdatingThis ? "Updating..." : item.isPremium ? "Set as Free" : "Set as Premium"}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#262626]">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-cyan-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span>{item.type === "LINK" ? "Open Link" : "View / Download"}</span>
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
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
}
