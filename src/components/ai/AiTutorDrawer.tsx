"use client";

import { useState, useRef, useEffect } from "react";
import FormattedAiMessage from "./FormattedAiMessage";
import PiechemAiLogo from "./PiechemAiLogo";
import { 
  X, Send, User, ArrowRight, 
  Atom, BookOpen, Dna, 
  GraduationCap, Copy, Check, 
  Lightbulb, RotateCcw,
  Sparkles, Compass, Calculator, ChevronDown, ChevronRight,
  MessageSquare, Lock, Paperclip, ThumbsUp, ThumbsDown
} from "lucide-react";

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

interface ChatHistoryItem {
  id: string;
  title: string;
  query: string;
  response: string;
  subject: string;
}

const DEFAULT_HISTORY_CHATS: ChatHistoryItem[] = [
  {
    id: "hist-1",
    title: "Derivation of Michaelis-M...",
    query: "When the enzyme is completely saturated with substrate ([ES] = [E0]), the reaction proceeds at its theoretical maximum velocity:",
    response: "When the enzyme is completely saturated with substrate ($[\\text{ES}] = [\\text{E}_0]$), the reaction proceeds at its theoretical maximum velocity:\n\n$$V_{\\max} = k_2 [\\text{E}_0]$$\n\nSubstituting $V_{\\max}$ yields the final Michaelis–Menten Equation:\n\n$$v_0 = \\frac{V_{\\max} [\\text{S}]}{K_m + [\\text{S}]}$$",
    subject: "Chemistry"
  },
  {
    id: "hist-2",
    title: "Explain conservation of m...",
    query: "Explain the law of conservation of momentum with a 1D collision derivation.",
    response: "In an isolated system with no external net force, the total linear momentum before collision equals the total linear momentum after collision:\n\n$$m_1 u_1 + m_2 u_2 = m_1 v_1 + m_2 v_2$$\n\nThis fundamental principle directly follows from Newton's Third Law ($F_{12} = -F_{21}$) and impulse formulation.",
    subject: "Physics"
  },
  {
    id: "hist-3",
    title: "Solve this integration prob...",
    query: "Evaluate the indefinite integral $\\int x e^x \\, dx$ using integration by parts.",
    response: "Using the Integration by Parts formula:\n\n$$\\int u \\, dv = u v - \\int v \\, du$$\n\nLet $u = x \\implies du = dx$, and $dv = e^x \\, dx \\implies v = e^x$:\n\n$$\\int x e^x \\, dx = x e^x - \\int e^x \\, dx = x e^x - e^x + C = e^x (x - 1) + C$$",
    subject: "Mathematics"
  },
  {
    id: "hist-4",
    title: "What is hybridization in or...",
    query: "Explain sp³ hybridization in methane with bond angle and geometry.",
    response: "In methane ($CH_4$), carbon's $2s$ and three $2p$ orbitals mix to form four equivalent $sp^3$ hybrid orbitals directed toward the corners of a regular tetrahedron:\n\n$$\\text{Bond Angle} = 109.5^\\circ$$\n\nThe molecular geometry is tetrahedral with four equal C-H $\\sigma$ bonds.",
    subject: "Chemistry"
  }
];

const SUBJECT_ICONS: Record<string, string> = {
  Chemistry: "🧪",
  Physics: "◉",
  Mathematics: "∑",
  Biology: "🧬",
  "All STEM": "✦"
};

