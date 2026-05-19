"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { analyzeLogsStream } from "@/shared/api/aiops-client";
import { fetchProjectOwnership } from "@/shared/api/ownership-client";
import { mergeAnalysisSnapshot } from "@/shared/lib/merge-analysis-snapshot";
import {
  AnalysisAgentId,
  AnalysisAgentStep,
  AnalysisIncidentProgress,
  AnalysisProgressEvent,
  applyProgressToPipeline,
  createInitialAgentPipeline,
} from "@/shared/types/analysis-progress";
import { applyAgentToolToCache } from "@/shared/lib/coerce-agent-tool-result";
import {
  artifactCacheFromAnalyzeLogsResult,
  createEmptyArtifactCache,
} from "@/shared/lib/session-artifact-cache";
import {
  AnalyzeLogsPayload,
  AnalyzeLogsResult,
  ProjectOwnershipViewModel,
} from "@/shared/types/aiops";
import {
  AIOpsAgentToolId,
  AIOpsSessionArtifactCache,
} from "@/shared/types/session-artifact-cache";

export type AnalysisWorkflowStage =
  | "idle"
  | "collecting_scope"
  | "reading_telemetry"
  | "root_cause_analysis"
  | "reporting"
  | "ready"
  | "error";

export interface AnalysisWorkflowState {
  stage: AnalysisWorkflowStage;
  source: "manual" | "copilot" | "system";
  detail: string;
  updatedAt: string;
}

function workflowStageFromAgent(agent: AnalysisAgentId): AnalysisWorkflowStage {
  if (agent === "scope") return "collecting_scope";
  if (agent === "telemetry") return "reading_telemetry";
  if (agent === "analyst") return "root_cause_analysis";
  return "reporting";
}

function handleProgressEvent(
  event: AnalysisProgressEvent,
  setters: {
    setAgentPipeline: React.Dispatch<React.SetStateAction<AnalysisAgentStep[]>>;
    setIncidentProgress: React.Dispatch<
      React.SetStateAction<AnalysisIncidentProgress | null>
    >;
    setResult: React.Dispatch<React.SetStateAction<AnalyzeLogsResult | null>>;
    setWorkflow: React.Dispatch<React.SetStateAction<AnalysisWorkflowState>>;
    source: AnalysisWorkflowState["source"];
  },
) {
  setters.setAgentPipeline((current) => applyProgressToPipeline(current, event));

  if (event.type === "agent_started") {
    setters.setWorkflow({
      stage: workflowStageFromAgent(event.agent),
      source: setters.source,
      detail: event.detail,
      updatedAt: event.timestamp,
    });
    return;
  }

  if (event.type === "incident_analyzed") {
    setters.setIncidentProgress(event.progress);
    setters.setResult((current) => mergeAnalysisSnapshot(current, event.snapshot));
    setters.setWorkflow({
      stage: "root_cause_analysis",
      source: setters.source,
      detail: event.detail,
      updatedAt: event.timestamp,
    });
    return;
  }

  if (event.type === "agent_completed") {
    setters.setResult((current) => mergeAnalysisSnapshot(current, event.snapshot));
    setters.setWorkflow({
      stage: workflowStageFromAgent(event.agent),
      source: setters.source,
      detail: event.detail,
      updatedAt: event.timestamp,
    });
    return;
  }

  if (event.type === "complete") {
    setters.setIncidentProgress(null);
    setters.setResult(event.result);
    setters.setWorkflow({
      stage: "ready",
      source: setters.source,
      detail: "Analysis and KPI report are ready.",
      updatedAt: event.timestamp,
    });
  }
}

export interface ProjectScopeSelection {
  companyId: string;
  projectId: string;
  projectName: string;
  serviceNames: string[];
}

interface AIOpsSessionContextValue {
  /** SPEC-007 §4 — normalized view of session artifacts for agents and UI. */
  artifactCache: AIOpsSessionArtifactCache;
  /** Ownership catalog (SPEC-009) — loaded once per session for copilot + UI. */
  projectCatalog: ProjectOwnershipViewModel[];
  projectCatalogLoading: boolean;
  /** User- or analysis-selected project scope; null until a project is chosen or resolved. */
  selectedScope: ProjectScopeSelection | null;
  setSelectedScope: (scope: ProjectScopeSelection | null) => void;
  result: AnalyzeLogsResult | null;
  isAnalyzing: boolean;
  error: string | null;
  workflow: AnalysisWorkflowState;
  agentPipeline: AnalysisAgentStep[];
  incidentProgress: AnalysisIncidentProgress | null;
  runAnalysis: (
    payload: AnalyzeLogsPayload,
    source?: AnalysisWorkflowState["source"],
  ) => Promise<void>;
  applyResultFromCopilot: (result: AnalyzeLogsResult) => void;
  applyIncrementalToolResult: (
    toolName: AIOpsAgentToolId,
    toolResult: unknown,
  ) => boolean;
  setWorkflowStage: (
    stage: AnalysisWorkflowStage,
    source: AnalysisWorkflowState["source"],
    detail: string,
  ) => void;
}

