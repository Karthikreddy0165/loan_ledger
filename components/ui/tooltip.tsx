'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
  className?: string;
}

export function InfoTooltip({ content, className = '' }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className={`relative inline-flex items-center align-middle ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      <button
        type="button"
        tabIndex={0}
        aria-label="More information"
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded cursor-help focus:outline-none"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isVisible && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 sm:w-56 p-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[11px] font-normal rounded-lg shadow-lg z-50 pointer-events-none leading-relaxed text-center"
        >
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-100" />
        </span>
      )}
    </span>
  );
}

