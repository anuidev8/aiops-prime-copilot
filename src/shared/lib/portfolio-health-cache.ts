import {
  AnalyzeLogsResult,
  IncidentViewModel,
  PortfolioMeritStatus,
  PortfolioProjectHealthViewModel,
  PrimeKpiViewModel,
  ProjectOwnershipViewModel,
} from "@/shared/types/aiops";

type PortfolioHealthCache = Record<string, PortfolioProjectHealthViewModel>;

function normalizeService(value: string): string {
  return value.trim().toLowerCase();
}

function createEmptyEntry(
  project: ProjectOwnershipViewModel,
): PortfolioProjectHealthViewModel {
  return {
    projectId: project.id,
    projectName: project.name,
    companyId: project.companyId,
    healthScore: null,
    merit: "yellow",
    incidentCount: 0,
    criticalCount: 0,
    mttrMinutes: null,
    autoHandleableRate: null,
    hasData: false,
    updatedAt: null,
    source: null,
  };
}

function toMeritStatus(score: number): PortfolioMeritStatus {
  if (score >= 75) return "green";
  if (score >= 55) return "yellow";
  return "red";
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function averageDuration(incidents: IncidentViewModel[]): number {
  if (incidents.length === 0) return 0;
  const total = incidents.reduce((sum, incident) => sum + incident.durationMinutes, 0);
  return round(total / incidents.length);
}

function derivedHealthScore(incidents: IncidentViewModel[]): number {
  if (incidents.length === 0) {
    return 92;
  }

  const penaltyBySeverity: Record<IncidentViewModel["severity"], number> = {
    critical: 25,
    high: 14,
    medium: 8,
    low: 4,
  };

  const severityPenalty = incidents.reduce(
    (sum, incident) => sum + penaltyBySeverity[incident.severity],
    0,
  );
  const durationPenalty = Math.min(20, averageDuration(incidents) / 6);
  return Math.max(0, Math.round(100 - severityPenalty - durationPenalty));
}

function findKpi(
  kpis: PrimeKpiViewModel[],
  matcher: (name: string) => boolean,
): PrimeKpiViewModel | null {
  for (const kpi of kpis) {
    if (matcher(kpi.name.toLowerCase())) return kpi;
  }
  return null;
}

function projectIncidents(
  incidents: IncidentViewModel[],
  serviceNames: string[],
): IncidentViewModel[] {
  const serviceSet = new Set(serviceNames.map(normalizeService));
  return incidents.filter((incident) => serviceSet.has(normalizeService(incident.service)));
}

function coverageProjectIds(params: {
  result: AnalyzeLogsResult;
  projectCatalog: ProjectOwnershipViewModel[];
}): string[] {
  const { result, projectCatalog } = params;
  const query = result.query;
  const resolvedProjectId = query.resolvedProjectId ?? query.requestedProjectId ?? null;
  if (resolvedProjectId) {
    return [resolvedProjectId];
  }

  const resolvedCompanyId = query.resolvedCompanyId ?? query.requestedCompanyId ?? null;
  if (resolvedCompanyId) {
    return projectCatalog
      .filter((project) => project.companyId === resolvedCompanyId)
      .map((project) => project.id);
  }

  const analyzedServices =
    query.analyzedServices.length > 0
      ? query.analyzedServices
      : query.requestedServices.length > 0
        ? query.requestedServices
        : Array.from(new Set(result.incidents.map((incident) => incident.service)));

  const analyzedSet = new Set(analyzedServices.map(normalizeService));
  if (analyzedSet.size > 0) {
    return projectCatalog
      .filter((project) =>
        project.serviceNames.some((service) => analyzedSet.has(normalizeService(service))),
      )
      .map((project) => project.id);
  }

  const isGlobalRunWithoutScope =
    !query.requestedCompanyId &&
    !query.requestedProjectId &&
    query.requestedServices.length === 0;

  return isGlobalRunWithoutScope ? projectCatalog.map((project) => project.id) : [];
}

function withCatalog(
  current: PortfolioHealthCache,
  projectCatalog: ProjectOwnershipViewModel[],
): PortfolioHealthCache {
  const next = { ...current };

  for (const project of projectCatalog) {
    const existing = next[project.id];
    next[project.id] = existing
      ? {
          ...existing,
          projectName: project.name,
          companyId: project.companyId,
        }
      : createEmptyEntry(project);
  }

  return next;
}

export function seedPortfolioHealthCache(
  current: PortfolioHealthCache,
  projectCatalog: ProjectOwnershipViewModel[],
): PortfolioHealthCache {
  return withCatalog(current, projectCatalog);
}

export function mergeAnalysisIntoPortfolioHealth(params: {
  current: PortfolioHealthCache;
  projectCatalog: ProjectOwnershipViewModel[];
  result: AnalyzeLogsResult;
  source: "manual" | "copilot" | "system";
}): PortfolioHealthCache {
  const { current, projectCatalog, result, source } = params;
  const now = new Date().toISOString();
  const next = withCatalog(current, projectCatalog);
  const summary = result.primeReport.projectSummary;
  const coveredProjectIds = new Set(
    coverageProjectIds({ result, projectCatalog }),
  );

  for (const projectId of coveredProjectIds) {
    const project =
      projectCatalog.find((entry) => entry.id === projectId) ??
      (summary && summary.projectId === projectId
        ? {
            id: summary.projectId,
            name: summary.projectName,
            companyId:
              result.query.resolvedCompanyId ??
              result.query.requestedCompanyId ??
              "unknown",
            serviceNames: [],
          }
        : null);
    if (!project) {
      continue;
    }

    const incidents = projectIncidents(result.incidents, project.serviceNames);
    const criticalCount = incidents.filter((incident) => incident.severity === "critical").length;
    const projectedSummary = summary?.projectId === projectId ? summary : null;
    const healthScore = projectedSummary
      ? projectedSummary.healthScore
      : derivedHealthScore(incidents);
    const mttr =
      projectedSummary
        ? findKpi(projectedSummary.kpis, (name) => name === "mttr")?.value ?? null
        : averageDuration(incidents);
    const autoHandleableRate = projectedSummary
      ? findKpi(projectedSummary.kpis, (name) => name.includes("auto-handleable"))?.value ??
        null
      : null;

    next[projectId] = {
      projectId,
      projectName: project.name,
      companyId: project.companyId,
      healthScore,
      merit: toMeritStatus(healthScore),
      incidentCount: incidents.length,
      criticalCount,
      mttrMinutes: mttr,
      autoHandleableRate,
      hasData: true,
      updatedAt: now,
      source,
    };
  }

  return next;
}
