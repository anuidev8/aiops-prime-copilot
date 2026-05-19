import {
  AnalysisViewModel,
  AnalyzeLogsResult,
  IncidentViewModel,
  PrimeReportViewModel,
} from "@/shared/types/aiops";

/** CopilotKit / ADK tool ids that write session artifacts (SPEC-007 §4). */
export type AIOpsAgentToolId =
  | "runTelemetryAgent"
  | "runAnalystAgent"
  | "runReporterAgent"
  | "analyzeLogs";

export interface LastRunMeta {
  /** Correlates partial runs in one browser session (Phase 1: client-only). */
  runId: string;
  updatedAt: string;
  lastAgent: AIOpsAgentToolId;
  source: "manual" | "copilot" | "system";
}

/**
 * Canonical session artifact cache (SPEC-007 §4).
 * Stored in `AIOpsSessionProvider`; mirrored to Copilot via `useAgentContext`.
 */
export interface AIOpsSessionArtifactCache {
  query: AnalyzeLogsResult["query"] | null;
  incidents: IncidentViewModel[];
  analyses: AnalysisViewModel[];
  primeReport: PrimeReportViewModel | null;
  lastRunMeta: LastRunMeta | null;
}

export type SessionPreconditionCode =
  | "ANALYST_NO_INCIDENTS"
  | "REPORTER_NO_INCIDENTS"
  | "REPORTER_CACHE_EMPTY";

export type SessionPreconditionSuggestion =
  | "runTelemetryAgent"
  | "runAnalystAgent"
  | "confirmEmptyReport";

export type SessionPreconditionResult =
  | { ok: true }
  | {
      ok: false;
      code: SessionPreconditionCode;
      message: string;
      suggestAction: SessionPreconditionSuggestion;
    };

/** Partial artifact writes from incremental agent tools. */
export interface SessionArtifactPatch {
  query?: AnalyzeLogsResult["query"];
  incidents?: IncidentViewModel[];
  analyses?: AnalysisViewModel[];
  primeReport?: PrimeReportViewModel | null;
}
