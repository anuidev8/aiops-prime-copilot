"use client";

import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import type { TelemetryWorkerId } from "@/shared/types/aiops-workspace-state";

const WORKERS: Array<{ id: TelemetryWorkerId; label: string }> = [
  { id: "coordinator", label: "Scope" },
  { id: "telemetry_worker", label: "Telemetry" },
  { id: "analyst_worker", label: "Analysis" },
  { id: "reporter_worker", label: "Reporting" },
];

export function TelemetrySubgraphBar() {
  const { agentPipeline, isAnalyzing, workflow } = useAIOpsSession();

  const showBar =
    isAnalyzing || agentPipeline.some((step) => step.status !== "pending");

  if (!showBar) {
    return null;
  }

  const runningStep = agentPipeline.find((step) => step.status === "running");
  let activeWorker: TelemetryWorkerId = "coordinator";
  if (runningStep?.id === "telemetry") activeWorker = "telemetry_worker";
  if (runningStep?.id === "analyst") activeWorker = "analyst_worker";
  if (runningStep?.id === "reporter") activeWorker = "reporter_worker";

  return (
    <section className="rounded-2xl border border-border bg-white/82 px-3 py-3 shadow-[0_10px_30px_-24px_hsl(225_35%_30%/0.4)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Active Agents
        </p>
        <p className="max-w-[min(460px,58vw)] truncate text-xs text-muted-foreground">
          {workflow.detail}
        </p>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {WORKERS.map((worker) => {
          const active = activeWorker === worker.id;
          return (
            <span
              key={worker.id}
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary/35 bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground",
              ].join(" ")}
            >
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  active ? "animate-pulse bg-primary" : "bg-muted-foreground/40",
                ].join(" ")}
              />
              {worker.label}
            </span>
          );
        })}
      </div>
    </section>
  );
}
