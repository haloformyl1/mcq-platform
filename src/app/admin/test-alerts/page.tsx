"use client";

import { useState, useEffect } from "react";
import { Zap, Sliders, Eye, Check, AlertCircle, RefreshCw, BellRing } from "lucide-react";

const GRADIENT_PRESETS = [
  { label: "Golden Amber", value: "from-amber-950/90 via-yellow-900/70 to-amber-950/90" },
  { label: "Urgent Crimson", value: "from-red-950/90 via-rose-900/80 to-red-950/90" },
  { label: "Ocean Blue", value: "from-blue-950/90 via-cyan-900/80 to-blue-950/90" },
  { label: "Emerald Mint", value: "from-emerald-950/90 via-teal-900/80 to-emerald-950/90" },
  { label: "Royal Purple", value: "from-purple-950/90 via-indigo-900/80 to-purple-950/90" },
  { label: "Academic Light", value: "from-[#fffbeb] via-[#fef3c7] to-[#fffbeb]" }
];

const BADGE_COLOR_PRESETS = [
  { label: "Amber Gold", value: "bg-amber-500 text-black" },
  { label: "Red Pulse", value: "bg-red-600 text-white animate-pulse" },
  { label: "Cyan Blue", value: "bg-cyan-600 text-white" },
  { label: "Emerald Green", value: "bg-emerald-600 text-white" },
  { label: "Purple Velvet", value: "bg-purple-600 text-white" },
  { label: "Cream / Red", value: "bg-[#fff3cd] text-[#991b1b]" }
];

const TEXT_COLOR_PRESETS = [
  { label: "Amber Gold", value: "text-amber-200" },
  { label: "Rose White", value: "text-red-100" },
  { label: "Cyan Mint", value: "text-cyan-100" },
  { label: "Emerald Light", value: "text-emerald-100" },
  { label: "Dark Crimson", value: "text-red-700" },
  { label: "Pure White", value: "text-white" }
];