export default function AiTutorDrawer({
  isOpen,
  onClose,
  initialMode = 'tutor',
  initialContext,
  initialStudentName
}: AiTutorDrawerProps) {
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [selectedSubject, setSelectedSubject] = useState<'Chemistry' | 'Physics' | 'Mathematics' | 'Biology' | 'All STEM'>('Chemistry');

  const [language, setLanguage] = useState<'en' | 'bn'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('piechem_ai_lang') as 'en' | 'bn') || 'en';
    }
    return 'en';
  });

  const [showLevelMenu, setShowLevelMenu] = useState(false);
  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  const [showConsoleLevelMenu, setShowConsoleLevelMenu] = useState(false);

  const [context, setContext] = useState<AcademicContext>(initialContext || {
    subject: "Chemistry",
    className: "Class 11",
    chapter: "Periodic Table",
    topic: "Ionisation Energy"
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string>("hist-1");
  const [quota, setQuota] = useState<{ remaining: number; totalLimit?: number; dailyLimit?: number; isUnlimited: boolean; queriesUsed?: number } | null>(null);
  const [goldPrice, setGoldPrice] = useState<number>(199);
  const [studentName, setStudentName] = useState<string>("Scholar");

  // Initial messages populated from default demonstration chat matching the reference image
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-user-1",
      role: "user",
      content: DEFAULT_HISTORY_CHATS[0].query,
      timestamp: "04:39 PM"
    },
    {
      id: "msg-assistant-1",
      role: "assistant",
      content: DEFAULT_HISTORY_CHATS[0].response,
      title: "Michaelis–Menten Equation & Vmax",
      keyConcepts: [
        "V_max: maximum reaction velocity",
        "K_m: Michaelis constant (substrate concentration at half V_max)",
        "[E_0]: total enzyme concentration",
        "[S]: substrate concentration"
      ],
      keyTakeaway: "At high substrate concentration, the enzyme becomes saturated and the reaction rate approaches V_max.",
      relatedTopics: ["Enzyme Kinetics", "Michaelis-Menten", "Biochemistry"],
      timestamp: "04:40 PM"
    }
  ]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Fetch quota
  useEffect(() => {
    if (isOpen) {
      fetch("/api/ai/quota")
        .then(res => res.json())
        .then(data => {
          if (data?.quota) setQuota(data.quota);
          if (data?.goldPrice) setGoldPrice(data.goldPrice);
          if (data?.studentName && data.studentName !== 'Scholar') setStudentName(data.studentName);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && chatContainerRef.current && messages.length > 0) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, loading, isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Helper to extract telemetry (Title, Key Concepts, Key Takeaways, Related Topics)
  const parseAcademicTelemetry = (content: string, userQuery: string, currentSubject: string) => {
    let title = "";
    const h1Match = content.match(/^#+\s*(.+)$/m);
    if (h1Match) {
      title = h1Match[1].replace(/[*_#\`]/g, '').trim();
    } else {
      title = userQuery.replace(/^(explain|what is|solve|derive|calculate|compare)\s+/i, '')
        .replace(/[?!.]/g, '').trim();
      title = title.charAt(0).toUpperCase() + title.slice(1);
      if (title.length > 42) title = title.slice(0, 42) + "...";
    }

    const concepts: string[] = [];
    const bulletMatches = content.match(/^[\*\-]\s*(.+)$/gm);
    if (bulletMatches && bulletMatches.length > 0) {
      bulletMatches.slice(0, 4).forEach(b => {
        concepts.push(b.replace(/^[\*\-]\s*/, '').replace(/[*_#]/g, '').trim());
      });
    }
    if (concepts.length === 0) {
      if (userQuery.toLowerCase().includes('michaelis') || userQuery.toLowerCase().includes('enzyme')) {
        concepts.push("V_max: maximum reaction velocity");
        concepts.push("K_m: Michaelis constant (substrate concentration at half V_max)");
        concepts.push("[E_0]: total enzyme concentration");
        concepts.push("[S]: substrate concentration");
      } else if (currentSubject.toLowerCase().includes('chem')) {
        concepts.push("Reaction mechanism & active intermediates");
        concepts.push("Thermodynamic driving force & equilibrium");
        concepts.push("Rate determining transition state");
        concepts.push("Stereochemical inversion / retention");
      } else if (currentSubject.toLowerCase().includes('phys')) {
        concepts.push("Governing fundamental field law");
        concepts.push("Conservation of momentum & energy");
        concepts.push("Boundary condition assumptions");
        concepts.push("Dimensional and vector analysis");
      } else if (currentSubject.toLowerCase().includes('bio')) {
        concepts.push("Molecular cellular machinery");
        concepts.push("Enzyme catalyzed biochemical pathway");
        concepts.push("Feedback inhibition & regulation");
        concepts.push("Functional & evolutionary significance");
      } else {
        concepts.push("First principles derivation");
        concepts.push("Boundary condition evaluation");
        concepts.push("Step-by-step substitution logic");
        concepts.push("Analytical verification");
      }
    }

    let takeaway = "";
    const takeawayMatch = content.match(/(?:key\s*takeaway|in\s*summary|conclusion|takeaway)[\s:*#]+([^\n]+(?:\n[^\n]+)?)/i);
    if (takeawayMatch) {
      takeaway = takeawayMatch[1].replace(/[*_#]/g, '').trim();
    } else {
      const paragraphs = content.split(/\n\n+/).filter(p => p.trim() && !p.startsWith('#'));
      takeaway = paragraphs[paragraphs.length - 1]?.replace(/[*_#]/g, '').trim() || 
        "At high substrate concentration, the enzyme becomes saturated and the reaction rate approaches maximum velocity.";
    }
    if (takeaway.length > 180) takeaway = takeaway.slice(0, 180) + "...";

    const topics: string[] = [];
    if (userQuery.toLowerCase().includes('michaelis') || userQuery.toLowerCase().includes('enzyme')) {
      topics.push("Enzyme Kinetics", "Michaelis-Menten", "Biochemistry");
    } else if (currentSubject.toLowerCase().includes('chem')) {
      topics.push("Chemical Kinetics", "Organic Mechanisms", "Thermodynamics");
    } else if (currentSubject.toLowerCase().includes('phys')) {
      topics.push("Classical Mechanics", "Electromagnetism", "Wave Optics");
    } else if (currentSubject.toLowerCase().includes('bio')) {
      topics.push("Cell Biology", "Molecular Genetics", "Physiology");
    } else {
      topics.push("Calculus", "Differential Equations", "Optimization");
    }

    return { title, concepts: concepts.slice(0, 4), takeaway, topics: topics.slice(0, 4) };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const questionText = (textToSend || input).trim();
    if (!questionText || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: questionText,
      timestamp: timeStr
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
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
            ...context,
            subject: selectedSubject !== 'All STEM' ? selectedSubject : context.subject
          },
          history
        })
      });

      const data = await res.json();
      if (data.quota) setQuota(data.quota);
      if (data.goldPrice) setGoldPrice(data.goldPrice);

      const telemetry = parseAcademicTelemetry(data.answer || data.reply || "", questionText, selectedSubject);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || data.reply || "Failed to generate educational response.",
        title: telemetry.title,
        keyConcepts: telemetry.concepts,
        keyTakeaway: telemetry.takeaway,
        relatedTopics: telemetry.topics,
        isOutOfScope: Boolean(data.isOutOfScope),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "PIECHEM AI\nSomething interrupted the response. Please check your network and try again.",
          timestamp: timeStr
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveChatId("");
    setInput("");
    inputRef.current?.focus();
  };

  const handleSelectChat = (chat: ChatHistoryItem) => {
    setActiveChatId(chat.id);
    setSelectedSubject(chat.subject as any);
    const telemetry = parseAcademicTelemetry(chat.response, chat.query, chat.subject);
    setMessages([
      {
        id: "msg-user-" + chat.id,
        role: 'user',
        content: chat.query,
        timestamp: "04:39 PM"
      },
      {
        id: "msg-ai-" + chat.id,
        role: 'assistant',
        content: chat.response,
        title: telemetry.title,
        keyConcepts: telemetry.concepts,
        keyTakeaway: telemetry.takeaway,
        relatedTopics: telemetry.topics,
        timestamp: "04:40 PM"
      }
    ]);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInput(prev => prev ? `${prev} [Attached: ${file.name}]` : `[Attached reference: ${file.name}]`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 w-full h-full flex flex-col bg-[#050203] text-slate-100 overflow-hidden font-sans select-text animate-in fade-in duration-200">
      
      {/* Deep Atmospheric Glows */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 75% 25%, rgba(159, 18, 57, 0.12) 0%, rgba(88, 28, 28, 0.04) 40%, transparent 75%)"
        }}
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.035]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="stemLattice" width="48" height="48" patternUnits="userSpaceOnUse">
              <circle cx="24" cy="24" r="0.8" fill="#f43f5e" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#stemLattice)" />
          <ellipse cx="65%" cy="35%" rx="480" ry="160" fill="none" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3 6" />
        </svg>
      </div>

      {/* TOP HEADER: Matches Reference Image Exactly */}
      <header className="relative z-30 shrink-0 h-14 sm:h-16 border-b border-red-950/60 px-4 sm:px-6 flex items-center justify-between bg-[#070204]/90 backdrop-blur-2xl">
        {/* Left: Brand Identity + Badges */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Glowing AI Mark Capsule */}
          <div className="flex items-center justify-center h-8 sm:h-9 w-8 sm:w-9 rounded-xl bg-[#1c070c] border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.3)]">
            <PiechemAiLogo size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-serif text-base sm:text-xl font-bold tracking-tight text-white">
              PIECHEM <span className="bg-gradient-to-r from-red-500 via-rose-400 to-red-400 bg-clip-text text-transparent font-black">AI</span>
            </span>

            {/* Subtle STEM TUTOR Status Badge */}
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full border border-red-500/40 bg-[#190509] text-[9.5px] font-extrabold text-rose-300 uppercase tracking-wider">
              STEM TUTOR
            </span>

            {/* Daily Usage Indicator Badge */}
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-500/30 bg-[#120406] text-[10px] font-bold text-slate-200 uppercase tracking-wider shadow-sm">
              <span className="text-rose-400 font-black">+</span>
              <span>
                {quota ? (quota.isUnlimited ? "GOLD UNLIMITED" : `${quota.remaining} / ${quota.totalLimit || 5} FREE LEFT TODAY`) : "5 / 5 FREE LEFT TODAY"}
              </span>
            </span>
          </div>
        </div>

        {/* Right: Language, Level, Exit */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector */}
          <div className="flex items-center rounded-xl bg-[#120406] border border-red-950 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => handleToggleLang('en')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                language === 'en'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleToggleLang('bn')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                language === 'bn'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
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
        
        {/* LEFT SIDEBAR (Width: 260px, Desktop) */}
        <aside className="w-60 xl:w-64 shrink-0 border-r border-red-950/60 bg-[#070204]/90 flex flex-col justify-between p-3.5 hidden lg:flex select-none z-20">
          <div className="space-y-4">
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

            {/* Section: Today */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-400 px-1 uppercase">
                <span>Today</span>
                <ChevronRight className="w-3 h-3 text-slate-600" />
              </div>

              <div className="space-y-1 text-xs">
                {DEFAULT_HISTORY_CHATS.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => handleSelectChat(chat)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition cursor-pointer truncate ${
                      activeChatId === chat.id
                        ? 'bg-[#1e070c] border-l-2 border-red-500 text-white font-semibold shadow-[inset_0_1px_8px_rgba(239,68,68,0.2)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{chat.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section: Quick Prompts */}
            <div className="space-y-2 pt-2 border-t border-red-950/40">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-400 px-1 uppercase">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-red-400" />
                  <span>Quick Prompts</span>
                </span>
                <ChevronRight className="w-3 h-3 text-slate-600" />
              </div>

              <div className="space-y-1.5">
                {[
                  "Explain SN1 vs SN2",
                  "Derive lens formula",
                  "Solve ∫ x² dx",
                  "Compare mitosis and meiosis"
                ].map((promptText, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(promptText)}
                    className="w-full text-left px-3 py-2 rounded-xl bg-[#120406]/80 hover:bg-[#1c070c] border border-red-950/60 hover:border-red-500/30 text-xs text-slate-300 hover:text-white transition cursor-pointer truncate"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Quote */}
          <div className="pt-4 border-t border-red-950/40">
            <p className="text-[11px] font-serif italic text-slate-400 leading-relaxed">
              &ldquo; Better Questions.<br />
              Deeper Understanding. &rdquo;
            </p>
            <div className="w-6 h-0.5 bg-red-500/40 mt-1.5" />
          </div>
        </aside>

        {/* CENTER MAIN WORKSPACE */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050102]">
          
          {/* Scrollable Conversation Canvas */}
          <main 
            ref={chatContainerRef} 
            className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 space-y-6 no-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="max-w-6xl mx-auto w-full">

              {/* WELCOME STATE: Shown when no messages exist */}
              {messages.length === 0 && (
                <div className="py-8 sm:py-12 text-center animate-in fade-in duration-200 select-none">
                  {/* AI Logo inside refined circular glass container */}
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-red-600/20 via-rose-950/30 to-black/90 border border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.25)]">
                    <PiechemAiLogo size="md" animated />
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-red-950/80 border border-red-500/30 text-[10px] font-extrabold text-rose-300 tracking-wider uppercase mb-2 shadow-sm">
                    <span>✦</span>
                    <span>PIECHEM AI</span>
                    <span className="text-red-400">•</span>
                    <span>STEM LEARNING ASSISTANT</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight text-white">
                    Your STEM Learning Assistant
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mt-2 leading-relaxed font-sans">
                    Ask questions, explore concepts, derive equations, and practice problems across Physics, Chemistry, Mathematics, and Biology.
                  </p>

                  {/* 4 Compact Subject Tiles */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
                    {[
                      { icon: "🧪", subj: "Chemistry", desc: "Molecular structure & reactions", prompt: "Explain SN1 vs SN2 reaction mechanism with stereochemistry." },
                      { icon: "◉", subj: "Physics", desc: "Mechanics, fields & waves", prompt: "Derive the lens formula and explain sign conventions." },
                      { icon: "∑", subj: "Mathematics", desc: "Equations, calculus & proofs", prompt: "Evaluate the integral of x * e^x using integration by parts." },
                      { icon: "🧬", subj: "Biology", desc: "Cells, genetics & systems", prompt: "Explain the mechanism of DNA replication step by step." }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedSubject(item.subj as any);
                          handleSendMessage(item.prompt);
                        }}
                        className="group p-3.5 rounded-xl bg-[#0c0305]/85 hover:bg-[#160609] border border-red-950/80 hover:border-red-500/40 shadow-sm hover:shadow-[0_4px_20px_rgba(220,38,38,0.14)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-rose-300">
                              {item.icon} {item.subj}
                            </span>
                            <ArrowRight className="h-3 w-3 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-normal">
                            {item.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CONVERSATION STATE: User query on top right + Split view academic workspace below */}
              {messages.map((m, idx) => {
                if (m.role === 'user') {
                  return (
                    <div key={m.id} className="flex justify-end mb-4 animate-in fade-in duration-200">
                      <div className="max-w-2xl rounded-2xl bg-[#120508]/90 border border-red-950/80 p-3.5 sm:p-4 text-white text-xs sm:text-sm shadow-xl flex items-start gap-3">
                        <div className="h-7 w-7 rounded-full bg-red-950/80 border border-red-500/30 flex items-center justify-center shrink-0 text-red-300">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="leading-relaxed font-sans">{m.content}</div>
                      </div>
                    </div>
                  );
                }

                // AI Response Turn (Split View: Main Answer + Right Telemetry Cards)
                return (
                  <div key={m.id} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start mb-6 animate-in fade-in duration-200">
                    
                    {/* Main Academic Answer Card (Col Span 8) */}
                    <div className="lg:col-span-8 rounded-2xl bg-[#0b0305]/95 border border-red-950/80 p-5 sm:p-6 shadow-2xl space-y-4">
                      {/* Top AI Indicator */}
                      <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                        <PiechemAiLogo size="xs" />
                        <span>PIECHEM AI</span>
                      </div>

                      {/* Out of scope card */}
                      {m.isOutOfScope ? (
                        <div className="p-4 rounded-xl bg-gradient-to-b from-[#180508] to-[#0d0204] border border-red-500/30 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <span>PIECHEM Academic Scope</span>
                          </div>
                          <p className="text-sm text-slate-200 leading-relaxed font-sans">
                            {m.content}
                          </p>
                          <div className="pt-2 border-t border-red-950/60">
                            <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                              Try asking an academic question from one of our four supported domains:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => { setSelectedSubject('Chemistry'); handleSendMessage("Explain SN1 vs SN2 reaction mechanism"); }}
                                className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-500/30 text-rose-200 text-xs font-medium transition cursor-pointer"
                              >
                                🧪 Chemistry
                              </button>
                              <button
                                type="button"
                                onClick={() => { setSelectedSubject('Physics'); handleSendMessage("Explain Newton's second law and derive F = ma"); }}
                                className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-500/30 text-rose-200 text-xs font-medium transition cursor-pointer"
                              >
                                ◉ Physics
                              </button>
                              <button
                                type="button"
                                onClick={() => { setSelectedSubject('Mathematics'); handleSendMessage("Derive the integration by parts formula"); }}
                                className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-500/30 text-rose-200 text-xs font-medium transition cursor-pointer"
                              >
                                ∑ Mathematics
                              </button>
                              <button
                                type="button"
                                onClick={() => { setSelectedSubject('Biology'); handleSendMessage("Explain DNA replication process step by step"); }}
                                className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-500/30 text-rose-200 text-xs font-medium transition cursor-pointer"
                              >
                                🧬 Biology
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Editorial Display Serif Title */}
                          <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white">
                            {m.title || "Academic Explanation"}
                          </h2>

                          {/* Markdown & Display Equations Content */}
                          <FormattedAiMessage content={m.content} />
                        </>
                      )}

                      {/* Bottom Response Actions Bar */}
                      <div className="pt-3 border-t border-red-950/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopy(m.id, m.content)}
                            className="px-2.5 py-1 rounded-lg bg-[#140507] hover:bg-red-950/60 border border-red-950 text-[11px] text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === m.id ? "Copied" : "Copy"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendMessage("Please regenerate this explanation with further clarity.")}
                            className="px-2.5 py-1 rounded-lg bg-[#140507] hover:bg-red-950/60 border border-red-950 text-[11px] text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Regenerate</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendMessage("Explain this concept in simpler, more intuitive terms.")}
                            className="px-2.5 py-1 rounded-lg bg-[#140507] hover:bg-red-950/60 border border-red-950 text-[11px] text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-rose-400" />
                            <span>Explain Simpler</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendMessage("Explain this with deeper mathematical derivations and advanced mechanisms.")}
                            className="px-2.5 py-1 rounded-lg bg-[#140507] hover:bg-red-950/60 border border-red-950 text-[11px] text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-rose-400" />
                            <span>Explain Deeper</span>
                          </button>

                          <span className="text-slate-700">|</span>

                          <button
                            type="button"
                            onClick={() => {
                              setMessages(prev => prev.map(msg => msg.id === m.id ? { ...msg, feedback: 'like' } : msg));
                            }}
                            className={`p-1 rounded hover:text-white transition cursor-pointer ${m.feedback === 'like' ? 'text-emerald-400' : ''}`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMessages(prev => prev.map(msg => msg.id === m.id ? { ...msg, feedback: 'dislike' } : msg));
                            }}
                            className={`p-1 rounded hover:text-white transition cursor-pointer ${m.feedback === 'dislike' ? 'text-rose-400' : ''}`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-[10px] text-slate-500 font-mono">
                          ● {m.timestamp}
                        </div>
                      </div>
                    </div>

                    {/* Right Side Academic Telemetry & Key Concept Cards (Col Span 4) */}
                    <div className="lg:col-span-4 space-y-3.5">
                      
                      {/* 1. Key Concepts Card */}
                      <div className="rounded-2xl bg-[#0d0407]/90 border border-red-950/80 p-4 shadow-xl space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                          <div className="w-6 h-6 rounded-full bg-red-950 border border-red-500/30 flex items-center justify-center text-rose-300">
                            <BookOpen className="w-3 h-3" />
                          </div>
                          <span>Key Concepts</span>
                        </div>
                        <ul className="text-xs text-slate-300 space-y-1.5 pl-1 leading-relaxed">
                          {(m.keyConcepts || [
                            "V_max: maximum reaction velocity",
                            "K_m: Michaelis constant",
                            "[E_0]: total enzyme concentration",
                            "[S]: substrate concentration"
                          ]).map((concept, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-red-400 mt-1 shrink-0">•</span>
                              <span className="font-mono text-[11.5px]">{concept}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 2. Key Takeaway Card */}
                      <div className="rounded-2xl bg-[#0d0407]/90 border border-red-950/80 p-4 shadow-xl space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                          <div className="w-6 h-6 rounded-full bg-red-950 border border-red-500/30 flex items-center justify-center text-rose-300">
                            <Lightbulb className="w-3 h-3" />
                          </div>
                          <span>Key Takeaway</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans pl-1">
                          {m.keyTakeaway || "At high substrate concentration, the enzyme becomes saturated and the reaction rate approaches V_max."}
                        </p>
                      </div>

                      {/* 3. Related Topics Card */}
                      <div className="rounded-2xl bg-[#0d0407]/90 border border-red-950/80 p-4 shadow-xl space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                          <div className="w-6 h-6 rounded-full bg-red-950 border border-red-500/30 flex items-center justify-center text-rose-300">
                            <Atom className="w-3 h-3" />
                          </div>
                          <span>Related Topics</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(m.relatedTopics || ["Enzyme Kinetics", "Michaelis-Menten", "Biochemistry"]).map((topic, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSendMessage(`Explain ${topic} in detail`)}
                              className="px-2.5 py-1 rounded-full bg-[#160509] hover:bg-[#20080e] border border-red-950/80 hover:border-red-500/30 text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
                            >
                              {topic}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>
                );
              })}

              {/* Generating Animation */}
              {loading && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#0b0305]/95 border border-red-950 max-w-lg">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-950/60 border border-red-500/30 text-red-400">
                    <PiechemAiLogo size="xs" animated />
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-2.5">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce" />
                    </div>
                    <span className="bg-gradient-to-r from-red-400 via-rose-300 to-red-300 bg-clip-text text-transparent font-medium">
                      {language === 'bn' ? "পাইকেম এআই বিশ্লেষণ করছে..." : "PIECHEM AI analyzing & formulating answer..."}
                    </span>
                  </div>
                </div>
              )}

            </div>
          </main>

          {/* BOTTOM COMMAND CONSOLE: Matches Reference Image Exactly */}
          <footer className="relative z-30 shrink-0 border-t border-red-950/60 bg-[#060204]/95 px-4 sm:px-8 py-3 backdrop-blur-2xl">
            <div className="max-w-4xl mx-auto w-full space-y-2">
              
              {/* Main Console Capsule */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="rounded-2xl border border-red-950/80 bg-[#0c0305]/95 hover:border-red-900/60 focus-within:border-red-500/60 focus-within:shadow-[0_0_25px_rgba(239,68,68,0.22)] p-2.5 sm:p-3 transition-all shadow-2xl"
              >
                {/* Top Row: Contextual Pill Selectors */}
                <div className="flex items-center gap-2 mb-2">
                  {/* Subject Dropdown Pill */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSubjectMenu(prev => !prev)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#180509] border border-red-500/30 hover:border-red-500/60 text-xs font-semibold text-rose-200 transition cursor-pointer"
                    >
                      <span>{SUBJECT_ICONS[selectedSubject] || '🧪'}</span>
                      <span>{selectedSubject}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {showSubjectMenu && (
                      <div className="absolute left-0 bottom-full mb-2 w-44 rounded-xl bg-[#140507] border border-red-900/60 shadow-2xl p-1 z-50 animate-in fade-in slide-in-from-bottom-1">
                        {(['Chemistry', 'Physics', 'Mathematics', 'Biology', 'All STEM'] as const).map(subj => (
                          <button
                            key={subj}
                            type="button"
                            onClick={() => {
                              setSelectedSubject(subj);
                              setShowSubjectMenu(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                              selectedSubject === subj ? 'bg-red-500/20 text-rose-200 font-bold' : 'text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            <span>{SUBJECT_ICONS[subj]} {subj}</span>
                            {selectedSubject === subj && <Check className="w-3 h-3 text-red-400" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Level Dropdown Pill */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowConsoleLevelMenu(prev => !prev)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#180509] border border-red-500/30 hover:border-red-500/60 text-xs font-semibold text-rose-200 transition cursor-pointer"
                    >
                      <GraduationCap className="w-3 h-3 text-rose-400" />
                      <span className="capitalize">{level}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {showConsoleLevelMenu && (
                      <div className="absolute left-0 bottom-full mb-2 w-40 rounded-xl bg-[#140507] border border-red-900/60 shadow-2xl p-1 z-50 animate-in fade-in slide-in-from-bottom-1">
                        {(['beginner', 'intermediate', 'advanced'] as const).map(lvl => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => {
                              setLevel(lvl);
                              setShowConsoleLevelMenu(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer capitalize flex items-center justify-between ${
                              level === lvl ? 'bg-red-500/20 text-rose-200 font-bold' : 'text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            <span>{lvl}</span>
                            {level === lvl && <Check className="w-3 h-3 text-red-400" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Textarea */}
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
                  placeholder="Ask a question in Physics, Chemistry, Mathematics, or Biology..."
                  className="w-full resize-none bg-transparent px-3 py-1 text-sm text-white placeholder-slate-500 border-0 outline-none focus:outline-none focus:ring-0 focus:border-0 leading-relaxed font-sans no-scrollbar"
                  style={{ minHeight: "38px", maxHeight: "120px", scrollbarWidth: "none", msOverflowStyle: "none", outline: "none", boxShadow: "none" }}
                />

                {/* Bottom Controls Row inside Capsule */}
                <div className="flex items-center justify-between pt-1 px-1 border-t border-white/[0.04] mt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <button type="button" onClick={handleNewChat} title="Reset Chat" className="text-slate-500 hover:text-white transition cursor-pointer flex items-center"><RotateCcw className="w-3 h-3" /></button>
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
                      type="submit"
                      disabled={!input.trim() || loading}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white shadow-lg shadow-red-950/60 hover:brightness-110 active:scale-95 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </form>

              {/* Footer Disclaimer & Secure Portal */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-0.5">
                <div className="mx-auto text-center">
                  PIECHEM AI • Verify critical formulas for board and competitive exams.
                </div>
                <div className="hidden sm:flex items-center gap-1 text-slate-400">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Secure Learning Portal</span>
                </div>
              </div>

            </div>
          </footer>

        </div>

      </div>

    </div>
  );
}
