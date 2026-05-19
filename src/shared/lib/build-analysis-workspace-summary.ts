import type {
  AnalysisViewModel,
  IncidentViewModel,
  PortfolioProjectHealthViewModel,
  PrimeReportViewModel,
  ProjectOwnershipViewModel,
} from "@/shared/types/aiops";
import type { AnalysisAgentStep } from "@/shared/types/analysis-progress";
import { buildWorkspaceTelemetryMetrics } from "@/shared/lib/build-workspace-telemetry-metrics";
import type { WorkspaceTelemetryMetrics } from "@/shared/types/workspace-telemetry-metrics";
import type {
  AnalysisCostOverview,
  AnalysisMetricRow,
  AnalysisProjectRow,
  AnalysisServiceRow,
  AnalysisServiceStatusBucket,
  AnalysisTelemetrySubStep,
  AnalysisWorkflowStage,
  AnalysisWorkflowSummaryInput,
  AnalysisWorkspaceSummary,
} from "../types/analysis-workspace-summary";
import { meritToStatusLabel } from "../types/analysis-workspace-summary";

const EMPTY_COST: AnalysisCostOverview = {
  source: "estimated",
  totalUsd: 0,
  windowLabel: "Run telemetry to estimate",
  breakdown: [
    { label: "Compute", amountUsd: 0, percent: 40, color: "#4f46e5" },
    { label: "Storage", amountUsd: 0, percent: 25, color: "#9333ea" },
    { label: "Network", amountUsd: 0, percent: 18, color: "#10b981" },
    { label: "Others", amountUsd: 0, percent: 17, color: "#f59e0b" },
  ],
};

const EMPTY_METRICS: AnalysisMetricRow[] = [
  { label: "Request volume", value: "—", trendPercent: 0, trendPositive: true },
  { label: "Error rate", value: "—", trendPercent: 0, trendPositive: false },
  { label: "Latency (p95)", value: "—", trendPercent: 0, trendPositive: true },
  { label: "Saturation", value: "—", trendPercent: 0, trendPositive: true },
  { label: "Availability", value: "—", trendPercent: 0, trendPositive: true },
];

function buildCostOverview(metrics: WorkspaceTelemetryMetrics): AnalysisCostOverview {
  const totalUsd = metrics.estimatedTotalCostUsd;
  const compute = Math.round(totalUsd * 0.4);
  const storage = Math.round(totalUsd * 0.25);
  const network = Math.round(totalUsd * 0.18);
  const others = Math.max(0, totalUsd - compute - storage - network);

  return {
    source: "telemetry",
    totalUsd,
    windowLabel: metrics.costWindowLabel,
    breakdown: [
      { label: "Compute", amountUsd: compute, percent: 40, color: "#4f46e5" },
      { label: "Storage", amountUsd: storage, percent: 25, color: "#9333ea" },
      { label: "Network", amountUsd: network, percent: 18, color: "#10b981" },
      { label: "Others", amountUsd: others, percent: 17, color: "#f59e0b" },
    ],
  };
}

function resolveWorkspaceMetrics(
  input: AnalysisWorkflowSummaryInput,
): WorkspaceTelemetryMetrics | null {
  if (input.workspaceMetrics) {
    return input.workspaceMetrics;
  }

  if (input.incidents.length === 0) {
    return null;
  }

  return buildWorkspaceTelemetryMetrics({
    incidents: input.incidents,
    query: null,
    resolvedServiceCount: input.resolvedServiceCount ?? input.incidents.length,
  });
}

function normalizeService(value: string): string {
  return value.trim().toLowerCase();
}

function scopedProjects(
  projectCatalog: ProjectOwnershipViewModel[],
  selectedProjectId: string | null,
): ProjectOwnershipViewModel[] {
  if (!selectedProjectId) return projectCatalog;
  return projectCatalog.filter((project) => project.id === selectedProjectId);
}

function projectForService(
  catalog: ProjectOwnershipViewModel[],
  serviceName: string,
): ProjectOwnershipViewModel | null {
  const needle = normalizeService(serviceName);
  return (
    catalog.find((project) =>
      project.serviceNames.some((service) => normalizeService(service) === needle),
    ) ?? null
  );
}

function healthFromIncidents(incidents: IncidentViewModel[]): number {
  if (incidents.length === 0) return 92;
  const penalty: Record<IncidentViewModel["severity"], number> = {
    critical: 25,
    high: 14,
    medium: 8,
    low: 4,
  };
  const severityPenalty = incidents.reduce(
    (sum, incident) => sum + penalty[incident.severity],
    0,
  );
  return Math.max(0, Math.round(100 - severityPenalty));
}

function serviceStatusFromHealth(health: number): AnalysisServiceRow["status"] {
  if (health >= 75) return "Healthy";
  if (health >= 55) return "Degraded";
  return "Critical";
}

