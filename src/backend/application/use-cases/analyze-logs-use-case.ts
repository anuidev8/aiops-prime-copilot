import { TimeWindow } from "../../domain/common/value-objects/time-window";
import { Analysis } from "../../domain/aiops-analysis/entities/analysis";
import { Incident } from "../../domain/observability/entities/incident";
import { PrimeReport } from "../../domain/prime-reporting/entities/prime-report";
import { ProjectOwnershipRepository } from "../../domain/project-analytics/ports/project-ownership-repository";
import {
  AnalysisDto,
  AnalyzeLogsCommand,
  AnalyzeLogsResult,
  IncidentDto,
  PrimeReportDto,
} from "../contracts/analyze-logs";
import { AnalyzeLogsProgressReporter } from "../contracts/analyze-logs-progress";
import { resolveHierarchicalScope } from "../shared/hierarchical-scope-resolver";
import {
  AIOpsAnalystAgent,
  PrimeReporterAgent,
  TelemetryAgent,
} from "../contracts/agent-ports";

interface ResolvedScope {
  requestedCompanyId: string | null;
  requestedProjectId: string | null;
  requestedServices: string[];
  requestedTimeWindowMinutes: number | null;
  requestedTimeWindow?: TimeWindow;
}

export class AnalyzeLogsUseCase {
  constructor(
    private readonly telemetryAgent: TelemetryAgent,
    private readonly analystAgent: AIOpsAnalystAgent,
    private readonly reporterAgent: PrimeReporterAgent,
    private readonly ownershipRepository?: ProjectOwnershipRepository,
  ) {}

  async execute(command: AnalyzeLogsCommand): Promise<AnalyzeLogsResult> {
    return this.executeWithProgress(command);
  }

