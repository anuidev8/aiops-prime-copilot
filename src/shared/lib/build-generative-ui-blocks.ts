import {
  AnalysisViewModel,
  AnalyzeLogsResult,
  GenerativeUiBlock,
  IncidentViewModel,
  PrimeReportViewModel,
} from "@/shared/types/aiops";

function hasPrimeReportContent(report: PrimeReportViewModel | null | undefined): boolean {
  if (!report) return false;
  return (
    report.kpis.length > 0 ||
    Boolean(report.narrative.trim()) ||
    Boolean(report.businessSummary.trim())
  );
}

export function buildGenerativeUiBlocks(params: {
  incidents: IncidentViewModel[];
  analyses?: AnalysisViewModel[];
  primeReport?: PrimeReportViewModel | null;
}): GenerativeUiBlock[] {
  const blocks: GenerativeUiBlock[] = [];

  const analyses = params.analyses ?? [];
  if (analyses.length > 0) {
    const top = analyses[0];
    const confidence = top.rootCause.confidence;
    blocks.push({
      type: "RecommendationCard",
      props: {
        title: `Root cause: ${top.rootCause.hypothesis}`,
        priority: confidence >= 0.85 ? "P0" : confidence >= 0.65 ? "P1" : "P2",
        riskLevel: confidence >= 0.75 ? "high" : confidence >= 0.5 ? "medium" : "low",
        content: [
          top.summary,
          top.rootCause.evidence.length > 0
            ? `Evidence: ${top.rootCause.evidence.join(" · ")}`
            : null,
          top.remediationPlan.steps.length > 0
            ? `Remediation: ${top.remediationPlan.steps.slice(0, 3).join(" → ")}`
            : null,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    });
  }

  const primeReport = hasPrimeReportContent(params.primeReport)
    ? params.primeReport
    : null;

  if (primeReport) {
    blocks.push(
      {
        type: "PrimeKpiCards",
        props: { kpis: primeReport.kpis },
      },
      {
        type: "PrimeNarrative",
        props: {
          narrative: primeReport.narrative,
          businessSummary: primeReport.businessSummary,
        },
      },
    );

    if (primeReport.projectSummary) {
      blocks.push(
        {
          type: "ProjectHealthCards",
          props: {
            projectName: primeReport.projectSummary.projectName,
            healthScore: primeReport.projectSummary.healthScore,
            kpis: primeReport.projectSummary.kpis,
          },
        },
        {
          type: "ProjectSeverityDonut",
          props: {
            severityMix: primeReport.projectSummary.severityMix,
          },
        },
        {
          type: "ProjectServiceBarChart",
          props: { kpis: primeReport.projectSummary.kpis },
        },
        {
          type: "ProjectIncidentTrendChart",
          props: {
            points: primeReport.projectSummary.incidentTrend,
          },
        },
      );
    }
  }

  return blocks;
}

export function mergeGenerativeUiBlocks(
  incoming: AnalyzeLogsResult["ui"],
  previous: AnalyzeLogsResult["ui"] | undefined,
): AnalyzeLogsResult["ui"] {
  if (incoming.length > 0) {
    return incoming;
  }
  return previous?.length ? previous : incoming;
}
