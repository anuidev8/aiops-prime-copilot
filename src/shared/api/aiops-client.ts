import { AnalyzeLogsPayload, AnalyzeLogsResult } from "../types/aiops";
import { AIOpsRuntimeStatus } from "../types/runtime-status";

export async function analyzeLogs(
  payload: AnalyzeLogsPayload,
): Promise<AnalyzeLogsResult> {
  const response = await fetch("/api/aiops/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error?: string; message?: string };

    throw new Error(error.message ?? error.error ?? "Failed to analyze logs");
  }

  return (await response.json()) as AnalyzeLogsResult;
}

export async function fetchAIOpsRuntimeStatus(): Promise<AIOpsRuntimeStatus> {
  const response = await fetch("/api/aiops/runtime-status", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = (await response.json()) as { error?: string; message?: string };
    throw new Error(error.message ?? error.error ?? "Failed to read runtime status");
  }

  return (await response.json()) as AIOpsRuntimeStatus;
}
