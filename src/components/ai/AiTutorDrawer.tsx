"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useMemo } from "react";
import FormattedAiMessage from "./FormattedAiMessage";
import PiechemAiLogo from "./PiechemAiLogo";
import PiechemLogo from "@/components/PiechemLogo";
import NotificationCenterDropdown from "@/components/NotificationCenterDropdown";
import { 
  X, Send, User, ArrowRight, LogOut,
  Atom, BookOpen, Dna, 
  GraduationCap, Copy, Check, 
  Lightbulb, RotateCcw,
  Sparkles, Compass, Calculator, ChevronDown, ChevronRight,
  MessageSquare, Lock, Paperclip, ThumbsUp, ThumbsDown,
  Search, MoreVertical, Edit2, Trash2, Clock, Share2, PinOff, Pin, History, Users,
  PanelLeftClose, PanelLeftOpen, Calendar, Brain, Target
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
  senderName?: string;
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

const maskEmail = (email: string) => {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 4 ? local.slice(0, 2) + '***' + local.slice(-1) : local.slice(0, 1) + '***';
  const domainParts = domain.split('.');
  const tld = domainParts.pop();
  const domainName = domainParts.join('.');
  const maskedDomainName = domainName.length > 2 ? domainName.slice(0, 1) + '***' + domainName.slice(-1) : '***';
  return `${maskedLocal}@${maskedDomainName}.${tld}`;
};

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
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [hasActiveCollab, setHasActiveCollab] = useState(false);
  const [activeCollaborators, setActiveCollaborators] = useState<any[]>([]);
  const [showCollabDetails, setShowCollabDetails] = useState(false);
  const [chatOwnerInfo, setChatOwnerInfo] = useState<{name?: string; email?: string} | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

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

  useEffect(() => {
    fetch('/api/student/dashboard')
      .then(r => r.json())
      .then(data => {
        if (data.student) {
          setStudentProfile(data.student);
          if (data.student.name) {
            setStudentName(data.student.name);
          }
        }
      })
      .catch(e => console.error(e));
  }, []);

  const isPro = useMemo(() => {
    if (!studentProfile) return false;
    const isComp = studentProfile.subscriptionStatus === "COMPLIMENTARY";
    const isPaid = studentProfile.subscriptionStatus === "PAID" && 
      (!studentProfile.subscriptionExpiresAt || new Date(studentProfile.subscriptionExpiresAt).getTime() > Date.now());
    return isComp || isPaid;
  }, [studentProfile]);

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
    setPendingCollabRequests([]);
    setActiveCollaborators([]);
    setHasActiveCollab(false);
    setShowCollabDetails(false);
    setChatOwnerInfo(null);
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
          
          setPendingCollabRequests(allMsgs.filter((m: any) => m.type === 'collab_request'));
          setActiveCollaborators(allMsgs.filter((m: any) => m.type === 'collaborator'));
          
          setIsChatOwner(!!data.isOwner);
          setHasActiveCollab(!!data.hasActiveCollab);
          setChatOwnerInfo(data.owner || null);

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
      timestamp: currentTimestamp,
      senderName: studentName
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
        const acceptedReq = pendingCollabRequests.find(req => req.collabUserId === collabUserId);
        setPendingCollabRequests(prev => prev.filter(req => req.collabUserId !== collabUserId));
        if (accept) {
          setHasActiveCollab(true);
          if (acceptedReq) {
            setActiveCollaborators(prev => [...prev, { ...acceptedReq, type: 'collaborator' }]);
          }
        }
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
          
          {/* Desktop Toggle Sidebar */}
          <button
            type="button"
            onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
            className="hidden lg:flex p-1.5 -ml-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
            title={isDesktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isDesktopSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2 min-w-0 pr-2 hidden sm:flex">
            <PiechemLogo href="/dashboard" size="sm" showText={true} subtitle="An initiative by Arghyadeep Roy." isGoldMember={isPro} />
          </div>
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0 pr-2 sm:hidden hover:opacity-90 transition-opacity">
            <PiechemAiLogo size="xs" />
            <span className="text-white font-semibold text-sm">PIECHEM AI</span>
          </Link>
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
          
          {/* Account & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-1 sm:ml-2 border-l border-white/10 pl-2 sm:pl-3 shrink-0">
            {studentProfile && (
              <NotificationCenterDropdown
                student={studentProfile}
                upgradeReq={null}
              />
            )}
            <Link
              href="/dashboard/account"
              className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-[#111a27] hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors shadow-sm shrink-0"
              title="My Profile & Settings"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center shrink-0 border border-slate-600">
                <img
                  src={studentProfile?.avatarUrl || "/avatars/atom.jpg"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e: any) => {
                    e.target.style.display = "none";
                  }}
                />
                <User className="w-3 h-3 text-white" />
              </div>
              <span className="hidden md:inline">My Account</span>
            </Link>
            <button
              onClick={async () => {
                try {
                  localStorage.removeItem("piechem_is_gold");
                  localStorage.removeItem("piechem_gold_expires_at");
                  localStorage.removeItem("piechem_is_complimentary");
                  window.dispatchEvent(new Event("piechem_gold_status_changed"));
                } catch {}
                document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
              }}
              title="Logout"
              className="p-1.5 sm:p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-colors group shrink-0 cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>
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
        <div className={`absolute lg:relative z-40 lg:z-auto ${isDesktopSidebarCollapsed ? 'lg:w-0 lg:opacity-0 lg:overflow-hidden lg:border-none' : 'lg:w-72'} w-72 h-full bg-black lg:bg-black border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="flex items-center justify-between p-4 pt-4 lg:hidden border-b border-white/10">
            <div className="flex items-center gap-2">
              <PiechemAiLogo size="xs" />
              <span className="text-white font-semibold text-sm">PIECHEM AI</span>
            </div>
            <button onClick={() => setIsMobileSidebarOpen(false)} className="p-1.5 rounded-full bg-white/5 text-slate-300 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-3 lg:p-4 pt-4 lg:pt-6 space-y-2 flex-shrink-0">
            {/* New Chat Button - Premium styling */}
            <button 
              onClick={handleNewChat}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600/10 to-cyan-600/10 hover:from-blue-600/20 hover:to-cyan-600/20 border border-blue-500/20 hover:border-blue-400/40 text-[14px] font-semibold text-blue-100 transition-all shadow-[0_0_15px_rgba(0,150,255,0.05)] cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <PiechemAiLogo size="xs" />
                <span>New chat</span>
              </div>
              <Edit2 className="w-4 h-4 text-blue-300 group-hover:text-blue-200 transition-colors" />
            </button>

            <div className="space-y-0.5 pt-2">
              <button onClick={() => alert('Study Planner coming soon!')} className="w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer group">
                <Calendar className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Study Planner</span>
              </button>
              <button onClick={() => alert('Memory Vault coming soon!')} className="w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer group">
                <Brain className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>Memory Vault</span>
              </button>
              <button onClick={() => alert('Exam Strategy coming soon!')} className="w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer group">
                <Target className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <span>Exam Strategy</span>
              </button>
              
              {isSearchActive ? (
                <div className="w-full flex items-center justify-start gap-3 px-3 py-2 rounded-xl bg-black/40 border border-white/5 shadow-inner mt-1 transition-all">
                  <Search className="w-4 h-4 text-amber-400/80 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search chats..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    onBlur={() => {
                      if (!historySearch.trim()) setIsSearchActive(false);
                    }}
                    className="bg-transparent border-none focus:ring-0 p-0 text-[13px] text-white w-full outline-none placeholder:text-slate-500"
                  />
                  <button onClick={() => { setIsSearchActive(false); setHistorySearch(""); }} className="p-1 hover:bg-white/20 rounded-full shrink-0">
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsSearchActive(true)}
                  className="w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer group mt-1"
                >
                  <Search className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Search chats</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            <div className="text-[13px] font-medium text-slate-400 px-4 pb-2 pt-4">Recent</div>
            {historyLoading ? (
              <div className="text-[13px] text-slate-500 px-4 py-2">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-[13px] text-slate-500 px-4 py-2">{historySearch ? "No matches found" : "No recent chats"}</div>
            ) : (
              filteredConversations.map(chat => (
                <div key={chat.id} className="relative group px-2" ref={openMenuChatId === chat.id ? menuContainerRef : null}>
                  <button
                    onClick={() => {
                      if (editingChatId !== chat.id) handleSelectChat(chat.id);
                    }}
                    className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition cursor-pointer pr-8 ${activeChatId === chat.id ? 'bg-[#282a2c] text-[#e3e3e3] font-medium' : 'text-[#c4c7c5] hover:bg-[#282a2c] hover:text-[#e3e3e3]'}`}
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
                        className="flex-1 bg-transparent border-none focus:ring-0 p-0 outline-none text-[#e3e3e3]"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate flex-1">{chat.title}</span>
                    )}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setOpenMenuChatId(openMenuChatId === chat.id ? null : chat.id); }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#c4c7c5] transition cursor-pointer ${openMenuChatId === chat.id ? 'bg-[#404346] opacity-100' : 'hover:bg-white/10 opacity-0 group-hover:opacity-100'}`}
                  >
                    <MoreVertical className="w-4 h-4" />
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
                  <div className="mb-10 scale-[1.1] hidden md:flex flex-col items-center">
                    <div className="flex items-center gap-3.5 sm:gap-4 select-none">
                      <PiechemLogo size="xl" showText={false} />
                      <div className="font-black tracking-wider font-sans uppercase flex items-center text-3xl sm:text-5xl">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 drop-shadow-[0_2px_10px_rgba(0,242,254,0.3)]">
                          PIE
                        </span>
                        <div className="relative ml-2 sm:ml-3 inline-flex items-center justify-center">
                          <div className="absolute inset-0 bg-blue-500/60 blur-md rounded-full"></div>
                          <span className="relative z-10 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-[#181c25] text-slate-100 text-[14px] sm:text-[20px] font-bold tracking-wide uppercase border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.5)] leading-none flex items-center justify-center">
                            AI
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center mt-2 select-none leading-none">
                      <span className="text-[10px] sm:text-[12px] tracking-[0.06em] sm:tracking-[0.08em] font-sans font-medium text-slate-400">
                        An initiative by <span className="text-slate-200 font-semibold">Arghyadeep Roy.</span>
                      </span>
                    </div>
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
                  const senderName = msg.senderName || studentName || 'You';
                  return (
                    <div key={msg.id} className="flex justify-end pt-2 pb-4">
                      <div className="flex flex-col items-end gap-1 max-w-2xl">
                        <span className="text-[11px] font-medium text-slate-400 px-1 mr-9">{senderName}</span>
                        <div className="flex items-start gap-2.5">
                          <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-zinc-900 border border-zinc-800 text-slate-100 text-xs sm:text-sm leading-relaxed shadow-lg backdrop-blur-md">
                            {msg.content}
                          </div>
                          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-slate-300 mt-1">
                            <User className="w-3.5 h-3.5" />
                          </div>
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
          )}

          {/* Active Collab Banner (Owner and Collaborators) */}
          {hasActiveCollab && pendingCollabRequests.length === 0 && (
            <div className="px-3 sm:px-4 md:px-8 py-2 w-full max-w-4xl mx-auto flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-500/10 border border-amber-500/30 px-5 py-3 rounded-2xl shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95">
                <div className="text-sm text-amber-200/90 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>{activeCollaborators.length + 1} {(activeCollaborators.length + 1) === 1 ? 'person is' : 'people are'} collaborating on this chat.</span>
                </div>
                <div className="flex gap-2 self-end sm:flex-auto sm:justify-end">
                  <button
                    onClick={() => setShowCollabDetails(!showCollabDetails)}
                    className="px-4 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 hover:text-amber-100 text-xs font-medium transition cursor-pointer flex items-center justify-center"
                  >
                    View collaborators
                  </button>
                  {isChatOwner && (
                    <>
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
                    </>
                  )}
                </div>
              </div>

              {showCollabDetails && (activeCollaborators.length > 0 || chatOwnerInfo) && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mt-1 animate-in slide-in-from-top-2 text-sm text-amber-200/80">
                  <h4 className="font-semibold text-amber-400 mb-2 border-b border-amber-500/20 pb-2">Active Collaborators</h4>
                  <ul className="space-y-2">
                    {chatOwnerInfo && (
                      <li className="flex justify-between items-center bg-black/20 p-2 rounded-lg border border-white/5">
                        <div className="flex flex-col">
                          <span className="font-medium text-amber-200">{chatOwnerInfo.name || "Anonymous User"}</span>
                          {chatOwnerInfo.email && <span className="text-xs text-amber-200/50">{maskEmail(chatOwnerInfo.email)}</span>}
                        </div>
                        <span className="text-xs bg-amber-500/20 px-2 py-1 rounded-md text-amber-400 font-semibold border border-amber-500/30">
                          Owner
                        </span>
                      </li>
                    )}
                    {activeCollaborators.map((c, i) => (
                      <li key={i} className="flex justify-between items-center bg-black/20 p-2 rounded-lg border border-white/5">
                        <div className="flex flex-col">
                          <span className="font-medium text-amber-200">
                            {c.name ? (c.name.includes('@') ? maskEmail(c.name) : c.name) : "Anonymous User"}
                          </span>
                          {c.email && <span className="text-xs text-amber-200/50">{maskEmail(c.email)}</span>}
                        </div>
                        <span className="text-xs bg-amber-500/20 px-2 py-1 rounded-md text-amber-400">
                          {c.timestamp ? new Date(c.timestamp).toLocaleDateString() : 'Active'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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