  async executeWithProgress(
    command: AnalyzeLogsCommand,
    reportProgress?: AnalyzeLogsProgressReporter,
  ): Promise<AnalyzeLogsResult> {
    const emit = (event: Parameters<AnalyzeLogsProgressReporter>[0]) => {
      reportProgress?.(event);
    };

    const scope = this.resolveScope(command);
    const hierarchy = await resolveHierarchicalScope(scope, this.ownershipRepository);
    const timestamp = () => new Date().toISOString();

    emit({
      type: "agent_started",
      agent: "scope",
      detail: "Resolving services and telemetry time window.",
      timestamp: timestamp(),
    });

    emit({
      type: "agent_completed",
      agent: "scope",
      detail: this.describeScope(scope),
      timestamp: timestamp(),
      snapshot: {},
    });

    emit({
      type: "agent_started",
      agent: "telemetry",
      detail: "Scanning observability streams for correlated incident bursts.",
      timestamp: timestamp(),
    });

    const incidents = await this.telemetryAgent.detectIncidents({
      serviceNames: hierarchy.hasExplicitServiceScope
        ? hierarchy.serviceNames
        : undefined,
      timeWindow: scope.requestedTimeWindow,
    });

    const resolvedTimeWindow = this.resolveTimeWindow({
      incidents,
      requestedTimeWindow: scope.requestedTimeWindow,
    });
    const analyzedServices = this.resolveAnalyzedServices({
      incidents,
      requestedServices: hierarchy.hasExplicitServiceScope
        ? hierarchy.serviceNames
        : scope.requestedServices,
    });
    const query = this.buildQuery({
      scope,
      analyzedServices,
      resolvedTimeWindow,
      resolvedHierarchy: hierarchy,
    });
    const incidentDtos = incidents.map((incident) => this.toIncidentDto(incident));

    emit({
      type: "agent_completed",
      agent: "telemetry",
      detail: `Detected ${incidents.length} incident${incidents.length === 1 ? "" : "s"} across telemetry.`,
      timestamp: timestamp(),
      snapshot: {
        query,
        incidents: incidentDtos,
        analyses: [],
      },
    });

    emit({
      type: "agent_started",
      agent: "analyst",
      detail:
        incidents.length > 0
          ? `Running ADK analyst on ${incidents.length} incident${incidents.length === 1 ? "" : "s"}.`
          : "No incidents detected — skipping deep analysis.",
      timestamp: timestamp(),
    });

    const analysisDtos: AnalysisDto[] = [];
    let analyses: Analysis[] = [];

    if (incidents.length > 0) {
      analyses = await this.analystAgent.analyzeIncidents({
        incidents,
        onIncidentAnalyzed: ({ analysis, index, total }) => {
          const analysisDto = this.toAnalysisDto(analysis);
          analysisDtos.push(analysisDto);

          const incident = incidents[index];
          emit({
            type: "incident_analyzed",
            detail: `Analyzed ${incident.service.value()} incident ${incident.id}.`,
            timestamp: timestamp(),
            progress: {
              current: index + 1,
              total,
              incidentId: incident.id,
              service: incident.service.value(),
            },
            snapshot: {
              query,
              incidents: incidentDtos,
              analyses: [...analysisDtos],
            },
          });
        },
      });

      if (analysisDtos.length === 0) {
        for (const analysis of analyses) {
          analysisDtos.push(this.toAnalysisDto(analysis));
        }
      }
    }

    emit({
      type: "agent_completed",
      agent: "analyst",
      detail:
        analysisDtos.length > 0
          ? `Completed root-cause analysis for ${analysisDtos.length} incident${analysisDtos.length === 1 ? "" : "s"}.`
          : "Analyst agent finished with no incidents to score.",
      timestamp: timestamp(),
      snapshot: {
        query,
        incidents: incidentDtos,
        analyses: analysisDtos,
      },
    });

    emit({
      type: "agent_started",
      agent: "reporter",
      detail: "Generating PRIME KPIs and executive narrative.",
      timestamp: timestamp(),
    });

    const primeReport = await this.reporterAgent.buildPrimeReport({
      incidents,
      analyses: analysisDtos.length > 0 ? analyses : [],
      timeWindow: resolvedTimeWindow,
      scopeContext: {
        requestedCompanyId: query.requestedCompanyId,
        requestedProjectId: query.requestedProjectId,
        resolvedCompanyId: query.resolvedCompanyId,
        resolvedProjectId: query.resolvedProjectId,
        resolvedProjectName: query.resolvedProjectName,
        analyzedServices: query.analyzedServices,
        resolvedServiceCount: query.resolvedServiceCount,
      },
    });

    const primeReportDto = this.toPrimeReportDto(primeReport);

    emit({
      type: "agent_completed",
      agent: "reporter",
      detail: `Published ${primeReportDto.kpis.length} KPIs to the executive report.`,
      timestamp: timestamp(),
      snapshot: {
        query,
        incidents: incidentDtos,
        analyses: analysisDtos,
        primeReport: primeReportDto,
      },
    });

    const result = this.buildResult({
      query,
      incidentDtos,
      analysisDtos,
      primeReportDto,
    });

    emit({
      type: "complete",
      timestamp: timestamp(),
      result,
    });

    return result;
  }

