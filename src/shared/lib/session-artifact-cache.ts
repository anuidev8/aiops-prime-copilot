import {
  AIOpsAgentToolId,
  AIOpsSessionArtifactCache,
  LastRunMeta,
  SessionArtifactPatch,
  SessionPreconditionResult,
} from "@/shared/types/session-artifact-cache";
import { AnalyzeLogsResult } from "@/shared/types/aiops";

const EMPTY_REPORT: AnalyzeLogsResult["primeReport"] = {
  generatedAt: "",
  narrative: "",
  businessSummary: "",
  kpis: [],
};

export function createEmptyArtifactCache(): AIOpsSessionArtifactCache {
  return {
    query: null,
    incidents: [],
    analyses: [],
    primeReport: null,
    lastRunMeta: null,
  };
}

export function buildArtifactCache(
  result: AnalyzeLogsResult | null,
  lastRunMeta: LastRunMeta | null,
): AIOpsSessionArtifactCache {
  if (!result) {
    return { ...createEmptyArtifactCache(), lastRunMeta };
  }

  const hasPrimeContent =
    result.primeReport.kpis.length > 0 ||
    Boolean(result.primeReport.narrative.trim()) ||
    Boolean(result.primeReport.businessSummary.trim());

  return {
    query: result.query,
    incidents: result.incidents,
    analyses: result.analyses,
    primeReport: hasPrimeContent ? result.primeReport : null,
    lastRunMeta,
  };
}

export function artifactCacheToAnalyzeLogsResult(
  cache: AIOpsSessionArtifactCache,
): AnalyzeLogsResult | null {
  if (!cache.query && cache.incidents.length === 0) {
    return null;
  }

  return {
    query:
      cache.query ?? {
        requestedServices: [],
        analyzedServices: [],
        requestedTimeWindowMinutes: null,
        resolvedTimeWindowMinutes: 0,
        resolvedWindowFrom: new Date(0).toISOString(),
        resolvedWindowTo: new Date(0).toISOString(),
      },
    incidents: cache.incidents,
    analyses: cache.analyses,
    primeReport: cache.primeReport ?? EMPTY_REPORT,
    ui: [],
  };
}

/**
 * Merge a partial tool snapshot into the cache (SPEC-007 invalidation rules).
 */
export function mergeArtifactCache(
  current: AIOpsSessionArtifactCache,
  patch: SessionArtifactPatch,
  meta: LastRunMeta,
): AIOpsSessionArtifactCache {
  const incidents = patch.incidents ?? current.incidents;
  const query = patch.query ?? current.query;
  const analyses =
    patch.incidents !== undefined && patch.analyses === undefined
      ? []
      : (patch.analyses ?? current.analyses);
  const primeReport =
    patch.incidents !== undefined && patch.primeReport === undefined
      ? null
      : patch.analyses !== undefined && patch.primeReport === undefined
        ? null
        : patch.primeReport !== undefined
          ? patch.primeReport
          : current.primeReport;

  return {
    query,
    incidents,
    analyses,
    primeReport,
    lastRunMeta: meta,
  };
}

function newRunId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createLastRunMeta(
  lastAgent: AIOpsAgentToolId,
  source: LastRunMeta["source"],
  runId?: string,
): LastRunMeta {
  return {
    runId: runId ?? newRunId(),
    updatedAt: new Date().toISOString(),
    lastAgent,
    source,
  };
}

export function checkAnalystPrecondition(
  cache: AIOpsSessionArtifactCache,
): SessionPreconditionResult {
  if (cache.incidents.length === 0) {
    return {
      ok: false,
      code: "ANALYST_NO_INCIDENTS",
      message:
        "No incidents in session cache. Run telemetry first to detect incidents before root-cause analysis.",
      suggestAction: "runTelemetryAgent",
    };
  }

  return { ok: true };
}

export interface ReporterPreconditionOptions {
  useCachedAnalysis?: boolean;
  allowEmptyReport?: boolean;
}

export function checkReporterPrecondition(
  cache: AIOpsSessionArtifactCache,
  options: ReporterPreconditionOptions = {},
): SessionPreconditionResult {
  const { useCachedAnalysis = true, allowEmptyReport = false } = options;

  if (useCachedAnalysis && !cache.query && cache.incidents.length === 0) {
    return {
      ok: false,
      code: "REPORTER_CACHE_EMPTY",
      message:
        "Session cache is empty. Run telemetry or a full analysis before generating a PRIME report from cache.",
      suggestAction: "runTelemetryAgent",
    };
  }

  if (cache.incidents.length === 0) {
    if (allowEmptyReport) {
      return { ok: true };
    }

    return {
      ok: false,
      code: "REPORTER_NO_INCIDENTS",
      message:
        "No incidents available for PRIME reporting. Run telemetry first, or confirm generating an empty executive report.",
      suggestAction: "confirmEmptyReport",
    };
  }

  return { ok: true };
}

/** Maps legacy monolithic pipeline output into cache + meta. */
export function artifactCacheFromAnalyzeLogsResult(
  result: AnalyzeLogsResult,
  source: LastRunMeta["source"],
): AIOpsSessionArtifactCache {
  return buildArtifactCache(
    result,
    createLastRunMeta("analyzeLogs", source),
  );
}
