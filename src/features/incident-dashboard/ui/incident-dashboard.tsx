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

function severityColor(severity: IncidentViewModel["severity"]): string {
  if (severity === "critical") return "bg-rose-500 shadow-[0_0_8px_#f43f5e]";
  if (severity === "high") return "bg-orange-500 shadow-[0_0_8px_#f97316]";
  if (severity === "medium") return "bg-amber-500 shadow-[0_0_8px_#f59e0b]";
  return "bg-slate-400 shadow-[0_0_8px_#94a3b8]";
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
      title="Global Risk Exposure"
      subtitle="Telemetry-backed operational flow with service impact and incident timeline"
    >
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-cyan-500/20 bg-slate-900/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-bl-full blur-xl group-hover:bg-cyan-500/20 transition-colors" />
          <p className="text-xs uppercase tracking-widest text-cyan-500/80 mb-1">Total Incidents</p>
          <p className="text-3xl font-semibold text-white drop-shadow-[0_0_8px_rgba(0,240,255,0.3)]">{incidents.length}</p>
        </article>
        <article className="rounded-xl border border-rose-500/20 bg-slate-900/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden group hover:border-rose-500/40 transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-full blur-xl group-hover:bg-rose-500/20 transition-colors" />
          <p className="text-xs uppercase tracking-widest text-rose-500/80 mb-1">Critical Incidents</p>
          <p className="text-3xl font-semibold text-white drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">{criticalCount}</p>
        </article>
        <article className="rounded-xl border border-indigo-500/20 bg-slate-900/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-bl-full blur-xl group-hover:bg-indigo-500/20 transition-colors" />
          <p className="text-xs uppercase tracking-widest text-indigo-500/80 mb-1">Impacted Services</p>
          <p className="text-3xl font-semibold text-white drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]">{impactedServices}</p>
        </article>
        <article className="rounded-xl border border-emerald-500/20 bg-slate-900/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
           <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full blur-xl group-hover:bg-emerald-500/20 transition-colors" />
          <p className="text-xs uppercase tracking-widest text-emerald-500/80 mb-1">Avg Duration</p>
          <p className="text-3xl font-semibold text-white drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">{averageDuration}m</p>
        </article>
      </div>

      <div className="mb-4 rounded-lg bg-slate-800/40 border border-slate-700/50 px-4 py-2.5 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee] animate-pulse" />
        <p className="text-xs font-mono text-slate-300">
          <span className="text-slate-500 mr-2">RESOLVED_SCOPE_WINDOW:</span> 
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
        <section className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl pointer-events-none" />
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 mb-4 flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 text-cyan-500"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Service Pressure
          </h3>
          {services.length === 0 ? (
            <p className="text-sm text-slate-500">
              {isAnalyzing
                ? "Waiting for telemetry agent to publish incident clusters."
                : "Run analysis to show service pressure."}
            </p>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service.service} className="relative z-10">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{service.service}</span>
                    <span className="text-slate-500 font-mono">
                      {service.count} <span className="text-slate-600">EVT</span> ({service.critical} CRIT)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden relative">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-600 to-indigo-500 shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                      style={{ width: `${(service.count / maxServiceIncidents) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 mb-4">
            Severity Mix
          </h3>
          <div className="space-y-4">
            {severities.map((entry) => (
              <div key={entry.severity} className="flex items-center gap-3 text-xs">
                <span className={`h-2.5 w-2.5 rounded-full ${severityColor(entry.severity)} ring-2 ring-slate-900 flex-shrink-0`} />
                <span className="w-16 capitalize text-slate-300">{entry.severity}</span>
                <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden relative">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${severityColor(entry.severity).split(' ')[0]}`}
                    style={{
                      width:
                        incidents.length === 0
                          ? "0%"
                          : `${(entry.count / incidents.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-slate-400">{entry.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mb-6 rounded-xl border border-slate-800/60 bg-slate-900/40 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 mb-4 flex items-center gap-2">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 text-emerald-500"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
          Incident Timeline
        </h3>
        {incidents.length === 0 ? (
          <p className="text-sm text-slate-500">
            {isAnalyzing
              ? "Analyst agent is still scoring incidents for the timeline."
              : "No incident timeline available yet."}
          </p>
        ) : (
          <svg
            viewBox="0 0 100 100"
            className="h-32 w-full rounded-lg bg-[#0b0f19] border border-slate-800/80 p-3 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
            role="img"
            aria-label="Incident duration trend"
            preserveAspectRatio="none"
          >
             <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#00e676" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                   <feGaussianBlur stdDeviation="2" result="blur" />
                   <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
             </defs>
            {/* Grid lines */}
            <path d="M0 25h100M0 50h100M0 75h100" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" fill="none"/>
            <path d="M25 0v100M50 0v100M75 0v100" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" fill="none"/>
            <path
              d={line}
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth={3}
              vectorEffect="non-scaling-stroke"
              filter="url(#glow)"
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

