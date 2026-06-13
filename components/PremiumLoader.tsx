"use client";
import React, { useEffect, useState } from "react";

interface PremiumLoaderProps {
  show: boolean;
  label?: string;
  fullscreen?: boolean;
}

const TECH_PHRASES = [
  "RECONCILING LEDGER BALANCES",
  "DECOUPLING TRANSACTION RECORDS",
  "ESTABLISHING SECURE CONNECTION",
  "CALCULATING REAL-TIME INTEREST",
  "SYNTHESIZING DEFAULTER DATA"
];

export default function PremiumLoader({ show, label, fullscreen = true }: PremiumLoaderProps) {
  const [render, setRender] = useState(show);
  const [animate, setAnimate] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [phrase, setPhrase] = useState(TECH_PHRASES[0]);

  // Rotate phrases
  useEffect(() => {
    if (!render) return;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * TECH_PHRASES.length);
      setPhrase(TECH_PHRASES[randomIdx]);
    }, 1800);
    return () => clearInterval(interval);
  }, [render]);

  // Smooth Fade-In and Fade-Out with Minimum Duration of 500ms
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let fadeOutTimeoutId: NodeJS.Timeout;

    if (show) {
      setRender(true);
      setStartTime(Date.now());
      timeoutId = setTimeout(() => {
        setAnimate(true);
      }, 30);
    } else {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 500 - elapsed);

      timeoutId = setTimeout(() => {
        setAnimate(false);
        fadeOutTimeoutId = setTimeout(() => {
          setRender(false);
        }, 300); // Duration of transition-opacity
      }, remaining);
    }

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(fadeOutTimeoutId);
    };
  }, [show, startTime]);

  if (!render) return null;

  const containerClass = fullscreen
    ? `fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0e1a]/85 dark:bg-[#0a0e1a]/85 backdrop-blur-md transition-all duration-300 ease-in-out ${
        animate ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      }`
    : `relative w-full py-16 flex flex-col items-center justify-center bg-white/[0.04] backdrop-blur-sm rounded-[2rem] border border-white/[0.05] min-h-[300px] transition-all duration-300 ease-in-out ${
        animate ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      }`;

  return (
    <div className={containerClass}>
      <div className="relative w-36 h-36 flex items-center justify-center animate-holo-float">
        {/* Outer Tech Ring */}
        <div className="absolute inset-0 rounded-full border border-dashed border-blue-500/30 animate-holo-spin-right" />
        
        {/* Middle Tech Ring */}
        <div className="absolute inset-2 rounded-full border border-dotted border-indigo-500/40 animate-holo-spin-left" />

        {/* Inner Laser Ring */}
        <div className="absolute inset-5 rounded-full border border-white/[0.05] flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 border border-blue-500/40 flex items-center justify-center animate-holo-pulse shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <span className="text-[9px] font-black text-blue-400 tracking-tighter italic">LEDGER</span>
          </div>
        </div>

        {/* Scan Bar Effect */}
        <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_10px_#60a5fa] animate-holo-scan" />
      </div>

      {/* Loading Info Panel */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-[10px] font-black text-slate-400 tracking-[0.25em] uppercase px-4 max-w-sm mx-auto min-h-[14px]">
          {label || phrase}
        </p>
        <div className="flex items-center justify-center gap-1.5 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
          <span>SYSTEM ACTIVE</span>
          <span className="text-slate-650">|</span>
          <span className="text-blue-500/80">LATENCY 8MS</span>
        </div>
      </div>
    </div>
  );
}