function buildProjectRows(
  projects: ProjectOwnershipViewModel[],
  portfolioHealth: PortfolioProjectHealthViewModel[],
): AnalysisProjectRow[] {
  return projects.map((project) => {
    const snapshot = portfolioHealth.find((entry) => entry.projectId === project.id);
    const health = snapshot?.healthScore ?? null;
    const merit = snapshot?.merit ?? "yellow";

    return {
      projectId: project.id,
      name: project.name,
      serviceCount: project.serviceNames.length,
      status: health === null ? meritToStatusLabel(merit) : serviceStatusFromHealth(health),
      healthPercent: health ?? 70,
    };
  });
}

function buildServiceRows(
  projects: ProjectOwnershipViewModel[],
  incidents: IncidentViewModel[],
): AnalysisServiceRow[] {
  const byService = new Map<string, IncidentViewModel[]>();

  for (const incident of incidents) {
    const key = normalizeService(incident.service);
    const bucket = byService.get(key) ?? [];
    bucket.push(incident);
    byService.set(key, bucket);
  }

  const catalogServices = projects.flatMap((project) =>
    project.serviceNames.map((serviceName) => ({
      serviceName,
      project,
    })),
  );

  const rows: AnalysisServiceRow[] = [];

  for (const { serviceName, project } of catalogServices) {
    const serviceIncidents = byService.get(normalizeService(serviceName)) ?? [];
    const health = healthFromIncidents(serviceIncidents);
    rows.push({
      serviceName,
      projectName: project.name,
      status: serviceStatusFromHealth(health),
      healthPercent: health,
    });
  }

  for (const [serviceKey, serviceIncidents] of byService.entries()) {
    if (rows.some((row) => normalizeService(row.serviceName) === serviceKey)) {
      continue;
    }
    const project = projectForService(projects, serviceIncidents[0]?.service ?? serviceKey);
    const health = healthFromIncidents(serviceIncidents);
    rows.push({
      serviceName: serviceIncidents[0]?.service ?? serviceKey,
      projectName: project?.name ?? "Unscoped",
      status: serviceStatusFromHealth(health),
      healthPercent: health,
    });
  }

  return rows
    .sort((left, right) => left.healthPercent - right.healthPercent)
    .slice(0, 8);
}

function buildServiceStatusBuckets(rows: AnalysisServiceRow[]): AnalysisServiceStatusBucket[] {
  const counts = { Healthy: 0, Degraded: 0, Critical: 0, Unknown: 0 };

  for (const row of rows) {
    counts[row.status] += 1;
  }

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;

  return (["Healthy", "Degraded", "Critical", "Unknown"] as const).map((label) => {
    const count = counts[label];
    return {
      label,
      count,
      percent: Math.round((count / total) * 100),
    };
  });
}

function buildMetricsFromTelemetry(
  metrics: WorkspaceTelemetryMetrics,
): AnalysisMetricRow[] {
  return [
    {
      label: "Request volume",
      value: `${metrics.requestVolumeK.toFixed(1)} K`,
      trendPercent: Math.min(24, Math.round(metrics.requestVolumeK / 4)),
      trendPositive: true,
    },
    {
      label: "Error rate",
      value: `${metrics.errorRatePercent.toFixed(2)}%`,
      trendPercent: Math.round(metrics.errorRatePercent / 10) || 1,
      trendPositive: false,
    },
    {
      label: "Latency (p95)",
      value: `${metrics.latencyP95Ms} ms`,
      trendPercent: Math.min(22, Math.round(metrics.latencyP95Ms / 8)),
      trendPositive: metrics.latencyP95Ms < 120,
    },
    {
      label: "Saturation",
      value: `${metrics.saturationPercent}%`,
      trendPercent: Math.min(15, Math.round(metrics.saturationPercent / 8)),
      trendPositive: metrics.saturationPercent < 70,
    },
    {
      label: "Availability",
      value: `${metrics.availabilityPercent.toFixed(1)}%`,
      trendPercent: Math.max(0.2, (100 - metrics.availabilityPercent) / 5),
      trendPositive: metrics.availabilityPercent >= 99,
    },
  ];
}

function buildMetrics(
  incidents: IncidentViewModel[],
  _analyses: AnalysisViewModel[],
): AnalysisMetricRow[] {
  const snapshot = buildWorkspaceTelemetryMetrics({
    incidents,
    query: null,
    resolvedServiceCount: incidents.length,
  });
  return buildMetricsFromTelemetry(snapshot);
}

