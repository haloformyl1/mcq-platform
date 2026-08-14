"use client";

import { useEffect, useState } from "react";

const PI_DIGITS = "3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647093844609550582231725359408128481117450284102701938521105559644622948954930381964428810975";

export default function PiFiringLoader({ fullScreen = true }: { fullScreen?: boolean }) {
  const [digitCount, setDigitCount] = useState(4);
  const [beams, setBeams] = useState<Array<{ id: number; top: number; speed: number; delay: number; text: string }>>([]);

  // Continuously expand Pi digits firing stream
  useEffect(() => {
    const interval = setInterval(() => {
      setDigitCount(prev => (prev >= 120 ? 4 : prev + 2));
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Generate dynamic laser beams firing horizontally
  useEffect(() => {
    const generatedBeams = Array.from({ length: 8 }).map((_, i) => {
      const startIdx = (i * 15) % (PI_DIGITS.length - 20);
      return {
        id: i,
        top: 10 + i * 11,
        speed: 1.5 + (i % 3) * 0.8,
        delay: (i * 0.3) % 2,
        text: PI_DIGITS.slice(startIdx, startIdx + 25)
      };
    });
    setBeams(generatedBeams);
  }, []);

  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#04131d] via-[#020b12] to-[#000508] text-white overflow-hidden font-mono"
    : "w-full py-16 flex flex-col items-center justify-center bg-[#071926]/60 rounded-xl border border-[#0099ff]/30 text-white overflow-hidden font-mono relative backdrop-blur-md";

  return (
    <div className={containerClasses}>
      {/* Background firing Pi laser streams */}
      <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
        {beams.map(b => (
          <div
            key={b.id}
            className="absolute whitespace-nowrap text-xs text-[#00e5ff] tracking-widest font-bold animate-pulse"
            style={{
              top: `${b.top}%`,
              left: '-20%',
              animation: `piFly ${b.speed}s linear infinite`,
              animationDelay: `${b.delay}s`,
              textShadow: '0 0 10px #00e5ff, 0 0 20px #0099ff'
            }}
          >
            {b.text}
          </div>
        ))}
      </div>

      {/* Central Pi Energy Core */}
      <div className="relative flex flex-col items-center justify-center z-10 space-y-6">
        {/* Pulsing Neon Ring with Pi symbol */}
        <div className="relative flex items-center justify-center w-28 h-28">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#0099ff] animate-[spin_6s_linear_infinite] opacity-60"></div>
          {/* Inner pulsing aura */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-[#0099ff]/30 to-[#00e5ff]/20 blur-md animate-ping opacity-40"></div>
          {/* Core Pi Badge */}
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#0a2538] to-[#02101a] border border-[#00e5ff]/60 flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.4)]">
            <span className="text-4xl font-extrabold text-[#00e5ff] drop-shadow-[0_0_12px_#00e5ff]">
              π
            </span>
          </div>
        </div>

        {/* Firing Pi Value Stream */}
        <div className="flex flex-col items-center space-y-2 px-6 max-w-xl text-center">
          <div className="text-sm font-semibold tracking-wider text-[#7dd3fc] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-ping"></span>
            <span className="text-[#00e5ff] font-bold">π</span> = {PI_DIGITS.slice(0, digitCount)}
            <span className="animate-pulse text-[#00e5ff]">▌</span>
          </div>

          {/* Particle energy beam bar */}
          <div className="w-64 h-1.5 bg-[#0c2a3e] rounded-full overflow-hidden border border-[#00e5ff]/30 relative shadow-[0_0_10px_rgba(0,229,255,0.3)]">
            <div className="h-full bg-gradient-to-r from-[#0099ff] via-[#00e5ff] to-[#38bdf8] w-1/2 rounded-full animate-[piBeam_1.2s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </div>

      {/* Global CSS animations for Pi stream */}
      <style jsx>{`
        @keyframes piFly {
          0% {
            transform: translateX(-10%);
            opacity: 0.1;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translateX(120vw);
            opacity: 0.1;
          }
        }
        @keyframes piBeam {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
}
