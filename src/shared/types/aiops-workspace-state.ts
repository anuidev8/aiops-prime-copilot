import type { AppNavId } from "@/shared/ui/layout/app-sidebar";
import type {
  AnalysisAgentStep,
  AnalysisIncidentProgress,
} from "@/shared/types/analysis-progress";
import type {
  AnalysisWorkflowStage,
  DashboardFocusState,
  ProjectScopeSelection,
  ReportCanvasEditEvent,
  ReportCanvasMode,
} from "@/processes/aiops-analysis-session/model/aiops-session-context";
import type { AnalysisWorkspaceSummary } from "@/shared/types/analysis-workspace-summary";
import type { ReportCanvasDocument } from "@/shared/types/report-canvas";
import type { AIOpsSessionArtifactCache } from "@/shared/types/session-artifact-cache";

export type TelemetryWorkerId =
  | "coordinator"
  | "telemetry_worker"
  | "analyst_worker"
  | "reporter_worker";

export type ReportSectionStatus = "pending" | "streaming" | "done";

export interface WorkspaceViewportState {
  navId: AppNavId;
  reportLayerOpen: boolean;
}

export interface TelemetryRunState {
  status: "idle" | "running" | "done" | "error";
  activeWorker: TelemetryWorkerId;
  phase: string;
}

export type ReportSectionReviewStatus =
  import("@/shared/types/report-section").ReportSectionReviewStatus;

export interface ReportDraftSection {
  id: string;
  title: string;
  kind: "text" | "chart";
  status: ReportSectionStatus;
  reviewStatus: ReportSectionReviewStatus;
  description: string;
  updatedAt: string | null;
  isSelected: boolean;
  isEditing: boolean;
}

export interface AIOpsWorkspaceState {
  viewport: WorkspaceViewportState;
  dashboardFocus: DashboardFocusState;
  selectedScope: ProjectScopeSelection | null;
  workflow: {
    stage: AnalysisWorkflowStage;
    detail: string;
  };
  agentPipeline: AnalysisAgentStep[];
  incidentProgress: AnalysisIncidentProgress | null;
  isAnalyzing: boolean;
  telemetryRun: TelemetryRunState;
  reportDraft: {
    status: "empty" | "generating" | "ready";
    mode: ReportCanvasMode;
    selectedBlockId: string | null;
    sectionEditing: boolean;
    lastEdit: ReportCanvasEditEvent | null;
    sectionReviews: Record<string, ReportSectionReviewStatus>;
    sections: ReportDraftSection[];
    document: ReportCanvasDocument | null;
  };
  artifactSummary: {
    incidentCount: number;
    analysisCount: number;
    hasPrimeReport: boolean;
  };
  artifactCache: Pick<
    AIOpsSessionArtifactCache,
    "query" | "incidents" | "analyses" | "primeReport" | "lastRunMeta"
  >;
  analysisSummary: AnalysisWorkspaceSummary;
}
