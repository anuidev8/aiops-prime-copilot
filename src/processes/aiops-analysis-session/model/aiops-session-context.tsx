"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { analyzeLogsStream } from "@/shared/api/aiops-client";
import { mergeAnalysisSnapshot } from "@/shared/lib/merge-analysis-snapshot";
import {
  AnalysisAgentId,
  AnalysisAgentStep,
  AnalysisIncidentProgress,
  AnalysisProgressEvent,
  applyProgressToPipeline,
  createInitialAgentPipeline,
} from "@/shared/types/analysis-progress";
import { AnalyzeLogsPayload, AnalyzeLogsResult } from "@/shared/types/aiops";

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

interface AIOpsSessionContextValue {
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
  setWorkflowStage: (
    stage: AnalysisWorkflowStage,
    source: AnalysisWorkflowState["source"],
    detail: string,
  ) => void;
}

const AIOpsSessionContext = createContext<AIOpsSessionContextValue | null>(null);

export function AIOpsSessionProvider({ children }: PropsWithChildren) {
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
    [],
  );

  const applyResultFromCopilot = useCallback((copilotResult: AnalyzeLogsResult) => {
    setResult(copilotResult);
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
  }, []);

  const value = useMemo(
    () => ({
      result,
      isAnalyzing,
      error,
      workflow,
      agentPipeline,
      incidentProgress,
      runAnalysis,
      applyResultFromCopilot,
      setWorkflowStage,
    }),
    [
      result,
      isAnalyzing,
      error,
      workflow,
      agentPipeline,
      incidentProgress,
      runAnalysis,
      applyResultFromCopilot,
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
