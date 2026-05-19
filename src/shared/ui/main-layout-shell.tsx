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
    <div className="relative flex h-screen w-full overflow-hidden font-sans text-foreground">
      <aside className="z-10 hidden h-full w-[74px] shrink-0 flex-col items-center border-r border-border/80 bg-white/85 py-6 backdrop-blur-xl md:flex lg:hidden">
        <div className="mb-8 grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-sm font-bold text-primary-foreground shadow-[0_12px_24px_-14px_hsl(var(--primary)/0.8)]">
          A
        </div>
        <nav className="flex w-full flex-col items-center gap-2 px-2">
          {mobileNavIcons.map((icon, index) => (
            <button
              key={index}
              type="button"
              className={[
                "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                index === 0
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              ].join(" ")}
            >
              {icon}
            </button>
          ))}
        </nav>
      </aside>

      <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {children}

        <div className="pointer-events-none absolute -top-40 left-16 h-[420px] w-[420px] rounded-full bg-[hsl(var(--primary)/0.08)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-10 h-[420px] w-[420px] rounded-full bg-[hsl(var(--primary-glow)/0.1)] blur-3xl" />
      </div>
    </div>
  );
}