export default function AdminTestAlertsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    badgeText: "TEST ALERT",
    bgGradient: "from-amber-950/90 via-yellow-900/70 to-amber-950/90",
    badgeColor: "bg-amber-500 text-black",
    textColor: "text-amber-200",
    marqueeSpeed: "normal",
    customNotice: ""
  });

  const fetchSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/test-alerts");
      const data = await res.json();
      if (res.ok) {
        setForm({
          badgeText: data.badgeText || "TEST ALERT",
          bgGradient: data.bgGradient || "from-amber-950/90 via-yellow-900/70 to-amber-950/90",
          badgeColor: data.badgeColor || "bg-amber-500 text-black",
          textColor: data.textColor || "text-amber-200",
          marqueeSpeed: data.marqueeSpeed || "normal",
          customNotice: data.customNotice || ""
        });
      } else {
        setError(data.error || "Failed to fetch test alert settings");
      }
    } catch (err) {
      setError("Network error fetching test alert settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/test-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess("Test alert display settings updated successfully!");
        setTimeout(() => setSuccess(""), 3500);
      } else {
        setError(data.error || "Failed to save test alert settings");
      }
    } catch (err) {
      setError("Network error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const getMarqueeDuration = (speed?: string) => {
    if (speed === "slow") return "40s";
    if (speed === "fast") return "12s";
    return "25s";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#333333] pb-4 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-400">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Test Alert Bar Customizer</h1>
            <p className="text-sm text-gray-400">Customize color palette, badge label, scroll speed, and custom notice for student test alerts.</p>
          </div>
        </div>
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

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mr-3" />
          <span>Loading Test Alert Settings...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Live Interactive Preview Box */}
          <div className="bg-[#161616] p-5 rounded-2xl border border-amber-500/40 space-y-3 shadow-xl">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Eye size={14} className="text-cyan-400" /> Live Ticker Preview (Student's View)
            </label>
            <div className={`bg-gradient-to-r ${form.bgGradient} border border-amber-500/50 rounded-xl overflow-hidden py-3 px-4 shadow-md`}>
              <div className="flex items-center gap-3 overflow-hidden">
                <span className={`shrink-0 text-xs font-bold ${form.badgeColor} px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 shadow`}>
                  <span className="w-2 h-2 rounded-full bg-black animate-ping"></span>
                  {form.badgeText || "TEST ALERT"}
                </span>
                <div className="flex-1 overflow-hidden relative">
                  <div
                    className="animate-marquee whitespace-nowrap inline-block text-sm font-semibold"
                    style={{ animationDuration: getMarqueeDuration(form.marqueeSpeed) }}
                  >
                    <span className={`mr-12 ${form.textColor}`}>
                      🔥 Live Test <strong className="text-white bg-green-950 px-2 py-0.5 rounded border border-green-600/60">CODE- T0009WSE1T1CCBP2(GENERAL)</strong> is NOW LIVE! Last day to take test: <strong className="text-amber-300 font-mono">31/10/2026 11:59:00 PM</strong>.
                    </span>
                    {form.customNotice && (
                      <span className={`mr-12 ${form.textColor}`}>
                        📢 <strong>Notice:</strong> {form.customNotice}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Badge Text & Custom Notice Settings */}
          <div className="bg-[#161616] p-5 rounded-2xl border border-[#333333] space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#262626] pb-3">
              <span>1. Badge Label & Custom Message Control</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Badge Text Label *</label>
                <input
                  type="text"
                  required
                  placeholder="TEST ALERT, EXAM NOTICE, LIVE UPDATE..."
                  className="w-full bg-[#262626] border border-[#404040] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-semibold"
                  value={form.badgeText}
                  onChange={e => setForm({ ...form, badgeText: e.target.value })}
                />
                <p className="text-[11px] text-gray-500 mt-1">This text appears inside the solid pill badge on the left of the ticker.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Custom Additional Notice Message (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Please bring your admit cards and submit before deadline..."
                  className="w-full bg-[#262626] border border-[#404040] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  value={form.customNotice}
                  onChange={e => setForm({ ...form, customNotice: e.target.value })}
                />
                <p className="text-[11px] text-gray-500 mt-1">Appears alongside preset test alerts inside the scrolling ticker.</p>
              </div>
            </div>
          </div>

          {/* Ticker Scroll Speed Settings */}
          <div className="bg-[#161616] p-5 rounded-2xl border border-[#333333] space-y-3 shadow-lg">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Zap size={14} className="text-yellow-400" /> 2. Ticker Scroll Speed Control
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "slow", label: "Slow (40s)", desc: "Relaxed & easy reading" },
                { id: "normal", label: "Normal (25s)", desc: "Standard ticker speed" },
                { id: "fast", label: "Fast (12s)", desc: "High urgency ticker" }
              ].map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => setForm({ ...form, marqueeSpeed: sp.id })}
                  className={`p-3 rounded-xl border text-center transition ${
                    form.marqueeSpeed === sp.id
                      ? "bg-amber-950/80 text-amber-300 border-amber-500 shadow-md font-bold"
                      : "bg-[#262626] text-gray-400 border-[#404040] hover:text-white"
                  }`}
                >
                  <div className="text-sm font-semibold">{sp.label}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{sp.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Preset Palette Selectors */}
          <div className="bg-[#161616] p-5 rounded-2xl border border-[#333333] space-y-5 shadow-lg">
            <h3 className="text-xs font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider border-b border-[#262626] pb-3">
              <Sliders size={14} className="text-cyan-400" /> 3. Color Preset Palette Options
            </h3>

            {/* Background Gradient Palette */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-300">Background Gradient Palette</label>
              <div className="flex flex-wrap gap-2">
                {GRADIENT_PRESETS.map((g, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setForm({ ...form, bgGradient: g.value })}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                      form.bgGradient === g.value
                        ? "bg-amber-950 text-amber-300 border-amber-500 font-bold shadow"
                        : "bg-[#262626] text-gray-300 border-[#404040] hover:border-gray-500"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Badge Color Palette */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-300">Badge Color Palette</label>
              <div className="flex flex-wrap gap-2">
                {BADGE_COLOR_PRESETS.map((b, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setForm({ ...form, badgeColor: b.value })}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                      form.badgeColor === b.value
                        ? "bg-amber-950 text-amber-300 border-amber-500 font-bold shadow"
                        : "bg-[#262626] text-gray-300 border-[#404040] hover:border-gray-500"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Color Palette */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-300">Text Color Palette</label>
              <div className="flex flex-wrap gap-2">
                {TEXT_COLOR_PRESETS.map((tc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setForm({ ...form, textColor: tc.value })}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                      form.textColor === tc.value
                        ? "bg-amber-950 text-amber-300 border-amber-500 font-bold shadow"
                        : "bg-[#262626] text-gray-300 border-[#404040] hover:border-gray-500"
                    }`}
                  >
                    {tc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition disabled:opacity-50 shadow-xl border border-amber-500/40"
            >
              {saving ? "Saving Changes..." : "Save Test Alert Display Settings"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
