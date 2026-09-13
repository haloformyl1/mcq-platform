"use client";

import { useState, useRef, useEffect } from "react";
import FormattedAiMessage from "./FormattedAiMessage";
import { 
  X, Send, User, Trash2, ArrowRight, 
  Atom, CheckCircle2, BookOpen, Brain, 
  Languages, GraduationCap, Copy, Check, RefreshCw, 
  Lightbulb, Globe, Activity, Volume2, VolumeX,
  ThumbsUp, ThumbsDown, Maximize2, Minimize2, RotateCcw,
  Sparkles, Compass, Microscope, Calculator, ChevronDown
} from "lucide-react";

/**
 * Authentic Google Gemini 4-point star SVG icon with gradient
 */
function GeminiStarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gemini-star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="45%" stopColor="#9b51e0" />
          <stop offset="100%" stopColor="#00d2ff" />
        </linearGradient>
      </defs>
      <path
        d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4771 12 22C12 16.4771 16.4771 12 22 12C16.4771 12 12 7.52285 12 2Z"
        fill="url(#gemini-star-grad)"
      />
    </svg>
  );
}

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
}

const PROMPT_STARTERS = [
  {
    icon: Atom,
    color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-300",
    subject: "Chemistry",
    title: "Chirality & Stereochemistry",
    prompt: "Explain chirality, asymmetric carbon, and enantiomers with 3D intuition and exam examples."
  },
  {
    icon: Compass,
    color: "from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-300",
    subject: "Physics",
    title: "Electromagnetic Induction",
    prompt: "Explain Faraday's Law & Lenz's Law with step-by-step physical intuition."
  },
  {
    icon: Calculator,
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300",
    subject: "Mathematics",
    title: "Integration by Parts",
    prompt: "Derive the Integration by Parts formula with a clear step-by-step worked example."
  },
  {
    icon: CheckCircle2,
    color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300",
    subject: "Exam Practice",
    title: "Adaptive 3-MCQ Drill",
    prompt: "Quiz me on my syllabus with 3 challenging practice MCQs with options A-D."
  }
];

