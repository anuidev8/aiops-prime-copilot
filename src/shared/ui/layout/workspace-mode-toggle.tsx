"use client";

import { WorkspaceMode } from "@/shared/types/report-canvas";

interface WorkspaceModeToggleProps {
  value: WorkspaceMode;
  generating?: boolean;
  onChange: (mode: WorkspaceMode) => void;
}

const MODES: Array<{ id: WorkspaceMode; label: string }> = [
  { id: "analysis", label: "Analysis" },
  { id: "report-canvas", label: "Report Canvas" },
];

export function WorkspaceModeToggle({
  value,
  generating = false,
  onChange,
}: WorkspaceModeToggleProps) {
  return (
    <div className="inline-flex items-center rounded-xl border border-border/40 bg-secondary/40 p-1">
      {MODES.map((mode) => {
        const active = value === mode.id;
        const isReportMode = mode.id === "report-canvas";
        return (
          <button
            key={mode.id}
            type="button"
            disabled={generating && mode.id === "analysis"}
            onClick={() => onChange(mode.id)}
            className={[
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
              generating && mode.id === "analysis" ? "cursor-not-allowed opacity-50" : "",
            ].join(" ")}
          >
            {isReportMode && generating ? "Building…" : mode.label}
          </button>
        );
      })}
    </div>
  );
}
