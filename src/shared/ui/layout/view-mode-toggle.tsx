"use client";

import { motion } from "framer-motion";

export type WorkspaceViewMode = "dashboard" | "chat" | "split" | "avatar";

interface ViewModeToggleProps {
  value: WorkspaceViewMode;
  onChange: (mode: WorkspaceViewMode) => void;
}

const MODES: Array<{ id: WorkspaceViewMode; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "chat", label: "Chat" },
  { id: "split", label: "Split" },
  { id: "avatar", label: "Avatar" },
];

const pillTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 32,
};

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <motion.div
      layout
      className="relative inline-flex p-1 rounded-xl bg-secondary/50 border border-border/40"
    >
      {MODES.map((mode) => {
        const active = value === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={[
              "relative z-10 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors min-w-[4.5rem]",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {active ? (
              <motion.span
                layoutId="workspace-view-mode-pill"
                className="absolute inset-0 rounded-lg bg-gradient-primary shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.6)]"
                transition={pillTransition}
              />
            ) : null}
            <span className="relative">{mode.label}</span>
          </button>
        );
      })}
    </motion.div>
  );
}
