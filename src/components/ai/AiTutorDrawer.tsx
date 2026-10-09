"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useMemo } from "react";
import FormattedAiMessage from "./FormattedAiMessage";
import PiechemAiLogo from "./PiechemAiLogo";
import PiechemLogo from "@/components/PiechemLogo";
import { 
  X, Send, User, ArrowRight, 
  Atom, BookOpen, Dna, 
  GraduationCap, Copy, Check, 
  Lightbulb, RotateCcw,
  Sparkles, Compass, Calculator, ChevronDown, ChevronRight,
  MessageSquare, Lock, Paperclip, ThumbsUp, ThumbsDown,
  Search, MoreVertical, Edit2, Trash2, Clock, Share2, PinOff, Pin, History, Users
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


export type PiechemAiModel = 'PIECHEM AI' | 'PIECHEM AI PRO' | 'PIECHEM AI MAX';

const PIECHEM_AI_MODELS: { id: PiechemAiModel; name: string; badge?: string }[] = [
  { id: 'PIECHEM AI', name: 'PIECHEM AI' },
  { id: 'PIECHEM AI PRO', name: 'PIECHEM AI PRO', badge: 'PRO' },
  { id: 'PIECHEM AI MAX', name: 'PIECHEM AI MAX', badge: 'MAX' },
];

interface AcademicContext {
  subject: string;
  className?: string;
  semester?: string;
  chapter?: string;
  topic?: string;
}

interface AiTutorDrawerProps {
  isOpen: boolean;
  initialMode?: 'tutor' | 'practice' | 'doubt' | 'revision' | 'study_plan' | 'exam';
  initialContext?: AcademicContext;
  initialStudentName?: string;
}


export default function AiTutorDrawer({
  isOpen,
  initialMode = "tutor",
  initialContext,
  initialStudentName = "Scholar"
}: AiTutorDrawerProps) {
  // Mode & Language
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [selectedSubject, setSelectedSubject] = useState<'stem' | 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology'>('Chemistry');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState<PiechemAiModel>('PIECHEM AI');
  const [showModelMenu, setShowModelMenu] = useState(false);
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
  const [pendingCollabRequests, setPendingCollabRequests] = useState<any[]>([]);
  const [isChatOwner, setIsChatOwner] = useState(false);
  const [hasActiveCollab, setHasActiveCollab] = useState(false);

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
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.pathname);
    }
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
    
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', "?chatId=" + convId);
    }

    try {
      const res = await fetch(`/api/ai/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.conversation) {
          const conv = data.conversation;
          const allMsgs = Array.isArray(conv.messages) ? conv.messages : [];
          setMessages(allMsgs.filter((m: any) => m.type !== 'collab_request' && m.type !== 'collaborator'));
          
          // Only owner should see collab requests, but we don't return studentId from API.
          // Wait, we can safely set pending requests and only display them if they exist
          setPendingCollabRequests(allMsgs.filter((m: any) => m.type === 'collab_request'));
          
          setIsChatOwner(!!data.isOwner);
          setHasActiveCollab(!!data.hasActiveCollab);

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

  // Check URL for chatId on initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const chatId = urlParams.get('chatId');
      if (chatId) {
        handleSelectChat(chatId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Toggle Pin
  const handleTogglePin = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuChatId(null);
    
    setConversations(prev => {
      const chat = prev.find(c => c.id === convId);
      if (!chat) return prev;
      
      const isCurrentlyPinned = !!chat.isPinned;
      
      if (!isCurrentlyPinned) {
        // Enforce max 10 pinned chats
        const pinnedCount = prev.filter(c => c.isPinned).length;
        if (pinnedCount >= 10) {
          alert("Maximum 10 chats can be pinned.");
          return prev;
        }
      }
      
      const updatedList = prev.map(c => c.id === convId ? { ...c, isPinned: !isCurrentlyPinned } : c);
      
      // Sort pinned chats to top, keep unpinned sorted by updatedAt
      return updatedList.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    });
    
    // We optionally persist this to DB here if backend supports it.
    try {
      await fetch(`/api/ai/conversations/${convId}/pin`, {
        method: 'POST',
      });
    } catch (err) {
      console.log("Pin state not persisted to DB (maybe backend not ready)");
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
      
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', "?chatId=" + currentChatId);
      }
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
          model: selectedModel,
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
            content: data.answer || data.content || data.response || "No response generated.",
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

  const handleRespondCollab = async (collabUserId: string, accept: boolean) => {
    try {
      const res = await fetch("/api/ai/conversations/collab/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeChatId, collabUserId, accept })
      });
      const data = await res.json();
      if (data.success) {
        setPendingCollabRequests(prev => prev.filter(req => req.collabUserId !== collabUserId));
        if (accept) setHasActiveCollab(true);
      } else {
        alert("Failed to respond: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  };

  const handleRevertCollab = async () => {
    if (!activeChatId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/conversations/${activeChatId}/revert`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        alert("Collaboration revoked. Third-party messages have been removed.");
        handleSelectChat(activeChatId); // Reload chat
      } else {
        alert("Failed to revert: " + data.error);
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-transparent text-slate-100 font-sans select-text overflow-hidden animate-in fade-in duration-200 ai-workspace-root"
    >
      {/* BACKGROUND SUBTLE SCIENTIFIC ORBITAL GEOMETRY */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025] overflow-hidden">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50%" cy="40%" r="380" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="4 8" />
          <circle cx="50%" cy="40%" r="620" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="6 12" />
          <ellipse cx="50%" cy="40%" rx="750" ry="280" fill="none" stroke="#fff" strokeWidth="1" transform="rotate(-25 500 400)" />
          <ellipse cx="50%" cy="40%" rx="750" ry="280" fill="none" stroke="#fff" strokeWidth="1" transform="rotate(25 500 400)" />
        </svg>
      </div>

      {/* 1. TOP HEADER */}
      <header className="h-14 shrink-0 px-3 sm:px-4 md:px-6 flex items-center justify-between border-b border-white/10 bg-transparent backdrop-blur-md z-30 gap-2">
        
        {/* Left: Brand + Status Pill + Usage Pill */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Hamburger Menu */}
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>

          <div className="flex items-center gap-2 min-w-0 pr-2 hidden sm:flex">
            <PiechemLogo size="sm" showText={true} subtitle="An initiative by Arghyadeep Roy." />
          </div>
          <div className="flex items-center gap-2 min-w-0 pr-2 sm:hidden">
            <PiechemAiLogo size="xs" />
            <span className="text-white font-semibold text-sm">PIECHEM AI</span>
          </div>
        </div>

        {/* Right: Controls (Language, Level, Exit) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Language Toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-zinc-950 border border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleToggleLang('en')}
              className={`px-2 py-1 rounded-lg transition cursor-pointer text-[11px] sm:text-xs ${
                language === 'en' ? 'bg-white text-black font-bold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleToggleLang('bn')}
              className={`px-2 py-1 rounded-lg transition cursor-pointer text-[11px] sm:text-xs ${
                language === 'bn' ? 'bg-white text-black font-bold shadow-sm' : 'text-slate-400 hover:text-white'
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
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-white/10 text-xs font-semibold text-slate-300 transition cursor-pointer"
              title={`Difficulty: ${level}`}
            >
              <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="capitalize hidden md:inline">{level}</span>
              <ChevronDown className="h-3 w-3 text-slate-500 shrink-0" />
            </button>

            {showLevelMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl p-1 z-50 animate-in fade-in slide-in-from-top-1">
                {(['beginner', 'intermediate', 'advanced'] as const).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setLevel(lvl);
                      setShowLevelMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer capitalize flex items-center justify-between ${
                      level === lvl ? 'bg-white/10 text-white font-bold' : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span>{lvl}</span>
                    {level === lvl && <Check className="h-3 w-3 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
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

                {/* SIDEBAR */}
        <div className={`absolute lg:relative z-40 lg:z-auto w-72 h-full bg-[#1e1f20] lg:bg-[#1e1f20] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="flex items-center justify-between p-4 pt-4 lg:hidden border-b border-white/10">
            <div className="flex items-center gap-2">
              <PiechemAiLogo size="xs" />
              <span className="text-white font-semibold text-sm">PIECHEM AI</span>
            </div>
            <button onClick={() => setIsMobileSidebarOpen(false)} className="p-1.5 rounded-full bg-white/5 text-slate-300 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-3 lg:p-4 pt-4 lg:pt-6 space-y-1">
            <button 
              onClick={handleNewChat}
              className="w-full flex items-center justify-start gap-4 px-3 py-2.5 rounded-full text-[14px] font-medium text-slate-200 hover:bg-white/10 transition cursor-pointer"
            >
              <Edit2 className="w-5 h-5 text-slate-300" />
              <span>New chat</span>
            </button>
            <button 
              className="w-full flex items-center justify-start gap-4 px-3 py-2.5 rounded-full text-[14px] font-medium text-slate-200 hover:bg-white/10 transition cursor-pointer"
            >
              <Search className="w-5 h-5 text-slate-300" />
              <span>Search chats</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            <div className="text-[13px] font-medium text-slate-400 px-4 pb-2 pt-4">Recent</div>
            {historyLoading ? (
              <div className="text-[13px] text-slate-500 px-4 py-2">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="text-[13px] text-slate-500 px-4 py-2">No recent chats</div>
            ) : (
              conversations.map(chat => (
                <div key={chat.id} className="relative group px-2" ref={openMenuChatId === chat.id ? menuContainerRef : null}>
                  <button
                    onClick={() => {
                      if (editingChatId !== chat.id) handleSelectChat(chat.id);
                    }}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-full text-[13px] sm:text-[14px] transition cursor-pointer pr-10 ${activeChatId === chat.id ? 'bg-[#282a2c] text-[#e3e3e3] font-medium' : 'text-[#c4c7c5] hover:bg-[#282a2c] hover:text-[#e3e3e3]'}`}
                  >
                    {editingChatId === chat.id ? (
                      <input
                        type="text"
                        autoFocus
                        value={editTitleInput}
                        onChange={(e) => setEditTitleInput(e.target.value)}
                        onBlur={() => handleSaveRename(chat.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(chat.id);
                          if (e.key === 'Escape') setEditingChatId(null);
                        }}
                        className="flex-1 bg-transparent border-none outline-none text-[#e3e3e3]"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate flex-1">{chat.title}</span>
                    )}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setOpenMenuChatId(openMenuChatId === chat.id ? null : chat.id); }}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[#c4c7c5] transition cursor-pointer ${openMenuChatId === chat.id ? 'bg-[#404346] opacity-100' : 'hover:bg-white/10 opacity-0 group-hover:opacity-100'}`}
                  >
                    <MoreVertical className="w-[18px] h-[18px]" />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuChatId === chat.id && (
                    <div className="absolute left-6 top-10 mt-1 w-[200px] rounded-[16px] bg-[#282a2c] shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.origin + "/share/" + chat.id); alert("Link copied to clipboard!"); setOpenMenuChatId(null); }}
                        className="w-full text-left flex items-center gap-3 px-4 py-2 text-[14px] text-[#e3e3e3] hover:bg-white/5 transition cursor-pointer"
                      >
                        <Share2 className="w-[18px] h-[18px] text-[#c4c7c5]" />
                        <span>Share conversation</span>
                      </button>
                      <button 
                        onClick={(e) => handleTogglePin(chat.id, e)}
                        className="w-full text-left flex items-center gap-3 px-4 py-2 text-[14px] text-[#e3e3e3] hover:bg-white/5 transition cursor-pointer"
                      >
                        {chat.isPinned ? (
                          <>
                            <PinOff className="w-[18px] h-[18px] text-[#c4c7c5]" />
                            <span>Unpin</span>
                          </>
                        ) : (
                          <>
                            <Pin className="w-[18px] h-[18px] text-[#c4c7c5]" />
                            <span>Pin to top</span>
                          </>
                        )}
                      </button>
                      <button 
                        onClick={(e) => handleStartRename(chat, e)}
                        className="w-full text-left flex items-center gap-3 px-4 py-2 text-[14px] text-[#e3e3e3] hover:bg-white/5 transition cursor-pointer"
                      >
                        <Edit2 className="w-[18px] h-[18px] text-[#c4c7c5]" />
                        <span>Rename</span>
                      </button>
                      <button 
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        className="w-full text-left flex items-center gap-3 px-4 py-2 text-[14px] text-[#e3e3e3] hover:bg-white/5 transition cursor-pointer"
                      >
                        <Trash2 className="w-[18px] h-[18px] text-[#c4c7c5]" />
                        <span>Delete</span>
                      </button>
                      
                      {/* Back to where I was */}
                      {chat.id === activeChatId && isChatOwner && hasActiveCollab && (
                        <div className="relative group border-t border-white/5 mt-1 pt-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRevertCollab(); setOpenMenuChatId(null); }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-[14px] text-amber-400 hover:bg-amber-400/10 transition cursor-pointer"
                          >
                            <History className="w-[18px] h-[18px] text-amber-400" />
                            <span>Back to where I was</span>
                          </button>
                          <Link 
                            href="/revert-info"
                            target="_blank"
                            className="absolute right-3 top-1/2 -translate-y-1/2 mt-1.5 text-[10px] px-2 py-0.5 rounded-full border border-amber-400/20 text-amber-400/70 hover:text-amber-400 hover:bg-amber-400/10 transition z-10 opacity-0 group-hover:opacity-100 uppercase tracking-wider font-bold"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Know more
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* CENTER MAIN WORKSPACE */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
          
          {/* Messages & Workspace Container */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-2 sm:px-4 md:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6"
          >
            <div className="max-w-5xl mx-auto w-full">

                            {/* WELCOME STATE: When there are no messages */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-300 w-full px-4 sm:px-8">
                  {/* Desktop Logo */}
                  <div className="mb-10 scale-[1.1] hidden md:block">
                    <PiechemLogo size="xl" showText={true} subtitle="An initiative by Arghyadeep Roy." />
                  </div>
                  {/* Mobile Logo */}
                  <div className="mb-6 md:hidden">
                    <PiechemAiLogo size="lg" animated />
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400 mb-8 tracking-tight text-center">
                    Hi {studentName.split(' ')[0] || 'Scholar'}, what&apos;s the plan?
                  </h1>
                  

                </div>
              )}
              {/* CONVERSATION FLOW */}
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";

                if (isUser) {
                  return (
                    <div key={msg.id} className="flex justify-end pt-2 pb-4">
                      <div className="flex items-start gap-2.5 max-w-2xl">
                        <div className="px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-slate-100 text-xs sm:text-sm leading-relaxed shadow-lg backdrop-blur-md">
                          {msg.content}
                        </div>
                        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-slate-300">
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
                    <div className="lg:col-span-8 p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl relative backdrop-blur-md">
                      
                      {/* Subdued Brand Tag */}
                      <div className="flex items-center gap-2 mb-3">
                        <PiechemAiLogo size="xs" />
                        <span className="text-[11px] font-bold text-white tracking-wider uppercase">PIECHEM AI</span>
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
                        <div className="mt-4 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-slate-300 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
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
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
                          <span>{msg.timestamp}</span>
                        </div>
                      </div>

                    </div>

                    {/* Right 4 Cols: Telemetry Panels */}
                    <div className="col-span-full lg:col-span-4 space-y-3">
                      
                      {/* Key Concepts */}
                      {msg.keyConcepts && msg.keyConcepts.length > 0 && (
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 shadow-lg">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">
                            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
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
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 shadow-lg">
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
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 shadow-lg">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Related Topics</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.relatedTopics.map((topic, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleSendMessage(`Explain ${topic} in detail`)}
                                className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
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
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 shadow-sm">
                    <PiechemAiLogo size="xs" animated />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">PIECHEM AI</div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Analyzing equations and formulating solution...</span>
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* BOTTOM AI COMMAND CONSOLE */}
          <div className="block">

          {/* Collab Requests (If Any) */}
          {pendingCollabRequests.length > 0 && (
            <div className="px-3 sm:px-4 md:px-8 py-2 w-full max-w-4xl mx-auto flex flex-col gap-2">
              {pendingCollabRequests.map(req => (
                <div key={req.collabUserId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-950/80 border border-[#0b57d0]/30 px-5 py-3 rounded-2xl shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95">
                  <div className="text-sm text-[#e3e3e3]">
                    <span className="font-semibold text-white">{req.name}</span> requested to collab on this chat
                  </div>
                  <div className="flex gap-2 self-end sm:self-auto">
                    <Link
                      href="/collab-info"
                      target="_blank"
                      className="px-4 py-1.5 rounded-full bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer flex items-center justify-center"
                    >
                      Know more
                    </Link>
                    <button
                      onClick={() => handleRespondCollab(req.collabUserId, false)}
                      className="px-4 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-medium transition cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleRespondCollab(req.collabUserId, true)}
                      className="px-4 py-1.5 rounded-full bg-[#0b57d0] hover:bg-[#0b57d0]/90 text-white text-xs font-medium transition cursor-pointer"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </div>
          )}

          {/* Active Collab Banner (Owner only) */}
          {isChatOwner && hasActiveCollab && pendingCollabRequests.length === 0 && (
            <div className="px-3 sm:px-4 md:px-8 py-2 w-full max-w-4xl mx-auto flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-500/10 border border-amber-500/30 px-5 py-3 rounded-2xl shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95">
                <div className="text-sm text-amber-200/90 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>You are collaborating on this chat.</span>
                </div>
                <div className="flex gap-2 self-end sm:flex-auto sm:justify-end">
                  <Link
                    href="/revert-info"
                    target="_blank"
                    className="px-4 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 hover:text-amber-100 text-xs font-medium transition cursor-pointer flex items-center justify-center"
                  >
                    Know more
                  </Link>
                  <button
                    onClick={handleRevertCollab}
                    className="px-4 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <History className="w-3.5 h-3.5" />
                    Back to where I was
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="shrink-0 px-3 sm:px-4 md:px-8 pb-3 pt-1 bg-gradient-to-t from-black via-black/95 to-transparent z-20 ai-input-area">
            <div className="max-w-4xl mx-auto w-full">
              
              {/* Main Rounded Input Console Container */}
              <div className="relative rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-2 backdrop-blur-xl focus-within:border-zinc-600 focus-within:shadow-[0_0_25px_rgba(255,255,255,0.05)] transition-all">
                
                {/* Embedded Context Pills (Subject & Difficulty) */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 px-1">
                  {/* Model Selector Pill (PIECHEM AI, PIECHEM AI PRO, PIECHEM AI MAX) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowModelMenu(prev => !prev)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-slate-200 transition cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>{selectedModel}</span>
                      <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
                    </button>

                    {showModelMenu && (
                      <div className="absolute left-0 bottom-full mb-1.5 w-44 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl p-1 z-50 animate-in fade-in slide-in-from-bottom-1">
                        {PIECHEM_AI_MODELS.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setSelectedModel(m.id);
                              setShowModelMenu(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                              selectedModel === m.id ? 'bg-white/10 text-white font-bold' : 'text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{m.name}</span>
                              {m.badge && (
                                <span className="text-[9px] px-1 py-0.2 rounded font-bold uppercase bg-white/10 text-slate-300 border border-white/10">
                                  {m.badge}
                                </span>
                              )}
                            </div>
                            {selectedModel === m.id && <Check className="w-3 h-3 text-cyan-400" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Level Pill */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 px-2 py-0.5 rounded-lg bg-black/40 border border-white/10">
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
                  placeholder="Ask Anything."
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
                    <span>{selectedModel} • <span className="capitalize">{level}</span></span>
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
                      className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-white flex items-center justify-center text-black shadow-lg shadow-white/10 transition active:scale-95 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Disclaimer + Security Tag */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] text-slate-500 px-2 pt-2 pb-safe text-center sm:text-left">
                <span className="truncate max-w-full">PIECHEM AI • Verify critical formulas for board and competitive exams.</span>
                <span className="flex items-center gap-1 text-slate-600 shrink-0">
                  <Lock className="w-2.5 h-2.5" /> Secure Learning Portal
                </span>
              </div>

            </div>
          </div>
          </div>

        </div>

      </div>

    </div>
  );
}


