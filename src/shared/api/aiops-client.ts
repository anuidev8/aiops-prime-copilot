import { AnalysisProgressEvent } from "../types/analysis-progress";
import { AnalyzeLogsPayload, AnalyzeLogsResult } from "../types/aiops";
import { AIOpsRuntimeStatus } from "../types/runtime-status";

export async function analyzeLogsStream(
  payload: AnalyzeLogsPayload,
  onEvent: (event: AnalysisProgressEvent) => void,
): Promise<AnalyzeLogsResult> {
  const response = await fetch("/api/aiops/analyze/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error?: string; message?: string };
    throw new Error(error.message ?? error.error ?? "Failed to stream analysis");
  }

  if (!response.body) {
    throw new Error("Analysis stream returned no body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: AnalyzeLogsResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const event = JSON.parse(trimmed) as AnalysisProgressEvent;
      onEvent(event);

      if (event.type === "complete") {
        finalResult = event.result;
      }

      if (event.type === "error") {
        throw new Error(event.message);
      }
    }
  }

  if (buffer.trim()) {
    const event = JSON.parse(buffer.trim()) as AnalysisProgressEvent;
    onEvent(event);

    if (event.type === "complete") {
      finalResult = event.result;
    }

    if (event.type === "error") {
      throw new Error(event.message);
    }
  }

  if (!finalResult) {
    throw new Error("Analysis stream ended without a final result.");
  }

  return finalResult;
}

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
