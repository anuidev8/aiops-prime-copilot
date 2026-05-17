import { TimeWindow } from "../../domain/common/value-objects/time-window";
import { Incident } from "../../domain/observability/entities/incident";
import { AnalyzeLogsCommand, AnalyzeLogsResult } from "../contracts/analyze-logs";
import {
  AIOpsAnalystAgent,
  PrimeReporterAgent,
  TelemetryAgent,
} from "../contracts/agent-ports";

export class AnalyzeLogsUseCase {
  constructor(
    private readonly telemetryAgent: TelemetryAgent,
    private readonly analystAgent: AIOpsAnalystAgent,
    private readonly reporterAgent: PrimeReporterAgent,
  ) {}

  async execute(command: AnalyzeLogsCommand): Promise<AnalyzeLogsResult> {
    const requestedServices =
      command.services
        ?.map((name) => name.trim().toLowerCase())
        .filter((name) => Boolean(name)) ?? [];
    const requestedTimeWindowMinutes = command.timeWindowMinutes ?? null;
    const requestedTimeWindow =
      requestedTimeWindowMinutes === null
        ? undefined
        : TimeWindow.lastMinutes(requestedTimeWindowMinutes);

    const incidents = await this.telemetryAgent.detectIncidents({
      serviceNames: requestedServices.length ? requestedServices : undefined,
      timeWindow: requestedTimeWindow,
    });
    const resolvedTimeWindow = this.resolveTimeWindow({
      incidents,
      requestedTimeWindow,
    });
    const analyzedServices = this.resolveAnalyzedServices({
      incidents,
      requestedServices,
    });

    const analyses = await this.analystAgent.analyzeIncidents({ incidents });

    const primeReport = await this.reporterAgent.buildPrimeReport({
      incidents,
      analyses,
      timeWindow: resolvedTimeWindow,
    });

    return {
      query: {
        requestedServices,
        analyzedServices,
        requestedTimeWindowMinutes,
        resolvedTimeWindowMinutes: round(resolvedTimeWindow.durationMinutes()),
        resolvedWindowFrom: resolvedTimeWindow.from.toISOString(),
        resolvedWindowTo: resolvedTimeWindow.to.toISOString(),
      },
      incidents: incidents.map((incident) => ({
        id: incident.id,
        service: incident.service.value(),
        fingerprint: incident.fingerprint,
        severity: incident.severity.value(),
        startedAt: incident.startedAt.toISOString(),
        endedAt: incident.endedAt.toISOString(),
        durationMinutes: Math.round(incident.durationMinutes() * 100) / 100,
        logCount: incident.logs.length,
        status: incident.status,
      })),
      analyses: analyses.map((analysis) => ({
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
      })),
      primeReport: {
        generatedAt: primeReport.generatedAt.toISOString(),
        narrative: primeReport.narrative,
        businessSummary: primeReport.businessSummary,
        kpis: primeReport.kpis.map((kpi) => ({
          name: kpi.name,
          value: kpi.value,
          unit: kpi.unit,
          trend: kpi.trend,
          description: kpi.description,
        })),
      },
      ui: [
        {
          type: "IncidentTable",
          props: {
            incidents: incidents.map((incident) => ({
              id: incident.id,
              service: incident.service.value(),
              fingerprint: incident.fingerprint,
              severity: incident.severity.value(),
              startedAt: incident.startedAt.toISOString(),
              endedAt: incident.endedAt.toISOString(),
              durationMinutes: Math.round(incident.durationMinutes() * 100) / 100,
              logCount: incident.logs.length,
              status: incident.status,
            })),
          },
        },
        {
          type: "PrimeKpiCards",
          props: {
            kpis: primeReport.kpis.map((kpi) => ({
              name: kpi.name,
              value: kpi.value,
              unit: kpi.unit,
              trend: kpi.trend,
              description: kpi.description,
            })),
          },
        },
        {
          type: "PrimeNarrative",
          props: {
            narrative: primeReport.narrative,
            businessSummary: primeReport.businessSummary,
          },
        },
      ],
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
    ).sort(
      (left, right) => left.localeCompare(right),
    );
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
