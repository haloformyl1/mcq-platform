"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import FormattedAiMessage from "./FormattedAiMessage";
import PiechemAiLogo from "./PiechemAiLogo";
import { 
  X, Send, User, ArrowRight, 
  Atom, BookOpen, Dna, 
  GraduationCap, Copy, Check, 
  Lightbulb, RotateCcw,
  Sparkles, Compass, Calculator, ChevronDown, ChevronRight,
  MessageSquare, Lock, Paperclip, ThumbsUp, ThumbsDown,
  Search, MoreVertical, Edit2, Trash2, Menu
} from "lucide-react";
import { 
  generateConversationTitle, 
  groupConversationsByDate, 
  AiConversationMeta 
} from "@/lib/ai/conversationUtils";

interface Message {
  id: string;
  isOutOfScope?: boolean;
  detectedSubject?: string;
  role: 'user' | 'assistant';
  content: string;
  title?: string;
  keyConcepts?: string[];
  keyTakeaway?: string;
  relatedTopics?: string[];
  groundedInPiechem?: boolean;
  sourceCategory?: 'PIECHEM_MATERIAL' | 'STUDENT_DATA' | 'GENERAL_ACADEMIC' | 'WEB_RESEARCH' | 'PIECHEM_AND_WEB';
  timestamp: string;
  feedback?: 'like' | 'dislike' | null;
}

interface AcademicContext {
  subject: string;
  className?: string;
  semester?: string;
  chapter?: string;
  topic?: string;
}

interface AiTutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'tutor' | 'practice' | 'doubt' | 'revision' | 'study_plan' | 'exam';
  initialContext?: AcademicContext;
  initialStudentName?: string;
}


