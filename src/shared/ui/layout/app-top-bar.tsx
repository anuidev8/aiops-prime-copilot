"use client";

import { PipelineStrip } from "@/shared/ui/layout/pipeline-strip";

export function AppTopBar() {
  return (
    <header className="flex items-center gap-4 px-4 sm:px-6 py-3 border-b border-border/40 bg-background/30 backdrop-blur-xl shrink-0 z-10">
      <div className="font-display font-semibold text-base tracking-tight shrink-0">
        AIOps <span className="neon-text">Prime</span> Copilot
      </div>

      <div className="hidden sm:flex items-center gap-2">
        <ScopeSelector label="All services" />
        <ScopeSelector label="Last 60 min" />
      </div>

      <PipelineStrip />

      <div className="ml-auto flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 glass rounded-full px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-success animate-ping-soft" />
            <span className="h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-xs font-semibold tracking-wide">LIVE</span>
        </div>
        <button
          type="button"
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          aria-label="Notifications"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        </button>
        <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-border/60">
          <img
            src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
            alt="User avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}

function ScopeSelector({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary/40 hover:bg-secondary/70 border border-border/40 transition-colors"
    >
      {label}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
    </button>
  );
}
