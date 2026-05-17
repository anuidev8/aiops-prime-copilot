"use client";

import { IncidentTable } from "@/entities/incident/ui/incident-table";
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

function severityColor(severity: IncidentViewModel["severity"]): string {
  if (severity === "critical") return "bg-rose-500";
  if (severity === "high") return "bg-orange-500";
  if (severity === "medium") return "bg-amber-500";
  return "bg-slate-400";
}

export function IncidentDashboard() {
  const { result } = useAIOpsSession();
  const incidents = result?.incidents ?? [];
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
      title="Incident Analytics Matrix"
      subtitle="Telemetry-backed operational flow with service impact, severity pressure and incident timeline"
    >
      <div className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-cyan-700">Total Incidents</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{incidents.length}</p>
        </article>
        <article className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-rose-700">Critical Incidents</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{criticalCount}</p>
        </article>
        <article className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-indigo-700">Impacted Services</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{impactedServices}</p>
        </article>
        <article className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Avg Duration</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{averageDuration}m</p>
        </article>
      </div>

      <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">
        Resolved scope window: {resolvedWindowLabel}
      </p>

      <div className="mb-4 grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Service Pressure
          </h3>
          {services.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Run analysis to show service pressure.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {services.map((service) => (
                <div key={service.service}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{service.service}</span>
                    <span className="text-slate-500">
                      {service.count} incidents ({service.critical} critical)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                      style={{ width: `${(service.count / maxServiceIncidents) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Severity Mix
          </h3>
          <div className="mt-3 space-y-2">
            {severities.map((entry) => (
              <div key={entry.severity} className="flex items-center gap-2 text-xs">
                <span className={`h-2 w-2 rounded-full ${severityColor(entry.severity)}`} />
                <span className="w-16 capitalize text-slate-700">{entry.severity}</span>
                <div className="h-2 flex-1 rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full ${severityColor(entry.severity)}`}
                    style={{
                      width:
                        incidents.length === 0
                          ? "0%"
                          : `${(entry.count / incidents.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-8 text-right text-slate-500">{entry.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mb-4 rounded-xl border border-slate-200 bg-white p-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Incident Timeline
        </h3>
        {incidents.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No incident timeline available yet.</p>
        ) : (
          <svg
            viewBox="0 0 100 100"
            className="mt-3 h-24 w-full rounded-lg bg-gradient-to-r from-slate-50 via-cyan-50 to-white p-2"
            role="img"
            aria-label="Incident duration trend"
          >
            <path
              d={line}
              fill="none"
              stroke="rgb(6 182 212)"
              strokeWidth={2.4}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </section>

      <IncidentTable incidents={incidents} />
    </Panel>
  );
}

