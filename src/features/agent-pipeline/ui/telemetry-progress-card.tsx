"use client";

import { AnalysisAgentStep } from "@/shared/types/analysis-progress";

function statusIcon(status: AnalysisAgentStep["status"]): string {
  if (status === "complete") return "✓";
  if (status === "running") return "⏳";
  if (status === "error") return "✕";
  return "○";
}

interface TelemetryProgressCardProps {
  headline?: string;
  steps: AnalysisAgentStep[];
}

export function TelemetryProgressCard({
  headline = "Pipeline progress",
  steps,
}: TelemetryProgressCardProps) {
  const visibleSteps = steps.filter((step) => step.status !== "pending");
  if (visibleSteps.length === 0) {
    return null;
  }

  const completed = visibleSteps.filter((step) => step.status === "complete").length;

  return (
    <div className="my-2 rounded-xl border border-border/50 bg-secondary/25 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">{headline}</p>
        <p className="text-[10px] text-muted-foreground">
          {completed}/{steps.length} complete
        </p>
      </div>
      <ul className="space-y-1.5">
        {visibleSteps.map((step) => (
          <li
            key={step.id}
            className="flex items-start gap-2 rounded-lg border border-border/30 bg-background/50 px-2.5 py-1.5 text-xs"
          >
            <span className="mt-0.5 shrink-0">{statusIcon(step.status)}</span>
            <div className="min-w-0">
              <p className="font-medium text-foreground">{step.label}</p>
              <p className="text-muted-foreground">{step.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
