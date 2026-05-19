"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { analyzeLogsStream } from "@/shared/api/aiops-client";
import { fetchProjectOwnership } from "@/shared/api/ownership-client";
import { mergeAnalysisSnapshot } from "@/shared/lib/merge-analysis-snapshot";
import {
  mergeAnalysisIntoPortfolioHealth,
  seedPortfolioHealthCache,
} from "@/shared/lib/portfolio-health-cache";
import {
  createReportCanvasDocument,
  primaryReportCanvasTextBlockTitle,
  updateCanvasBlock,
} from "@/shared/lib/report-canvas";
import {
  AnalysisAgentId,
  AnalysisAgentStep,
  AnalysisIncidentProgress,
  AnalysisProgressEvent,
  applyProgressToPipeline,
  createInitialAgentPipeline,
  markAgentCompletedInPipeline,
  markAgentStartedInPipeline,
} from "@/shared/types/analysis-progress";
import type { AppNavId } from "@/shared/ui/layout/app-sidebar";
import { mergeGenerativeUiBlocks } from "@/shared/lib/build-generative-ui-blocks";
import {
  alignDashboardToQuery,
  completedPipelineAfterFullCopilotSync,
  computeCopilotToolSyncOutcome,
  mergeCopilotAnalyzeResult,
} from "@/shared/lib/copilot-dashboard-sync";
import {
  type DashboardHighlightSection,
  type DashboardHighlightState,
  sectionsForCopilotTool,
} from "@/shared/types/dashboard-highlight";
import {
  artifactCacheToAnalyzeLogsResult,
  artifactCacheFromAnalyzeLogsResult,
  createEmptyArtifactCache,
} from "@/shared/lib/session-artifact-cache";
import {
  AnalyzeLogsPayload,
  AnalyzeLogsResult,
  PortfolioProjectHealthViewModel,
  PrimeReportViewModel,
  ProjectOwnershipViewModel,
} from "@/shared/types/aiops";
import {
  AIOpsAgentToolId,
  AIOpsSessionArtifactCache,
} from "@/shared/types/session-artifact-cache";
import { ReportCanvasDocument } from "@/shared/types/report-canvas";
import {
  initializeSectionReviews,
  type ReportSectionReviewStatus,
  type ReportSectionReviews,
} from "@/shared/types/report-section";

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

export interface GenerateReportCanvasOptions {
  report?: PrimeReportViewModel | null;
  query?: AnalyzeLogsResult["query"] | null;
}

export interface ProjectScopeSelection {
  companyId: string;
  projectId: string;
  projectName: string;
  serviceNames: string[];
}

export type ReportCanvasMode = "present" | "edit";

export type DashboardFocusScope = "overview" | "project" | "service" | "recommendation";

export type ReportCanvasEditSource = "manual" | "copilot" | "hitl";

export interface ReportCanvasEditEvent {
  id: string;
  blockId: string;
  blockType: "text" | "chart";
  field: "title" | "content" | "metricName" | "value" | "unit" | "note";
  previousValue: string | number;
  newValue: string | number;
  source: ReportCanvasEditSource;
  updatedAt: string;
}

export interface DashboardFocusState {
  scope: DashboardFocusScope;
  projectId?: string;
  projectName?: string;
  serviceName?: string;
  metricName?: string;
  recommendationTitle?: string;
  recommendationPriority?: "P0" | "P1" | "P2";
  recommendationRiskLevel?: "high" | "medium" | "low";
  recommendationContent?: string;
  reason?: string;
  source: "manual" | "copilot" | "system";
  updatedAt: string;
}

