"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Sparkles, X, Send, Bot, User, Trash2, ArrowRight, 
  Atom, CheckCircle2, ChevronRight, BookOpen, Brain, 
  Languages, GraduationCap, Copy, Check, RefreshCw, Calendar, Lightbulb
} from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  groundedInPiechem?: boolean;
  citations?: string[];
  timestamp: string;
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

const CHAPTERS_AND_TOPICS: Record<string, string[]> = {
  "Periodic Table & Periodicity": [
    "Atomic Radius & Ionic Radius",
    "Ionisation Energy (IE) Trends & Exceptions",
    "Electron Gain Enthalpy",
    "Electronegativity (Pauling Scale)",
    "Diagonal Relationships"
  ],
  "Atomic Structure": [
    "Bohr Model & Rydberg Formula",
    "de Broglie Hypothesis & Heisenberg Uncertainty",
    "Quantum Numbers (n, l, m, s)",
    "Aufbau Principle, Pauli Exclusion & Hund's Rule",
    "Electronic Configurations & Half-filled Stability"
  ],
  "Chemical Bonding & Molecular Structure": [
    "Lewis Structures & Formal Charge",
    "VSEPR Theory & Molecular Geometry",
    "Hybridisation (sp, sp2, sp3, sp3d, sp3d2)",
    "Molecular Orbital Theory (MOT) & Bond Order",
    "Hydrogen Bonding & Dipole Moments"
  ],
  "Thermodynamics & Thermochemistry": [
    "First Law of Thermodynamics (ΔU = q + w)",
    "Enthalpy Changes (ΔH) & Hess's Law",
    "Entropy (ΔS) & Second Law",
    "Gibbs Free Energy (ΔG) & Spontaneity"
  ],
  "Organic Chemistry Fundamentals": [
    "IUPAC Nomenclature Rules",
    "Inductive & Electromeric Effects",
    "Resonance & Mesomeric Effects",
    "Hyperconjugation & Carbocation Stability",
    "Isomerism (Structural & Stereoisomerism)"
  ]
};

const MODE_PROMPTS: Record<string, string[]> = {
  tutor: [
    "Explain periodicity of ionisation energy across Period 2 & 3.",
    "Why does atomic radius decrease across a period?",
    "Why is first IE of Nitrogen higher than Oxygen?",
    "Teach me Quantum Numbers from basics with examples."
  ],
  practice: [
    "Give me 5 moderate MCQs from Atomic Structure with explanations.",
    "Quiz me on Periodic Trends exceptions.",
    "Generate 3 HOTS questions on Chemical Bonding.",
    "Give me 5 assertion-reason questions on Thermodynamics."
  ],
  doubt: [
    "Does SN1 substitution always produce a 100% racemic mixture?",
    "Why is pyridine more basic than pyrrole?",
    "Can a catalyst shift the equilibrium position of a reaction?",
    "Why does BF3 act as a Lewis acid despite having octet deficiency?"
  ],
  revision: [
    "Give me a 5-minute high-yield summary of Periodic Trends.",
    "Summarize all Quantum Numbers rules (Pauli, Hund, Aufbau).",
    "List common exam mistakes in VSEPR geometry.",
    "Important formula cheat-sheet for Thermodynamics."
  ],
  study_plan: [
    "Create a realistic 7-day Chemistry revision schedule for me.",
    "How should I revise Periodic Table and Atomic Structure in 3 days?",
    "Recommend a daily strategy for mastering my weak chapters."
  ]
};

