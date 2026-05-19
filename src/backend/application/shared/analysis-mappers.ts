import { Analysis } from "../../domain/aiops-analysis/entities/analysis";
import { Incident } from "../../domain/observability/entities/incident";
import { PrimeReport } from "../../domain/prime-reporting/entities/prime-report";
import {
  AnalysisDto,
  AnalyzeLogsResult,
  IncidentDto,
  PrimeReportDto,
} from "../contracts/analyze-logs";

export function toIncidentDto(incident: Incident): IncidentDto {
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

export function toAnalysisDto(analysis: Analysis): AnalysisDto {
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

export function toPrimeReportDto(primeReport: PrimeReport): PrimeReportDto {
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

export function buildUiBlocks(params: {
  incidentDtos: IncidentDto[];
  primeReportDto?: PrimeReportDto;
}): AnalyzeLogsResult["ui"] {
  const blocks: AnalyzeLogsResult["ui"] = [
    {
      type: "IncidentTable",
      props: { incidents: params.incidentDtos },
    },
  ];

  if (params.primeReportDto) {
    blocks.push(
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
    );
  }

  return blocks;
}
