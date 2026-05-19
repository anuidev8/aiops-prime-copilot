import { AnalyzeLogsResult, PrimeReportViewModel } from "@/shared/types/aiops";
import {
  ReportCanvasBlock,
  ReportCanvasChartBlock,
  ReportCanvasDocument,
  ReportCanvasSeriesDatum,
} from "@/shared/types/report-canvas";

function makeId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function recommendationText(
  recommendation: NonNullable<
    NonNullable<PrimeReportViewModel["projectSummary"]>["recommendation"]
  >,
): string {
  return [
    `Priority ${recommendation.priority} · Risk ${recommendation.riskLevel}`,
    "",
    "Immediate:",
    recommendation.immediateAction,
    "",
    "Short term:",
    recommendation.shortTermAction,
    "",
    "Strategic:",
    recommendation.strategicAction,
  ].join("\n");
}

function trendSentence(trend: "up" | "down" | "flat"): string {
  if (trend === "up") return "Trajectory is improving.";
  if (trend === "down") return "Trajectory is degrading.";
  return "Trajectory is stable.";
}

function normalizedBars(
  kpis: PrimeReportViewModel["kpis"],
): ReportCanvasSeriesDatum[] {
  if (kpis.length === 0) return [];
  const max = Math.max(...kpis.map((entry) => entry.value), 1);
  return kpis.slice(0, 5).map((kpi) => ({
    id: makeId("bar"),
    label: kpi.name,
    value: Number(((kpi.value / max) * 100).toFixed(2)),
  }));
}

function trendSeries(
  report: PrimeReportViewModel | null,
): ReportCanvasSeriesDatum[] {
  const points = report?.projectSummary?.incidentTrend ?? [];
  if (points.length === 0) return [];
  return points.slice(-8).map((point) => ({
    id: makeId("trend"),
    label: point.label,
    value: point.incidentCount,
    secondaryValue: point.criticalCount,
  }));
}

function severityRingSeries(
  report: PrimeReportViewModel | null,
): ReportCanvasSeriesDatum[] {
  const mix = report?.projectSummary?.severityMix ?? [];
  if (mix.length === 0) return [];
  return mix
    .filter((entry) => entry.count > 0)
    .map((entry) => ({
      id: makeId("sev"),
      label: entry.severity,
      value: entry.count,
    }));
}

/** First text block to focus when opening the canvas (editable narrative). */
export function primaryReportCanvasTextBlockTitle(
  report: PrimeReportViewModel | null,
): string {
  if (report?.narrative?.trim()) {
    return "Executive narrative";
  }
  if (report?.businessSummary?.trim()) {
    return "Business summary";
  }
  return "Headline";
}

