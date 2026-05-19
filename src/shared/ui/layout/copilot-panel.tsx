"use client";

import { PropsWithChildren } from "react";

interface CopilotPanelProps extends PropsWithChildren {
  className?: string;
}

export function CopilotPanel({ children, className }: CopilotPanelProps) {
  return (
    <div
      className={[
        "h-full min-h-[70vh] lg:min-h-[calc(100vh-10rem)] flex flex-col glass-strong rounded-2xl overflow-hidden",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 shrink-0">
        <div className="relative h-8 w-8 rounded-xl bg-gradient-primary grid place-items-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-foreground"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-background" />
        </div>
        <div className="leading-tight min-w-0">
          <div className="font-display font-semibold text-sm">AIOps Copilot</div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Online · streaming telemetry
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative">{children}</div>
    </div>
  );
}
