import { TimeWindow } from "../../domain/common/value-objects/time-window";
import { Incident } from "../../domain/observability/entities/incident";
import { AnalyzeLogsCommand, AnalyzeLogsResult } from "../contracts/analyze-logs";

export interface ResolvedScope {
  requestedCompanyId: string | null;
  requestedProjectId: string | null;
  requestedServices: string[];
  requestedTimeWindowMinutes: number | null;
  requestedTimeWindow?: TimeWindow;
}

export function resolveScope(command: AnalyzeLogsCommand): ResolvedScope {
  const requestedCompanyId = command.companyId?.trim() || null;
  const requestedProjectId = command.projectId?.trim() || null;
  const requestedServices =
    command.services
      ?.map((name) => name.trim().toLowerCase())
      .filter((name) => Boolean(name)) ?? [];
  const requestedTimeWindowMinutes = command.timeWindowMinutes ?? null;
  const requestedTimeWindow =
    requestedTimeWindowMinutes === null
      ? undefined
      : TimeWindow.lastMinutes(requestedTimeWindowMinutes);

  return {
    requestedCompanyId,
    requestedProjectId,
    requestedServices,
    requestedTimeWindowMinutes,
    requestedTimeWindow,
  };
}

export function resolveTimeWindow(params: {
  incidents: Incident[];
  requestedTimeWindow?: TimeWindow;
}): TimeWindow {
  if (params.requestedTimeWindow) {
    return params.requestedTimeWindow;
  }

  if (params.incidents.length === 0) {
    return TimeWindow.lastMinutes(60);
  }

  let earliest = params.incidents[0].startedAt;
  let latest = params.incidents[0].endedAt;

  for (const incident of params.incidents) {
    if (incident.startedAt.getTime() < earliest.getTime()) {
      earliest = incident.startedAt;
    }

    if (incident.endedAt.getTime() > latest.getTime()) {
      latest = incident.endedAt;
    }
  }

  return new TimeWindow(earliest, latest);
}

export function resolveAnalyzedServices(params: {
  incidents: Incident[];
  requestedServices: string[];
}): string[] {
  if (params.incidents.length === 0) {
    return params.requestedServices;
  }

  return Array.from(
    new Set(params.incidents.map((incident) => incident.service.value())),
  ).sort((left, right) => left.localeCompare(right));
}

export function buildQuery(params: {
  scope: ResolvedScope;
  analyzedServices: string[];
  resolvedTimeWindow: TimeWindow;
  resolvedHierarchy?: {
    resolvedCompanyId: string | null;
    resolvedProjectId: string | null;
    resolvedProjectName: string | null;
  };
}): AnalyzeLogsResult["query"] {
  return {
    requestedCompanyId: params.scope.requestedCompanyId,
    requestedProjectId: params.scope.requestedProjectId,
    resolvedCompanyId: params.resolvedHierarchy?.resolvedCompanyId ?? null,
    resolvedProjectId: params.resolvedHierarchy?.resolvedProjectId ?? null,
    resolvedProjectName: params.resolvedHierarchy?.resolvedProjectName ?? null,
    resolvedServiceCount: params.analyzedServices.length,
    requestedServices: params.scope.requestedServices,
    analyzedServices: params.analyzedServices,
    requestedTimeWindowMinutes: params.scope.requestedTimeWindowMinutes,
    resolvedTimeWindowMinutes: round(params.resolvedTimeWindow.durationMinutes()),
    resolvedWindowFrom: params.resolvedTimeWindow.from.toISOString(),
    resolvedWindowTo: params.resolvedTimeWindow.to.toISOString(),
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
