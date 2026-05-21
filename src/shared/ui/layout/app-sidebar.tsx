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
    label: "Analysis",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m3 9 9-7 9 7" />
        <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
      </svg>
    ),
  },
  {
    id: "incidents",
    label: "Incidents",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3l-8.47-14.14a2 2 0 0 0-3.42 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    ),
  },
  {
    id: "services",
    label: "Services",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="6" height="6" rx="1" />
        <rect x="15" y="5" width="6" height="6" rx="1" />
        <rect x="9" y="13" width="6" height="6" rx="1" />
        <path d="M9 8h6" />
        <path d="M12 11v2" />
      </svg>
    ),
  },
  {
    id: "prime",
    label: "Reports",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
        <path d="M5 8V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3" />
        <path d="M9 15h6" />
        <path d="M9 18h4" />
      </svg>
    ),
  },
  {
    id: "recommendations",
    label: "Recommendations",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5" />
        <circle cx="12" cy="16" r="1" />
      </svg>
    ),
  },
  {
    id: "projects",
    label: "Projects",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L4.21 7.2a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.18A1.65 1.65 0 0 0 10.6 3.2V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.18a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.18a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    ),
  },
];

interface AppSidebarProps {
  activeId?: AppNavId;
  onSelect?: (id: AppNavId) => void;
}

export function AppSidebar({ activeId = "overview", onSelect }: AppSidebarProps) {
  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-slate-200 bg-white md:flex">
      <nav className="flex flex-col gap-1 px-3 py-4">
        {navItems.map((item) => {
          const active = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(item.id)}
              className={[
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              ].join(" ")}
            >
              <span className={active ? "text-indigo-700" : "text-slate-500"}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <SystemStatusPanel />
      </div>
    </aside>
  );
}
