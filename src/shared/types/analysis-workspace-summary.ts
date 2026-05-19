import type { AnalysisAgentStep } from "@/shared/types/analysis-progress";
import type {
  AnalysisViewModel,
  IncidentViewModel,
  PortfolioMeritStatus,
  PortfolioProjectHealthViewModel,
  PrimeReportViewModel,
  ProjectOwnershipViewModel,
} from "@/shared/types/aiops";
import type { WorkspaceTelemetryMetrics } from "@/shared/types/workspace-telemetry-metrics";

export type AnalysisWorkflowStage =
  | "idle"
  | "collecting_scope"
  | "reading_telemetry"
  | "root_cause_analysis"
  | "reporting"
  | "ready"
  | "error";

export interface AnalysisWorkflowSummaryInput {
  projectCatalog: ProjectOwnershipViewModel[];
  portfolioHealth: PortfolioProjectHealthViewModel[];
  incidents: IncidentViewModel[];
  analyses: AnalysisViewModel[];
  primeReport: PrimeReportViewModel | null;
  selectedProjectId: string | null;
  resolvedServiceCount: number | null;
  workflowStage: AnalysisWorkflowStage;
  agentPipeline: AnalysisAgentStep[];
  isAnalyzing: boolean;
  workspaceMetrics?: WorkspaceTelemetryMetrics | null;
}

export type AnalysisCostSource = "estimated" | "telemetry";

export interface AnalysisCostBreakdownItem {
  label: string;
  amountUsd: number;
  percent: number;
  color: string;
}

export interface AnalysisCostOverview {
  source: AnalysisCostSource;
  totalUsd: number;
  windowLabel: string;
  breakdown: AnalysisCostBreakdownItem[];
}

export interface AnalysisProjectRow {
  projectId: string;
  name: string;
  serviceCount: number;
  status: "Healthy" | "Degraded" | "Critical";
  healthPercent: number;
}

export interface AnalysisServiceRow {
  serviceName: string;
  projectName: string;
  status: "Healthy" | "Degraded" | "Critical";
  healthPercent: number;
}

export interface AnalysisMetricRow {
  label: string;
  value: string;
  trendPercent: number;
  trendPositive: boolean;
}

export interface AnalysisServiceStatusBucket {
  label: string;
  count: number;
  percent: number;
}

export interface AnalysisTelemetrySubStep {
  id: string;
  label: string;
  status: "pending" | "running" | "complete";
}

export interface AnalysisWorkspaceSummary {
  totalProjects: number;
  totalServices: number;
  mttrMinutes: number | null;
  mttrDeltaMinutes: number | null;
  activeIncidents: number;
  activeIncidentsDelta: number | null;
  anomaliesDetected: number;
  cost: AnalysisCostOverview;
  projectRows: AnalysisProjectRow[];
  serviceRows: AnalysisServiceRow[];
  metrics: AnalysisMetricRow[];
  serviceStatusBuckets: AnalysisServiceStatusBucket[];
  topRecommendation: string | null;
  telemetrySubSteps: AnalysisTelemetrySubStep[];
  pipelineProgressPercent: number;
  pipelinePhaseLabel: string;
}

export function meritToStatusLabel(merit: PortfolioMeritStatus): AnalysisProjectRow["status"] {
  if (merit === "green") return "Healthy";
  if (merit === "yellow") return "Degraded";
  return "Critical";
}
