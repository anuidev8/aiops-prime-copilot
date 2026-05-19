import type { ReportCanvasBlock } from "@/shared/types/report-canvas";
import type { ReportSectionReviewStatus } from "@/shared/types/report-section";

export interface ReportSectionSnapshot {
  id: string;
  index: number;
  title: string;
  kind: "text" | "chart";
  reviewStatus: ReportSectionReviewStatus;
  isEditing: boolean;
  text?: {
    content: string;
  };
  chart?: {
    metricName: string;
    value: number;
    unit: string;
    trend: string;
    note: string;
    visualKind?: string;
    series?: Array<{
      label: string;
      value: number;
      secondaryValue?: number;
    }>;
  };
}

export function buildReportSectionSnapshot(params: {
  block: ReportCanvasBlock;
  index: number;
  reviewStatus: ReportSectionReviewStatus;
  isEditing: boolean;
}): ReportSectionSnapshot {
  const { block, index, reviewStatus, isEditing } = params;
  const base: ReportSectionSnapshot = {
    id: block.id,
    index,
    title: block.title,
    kind: block.type,
    reviewStatus,
    isEditing,
  };

  if (block.type === "text") {
    return { ...base, text: { content: block.content } };
  }

  return {
    ...base,
    chart: {
      metricName: block.metricName,
      value: block.value,
      unit: block.unit,
      trend: block.trend,
      note: block.note,
      visualKind: block.visual?.kind,
      series: block.visual?.series?.map((point) => ({
        label: point.label,
        value: point.value,
        secondaryValue: point.secondaryValue,
      })),
    },
  };
}
