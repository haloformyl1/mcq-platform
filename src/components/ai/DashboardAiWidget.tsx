"use client";

import { useState, useEffect } from "react";
import PiechemAiLogo from "./PiechemAiLogo";
import { Sparkles, Brain, AlertTriangle, ArrowRight, Target, Zap, BookOpen, Calendar, RefreshCw } from "lucide-react";

interface TopicMastery {
  subject: string;
  chapter: string;
  topic: string;
  masteryScore: number;
  confidence: 'high' | 'medium' | 'low';
  questionsAttempted: number;
  correct: number;
  incorrect: number;
  lastAttemptedAt?: string;
}

interface StudentLearningProfile {
  studentId: string;
  studentName: string;
  classLevel: string;
  subject: string;
  totalExamsTaken: number;
  overallAccuracy: number;
  weakTopics: TopicMastery[];
  strongTopics: TopicMastery[];
  recentMistakesSummary: string[];
  recommendedRevisionTopics: string[];
  recommendedDifficulty: 'Easy' | 'Moderate' | 'Difficult' | 'HOTS';
  lastUpdated: string;
}

interface DashboardAiWidgetProps {
  onOpenTutor?: (initialMode?: string, initialContext?: { subject?: string; chapter?: string; topic?: string }) => void;
  onOpenAdaptiveQuiz?: (topic?: string) => void;
}

export default function DashboardAiWidget({ onOpenTutor, onOpenAdaptiveQuiz }: DashboardAiWidgetProps) {
  const [profile, setProfile] = useState<StudentLearningProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/ai/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch (err) {
      console.error("Failed to load AI student profile:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const greeting = getGreeting();
  const studentFirstName = profile?.studentName ? profile.studentName.split(' ')[0] : 'Scholar';

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-[#061d2d]/90 via-[#0a1824]/90 to-[#02090e]/95 p-5 sm:p-6 backdrop-blur-xl shadow-2xl shadow-cyan-950/30 transition-all">
      {/* Background ambient glow effect */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-60 w-60 rounded-full bg-blue-600/10 blur-3xl" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950/60 border border-red-500/40 text-white shadow-lg shadow-red-950/50">
            <PiechemAiLogo size="sm" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-1.5">
                PIECHEM <span className="bg-gradient-to-r from-red-500 via-rose-400 to-red-400 bg-clip-text text-transparent font-black">AI</span>
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-950/80 px-2.5 py-0.5 text-[10px] font-bold text-red-300 border border-red-500/40 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                REDDISH BLACK AI
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {greeting}, <span className="text-cyan-200 font-semibold">{studentFirstName}</span>! Your personalized academic learning loop.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={fetchProfile}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh learning metrics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenTutor?.('tutor')}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-red-950/40 border border-red-500/30 transition-all active:scale-95 cursor-pointer"
          >
            <PiechemAiLogo size="xs" />
            <span>Ask PIECHEM AI</span>
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="relative z-10 mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Col 1: AI Directive Card */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-400" /> Today's AI Directive
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {profile?.recommendedDifficulty || 'Moderate'} Level
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {profile?.weakTopics && profile.weakTopics.length > 0 ? (
                <>
                  Focus 25 minutes revising <strong className="text-cyan-300 font-semibold">{profile.weakTopics[0].topic}</strong> in <span className="text-slate-300">{profile.weakTopics[0].chapter}</span> to boost your mastery from {profile.weakTopics[0].masteryScore}%.
                </>
              ) : (
                <>
                  Take your first test to unlock tailored AI weakness diagnostics, or start an adaptive chemistry drill now!
                </>
              )}
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenAdaptiveQuiz?.(profile?.weakTopics?.[0]?.topic)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-all active:scale-95 cursor-pointer"
            >
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              <span>Start Adaptive Drill</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenTutor?.('study_plan')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-950/70 hover:bg-blue-900 border border-blue-500/40 px-3 py-1.5 text-xs font-semibold text-blue-300 transition-all active:scale-95 cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5 text-blue-400" />
              <span>Generate 7-Day Plan</span>
            </button>
          </div>
        </div>

        {/* Col 2: Live Weak Topics Diagnostic */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Weak Topic Alerts
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              {profile?.weakTopics?.length || 0} Identified
            </span>
          </div>

          {loading ? (
            <div className="space-y-2 py-2">
              <div className="h-3 bg-white/10 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-white/10 rounded animate-pulse w-1/2" />
            </div>
          ) : profile?.weakTopics && profile.weakTopics.length > 0 ? (
            <div className="space-y-2.5">
              {profile.weakTopics.slice(0, 3).map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200 truncate max-w-[180px]" title={item.topic}>
                      {item.topic}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-amber-300">
                      {item.masteryScore}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-yellow-400 transition-all duration-500"
                      style={{ width: `${Math.max(item.masteryScore, 10)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{item.chapter}</span>
                    <span>{item.incorrect} mistakes in {item.questionsAttempted} Qs</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-400">
              <p>No critical weak spots detected yet!</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Take tests to generate real-time topic mastery telemetry.</p>
            </div>
          )}
        </div>

        {/* Col 3: AI Quick Study Pathways */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 mb-2.5">
              <BookOpen className="h-3.5 w-3.5 text-cyan-400" /> Quick AI Pathways
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => onOpenTutor?.('tutor', { chapter: 'Periodic Table', topic: 'Ionisation Energy' })}
                className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/5 hover:bg-cyan-950/40 hover:border-cyan-500/30 px-3 py-2 text-left transition-all cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 truncate">
                    Explain Periodicity of Ionisation Energy
                  </div>
                  <div className="text-[10px] text-slate-400">Concept + Exception rules</div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              <button
                type="button"
                onClick={() => onOpenTutor?.('revision', { chapter: 'Atomic Structure', topic: 'Quantum Numbers' })}
                className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/5 hover:bg-cyan-950/40 hover:border-cyan-500/30 px-3 py-2 text-left transition-all cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 truncate">
                    Quantum Numbers Revision & Rules
                  </div>
                  <div className="text-[10px] text-slate-400">Pauli, Hund, Aufbau summary</div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              <button
                type="button"
                onClick={() => onOpenTutor?.('doubt')}
                className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/5 hover:bg-cyan-950/40 hover:border-cyan-500/30 px-3 py-2 text-left transition-all cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 truncate">
                    Solve a Chemistry Doubt / Reaction
                  </div>
                  <div className="text-[10px] text-slate-400">Progressive pedagogical hints</div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Bilingual Support: <strong className="text-cyan-300">EN + বাংলা</strong></span>
            <span>Overall Accuracy: <strong className="text-emerald-400 font-mono">{profile?.overallAccuracy || 0}%</strong></span>
          </div>
        </div>

      </div>
    </section>
  );
}
