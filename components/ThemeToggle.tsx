"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-between w-16 h-8 p-1.5 rounded-full cursor-pointer bg-white/[0.04] dark:bg-[#111626] border border-white/[0.08] shadow-inner select-none transition-all duration-300 hover:scale-105 active:scale-95 group focus:outline-none"
      aria-label="Toggle theme"
    >
      {/* Glow Effect */}
      <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r from-blue-500 to-indigo-500 blur-sm pointer-events-none" />

      {/* Slider Pill */}
      <div
        className={`absolute w-6.5 h-6.5 rounded-full bg-slate-800 dark:bg-white border border-white/[0.08] transition-all duration-300 ${
          theme === "dark" 
            ? "translate-x-6.5 bg-indigo-500/5 dark:bg-slate-800" 
            : "translate-x-0"
        }`}
      >
        <span className="absolute inset-0 rounded-full scale-75 opacity-0 dark:opacity-100 transition-opacity duration-300 bg-blue-500/10 blur-[2px]" />
      </div>

      {/* Sun Icon */}
      <div className={`z-10 flex items-center justify-center w-6 h-6 transition-all duration-300 ${theme === "light" ? "scale-110 rotate-45 text-amber-500" : "scale-90 text-slate-500 dark:text-slate-600"}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
      </div>

      {/* Moon Icon */}
      <div className={`z-10 flex items-center justify-center w-6 h-6 transition-all duration-300 ${theme === "dark" ? "scale-110 -rotate-12 text-blue-400" : "scale-90 text-slate-500 dark:text-slate-600"}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
        </svg>
      </div>
    </button>
  );
}
