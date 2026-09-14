"use client";

import { useState, useRef, useEffect } from "react";
import FormattedAiMessage from "./FormattedAiMessage";
import PiechemAiLogo from "./PiechemAiLogo";
import { 
  X, Send, User, ArrowRight, 
  Atom, CheckCircle2, BookOpen, 
  Languages, GraduationCap, Copy, Check, 
  Lightbulb, Globe, Activity, Volume2, VolumeX,
  ThumbsUp, ThumbsDown, RotateCcw,
  Sparkles, Compass, Calculator, ChevronDown
} from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  groundedInPiechem?: boolean;
  sourceCategory?: 'PIECHEM_MATERIAL' | 'STUDENT_DATA' | 'GENERAL_ACADEMIC' | 'WEB_RESEARCH' | 'PIECHEM_AND_WEB';
  searchGroundingUsed?: boolean;
  webSources?: Array<{ title: string; url: string; snippet?: string }>;
  citations?: string[];
  suggestedFollowUps?: string[];
  activeTopic?: string;
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

const PROMPT_STARTERS = [
  {
    icon: Atom,
    color: "from-red-600/20 to-rose-950/20 border-red-500/30 text-rose-300",
    subject: "Chemistry",
    title: "Chirality & Stereochemistry",
    prompt: "Explain chirality, asymmetric carbon, and enantiomers with 3D intuition and exam examples."
  },
  {
    icon: Compass,
    color: "from-rose-600/20 to-purple-950/20 border-rose-500/30 text-rose-300",
    subject: "Physics",
    title: "Electromagnetic Induction",
    prompt: "Explain Faraday's Law & Lenz's Law with step-by-step physical intuition."
  },
  {
    icon: Calculator,
    color: "from-emerald-600/20 to-teal-950/20 border-emerald-500/30 text-emerald-300",
    subject: "Mathematics",
    title: "Integration by Parts",
    prompt: "Derive the Integration by Parts formula with a clear step-by-step worked example."
  },
  {
    icon: CheckCircle2,
    color: "from-amber-600/20 to-orange-950/20 border-amber-500/30 text-amber-300",
    subject: "Exam Practice",
    title: "Adaptive 3-MCQ Drill",
    prompt: "Quiz me on my syllabus with 3 challenging practice MCQs with options A-D."
  }
];

