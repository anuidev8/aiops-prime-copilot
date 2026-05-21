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

function pipelineProgressIndex(statuses: AnalysisAgentStatus[]): number {
  const runningIndex = STAGES.findIndex((_, index) => mapStepStatus(index, statuses) === "running");
  if (runningIndex >= 0) return runningIndex;

  let lastComplete = -1;
  STAGES.forEach((_, index) => {
    if (mapStepStatus(index, statuses) === "complete") lastComplete = index;
  });
  return Math.min(Math.max(lastComplete, 0), STAGES.length - 1);
}

export function PipelineStrip() {
  const { agentPipeline, isAnalyzing } = useAIOpsSession();
  const statuses = agentPipeline.map((step) => step.status);

  const visible =
    isAnalyzing || statuses.some((status) => status === "running" || status === "complete" || status === "error");

  if (!visible) return null;

  const activeIndex = pipelineProgressIndex(statuses);

  return (
    <div className="flex items-center text-xs font-medium text-slate-500">
      <span className="mr-6 shrink-0">Pipeline</span>
      <div className="relative flex h-8 w-full max-w-md items-center">
        <div className="absolute top-2 left-0 right-0 -z-10 h-0.5 rounded-full bg-slate-200" />
        <div
          className="absolute top-2 left-0 -z-10 h-0.5 rounded-full bg-indigo-600 transition-all duration-500"
          style={{
            width: `${(activeIndex / (STAGES.length - 1)) * 100}%`,
          }}
        />
        <div className="flex w-full justify-between">
          {STAGES.map((stage, index) => {
            const status = mapStepStatus(index, statuses);
            const state =
              status === "complete"
                ? "done"
                : status === "running"
                  ? "active"
                  : status === "error"
                    ? "error"
                    : "pending";

            return (
              <div key={stage} className="relative z-10 flex flex-col items-center gap-1.5">
                <div
                  className={[
                    "flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white transition-colors",
                    state === "done"
                      ? "border-green-500"
                      : state === "active"
                        ? "border-indigo-600"
                        : state === "error"
                          ? "border-rose-500"
                          : "border-slate-300",
                  ].join(" ")}
                >
                  {state === "done" ? <div className="h-2 w-2 rounded-full bg-green-500" /> : null}
                  {state === "active" ? <div className="h-2 w-2 rounded-full bg-indigo-600" /> : null}
                  {state === "pending" ? <div className="h-2 w-2 rounded-full bg-slate-300" /> : null}
                  {state === "error" ? <div className="h-2 w-2 rounded-full bg-rose-500" /> : null}
                </div>
                <span
                  className={[
                    "absolute top-6 whitespace-nowrap",
                    state === "active" ? "font-semibold text-indigo-600" : "",
                  ].join(" ")}
                >
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
