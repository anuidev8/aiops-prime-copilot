"use client";

import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import {
  AnalysisAgentStep,
  AnalysisIncidentProgress,
} from "@/shared/types/analysis-progress";

function statusStyles(status: AnalysisAgentStep["status"]): string {
  if (status === "running") {
    return "border-cyan-400/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(0,240,255,0.15)]";
  }

  if (status === "complete") {
    return "border-emerald-500/40 bg-emerald-500/10";
  }

  if (status === "error") {
    return "border-rose-500/40 bg-rose-500/10";
  }

  return "border-slate-700/60 bg-slate-900/40";
}

function StatusIndicator({ status }: { status: AnalysisAgentStep["status"] }) {
  if (status === "running") {
    return (
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
      </span>
    );
  }

  if (status === "complete") {
    return <span className="inline-flex h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />;
  }

  if (status === "error") {
    return <span className="inline-flex h-3 w-3 rounded-full bg-rose-400" />;
  }

  return <span className="inline-flex h-3 w-3 rounded-full bg-slate-600" />;
}

interface AgentPipelineLiveProps {
  compact?: boolean;
  pipeline?: AnalysisAgentStep[];
  incidentProgress?: AnalysisIncidentProgress | null;
  isAnalyzing?: boolean;
}

export function AgentPipelineLive({
  compact = false,
  pipeline: pipelineOverride,
  incidentProgress: incidentProgressOverride,
  isAnalyzing: isAnalyzingOverride,
}: AgentPipelineLiveProps) {
  const session = useAIOpsSession();
  const agentPipeline = pipelineOverride ?? session.agentPipeline;
  const incidentProgress =
    incidentProgressOverride === undefined
      ? session.incidentProgress
      : incidentProgressOverride;
  const isAnalyzing = isAnalyzingOverride ?? session.isAnalyzing;

  if (!isAnalyzing && agentPipeline.every((step) => step.status === "pending")) {
    return null;
  }

  return (
    <section
      className={[
        "rounded-xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/80 via-[#0b0f19] to-slate-900/60",
        compact ? "p-4" : "p-5",
      ].join(" ")}
    >
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500/90">
            ADK Agent Pipeline
          </p>
          <h3 className="mt-1 text-sm font-medium text-white">
            {isAnalyzing ? "Agents executing behind the scenes" : "Pipeline idle"}
          </h3>
        </div>
        {incidentProgress ? (
          <p className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 font-mono text-xs text-cyan-200">
            Incident {incidentProgress.current}/{incidentProgress.total} ·{" "}
            {incidentProgress.service}
          </p>
        ) : null}
      </header>

      <ol className={compact ? "grid gap-2" : "grid gap-3"}>
        {agentPipeline.map((step, index) => (
          <li
            key={step.id}
            className={[
              "flex gap-3 rounded-lg border px-3 py-3 transition-all duration-500",
              statusStyles(step.status),
            ].join(" ")}
          >
            <div className="flex flex-col items-center pt-1">
              <StatusIndicator status={step.status} />
              {index < agentPipeline.length - 1 ? (
                <span
                  className={[
                    "mt-2 min-h-[24px] w-px flex-1",
                    step.status === "complete" ? "bg-emerald-500/50" : "bg-slate-700",
                  ].join(" ")}
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-white">{step.label}</p>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                  {step.status}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">{step.subtitle}</p>
              <p className="mt-2 font-mono text-xs text-slate-300">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
