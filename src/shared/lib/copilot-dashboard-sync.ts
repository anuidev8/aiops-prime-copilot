import {
  applyAgentToolToCache,
  normalizeCopilotToolPayload,
} from "@/shared/lib/coerce-agent-tool-result";

export { normalizeCopilotToolPayload };
import { mergeAnalysisIntoPortfolioHealth } from "@/shared/lib/portfolio-health-cache";
import { mergeGenerativeUiBlocks } from "@/shared/lib/build-generative-ui-blocks";
import type { AnalyzeLogsResult, ProjectOwnershipViewModel } from "@/shared/types/aiops";
import type {
  AnalysisAgentStep,
  AnalysisAgentId,
} from "@/shared/types/analysis-progress";
import {
  applyProgressToPipeline,
  copilotToolToAgentId,
  createInitialAgentPipeline,
  markAgentCompletedInPipeline,
} from "@/shared/types/analysis-progress";
import type { AIOpsAgentToolId, AIOpsSessionArtifactCache } from "@/shared/types/session-artifact-cache";
import type { AnalysisWorkflowStage } from "@/shared/types/analysis-workspace-summary";

export interface ProjectScopeSelection {
  companyId: string;
  projectId: string;
  projectName: string;
  serviceNames: string[];
}

export interface DashboardFocusPatch {
  scope: "overview" | "project" | "service" | "recommendation";
  projectId?: string;
  projectName?: string;
  serviceName?: string;
  metricName?: string;
  recommendationTitle?: string;
  recommendationPriority?: "P0" | "P1" | "P2";
  recommendationRiskLevel?: "high" | "medium" | "low";
  recommendationContent?: string;
  reason?: string;
  source: "copilot";
}

export interface CopilotWorkflowPatch {
  stage: AnalysisWorkflowStage;
  source: "copilot";
  detail: string;
  updatedAt: string;
}

export function workflowStageAfterCopilotTool(
  toolName: AIOpsAgentToolId,
): AnalysisWorkflowStage {
  if (toolName === "runReporterAgent" || toolName === "analyzeLogs") {
    return "ready";
  }
  if (toolName === "runAnalystAgent") {
    return "reporting";
  }
  if (toolName === "runTelemetryAgent") {
    return "root_cause_analysis";
  }
  return "reading_telemetry";
}

export function resolveEffectiveProjectId(params: {
  selectedScope: ProjectScopeSelection | null;
  dashboardFocus: { projectId?: string };
  query: AnalyzeLogsResult["query"] | null | undefined;
}): string | null {
  return (
    params.selectedScope?.projectId ??
    params.dashboardFocus.projectId ??
    params.query?.resolvedProjectId ??
    params.query?.requestedProjectId ??
    null
  );
}

export interface CopilotScopeAlignment {
  selectedScope: ProjectScopeSelection | null;
  dashboardFocus: DashboardFocusPatch;
  focusApplied: boolean;
}

export function alignDashboardToQuery(params: {
  query: AnalyzeLogsResult["query"];
  projectCatalog: ProjectOwnershipViewModel[];
  currentScope: ProjectScopeSelection | null;
  currentFocus: { scope: DashboardFocusPatch["scope"] };
}): CopilotScopeAlignment {
  const { query, projectCatalog, currentScope, currentFocus } = params;
  const resolvedProjectId = query.resolvedProjectId ?? query.requestedProjectId;

  if (resolvedProjectId) {
    const project = projectCatalog.find((entry) => entry.id === resolvedProjectId);
    if (project) {
      return {
        selectedScope: {
          companyId: project.companyId,
          projectId: project.id,
          projectName: query.resolvedProjectName ?? project.name,
          serviceNames: query.analyzedServices.length
            ? query.analyzedServices
            : project.serviceNames,
        },
        dashboardFocus: {
          scope: "project",
          projectId: project.id,
          projectName: query.resolvedProjectName ?? project.name,
          reason: "Copilot synchronized dashboard to analyzed project.",
          source: "copilot",
        },
        focusApplied: true,
      };
    }
  }

  if (query.analyzedServices.length === 1) {
    return {
      selectedScope: currentScope,
      dashboardFocus: {
        scope: "service",
        serviceName: query.analyzedServices[0],
        reason: "Copilot synchronized dashboard to analyzed service.",
        source: "copilot",
      },
      focusApplied: true,
    };
  }

  return {
    selectedScope: currentScope,
    dashboardFocus: {
      scope: "overview",
      reason: "Copilot synchronized dashboard to portfolio overview.",
      source: "copilot",
    },
    focusApplied: false,
  };
}

