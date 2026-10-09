import Link from "next/link";
import { ArrowLeft, History, ShieldAlert, Sparkles, Trash2 } from "lucide-react";

export default function RevertInfoPage() {
  return (
    <div className="min-h-screen bg-[#131314] text-slate-200 font-sans selection:bg-white/20">
      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white transition group mb-8">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <History className="w-8 h-8" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400 tracking-tight">
              Back to where I was
            </h1>
          </div>
          <p className="text-lg text-[#c4c7c5]">
            A powerful feature designed exclusively for the chat owner, allowing you to instantly restore a collaborative chat to its original state.
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-[#1e1f20] border border-white/10 rounded-2xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Instant Scrubbing</h3>
                <p className="text-[#c4c7c5] leading-relaxed text-sm sm:text-base">
                  When you click <strong>"Back to where I was"</strong>, the system intelligently scans the entire chat history. It identifies and permanently deletes all third-party messages sent by your collaborators, as well as the AI's direct replies to those specific messages. Your own original queries and the AI's replies to you remain perfectly intact.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1e1f20] border border-white/10 rounded-2xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Collaboration Revoked</h3>
                <p className="text-[#c4c7c5] leading-relaxed text-sm sm:text-base">
                  Clicking this button also immediately revokes the collaboration status for all participants. The chat is transformed back into a private session owned exclusively by you. 
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1e1f20] border border-white/10 rounded-2xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Isolated Read-Only Mode</h3>
                <p className="text-[#c4c7c5] leading-relaxed text-sm sm:text-base">
                  What happens to the other users? They won't be abruptly kicked out of their screen. Instead, their session silently forks. They can continue chatting with the AI locally on their device, but they lose all access to sync with your master copy. Their new messages will never appear on your screen, and they won't see anything new you type.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
