import {
  AgentToolResult,
  RunAnalystAgentData,
  RunReporterAgentData,
  RunTelemetryAgentData,
} from "@/shared/types/agent-tool-response";
import { AnalyzeLogsResult } from "@/shared/types/aiops";
import {
  artifactCacheToAnalyzeLogsResult,
  mergeArtifactCache,
} from "@/shared/lib/session-artifact-cache";
import {
  AIOpsSessionArtifactCache,
  LastRunMeta,
} from "@/shared/types/session-artifact-cache";
import { AIOpsAgentToolId } from "@/shared/types/session-artifact-cache";

function isAgentToolResult(value: unknown): value is AgentToolResult<unknown> {
  if (typeof value !== "object" || value === null) return false;
  return "ok" in value;
}

export function parseAgentToolResult<T>(value: unknown): AgentToolResult<T> | null {
  if (isAgentToolResult(value)) {
    return value as AgentToolResult<T>;
  }

  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value.trim());
      return isAgentToolResult(parsed) ? (parsed as AgentToolResult<T>) : null;
    } catch {
      return null;
    }
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
  return {
    cache,
    analyzeLogsResult: artifactCacheToAnalyzeLogsResult(cache),
  };
}

export type IncrementalToolData =
  | RunTelemetryAgentData
  | RunAnalystAgentData
  | RunReporterAgentData;