export default function AiTutorDrawer({
  isOpen,
  onClose,
  initialMode = 'tutor',
  initialContext
}: AiTutorDrawerProps) {
  const [mode, setMode] = useState<'tutor' | 'practice' | 'doubt' | 'revision' | 'study_plan' | 'exam'>(initialMode);
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  
  const [context, setContext] = useState<AcademicContext>(initialContext || {
    subject: "Chemistry",
    className: "Class 11",
    chapter: "Periodic Table & Periodicity",
    topic: "Ionisation Energy (IE) Trends & Exceptions"
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: language === 'bn' 
        ? "নমস্কার! আমি আপনার **PIECHEM এআই স্টাডি টিউটর**।\n\nআমি আপনার রসায়ন ও বিজ্ঞান বিষয়ের সমস্ত ধারণা সহজভাবে বোঝাতে, কুইজ নিতে এবং পরীক্ষার জন্য প্রস্তুত করতে সাহায্য করব। আপনি যেকোনো প্রশ্ন বাংলা অথবা ইংরেজিতে জিজ্ঞাসা করতে পারেন!"
        : "Hello! I am your **PIECHEM AI Study Tutor**.\n\nI am connected to PIECHEM's academic syllabus and question vaults. I adapt to your level (Beginner, Intermediate, Advanced) and can explain concepts step-by-step, generate validated MCQs, or build custom revision plans.\n\nHow can I help your preparation today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (initialContext) setContext(initialContext);
  }, [initialContext]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const questionText = (textToSend || input).trim();
    if (!questionText || loading) return;

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
        .filter(m => m.id !== 'welcome')
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: questionText,
          mode,
          level,
          language,
          context,
          history
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to reach AI tutor");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        groundedInPiechem: data.groundedInPiechem,
        citations: data.citations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `**Notice**: ${err.message || "An unexpected error occurred. Please try asking again."}`,
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

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-fresh',
        role: 'assistant',
        content: language === 'bn'
          ? "কথোপকথন পরিষ্কার করা হয়েছে। আপনি আপনার নতুন প্রশ্ন জিজ্ঞাসা করতে পারেন।"
          : "Conversation cleared. Feel free to ask any new question or choose a topic to explore!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Drawer Container */}
      <div className="flex h-full w-full max-w-2xl flex-col bg-[#071622] border-l border-cyan-500/30 text-white shadow-2xl shadow-cyan-950/80 animate-in slide-in-from-right duration-300">
        
        {/* Top Navigation Bar */}
        <div className="border-b border-white/10 bg-[#091b29] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30">
                <Atom className="h-5 w-5 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base tracking-tight text-white">PIECHEM AI Tutor</h3>
                  <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/40">
                    Live Mentor
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Contextual pedagogical academic assistant</p>
              </div>
            </div>

            {/* Language Toggle & Close */}
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-white/10 bg-black/40 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-1 rounded-md font-semibold transition-all ${
                    language === 'en' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={`px-2 py-1 rounded-md font-semibold transition-all ${
                    language === 'bn' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  বাংলা
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
            {[
              { key: 'tutor', label: 'Tutor Mode', icon: GraduationCap },
              { key: 'practice', label: 'Practice MCQs', icon: CheckCircle2 },
              { key: 'doubt', label: 'Doubt Solver', icon: Lightbulb },
              { key: 'revision', label: 'Revision Notes', icon: BookOpen },
              { key: 'study_plan', label: 'Study Planner', icon: Calendar }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = mode === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setMode(tab.key as any)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 font-medium transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Academic Context & Level Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/40 border border-white/5 px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 truncate max-w-full sm:max-w-md">
              <span className="font-semibold text-cyan-400 shrink-0">Context:</span>
              <span className="text-slate-400 truncate">
                {context.subject} &rarr; {context.chapter || 'All Chapters'} {context.topic ? `&rarr; ${context.topic}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Level:</span>
              {(['beginner', 'intermediate', 'advanced'] as const).map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold transition-all ${
                    level === lvl 
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {lvl[0].toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Message Conversation Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-300 mt-1">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg ${
                  isUser 
                    ? 'bg-cyan-600 text-white rounded-br-xs' 
                    : 'bg-[#0e2233] border border-white/10 text-slate-200 rounded-bl-xs'
                }`}>
                  
                  {/* Grounded Badge */}
                  {!isUser && m.groundedInPiechem && (
                    <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-cyan-950/80 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
                      <BookOpen className="h-3 w-3" />
                      <span>Grounded in PIECHEM Study Vault</span>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="whitespace-pre-wrap break-words font-sans">
                    {m.content}
                  </div>

                  {/* Citations / Sources */}
                  {!isUser && m.citations && m.citations.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-slate-400">
                      <span className="font-semibold text-cyan-300">Sources:</span> {m.citations.join(', ')}
                    </div>
                  )}

                  {/* Footer & Copy */}
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400/80 pt-1 border-t border-white/5">
                    <span>{m.timestamp}</span>
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopy(m.id, m.content)}
                        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                        title="Copy text"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="h-3 w-3 text-green-400" />
                            <span className="text-green-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300 mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                <Bot className="h-4 w-4 animate-bounce" />
              </div>
              <div className="rounded-2xl rounded-bl-xs bg-[#0e2233] border border-white/10 p-3 text-xs text-cyan-300 flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Formulating pedagogical explanation...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div className="border-t border-white/10 bg-[#081a28] px-4 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase shrink-0">Quick Ask:</span>
            {(MODE_PROMPTS[mode] || MODE_PROMPTS.tutor).map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                className="whitespace-nowrap rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:bg-cyan-950 hover:border-cyan-500/40 hover:text-cyan-200 transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input & Controls */}
        <div className="border-t border-white/10 bg-[#091b29] p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="relative flex-1">
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
                rows={2}
                placeholder={
                  language === 'bn'
                    ? "রসায়ন সম্পর্কে যেকোনো প্রশ্ন জিজ্ঞাসা করুন..."
                    : "Ask anything about this chapter, concept, or doubt..."
                }
                className="w-full resize-none rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={handleClearChat}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-red-950/50 hover:text-red-300 transition-colors cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="rounded-xl bg-cyan-600 hover:bg-cyan-500 p-2.5 text-white shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
