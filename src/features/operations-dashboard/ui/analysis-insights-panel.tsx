"use client";

import { useMemo } from "react";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import type { AnalysisViewModel, IncidentViewModel } from "@/shared/types/aiops";
import { DashboardPanel } from "@/shared/ui/dashboard/dashboard-panel";
import { KpiCard } from "@/shared/ui/dashboard/kpi-card";

interface AnalysisRowViewModel {
  analysis: AnalysisViewModel;
  incident: IncidentViewModel | null;
}

function percentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function averageConfidence(rows: AnalysisRowViewModel[]): number {
  if (rows.length === 0) return 0;
  const total = rows.reduce(
    (sum, row) => sum + row.analysis.rootCause.confidence,
    0,
  );
  return total / rows.length;
}

export function AnalysisInsightsPanel() {
  const { result, artifactCache, workflow } = useAIOpsSession();
  const incidents = result?.incidents ?? artifactCache.incidents;
  const analyses = result?.analyses ?? artifactCache.analyses;

  const rows = useMemo(() => {
    const incidentById = new Map<string, IncidentViewModel>(
      incidents.map((incident) => [incident.id, incident]),
    );

    return analyses.map((analysis) => ({
      analysis,
      incident: incidentById.get(analysis.incidentId) ?? null,
    }));
  }, [analyses, incidents]);

  const showPlaceholder =
    workflow.stage === "root_cause_analysis" && rows.length === 0;
  const shouldRender = rows.length > 0 || showPlaceholder;

  if (!shouldRender) {
    return null;
  }

  if (showPlaceholder) {
    return (
      <DashboardPanel
        title="Analysis insights"
        subtitle="Root-cause metrics stream here while the analyst runs."
      >
        <p className="rounded-xl border border-dashed border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
          Waiting for analyst output to populate confidence bars and evidence table.
        </p>
      </DashboardPanel>
    );
  }

  const confidence = averageConfidence(rows);
  const automationRate =
    rows.filter((row) => row.analysis.remediationPlan.automationCandidate).length /
    rows.length;
  const estimatedMinutes = rows.reduce(
    (sum, row) => sum + row.analysis.remediationPlan.estimatedMinutes,
    0,
  );
  const ranked = [...rows].sort(
    (left, right) =>
      right.analysis.rootCause.confidence - left.analysis.rootCause.confidence,
  );

  return (
    <DashboardPanel
      title="Analysis insights"
      subtitle="Confidence, remediation effort, and evidence extracted from runAnalystAgent."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Analyzed incidents" value={rows.length} />
        <KpiCard label="Avg confidence" value={percentage(confidence)} />
        <KpiCard label="Automation-ready" value={percentage(automationRate)} />
        <KpiCard label="Est. effort" value={`${estimatedMinutes}m`} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-secondary/25 p-4">
          <h3 className="text-sm font-semibold text-foreground">Confidence bars</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Root-cause confidence per analyzed incident.
          </p>
          <div className="mt-3 space-y-3">
            {ranked.map((row) => {
              const confidencePct = Math.round(
                row.analysis.rootCause.confidence * 100,
              );
              const label =
                row.incident?.service ??
                row.analysis.incidentId.slice(0, 10);

              return (
                <article key={row.analysis.incidentId} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-foreground">{label}</span>
                    <span className="text-muted-foreground">{confidencePct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-border/70">
                    <div
                      className="h-full rounded-full bg-primary/85"
                      style={{ width: `${confidencePct}%` }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-secondary/25 p-4">
          <h3 className="text-sm font-semibold text-foreground">Evidence table</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Hypotheses mapped to severity and recommended first step.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-2 py-2 font-medium">Incident</th>
                  <th className="px-2 py-2 font-medium">Service</th>
                  <th className="px-2 py-2 font-medium">Severity</th>
                  <th className="px-2 py-2 font-medium">Hypothesis</th>
                  <th className="px-2 py-2 font-medium">Evidence</th>
                  <th className="px-2 py-2 font-medium">First step</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((row) => (
                  <tr
                    key={row.analysis.incidentId}
                    className="border-b border-border/60 text-foreground/95"
                  >
                    <td className="px-2 py-2 align-top">
                      {row.analysis.incidentId.slice(0, 10)}
                    </td>
                    <td className="px-2 py-2 align-top">
                      {row.incident?.service ?? "Unknown"}
                    </td>
                    <td className="px-2 py-2 align-top capitalize">
                      {row.incident?.severity ?? "unknown"}
                    </td>
                    <td className="px-2 py-2 align-top">
                      {row.analysis.rootCause.hypothesis}
                    </td>
                    <td className="px-2 py-2 align-top">
                      {row.analysis.rootCause.evidence.length}
                    </td>
                    <td className="px-2 py-2 align-top">
                      {row.analysis.remediationPlan.steps[0] ?? "No step"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardPanel>
  );
}
