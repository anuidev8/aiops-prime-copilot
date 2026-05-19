"use client";

import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import { AnalysisAgentStatus } from "@/shared/types/analysis-progress";

const STAGES = ["Scope", "Telemetry", "Analysis", "Reporting", "Ready"] as const;

function mapStepStatus(
  index: number,
  statuses: AnalysisAgentStatus[],
): AnalysisAgentStatus {
  if (index < 4) return statuses[index] ?? "pending";
  return statuses[3] === "complete" ? "complete" : "pending";
}

export function PipelineStrip() {
  const { agentPipeline, isAnalyzing } = useAIOpsSession();
  const statuses = agentPipeline.map((step) => step.status);

  const visible =
    isAnalyzing || statuses.some((status) => status === "running" || status === "complete" || status === "error");

  if (!visible) return null;

  return (
    <div className="hidden items-center gap-2 rounded-full border border-border bg-white px-4 py-2 shadow-[0_10px_30px_-24px_hsl(225_35%_30%/0.55)] lg:flex">
      {STAGES.map((stage, index) => {
        const status = mapStepStatus(index, statuses);
        const active = status === "running";
        const done = status === "complete";
        const errored = status === "error";

        return (
          <div key={stage} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={[
                  "flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-semibold",
                  done
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : errored
                        ? "border-rose-300 bg-rose-50 text-rose-700"
                        : "border-border bg-secondary text-muted-foreground",
                ].join(" ")}
              >
                {done ? "✓" : index + 1}
              </span>
              <span
                className={[
                  "text-xs font-medium",
                  active ? "text-foreground" : done ? "text-foreground/85" : "text-muted-foreground",
                ].join(" ")}
              >
                {stage}
              </span>
            </div>
            {index < STAGES.length - 1 ? (
              <span
                className={[
                  "h-px w-6",
                  done ? "bg-emerald-300" : active ? "bg-primary/40" : "bg-border",
                ].join(" ")}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