export default function AiTutorDrawer({
  isOpen,
  onClose,
  initialMode = 'tutor',
  initialContext
}: AiTutorDrawerProps) {
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [isExpanded, setIsExpanded] = useState(false);
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

  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([
    "Explain chirality & optical isomers with 3D intuition",
    "Why does ionisation energy increase across a period?",
    "Derive Snell's law and refractive index",
    "Quiz me on my syllabus with 3 MCQs"
  ]);

  const [messages, setMessages] = useState<Message[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Synchronize initial context
  useEffect(() => {
    if (initialContext) {
      setContext(initialContext);
    }
  }, [initialContext]);

  // Scroll to bottom on updates
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading]);

  // Clean up speech synthesis when drawer unmounts or closes
  useEffect(() => {
    if (!isOpen && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }
  }, [isOpen]);

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
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to reach Gemini AI tutor");
      }

      if (data.suggestedFollowUps && data.suggestedFollowUps.length > 0) {
        // Filter out conversational anomalies like "GOOD BYE"
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
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `**Notice**: ${err.message || "An unexpected error occurred. Please try asking again."}`,
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
    // Clean markdown and LaTeX symbols for clean speech
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`relative flex h-full w-full flex-col bg-[#131314] text-slate-100 shadow-2xl border-l border-white/[0.08] transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-w-4xl' : 'max-w-xl'
        }`}
      >
        {/* Subtle Ambient Gemini Gradient Glow */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-80 h-80 rounded-full bg-gradient-to-br from-[#4285F4]/10 via-[#9b51e0]/10 to-[#00d2ff]/10 blur-3xl" />

        {/* Gemini-Style Sleek Top Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/[0.08] px-4 sm:px-5 py-3 bg-[#131314]/90 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 shadow-inner">
              <GeminiStarIcon className="h-5 w-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center gap-1.5">
                  PIECHEM
                  <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent font-bold text-xs sm:text-sm">
                    Gemini AI
                  </span>
                </h2>
                <div className="flex items-center gap-1 rounded-full bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 text-[10px] text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-slate-400">3.6 Flash</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'bn' ? "শিক্ষামূলক এআই সহকারী" : "Conversational STEM Learning Assistant"}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5">
            {/* Language Toggle */}
            <div className="flex items-center rounded-lg bg-white/[0.05] border border-white/[0.08] p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  language === 'en' 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm font-semibold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  language === 'bn' 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm font-semibold' 
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
                className="flex items-center gap-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                title="Academic Depth"
              >
                <GraduationCap className="h-3.5 w-3.5 text-cyan-400" />
                <span className="capitalize">{level}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {showLevelMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl bg-[#1e1f20] border border-white/10 shadow-2xl p-1 z-30 animate-in fade-in slide-in-from-top-1">
                  {(['beginner', 'intermediate', 'advanced'] as const).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        setLevel(lvl);
                        setShowLevelMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer capitalize flex items-center justify-between ${
                        level === lvl ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span>{lvl}</span>
                      {level === lvl && <Check className="h-3 w-3 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Expand / Minimize Toggle */}
            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
              title={isExpanded ? "Collapse width" : "Expand to wide canvas"}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
              title="Close AI Tutor"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Message Thread Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Welcome Canvas when empty */}
          {messages.length === 0 && (
            <div className="my-auto py-8 flex flex-col items-center text-center space-y-6 animate-in fade-in duration-300">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600/20 via-purple-600/20 to-cyan-400/20 border border-white/10 shadow-2xl">
                <GeminiStarIcon className="h-9 w-9 animate-pulse" />
              </div>

              <div className="space-y-1.5 max-w-md">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  <span className="bg-gradient-to-r from-[#4285F4] via-[#9b51e0] to-[#00d2ff] bg-clip-text text-transparent">
                    {language === 'bn' ? "নমস্কার, শিক্ষার্থী" : "Hello, Scholar"}
                  </span>
                </h1>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {language === 'bn'
                    ? "রসায়ন, পদার্থবিদ্যা, গণিত বা জীববিদ্যার যেকোনো প্রশ্ন করুন বা সরাসরি কুইজ নিয়ে অনুশীলন শুরু করুন।"
                    : "What concept shall we master today? Ask any academic question, derivation, or doubt in Chemistry, Physics, and Math."}
                </p>
              </div>

              {/* Quick Discovery Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg text-left pt-2">
                {PROMPT_STARTERS.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(card.prompt)}
                      className={`group relative p-3.5 rounded-2xl bg-gradient-to-br ${card.color} border hover:border-white/20 hover:scale-[1.02] transition-all duration-200 cursor-pointer shadow-sm text-left`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                          {card.subject}
                        </span>
                        <Icon className="h-4 w-4 opacity-80 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h4 className="text-xs font-semibold text-white group-hover:text-cyan-200 transition-colors">
                        {card.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-normal">
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
            const isLatestAssistant = !isUser && idx === messages.length - 1;

            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
              >
                {!isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 text-white shadow-sm mt-1">
                    <GeminiStarIcon className="h-4 w-4" />
                  </div>
                )}

                <div 
                  className={`relative max-w-[88%] text-sm leading-relaxed ${
                    isUser 
                      ? 'rounded-2xl rounded-tr-xs bg-[#24272b] hover:bg-[#282c31] border border-white/10 text-slate-100 p-4 shadow-sm' 
                      : 'rounded-2xl rounded-tl-xs bg-[#181a1d]/70 border border-white/[0.07] text-slate-200 p-4 sm:p-5 shadow-sm w-full'
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
                        <div className="inline-flex items-center gap-1 rounded-full bg-cyan-950/70 px-2.5 py-0.5 font-semibold text-cyan-300 border border-cyan-500/30">
                          <Activity className="h-3 w-3 text-cyan-400" />
                          <span>Verified Performance Telemetry</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-0.5 font-medium text-slate-300 border border-white/10">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                          <span>Google Gemini 3.6 Flash</span>
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
                    <div className="mt-3 pt-2.5 border-t border-white/[0.08] text-xs">
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-[11px] text-cyan-300 hover:text-cyan-200 transition-colors truncate max-w-[240px]"
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
                            speakingId === m.id ? 'text-cyan-400 bg-cyan-500/10' : 'hover:text-white'
                          }`}
                          title={speakingId === m.id ? "Stop audio" : "Listen to explanation"}
                        >
                          {speakingId === m.id ? (
                            <VolumeX className="h-3.5 w-3.5 animate-pulse" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" />
                          )}
                        </button>

                        {/* Thumbs Feedback */}
                        <button
                          type="button"
                          onClick={() => handleFeedback(m.id, 'like')}
                          className={`p-1.5 rounded-md hover:bg-white/[0.08] transition-colors cursor-pointer ${
                            m.feedback === 'like' ? 'text-emerald-400' : 'hover:text-white'
                          }`}
                          title="Helpful explanation"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFeedback(m.id, 'dislike')}
                          className={`p-1.5 rounded-md hover:bg-white/[0.08] transition-colors cursor-pointer ${
                            m.feedback === 'dislike' ? 'text-rose-400' : 'hover:text-white'
                          }`}
                          title="Needs improvement"
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 1-Click Interactive Action Chips (ONLY on the latest assistant message) */}
                  {isLatestAssistant && (
                    <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSendMessage("Explain this simply with an intuitive everyday analogy")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.09] hover:border-cyan-500/40 border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        <Lightbulb className="h-3 w-3 text-amber-400" />
                        <span>Simplify</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendMessage("Provide deeper scientific mechanisms, derivations, and exam traps")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.09] hover:border-cyan-500/40 border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        <Atom className="h-3 w-3 text-cyan-400" />
                        <span>Deeper Dive</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendMessage("Give me an everyday real-world analogy for this concept")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.09] hover:border-cyan-500/40 border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3 text-purple-400" />
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
                        onClick={() => handleSendMessage("Explain this concept in Bengali (বাংলায় অনুবাদ ও সহজ ব্যাখ্যা দাও)")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.09] hover:border-blue-500/40 border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        <Languages className="h-3 w-3 text-blue-400" />
                        <span>বাংলা</span>
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Gemini Pulsing Generation State */}
          {loading && (
            <div className="flex items-center gap-3 animate-in fade-in duration-200">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 text-white">
                <GeminiStarIcon className="h-4 w-4 animate-spin" />
              </div>
              <div className="rounded-2xl rounded-tl-xs bg-[#181a1d]/70 border border-white/[0.08] px-4 py-3 text-xs text-slate-300 flex items-center gap-2.5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                </div>
                <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent font-medium">
                  {language === 'bn' ? "জেমিনি বিশ্লেষণ করছে..." : "Gemini is reasoning & formulating answer..."}
                </span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Gemini Pill Follow-Up Suggestions */}
        {dynamicSuggestions.length > 0 && (
          <div className="border-t border-white/[0.06] bg-[#131314] px-4 py-2">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {dynamicSuggestions.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={loading}
                  className="whitespace-nowrap rounded-full border border-white/[0.08] bg-[#1e1f20] hover:bg-[#282a2d] hover:border-cyan-500/40 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer disabled:opacity-40 flex items-center gap-1 shadow-sm"
                >
                  <Sparkles className="h-3 w-3 text-cyan-400" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Gemini Floating Prompt Capsule */}
        <div className="border-t border-white/[0.08] bg-[#131314] p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="rounded-3xl border border-white/15 bg-[#1e1f20] hover:border-white/25 focus-within:border-cyan-400/60 focus-within:ring-2 focus-within:ring-cyan-500/20 p-2 sm:p-2.5 transition-all shadow-xl"
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
                  ? "পদার্থবিদ্যা, রসায়ন বা গণিতের যেকোনো প্রশ্ন জিজ্ঞাসা করুন..."
                  : "Ask anything in Chemistry, Physics, Math, or request a drill..."
              }
              className="w-full resize-none bg-transparent px-3 py-1 text-sm text-white placeholder-slate-500 focus:outline-none leading-relaxed"
              style={{ minHeight: '38px', maxHeight: '120px' }}
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
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 text-white shadow-md shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="Send message"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </form>

          {/* Minimalist Gemini Disclaimer */}
          <p className="mt-2 text-center text-[10px] text-slate-500">
            PIECHEM AI is powered by Google Gemini. Verify critical formulas for board and competitive exams.
          </p>
        </div>

      </div>
    </div>
  );
}
