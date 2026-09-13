"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, MessageSquare, X, Send, Bot, User, Trash2, ArrowRight, Atom, CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";

const SUGGESTED_DOUBTS = [
  "Explain SN1 vs SN2 mechanism and stereochemistry",
  "How to calculate cell EMF using Nernst Equation?",
  "Difference between Aldol and Cannizzaro Reaction",
  "Crystal Field Splitting in Octahedral complexes"
];

export default function AiChemistTutorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; model?: string }>>([
    {
      role: 'assistant',
      content: "Hello! I am your **Pi-Chem AI Chemistry Tutor**. Ask me anything about Physical Chemistry derivations, Organic reaction mechanisms, or Inorganic periodic trends for NEET, JEE & Boards!"
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const question = textToSend || input;
    if (!question.trim() || loading) return;

    const newMessages = [...messages, { role: 'user' as const, content: question.trim() }];
    setMessages(newMessages);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: question.trim(),
          history: messages.slice(-4)
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          model: data.model
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I encountered an issue generating an answer. Please verify your connection or try another doubt."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared. What chemistry topic would you like to explore?"
      }
    ]);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs sm:text-sm shadow-[0_0_30px_rgba(0,195,255,0.4)] hover:shadow-[0_0_40px_rgba(0,195,255,0.6)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer border border-cyan-400/40"
          title="Open AI Chemistry Tutor"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <Sparkles className="w-4 h-4 text-cyan-200" />
          <span className="font-bold tracking-wide">Pi-Chem AI Tutor</span>
        </button>
      </div>

      {/* Slide-out / Modal Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#06121f] border border-cyan-500/40 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-xl h-[85vh] sm:h-[750px] max-h-[92vh] flex flex-col shadow-2xl shadow-cyan-950/90 overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            
            {/* Top Bar */}
            <div className="px-5 py-4 bg-[#030910] border-b border-cyan-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30">
                  <Atom className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm">Pi-Chem AI Tutor</h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      NEET • JEE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Step-by-step chemistry doubts & mechanisms</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClear}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-4 py-2.5 bg-[#040e1a] border-b border-cyan-950/60 overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Try:</span>
              {SUGGESTED_DOUBTS.map((doubt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(doubt)}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/40 whitespace-nowrap shrink-0 transition"
                >
                  {doubt}
                </button>
              ))}
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={index} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div className={`max-w-[85%] p-3.5 sm:p-4 rounded-2xl leading-relaxed whitespace-pre-line ${
                      isUser
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none shadow-md'
                        : 'bg-[#040c14] border border-cyan-900/40 text-slate-200 rounded-bl-none shadow-sm'
                    }`}>
                      {msg.content}
                    </div>

                    {isUser && (
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-3 justify-start items-center">
                  <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="bg-[#040c14] border border-cyan-900/40 text-cyan-300 px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Analyzing chemistry principles...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 bg-[#030910] border-t border-cyan-900/40">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a chemistry doubt or reaction mechanism..."
                  className="flex-1 bg-[#050e17] border border-cyan-950 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition disabled:opacity-50 shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
