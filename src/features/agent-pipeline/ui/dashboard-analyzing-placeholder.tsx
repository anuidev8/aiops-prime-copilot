"use client";

import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";

interface DashboardAnalyzingPlaceholderProps {
  title: string;
  waitingLabel: string;
}

export function DashboardAnalyzingPlaceholder({
  title,
  waitingLabel,
}: DashboardAnalyzingPlaceholderProps) {
  const { agentPipeline, isAnalyzing } = useAIOpsSession();

  if (!isAnalyzing) {
    return null;
  }

  const activeAgent =
    agentPipeline.find((step) => step.status === "running") ??
    agentPipeline.find((step) => step.status === "pending");

  return (
    <div className="rounded-xl border border-dashed border-cyan-500/30 bg-slate-900/50 p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="relative flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-50" />
          <span className="relative inline-flex h-4 w-4 rounded-full bg-cyan-400" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-500/90">
            {title}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {activeAgent?.detail ?? waitingLabel}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((bar) => (
          <div key={bar} className="space-y-2">
            <div className="h-2 w-24 animate-pulse rounded bg-slate-700/80" />
            <div className="h-8 animate-pulse rounded-lg bg-slate-800/90" />
          </div>
        ))}
      </div>

      <p className="mt-4 font-mono text-xs text-slate-500">
        {activeAgent ? `${activeAgent.label} · ${activeAgent.status}` : waitingLabel}
      </p>
    </div>
  );
}
