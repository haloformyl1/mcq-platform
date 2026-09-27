"use client";

import { useState, useEffect } from "react";
import { Link as LinkIcon, Trash2, Plus, ExternalLink, CheckCircle2, Search, Sparkles, X, Loader2 } from "lucide-react";

export default function Admin3DAnimations() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "LINK",
    category: "3D animations",
    discipline: "GENERAL",
    section: "ALL",
    classSem: "ALL",
    url: "",
    isPremium: false,
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/admin/study-materials");
      const data = await res.json();
      if (res.ok) {
        setMaterials(data.materials || []);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to fetch animations");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.url) {
      alert("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const createRes = await fetch("/api/admin/study-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (createRes.ok) {
        setForm({ ...form, title: "", description: "", url: "" });
        fetchMaterials();
      } else {
        const errData = await createRes.json();
        alert(errData.error || "Failed to publish link");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this animation?")) return;
    try {
      const res = await fetch("/api/admin/study-materials?id=" + id, { method: "DELETE" });
      if (res.ok) {
        setMaterials(materials.filter((m) => m.id !== id));
      } else {
        alert("Failed to delete animation.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const filteredMaterials = materials.filter((item: any) => item.category === "3D animations");

  return (
    <div className="min-h-screen bg-[#070e16] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
              <Sparkles className="w-8 h-8 text-cyan-400" />
              3D Animations & External Links
            </h1>
            <p className="text-sm text-gray-400 mt-2">Manage interactive 3D models and external resources.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#111a27] p-6 rounded-2xl border border-cyan-500/30">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                <LinkIcon className="w-5 h-5 text-cyan-400" />
                Add New Link
              </h2>
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-[#0a111a] border border-gray-800 focus:border-cyan-500 rounded-lg p-3 text-sm text-white mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">External URL</label>
                  <input
                    type="url"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    className="w-full bg-[#0a111a] border border-gray-800 focus:border-cyan-500 rounded-lg p-3 text-sm text-white mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Description (Optional)</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-[#0a111a] border border-gray-800 focus:border-cyan-500 rounded-lg p-3 text-sm text-white mt-1 h-20"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-amber-400 font-bold bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                  <input
                    type="checkbox"
                    checked={form.isPremium}
                    onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 bg-black border-gray-700"
                  />
                  Require Premium / Gold Membership
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Add Animation
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-[#111a27] rounded-2xl border border-gray-800 p-6 min-h-[500px]">
              <h2 className="text-lg font-bold text-white mb-6">Current 3D Animations</h2>
              {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-cyan-500 animate-spin" /></div>
              ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-20 text-gray-500">No animations found.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredMaterials.map((item) => (
                    <div key={item.id} className="bg-[#0a111a] p-4 rounded-xl border border-gray-800 flex flex-col justify-between group">
                      <div>
                        <div className="flex items-start justify-between">
                          <h3 className="font-bold text-white text-sm line-clamp-2">{item.title}</h3>
                          {item.isPremium && <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0">Gold</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.description}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium">
                          <ExternalLink className="w-3.5 h-3.5" /> View Link
                        </a>
                        <button onClick={() => handleDelete(item.id)} className="text-gray-600 hover:text-red-400 transition p-1.5 rounded bg-gray-900/50 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
