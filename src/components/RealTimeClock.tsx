"use client";

import { useEffect, useState } from "react";

export default function RealTimeClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  // Format: Sat Oct 10 4:08:10 PM
  const formattedString = time.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).replace(/,/g, '');

  return (
    <div className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider drop-shadow-[0_0_8px_rgba(34,211,238,0.3)] select-none">
      {formattedString}
    </div>
  );
}
