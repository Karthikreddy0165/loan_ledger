"use client";
import React from "react";
import { Loader2 } from "lucide-react";

interface PremiumLoaderProps {
  show: boolean;
  label?: string;
  fullscreen?: boolean;
}

export default function PremiumLoader({ show, label = "Loading...", fullscreen = true }: PremiumLoaderProps) {
  if (!show) return null;

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 dark:bg-black/60 backdrop-blur-sm transition-opacity">
        <div className="flex flex-col items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl max-w-xs text-center">
          <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-12 flex flex-col items-center justify-center gap-3 text-center">
      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
