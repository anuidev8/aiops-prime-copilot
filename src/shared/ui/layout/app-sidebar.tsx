"use client";

import React from "react";
import { SystemStatusPanel } from "@/shared/ui/layout/system-status-panel";

export type AppNavId =
  | "overview"
  | "incidents"
  | "services"
  | "prime"
  | "recommendations"
  | "projects"
  | "settings";

type NavItem = {
  id: AppNavId;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
    ),
  },
  {
    id: "incidents",
    label: "Incidents",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
    ),
  },
  {
    id: "services",
    label: "Services",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
    ),
  },
  {
    id: "prime",
    label: "PRIME Report",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-3"/></svg>
    ),
  },
  {
    id: "recommendations",
    label: "Recommendations",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
    ),
  },
  {
    id: "projects",
    label: "Projects",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/></svg>
    ),
  },
];

interface AppSidebarProps {
  activeId?: AppNavId;
  onSelect?: (id: AppNavId) => void;
}

export function AppSidebar({ activeId = "overview", onSelect }: AppSidebarProps) {
  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col gap-1 p-4 border-r border-border/40 bg-background/40 backdrop-blur-xl h-full">
      <div className="flex items-center gap-2 px-2 py-3 mb-4">
        <div className="relative h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-[0_0_24px_hsl(var(--primary)/0.45)]">
          <span className="absolute inset-0 rounded-xl ring-1 ring-primary/40" />
          <span className="font-display font-bold text-primary-foreground text-sm relative">AI</span>
        </div>
        <div className="leading-tight">
          <div className="font-display font-semibold text-sm">PRIME</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Copilot</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const active = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(item.id)}
              className={[
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all w-full text-left",
                "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                active && "bg-secondary/70 text-foreground neon-ring",
              ].join(" ")}
            >
              <span className={active ? "text-primary" : ""}>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {active ? (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              ) : null}
            </button>
          );
        })}
      </nav>

      <SystemStatusPanel />
    </aside>
  );
}
