"use client";

import { useState, useEffect } from "react";
import { 
  Upload, FileText, Image as ImageIcon, Link as LinkIcon, Trash2, 
  Plus, ExternalLink, Download, File, CheckCircle2, BookOpen, 
  Atom, CheckSquare, Flame, Award, GraduationCap, FileCheck, 
  Search, Filter, Sparkles, Eye, Tag, CloudUpload, Pencil, X, FolderUp, Folders, CheckCheck, Loader2, FileStack
} from "lucide-react";
import PiFiringLoader from "@/components/PiFiringLoader";
import { 
  LIBRARY_CATEGORIES, 
  LibraryCategoryType,
  SUBJECT_DISCIPLINES,
  SubjectDisciplineType,
  parseMaterialMetadata
} from "@/lib/studyMaterialMetadata";


const uploadFileToR2 = (uploadUrl: string, file: File, onProgress: (pct: number) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/pdf");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Direct cloud upload failed with status ${xhr.status}: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during direct Cloudflare R2 upload. Check CORS settings if uploading from a new domain."));
    };

    xhr.send(file);
  });
};

export default function AdminStudyMaterials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState<string>("");

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

  // Batch Folder Upload State
  const [uploadMode, setUploadMode] = useState<"single" | "batch">("single");
  const [stagedFiles, setStagedFiles] = useState<Array<{
    id: string;
    file: File;
    title: string;
    category: LibraryCategoryType;
    discipline: SubjectDisciplineType;
    isPremium: boolean;
    sizeFormatted: string;
    status: "pending" | "uploading" | "done" | "error";
    errorMsg?: string;
  }>>([]);
  const [batchUploading, setBatchUploading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({
    current: 0,
    total: 0,
    percent: 0,
    currentFileName: ""
  });
  const [bulkCategory, setBulkCategory] = useState<LibraryCategoryType>("Chapter wise PDF Notes");
  const [bulkDiscipline, setBulkDiscipline] = useState<SubjectDisciplineType>("GENERAL");

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    const valid = rawFiles.filter(f => 
      f.name.toLowerCase().endsWith(".pdf") || 
      f.type === "application/pdf" || 
      f.type.startsWith("image/")
    );

    if (valid.length === 0) {
      alert("No PDF documents or images found in the selected folder.");
      return;
    }

    const newItems = valid.map((file, idx) => {
      // Clean filename into default Material Title
      const rawBase = file.name.replace(/\.[^/.]+$/, "");
      const cleanTitle = rawBase
        .replace(/^\d+[-_.]\s*/, "") // Strip leading numbering e.g. 01_ or 1.
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ")
        .trim() || rawBase;

      // Auto-detect best category & branch from title keywords
      const meta = parseMaterialMetadata("", cleanTitle, file.type.startsWith("image/") ? "IMAGE" : "PDF");
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

      return {
        id: "staged-" + Date.now() + "-" + idx + "-" + Math.random().toString(36).substr(2, 6),
        file,
        title: cleanTitle,
        category: meta.category,
        discipline: meta.discipline,
        isPremium: false,
        sizeFormatted: sizeMB + " MB",
        status: "pending" as const,
      };
    });

    setStagedFiles(prev => [...prev, ...newItems]);
    e.target.value = "";
  };

  const handleUpdateStaged = (id: string, updates: Partial<(typeof stagedFiles)[0]>) => {
    setStagedFiles(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleRemoveStaged = (id: string) => {
    setStagedFiles(prev => prev.filter(item => item.id !== id));
  };

  const handleApplyBulkCategory = () => {
    setStagedFiles(prev => prev.map(item => ({ ...item, category: bulkCategory })));
  };

  const handleApplyBulkDiscipline = () => {
    setStagedFiles(prev => prev.map(item => ({ ...item, discipline: bulkDiscipline })));
  };

  const handleToggleAllPremium = (isPrem: boolean) => {
    setStagedFiles(prev => prev.map(item => ({ ...item, isPremium: isPrem })));
  };

  const handleClearStaged = () => {
    if (batchUploading) return;
    if (confirm("Clear all staged files from the queue?")) {
      setStagedFiles([]);
    }
  };

  const handleStartBatchUpload = async () => {
    const pendingItems = stagedFiles.filter(item => item.status === "pending" || item.status === "error");
    if (pendingItems.length === 0) {
      alert("No pending files in the upload queue.");
      return;
    }

    setBatchUploading(true);
    setError(null);
    let successCount = 0;

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      setBatchProgress({
        current: i + 1,
        total: pendingItems.length,
        percent: Math.round(((i) / pendingItems.length) * 100),
        currentFileName: item.title
      });

      handleUpdateStaged(item.id, { status: "uploading" });

      try {
        // 1. Get Direct Presigned R2 URL
        const presignRes = await fetch("/api/admin/study-materials/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: item.file.name,
            contentType: item.file.type || (item.file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
          }),
        });
        const presignData = await presignRes.json();
        if (!presignRes.ok) throw new Error(presignData.error || "Failed to initialize cloud upload");

        // 2. Direct PUT to Cloudflare R2
        await uploadFileToR2(presignData.uploadUrl, item.file, () => {});

        // 3. Register Record with Custom Title, Shelf Category & Discipline
        const createRes = await fetch("/api/admin/study-materials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title.trim(),
            description: "",
            type: item.file.name.toLowerCase().endsWith(".pdf") ? "PDF" : "IMAGE",
            category: item.category,
            discipline: item.discipline,
            isPremium: item.isPremium,
            url: presignData.publicUrl,
            fileSize: item.sizeFormatted,
          }),
        });

        if (!createRes.ok) {
          const errData = await createRes.json();
          throw new Error(errData.error || "Failed to register record in database");
        }

        handleUpdateStaged(item.id, { status: "done" });
        successCount++;
      } catch (err: any) {
        console.error("Batch upload failed for", item.title, err);
        handleUpdateStaged(item.id, { status: "error", errorMsg: err?.message || "Upload failed" });
      }
    }

    setBatchUploading(false);
    setBatchProgress({
      current: pendingItems.length,
      total: pendingItems.length,
      percent: 100,
      currentFileName: ""
    });

    fetchMaterials();
    setSuccess("Batch upload completed! " + successCount + " of " + pendingItems.length + " materials published into the student vault.");
    setTimeout(() => setSuccess(null), 6000);
  };

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    type: "PDF",
    category: "Chapter wise PDF Notes" as LibraryCategoryType,
    discipline: "GENERAL" as SubjectDisciplineType,
    url: "",
    isPremium: false,
  });
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editUploadProgress, setEditUploadProgress] = useState<number | null>(null);
  const [editUploadStatusText, setEditUploadStatusText] = useState<string>("");

  const handleOpenEdit = (item: any) => {
    const rawDesc = item.cleanDescription !== undefined
      ? item.cleanDescription
      : (item.description ? item.description.replace(/<!--[\s\S]*?-->/g, "").trim() : "");

    setEditingItem(item);
    setEditForm({
      title: item.title || "",
      description: rawDesc || "",
      type: item.type || "PDF",
      category: item.category || "Chapter wise PDF Notes",
      discipline: item.discipline || "GENERAL",
      url: item.url || "",
      isPremium: Boolean(item.isPremium),
    });
    setEditFile(null);
    setEditUploadProgress(null);
    setEditUploadStatusText("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editForm.title.trim()) return alert("Please enter a title");
    if (editForm.type === "LINK" && !editForm.url.trim()) return alert("Please enter a valid URL");

    setEditSubmitting(true);
    setEditUploadProgress(null);
    setEditUploadStatusText("");

    try {
      let finalUrl = editForm.url.trim();
      let fileSizeFormatted = editingItem.fileSize || null;

      if (editFile) {
        setEditUploadStatusText("Requesting secure upload channel...");
        const presignRes = await fetch("/api/admin/study-materials/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: editFile.name,
            contentType: editFile.type || (editForm.type === "PDF" ? "application/pdf" : "image/jpeg"),
          }),
        });

        const presignData = await presignRes.json();
        if (!presignRes.ok) {
          throw new Error(presignData.error || "Failed to initialize cloud upload");
        }

        setEditUploadStatusText("Uploading replacement to Cloudflare R2...");
        setEditUploadProgress(0);

        await uploadFileToR2(presignData.uploadUrl, editFile, (pct) => {
          setEditUploadProgress(pct);
          setEditUploadStatusText(`Uploading replacement to Cloudflare R2 (${pct}%)...`);
        });

        finalUrl = presignData.publicUrl;
        const sizeMB = (editFile.size / (1024 * 1024)).toFixed(2);
        fileSizeFormatted = `${sizeMB} MB`;
      }

      setEditUploadStatusText("Saving changes...");

      const res = await fetch("/api/admin/study-materials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          type: editForm.type,
          category: editForm.category,
          discipline: editForm.discipline,
          isPremium: editForm.isPremium,
          url: finalUrl,
          fileSize: fileSizeFormatted,
        }),
      });

      const data = await res.json();
      if (res.ok && data.material) {
        setSuccess("Study material updated successfully!");
        setMaterials((prev) =>
          prev.map((m) => (m.id === editingItem.id ? { ...m, ...data.material } : m))
        );
        setEditingItem(null);
        setTimeout(() => setSuccess(null), 4000);
      } else {
        alert(data.error || "Failed to update study material");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to save changes");
    } finally {
      setEditSubmitting(false);
      setEditUploadProgress(null);
      setEditUploadStatusText("");
    }
  };

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
      let finalUrl = form.url.trim();
      let fileSizeFormatted: string | null = null;

      if (selectedFile) {
        setUploadStatusText("Requesting secure Cloudflare R2 upload channel...");
        const presignRes = await fetch("/api/admin/study-materials/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: selectedFile.name,
            contentType: selectedFile.type || (form.type === "PDF" ? "application/pdf" : "image/jpeg"),
          }),
        });

        const presignData = await presignRes.json();
        if (!presignRes.ok) {
          throw new Error(presignData.error || "Failed to initialize cloud upload");
        }

        setUploadStatusText("Uploading directly to Cloudflare R2 (0%)...");
        setUploadProgress(0);

        await uploadFileToR2(presignData.uploadUrl, selectedFile, (pct) => {
          setUploadProgress(pct);
          setUploadStatusText(`Uploading directly to Cloudflare R2 (${pct}%)...`);
        });

        finalUrl = presignData.publicUrl;
        const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
        fileSizeFormatted = `${sizeMB} MB`;
      }

      setUploadStatusText("Saving material record to vault...");

      const res = await fetch("/api/admin/study-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          type: form.type,
          category: form.category,
          discipline: form.discipline,
          isPremium: form.isPremium,
          url: finalUrl,
          fileSize: fileSizeFormatted,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("Study material published into " + form.category + " successfully!");
        setForm({
          title: "",
          description: "",
          type: "PDF",
          category: "Chapter wise PDF Notes",
          discipline: "GENERAL",
          url: "",
          isPremium: false
        });
        setSelectedFile(null);
        setUploadProgress(null);
        setUploadStatusText("");
        fetchMaterials();
        setTimeout(() => setSuccess(null), 4500);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to process upload request");
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
      setUploadStatusText("");
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              <span>Publish Study Materials into Library</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Direct Cloudflare R2 uploads bypassing Vercel size limits with full shelf categorisation.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-[#161616] p-1.5 rounded-xl border border-[#2a2a2a] shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setUploadMode("single")}
              className={"px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer " + (
                uploadMode === "single"
                  ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20 font-black"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <File className="w-3.5 h-3.5" />
              <span>Single Upload</span>
            </button>

            <button
              type="button"
              onClick={() => setUploadMode("batch")}
              className={"px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer " + (
                uploadMode === "batch"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md shadow-cyan-500/20 font-black"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <FolderUp className="w-3.5 h-3.5" />
              <span>📁 Upload Entire Folder / Batch</span>
              {stagedFiles.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono text-cyan-200">
                  {stagedFiles.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {uploadMode === "single" ? (
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
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <CloudUpload className="w-4 h-4 text-cyan-400" />
                              <span>Upload Local {form.type} File (Cloudflare R2 Direct)</span>
                            </span>
                            <span className="text-[11px] text-cyan-400/80 font-normal font-mono">No 4.5MB limit</span>
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept={form.type === "PDF" ? "application/pdf" : "image/*"}
                              onChange={e => {
                              const f = e.target.files?.[0] || null;
                              setSelectedFile(f);
                              if (f && !form.title.trim()) {
                                const rawBase = f.name.replace(/\.[^/.]+$/, "");
                                const cleanTitle = rawBase
                                  .replace(/^\d+[-_.]\s*/, "")
                                  .replace(/[-_]/g, " ")
                                  .replace(/\s+/g, " ")
                                  .trim() || rawBase;
                                setForm(prev => ({ ...prev, title: cleanTitle }));
                              }
                            }}
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
          
                          {uploadProgress !== null && (
                            <div className="space-y-1.5 p-3 rounded-xl bg-[#161616] border border-cyan-500/30">
                              <div className="flex justify-between text-xs font-mono text-cyan-300">
                                <span>{uploadStatusText}</span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <div className="w-full bg-[#222] h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-150 ease-out" 
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            </div>
                          )}
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
                      {submitting ? (uploadStatusText || "Publishing to Digital Vault...") : "Publish Material to Student Vault"}
                    </button>
                  </form>
        ) : (
          /* BATCH / COMPLETE FOLDER UPLOAD VIEW */
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Upload Options Card */}
            <div className="p-8 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 rounded-2xl bg-[#141414]/60 text-center space-y-4 transition">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/50">
                <FolderUp className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Select a Complete Folder from Your Device
                </h3>
                <p className="text-xs text-gray-400 max-w-xl mx-auto">
                  Upload an entire chapter folder at once. Filenames automatically become the <strong>Material Title *</strong>, and you can freely reassign each document to its exact shelf category below.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <label className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-2">
                  <FolderUp className="w-4 h-4" />
                  <span>Choose Entire Folder</span>
                  <input
                    type="file"
                    {...({ webkitdirectory: "", directory: "" } as any)}
                    multiple
                    onChange={handleFolderSelect}
                    className="hidden"
                  />
                </label>

                <label className="px-4 py-2.5 rounded-xl bg-[#202020] hover:bg-[#282828] text-white text-xs font-bold border border-[#333] transition cursor-pointer flex items-center gap-2">
                  <FileStack className="w-4 h-4 text-cyan-400" />
                  <span>Or Select Multiple PDFs</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,application/pdf,image/*"
                    onChange={handleFolderSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Staging Queue & Shelf Assignment */}
            {stagedFiles.length > 0 && (
              <div className="space-y-4 bg-[#141414] border border-[#2a2a2a] p-4 sm:p-6 rounded-2xl">
                {/* Bulk Controls Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#252525]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Folders className="w-4 h-4 text-cyan-400" />
                      <span>Staged Documents ({stagedFiles.length})</span>
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      ({stagedFiles.filter(f => f.status === "done").length} uploaded, {stagedFiles.filter(f => f.status === "pending" || f.status === "error").length} pending)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Bulk Shelf Category */}
                    <div className="flex items-center gap-1.5 bg-[#1a1a1a] p-1.5 rounded-xl border border-[#333]">
                      <span className="text-gray-400 text-[11px] pl-1 font-semibold">Bulk Shelf:</span>
                      <select
                        value={bulkCategory}
                        onChange={e => setBulkCategory(e.target.value as LibraryCategoryType)}
                        className="bg-[#111] border border-cyan-500/30 text-cyan-300 text-xs rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                      >
                        {LIBRARY_CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleApplyBulkCategory}
                        disabled={batchUploading}
                        className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Apply to All
                      </button>
                    </div>

                    {/* Bulk Discipline */}
                    <div className="flex items-center gap-1.5 bg-[#1a1a1a] p-1.5 rounded-xl border border-[#333]">
                      <span className="text-gray-400 text-[11px] pl-1 font-semibold">Branch:</span>
                      <select
                        value={bulkDiscipline}
                        onChange={e => setBulkDiscipline(e.target.value as SubjectDisciplineType)}
                        className="bg-[#111] border border-[#444] text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                      >
                        {SUBJECT_DISCIPLINES.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleApplyBulkDiscipline}
                        disabled={batchUploading}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Apply to All
                      </button>
                    </div>

                    {/* Quick Toggles */}
                    <button
                      type="button"
                      onClick={() => handleToggleAllPremium(true)}
                      disabled={batchUploading}
                      className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Make All Gold
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAllPremium(false)}
                      disabled={batchUploading}
                      className="px-2.5 py-1.5 bg-[#222] hover:bg-[#282828] text-gray-300 border border-[#333] rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Make All Free
                    </button>
                    <button
                      type="button"
                      onClick={handleClearStaged}
                      disabled={batchUploading}
                      className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold transition cursor-pointer ml-auto"
                    >
                      Clear Queue
                    </button>
                  </div>
                </div>

                {/* Staged Items List */}
                <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                  {stagedFiles.map((item, index) => {
                    const isDone = item.status === "done";
                    const isUploading = item.status === "uploading";
                    const isErr = item.status === "error";

                    return (
                      <div
                        key={item.id}
                        className={"p-3 sm:p-4 rounded-xl border transition flex flex-col md:flex-row items-start md:items-center gap-3.5 " + (
                          isDone
                            ? "bg-emerald-950/20 border-emerald-800/40"
                            : isUploading
                            ? "bg-cyan-950/30 border-cyan-500/50 shadow-md shadow-cyan-950/30"
                            : isErr
                            ? "bg-red-950/20 border-red-800/40"
                            : "bg-[#181818] border-[#292929] hover:border-[#383838]"
                        )}
                      >
                        {/* Index & File Type Badge */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-mono text-gray-500 w-5">
                            #{index + 1}
                          </span>
                          <div className={"w-8 h-8 rounded-lg flex items-center justify-center " + (
                            item.file.name.toLowerCase().endsWith(".pdf")
                              ? "bg-red-500/10 text-red-400 border border-red-500/30"
                              : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                          )}>
                            {item.file.name.toLowerCase().endsWith(".pdf") ? (
                              <FileText className="w-4 h-4" />
                            ) : (
                              <ImageIcon className="w-4 h-4" />
                            )}
                          </div>
                        </div>

                        {/* Material Title * (Auto-filled from filename, fully editable) */}
                        <div className="flex-1 min-w-0 w-full md:w-auto">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                              <span>Material Title *</span>
                              <span className="text-[9px] text-cyan-400/80 font-normal lowercase">(auto-named from file)</span>
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono truncate max-w-[200px]" title={item.file.name}>
                              {item.file.name}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={item.title}
                            onChange={e => handleUpdateStaged(item.id, { title: e.target.value })}
                            disabled={isDone || isUploading}
                            placeholder="Material Title *"
                            className="w-full bg-[#121212] border border-[#333] focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none font-medium transition"
                          />
                        </div>

                        {/* Shelf Category Selector */}
                        <div className="w-full md:w-56 shrink-0">
                          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                            Library Shelf *
                          </span>
                          <select
                            value={item.category}
                            onChange={e => handleUpdateStaged(item.id, { category: e.target.value as LibraryCategoryType })}
                            disabled={isDone || isUploading}
                            className="w-full bg-[#121212] border border-cyan-500/40 text-cyan-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer font-medium"
                          >
                            {LIBRARY_CATEGORIES.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        {/* Subject Branch Dropdown */}
                        <div className="w-full md:w-28 shrink-0">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                            Branch
                          </span>
                          <select
                            value={item.discipline}
                            onChange={e => handleUpdateStaged(item.id, { discipline: e.target.value as SubjectDisciplineType })}
                            disabled={isDone || isUploading}
                            className="w-full bg-[#121212] border border-[#333] text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
                          >
                            {SUBJECT_DISCIPLINES.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>

                        {/* Gold / Premium & Size & Actions */}
                        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center pt-2 md:pt-4">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-amber-400 select-none bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/30">
                            <input
                              type="checkbox"
                              checked={item.isPremium}
                              onChange={e => handleUpdateStaged(item.id, { isPremium: e.target.checked })}
                              disabled={isDone || isUploading}
                              className="w-3.5 h-3.5 rounded text-amber-500 bg-[#121212] border-gray-600 focus:ring-amber-500 cursor-pointer"
                            />
                            <span className="text-[11px] font-bold">Gold</span>
                          </label>

                          <span className="text-[10px] font-mono text-gray-400 bg-[#1f1f1f] px-2 py-1 rounded border border-[#333]">
                            {item.sizeFormatted}
                          </span>

                          {/* Status Badge */}
                          {isDone ? (
                            <span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Uploaded</span>
                            </span>
                          ) : isUploading ? (
                            <span className="px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center gap-1 animate-pulse">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span className="hidden sm:inline">Sending...</span>
                            </span>
                          ) : isErr ? (
                            <span className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold" title={item.errorMsg}>
                              Failed
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-lg bg-[#202020] text-gray-400 text-[10px] font-mono">
                              Ready
                            </span>
                          )}

                          {!isDone && !isUploading && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStaged(item.id)}
                              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                              title="Remove document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress Bar (Visible while batchUploading) */}
                {batchUploading && (
                  <div className="space-y-1.5 p-3 rounded-xl bg-[#181818] border border-cyan-500/40 animate-pulse">
                    <div className="flex justify-between text-xs font-mono text-cyan-300">
                      <span>Uploading {batchProgress.current} of {batchProgress.total}: {batchProgress.currentFileName}...</span>
                      <span>{batchProgress.percent}%</span>
                    </div>
                    <div className="w-full bg-[#222] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-200"
                        style={{ width: batchProgress.percent + "%" }}
                      />
                    </div>
                  </div>
                )}

                {/* Start Batch Upload Button */}
                <button
                  type="button"
                  onClick={handleStartBatchUpload}
                  disabled={batchUploading || stagedFiles.filter(f => f.status === "pending" || f.status === "error").length === 0}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {batchUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading Files Directly to Cloudflare R2 ({batchProgress.current}/{batchProgress.total})...</span>
                    </>
                  ) : (
                    <>
                      <FolderUp className="w-4 h-4" />
                      <span>Publish All {stagedFiles.filter(f => f.status === "pending" || f.status === "error").length} Materials to Student Vault</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
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
                      {(() => {
                        const clean = item.cleanDescription !== undefined 
                          ? item.cleanDescription 
                          : (item.description ? item.description.replace(/<!--[\s\S]*?-->/g, "").trim() : "");
                        return clean ? (
                          <p className="text-xs text-gray-400 leading-relaxed mt-1 line-clamp-3">
                            {clean}
                          </p>
                        ) : null;
                      })()}
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
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-cyan-950/40 rounded-lg transition cursor-pointer"
                        title="Edit material details"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

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
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition cursor-pointer"
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

      {/* 4. EDIT MATERIAL MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-cyan-500/40 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl shadow-cyan-950/50 space-y-6 relative">
            <div className="flex items-center justify-between border-b border-[#222] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Edit Published Material</h2>
                  <p className="text-xs text-gray-400">Update title, syllabus notes, category shelf, or replace the file.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-2 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                    Material Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full bg-[#181818] border border-[#333] focus:border-cyan-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
                    required
                  />
                </div>

                {/* Shelf Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                    Library Shelf Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={editForm.category}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value as LibraryCategoryType })}
                    className="w-full bg-[#181818] border border-cyan-500/40 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none cursor-pointer"
                  >
                    {LIBRARY_CATEGORIES.map(cat => (
                      <option key={cat} value={cat} className="bg-[#181818] text-white">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Branch */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                    Subject Branch / Discipline
                  </label>
                  <select
                    value={editForm.discipline}
                    onChange={e => setEditForm({ ...editForm, discipline: e.target.value as SubjectDisciplineType })}
                    className="w-full bg-[#181818] border border-[#333] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none cursor-pointer"
                  >
                    <option value="GENERAL">General / All Branches</option>
                    <option value="PHYSICAL">Physical Chemistry</option>
                    <option value="INORGANIC">Inorganic Chemistry</option>
                    <option value="ORGANIC">Organic Chemistry</option>
                  </select>
                </div>

                {/* Format Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                    Format Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={editForm.type}
                    onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                    className="w-full bg-[#181818] border border-[#333] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none cursor-pointer"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="LINK">External Link / 3D Simulation</option>
                    <option value="IMAGE">Image</option>
                  </select>
                </div>

                {/* Access Plan Tier */}
                <div className="space-y-1.5 flex flex-col justify-center">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wide mb-1">
                    Access Plan Tier
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer bg-[#181818] border border-[#333] px-4 py-2 rounded-xl hover:border-[#444] transition">
                    <input
                      type="checkbox"
                      checked={editForm.isPremium}
                      onChange={e => setEditForm({ ...editForm, isPremium: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 bg-[#222] border-gray-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>⭐ Mark as Premium</span>
                    </span>
                  </label>
                </div>

                {/* Current URL or Link */}
                {editForm.type === "LINK" && (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                      Interactive Lab URL / Link <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="url"
                      value={editForm.url}
                      onChange={e => setEditForm({ ...editForm, url: e.target.value })}
                      className="w-full bg-[#181818] border border-[#333] focus:border-cyan-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition"
                      required
                    />
                  </div>
                )}

                {/* Replace File (Optional) */}
                {editForm.type !== "LINK" && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center justify-between">
                      <span>Replace {editForm.type} File (Optional)</span>
                      <span className="text-[11px] text-cyan-400 font-normal">Cloudflare R2 Direct</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept={editForm.type === "PDF" ? "application/pdf" : "image/*"}
                        onChange={e => setEditFile(e.target.files?.[0] || null)}
                        className="block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#252525] file:text-white hover:file:bg-[#303030] cursor-pointer"
                      />
                      {editFile && (
                        <button
                          type="button"
                          onClick={() => setEditFile(null)}
                          className="text-xs text-red-400 hover:underline shrink-0"
                        >
                          Cancel File
                        </button>
                      )}
                    </div>
                    {editUploadProgress !== null && (
                      <div className="space-y-1.5 p-3 rounded-xl bg-[#161616] border border-cyan-500/30">
                        <div className="flex justify-between text-xs font-mono text-cyan-300">
                          <span>{editUploadStatusText}</span>
                          <span>{editUploadProgress}%</span>
                        </div>
                        <div className="w-full bg-[#222] h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-150 ease-out" 
                            style={{ width: `${editUploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                    Description / Syllabus Notes (Optional)
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    placeholder="Topics covered, derivations, question count..."
                    className="w-full bg-[#181818] border border-[#333] focus:border-cyan-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  disabled={editSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-gray-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {editSubmitting ? (editUploadStatusText || "Saving Changes...") : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
