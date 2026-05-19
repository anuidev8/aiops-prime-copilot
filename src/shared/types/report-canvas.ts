import { PrimeKpiViewModel } from "@/shared/types/aiops";

export type ReportBlockStatus = "pending" | "streaming" | "done";
export type ReportCanvasChartKind = "kpi" | "bars" | "ring" | "trend";
export type WorkspaceMode = "analysis" | "report-canvas";

export interface ReportCanvasSeriesDatum {
  id: string;
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface ReportCanvasChartVisual {
  kind: ReportCanvasChartKind;
  maxValue?: number;
  series?: ReportCanvasSeriesDatum[];
}

export interface ReportCanvasTextBlock {
  id: string;
  type: "text";
  title: string;
  content: string;
  status?: ReportBlockStatus;
}

export interface ReportCanvasChartBlock {
  id: string;
  type: "chart";
  title: string;
  metricName: string;
  value: number;
  unit: string;
  trend: PrimeKpiViewModel["trend"];
  note: string;
  visual?: ReportCanvasChartVisual;
  status?: ReportBlockStatus;
}

export type ReportCanvasBlock = ReportCanvasTextBlock | ReportCanvasChartBlock;

export interface ReportCanvasDocument {
  id: string;
  generatedAt: string;
  sourceProjectId: string | null;
  sourceProjectName: string | null;
  blocks: ReportCanvasBlock[];
}
