"use client";

import { IncidentTable } from "@/entities/incident/ui/incident-table";
import { DashboardAnalyzingPlaceholder } from "@/features/agent-pipeline/ui/dashboard-analyzing-placeholder";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import { IncidentViewModel } from "@/shared/types/aiops";
import { Panel } from "@/shared/ui/panel";

interface ServiceBucket {
  service: string;
  count: number;
  critical: number;
}

function avgDuration(incidents: IncidentViewModel[]): number {
  if (incidents.length === 0) return 0;
  const total = incidents.reduce((sum, incident) => sum + incident.durationMinutes, 0);
  return Math.round((total / incidents.length) * 100) / 100;
}

function byService(incidents: IncidentViewModel[]): ServiceBucket[] {
  const map = new Map<string, ServiceBucket>();

  for (const incident of incidents) {
    const current = map.get(incident.service);

    if (current) {
      current.count += 1;
      if (incident.severity === "critical") current.critical += 1;
      continue;
    }

    map.set(incident.service, {
      service: incident.service,
      count: 1,
      critical: incident.severity === "critical" ? 1 : 0,
    });
  }

  return Array.from(map.values()).sort((left, right) => right.count - left.count);
}

function bySeverity(incidents: IncidentViewModel[]): Array<{
  severity: IncidentViewModel["severity"];
  count: number;
}> {
  const order: IncidentViewModel["severity"][] = ["critical", "high", "medium", "low"];
  const map = new Map<IncidentViewModel["severity"], number>();

  for (const incident of incidents) {
    map.set(incident.severity, (map.get(incident.severity) ?? 0) + 1);
  }

  return order.map((severity) => ({ severity, count: map.get(severity) ?? 0 }));
}

function timelinePath(incidents: IncidentViewModel[]): string {
  if (incidents.length === 0) return "";

  const sorted = [...incidents].sort(
    (left, right) => Date.parse(left.startedAt) - Date.parse(right.startedAt),
  );
  const maxDuration = Math.max(...sorted.map((incident) => incident.durationMinutes), 1);

  return sorted
    .map((incident, index) => {
      const x = (index / Math.max(sorted.length - 1, 1)) * 100;
      const y = 100 - (incident.durationMinutes / maxDuration) * 82;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function severityClass(severity: IncidentViewModel["severity"]): string {
  if (severity === "critical") return "bg-rose-500";
  if (severity === "high") return "bg-orange-500";
  if (severity === "medium") return "bg-amber-500";
  return "bg-emerald-500";
}

export function IncidentDashboard() {
  const { result, isAnalyzing } = useAIOpsSession();
  const incidents = result?.incidents ?? [];
  const showChartsPlaceholder = isAnalyzing && incidents.length === 0;
  const services = byService(incidents);
  const severities = bySeverity(incidents);
  const criticalCount = incidents.filter((incident) => incident.severity === "critical").length;
  const impactedServices = new Set(incidents.map((incident) => incident.service)).size;
  const averageDuration = avgDuration(incidents);
  const maxServiceIncidents = Math.max(...services.map((bucket) => bucket.count), 1);
  const line = timelinePath(incidents);
  const resolvedWindowLabel = result
    ? `${result.query.resolvedTimeWindowMinutes}m (${new Date(result.query.resolvedWindowFrom).toLocaleTimeString()} - ${new Date(result.query.resolvedWindowTo).toLocaleTimeString()})`
    : "No scope selected";

  return (
    <Panel
      title="Incidents"
      subtitle="Telemetry-backed service impact and incident timeline"
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total incidents" value={String(incidents.length)} tone="indigo" />
        <MetricCard label="Critical incidents" value={String(criticalCount)} tone="rose" />
        <MetricCard label="Impacted services" value={String(impactedServices)} tone="sky" />
        <MetricCard label="Avg duration" value={`${averageDuration}m`} tone="emerald" />
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
        <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
        <p className="text-xs font-mono text-slate-500">
          <span className="mr-2 text-muted-foreground/80">RESOLVED_SCOPE_WINDOW:</span>
          {resolvedWindowLabel}
        </p>
      </div>

      {showChartsPlaceholder ? (
        <div className="mb-6">
          <DashboardAnalyzingPlaceholder
            title="Incident matrix loading"
            waitingLabel="Telemetry agent is correlating logs into incidents."
          />
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-border bg-secondary/25 p-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Service pressure
          </h3>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isAnalyzing
                ? "Waiting for telemetry agent to publish incident clusters."
                : "Run analysis to show service pressure."}
            </p>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service.service}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{service.service}</span>
                    <span className="font-mono text-muted-foreground">
                      {service.count} EVT ({service.critical} CRIT)
                    </span>
                  </div>
                  <div className="relative h-1.5 overflow-hidden rounded-full bg-border/70">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-primary"
                      style={{ width: `${(service.count / maxServiceIncidents) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-secondary/25 p-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Severity mix
          </h3>
          <div className="space-y-4">
            {severities.map((entry) => (
              <div key={entry.severity} className="flex items-center gap-3 text-xs">
                <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${severityClass(entry.severity)}`} />
                <span className="w-16 capitalize text-foreground">{entry.severity}</span>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-border/70">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${severityClass(entry.severity)}`}
                    style={{
                      width:
                        incidents.length === 0
                          ? "0%"
                          : `${(entry.count / incidents.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-muted-foreground">{entry.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mb-6 rounded-xl border border-border bg-secondary/25 p-5">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Incident timeline
        </h3>
        {incidents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isAnalyzing
              ? "Analyst agent is still scoring incidents for the timeline."
              : "No incident timeline available yet."}
          </p>
        ) : (
          <svg
            viewBox="0 0 100 100"
            className="h-32 w-full rounded-lg border border-border bg-white p-3"
            role="img"
            aria-label="Incident duration trend"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
              </linearGradient>
            </defs>
            <path d="M0 25h100M0 50h100M0 75h100" stroke="hsl(var(--border))" strokeWidth="0.5" fill="none"/>
            <path d="M25 0v100M50 0v100M75 0v100" stroke="hsl(var(--border))" strokeWidth="0.5" fill="none"/>
            <path
              d={line}
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth={3}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        )}
      </section>

      <IncidentTable incidents={incidents} />
    </Panel>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "indigo" | "rose" | "sky" | "emerald";
}) {
  const toneMap: Record<string, string> = {
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-1 text-sm font-medium text-slate-500">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        <span className={["rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", toneMap[tone]].join(" ")}>
          Live
        </span>
      </div>
    </article>
  );
}