const AIOpsSessionContext = createContext<AIOpsSessionContextValue | null>(null);

function scopeFromPayload(
  payload: AnalyzeLogsPayload,
  catalog: ProjectOwnershipViewModel[],
): ProjectScopeSelection | null {
  const projectId = payload.projectId?.trim();
  if (!projectId) {
    return null;
  }

  const project =
    catalog.find((entry) => entry.id === projectId) ??
    (payload.companyId
      ? {
          id: projectId,
          companyId: payload.companyId,
          name: projectId,
          serviceNames: payload.services ?? [],
        }
      : null);

  if (!project) {
    return null;
  }

  return {
    companyId: project.companyId,
    projectId: project.id,
    projectName: project.name,
    serviceNames: payload.services?.length
      ? payload.services
      : project.serviceNames,
  };
}

export function AIOpsSessionProvider({ children }: PropsWithChildren) {
  const [artifactCache, setArtifactCache] = useState<AIOpsSessionArtifactCache>(
    createEmptyArtifactCache,
  );
  const [projectCatalog, setProjectCatalog] = useState<ProjectOwnershipViewModel[]>([]);
  const [projectCatalogLoading, setProjectCatalogLoading] = useState(true);
  const [selectedScope, setSelectedScope] = useState<ProjectScopeSelection | null>(null);
  const [result, setResult] = useState<AnalyzeLogsResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentPipeline, setAgentPipeline] = useState(createInitialAgentPipeline);
  const [incidentProgress, setIncidentProgress] = useState<AnalysisIncidentProgress | null>(
    null,
  );
  const [workflow, setWorkflow] = useState<AnalysisWorkflowState>({
    stage: "idle",
    source: "system",
    detail: "Waiting for analysis request.",
    updatedAt: new Date().toISOString(),
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const catalog = await fetchProjectOwnership();
        if (!cancelled) {
          setProjectCatalog(catalog);
        }
      } catch {
        if (!cancelled) {
          setProjectCatalog([]);
        }
      } finally {
        if (!cancelled) {
          setProjectCatalogLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setWorkflowStage = useCallback(
    (
      stage: AnalysisWorkflowStage,
      source: AnalysisWorkflowState["source"],
      detail: string,
    ) => {
      setWorkflow({
        stage,
        source,
        detail,
        updatedAt: new Date().toISOString(),
      });
    },
    [],
  );

  const runAnalysis = useCallback(
    async (
      payload: AnalyzeLogsPayload,
      source: AnalysisWorkflowState["source"] = "manual",
    ) => {
      setIsAnalyzing(true);
      setError(null);
      setIncidentProgress(null);
      setSelectedScope((current) => scopeFromPayload(payload, projectCatalog) ?? current);
      setAgentPipeline(createInitialAgentPipeline());
      setWorkflow({
        stage: "collecting_scope",
        source,
        detail: "Starting multi-agent ADK analysis pipeline.",
        updatedAt: new Date().toISOString(),
      });

      let streamedResult: AnalyzeLogsResult | null = null;

      try {
        const analysis = await analyzeLogsStream(payload, (event) => {
          handleProgressEvent(event, {
            setAgentPipeline,
            setIncidentProgress,
            setResult: (updater) => {
              setResult((current) => {
                const next =
                  typeof updater === "function" ? updater(current) : updater;
                if (next) streamedResult = next;
                return next;
              });
            },
            setWorkflow,
            source,
          });
        });

        const cache = artifactCacheFromAnalyzeLogsResult(analysis, source);
        setArtifactCache(cache);
        setResult(analysis);
        setWorkflow({
          stage: "ready",
          source,
          detail: "Analysis and KPI report are ready.",
          updatedAt: new Date().toISOString(),
        });
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "Failed to run analysis.";
        setError(message);
        setWorkflow({
          stage: "error",
          source,
          detail: message,
          updatedAt: new Date().toISOString(),
        });
        setAgentPipeline((current) =>
          current.map((step) =>
            step.status === "running"
              ? { ...step, status: "error", detail: message }
              : step,
          ),
        );

        if (streamedResult) {
          setResult(streamedResult);
        }
      } finally {
        setIsAnalyzing(false);
        setIncidentProgress(null);
      }
    },
    [projectCatalog],
  );

  const applyResultFromCopilot = useCallback((copilotResult: AnalyzeLogsResult) => {
    const cache = artifactCacheFromAnalyzeLogsResult(copilotResult, "copilot");
    setArtifactCache(cache);
    setResult(copilotResult);
    const resolvedProjectId =
      copilotResult.query.resolvedProjectId ?? copilotResult.query.requestedProjectId;
    if (resolvedProjectId) {
      const project = projectCatalog.find((entry) => entry.id === resolvedProjectId);
      if (project) {
        setSelectedScope({
          companyId: project.companyId,
          projectId: project.id,
          projectName:
            copilotResult.query.resolvedProjectName ?? project.name,
          serviceNames: copilotResult.query.analyzedServices.length
            ? copilotResult.query.analyzedServices
            : project.serviceNames,
        });
      }
    }
    setError(null);
    setAgentPipeline(
      createInitialAgentPipeline().map((step) => ({
        ...step,
        status: "complete",
        detail: "Synchronized from Copilot tool output.",
        completedAt: new Date().toISOString(),
      })),
    );
    setWorkflow({
      stage: "ready",
      source: "copilot",
      detail: "Copilot completed analysis and synchronized dashboard state.",
      updatedAt: new Date().toISOString(),
    });
  }, [projectCatalog]);

  const applyIncrementalToolResult = useCallback(
    (toolName: AIOpsAgentToolId, toolResult: unknown): boolean => {
      let applied = false;

      setArtifactCache((current) => {
        const next = applyAgentToolToCache(current, toolName, toolResult, "copilot");
        if (!next) {
          return current;
        }

        applied = true;
        if (next.analyzeLogsResult) {
          setResult(next.analyzeLogsResult);
          const q = next.analyzeLogsResult.query;
          const resolvedProjectId = q.resolvedProjectId ?? q.requestedProjectId;
          if (resolvedProjectId) {
            const project = projectCatalog.find((entry) => entry.id === resolvedProjectId);
            if (project) {
              setSelectedScope({
                companyId: project.companyId,
                projectId: project.id,
                projectName: q.resolvedProjectName ?? project.name,
                serviceNames: q.analyzedServices.length
                  ? q.analyzedServices
                  : project.serviceNames,
              });
            }
          }
        } else if (next.cache.query) {
          const q = next.cache.query;
          const resolvedProjectId = q.resolvedProjectId ?? q.requestedProjectId;
          if (resolvedProjectId) {
            const project = projectCatalog.find((entry) => entry.id === resolvedProjectId);
            if (project) {
              setSelectedScope({
                companyId: project.companyId,
                projectId: project.id,
                projectName: q.resolvedProjectName ?? project.name,
                serviceNames: q.analyzedServices.length
                  ? q.analyzedServices
                  : project.serviceNames,
              });
            }
          }
        }
        return next.cache;
      });

      if (applied) {
        setError(null);
      }

      return applied;
    },
    [projectCatalog],
  );

  const value = useMemo(
    () => ({
      artifactCache,
      projectCatalog,
      projectCatalogLoading,
      selectedScope,
      setSelectedScope,
      result,
      isAnalyzing,
      error,
      workflow,
      agentPipeline,
      incidentProgress,
      runAnalysis,
      applyResultFromCopilot,
      applyIncrementalToolResult,
      setWorkflowStage,
    }),
    [
      artifactCache,
      projectCatalog,
      projectCatalogLoading,
      selectedScope,
      result,
      isAnalyzing,
      error,
      workflow,
      agentPipeline,
      incidentProgress,
      runAnalysis,
      applyResultFromCopilot,
      applyIncrementalToolResult,
      setWorkflowStage,
    ],
  );

  return (
    <AIOpsSessionContext.Provider value={value}>
      {children}
    </AIOpsSessionContext.Provider>
  );
}

export function useAIOpsSession(): AIOpsSessionContextValue {
  const context = useContext(AIOpsSessionContext);

  if (!context) {
    throw new Error("useAIOpsSession must be used inside AIOpsSessionProvider.");
  }

  return context;
}