export interface CopilotToolSyncOutcome {
  cache: AIOpsSessionArtifactCache;
  analyzeLogsResult: AnalyzeLogsResult | null;
  workflow: CopilotWorkflowPatch;
  agentPipeline: AnalysisAgentStep[];
  scopeAlignment: CopilotScopeAlignment | null;
}

export function computeCopilotToolSyncOutcome(params: {
  currentCache: AIOpsSessionArtifactCache;
  toolName: AIOpsAgentToolId;
  toolResult: unknown;
  projectCatalog: ProjectOwnershipViewModel[];
  currentPipeline: AnalysisAgentStep[];
  currentScope: ProjectScopeSelection | null;
  currentFocus: { scope: DashboardFocusPatch["scope"] };
  existingResultUi?: AnalyzeLogsResult["ui"];
}): CopilotToolSyncOutcome | null {
  const normalized = normalizeCopilotToolPayload(params.toolResult);
  const applied = applyAgentToolToCache(
    params.currentCache,
    params.toolName,
    normalized,
    "copilot",
  );

  if (!applied) {
    return null;
  }

  const timestamp = new Date().toISOString();
  const stage = workflowStageAfterCopilotTool(params.toolName);
  const pipelineAgent = copilotToolToAgentId(params.toolName);

  let agentPipeline = params.currentPipeline;
  if (pipelineAgent) {
    agentPipeline = markAgentCompletedInPipeline(
      agentPipeline,
      pipelineAgent,
      `${params.toolName} completed — dashboard synchronized.`,
      timestamp,
    );
  }

  const workflow: CopilotWorkflowPatch = {
    stage,
    source: "copilot",
    detail: `Copilot completed ${params.toolName} and updated the operations workspace.`,
    updatedAt: timestamp,
  };

  let analyzeLogsResult = applied.analyzeLogsResult;
  if (analyzeLogsResult && params.existingResultUi?.length) {
    analyzeLogsResult = {
      ...analyzeLogsResult,
      ui: mergeGenerativeUiBlocks(analyzeLogsResult.ui, params.existingResultUi),
    };
  }

  let scopeAlignment: CopilotScopeAlignment | null = null;
  const query = applied.cache.query ?? analyzeLogsResult?.query;
  if (query) {
    scopeAlignment = alignDashboardToQuery({
      query,
      projectCatalog: params.projectCatalog,
      currentScope: params.currentScope,
      currentFocus: params.currentFocus,
    });
  }

  return {
    cache: applied.cache,
    analyzeLogsResult,
    workflow,
    agentPipeline,
    scopeAlignment,
  };
}

export function mergeCopilotAnalyzeResult(
  current: AnalyzeLogsResult | null,
  incoming: AnalyzeLogsResult,
): AnalyzeLogsResult {
  return {
    ...incoming,
    ui: mergeGenerativeUiBlocks(incoming.ui, current?.ui),
  };
}

export function markCopilotPipelineRunning(
  pipeline: AnalysisAgentStep[],
  toolName: AIOpsAgentToolId,
  detail: string,
): AnalysisAgentStep[] {
  const agent = copilotToolToAgentId(toolName);
  if (!agent) {
    return pipeline;
  }

  const timestamp = new Date().toISOString();
  return applyProgressToPipeline(pipeline, {
    type: "agent_started",
    agent,
    detail,
    timestamp,
  });
}

export function completedPipelineAfterFullCopilotSync(
  detail: string,
): AnalysisAgentStep[] {
  const timestamp = new Date().toISOString();
  return createInitialAgentPipeline().map((step) => ({
    ...step,
    status: "complete",
    detail,
    completedAt: timestamp,
  }));
}
