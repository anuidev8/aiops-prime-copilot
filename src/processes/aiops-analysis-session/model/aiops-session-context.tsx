"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { analyzeLogs } from "@/shared/api/aiops-client";
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

interface AIOpsSessionContextValue {
  result: AnalyzeLogsResult | null;
  isAnalyzing: boolean;
  error: string | null;
  workflow: AnalysisWorkflowState;
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
      setWorkflow({
        stage: "collecting_scope",
        source,
        detail: "Resolving analysis scope across telemetry sources.",
        updatedAt: new Date().toISOString(),
      });

      setWorkflow({
        stage: "reading_telemetry",
        source,
        detail: "Pulling logs and detecting correlated incidents.",
        updatedAt: new Date().toISOString(),
      });

      try {
        setWorkflow({
          stage: "root_cause_analysis",
          source,
          detail: "Running ADK analyst agents on detected incidents.",
          updatedAt: new Date().toISOString(),
        });

        const analysis = await analyzeLogs(payload);

        setWorkflow({
          stage: "reporting",
          source,
          detail: "Building PRIME KPI report and narratives.",
          updatedAt: new Date().toISOString(),
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
      } finally {
        setIsAnalyzing(false);
      }
    },
    [],
  );

  const applyResultFromCopilot = useCallback((copilotResult: AnalyzeLogsResult) => {
    setResult(copilotResult);
    setError(null);
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
      runAnalysis,
      applyResultFromCopilot,
      setWorkflowStage,
    }),
    [
      result,
      isAnalyzing,
      error,
      workflow,
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