export default function AiTutorDrawer({
  isOpen,
  onClose,
  initialMode = "tutor",
  initialContext,
  initialStudentName = "Scholar"
}: AiTutorDrawerProps) {
  // Mode & Language
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [selectedSubject, setSelectedSubject] = useState<'stem' | 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology'>('Chemistry');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  const [showLevelMenu, setShowLevelMenu] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Conversation history state (real database backed)
  const [conversations, setConversations] = useState<AiConversationMeta[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Context menu & inline rename
  const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState("");

  // Academic contextual state
  const [context, setContext] = useState<AcademicContext>(initialContext || {
    subject: "Chemistry",
    className: "Class 11",
    chapter: "Periodic Table",
    topic: "Ionisation Energy"
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [quota, setQuota] = useState<{ remaining: number; totalLimit?: number; dailyLimit?: number; isUnlimited: boolean; queriesUsed?: number } | null>(null);
  const [goldPrice, setGoldPrice] = useState<number>(199);
  const [studentName, setStudentName] = useState<string>(initialStudentName || "Scholar");

  // Active messages list (empty by default for clean new chat)
  const [messages, setMessages] = useState<Message[]>([]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Sync language
  const handleToggleLang = (newLang: 'en' | 'bn') => {
    setLanguage(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('piechem_ai_lang', newLang);
      window.dispatchEvent(new CustomEvent('piechem-language-changed', { detail: newLang }));
    }
  };

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 200);
      return () => {
        document.body.style.overflow = originalBodyOverflow;
      };
    }
  }, [isOpen]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setOpenMenuChatId(null);
      }
    };
    if (openMenuChatId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuChatId]);

  // Load language preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('piechem_ai_lang') as 'en' | 'bn';
      if (savedLang === 'en' || savedLang === 'bn') {
        setLanguage(savedLang);
      }
    }
  }, []);

  // Fetch real AI Quota
  const fetchQuota = async () => {
    try {
      const res = await fetch('/api/ai/quota');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.quota) {
          setQuota(data.quota);
        }
        if (data.goldPrice) {
          setGoldPrice(data.goldPrice);
        }
      }
    } catch {
      // Graceful fallback
    }
  };

  // Fetch real conversation history
  const fetchConversations = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetch('/api/ai/conversations');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.conversations)) {
          setConversations(data.conversations);
          if (typeof window !== 'undefined') {
            localStorage.setItem('piechem_ai_history_cache', JSON.stringify(data.conversations));
          }
        }
      } else {
        // Fallback to cache if network fails
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('piechem_ai_history_cache');
          if (cached) {
            try {
              setConversations(JSON.parse(cached));
            } catch {
              setConversations([]);
            }
          }
        }
      }
    } catch (err: any) {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('piechem_ai_history_cache');
        if (cached) {
          try {
            setConversations(JSON.parse(cached));
            setHistoryLoading(false);
            return;
          } catch {
            // ignore
          }
        }
      }
      setHistoryError("Unable to load conversation history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQuota();
      fetchConversations();
    }
  }, [isOpen]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Keyboard shortcut: Cmd+K / Ctrl+K for New Chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter conversations by search term
  const filteredConversations = useMemo(() => {
    if (!historySearch.trim()) return conversations;
    const q = historySearch.toLowerCase();
    return conversations.filter(c => 
      c.title.toLowerCase().includes(q) || 
      (c.lastMessagePreview && c.lastMessagePreview.toLowerCase().includes(q))
    );
  }, [conversations, historySearch]);

  // Dynamic date grouping (TODAY, YESTERDAY, PREVIOUS 7 DAYS, etc.)
  const dateGroups = useMemo(() => {
    return groupConversationsByDate(filteredConversations);
  }, [filteredConversations]);

  // Start a fresh new chat
  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setInput("");
    setIsMobileSidebarOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Select an existing conversation from sidebar
  const handleSelectChat = async (convId: string) => {
    if (activeChatId === convId) {
      setIsMobileSidebarOpen(false);
      return;
    }

    setActiveChatId(convId);
    setIsMobileSidebarOpen(false);
    setLoading(true);

    try {
      const res = await fetch(`/api/ai/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.conversation) {
          const conv = data.conversation;
          setMessages(Array.isArray(conv.messages) ? conv.messages : []);
          if (conv.subject) {
            setSelectedSubject(conv.subject as any);
          }
          if (conv.level) {
            setLevel(conv.level as any);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 150);
    }
  };

  // Inline Rename
  const handleStartRename = (conv: AiConversationMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(conv.id);
    setEditTitleInput(conv.title);
    setOpenMenuChatId(null);
  };

  const handleSaveRename = async (convId: string) => {
    const trimmed = editTitleInput.trim();
    if (!trimmed) {
      setEditingChatId(null);
      return;
    }

    // Optimistic UI
    setConversations(prev => prev.map(c => 
      c.id === convId ? { ...c, title: trimmed, updatedAt: new Date().toISOString() } : c
    ));
    setEditingChatId(null);

    try {
      await fetch(`/api/ai/conversations/${convId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed })
      });
    } catch (err) {
      console.error("Failed to rename conversation:", err);
    }
  };

  // Delete Conversation
  const handleDeleteChat = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuChatId(null);

    // Optimistic UI
    setConversations(prev => prev.filter(c => c.id !== convId));

    if (activeChatId === convId) {
      handleNewChat();
    }

    try {
      await fetch(`/api/ai/conversations/${convId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend !== undefined ? textToSend : input).trim();
    if (!queryText || loading) return;

    // Check quota
    if (quota && !quota.isUnlimited && quota.remaining <= 0) {
      const limitMsg: Message = {
        id: `limit-${Date.now()}`,
        role: "assistant",
        content: `**Daily Free Limit Reached**\n\nYou have completed your **${quota.totalLimit || 5} free AI queries** for today.\n\nUnlock unlimited high-speed mathematical & scientific problem solving with **PIECHEM AI Gold** for only **₹${goldPrice}/month**.`,
        title: "Daily Limit Reached",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, limitMsg]);
      setInput("");
      return;
    }

    const currentTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `usr-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      role: "user",
      content: queryText,
      timestamp: currentTimestamp
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Determine or generate conversation ID
    let currentChatId = activeChatId;
    let isFirstMessage = false;

    if (!currentChatId) {
      currentChatId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `conv-${Date.now()}`;
      setActiveChatId(currentChatId);
      isFirstMessage = true;

      // Generate meaningful title immediately
      const generatedTitle = generateConversationTitle(queryText);
      const newConvMeta: AiConversationMeta = {
        id: currentChatId,
        title: generatedTitle,
        subject: selectedSubject,
        level: level,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessagePreview: queryText.slice(0, 90),
        messageCount: 1
      };

      // Realtime optimistic update: immediately place under TODAY at the top of the sidebar!
      setConversations(prev => [newConvMeta, ...prev.filter(c => c.id !== currentChatId)]);
    } else {
      // Update timestamp and lastMessagePreview of existing chat and move it to top of TODAY
      setConversations(prev => {
        const existing = prev.find(c => c.id === currentChatId);
        if (!existing) return prev;
        const updatedItem: AiConversationMeta = {
          ...existing,
          updatedAt: new Date().toISOString(),
          lastMessagePreview: queryText.slice(0, 90),
          messageCount: (existing.messageCount || 1) + 1
        };
        return [updatedItem, ...prev.filter(c => c.id !== currentChatId)];
      });
    }

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryText,
          subject: selectedSubject,
          level: level,
          language: language,
          academicContext: context,
          conversationHistory: newMessages.slice(-6).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await res.json();
      let assistantMsg: Message;

      if (!res.ok) {
        if (res.status === 429 && data.rateLimited) {
          assistantMsg = {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: "Please slow down. PIECHEM AI is processing high-precision mathematical calculations. Try again in a few moments.",
            title: "Calculations Paused",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        } else {
          assistantMsg = {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: data.error || "Something interrupted the response. Please try again.",
            title: "Response Interrupted",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        }
      } else {
        if (data.isOutOfScope) {
          assistantMsg = {
            id: `scope-${Date.now()}`,
            role: "assistant",
            isOutOfScope: true,
            detectedSubject: data.detectedSubject,
            content: data.message || "PIECHEM AI is an academic tutor dedicated exclusively to Physics, Chemistry, Mathematics, and Biology. Please ask a concept or problem from these sciences.",
            title: "STEM Scope Restriction",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        } else {
          let derivedTitle = data.telemetry?.title;
          if (!derivedTitle && isFirstMessage) {
            derivedTitle = generateConversationTitle(queryText);
          }

          assistantMsg = {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: data.response || "No response generated.",
            title: derivedTitle || "Academic Solution",
            keyConcepts: data.telemetry?.keyConcepts || [],
            keyTakeaway: data.telemetry?.keyTakeaway || "",
            relatedTopics: data.telemetry?.relatedTopics || [],
            groundedInPiechem: data.groundedInPiechem || false,
            sourceCategory: data.sourceCategory,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        }

        if (data.quota) {
          setQuota(data.quota);
        }
      }

      const finalMessagesList = [...newMessages, assistantMsg];
      setMessages(finalMessagesList);

      // Persist conversation to database
      if (currentChatId) {
        const activeTitle = conversations.find(c => c.id === currentChatId)?.title || generateConversationTitle(queryText);
        fetch('/api/ai/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: currentChatId,
            title: activeTitle,
            subject: selectedSubject,
            level: level,
            messages: finalMessagesList
          })
        }).catch(err => console.error("Auto-save conversation failed:", err));
      }

    } catch (err: any) {
      const networkErrMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "PIECHEM AI encountered an unexpected connection error. Please verify your internet connection and try again.",
        title: "Connection Error",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, networkErrMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id: string, type: 'like' | 'dislike') => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, feedback: m.feedback === type ? null : type } : m));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInput(prev => `${prev} [Attached Reference: ${file.name}]`.trim());
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-[#050203] text-slate-100 font-sans select-text overflow-hidden animate-in fade-in duration-200"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 50% 10%, rgba(190, 24, 48, 0.08) 0%, transparent 60%),
          radial-gradient(circle at 15% 40%, rgba(160, 15, 35, 0.04) 0%, transparent 45%),
          radial-gradient(circle at 85% 65%, rgba(180, 20, 45, 0.03) 0%, transparent 50%)
        `
      }}
    >
      {/* BACKGROUND SUBTLE SCIENTIFIC ORBITAL GEOMETRY */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50%" cy="40%" r="380" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="4 8" />
          <circle cx="50%" cy="40%" r="620" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="6 12" />
          <ellipse cx="50%" cy="40%" rx="750" ry="280" fill="none" stroke="#fff" strokeWidth="1" transform="rotate(-25 500 400)" />
          <ellipse cx="50%" cy="40%" rx="750" ry="280" fill="none" stroke="#fff" strokeWidth="1" transform="rotate(25 500 400)" />
        </svg>
      </div>

      {/* 1. TOP HEADER */}
      <header className="h-14 shrink-0 px-4 md:px-6 flex items-center justify-between border-b border-red-950/70 bg-[#070204]/90 backdrop-blur-md z-30">
        
        {/* Left: Brand + Status Pill + Usage Pill */}
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle */}
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(prev => !prev)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 lg:hidden cursor-pointer"
            title="Toggle Conversation History"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <PiechemAiLogo size="sm" animated />
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif font-bold tracking-wide text-white text-base md:text-lg">PIECHEM</span>
              <span className="font-bold text-red-500 text-sm tracking-widest">AI</span>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-red-950/50 text-red-300 border border-red-800/40">
            STEM TUTOR
          </span>

          {/* Daily Usage Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#120406] border border-red-900/40 text-[11px] font-medium text-slate-300 shadow-sm">
            <span className="text-red-400 font-bold text-xs">✦</span>
            {quota?.isUnlimited ? (
              <span className="font-semibold text-amber-300 tracking-wide">GOLD UNLIMITED</span>
            ) : (
              <span>
                <strong className="text-white font-bold">{quota?.remaining ?? 5}</strong>
                <span className="text-slate-500 font-normal"> / {quota?.dailyLimit ?? quota?.totalLimit ?? 5} FREE LEFT TODAY</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Controls (Language, Level, Exit) */}
        <div className="flex items-center gap-2.5">
          {/* Language Toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-[#120406] border border-red-950 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleToggleLang('en')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                language === 'en' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleToggleLang('bn')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                language === 'bn' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              বাংলা
            </button>
          </div>

          {/* Difficulty Level Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLevelMenu(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#120406] hover:bg-[#1b060a] border border-red-950 text-xs font-semibold text-slate-300 transition cursor-pointer"
            >
              <GraduationCap className="h-3.5 w-3.5 text-rose-400" />
              <span className="capitalize">{level}</span>
              <ChevronDown className="h-3 w-3 text-slate-500" />
            </button>

            {showLevelMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-[#140507] border border-red-900/60 shadow-2xl p-1 z-50 animate-in fade-in slide-in-from-top-1">
                {(['beginner', 'intermediate', 'advanced'] as const).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setLevel(lvl);
                      setShowLevelMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer capitalize flex items-center justify-between ${
                      level === lvl ? 'bg-red-500/20 text-rose-300 font-bold' : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span>{lvl}</span>
                    {level === lvl && <Check className="h-3 w-3 text-red-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Exit Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#120406] hover:bg-red-950/60 border border-red-950 hover:border-red-500/40 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
            title="Exit PIECHEM AI (Esc)"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* MAIN BODY: SIDEBAR + CENTER WORKSPACE */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        
        {/* Mobile Backdrop */}
        {isMobileSidebarOpen && (
          <div 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
          />
        )}

        {/* LEFT SIDEBAR (Width: 260px, Desktop + Mobile Overlay) */}
        <aside 
          className={`w-64 xl:w-72 shrink-0 border-r border-red-950/60 bg-[#070204]/95 lg:bg-[#070204]/90 flex flex-col justify-between p-3.5 z-40 lg:z-20 transition-transform duration-200 ${
            isMobileSidebarOpen 
              ? 'fixed inset-y-0 left-0 pt-16 flex shadow-2xl' 
              : 'hidden lg:flex'
          }`}
        >
          <div className="flex-1 flex flex-col min-h-0 space-y-3.5">
            {/* New Chat Button */}
            <button
              type="button"
              onClick={handleNewChat}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#180509] hover:bg-[#22080d] border border-red-500/30 hover:border-red-500/50 text-white text-xs font-bold shadow-sm transition cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-rose-400 group-hover:rotate-12 transition-transform" />
                <span>New Chat</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                ⌘ K
              </span>
            </button>

            {/* Search History Input */}
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search history..."
                className="w-full bg-[#120406]/90 border border-red-950/70 focus:border-red-500/40 rounded-lg pl-7 pr-6 py-1 text-[11px] text-slate-300 placeholder-slate-600 outline-none transition"
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => setHistorySearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {/* Scrollable History Section */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 no-scrollbar" ref={menuContainerRef}>
              
              {historyLoading ? (
                /* Loading Skeleton */
                <div className="space-y-2 pt-1">
                  <div className="h-3 w-12 bg-white/5 rounded animate-pulse" />
                  <div className="h-7 bg-white/[0.04] rounded-lg animate-pulse" />
                  <div className="h-7 bg-white/[0.04] rounded-lg animate-pulse" />
                  <div className="h-7 bg-white/[0.04] rounded-lg animate-pulse" />
                </div>
              ) : historyError ? (
                <div className="px-2 py-3 rounded-lg bg-red-950/20 border border-red-900/30 text-center space-y-1.5">
                  <p className="text-[11px] text-red-300 font-medium">{historyError}</p>
                  <button
                    type="button"
                    onClick={fetchConversations}
                    className="text-[10px] text-rose-400 underline hover:text-white cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                /* Grouped History List */
                dateGroups.map(({ group, items }) => (
                  <div key={group} className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-500 px-1 uppercase">
                      <span>{group}</span>
                      <ChevronRight className="w-3 h-3 text-slate-700" />
                    </div>

                    {items.length === 0 ? (
                      <div className="px-2.5 py-3 text-center space-y-1 border border-dashed border-red-950/40 rounded-xl bg-[#0e0305]/30">
                        <p className="text-[11px] font-medium text-slate-400">No conversations yet.</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          Start by asking a Physics, Chemistry, Mathematics, or Biology question.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-0.5 text-xs">
                        {items.map((chat) => (
                          <div
                            key={chat.id}
                            className="group/item relative flex items-center"
                          >
                            {editingChatId === chat.id ? (
                              /* Inline Rename Input */
                              <div className="w-full flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1a060a] border border-red-500/50">
                                <input
                                  type="text"
                                  autoFocus
                                  value={editTitleInput}
                                  onChange={(e) => setEditTitleInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveRename(chat.id);
                                    if (e.key === 'Escape') setEditingChatId(null);
                                  }}
                                  onBlur={() => handleSaveRename(chat.id)}
                                  className="w-full bg-transparent text-xs text-white outline-none"
                                />
                              </div>
                            ) : (
                              /* Conversation Item Button */
                              <button
                                type="button"
                                onClick={() => handleSelectChat(chat.id)}
                                className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                                  activeChatId === chat.id
                                    ? 'bg-[#1e070c] border-l-2 border-red-500 text-white font-semibold shadow-[inset_0_1px_8px_rgba(239,68,68,0.2)]'
                                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                  <span className="truncate text-xs">{chat.title}</span>
                                </div>

                                {/* Three-Dot Context Menu Trigger */}
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuChatId(openMenuChatId === chat.id ? null : chat.id);
                                  }}
                                  className="opacity-0 group-hover/item:opacity-100 p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition"
                                  title="Options"
                                >
                                  <MoreVertical className="w-3 h-3" />
                                </div>
                              </button>
                            )}

                            {/* Context Menu Dropdown */}
                            {openMenuChatId === chat.id && (
                              <div className="absolute right-0 top-full mt-0.5 w-32 rounded-lg bg-[#160508] border border-red-900/60 shadow-xl p-1 z-50 animate-in fade-in slide-in-from-top-1">
                                <button
                                  type="button"
                                  onClick={(e) => handleStartRename(chat, e)}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] text-slate-300 hover:text-white hover:bg-white/10 transition text-left cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3 text-slate-400" />
                                  <span>Rename</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteChat(chat.id, e)}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] text-rose-400 hover:text-rose-300 hover:bg-red-950/40 transition text-left cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Quote */}
          <div className="pt-3 border-t border-red-950/40 shrink-0">
            <p className="text-[10px] font-serif italic text-slate-400 leading-relaxed">
              &ldquo; Better Questions.<br />
              Deeper Understanding. &rdquo;
            </p>
            <div className="w-5 h-0.5 bg-red-500/40 mt-1" />
          </div>
        </aside>

        {/* CENTER MAIN WORKSPACE */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050102]">
          
          {/* Messages & Workspace Container */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6"
          >
            <div className="max-w-5xl mx-auto w-full">

              {/* WELCOME STATE: When there are no messages */}
              {messages.length === 0 && (
                <div className="py-8 md:py-14 flex flex-col items-center text-center animate-in fade-in duration-300">
                  
                  {/* Centered Glass Atomic Icon */}
                  <div className="relative mb-5">
                    <div className="absolute inset-0 rounded-full bg-red-600/20 blur-xl animate-pulse" />
                    <div className="relative p-4 rounded-2xl bg-gradient-to-b from-[#1c070c] to-[#0d0305] border border-red-500/30 shadow-2xl">
                      <PiechemAiLogo size="lg" animated />
                    </div>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
                    PIECHEM <span className="text-red-500">AI</span>
                  </h1>

                  <p className="text-sm font-medium text-rose-300/80 mt-1 mb-2 tracking-wide uppercase">
                    Your STEM Learning Assistant
                  </p>

                  <p className="text-xs md:text-sm text-slate-400 max-w-lg leading-relaxed mb-8">
                    Ask questions, explore concepts, derive equations, and practice problems across Physics, Chemistry, Mathematics, and Biology.
                  </p>

                  {/* 4 Premium Subject Quick Action Tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full max-w-3xl">
                    <button
                      type="button"
                      onClick={() => { setSelectedSubject('Chemistry'); handleSendMessage("Explain SN1 vs SN2 reaction mechanism"); }}
                      className="group p-4 rounded-2xl bg-[#0d0305]/90 hover:bg-[#160609] border border-red-950/60 hover:border-red-500/40 text-left transition-all cursor-pointer hover:scale-[1.02] shadow-lg shadow-black/40"
                    >
                      <div className="p-2 rounded-xl bg-red-950/40 w-fit text-rose-400 mb-2.5 group-hover:text-white transition-colors">
                        <Atom className="w-4 h-4" />
                      </div>
                      <div className="font-serif font-bold text-sm text-white group-hover:text-rose-200">Chemistry</div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-snug">Molecular structure & reactions</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSelectedSubject('Physics'); handleSendMessage("Explain Newton's second law and derive F = ma"); }}
                      className="group p-4 rounded-2xl bg-[#0d0305]/90 hover:bg-[#160609] border border-red-950/60 hover:border-red-500/40 text-left transition-all cursor-pointer hover:scale-[1.02] shadow-lg shadow-black/40"
                    >
                      <div className="p-2 rounded-xl bg-red-950/40 w-fit text-rose-400 mb-2.5 group-hover:text-white transition-colors">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div className="font-serif font-bold text-sm text-white group-hover:text-rose-200">Physics</div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-snug">Mechanics, fields & waves</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSelectedSubject('Mathematics'); handleSendMessage("Derive the integration by parts formula"); }}
                      className="group p-4 rounded-2xl bg-[#0d0305]/90 hover:bg-[#160609] border border-red-950/60 hover:border-red-500/40 text-left transition-all cursor-pointer hover:scale-[1.02] shadow-lg shadow-black/40"
                    >
                      <div className="p-2 rounded-xl bg-red-950/40 w-fit text-rose-400 mb-2.5 group-hover:text-white transition-colors">
                        <Calculator className="w-4 h-4" />
                      </div>
                      <div className="font-serif font-bold text-sm text-white group-hover:text-rose-200">Mathematics</div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-snug">Equations, calculus & proofs</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSelectedSubject('Biology'); handleSendMessage("Explain DNA replication process step by step"); }}
                      className="group p-4 rounded-2xl bg-[#0d0305]/90 hover:bg-[#160609] border border-red-950/60 hover:border-red-500/40 text-left transition-all cursor-pointer hover:scale-[1.02] shadow-lg shadow-black/40"
                    >
                      <div className="p-2 rounded-xl bg-red-950/40 w-fit text-rose-400 mb-2.5 group-hover:text-white transition-colors">
                        <Dna className="w-4 h-4" />
                      </div>
                      <div className="font-serif font-bold text-sm text-white group-hover:text-rose-200">Biology</div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-snug">Cells, genetics & systems</div>
                    </button>
                  </div>

                </div>
              )}

              {/* CONVERSATION FLOW */}
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";

                if (isUser) {
                  return (
                    <div key={msg.id} className="flex justify-end pt-2 pb-4">
                      <div className="flex items-start gap-2.5 max-w-2xl">
                        <div className="px-4 py-3 rounded-2xl bg-[#1a080d] border border-red-900/40 text-slate-100 text-xs sm:text-sm leading-relaxed shadow-lg backdrop-blur-md">
                          {msg.content}
                        </div>
                        <div className="w-7 h-7 rounded-full bg-red-950/60 border border-red-800/40 flex items-center justify-center shrink-0 text-slate-300">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                }

                // AI Response Layout (Split Workspace View)
                return (
                  <div key={msg.id} className="grid grid-cols-1 lg:grid-cols-12 gap-5 py-2">
                    
                    {/* Left 8 Cols: Academic Solution Document */}
                    <div className="lg:col-span-8 p-5 sm:p-6 rounded-2xl bg-[#0a0305]/95 border border-red-950/70 shadow-2xl relative backdrop-blur-md">
                      
                      {/* Subdued Brand Tag */}
                      <div className="flex items-center gap-2 mb-3">
                        <PiechemAiLogo size="xs" />
                        <span className="text-[11px] font-bold text-red-500 tracking-wider uppercase">PIECHEM AI</span>
                      </div>

                      {/* Editorial Title */}
                      <h2 className="text-lg sm:text-xl font-serif font-bold text-white tracking-tight mb-3">
                        {msg.title || "Academic Explanation"}
                      </h2>

                      {/* Main Rendered Content */}
                      <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        <FormattedAiMessage content={msg.content} />
                      </div>

                      {/* Out of Scope Warning */}
                      {msg.isOutOfScope && (
                        <div className="mt-4 p-3 rounded-xl bg-red-950/30 border border-red-800/40 text-xs text-rose-300 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-red-400 shrink-0" />
                          <span>PIECHEM AI focuses strictly on Physics, Chemistry, Mathematics, and Biology.</span>
                        </div>
                      )}

                      {/* Bottom Action Pill Bar */}
                      <div className="mt-6 pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white transition cursor-pointer"
                          >
                            {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendMessage("Please regenerate this explanation with further clarity.")}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white transition cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Regenerate</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendMessage("Explain this concept in simpler, more intuitive terms.")}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white transition cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>Explain Simpler</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendMessage("Explain this with deeper mathematical derivations and advanced mechanisms.")}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white transition cursor-pointer"
                          >
                            <Compass className="w-3 h-3 text-cyan-400" />
                            <span>Explain Deeper</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleFeedback(msg.id, 'like')}
                            className={`p-1 rounded-lg hover:bg-white/10 transition cursor-pointer ${msg.feedback === 'like' ? 'text-emerald-400' : 'text-slate-500'}`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleFeedback(msg.id, 'dislike')}
                            className={`p-1 rounded-lg hover:bg-white/10 transition cursor-pointer ${msg.feedback === 'dislike' ? 'text-rose-400' : 'text-slate-500'}`}
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                          <span>{msg.timestamp}</span>
                        </div>
                      </div>

                    </div>

                    {/* Right 4 Cols: Telemetry Panels */}
                    <div className="lg:col-span-4 space-y-3">
                      
                      {/* Key Concepts */}
                      {msg.keyConcepts && msg.keyConcepts.length > 0 && (
                        <div className="p-4 rounded-xl bg-[#0b0305] border border-red-950/60 shadow-lg">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300 uppercase tracking-wider mb-2">
                            <BookOpen className="w-3.5 h-3.5 text-red-400" />
                            <span>Key Concepts</span>
                          </div>
                          <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc list-inside">
                            {msg.keyConcepts.map((kc, i) => (
                              <li key={i} className="leading-snug">{kc}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Key Takeaway */}
                      {msg.keyTakeaway && (
                        <div className="p-4 rounded-xl bg-[#0b0305] border border-red-950/60 shadow-lg">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                            <span>Key Takeaway</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {msg.keyTakeaway}
                          </p>
                        </div>
                      )}

                      {/* Related Topics */}
                      {msg.relatedTopics && msg.relatedTopics.length > 0 && (
                        <div className="p-4 rounded-xl bg-[#0b0305] border border-red-950/60 shadow-lg">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                            <span>Related Topics</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.relatedTopics.map((topic, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleSendMessage(`Explain ${topic} in detail`)}
                                className="px-2.5 py-1 rounded-full bg-[#160608] hover:bg-red-950/60 border border-red-900/40 text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
                              >
                                {topic}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                );
              })}

              {/* Generating / Thinking State */}
              {loading && (
                <div className="py-4 flex items-center gap-3 animate-in fade-in">
                  <div className="p-2 rounded-xl bg-[#140407] border border-red-900/40 shadow-sm">
                    <PiechemAiLogo size="xs" animated />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">PIECHEM AI</div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Analyzing equations and formulating solution...</span>
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* BOTTOM AI COMMAND CONSOLE */}
          <div className="shrink-0 px-4 md:px-8 pb-4 pt-1 bg-gradient-to-t from-[#050203] via-[#050203]/95 to-transparent z-20">
            <div className="max-w-4xl mx-auto w-full">
              
              {/* Main Rounded Input Console Container */}
              <div className="relative rounded-2xl bg-[#0c0305]/95 border border-red-900/50 shadow-2xl p-2.5 backdrop-blur-xl focus-within:border-red-500/70 focus-within:shadow-[0_0_25px_rgba(239,68,68,0.2)] transition-all">
                
                {/* Embedded Context Pills (Subject & Difficulty) */}
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  {/* Subject Selector Pill */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSubjectMenu(prev => !prev)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#160508] hover:bg-[#20070b] border border-red-900/40 text-[11px] font-semibold text-slate-300 transition cursor-pointer"
                    >
                      <Atom className="w-3 h-3 text-red-400" />
                      <span>{selectedSubject === 'stem' ? 'All STEM' : selectedSubject}</span>
                      <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
                    </button>

                    {showSubjectMenu && (
                      <div className="absolute left-0 bottom-full mb-1.5 w-36 rounded-xl bg-[#140507] border border-red-900/60 shadow-2xl p-1 z-50 animate-in fade-in slide-in-from-bottom-1">
                        {(['Chemistry', 'Physics', 'Mathematics', 'Biology'] as const).map(subj => (
                          <button
                            key={subj}
                            type="button"
                            onClick={() => {
                              setSelectedSubject(subj);
                              setShowSubjectMenu(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                              selectedSubject === subj ? 'bg-red-500/20 text-rose-300 font-bold' : 'text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            <span>{subj}</span>
                            {selectedSubject === subj && <Check className="w-3 h-3 text-red-400" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Level Pill */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 px-2 py-0.5 rounded-lg bg-black/30 border border-white/5">
                    <GraduationCap className="w-3 h-3 text-slate-400" />
                    <span className="capitalize">{level}</span>
                  </div>
                </div>

                {/* Seamless Textarea */}
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={1}
                  placeholder="Ask a question in Physics, Chemistry, Mathematics, or Biology..."
                  className="w-full resize-none bg-transparent px-3 py-1 text-xs sm:text-sm text-white placeholder-slate-500 border-0 outline-none focus:outline-none focus:ring-0 focus:border-0 leading-relaxed font-sans no-scrollbar"
                  style={{ minHeight: "38px", maxHeight: "120px", scrollbarWidth: "none", msOverflowStyle: "none", outline: "none", boxShadow: "none" }}
                />

                {/* Bottom Controls Row inside Capsule */}
                <div className="flex items-center justify-between pt-1 px-1 border-t border-white/[0.04] mt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <button 
                      type="button" 
                      onClick={handleNewChat} 
                      title="New Conversation" 
                      className="text-slate-500 hover:text-white transition cursor-pointer flex items-center"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                    <span className="capitalize">{selectedSubject} • {level}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                      title="Attach reference diagram/problem"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                    </button>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />

                    <button
                      type="button"
                      onClick={() => handleSendMessage()}
                      disabled={!input.trim() || loading}
                      className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 disabled:opacity-40 disabled:hover:from-red-600 disabled:hover:to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-950/60 transition active:scale-95 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Disclaimer + Security Tag */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 px-2 pt-2">
                <span>PIECHEM AI • Verify critical formulas for board and competitive exams.</span>
                <span className="flex items-center gap-1 text-slate-600">
                  <Lock className="w-2.5 h-2.5" /> Secure Learning Portal
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
