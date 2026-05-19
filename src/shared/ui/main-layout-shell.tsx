"use client";

import React from "react";

const mobileNavIcons = [
  <svg key="1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  <svg key="2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  <svg key="3" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>,
  <svg key="4" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h4l2-9 4 18 2-9h4"/></svg>,
  <svg key="5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/></svg>,
];

export function MainLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full text-foreground font-sans overflow-hidden relative">
      <aside className="md:hidden w-[72px] h-full flex flex-col items-center py-6 border-r border-border/40 bg-background/40 backdrop-blur-xl z-10 shrink-0">
        <div className="relative w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center mb-8 shadow-[0_0_24px_hsl(var(--primary)/0.45)]">
          <span className="font-display font-bold text-primary-foreground text-sm relative">A</span>
        </div>
        <nav className="flex flex-col gap-2 w-full items-center">
          {mobileNavIcons.map((icon, i) => (
            <button
              key={i}
              type="button"
              className={[
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                i === 0
                  ? "text-primary bg-secondary/70 neon-ring"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
              ].join(" ")}
            >
              {icon}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col relative h-full min-w-0 overflow-hidden">
        {children}

        <div className="absolute top-[18%] left-[8%] w-[480px] h-[480px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[18%] right-[8%] w-[560px] h-[560px] bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none" />
      </div>
    </div>
  );
}
