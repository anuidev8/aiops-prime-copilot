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
  const statuses = agentPipeline.map((s) => s.status);

  const visible =
    isAnalyzing || statuses.some((s) => s === "running" || s === "complete" || s === "error");

  if (!visible) return null;

  const runningIndex = STAGES.findIndex((_, i) => mapStepStatus(i, statuses) === "running");
  const stageIndex =
    runningIndex >= 0
      ? runningIndex
      : Math.max(
          0,
          STAGES.findIndex((_, i) => mapStepStatus(i, statuses) === "pending") - 1,
        );

  return (
    <div className="hidden lg:flex items-center gap-1.5 glass rounded-full px-3 py-1.5">
      {STAGES.map((stage, i) => {
        const status = mapStepStatus(i, statuses);
        const done = status === "complete";
        const active = status === "running" || (stageIndex === i && !done);
        const errored = status === "error";

        return (
          <div key={stage} className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full transition-all",
                  done && "bg-primary/60",
                  active && "bg-primary shadow-[0_0_10px_hsl(var(--primary))] animate-pulse",
                  errored && "bg-destructive",
                  !done && !active && !errored && "bg-muted-foreground/30",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
              <span
                className={[
                  "text-xs font-medium tracking-wide transition-colors",
                  active
                    ? "text-foreground"
                    : done
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50",
                ].join(" ")}
              >
                {stage}
              </span>
            </div>
            {i < STAGES.length - 1 ? (
              <span className={["h-px w-5", done ? "bg-primary/50" : "bg-border"].join(" ")} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
