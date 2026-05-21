"use client";

import type { AnalyzeLogsResult } from "@/shared/types/aiops";
import type { AIOpsSessionArtifactCache } from "@/shared/types/session-artifact-cache";
import type { AnalysisAgentStep } from "@/shared/types/analysis-progress";
import type { AnalysisWorkflowState } from "@/processes/aiops-analysis-session/model/aiops-session-context";

interface VisionResultsOverlayProps {
  open: boolean;
  workflow: AnalysisWorkflowState;
  agentPipeline: AnalysisAgentStep[];
  result: AnalyzeLogsResult | null;
  artifactCache: AIOpsSessionArtifactCache;
  error: string | null;
  onClose: () => void;
}

export function VisionResultsOverlay({
  open,
  workflow,
  agentPipeline,
  result,
  artifactCache,
  error,
  onClose,
}: VisionResultsOverlayProps) {
  if (!open) return null;

  const incidents = result?.incidents ?? artifactCache.incidents ?? [];
  const analyses = result?.analyses ?? artifactCache.analyses ?? [];
  const report = result?.primeReport ?? artifactCache.primeReport;

  return (
    <div className="pointer-events-auto absolute inset-x-6 bottom-24 z-40 max-h-[38vh] overflow-hidden rounded-2xl border border-white/15 bg-slate-950/80 p-4 shadow-2xl backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/80">
            Analysis output
          </p>
          <p className="text-sm text-zinc-100">{workflow.detail}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/10"
        >
          Close
        </button>
      </div>

      {error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">
            Incidents
          </p>
          <p className="mt-1 text-2xl font-light text-white">{incidents.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">
            Analyses
          </p>
          <p className="mt-1 text-2xl font-light text-white">{analyses.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400">
            PRIME KPIs
          </p>
          <p className="mt-1 text-2xl font-light text-white">
            {report?.kpis?.length ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {agentPipeline.map((step) => (
          <span
            key={step.id}
            className={[
              "rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wide",
              step.status === "complete"
                ? "border-lime-400/40 bg-lime-400/10 text-lime-200"
                : step.status === "running"
                  ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                  : "border-zinc-500/40 bg-zinc-500/10 text-zinc-300",
            ].join(" ")}
          >
            {step.label}: {step.status}
          </span>
        ))}
      </div>

      {analyses[0] ? (
        <p className="mt-3 line-clamp-3 text-sm text-zinc-300">
          {analyses[0].summary}
        </p>
      ) : null}
    </div>
  );
}