export default function AiTutorDrawer({
  isOpen,
  onClose,
  initialMode = 'tutor',
  initialContext,
  initialStudentName
}: AiTutorDrawerProps) {
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [language, setLanguage] = useState<'en' | 'bn'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('piechem_ai_lang') as 'en' | 'bn') || 'en';
    }
    return 'en';
  });

  // Synchronize language across all PIECHEM AI tools
  useEffect(() => {
    const handleGlobalLang = (e: any) => {
      if (e?.detail && (e.detail === 'en' || e.detail === 'bn')) {
        setLanguage(e.detail);
      }
    };
    window.addEventListener('piechem-language-changed', handleGlobalLang);
    return () => window.removeEventListener('piechem-language-changed', handleGlobalLang);
  }, []);

  const handleToggleLang = (newLang: 'en' | 'bn') => {
    setLanguage(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('piechem_ai_lang', newLang);
      window.dispatchEvent(new CustomEvent('piechem-language-changed', { detail: newLang }));
    }
  };

  const [showLevelMenu, setShowLevelMenu] = useState(false);
  
  const [context, setContext] = useState<AcademicContext>(initialContext || {
    subject: "Chemistry",
    className: "Class 11",
    chapter: "Periodic Table",
    topic: "Ionisation Energy"
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [quota, setQuota] = useState<{ remaining: number; totalLimit?: number; dailyLimit?: number; isUnlimited: boolean; queriesUsed?: number } | null>(null);
  const [studentName, setStudentName] = useState<string>(() => {
    if (initialStudentName && initialStudentName.trim()) return initialStudentName.trim();
    if (typeof window !== 'undefined') {
      return localStorage.getItem('piechem_student_name') || 'Scholar';
    }
    return 'Scholar';
  });

  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([
    "Explain chirality & optical isomers with 3D intuition",
    "Why does ionisation energy increase across a period?",
    "Derive Snell's law and refractive index",
    "Quiz me on my syllabus with 3 MCQs"
  ]);

  const [messages, setMessages] = useState<Message[]>([]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Synchronize initial context & name
  useEffect(() => {
    if (initialContext) {
      setContext(initialContext);
    }
    if (initialStudentName && initialStudentName.trim()) {
      setStudentName(initialStudentName.trim());
    }
  }, [initialContext, initialStudentName]);

  // Lock body scroll when full-screen AI modal is active
  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 200);
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen]);

  // Fetch daily AI quota and student profile on drawer open
  useEffect(() => {
    if (isOpen) {
      fetch("/api/ai/quota")
        .then(res => res.json())
        .then(data => {
          if (data?.quota) setQuota(data.quota);
          if (data?.studentName && data.studentName !== 'Scholar') {
            setStudentName(data.studentName);
            if (typeof window !== 'undefined') {
              localStorage.setItem('piechem_student_name', data.studentName);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Scroll to bottom only when new messages are added or loading
  useEffect(() => {
    if (isOpen && messages.length > 0 && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, loading, isOpen]);

  // Clean up speech synthesis when drawer unmounts or closes
  useEffect(() => {
    if (!isOpen && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }
  }, [isOpen]);

  // Listen for Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSendMessage = async (textToSend?: string) => {
    const questionText = (textToSend || input).trim();
    if (!questionText || loading) return;

    // Stop active speech if any
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .slice(-8)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: questionText,
          message: questionText,
          mode: 'TUTOR',
          level,
          language,
          context: {
            ...context
          },
          history
        })
      });

      const data = await res.json();
      if (data.quota) {
        setQuota(data.quota);
      }
      if (!res.ok || data.error) {
        if (data.requiresSubscription) {
          setQuota(prev => ({
            remaining: 0,
            totalLimit: 5,
            dailyLimit: 5,
            isUnlimited: false,
            queriesUsed: 5,
            ...prev
          }));
        }
        throw new Error(data.error || "Failed to reach PIECHEM AI tutor");
      }

      if (data.suggestedFollowUps && data.suggestedFollowUps.length > 0) {
        const cleanFollowUps = data.suggestedFollowUps.filter(
          (s: string) => !/good\s*bye|exceptions in/i.test(s)
        );
        if (cleanFollowUps.length > 0) {
          setDynamicSuggestions(cleanFollowUps);
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || data.answer,
        groundedInPiechem: data.groundedInPiechem,
        sourceCategory: data.sourceCategory || (data.groundedInPiechem ? 'PIECHEM_MATERIAL' : 'GENERAL_ACADEMIC'),
        citations: data.sources || [],
        webSources: data.webSources || [],
        searchGroundingUsed: data.searchGroundingUsed,
        suggestedFollowUps: data.suggestedFollowUps || [],
        activeTopic: data.activeTopic,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const isQuotaExceeded = err.message?.includes("limit reached") || err.message?.includes("Daily free AI");
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isQuotaExceeded
          ? `✨ **Daily Free AI Quota Reached (5/5)**\n\nYou've used your 5 free AI queries for today. Upgrade to **[PIECHEM Gold (₹99/month)](/dashboard/account)** for unlimited AI tutoring, adaptive tests, and step-by-step guidance — or return tomorrow for 5 new free questions!`
          : `**Notice**: ${err.message || "An unexpected error occurred. Please try asking again."}`,
        sourceCategory: 'GENERAL_ACADEMIC',
        groundedInPiechem: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanSpeech = text
      .replace(/\$\$[\s\S]*?\$\$/g, " [mathematical formula] ")
      .replace(/\$[^$]+\$/g, " formula ")
      .replace(/[*#_`]/g, "")
      .replace(/\n+/g, ". ");

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = language === 'bn' ? 'bn-IN' : 'en-US';

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleFeedback = (id: string, type: 'like' | 'dislike') => {
    setMessages(prev =>
      prev.map(m => (m.id === id ? { ...m, feedback: m.feedback === type ? null : type } : m))
    );
  };

  const handleClearChat = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }
    setMessages([]);
    setDynamicSuggestions([
      "Explain chirality & optical isomers with 3D intuition",
      "Why does ionisation energy increase across a period?",
      "Derive Snell's law and refractive index",
      "Quiz me on my syllabus with 3 MCQs"
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 w-full h-full flex flex-col bg-[#070203] text-slate-100 overflow-hidden select-text animate-in fade-in duration-200">
      {/* Ambient Reddish-Black Nebula Glows */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-[36rem] h-[36rem] rounded-full bg-gradient-to-br from-red-600/15 via-rose-950/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-gradient-to-tr from-red-950/20 via-black to-transparent blur-3xl" />

      {/* Top Header - Fixed & Pinned at the Very Top */}
      <header className="relative z-30 shrink-0 min-h-16 border-b border-red-950/80 px-3 py-2 sm:px-8 sm:py-0 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 bg-[#0b0304]/95 backdrop-blur-xl">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3.5">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-950/60 border border-red-500/40 shadow-inner sm:h-10 sm:w-10">
            <PiechemAiLogo size="sm" />
          </div>

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <h2 className="truncate text-sm sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-1.5">
                PIECHEM
                <span className="bg-gradient-to-r from-red-500 via-rose-400 to-red-400 bg-clip-text text-transparent font-black">
                  AI
                </span>
              </h2>
              <span className="hidden sm:inline-flex shrink-0 rounded-full bg-red-950/80 border border-red-500/40 px-2.5 py-0.5 text-[10px] text-red-300 font-bold uppercase shadow-sm">
                AI Tutor
              </span>
              {quota && (
                quota.isUnlimited ? (
                  <span className="hidden sm:inline-flex items-center gap-1 shrink-0 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] text-amber-300 font-bold uppercase shadow-sm">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Gold Unlimited
                  </span>
                ) : (
                  <span className={`hidden sm:inline-flex items-center gap-1 shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase shadow-sm border ${
                    quota.remaining === 0
                      ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                      : 'bg-red-950/60 border-red-500/30 text-red-200'
                  }`}>
                    {quota.remaining} / {quota.totalLimit || (quota as any).dailyLimit || 5} Free Left Today
                  </span>
                )
              )}
            </div>
            <p className="hidden text-[11px] text-slate-400 sm:block">
              {language === 'bn' ? "শিক্ষামূলক এআই সহকারী" : "Conversational STEM Learning Assistant"}
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex w-full items-center justify-end gap-1.5 sm:w-auto sm:gap-2.5">
          {/* Language Toggle */}
          <div className="flex items-center rounded-lg bg-white/[0.04] border border-red-950/60 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => handleToggleLang('en')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer sm:px-2.5 ${
                language === 'en' 
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm font-semibold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleToggleLang('bn')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer sm:px-2.5 ${
                language === 'bn' 
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm font-semibold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              বাংলা
            </button>
          </div>

          {/* Academic Level Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLevelMenu(prev => !prev)}
              className="flex items-center gap-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-red-950/60 px-2 py-1.5 text-xs font-medium text-slate-300 transition-colors cursor-pointer sm:gap-1.5 sm:px-3"
              title="Academic Depth"
            >
              <GraduationCap className="h-3.5 w-3.5 text-red-400" />
              <span className="capitalize">{level}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showLevelMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-[#140507] border border-red-900/50 shadow-2xl p-1 z-40 animate-in fade-in slide-in-from-top-1">
                {(['beginner', 'intermediate', 'advanced'] as const).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setLevel(lvl);
                      setShowLevelMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer capitalize flex items-center justify-between ${
                      level === lvl ? 'bg-red-500/20 text-red-300 font-semibold' : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span>{lvl}</span>
                    {level === lvl && <Check className="h-3 w-3 text-red-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Prominent Full-Screen Exit / Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-red-950/70 border border-white/10 hover:border-red-500/40 text-slate-300 hover:text-white transition-all cursor-pointer sm:gap-1.5 sm:px-3"
            title="Exit Full Screen AI (Esc)"
          >
            <X className="h-4 w-4" />
            <span className="hidden text-xs font-semibold sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Middle Chat Area - Fixed/Stationary when empty, Scrollable when messages exist */}
      <main 
        ref={chatContainerRef} 
        className={`relative flex-1 min-h-0 ${
          messages.length === 0 
            ? 'overflow-hidden flex flex-col justify-center' 
            : 'overflow-y-auto ai-scroll-container no-scrollbar scroll-smooth'
        } px-3 sm:px-8 py-2 sm:py-4 z-10`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className={`max-w-4xl lg:max-w-5xl mx-auto w-full flex flex-col ${messages.length === 0 ? 'h-full justify-center' : 'space-y-5'}`}>
          {/* Welcome Hero / Empty State - Strictly stationary, fixed in viewport (no mouse wheel scroll) */}
          {messages.length === 0 && (
            <div 
              className="py-1 sm:py-2 text-center animate-in fade-in duration-200 select-none my-auto"
              onWheel={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-tr from-red-600/25 via-rose-950/40 to-black/80 border border-red-500/40 shadow-2xl shadow-red-950/60 backdrop-blur-xl group hover:scale-105 transition-all sm:h-16 sm:w-16">
                <PiechemAiLogo size="md" animated />
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {language === 'bn' 
                  ? `নমস্কার, ${studentName && studentName !== 'Scholar' ? studentName : 'শিক্ষার্থী'}` 
                  : `Hello, ${studentName || 'Scholar'}`}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-1.5 sm:mt-2 leading-relaxed">
                {language === 'bn'
                  ? "আজ কোন বিষয়টি আয়ত্ত করবেন? রসায়ন, পদার্থবিদ্যা বা গণিতের যেকোনো একাডেমিক প্রশ্ন, প্রতিপাদন বা সংশয় জিজ্ঞাসা করুন।"
                  : "What concept shall we master today? Ask any academic question, derivation, or doubt in Chemistry, Physics, and Math."}
              </p>

              {/* Quick Starter Cards */}
              <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 max-w-2xl mx-auto">
                {PROMPT_STARTERS.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(card.prompt)}
                      className={`group relative p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br ${card.color} border hover:border-red-500/50 hover:scale-[1.01] transition-all duration-200 cursor-pointer shadow-sm text-left`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                          {card.subject}
                        </span>
                        <Icon className="h-4 w-4 opacity-80 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-red-200 transition-colors">
                        {card.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 sm:mt-1 leading-normal">
                        {card.prompt}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Conversation Messages */}
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';

            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
              >
                {!isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-950/60 border border-red-500/30 text-red-400 shadow-sm mt-1">
                    <PiechemAiLogo size="xs" />
                  </div>
                )}

                <div 
                  className={`relative max-w-[88%] text-sm leading-relaxed ${
                    isUser 
                      ? 'rounded-2xl rounded-tr-xs bg-[#1f0a0c] hover:bg-[#250d10] border border-red-900/40 text-slate-100 p-4 shadow-sm' 
                      : 'rounded-2xl rounded-tl-xs bg-[#120406]/90 border border-red-950 text-slate-200 p-4 sm:p-5 shadow-sm w-full'
                  }`}
                >
                  {/* Assistant Source Badge */}
                  {!isUser && (
                    <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[10px]">
                      {m.sourceCategory === 'PIECHEM_MATERIAL' ? (
                        <div className="inline-flex items-center gap-1 rounded-full bg-emerald-950/70 px-2.5 py-0.5 font-semibold text-emerald-300 border border-emerald-500/30">
                          <BookOpen className="h-3 w-3 text-emerald-400" />
                          <span>PIECHEM Study Notes</span>
                        </div>
                      ) : m.sourceCategory === 'STUDENT_DATA' ? (
                        <div className="inline-flex items-center gap-1 rounded-full bg-red-950/70 px-2.5 py-0.5 font-semibold text-rose-300 border border-red-500/30">
                          <Activity className="h-3 w-3 text-red-400" />
                          <span>Verified Performance Telemetry</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-red-950/60 px-2.5 py-0.5 font-bold text-red-300 border border-red-500/30 shadow-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                          <span>PIECHEM AI</span>
                        </div>
                      )}

                      {m.searchGroundingUsed && (
                        <div className="inline-flex items-center gap-1 rounded-full bg-blue-950/70 px-2.5 py-0.5 font-semibold text-blue-300 border border-blue-500/30">
                          <Globe className="h-3 w-3 text-blue-400" />
                          <span>Web Grounding</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Render Message Body */}
                  {isUser ? (
                    <div className="whitespace-pre-wrap break-words font-sans text-white text-[14px]">
                      {m.content}
                    </div>
                  ) : (
                    <FormattedAiMessage content={m.content} />
                  )}

                  {/* Web Sources Grounding Citations */}
                  {!isUser && m.webSources && m.webSources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-red-950/60 text-xs">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mb-1.5">
                        <Globe className="h-3 w-3 text-blue-400" />
                        <span>Sources & Citations:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.webSources.map((ws, i) => (
                          <a
                            key={i}
                            href={ws.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-red-950/60 text-[11px] text-rose-300 hover:text-rose-200 transition-colors truncate max-w-[240px]"
                            title={ws.title || ws.url}
                          >
                            <span className="truncate">{ws.title || ws.url}</span>
                            <ArrowRight className="h-2.5 w-2.5 shrink-0 opacity-60" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sleek Action Bar on Assistant Messages */}
                  {!isUser && (
                    <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-slate-400 text-xs">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {m.timestamp}
                      </span>

                      <div className="flex items-center gap-1">
                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={() => handleCopy(m.id, m.content)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
                          title="Copy response"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-[11px] text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>

                        {/* Text-to-Speech Speak Button */}
                        <button
                          type="button"
                          onClick={() => handleSpeak(m.id, m.content)}
                          className={`p-1.5 rounded-md hover:bg-white/[0.08] transition-colors cursor-pointer ${
                            speakingId === m.id ? 'text-red-400 bg-red-500/10' : 'hover:text-white'
                          }`}
                          title={speakingId === m.id ? "Stop audio" : "Listen to explanation"}
                        >
                          {speakingId === m.id ? (
                            <VolumeX className="h-3.5 w-3.5 animate-pulse" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" />
                          )}
                        </button>

                        {/* Thumbs Up Feedback */}
                        <button
                          type="button"
                          onClick={() => handleFeedback(m.id, 'like')}
                          className={`p-1.5 rounded-md hover:bg-white/[0.08] transition-colors cursor-pointer ${
                            m.feedback === 'like' ? 'text-emerald-400 bg-emerald-500/10' : 'hover:text-white'
                          }`}
                          title="Helpful response"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </button>

                        {/* Thumbs Down Feedback */}
                        <button
                          type="button"
                          onClick={() => handleFeedback(m.id, 'dislike')}
                          className={`p-1.5 rounded-md hover:bg-white/[0.08] transition-colors cursor-pointer ${
                            m.feedback === 'dislike' ? 'text-rose-400 bg-rose-500/10' : 'hover:text-white'
                          }`}
                          title="Needs improvement"
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Contextual Follow-Up Buttons */}
                  {!isUser && (
                    <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.04]">
                      <button
                        type="button"
                        onClick={() => handleSendMessage("Can you give me a deeper, more rigorous explanation with derivation?")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.09] hover:border-red-500/40 border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        <Lightbulb className="h-3 w-3 text-amber-400" />
                        <span>Deeper Dive</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendMessage("Give me an everyday real-world analogy for this concept")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.09] hover:border-red-500/40 border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3 text-rose-400" />
                        <span>Analogy</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendMessage("Test me on this with 3 practice MCQs with options A-D")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.09] hover:border-emerald-500/40 border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span>Quiz Me</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendMessage("Explain this concept in Bengali (বাংলায় ধারণাটি ব্যাখ্যা করুন)")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.09] hover:border-red-500/40 border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        <Languages className="h-3 w-3 text-red-400" />
                        <span>বাংলা</span>
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-900/30 border border-red-500/30 text-rose-300 mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* PIECHEM AI Pulsing Generation State */}
          {loading && (
            <div className="flex items-center gap-3 animate-in fade-in duration-200">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-950/60 border border-red-500/30 text-red-400">
                <PiechemAiLogo size="xs" animated />
              </div>
              <div className="rounded-2xl rounded-tl-xs bg-[#140507]/90 border border-red-950 px-4 py-3 text-xs text-slate-300 flex items-center gap-2.5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce" />
                </div>
                <span className="bg-gradient-to-r from-red-400 via-rose-300 to-red-300 bg-clip-text text-transparent font-medium">
                  {language === 'bn' ? "পাইকেম এআই বিশ্লেষণ করছে..." : "PIECHEM AI is reasoning & formulating answer..."}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Pinned Action Area - Always Anchored at the Bottom */}
      <footer className="relative z-30 shrink-0 border-t border-red-950/80 bg-[#090203]/95 px-3 sm:px-8 py-2 sm:py-3 backdrop-blur-xl">
        <div className="max-w-4xl lg:max-w-5xl mx-auto w-full space-y-2">
          {/* Pill Follow-Up Suggestions */}
          {dynamicSuggestions.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {dynamicSuggestions.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={loading}
                  className="whitespace-nowrap rounded-full border border-red-950 bg-[#140507] hover:bg-[#1f090d] hover:border-red-500/40 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer disabled:opacity-40 flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="h-3 w-3 text-red-400" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          )}

          {/* Floating Prompt Capsule */}
          {quota && !quota.isUnlimited && quota.remaining === 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 rounded-2xl bg-gradient-to-r from-amber-950/90 via-rose-950/80 to-amber-950/90 border border-amber-500/40 p-3 text-xs text-amber-200 shadow-xl mb-2">
              <div className="flex items-center gap-2 text-center sm:text-left">
                <Sparkles className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
                <span>
                  You have reached your <strong>5 free AI queries</strong> for today. Upgrade to PIECHEM Gold to unlock unlimited AI prompts!
                </span>
              </div>
              <a
                href="/dashboard/account"
                className="shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold px-4 py-1.5 text-xs shadow-md transition-all active:scale-95"
              >
                Upgrade to Gold (₹99)
              </a>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="rounded-3xl border border-red-950 bg-[#140507] hover:border-red-900/60 focus-within:border-red-500/60 focus-within:ring-2 focus-within:ring-red-500/20 p-2 sm:p-2.5 transition-all shadow-xl"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={1}
              placeholder={
                language === 'bn'
                  ? "রসায়ন, পদার্থবিদ্যা বা গণিতের যেকোনো প্রশ্ন বা সংশয় জিজ্ঞাসা করুন..."
                  : "Ask anything in Chemistry, Physics, Math, or request a drill..."
              }
              className="w-full resize-none bg-transparent px-3 py-1 text-sm text-white placeholder-slate-500 focus:outline-none leading-relaxed no-scrollbar"
              style={{ minHeight: "38px", maxHeight: "120px", scrollbarWidth: "none", msOverflowStyle: "none" }}
            />

            {/* Bottom Capsule Controls */}
            <div className="flex items-center justify-between pt-1 px-2 border-t border-white/[0.04]">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Start fresh conversation"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>

                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  {context.subject || 'Chemistry'} • {level}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white shadow-md shadow-red-950/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="Send message"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </form>

          {/* Minimalist Clean Disclaimer */}
          <p className="text-center text-[10px] text-slate-500">
            PIECHEM AI • Verify critical formulas for board and competitive exams.
          </p>
        </div>
      </footer>

    </div>
  );
}
