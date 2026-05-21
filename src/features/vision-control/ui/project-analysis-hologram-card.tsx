"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Play, Scan } from "lucide-react";
import type { RefObject } from "react";
import type { ProjectOwnershipViewModel } from "@/shared/types/aiops";
import type { LastRunMeta } from "@/shared/types/session-artifact-cache";
import type { WorkspaceTelemetryMetrics } from "@/shared/types/workspace-telemetry-metrics";

interface ProjectAnalysisHologramCardProps {
  project: ProjectOwnershipViewModel | null;
  hasCachedInsights: boolean;
  metrics: WorkspaceTelemetryMetrics | null;
  cacheMeta: LastRunMeta | null;
  incidentCount: number;
  primeKpiCount: number;
  canRunAnalysis: boolean;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
  onOpenResults: () => void;
  runButtonRef?: RefObject<HTMLButtonElement | null>;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatUpdatedAt(value: string | null): string {
  if (!value) return "now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "now";
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function SourceLabel({ meta }: { meta: LastRunMeta | null }) {
  if (!meta) return <span>Session cache</span>;

  if (meta.source === "copilot") {
    return <span>CopilotKit cache</span>;
  }

  if (meta.source === "manual") {
    return <span>ADK manual cache</span>;
  }

  return <span>System cache</span>;
}

function MetricCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-cyan-200/20 bg-slate-950/50 px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-[0.14em] text-cyan-100/65">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-cyan-50">{value}</p>
    </div>
  );
}

export function ProjectAnalysisHologramCard({
  project,
  hasCachedInsights,
  metrics,
  cacheMeta,
  incidentCount,
  primeKpiCount,
  canRunAnalysis,
  isAnalyzing,
  onRunAnalysis,
  onOpenResults,
  runButtonRef,
}: ProjectAnalysisHologramCardProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {project ? (
        <motion.aside
          key={project.id}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="pointer-events-auto absolute bottom-24 left-1/2 z-40 w-[min(460px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-cyan-200/35 bg-slate-950/72 p-4 shadow-[0_0_30px_rgba(34,211,238,0.24)] backdrop-blur-xl"
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -inset-px rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.34),_transparent_62%)]"
            animate={{ opacity: [0.45, 0.78, 0.45] }}
            transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY }}
          />

          <div className="relative">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/85">
                  {hasCachedInsights ? "Cached project snapshot" : "No cached data yet"}
                </p>
                <h3 className="text-sm font-semibold text-white">{project.name}</h3>
              </div>
              <span className="rounded-full border border-cyan-200/35 bg-cyan-500/10 px-2 py-1 text-[10px] text-cyan-100">
                {project.serviceNames.length} services
              </span>
            </div>

            {hasCachedInsights ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <MetricCell
                    label="Cost window"
                    value={metrics?.costWindowLabel ?? "Session"}
                  />
                  <MetricCell
                    label="Projected cost"
                    value={
                      metrics
                        ? formatUsd(metrics.estimatedTotalCostUsd)
                        : "Unavailable"
                    }
                  />
                  <MetricCell
                    label="Incidents"
                    value={String(metrics?.incidentCount ?? incidentCount)}
                  />
                  <MetricCell
                    label="PRIME KPIs"
                    value={String(primeKpiCount)}
                  />
                </div>

                <p className="mt-2 text-[10px] text-cyan-100/70">
                  <SourceLabel meta={cacheMeta} /> · updated{" "}
                  {formatUpdatedAt(cacheMeta?.updatedAt ?? null)}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onOpenResults}
                    className="flex items-center gap-1.5 rounded-lg border border-cyan-200/35 bg-cyan-500/12 px-3 py-2 text-xs text-cyan-100 hover:bg-cyan-500/20"
                  >
                    <Scan className="h-3.5 w-3.5" />
                    Open cached results
                  </button>
                  <button
                    ref={runButtonRef}
                    type="button"
                    disabled={!canRunAnalysis || isAnalyzing}
                    onClick={onRunAnalysis}
                    className="flex items-center gap-1.5 rounded-lg bg-lime-400/90 px-3 py-2 text-xs font-medium text-slate-950 hover:bg-lime-300 disabled:opacity-45"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    {isAnalyzing ? "Running…" : "Run fresh analysis"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-zinc-300">
                  Select <span className="text-cyan-100">Run analysis</span> to build
                  telemetry, incident, and cost metrics for this project.
                </p>
                <button
                  ref={runButtonRef}
                  type="button"
                  disabled={!canRunAnalysis || isAnalyzing}
                  onClick={onRunAnalysis}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400/90 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-lime-300 disabled:opacity-45"
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isAnalyzing ? "Running pipeline…" : "Run analysis"}
                </button>
              </>
            )}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
