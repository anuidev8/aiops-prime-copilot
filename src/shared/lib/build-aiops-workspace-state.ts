import type {
  AnalysisWorkflowState,
  DashboardFocusState,
  ProjectScopeSelection,
  ReportCanvasEditEvent,
  ReportCanvasMode,
} from "@/processes/aiops-analysis-session/model/aiops-session-context";
import type {
  AIOpsWorkspaceState,
  ReportDraftSection,
  TelemetryWorkerId,
} from "@/shared/types/aiops-workspace-state";
import type {
  AnalysisAgentStep,
  AnalysisIncidentProgress,
} from "@/shared/types/analysis-progress";
import type { AIOpsSessionArtifactCache } from "@/shared/types/session-artifact-cache";
import type { ReportCanvasDocument } from "@/shared/types/report-canvas";
import type { ReportSectionReviews } from "@/shared/types/report-section";
import { sectionDescription } from "@/shared/types/report-section";
import { buildAnalysisWorkspaceSummary } from "./build-analysis-workspace-summary";
import type { AppNavId } from "@/shared/ui/layout/app-sidebar";
import type { PortfolioProjectHealthViewModel } from "@/shared/types/aiops";

function activeWorkerFromPipeline(
  pipeline: AnalysisAgentStep[],
): TelemetryWorkerId {
  const running = pipeline.find((step) => step.status === "running");
  if (!running) {
    const lastComplete = [...pipeline].reverse().find((step) => step.status === "complete");
    if (lastComplete?.id === "reporter") return "reporter_worker";
    if (lastComplete?.id === "analyst") return "analyst_worker";
    if (lastComplete?.id === "telemetry") return "telemetry_worker";
    return "coordinator";
  }

  if (running.id === "telemetry") return "telemetry_worker";
  if (running.id === "analyst") return "analyst_worker";
  if (running.id === "reporter") return "reporter_worker";
  return "coordinator";
}

function telemetryStatus(
  isAnalyzing: boolean,
  workflowStage: AnalysisWorkflowState["stage"],
): TelemetryRunState["status"] {
  if (workflowStage === "error") return "error";
  if (isAnalyzing) return "running";
  if (workflowStage === "ready") return "done";
  return "idle";
}

type TelemetryRunState = AIOpsWorkspaceState["telemetryRun"];

function reportSectionsFromDocument(
  document: ReportCanvasDocument | null,
  generating: boolean,
  sectionReviews: ReportSectionReviews,
  selectedBlockId: string | null,
  sectionEditing: boolean,
): ReportDraftSection[] {
  if (!document) return [];

  return document.blocks.map((block) => ({
    id: block.id,
    title: block.title,
    kind: block.type,
    status: block.status ?? (generating ? "streaming" : "done"),
    reviewStatus: sectionReviews[block.id] ?? "draft",
    description: sectionDescription(block),
    updatedAt: document.generatedAt,
    isSelected: block.id === selectedBlockId,
    isEditing: sectionEditing && block.id === selectedBlockId,
  }));
}

export function buildAIOpsWorkspaceState(params: {
  navId: AppNavId;
  reportLayerOpen: boolean;
  dashboardFocus: DashboardFocusState;
  selectedScope: ProjectScopeSelection | null;
  workflow: AnalysisWorkflowState;
  agentPipeline: AnalysisAgentStep[];
  incidentProgress: AnalysisIncidentProgress | null;
  isAnalyzing: boolean;
  reportCanvas: ReportCanvasDocument | null;
  reportCanvasGenerating: boolean;
  reportCanvasMode: ReportCanvasMode;
  selectedCanvasBlockId: string | null;
  reportSectionEditing: boolean;
  reportSectionReviews: ReportSectionReviews;
  lastCanvasEdit: ReportCanvasEditEvent | null;
  artifactCache: AIOpsSessionArtifactCache;
  projectCatalog: Array<{
    id: string;
    companyId: string;
    name: string;
    serviceNames: string[];
  }>;
  portfolioHealth: PortfolioProjectHealthViewModel[];
}): AIOpsWorkspaceState {
  const {
    navId,
    reportLayerOpen,
    dashboardFocus,
    selectedScope,
    workflow,
    agentPipeline,
    incidentProgress,
    isAnalyzing,
    reportCanvas,
    reportCanvasGenerating,
    reportCanvasMode,
    selectedCanvasBlockId,
    reportSectionEditing,
    reportSectionReviews,
    lastCanvasEdit,
    artifactCache,
    projectCatalog,
    portfolioHealth,
  } = params;

  const primeReport = artifactCache.primeReport;
  const selectedProjectId =
    params.selectedScope?.projectId ??
    artifactCache.query?.resolvedProjectId ??
    artifactCache.query?.requestedProjectId ??
    null;

  return {
    viewport: { navId, reportLayerOpen },
    dashboardFocus,
    selectedScope,
    workflow: { stage: workflow.stage, detail: workflow.detail },
    agentPipeline,
    incidentProgress,
    isAnalyzing,
    telemetryRun: {
      status: telemetryStatus(isAnalyzing, workflow.stage),
      activeWorker: activeWorkerFromPipeline(agentPipeline),
      phase: workflow.detail,
    },
    reportDraft: {
      status: reportCanvasGenerating
        ? "generating"
        : reportCanvas
          ? "ready"
          : "empty",
      mode: reportCanvasMode,
      selectedBlockId: selectedCanvasBlockId,
      sectionEditing: reportSectionEditing,
      lastEdit: lastCanvasEdit,
      sectionReviews: reportSectionReviews,
      sections: reportSectionsFromDocument(
        reportCanvas,
        reportCanvasGenerating,
        reportSectionReviews,
        selectedCanvasBlockId,
        reportSectionEditing,
      ),
      document: reportCanvas,
    },
    artifactSummary: {
      incidentCount: artifactCache.incidents.length,
      analysisCount: artifactCache.analyses.length,
      hasPrimeReport: Boolean(
        primeReport &&
          (primeReport.kpis.length > 0 ||
            primeReport.narrative.trim() ||
            primeReport.businessSummary.trim()),
      ),
    },
    artifactCache: {
      query: artifactCache.query,
      incidents: artifactCache.incidents,
      analyses: artifactCache.analyses,
      primeReport: artifactCache.primeReport,
      lastRunMeta: artifactCache.lastRunMeta,
    },
    analysisSummary: buildAnalysisWorkspaceSummary({
      projectCatalog,
      portfolioHealth,
      incidents: artifactCache.incidents,
      analyses: artifactCache.analyses,
      primeReport: artifactCache.primeReport,
      selectedProjectId,
      resolvedServiceCount: artifactCache.query?.resolvedServiceCount ?? null,
      workflowStage: workflow.stage,
      agentPipeline,
      isAnalyzing,
    }),
  };
}
