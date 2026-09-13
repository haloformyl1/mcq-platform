"use client";

import { useState, useRef, useEffect } from "react";
import FormattedAiMessage from "./FormattedAiMessage";
import { 
  Sparkles, X, Send, Bot, User, Trash2, ArrowRight, 
  Atom, CheckCircle2, ChevronRight, BookOpen, Brain, 
  Languages, GraduationCap, Copy, Check, RefreshCw, Calendar, 
  Lightbulb, HelpCircle, Layers, FileText, Globe, Activity
} from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  groundedInPiechem?: boolean;
  sourceCategory?: 'PIECHEM_MATERIAL' | 'STUDENT_DATA' | 'GENERAL_ACADEMIC';
  citations?: string[];
  suggestedFollowUps?: string[];
  activeTopic?: string;
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
    chapter: "Periodic Table",
    topic: "Ionisation Energy"
  });

  const [activeTopic, setActiveTopic] = useState<string>("Ionisation Energy");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([
    "Why does atomic radius decrease across a period?",
    "Explain ionisation energy periodicity simply",
    "What are the exceptions in Period 2?",
    "Now quiz me on this with 3 MCQs"
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: language === 'bn' 
        ? "নমস্কার! আমি আপনার **PIECHEM এআই স্টাডি টিউটর**।\n\nরসায়ন, পদার্থবিদ্যা বা গণিতের যেকোনো সাধারণ প্রশ্ন নির্দ্বিধায় জিজ্ঞাসা করুন। আমি আপনার সাথে স্বাভাবিক কথোপকথনে ধারণা ব্যাখ্যা করতে, উদাহরণ দিতে, কুইজ নিতে এবং দুর্বল বিষয় শনাক্ত করতে প্রস্তুত।"
        : "Hello! I am your **PIECHEM AI Study Tutor**.\n\nAsk me any natural question across **Chemistry, Physics, Mathematics, Biology, or study strategies**. I maintain our conversational context, resolve follow-up questions, and can generate adaptive quizzes or progressive hints whenever you are ready!\n\nWhat would you like to explore or solve right now?",
      sourceCategory: 'GENERAL_ACADEMIC',
      groundedInPiechem: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (initialContext) {
      setContext(initialContext);
      if (initialContext.topic) setActiveTopic(initialContext.topic);
    }
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
        .slice(-8)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: questionText,
          message: questionText,
          mode,
          level,
          language,
          context: {
            ...context,
            topic: activeTopic
          },
          history
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to reach AI tutor");
      }

      if (data.activeTopic) {
        setActiveTopic(data.activeTopic);
      }

      if (data.suggestedFollowUps && data.suggestedFollowUps.length > 0) {
        setDynamicSuggestions(data.suggestedFollowUps);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || data.answer,
        groundedInPiechem: data.groundedInPiechem,
        sourceCategory: data.sourceCategory || (data.groundedInPiechem ? 'PIECHEM_MATERIAL' : 'GENERAL_ACADEMIC'),
        citations: data.sources || [],
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

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-fresh',
        role: 'assistant',
        content: language === 'bn'
          ? "কথোপকথন পরিষ্কার করা হয়েছে। আপনি আপনার যেকোনো নতুন প্রশ্ন জিজ্ঞাসা করতে পারেন।"
          : "Conversation cleared. Feel free to ask any academic question or explore a new concept!",
        sourceCategory: 'GENERAL_ACADEMIC',
        groundedInPiechem: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setDynamicSuggestions([
      "Explain periodicity of ionisation energy",
      "What is the difference between orbit and orbital?",
      "Why is nitrogen's first IE higher than oxygen?",
      "Now quiz me with 3 MCQs"
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
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
                    Open-Ended Core
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Conversational, multi-turn academic learning assistant</p>
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

          {/* Academic Context & Level Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/40 border border-white/5 px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 truncate max-w-full sm:max-w-md">
              <span className="font-semibold text-cyan-400 shrink-0">Active Topic:</span>
              <span className="text-cyan-200 font-medium truncate">
                {activeTopic || context.topic || context.chapter || 'Academic Concept'}
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

                <div className={`max-w-[88%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg ${
                  isUser 
                    ? 'bg-cyan-600 text-white rounded-br-xs' 
                    : 'bg-[#0e2233] border border-white/10 text-slate-200 rounded-bl-xs'
                }`}>
                  
                  {/* Source Transparency Badge */}
                  {!isUser && (
                    <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                      {m.sourceCategory === 'PIECHEM_MATERIAL' ? (
                        <div className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/40 shadow-sm">
                          <BookOpen className="h-3 w-3 text-emerald-400" />
                          <span>From PIECHEM Study Materials</span>
                        </div>
                      ) : m.sourceCategory === 'STUDENT_DATA' ? (
                        <div className="inline-flex items-center gap-1 rounded-full bg-cyan-950/80 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/40 shadow-sm">
                          <Activity className="h-3 w-3 text-cyan-400" />
                          <span>From Your PIECHEM Test Telemetry</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300 border border-white/10 shadow-sm">
                          <Globe className="h-3 w-3 text-slate-400" />
                          <span>General Academic Explanation</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  {isUser ? (
                    <div className="whitespace-pre-wrap break-words font-sans">
                      {m.content}
                    </div>
                  ) : (
                    <FormattedAiMessage content={m.content} />
                  )}

                  {/* Real Citations */}
                  {!isUser && m.citations && m.citations.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-slate-400">
                      <span className="font-semibold text-cyan-300">Source:</span> {m.citations.join(' • ')}
                    </div>
                  )}

                  {/* 1-Click Interactive Response Actions (Section 24) */}
                  {!isUser && m.id !== 'welcome' && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleSendMessage("Explain this more simply with an easy analogy")}
                        className="inline-flex items-center gap-1 rounded-md bg-white/5 hover:bg-cyan-950/60 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 px-2 py-1 text-[11px] text-slate-300 transition-all cursor-pointer"
                        title="Explain more simply"
                      >
                        <Lightbulb className="h-3 w-3 text-amber-400" />
                        <span>Simplify</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendMessage("Explain this with deeper reasoning, mechanisms, and exceptions")}
                        className="inline-flex items-center gap-1 rounded-md bg-white/5 hover:bg-cyan-950/60 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 px-2 py-1 text-[11px] text-slate-300 transition-all cursor-pointer"
                        title="Explain deeper"
                      >
                        <Atom className="h-3 w-3 text-cyan-400" />
                        <span>Deeper</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendMessage("Give me an intuitive everyday analogy for this concept")}
                        className="inline-flex items-center gap-1 rounded-md bg-white/5 hover:bg-cyan-950/60 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 px-2 py-1 text-[11px] text-slate-300 transition-all cursor-pointer"
                        title="Give analogy"
                      >
                        <Sparkles className="h-3 w-3 text-yellow-400" />
                        <span>Analogy</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendMessage("Now test me on this with 3 practice MCQs")}
                        className="inline-flex items-center gap-1 rounded-md bg-white/5 hover:bg-emerald-950/60 hover:text-emerald-300 border border-white/5 hover:border-emerald-500/30 px-2 py-1 text-[11px] text-slate-300 transition-all cursor-pointer"
                        title="Test me"
                      >
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span>Quiz Me</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendMessage("Explain this concept in Bengali (বাংলায় অনুবাদ ও ব্যাখ্যা করো)")}
                        className="inline-flex items-center gap-1 rounded-md bg-white/5 hover:bg-blue-950/60 hover:text-blue-300 border border-white/5 hover:border-blue-500/30 px-2 py-1 text-[11px] text-slate-300 transition-all cursor-pointer"
                        title="Bengali explanation"
                      >
                        <Languages className="h-3 w-3 text-blue-400" />
                        <span>বাংলা</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(m.id, m.content)}
                        className="inline-flex items-center gap-1 rounded-md bg-white/5 hover:bg-white/10 px-2 py-1 text-[11px] text-slate-400 hover:text-white transition-all cursor-pointer ml-auto"
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
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400/80 pt-1 border-t border-white/5">
                    <span>{m.timestamp}</span>
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

        {/* Suggested Dynamic Follow-Up Prompt Chips */}
        <div className="border-t border-white/10 bg-[#081a28] px-4 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase shrink-0">Follow-up:</span>
            {dynamicSuggestions.map((prompt, idx) => (
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
                    ? "যেকোনো অ্যাকাডেমিক প্রশ্ন বা ফলো-আপ জিজ্ঞাসা করুন..."
                    : "Ask any academic question, follow-up, or doubt (Chemistry, Physics, Math)..."
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
