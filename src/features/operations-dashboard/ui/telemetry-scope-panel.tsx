"use client";

import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import type { SeverityLevel } from "@/shared/types/aiops";
import { DashboardPanel } from "@/shared/ui/dashboard/dashboard-panel";

const SEVERITY_ORDER: SeverityLevel[] = ["critical", "high", "medium", "low"];

function formatTimestamp(value: string | undefined): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return value;
  }
  return parsed.toLocaleString();
}

function formatWindowLabel(
  from: string | undefined,
  to: string | undefined,
): string {
  if (!from || !to) return "-";
  return `${formatTimestamp(from)} -> ${formatTimestamp(to)}`;
}

function telemetryStatus(params: {
  isAnalyzing: boolean;
  stage: string;
  hasTelemetrySnapshot: boolean;
}): {
  label: string;
  chipClass: string;
} {
  if (params.stage === "error") {
    return {
      label: "Error",
      chipClass:
        "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (
    params.isAnalyzing ||
    params.stage === "collecting_scope" ||
    params.stage === "reading_telemetry"
  ) {
    return {
      label: "Running",
      chipClass:
        "border-indigo-200 bg-indigo-50 text-indigo-700",
    };
  }

  if (params.hasTelemetrySnapshot) {
    return {
      label: "Synchronized",
      chipClass:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: "Idle",
    chipClass:
      "border-border bg-secondary text-muted-foreground",
  };
}

export function TelemetryScopePanel() {
  const { artifactCache, selectedScope, workflow, agentPipeline, isAnalyzing } =
    useAIOpsSession();
  const query = artifactCache.query;
  const incidents = artifactCache.incidents;

  const hasTelemetrySnapshot = Boolean(query) || incidents.length > 0;
  const shouldRender =
    hasTelemetrySnapshot ||
    isAnalyzing ||
    workflow.stage === "collecting_scope" ||
    workflow.stage === "reading_telemetry";

  if (!shouldRender) {
    return null;
  }

  const runningStep = agentPipeline.find((step) => step.status === "running");
  const lastFinishedStep = [...agentPipeline]
    .reverse()
    .find((step) => step.status === "complete");
  const activeWorkerLabel = runningStep?.label ?? lastFinishedStep?.label ?? "Coordinator";
  const scopeProject =
    query?.resolvedProjectName ??
    query?.resolvedProjectId ??
    query?.requestedProjectId ??
    selectedScope?.projectName ??
    "All projects";
  const scopeCompany =
    query?.resolvedCompanyId ??
    query?.requestedCompanyId ??
    selectedScope?.companyId ??
    "All companies";
  const serviceCount =
    query?.resolvedServiceCount ??
    query?.analyzedServices.length ??
    new Set(incidents.map((incident) => incident.service)).size;
  const status = telemetryStatus({
    isAnalyzing,
    stage: workflow.stage,
    hasTelemetrySnapshot,
  });
  const counts = new Map<SeverityLevel, number>(
    SEVERITY_ORDER.map((severity) => [severity, 0]),
  );

  for (const incident of incidents) {
    counts.set(incident.severity, (counts.get(incident.severity) ?? 0) + 1);
  }

  const severityCounts = SEVERITY_ORDER.map((severity) => ({
    severity,
    count: counts.get(severity) ?? 0,
  }));

  return (
    <DashboardPanel
      title="Telemetry scope"
      subtitle="Dashboard source of truth for scope, incidents, and execution state"
    >
      <div className="grid gap-3 lg:grid-cols-3">
        <article className="rounded-xl border border-border bg-secondary/30 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Pipeline
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={[
                "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                status.chipClass,
              ].join(" ")}
            >
              {status.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {activeWorkerLabel}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{workflow.detail}</p>
        </article>

        <article className="rounded-xl border border-border bg-secondary/30 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Scope
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">{scopeProject}</p>
          <p className="text-xs text-muted-foreground">{scopeCompany}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {serviceCount} service{serviceCount === 1 ? "" : "s"} in scope
          </p>
        </article>

        <article className="rounded-xl border border-border bg-secondary/30 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Incidents
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {incidents.length} detected
          </p>
          <p className="text-xs text-muted-foreground">
            Run ID: {artifactCache.lastRunMeta?.runId ?? "-"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Updated: {formatTimestamp(artifactCache.lastRunMeta?.updatedAt)}
          </p>
        </article>
      </div>

      <div className="mt-3 space-y-2">
        <details className="rounded-xl border border-border bg-white p-3">
          <summary className="cursor-pointer text-xs font-medium text-foreground">
            Scope and time-window details
          </summary>
          <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
                Requested services
              </dt>
              <dd className="mt-1">
                {query?.requestedServices.length
                  ? query.requestedServices.join(", ")
                  : "Full scope"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
                Analyzed services
              </dt>
              <dd className="mt-1">
                {query?.analyzedServices.length
                  ? query.analyzedServices.join(", ")
                  : "-"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
                Requested window
              </dt>
              <dd className="mt-1">
                {query?.requestedTimeWindowMinutes
                  ? `${query.requestedTimeWindowMinutes} min`
                  : "Default"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
                Resolved window
              </dt>
              <dd className="mt-1">
                {query ? `${query.resolvedTimeWindowMinutes} min` : "-"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
                Resolved range
              </dt>
              <dd className="mt-1">
                {formatWindowLabel(query?.resolvedWindowFrom, query?.resolvedWindowTo)}
              </dd>
            </div>
          </dl>
        </details>

        <details className="rounded-xl border border-border bg-white p-3">
          <summary className="cursor-pointer text-xs font-medium text-foreground">
            Severity distribution
          </summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            {severityCounts.map((slice) => (
              <div
                key={slice.severity}
                className="rounded-lg border border-border bg-secondary/30 px-2.5 py-2"
              >
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {slice.severity}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{slice.count}</p>
              </div>
            ))}
          </div>
        </details>
      </div>
    </DashboardPanel>
  );
}
