import { AnalyzeLogsPayload, AnalyzeLogsResult } from "@/shared/types/aiops";

const RUN_ANALYSIS_PATTERN =
  /^(?:please\s+)?(?:run|start|execute|trigger|do)\s+(?:an?\s+)?(?:analysis|analisis|analiz(?:ar|is)?|investigation)\b/i;

const ANALYZE_ALL_PATTERN =
  /\b(?:analyze|analyse|analiz(?:ar|e)?)\s+(?:all\s+)?(?:logs|services|incidents|telemetry)\b/i;

function isAnalyzeLogsResult(value: unknown): value is AnalyzeLogsResult {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    "incidents" in candidate &&
    "primeReport" in candidate &&
    Array.isArray(candidate.incidents) &&
    typeof candidate.primeReport === "object" &&
    candidate.primeReport !== null
  );
}

export function coerceAnalyzeLogsResult(value: unknown): AnalyzeLogsResult | null {
  if (isAnalyzeLogsResult(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    return isAnalyzeLogsResult(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export interface AnalysisChatIntent {
  payload: AnalyzeLogsPayload;
  /** True when the user asked for a full-scope run without naming services. */
  runFullScope: boolean;
}

function extractServices(message: string): string[] {
  const forMatch = message.match(
    /\b(?:for|on|across)\s+([a-z0-9][a-z0-9._-]*(?:\s*,\s*[a-z0-9][a-z0-9._-]*)*)/i,
  );

  if (!forMatch?.[1]) {
    return [];
  }

  return forMatch[1]
    .split(",")
    .map((service) => service.trim().toLowerCase())
    .filter(Boolean);
}

function extractTimeWindowMinutes(message: string): number | undefined {
  const minutesMatch = message.match(/\b(?:last|past)\s+(\d{1,4})\s*(?:m|min|mins|minutes?)\b/i);
  if (minutesMatch?.[1]) {
    return Number(minutesMatch[1]);
  }

  const hoursMatch = message.match(/\b(?:last|past)\s+(\d{1,2})\s*(?:h|hr|hrs|hours?)\b/i);
  if (hoursMatch?.[1]) {
    return Number(hoursMatch[1]) * 60;
  }

  return undefined;
}

export function parseAnalysisChatIntent(message: string): AnalysisChatIntent | null {
  const trimmed = message.trim();
  if (!trimmed) {
    return null;
  }

  const runFullScope =
    RUN_ANALYSIS_PATTERN.test(trimmed) || ANALYZE_ALL_PATTERN.test(trimmed);

  if (!runFullScope && !/\b(?:analyze|analyse|analiz)\b/i.test(trimmed)) {
    return null;
  }

  const services = extractServices(trimmed);
  const timeWindowMinutes = extractTimeWindowMinutes(trimmed);
  const payload: AnalyzeLogsPayload = {};

  if (services.length > 0) {
    payload.services = services;
  }

  if (timeWindowMinutes !== undefined) {
    payload.timeWindowMinutes = timeWindowMinutes;
  }

  return {
    payload,
    runFullScope: runFullScope && services.length === 0,
  };
}
