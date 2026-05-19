"use client";

import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import {
  AnalysisAgentStep,
  AnalysisIncidentProgress,
} from "@/shared/types/analysis-progress";
import React from "react";

interface AgentPipelineLiveProps {
  compact?: boolean;
  pipeline?: AnalysisAgentStep[];
  incidentProgress?: AnalysisIncidentProgress | null;
  isAnalyzing?: boolean;
}

export function AgentPipelineLive({
  pipeline: pipelineOverride,
  isAnalyzing: isAnalyzingOverride,
}: AgentPipelineLiveProps) {
  const session = useAIOpsSession();
  const agentPipeline = pipelineOverride ?? session.agentPipeline;
  const isAnalyzing = isAnalyzingOverride ?? session.isAnalyzing;

  if (!isAnalyzing && agentPipeline.every((step) => step.status === "pending")) {
    return null;
  }

  const steps = [
    { id: "1_discovery", label: "Scope", status: agentPipeline[0]?.status || "pending" },
    { id: "2_telemetry", label: "Telemetry", status: agentPipeline[1]?.status || "pending" },
    { id: "3_analysis", label: "Analysis", status: agentPipeline[2]?.status || "pending" },
    { id: "4_prime_report", label: "Reporting", status: agentPipeline[3]?.status || "pending" },
    {
      id: "5_ready",
      label: "Ready",
      status: agentPipeline[3]?.status === "complete" ? "complete" : "pending",
    },
  ];

  const activeIndex = steps.findIndex((s) => s.status === "running");

  return (
    <div className="w-full flex justify-center mb-6 animate-fade-in">
      <div className="glass w-full max-w-3xl p-6 rounded-2xl">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-8">
          Analysis Pipeline
        </h3>

        <div className="flex items-center justify-between relative px-2">
          <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-px bg-border -z-10" />

          {steps.map((step, idx) => {
            if (idx === 0) return null;
            const prevStep = steps[idx - 1];
            const lineActive =
              prevStep.status === "complete" || prevStep.status === "running";
            if (!lineActive) return null;
            return (
              <div
                key={`line-${idx}`}
                className="absolute top-1/2 -translate-y-1/2 h-px -z-10 transition-all duration-500"
                style={{
                  left: `${(idx - 1) * 25 + 6}%`,
                  width: "22%",
                  background:
                    step.status === "running"
                      ? "linear-gradient(90deg, hsl(var(--success)), hsl(var(--primary)))"
                      : step.status === "complete"
                        ? "hsl(var(--success))"
                        : "linear-gradient(90deg, hsl(var(--success)), hsl(var(--primary) / 0.3))",
                }}
              />
            );
          })}

          {steps.map((step, idx) => {
            const isComplete = step.status === "complete";
            const isRunning = step.status === "running";

            return (
              <div
                key={step.id}
                className="flex flex-col items-center gap-3 relative bg-background/80 px-2 z-10"
              >
                <div
                  className={[
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isComplete
                      ? "border-success bg-success/20 text-success shadow-[0_0_15px_hsl(var(--success)/0.35)]"
                      : isRunning
                        ? "border-primary bg-primary/20 neon-ring"
                        : "border-border bg-secondary/60 text-muted-foreground",
                  ].join(" ")}
                >
                  {isComplete ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : isRunning ? (
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_10px_hsl(var(--primary))]" />
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  )}
                </div>

                {isRunning && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[22px] w-12 h-12 rounded-full border border-primary/40 animate-ping-soft -z-10" />
                )}

                <span
                  className={[
                    "text-xs font-medium tracking-wide",
                    isComplete || isRunning ? "text-foreground" : "text-muted-foreground/60",
                    idx === activeIndex ? "text-primary" : "",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
