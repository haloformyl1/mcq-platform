import React from 'react';
import Link from 'next/link';

export default function AboutAiPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 selection:bg-cyan-500/30 font-sans selection:text-white flex flex-col items-center">
      
      {/* Header */}
      <header className="w-full flex items-center justify-between p-6 max-w-6xl mx-auto border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            P
          </div>
          <span className="font-bold tracking-wider uppercase text-white">PIECHEM AI</span>
        </Link>
        <Link 
          href="/dashboard"
          className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors"
        >
          Dashboard
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-16 sm:py-24">
        <div className="flex flex-col items-center text-center mb-16 animate-in slide-in-from-bottom-4 fade-in duration-700">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 mb-6">
            The Future of Chemical Education
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
            PIECHEM AI is a next-generation academic assistant, specifically fine-tuned for chemistry students. 
            Experience unparalleled real-time collaboration, step-by-step problem solving, and intelligent memory storage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-[#141517] border border-white/5 p-8 rounded-3xl hover:border-white/10 transition-colors animate-in slide-in-from-bottom-8 fade-in duration-700 delay-100">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Collaborative Intelligence</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              Work together with your peers. Our unique collaborative chat interface allows multiple students to interact with the AI simultaneously, just like a WhatsApp group but supercharged with AI.
            </p>
          </div>

          <div className="bg-[#141517] border border-white/5 p-8 rounded-3xl hover:border-white/10 transition-colors animate-in slide-in-from-bottom-8 fade-in duration-700 delay-200">
            <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Academic Excellence</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              Trained on vast datasets of chemical literature and formulas. From balancing complex equations to understanding molecular structures, PIECHEM AI provides deep, structured, and accurate academic insights.
            </p>
          </div>

          <div className="bg-[#141517] border border-white/5 p-8 rounded-3xl hover:border-white/10 transition-colors animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300 md:col-span-2">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m3 7 9-5 9 5"/><path d="m3 17 9 5 9-5"/></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Uncompromised Design</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              We believe a learning tool should feel premium. With an immersive OLED-dark layout, fast fluid animations, and zero clutter, your focus stays entirely on learning.
            </p>
          </div>

        </div>

      </main>

      <footer className="w-full text-center py-8 text-xs text-slate-600 border-t border-white/5 mt-auto">
        &copy; {new Date().getFullYear()} PIECHEM. An initiative by Arghyadeep Roy.
      </footer>
    </div>
  );
}
