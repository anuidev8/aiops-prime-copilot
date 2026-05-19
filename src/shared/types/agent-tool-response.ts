import {
  AnalysisViewModel,
  AnalyzeLogsResult,
  IncidentViewModel,
  PrimeReportViewModel,
} from "@/shared/types/aiops";
import {
  SessionPreconditionCode,
  SessionPreconditionSuggestion,
} from "@/shared/types/session-artifact-cache";

export interface AgentToolError {
  code: SessionPreconditionCode | "TOOL_EXECUTION_FAILED";
  message: string;
  suggestAction: SessionPreconditionSuggestion | "retry";
}

export interface AgentToolCachePatch {
  query?: AnalyzeLogsResult["query"];
  incidents?: IncidentViewModel[];
  analyses?: AnalysisViewModel[];
  primeReport?: PrimeReportViewModel | null;
}

export type AgentToolSuccess<TData> = {
  ok: true;
  data: TData;
  cachePatch: AgentToolCachePatch;
  ui: AnalyzeLogsResult["ui"];
  /** Correlates server-side artifact store with client cache. */
  runId: string;
};

export type AgentToolFailure = {
  ok: false;
  error: AgentToolError;
};

export type AgentToolResult<TData> = AgentToolSuccess<TData> | AgentToolFailure;

export interface RunTelemetryAgentData {
  query: AnalyzeLogsResult["query"];
  incidents: IncidentViewModel[];
}

export interface RunAnalystAgentData {
  analyses: AnalysisViewModel[];
}

export interface RunReporterAgentData {
  primeReport: PrimeReportViewModel;
}