  private resolveScope(command: AnalyzeLogsCommand): ResolvedScope {
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

  private describeScope(scope: ResolvedScope): string {
    const dimensions: string[] = [];

    if (scope.requestedCompanyId) {
      dimensions.push(`company=${scope.requestedCompanyId}`);
    }

    if (scope.requestedProjectId) {
      dimensions.push(`project=${scope.requestedProjectId}`);
    }

    if (scope.requestedServices.length > 0) {
      dimensions.push(`services=${scope.requestedServices.join(", ")}`);
    }

    if (dimensions.length === 0) {
      return "Scope locked to all available services.";
    }

    return `Scope locked to ${dimensions.join(" · ")}.`;
  }

  private buildQuery(params: {
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

  private toIncidentDto(incident: Incident): IncidentDto {
    return {
      id: incident.id,
      service: incident.service.value(),
      fingerprint: incident.fingerprint,
      severity: incident.severity.value(),
      startedAt: incident.startedAt.toISOString(),
      endedAt: incident.endedAt.toISOString(),
      durationMinutes: Math.round(incident.durationMinutes() * 100) / 100,
      logCount: incident.logs.length,
      status: incident.status,
    };
  }

  private toAnalysisDto(analysis: Analysis): AnalysisDto {
    return {
      incidentId: analysis.incidentId,
      summary: analysis.summary,
      rootCause: {
        hypothesis: analysis.rootCause.hypothesis,
        evidence: analysis.rootCause.evidence,
        confidence: analysis.rootCause.confidence,
      },
      remediationPlan: {
        summary: analysis.remediationPlan.summary,
        steps: analysis.remediationPlan.steps,
        automationCandidate: analysis.remediationPlan.automationCandidate,
        estimatedMinutes: analysis.remediationPlan.estimatedMinutes,
      },
    };
  }

  private toPrimeReportDto(primeReport: PrimeReport): PrimeReportDto {
    const mapKpi = (kpi: PrimeReport["kpis"][number]) => ({
      name: kpi.name,
      value: kpi.value,
      unit: kpi.unit,
      trend: kpi.trend,
      description: kpi.description,
    });

    return {
      generatedAt: primeReport.generatedAt.toISOString(),
      narrative: primeReport.narrative,
      businessSummary: primeReport.businessSummary,
      kpis: primeReport.kpis.map(mapKpi),
      projectSummary: primeReport.projectSummary
        ? {
            projectId: primeReport.projectSummary.projectId,
            projectName: primeReport.projectSummary.projectName,
            healthScore: primeReport.projectSummary.healthScore,
            kpis: primeReport.projectSummary.kpis.map(mapKpi),
            severityMix: primeReport.projectSummary.severityMix,
            incidentTrend: primeReport.projectSummary.incidentTrend,
            recommendation: primeReport.projectSummary.recommendation,
          }
        : undefined,
      companySummary: primeReport.companySummary
        ? {
            companyId: primeReport.companySummary.companyId,
            companyName: primeReport.companySummary.companyName,
            kpis: primeReport.companySummary.kpis.map(mapKpi),
            topRisks: primeReport.companySummary.topRisks,
            recommendation: primeReport.companySummary.recommendation,
          }
        : undefined,
    };
  }

  private buildResult(params: {
    query: AnalyzeLogsResult["query"];
    incidentDtos: IncidentDto[];
    analysisDtos: AnalysisDto[];
    primeReportDto: PrimeReportDto;
  }): AnalyzeLogsResult {
    const ui: AnalyzeLogsResult["ui"] = [
      {
        type: "IncidentTable",
        props: { incidents: params.incidentDtos },
      },
      {
        type: "PrimeKpiCards",
        props: { kpis: params.primeReportDto.kpis },
      },
      {
        type: "PrimeNarrative",
        props: {
          narrative: params.primeReportDto.narrative,
          businessSummary: params.primeReportDto.businessSummary,
        },
      },
    ];

    if (params.primeReportDto.projectSummary) {
      ui.push(
        {
          type: "ProjectHealthCards",
          props: {
            projectName: params.primeReportDto.projectSummary.projectName,
            healthScore: params.primeReportDto.projectSummary.healthScore,
            kpis: params.primeReportDto.projectSummary.kpis,
          },
        },
        {
          type: "ProjectSeverityDonut",
          props: {
            severityMix: params.primeReportDto.projectSummary.severityMix,
          },
        },
        {
          type: "ProjectServiceBarChart",
          props: {
            kpis: params.primeReportDto.projectSummary.kpis,
          },
        },
        {
          type: "ProjectIncidentTrendChart",
          props: {
            points: params.primeReportDto.projectSummary.incidentTrend,
          },
        },
      );
    }

    return {
      query: params.query,
      incidents: params.incidentDtos,
      analyses: params.analysisDtos,
      primeReport: params.primeReportDto,
      ui,
    };
  }

  private resolveTimeWindow(params: {
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

  private resolveAnalyzedServices(params: {
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
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
