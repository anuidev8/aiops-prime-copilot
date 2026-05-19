"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PipelineStrip } from "@/shared/ui/layout/pipeline-strip";

interface AppTopBarProps {
  reportFocusMode?: boolean;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

export function AppTopBar({ reportFocusMode = false }: AppTopBarProps) {
  return (
    <header className="z-10 flex shrink-0 items-center justify-between border-b border-border/90 bg-white px-4 py-3 sm:px-6">
      
      <div className="flex-1" />

      <AnimatePresence initial={false}>
        {!reportFocusMode ? (
          <motion.div
            key="topbar-pipeline-strip"
            className="hidden flex-1 justify-center xl:flex"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: easeOut }}
          >
            <PipelineStrip />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex flex-1 shrink-0 items-center justify-end gap-3 sm:gap-4">
        <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-emerald-400/70 animate-ping-soft" />
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-emerald-700">Live</span>
        </div>

        <button
          type="button"
          className="rounded-full border border-border bg-white p-2 text-muted-foreground transition-colors hover:text-foreground shadow-sm"
          aria-label="Notifications"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        </button>

        <img 
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
          alt="User Avatar"
          className="h-9 w-9 rounded-full border border-border object-cover shadow-sm bg-secondary"
        />

        <button
          type="button"
          className="hidden xl:flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
          Report Lab
        </button>
      </div>
    </header>
  );
}

