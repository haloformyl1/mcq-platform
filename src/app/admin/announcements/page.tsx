"use client";

import { useState, useEffect } from "react";
import { Megaphone, Plus, Edit2, Trash2, Eye, ToggleLeft, ToggleRight, Sparkles, Check, AlertCircle, RefreshCw, X, Link as LinkIcon } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  bgGradient: string;
  textColor: string;
  badgeColor: string;
  badgeText: string;
  actionLabel?: string | null;
  actionUrl?: string | null;
  isMarquee: boolean;
  isDismissible: boolean;
  isActive: boolean;
  startAt?: string | null;
  endAt?: string | null;
  createdAt: string;
}

const PRESET_TEMPLATES = [
  {
    name: "Golden Notice (Marquee)",
    badgeText: "ANNOUNCEMENT",
    badgeColor: "bg-amber-500 text-black",
    bgGradient: "from-amber-950/90 via-yellow-900/70 to-amber-950/90",
    textColor: "text-amber-200",
    isMarquee: true,
    priority: "INFO"
  },
  {
    name: "Urgent Live Exam Alert",
    badgeText: "URGENT EXAM",
    badgeColor: "bg-red-600 text-white animate-pulse",
    bgGradient: "from-red-950/90 via-rose-900/80 to-red-950/90",
    textColor: "text-red-100",
    isMarquee: true,
    priority: "URGENT"
  },
  {
    name: "Important Update",
    badgeText: "IMPORTANT",
    badgeColor: "bg-blue-600 text-white",
    bgGradient: "from-blue-950/90 via-cyan-900/80 to-blue-950/90",
    textColor: "text-cyan-100",
    isMarquee: false,
    priority: "INFO"
  },
  {
    name: "Success / Result Published",
    badgeText: "RESULTS OUT",
    badgeColor: "bg-emerald-600 text-white",
    bgGradient: "from-emerald-950/90 via-teal-900/80 to-emerald-950/90",
    textColor: "text-emerald-100",
    isMarquee: false,
    priority: "SUCCESS"
  },
  {
    name: "Academic Cream Ticker (Light)",
    badgeText: "📢 NOTICE",
    badgeColor: "bg-[#fff3cd] text-[#991b1b]",
    bgGradient: "from-[#fffbeb] via-[#fef3c7] to-[#fffbeb] border-b-2 border-t-2 border-red-600/70",
    textColor: "text-red-700 font-bold",
    isMarquee: true,
    priority: "INFO"
  },
  {
    name: "Classic Institutional Ticker",
    badgeText: "PROVISIONAL",
    badgeColor: "bg-red-700 text-white",
    bgGradient: "from-[#fffdf5] via-[#fffae6] to-[#fffdf5] border-2 border-red-500/80",
    textColor: "text-red-800 font-semibold",
    isMarquee: true,
    priority: "URGENT"
  }
];

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "BANNER",
    priority: "INFO",
    bgGradient: "from-amber-950/90 via-yellow-900/70 to-amber-950/90",
    textColor: "text-amber-200",
    badgeColor: "bg-amber-500 text-black",
    badgeText: "ANNOUNCEMENT",
    actionLabel: "",
    actionUrl: "",
    isMarquee: true,
    isDismissible: false,
    isActive: true,
    startAt: "",
    endAt: ""
  });

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/announcements");
      const data = await res.json();
      if (res.ok) {
        setAnnouncements(data);
      } else {
        setError(data.error || "Failed to fetch announcements");
      }
    } catch (err) {
      setError("Network error fetching announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      title: "",
      content: "",
      type: "BANNER",
      priority: "INFO",
      bgGradient: "from-amber-950/90 via-yellow-900/70 to-amber-950/90",
      textColor: "text-amber-200",
      badgeColor: "bg-amber-500 text-black",
      badgeText: "ANNOUNCEMENT",
      actionLabel: "",
      actionUrl: "",
      isMarquee: true,
      isDismissible: false,
      isActive: true,
      startAt: "",
      endAt: ""
    });
    setShowModal(true);
  };

  const openEditModal = (item: Announcement) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      type: item.type,
      priority: item.priority,
      bgGradient: item.bgGradient,
      textColor: item.textColor,
      badgeColor: item.badgeColor,
      badgeText: item.badgeText,
      actionLabel: item.actionLabel || "",
      actionUrl: item.actionUrl || "",
      isMarquee: item.isMarquee,
      isDismissible: item.isDismissible,
      isActive: item.isActive,
      startAt: item.startAt ? new Date(item.startAt).toISOString().slice(0, 16) : "",
      endAt: item.endAt ? new Date(item.endAt).toISOString().slice(0, 16) : ""
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const url = "/api/admin/announcements";
      const method = editingId ? "PUT" : "POST";
      const payload = editingId ? { id: editingId, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(editingId ? "Announcement updated!" : "Announcement created!");
        setShowModal(false);
        fetchAnnouncements();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to save announcement");
      }
    } catch (err) {
      setError("Network error saving announcement");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: Announcement) => {
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive })
      });
      if (res.ok) {
        setAnnouncements(prev =>
          prev.map(a => (a.id === item.id ? { ...a, isActive: !a.isActive } : a))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      } else {
        alert("Failed to delete announcement");
      }
    } catch (e) {
      alert("Error deleting announcement");
    }
  };

  const applyTemplate = (tpl: typeof PRESET_TEMPLATES[0]) => {
    setForm(prev => ({
      ...prev,
      badgeText: tpl.badgeText,
      badgeColor: tpl.badgeColor,
      bgGradient: tpl.bgGradient,
      textColor: tpl.textColor,
      isMarquee: tpl.isMarquee,
      priority: tpl.priority
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#333333] pb-4 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-400">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Announcement Controller</h1>
            <p className="text-sm text-gray-400">Customize banners, scrolling tickers, and notices on the student dashboard.</p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center space-x-2 shadow-lg border border-amber-500/30 shrink-0"
        >
          <Plus size={18} />
          <span>Create Announcement</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-400 p-4 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/40 text-green-400 p-4 rounded-xl text-sm flex items-center gap-2">
          <Check className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mr-3" />
          <span>Loading announcements...</span>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-[#161616]/80 p-8 text-center text-gray-400 rounded-2xl border border-[#333333] space-y-3">
          <Megaphone className="w-12 h-12 text-amber-400/50 mx-auto" />
          <h3 className="text-lg font-bold text-white">No custom announcements created yet</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">Create customized top banner announcements, scrolling tickers, and live alerts for all students!</p>
          <button
            onClick={openCreateModal}
            className="mt-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
          >
            <Plus size={16} />
            Add First Announcement
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Active & Saved Announcements</span>
            <span className="text-xs bg-[#262626] text-amber-400 px-2.5 py-0.5 rounded-full border border-[#404040]">
              {announcements.length} Total
            </span>
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {announcements.map((item) => (
              <div
                key={item.id}
                className={`bg-[#161616] border rounded-2xl p-5 space-y-4 shadow-lg transition ${
                  item.isActive ? "border-amber-500/40 hover:border-amber-500/70" : "border-[#333333] opacity-60"
                }`}
              >
                {/* Top Row Controls */}
                <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border transition ${
                        item.isActive
                          ? "bg-green-950/80 text-green-400 border-green-700/60"
                          : "bg-gray-800 text-gray-400 border-gray-600"
                      }`}
                    >
                      {item.isActive ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                      <span>{item.isActive ? "LIVE / ACTIVE" : "OFF / INACTIVE"}</span>
                    </button>
                    <span className="text-xs text-gray-400 font-mono">
                      Type: <strong className="text-white">{item.type}</strong>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 bg-[#262626] hover:bg-[#333333] text-cyan-400 rounded-lg transition border border-[#404040]"
                      title="Edit Announcement"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-[#262626] hover:bg-red-950 text-red-400 rounded-lg transition border border-[#404040]"
                      title="Delete Announcement"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Live Preview Render */}
                <div className={`bg-gradient-to-r ${item.bgGradient} border border-amber-500/50 rounded-xl overflow-hidden py-3 px-4 shadow-md`}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className={`shrink-0 text-xs font-bold ${item.badgeColor} px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 shadow`}>
                      {item.badgeText}
                    </span>
                    <div className="flex-1 overflow-hidden relative">
                      <div className={`${item.isMarquee ? "animate-marquee whitespace-nowrap inline-block" : "block"} text-sm font-semibold ${item.textColor}`}>
                        <strong className="mr-2 text-white">{item.title}:</strong>
                        <span>{item.content}</span>
                        {item.actionLabel && item.actionUrl && (
                          <a
                            href={item.actionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-3 underline font-bold hover:text-white"
                          >
                            {item.actionLabel} →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit / Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#161616] border border-amber-500/50 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#262626]"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 border-b border-[#333333] pb-4">
              <div className="p-2.5 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingId ? "Edit Announcement" : "Create Custom Announcement"}
                </h3>
                <p className="text-xs text-gray-400">Customize text, animation, badge, and color gradients</p>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333333] space-y-2">
              <span className="text-xs font-bold text-gray-300">Quick Styling Presets:</span>
              <div className="flex flex-wrap gap-2 pt-1">
                {PRESET_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[#262626] hover:bg-[#333333] text-amber-300 border border-[#404040] font-medium transition"
                  >
                    🎨 {tpl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Interactive Preview Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Eye size={14} className="text-cyan-400" /> Live Preview
              </label>
              <div className={`bg-gradient-to-r ${form.bgGradient} border border-amber-500/50 rounded-xl overflow-hidden py-3 px-4 shadow-md`}>
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className={`shrink-0 text-xs font-bold ${form.badgeColor} px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 shadow`}>
                    {form.badgeText || "ANNOUNCEMENT"}
                  </span>
                  <div className="flex-1 overflow-hidden relative">
                    <div className={`${form.isMarquee ? "animate-marquee whitespace-nowrap inline-block" : "block"} text-sm font-semibold ${form.textColor}`}>
                      <strong className="mr-2 text-white">{form.title || "Announcement Title"}:</strong>
                      <span>{form.content || "Your customized announcement message will appear here..."}</span>
                      {form.actionLabel && (
                        <span className="ml-3 underline font-bold">
                          {form.actionLabel} →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Announcement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 🔥 New Grand Mock Test Available!"
                  className="w-full bg-[#262626] border border-[#404040] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Content / Details *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Write full notice message here..."
                  className="w-full bg-[#262626] border border-[#404040] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Badge Text</label>
                  <input
                    type="text"
                    placeholder="ANNOUNCEMENT, URGENT, NOTICE..."
                    className="w-full bg-[#262626] border border-[#404040] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                    value={form.badgeText}
                    onChange={e => setForm({ ...form, badgeText: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Badge Color (Tailwind Classes)</label>
                  <input
                    type="text"
                    placeholder="bg-amber-500 text-black"
                    className="w-full bg-[#262626] border border-[#404040] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono text-xs"
                    value={form.badgeColor}
                    onChange={e => setForm({ ...form, badgeColor: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Background Gradient (Tailwind Classes)</label>
                <input
                  type="text"
                  placeholder="from-amber-950/90 via-yellow-900/70 to-amber-950/90"
                  className="w-full bg-[#262626] border border-[#404040] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono text-xs"
                  value={form.bgGradient}
                  onChange={e => setForm({ ...form, bgGradient: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Action Button Label (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. View Exam Schedule"
                    className="w-full bg-[#262626] border border-[#404040] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                    value={form.actionLabel}
                    onChange={e => setForm({ ...form, actionLabel: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Action URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. /dashboard or https://..."
                    className="w-full bg-[#262626] border border-[#404040] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono text-xs"
                    value={form.actionUrl}
                    onChange={e => setForm({ ...form, actionUrl: e.target.value })}
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333333] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Scrolling Marquee Text</h4>
                    <p className="text-[11px] text-gray-400">Animate text horizontally across screen</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isMarquee}
                      onChange={e => setForm({ ...form, isMarquee: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#333333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Active Status</h4>
                    <p className="text-[11px] text-gray-400">Enable/disable for students immediately</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={e => setForm({ ...form, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#333333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#333333]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-300 bg-[#262626] hover:bg-[#333333] rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition disabled:opacity-50 shadow-lg"
                >
                  {saving ? "Saving..." : editingId ? "Update Announcement" : "Publish Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
