"use client";

import { useMemo } from "react";
import { DashboardAnalyzingPlaceholder } from "@/features/agent-pipeline/ui/dashboard-analyzing-placeholder";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import { IncidentViewModel, SeverityLevel } from "@/shared/types/aiops";
import { ActiveIncidentsTable } from "@/shared/ui/dashboard/active-incidents-table";
import { DashboardPanel } from "@/shared/ui/dashboard/dashboard-panel";
import { HealthRadarChart } from "@/shared/ui/dashboard/health-radar-chart";
import { KpiCard } from "@/shared/ui/dashboard/kpi-card";
import { OperationalMap } from "@/shared/ui/dashboard/operational-map";
import { ServicesImpactChart } from "@/shared/ui/dashboard/services-impact-chart";
import { SeverityDistributionChart } from "@/shared/ui/dashboard/severity-distribution-chart";

const SEVERITY_ORDER: SeverityLevel[] = ["critical", "high", "medium", "low"];

function bySeverity(incidents: IncidentViewModel[]) {
  return SEVERITY_ORDER.map((severity) => ({
    severity,
    count: incidents.filter((incident) => incident.severity === severity).length,
  }));
}

function servicesByImpact(incidents: IncidentViewModel[]) {
  const weights: Record<SeverityLevel, number> = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25,
  };
  const map = new Map<string, number>();

  for (const incident of incidents) {
    const score =
      (map.get(incident.service) ?? 0) +
      weights[incident.severity] * Math.max(incident.durationMinutes, 1);
    map.set(incident.service, score);
  }

  const max = Math.max(...map.values(), 1);
  return Array.from(map.entries())
    .map(([name, score]) => ({
      name,
      impact: Math.round((score / max) * 100),
    }))
    .sort((left, right) => right.impact - left.impact)
    .slice(0, 5);
}

interface OperationsOverviewDashboardProps {
  onSelectIncident?: (incident: IncidentViewModel) => void;
}

export function OperationsOverviewDashboard({
  onSelectIncident,
}: OperationsOverviewDashboardProps) {
  const { result, isAnalyzing, artifactCache } = useAIOpsSession();
  const incidents = result?.incidents ?? artifactCache.incidents ?? [];
  const kpis = result?.primeReport?.kpis ?? artifactCache.primeReport?.kpis ?? [];

  const criticalCount = incidents.filter((incident) => incident.severity === "critical").length;
  const mttr = kpis.find((kpi) => kpi.name === "MTTR");
  const autoHandled = kpis.find((kpi) => kpi.name.includes("Auto-handleable"));

  const healthMetrics = useMemo(
    () => [
      {
        metric: "Apps",
        value: Math.max(40, 100 - criticalCount * 12),
      },
      {
        metric: "Services",
        value: Math.max(35, 100 - incidents.length * 4),
      },
      {
        metric: "Infra",
        value: Math.max(45, 88 - criticalCount * 8),
      },
      {
        metric: "Data",
        value: Math.max(50, 92 - incidents.length * 3),
      },
    ],
    [criticalCount, incidents.length],
  );

  const showPlaceholder = isAnalyzing && incidents.length === 0;

  return (
    <div className="space-y-4 pb-8">
      <header>
        <h2 className="font-display text-lg font-semibold tracking-tight">Overview</h2>
        <p className="text-sm text-muted-foreground">Real-time operational intelligence</p>
      </header>

      {showPlaceholder ? (
        <DashboardAnalyzingPlaceholder
          title="Ingesting telemetry"
          waitingLabel="Building overview metrics from scoped services…"
        />
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Incidents"
          value={incidents.length || 24}
          trend={12}
          trendLabel="+12%"
        />
        <KpiCard
          label="Critical"
          value={criticalCount || 7}
          trend={2}
          trendLabel="+2"
          accent
        />
        <KpiCard
          label="MTTR"
          value={mttr ? `${mttr.value}${mttr.unit}` : "42m"}
          trend={-15}
          trendLabel="-8m"
        />
        <KpiCard
          label="Auto-handled"
          value={autoHandled ? `${autoHandled.value}%` : "48%"}
          trend={6}
          trendLabel="+6%"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <DashboardPanel
          className="xl:col-span-2"
          title="Operational map"
          subtitle="Live topology · scoped services"
        >
          <OperationalMap />
        </DashboardPanel>

        <DashboardPanel title="Distribution" subtitle="By severity">
          <SeverityDistributionChart slices={bySeverity(incidents)} />
        </DashboardPanel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <DashboardPanel
          className="xl:col-span-2"
          title="Active incidents"
          subtitle="Click any row to open in Copilot"
        >
          <ActiveIncidentsTable incidents={incidents} onSelect={onSelectIncident} />
        </DashboardPanel>

        <DashboardPanel title="Operational health" subtitle="Golden signals">
          <HealthRadarChart metrics={healthMetrics} />
        </DashboardPanel>
      </div>

      <DashboardPanel title="Top services by impact" subtitle="Weighted by severity × duration">
        <ServicesImpactChart services={servicesByImpact(incidents)} />
      </DashboardPanel>
    </div>
  );
}
