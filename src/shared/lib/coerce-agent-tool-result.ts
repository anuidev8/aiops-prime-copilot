import {
  AgentToolResult,
  RunAnalystAgentData,
  RunReporterAgentData,
  RunTelemetryAgentData,
} from "@/shared/types/agent-tool-response";
import { AnalyzeLogsResult } from "@/shared/types/aiops";
import { mergeGenerativeUiBlocks } from "@/shared/lib/build-generative-ui-blocks";
import {
  artifactCacheToAnalyzeLogsResult,
  mergeArtifactCache,
} from "@/shared/lib/session-artifact-cache";
import {
  AIOpsSessionArtifactCache,
  LastRunMeta,
} from "@/shared/types/session-artifact-cache";
import { AIOpsAgentToolId } from "@/shared/types/session-artifact-cache";

/** Unwrap AG-UI / CopilotKit tool result shapes into the backend JSON payload. */
export function normalizeCopilotToolPayload(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return value;
    try {
      return normalizeCopilotToolPayload(JSON.parse(trimmed) as unknown);
    } catch {
      return value;
    }
  }

  if (typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;

  if ("ok" in record) {
    return record;
  }

  if (typeof record.content === "string") {
    return normalizeCopilotToolPayload(record.content);
  }

  if ("result" in record) {
    return normalizeCopilotToolPayload(record.result);
  }

  if ("response" in record) {
    return normalizeCopilotToolPayload(record.response);
  }

  if (typeof record.data === "object" && record.data !== null && "ok" in record.data) {
    return record.data;
  }

  return value;
}

function isAgentToolResult(value: unknown): value is AgentToolResult<unknown> {
  if (typeof value !== "object" || value === null) return false;
  return "ok" in value;
}

export function parseAgentToolResult<T>(value: unknown): AgentToolResult<T> | null {
  const normalized = normalizeCopilotToolPayload(value);

  if (isAgentToolResult(normalized)) {
    return normalized as AgentToolResult<T>;
  }

  return null;
}

export function applyAgentToolToCache(
  current: AIOpsSessionArtifactCache,
  toolName: AIOpsAgentToolId,
  result: unknown,
  source: LastRunMeta["source"],
): {
  cache: AIOpsSessionArtifactCache;
  analyzeLogsResult: AnalyzeLogsResult | null;
} | null {
  const parsed = parseAgentToolResult(result);
  if (!parsed?.ok) {
    return null;
  }

  const meta: LastRunMeta = {
    runId: parsed.runId || current.lastRunMeta?.runId || `run-${Date.now()}`,
    updatedAt: new Date().toISOString(),
    lastAgent: toolName,
    source,
  };

  const cache = mergeArtifactCache(current, parsed.cachePatch, meta);
  const analyzeLogsResult = artifactCacheToAnalyzeLogsResult(cache);
  if (!analyzeLogsResult) {
    return { cache, analyzeLogsResult: null };
  }

  return {
    cache,
    analyzeLogsResult: {
      ...analyzeLogsResult,
      ui: mergeGenerativeUiBlocks(parsed.ui, analyzeLogsResult.ui),
    },
  };
}

export type IncrementalToolData =
  | RunTelemetryAgentData
  | RunAnalystAgentData
  | RunReporterAgentData;