interface AIOpsSessionContextValue {
  /** SPEC-007 §4 — normalized view of session artifacts for agents and UI. */
  artifactCache: AIOpsSessionArtifactCache;
  /** Ownership catalog (SPEC-009) — loaded once per session for copilot + UI. */
  projectCatalog: ProjectOwnershipViewModel[];
  projectCatalogLoading: boolean;
  /** SPEC-010 — latest per-project health snapshots used by overview merit grid + KPIs. */
  portfolioHealth: PortfolioProjectHealthViewModel[];
  /** User- or analysis-selected project scope; null until a project is chosen or resolved. */
  selectedScope: ProjectScopeSelection | null;
  setSelectedScope: (scope: ProjectScopeSelection | null) => void;
  dashboardFocus: DashboardFocusState;
  setDashboardFocus: (
    focus: Omit<DashboardFocusState, "updatedAt"> & { updatedAt?: string },
  ) => void;
  workspaceNavId: AppNavId;
  setWorkspaceNavId: (navId: AppNavId) => void;
  applyCopilotAgentProgress: (
    agent: AnalysisAgentId,
    status: "running" | "complete" | "error",
    detail: string,
  ) => void;
  dashboardHighlight: DashboardHighlightState | null;
  isDashboardSectionHighlighted: (section: DashboardHighlightSection) => boolean;
  pulseDashboardSections: (
    sections: DashboardHighlightSection[],
    source?: DashboardHighlightState["source"],
  ) => void;
  reportLayerOpen: boolean;
  setReportLayerOpen: (open: boolean) => void;
  reportCanvas: ReportCanvasDocument | null;
  reportCanvasGenerating: boolean;
  reportCanvasMode: ReportCanvasMode;
  setReportCanvasMode: (mode: ReportCanvasMode) => void;
  selectedCanvasBlockId: string | null;
  setSelectedCanvasBlockId: (blockId: string | null) => void;
  reportSectionReviews: ReportSectionReviews;
  reportSectionEditing: boolean;
  setReportSectionEditing: (editing: boolean) => void;
  setReportSectionReview: (
    blockId: string,
    status: ReportSectionReviewStatus,
  ) => void;
  approveReportSection: (blockId: string) => void;
  rejectReportSection: (blockId: string) => void;
  lastCanvasEdit: ReportCanvasEditEvent | null;
  generateReportCanvas: (options?: GenerateReportCanvasOptions) => Promise<void>;
  updateCanvasTextBlock: (
    blockId: string,
    fields: { title?: string; content?: string },
    options?: { source?: ReportCanvasEditSource },
  ) => void;
  updateCanvasChartBlock: (
    blockId: string,
    fields: {
      title?: string;
      metricName?: string;
      value?: number;
      unit?: string;
      note?: string;
    },
    options?: { source?: ReportCanvasEditSource },
  ) => void;
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

function canvasEditId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `canvas-edit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AIOpsSessionProvider({ children }: PropsWithChildren) {
  const [artifactCache, setArtifactCache] = useState<AIOpsSessionArtifactCache>(
    createEmptyArtifactCache,
  );
  const [projectCatalog, setProjectCatalog] = useState<ProjectOwnershipViewModel[]>([]);
  const [portfolioHealthCache, setPortfolioHealthCache] = useState<
    Record<string, PortfolioProjectHealthViewModel>
  >({});
  const [projectCatalogLoading, setProjectCatalogLoading] = useState(true);
  const [selectedScope, setSelectedScope] = useState<ProjectScopeSelection | null>(null);
  const [workspaceNavId, setWorkspaceNavId] = useState<AppNavId>("overview");
  const [reportLayerOpen, setReportLayerOpen] = useState(false);
  const [reportCanvas, setReportCanvas] = useState<ReportCanvasDocument | null>(null);
  const [reportCanvasGenerating, setReportCanvasGenerating] = useState(false);
  const [reportCanvasMode, setReportCanvasMode] = useState<ReportCanvasMode>("present");
  const [selectedCanvasBlockId, setSelectedCanvasBlockId] = useState<string | null>(null);
  const [reportSectionReviews, setReportSectionReviews] = useState<ReportSectionReviews>({});
  const [reportSectionEditing, setReportSectionEditing] = useState(false);
  const [lastCanvasEdit, setLastCanvasEdit] = useState<ReportCanvasEditEvent | null>(null);
  const [dashboardFocus, setDashboardFocusState] = useState<DashboardFocusState>({
    scope: "overview",
    reason: "Waiting for focus instructions.",
    source: "system",
    updatedAt: new Date().toISOString(),
  });
  const [result, setResult] = useState<AnalyzeLogsResult | null>(null);
  const artifactCacheRef = useRef(artifactCache);
  artifactCacheRef.current = artifactCache;
  const [dashboardHighlight, setDashboardHighlight] =
    useState<DashboardHighlightState | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pulseDashboardSections = useCallback(
    (
      sections: DashboardHighlightSection[],
      source: DashboardHighlightState["source"] = "copilot",
    ) => {
      if (sections.length === 0) return;
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      setDashboardHighlight({
        revision: Date.now(),
        sections,
        triggeredAt: new Date().toISOString(),
        source,
      });
      highlightTimerRef.current = setTimeout(() => {
        setDashboardHighlight(null);
        highlightTimerRef.current = null;
      }, 2600);
    },
    [],
  );

  const isDashboardSectionHighlighted = useCallback(
    (section: DashboardHighlightSection) =>
      dashboardHighlight?.sections.includes(section) ?? false,
    [dashboardHighlight],
  );

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);
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
          setPortfolioHealthCache((current) =>
            seedPortfolioHealthCache(current, catalog),
          );
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

  const setDashboardFocus = useCallback(
    (focus: Omit<DashboardFocusState, "updatedAt"> & { updatedAt?: string }) => {
      setDashboardFocusState({
        ...focus,
        updatedAt: focus.updatedAt ?? new Date().toISOString(),
      });
    },
    [],
  );

  const applyCopilotAgentProgress = useCallback(
    (agent: AnalysisAgentId, status: "running" | "complete" | "error", detail: string) => {
      const timestamp = new Date().toISOString();
      setAgentPipeline((current) => {
        if (status === "running") {
          return markAgentStartedInPipeline(current, agent, detail, timestamp);
        }
        if (status === "complete") {
          return markAgentCompletedInPipeline(current, agent, detail, timestamp);
        }
        return current.map((step) =>
          step.id === agent
            ? { ...step, status: "error", detail, completedAt: timestamp }
            : step,
        );
      });
    },
    [],
  );

  const generateReportCanvas = useCallback(
    async (options?: GenerateReportCanvasOptions) => {
      if (reportCanvasGenerating) {
        return;
      }

      setReportCanvasGenerating(true);
      setReportCanvasMode("present");
      setReportLayerOpen(true);
      setReportSectionEditing(false);
      setLastCanvasEdit(null);
      setReportSectionReviews({});

      try {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        });

        const startedAt = Date.now();
        const sourceResult = result ?? artifactCacheToAnalyzeLogsResult(artifactCache);
        const report =
          options?.report ??
          sourceResult?.primeReport ??
          artifactCache.primeReport ??
          null;
        const query =
          options?.query ?? sourceResult?.query ?? artifactCache.query ?? null;

        const document = createReportCanvasDocument({ report, query });
        const pendingDocument: ReportCanvasDocument = {
          ...document,
          blocks: document.blocks.map((block) => ({
            ...block,
            status: "pending" as const,
          })),
        };

        setReportCanvas(pendingDocument);

        const minimumTransformMs = 420;
        const elapsed = Date.now() - startedAt;
        if (elapsed < minimumTransformMs) {
          await new Promise((resolve) => setTimeout(resolve, minimumTransformMs - elapsed));
        }

        const revealDelayMs = 120;
        const blocks = document.blocks;

        for (let index = 0; index < blocks.length; index += 1) {
          setReportCanvas({
            ...document,
            blocks: blocks.map((block, blockIndex) => {
              if (blockIndex < index) {
                return { ...block, status: "done" as const };
              }
              if (blockIndex === index) {
                return { ...block, status: "streaming" as const };
              }
              return { ...block, status: "pending" as const };
            }),
          });
          await new Promise((resolve) => setTimeout(resolve, revealDelayMs));
        }

        const focusTitle = primaryReportCanvasTextBlockTitle(report);
        const focusBlock =
          document.blocks.find(
            (block) => block.type === "text" && block.title === focusTitle,
          ) ?? document.blocks.find((block) => block.type === "text");

        const finalizedBlocks = document.blocks.map((block) => ({
          ...block,
          status: "done" as const,
        }));
        setReportCanvas({
          ...document,
          blocks: finalizedBlocks,
        });
        setReportSectionReviews(initializeSectionReviews(finalizedBlocks));
        setSelectedCanvasBlockId(focusBlock?.id ?? document.blocks[0]?.id ?? null);
        setWorkflow({
          stage: "ready",
          source: "copilot",
          detail: "PRIME report opened in the in-dashboard report layer.",
          updatedAt: new Date().toISOString(),
        });
      } finally {
        setReportCanvasGenerating(false);
      }
    },
    [artifactCache, reportCanvasGenerating, result],
  );

  const setReportSectionReview = useCallback(
    (blockId: string, status: ReportSectionReviewStatus) => {
      setReportSectionReviews((current) => ({ ...current, [blockId]: status }));
    },
    [],
  );

  const approveReportSection = useCallback((blockId: string) => {
    setReportSectionReviews((current) => ({ ...current, [blockId]: "approved" }));
    setReportSectionEditing(false);
  }, []);

  const rejectReportSection = useCallback((blockId: string) => {
    setReportSectionReviews((current) => ({ ...current, [blockId]: "needs_review" }));
    setReportSectionEditing(false);
  }, []);

  const updateCanvasTextBlock = useCallback(
    (
      blockId: string,
      fields: { title?: string; content?: string },
      options?: { source?: ReportCanvasEditSource },
    ) => {
      setReportCanvas((current) => {
        if (!current) return current;
        let lastEditInBlock: ReportCanvasEditEvent | null = null;

        const next = updateCanvasBlock(current, blockId, (block) => {
          if (block.type !== "text") return block;

          const source = options?.source ?? "manual";
          const updatedAt = new Date().toISOString();
          const nextBlock = { ...block };

          if (fields.title !== undefined && fields.title !== block.title) {
            lastEditInBlock = {
              id: canvasEditId(),
              blockId,
              blockType: "text",
              field: "title",
              previousValue: block.title,
              newValue: fields.title,
              source,
              updatedAt,
            };
            nextBlock.title = fields.title;
          }

          if (fields.content !== undefined && fields.content !== block.content) {
            lastEditInBlock = {
              id: canvasEditId(),
              blockId,
              blockType: "text",
              field: "content",
              previousValue: block.content,
              newValue: fields.content,
              source,
              updatedAt,
            };
            nextBlock.content = fields.content;
          }

          return nextBlock;
        });

        if (lastEditInBlock) {
          setLastCanvasEdit(lastEditInBlock);
        }

        return next;
      });
    },
    [],
  );

  const updateCanvasChartBlock = useCallback(
    (
      blockId: string,
      fields: {
        title?: string;
        metricName?: string;
        value?: number;
        unit?: string;
        note?: string;
      },
      options?: { source?: ReportCanvasEditSource },
    ) => {
      setReportCanvas((current) => {
        if (!current) return current;
        let lastEditInBlock: ReportCanvasEditEvent | null = null;

        const next = updateCanvasBlock(current, blockId, (block) => {
          if (block.type !== "chart") return block;

          const source = options?.source ?? "manual";
          const updatedAt = new Date().toISOString();
          const nextBlock = { ...block };

          if (fields.title !== undefined && fields.title !== block.title) {
            lastEditInBlock = {
              id: canvasEditId(),
              blockId,
              blockType: "chart",
              field: "title",
              previousValue: block.title,
              newValue: fields.title,
              source,
              updatedAt,
            };
            nextBlock.title = fields.title;
          }

          if (
            fields.metricName !== undefined &&
            fields.metricName !== block.metricName
          ) {
            lastEditInBlock = {
              id: canvasEditId(),
              blockId,
              blockType: "chart",
              field: "metricName",
              previousValue: block.metricName,
              newValue: fields.metricName,
              source,
              updatedAt,
            };
            nextBlock.metricName = fields.metricName;
          }

          if (fields.value !== undefined && fields.value !== block.value) {
            lastEditInBlock = {
              id: canvasEditId(),
              blockId,
              blockType: "chart",
              field: "value",
              previousValue: block.value,
              newValue: fields.value,
              source,
              updatedAt,
            };
            nextBlock.value = fields.value;
          }

          if (fields.unit !== undefined && fields.unit !== block.unit) {
            lastEditInBlock = {
              id: canvasEditId(),
              blockId,
              blockType: "chart",
              field: "unit",
              previousValue: block.unit,
              newValue: fields.unit,
              source,
              updatedAt,
            };
            nextBlock.unit = fields.unit;
          }

          if (fields.note !== undefined && fields.note !== block.note) {
            lastEditInBlock = {
              id: canvasEditId(),
              blockId,
              blockType: "chart",
              field: "note",
              previousValue: block.note,
              newValue: fields.note,
              source,
              updatedAt,
            };
            nextBlock.note = fields.note;
          }

          return nextBlock;
        });

        if (lastEditInBlock) {
          setLastCanvasEdit(lastEditInBlock);
        }

        return next;
      });
    },
    [],
  );

  const runAnalysis = useCallback(
    async (
      payload: AnalyzeLogsPayload,
      source: AnalysisWorkflowState["source"] = "manual",
    ) => {
      const scopedProject = scopeFromPayload(payload, projectCatalog);
      setIsAnalyzing(true);
      setError(null);
      setIncidentProgress(null);
      setSelectedScope((current) => scopedProject ?? current);
      if (scopedProject) {
        setDashboardFocus({
          scope: "project",
          projectId: scopedProject.projectId,
          projectName: scopedProject.projectName,
          reason: `Focused on ${scopedProject.projectName}.`,
          source,
        });
      } else if ((payload.services?.length ?? 0) === 1) {
        setDashboardFocus({
          scope: "service",
          serviceName: payload.services?.[0],
          reason: `Focused on service ${payload.services?.[0]}.`,
          source,
        });
      } else {
        setDashboardFocus({
          scope: "overview",
          reason: "Focused on portfolio overview.",
          source,
        });
      }
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
        setPortfolioHealthCache((current) =>
          mergeAnalysisIntoPortfolioHealth({
            current,
            projectCatalog,
            result: analysis,
            source,
          }),
        );
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
    [projectCatalog, setDashboardFocus],
  );

  const applyResultFromCopilot = useCallback((copilotResult: AnalyzeLogsResult) => {
    const cache = artifactCacheFromAnalyzeLogsResult(copilotResult, "copilot");
    setArtifactCache(cache);
    setPortfolioHealthCache((current) =>
      mergeAnalysisIntoPortfolioHealth({
        current,
        projectCatalog,
        result: copilotResult,
        source: "copilot",
      }),
    );
    setResult(copilotResult);
    const alignment = alignDashboardToQuery({
      query: copilotResult.query,
      projectCatalog,
      currentScope: selectedScope,
      currentFocus: dashboardFocus,
    });
    if (alignment.selectedScope) {
      setSelectedScope(alignment.selectedScope);
    }
    setDashboardFocus(alignment.dashboardFocus);
    setError(null);
    setAgentPipeline(
      completedPipelineAfterFullCopilotSync(
        "Synchronized from Copilot tool output.",
      ),
    );
    setWorkflow({
      stage: "ready",
      source: "copilot",
      detail: "Copilot completed analysis and synchronized dashboard state.",
      updatedAt: new Date().toISOString(),
    });

    const hasPrimeContent =
      copilotResult.primeReport.kpis.length > 0 ||
      Boolean(copilotResult.primeReport.narrative.trim()) ||
      Boolean(copilotResult.primeReport.businessSummary.trim());

    if (hasPrimeContent) {
      void generateReportCanvas({
        report: copilotResult.primeReport,
        query: copilotResult.query,
      });
    }

    pulseDashboardSections(sectionsForCopilotTool("analyzeLogs"));
  }, [
    generateReportCanvas,
    projectCatalog,
    selectedScope,
    dashboardFocus,
    setDashboardFocus,
    pulseDashboardSections,
  ]);

  const applyIncrementalToolResult = useCallback(
    (toolName: AIOpsAgentToolId, toolResult: unknown): boolean => {
      const outcome = computeCopilotToolSyncOutcome({
        currentCache: artifactCacheRef.current,
        toolName,
        toolResult,
        projectCatalog,
        currentPipeline: agentPipeline,
        currentScope: selectedScope,
        currentFocus: dashboardFocus,
        existingResultUi: result?.ui,
      });

      if (!outcome) {
        return false;
      }

      artifactCacheRef.current = outcome.cache;
      setArtifactCache(outcome.cache);
      setWorkflow(outcome.workflow);
      setAgentPipeline(outcome.agentPipeline);
      setError(null);

      if (outcome.scopeAlignment) {
        if (outcome.scopeAlignment.selectedScope) {
          setSelectedScope(outcome.scopeAlignment.selectedScope);
        }
        setDashboardFocus(outcome.scopeAlignment.dashboardFocus);
      }

      const analyzeLogsResult =
        outcome.analyzeLogsResult ?? artifactCacheToAnalyzeLogsResult(outcome.cache);

      if (analyzeLogsResult) {
        setPortfolioHealthCache((previous) =>
          mergeAnalysisIntoPortfolioHealth({
            current: previous,
            projectCatalog,
            result: analyzeLogsResult,
            source: "copilot",
          }),
        );
        setResult((currentResult) =>
          mergeCopilotAnalyzeResult(currentResult, analyzeLogsResult),
        );
      }

      pulseDashboardSections(sectionsForCopilotTool(toolName));

      return true;
    },
    [
      agentPipeline,
      dashboardFocus,
      projectCatalog,
      pulseDashboardSections,
      result?.ui,
      selectedScope,
      setDashboardFocus,
      workflow,
    ],
  );

  const portfolioHealth = useMemo(() => {
    const seen = new Set<string>();
    const ordered: PortfolioProjectHealthViewModel[] = [];

    for (const project of projectCatalog) {
      const snapshot = portfolioHealthCache[project.id];
      if (!snapshot) continue;
      ordered.push(snapshot);
      seen.add(project.id);
    }

    for (const [projectId, snapshot] of Object.entries(portfolioHealthCache)) {
      if (seen.has(projectId)) continue;
      ordered.push(snapshot);
    }

    return ordered;
  }, [portfolioHealthCache, projectCatalog]);

  const value = useMemo(
    () => ({
      artifactCache,
      projectCatalog,
      projectCatalogLoading,
      portfolioHealth,
      selectedScope,
      setSelectedScope,
      dashboardFocus,
      setDashboardFocus,
      workspaceNavId,
      setWorkspaceNavId,
      applyCopilotAgentProgress,
      dashboardHighlight,
      isDashboardSectionHighlighted,
      pulseDashboardSections,
      reportLayerOpen,
      setReportLayerOpen,
      reportCanvas,
      reportCanvasGenerating,
      reportCanvasMode,
      setReportCanvasMode,
      selectedCanvasBlockId,
      setSelectedCanvasBlockId,
      reportSectionReviews,
      reportSectionEditing,
      setReportSectionEditing,
      setReportSectionReview,
      approveReportSection,
      rejectReportSection,
      lastCanvasEdit,
      generateReportCanvas,
      updateCanvasTextBlock,
      updateCanvasChartBlock,
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
      portfolioHealth,
      selectedScope,
      dashboardFocus,
      workspaceNavId,
      applyCopilotAgentProgress,
      dashboardHighlight,
      isDashboardSectionHighlighted,
      pulseDashboardSections,
      reportLayerOpen,
      reportCanvas,
      reportCanvasGenerating,
      reportCanvasMode,
      selectedCanvasBlockId,
      reportSectionReviews,
      reportSectionEditing,
      setReportSectionEditing,
      setReportSectionReview,
      approveReportSection,
      rejectReportSection,
      lastCanvasEdit,
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
      setDashboardFocus,
      generateReportCanvas,
      setReportCanvasMode,
      updateCanvasTextBlock,
      updateCanvasChartBlock,
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