export function createReportCanvasDocument(params: {
  report: PrimeReportViewModel | null;
  query: AnalyzeLogsResult["query"] | null;
}): ReportCanvasDocument {
  const { report, query } = params;
  const now = new Date().toISOString();

  const resolvedProjectName =
    report?.projectSummary?.projectName ?? query?.resolvedProjectName ?? "";
  const headline = resolvedProjectName
    ? `Executive summary — ${resolvedProjectName}`
    : "";
  const narrativeText = report?.narrative?.trim() ?? "";
  const businessSummaryText = report?.businessSummary?.trim() ?? "";

  const topKpis = (report?.kpis ?? []).slice(0, 3);
  const kpiBlocks: ReportCanvasChartBlock[] = topKpis.map((kpi, index) => ({
    id: makeId("chart"),
    type: "chart",
    title: `${kpi.name} snapshot`,
    metricName: kpi.name,
    value: kpi.value,
    unit: kpi.unit,
    trend: kpi.trend,
    note: `${kpi.description} ${trendSentence(kpi.trend)}`,
    visual: {
      kind: index === 0 ? "ring" : "kpi",
      maxValue: kpi.unit === "%" ? 100 : Math.max(kpi.value * 1.35, 1),
    },
  }));

  const bars = normalizedBars(report?.kpis ?? []);
  if (bars.length > 0) {
    kpiBlocks.push({
      id: makeId("chart"),
      type: "chart",
      title: "Service KPI spread",
      metricName: "Normalized KPI mix",
      value: bars[0]?.value ?? 0,
      unit: "%",
      trend: "flat",
      note: "Comparative bar profile across core metrics.",
      visual: {
        kind: "bars",
        maxValue: 100,
        series: bars,
      },
    });
  }

  const trend = trendSeries(report);
  if (trend.length > 0) {
    kpiBlocks.push({
      id: makeId("chart"),
      type: "chart",
      title: "Incident trajectory",
      metricName: "Incidents over time",
      value: trend.at(-1)?.value ?? 0,
      unit: "",
      trend: "flat",
      note: "Timeline of incident and critical activity.",
      visual: {
        kind: "trend",
        series: trend,
      },
    });
  }

  const severity = severityRingSeries(report);
  if (severity.length > 0) {
    kpiBlocks.push({
      id: makeId("chart"),
      type: "chart",
      title: "Severity composition",
      metricName: "Severity count",
      value: severity.reduce((sum, item) => sum + item.value, 0),
      unit: "",
      trend: "flat",
      note: "Current severity split in analyzed scope.",
      visual: {
        kind: "ring",
        maxValue: Math.max(severity.reduce((sum, item) => sum + item.value, 0), 1),
        series: severity,
      },
    });
  }

  const blocks: ReportCanvasBlock[] = [
    {
      id: makeId("text"),
      type: "text",
      title: "Headline",
      content: headline,
    },
    {
      id: makeId("text"),
      type: "text",
      title: "Executive narrative",
      content: narrativeText,
    },
    {
      id: makeId("text"),
      type: "text",
      title: "Business summary",
      content: businessSummaryText,
    },
    ...kpiBlocks,
  ];

  if (report?.companySummary?.topRisks?.length) {
    blocks.push({
      id: makeId("text"),
      type: "text",
      title: "Top risks",
      content: report.companySummary.topRisks.map((risk, index) => `${index + 1}. ${risk}`).join("\n"),
    });
  }

  if (report?.projectSummary?.recommendation) {
    blocks.push({
      id: makeId("text"),
      type: "text",
      title: "Recommendation",
      content: recommendationText(report.projectSummary.recommendation),
    });
  }

  return {
    id: makeId("canvas"),
    generatedAt: now,
    sourceProjectId:
      query?.resolvedProjectId ?? query?.requestedProjectId ?? report?.projectSummary?.projectId ?? null,
    sourceProjectName:
      query?.resolvedProjectName ?? report?.projectSummary?.projectName ?? null,
    blocks,
  };
}

export function updateCanvasBlock(
  document: ReportCanvasDocument,
  blockId: string,
  updater: (block: ReportCanvasBlock) => ReportCanvasBlock,
): ReportCanvasDocument {
  return {
    ...document,
    blocks: document.blocks.map((block) =>
      block.id === blockId ? updater(block) : block,
    ),
  };
}

export function canvasToPlainText(document: ReportCanvasDocument): string[] {
  const lines: string[] = [];
  lines.push(`Report Canvas ${document.id}`);
  lines.push(`Generated at: ${document.generatedAt}`);
  if (document.sourceProjectName) {
    lines.push(`Project: ${document.sourceProjectName}`);
  }
  lines.push("");

  for (const block of document.blocks) {
    if (block.type === "text") {
      lines.push(`${block.title}`);
      lines.push(block.content);
      lines.push("");
      continue;
    }

    lines.push(`${block.title}`);
    lines.push(`${block.metricName}: ${block.value}${block.unit}`);
    lines.push(`Trend: ${block.trend}`);
    lines.push(`Note: ${block.note}`);
    if (block.visual?.series?.length) {
      lines.push(
        `Series: ${block.visual.series
          .map((entry) => `${entry.label}=${entry.value}`)
          .join(", ")}`,
      );
    }
    lines.push("");
  }

  return lines;
}