function buildTelemetrySubSteps(
  workflowStage: AnalysisWorkflowStage,
  isAnalyzing: boolean,
): AnalysisTelemetrySubStep[] {
  const steps: AnalysisTelemetrySubStep[] = [
    { id: "ingest", label: "Ingesting telemetry data", status: "pending" },
    { id: "anomalies", label: "Detecting anomalies", status: "pending" },
    { id: "correlations", label: "Finding correlations", status: "pending" },
    { id: "aggregate", label: "Aggregating metrics", status: "pending" },
    { id: "insights", label: "Generating insights", status: "pending" },
    { id: "prepare", label: "Preparing results", status: "pending" },
  ];

  if (!isAnalyzing && workflowStage === "idle") {
    return steps;
  }

  if (workflowStage === "error") {
    return steps.map((step, index) => ({
      ...step,
      status: index === 0 ? "complete" : "pending",
    }));
  }

  if (workflowStage === "ready") {
    return steps.map((step) => ({ ...step, status: "complete" as const }));
  }

  const stageIndex: Record<AnalysisWorkflowStage, number> = {
    idle: -1,
    collecting_scope: 0,
    reading_telemetry: 1,
    root_cause_analysis: 3,
    reporting: 4,
    ready: 5,
    error: 0,
  };

  const activeIndex = stageIndex[workflowStage];

  return steps.map((step, index) => {
    if (index < activeIndex) {
      return { ...step, status: "complete" as const };
    }
    if (index === activeIndex && isAnalyzing) {
      return { ...step, status: "running" as const };
    }
    return step;
  });
}

function pipelineProgress(agentPipeline: AnalysisAgentStep[]): number {
  const weights = agentPipeline.map((step) => {
    if (step.status === "complete") return 1;
    if (step.status === "running") return 0.65;
    if (step.status === "error") return 0;
    return 0;
  });
  const total = weights.reduce<number>((sum, value) => sum + value, 0);
  return Math.round((total / Math.max(agentPipeline.length, 1)) * 100);
}

function pipelinePhaseLabel(
  workflowStage: AnalysisWorkflowStage,
  isAnalyzing: boolean,
): string {
  if (!isAnalyzing && workflowStage === "ready") {
    return "Analysis complete";
  }
  if (workflowStage === "collecting_scope") {
    return "Resolving project and service scope";
  }
  if (workflowStage === "reading_telemetry") {
    return "Analyzing telemetry and trends";
  }
  if (workflowStage === "root_cause_analysis") {
    return "Running root-cause analysis";
  }
  if (workflowStage === "reporting") {
    return "Generating PRIME report";
  }
  if (isAnalyzing) {
    return "Analysis in progress";
  }
  return "Waiting for analysis";
}

function topRecommendation(
  analyses: AnalysisViewModel[],
  primeReport: PrimeReportViewModel | null,
): string | null {
  const projectRec = primeReport?.projectSummary?.recommendation.immediateAction;
  if (projectRec?.trim()) return projectRec;

  const companyRec = primeReport?.companySummary?.recommendation.immediateAction;
  if (companyRec?.trim()) return companyRec;

  const first = analyses[0];
  if (!first) return null;

  return `${first.rootCause.hypothesis} ${first.remediationPlan.steps[0] ?? ""}`.trim();
}

export function buildAnalysisWorkspaceSummary(
  input: AnalysisWorkflowSummaryInput,
): AnalysisWorkspaceSummary {
  const {
    projectCatalog,
    portfolioHealth,
    incidents,
    analyses,
    primeReport,
    selectedProjectId,
    workflowStage,
    agentPipeline,
    isAnalyzing,
  } = input;

  const telemetryMetrics = resolveWorkspaceMetrics(input);
  const projects = scopedProjects(projectCatalog, selectedProjectId);
  const projectRows = buildProjectRows(projects, portfolioHealth);
  const serviceRows = buildServiceRows(projects, incidents);

  const totalServices =
    input.resolvedServiceCount ??
    projects.reduce((sum, project) => sum + project.serviceNames.length, 0);

  const activeIncidents = incidents.length;
  const anomaliesDetected = incidents.filter(
    (incident) => incident.severity === "critical" || incident.severity === "high",
  ).length;

  const mttrValues = portfolioHealth
    .map((entry) => entry.mttrMinutes)
    .filter((value): value is number => value !== null);
  const mttrMinutes =
    mttrValues.length > 0
      ? Math.round(mttrValues.reduce((sum, value) => sum + value, 0) / mttrValues.length)
      : activeIncidents > 0
        ? Math.round(
            incidents.reduce((sum, incident) => sum + incident.durationMinutes, 0) /
              incidents.length,
          )
        : null;

  return {
    totalProjects: projects.length,
    totalServices,
    mttrMinutes,
    mttrDeltaMinutes: mttrMinutes === null ? null : -8,
    activeIncidents,
    activeIncidentsDelta: activeIncidents > 0 ? 2 : null,
    anomaliesDetected,
    cost: telemetryMetrics ? buildCostOverview(telemetryMetrics) : EMPTY_COST,
    projectRows,
    serviceRows,
    metrics: telemetryMetrics
      ? buildMetricsFromTelemetry(telemetryMetrics)
      : incidents.length > 0
        ? buildMetrics(incidents, analyses)
        : EMPTY_METRICS,
    serviceStatusBuckets: buildServiceStatusBuckets(serviceRows),
    topRecommendation: topRecommendation(analyses, primeReport),
    telemetrySubSteps: buildTelemetrySubSteps(workflowStage, isAnalyzing),
    pipelineProgressPercent: pipelineProgress(agentPipeline),
    pipelinePhaseLabel: pipelinePhaseLabel(workflowStage, isAnalyzing),
  };
}
