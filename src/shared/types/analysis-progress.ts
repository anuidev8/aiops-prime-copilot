import { AnalyzeLogsResult } from "./aiops";

export type AnalysisAgentId = "scope" | "telemetry" | "analyst" | "reporter";

export type AnalysisAgentStatus = "pending" | "running" | "complete" | "error";

export interface AnalysisAgentStep {
  id: AnalysisAgentId;
  label: string;
  subtitle: string;
  status: AnalysisAgentStatus;
  detail: string;
  startedAt?: string;
  completedAt?: string;
}

export interface AnalysisIncidentProgress {
  current: number;
  total: number;
  incidentId: string;
  service: string;
}

export type AnalysisProgressEvent =
  | {
      type: "agent_started";
      agent: AnalysisAgentId;
      detail: string;
      timestamp: string;
    }
  | {
      type: "agent_completed";
      agent: AnalysisAgentId;
      detail: string;
      timestamp: string;
      snapshot: Partial<AnalyzeLogsResult>;
    }
  | {
      type: "incident_analyzed";
      detail: string;
      timestamp: string;
      progress: AnalysisIncidentProgress;
      snapshot: Partial<AnalyzeLogsResult>;
    }
  | {
      type: "complete";
      timestamp: string;
      result: AnalyzeLogsResult;
    }
  | {
      type: "error";
      timestamp: string;
      message: string;
    };

export const ANALYSIS_AGENT_DEFINITIONS: Array<{
  id: AnalysisAgentId;
  label: string;
  subtitle: string;
}> = [
  {
    id: "scope",
    label: "Scope Orchestrator",
    subtitle: "Resolves company/project/service scope and time window",
  },
  {
    id: "telemetry",
    label: "Telemetry Agent",
    subtitle: "Ingests logs, correlates fingerprints, detects incidents",
  },
  {
    id: "analyst",
    label: "AIOps Analyst Agent",
    subtitle: "ADK root-cause inference and remediation planning per incident",
  },
  {
    id: "reporter",
    label: "PRIME Reporter Agent",
    subtitle: "Synthesizes KPIs and executive narrative for leadership",
  },
];

export function createInitialAgentPipeline(): AnalysisAgentStep[] {
  return ANALYSIS_AGENT_DEFINITIONS.map((agent) => ({
    ...agent,
    status: "pending",
    detail: "Waiting to start.",
  }));
}

export function applyProgressToPipeline(
  pipeline: AnalysisAgentStep[],
  event: AnalysisProgressEvent,
): AnalysisAgentStep[] {
  if (event.type === "error") {
    const runningIndex = pipeline.findIndex((step) => step.status === "running");
    const index = runningIndex >= 0 ? runningIndex : pipeline.length - 1;

    return pipeline.map((step, stepIndex) =>
      stepIndex === index
        ? {
            ...step,
            status: "error",
            detail: event.message,
            completedAt: event.timestamp,
          }
        : step,
    );
  }

  if (event.type === "agent_started") {
    return pipeline.map((step) => {
      if (step.id === event.agent) {
        return {
          ...step,
          status: "running",
          detail: event.detail,
          startedAt: event.timestamp,
          completedAt: undefined,
        };
      }

      if (step.status === "running") {
        return { ...step, status: "pending" as const };
      }

      return step;
    });
  }

  if (event.type === "agent_completed") {
    return pipeline.map((step) =>
      step.id === event.agent
        ? {
            ...step,
            status: "complete",
            detail: event.detail,
            completedAt: event.timestamp,
          }
        : step,
    );
  }

  if (event.type === "incident_analyzed") {
    return pipeline.map((step) =>
      step.id === "analyst"
        ? {
            ...step,
            status: "running",
            detail: event.detail,
          }
        : step,
    );
  }

  if (event.type === "complete") {
    return pipeline.map((step) => ({
      ...step,
      status: "complete" as const,
      detail:
        step.id === "reporter"
          ? "PRIME report published to dashboard."
          : `${step.label} finished.`,
      completedAt: event.timestamp,
    }));
  }

  return pipeline;
}

export function markAgentCompletedInPipeline(
  pipeline: AnalysisAgentStep[],
  agent: AnalysisAgentId,
  detail: string,
  timestamp: string,
): AnalysisAgentStep[] {
  return pipeline.map((step) =>
    step.id === agent
      ? {
          ...step,
          status: "complete",
          detail,
          completedAt: timestamp,
        }
      : step,
  );
}
