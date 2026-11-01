"use client";

import React from "react";
import { Eye, Video, ExternalLink } from "lucide-react";
import { useSession } from "next-auth/react";

export default function DemoBanner() {
  const { data: session } = useSession();
  const isDemo = Boolean(session?.user?.isDemo || session?.user?.email?.toLowerCase() === "test@example.com");

  if (!isDemo) return null;

  return (
    <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 text-xs">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            View-Only Mode
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            Logged in as test user. You can view all data, but actions to add, edit, or delete are disabled.
          </span>
        </div>
        <a
          href="https://youtu.be/PTNaDfRTGJ8"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <Video className="w-3.5 h-3.5" />
          <span>Walkthrough Video</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
