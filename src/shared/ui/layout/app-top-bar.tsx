"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PipelineStrip } from "@/shared/ui/layout/pipeline-strip";

interface AppTopBarProps {
  reportFocusMode?: boolean;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

export function AppTopBar({ reportFocusMode = false }: AppTopBarProps) {
  return (
    <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex w-64 shrink-0 items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-lg font-bold text-indigo-600">
          A
        </div>
        <div className="flex gap-1 text-lg font-semibold">
          <span className="text-slate-900">AIOps</span>
          <span className="text-indigo-600">Prime Copilot</span>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!reportFocusMode ? (
          <motion.div
            key="topbar-pipeline-strip"
            className="hidden flex-1 justify-center px-8 xl:flex"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: easeOut }}
          >
            <PipelineStrip />
          </motion.div>
        ) : (
          <div className="hidden flex-1 xl:block" />
        )}
      </AnimatePresence>

      <div className="flex shrink-0 items-center justify-end gap-3 sm:gap-4">
        <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 sm:flex">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Live
        </div>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
          aria-label="Notifications"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        </button>

        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
          alt="User Avatar"
          className="h-9 w-9 rounded-full border border-slate-200 bg-slate-100 object-cover"
        />

        <button
          type="button"
          className="hidden items-center gap-2 rounded-md border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100 xl:flex"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
          Report Lab
        </button>
      </div>
    </header>
  );
}
