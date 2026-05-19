"use client";

import { useEffect, useRef } from "react";
import { useHumanInTheLoop, useRenderTool } from "@copilotkit/react-core/v2";
import { useCopilotChatSuggestions } from "@copilotkit/react-core";
import { z } from "zod";
import {
  AnalysisWorkflowStage,
  useAIOpsSession,
} from "@/processes/aiops-analysis-session/model/aiops-session-context";
import { copilotToolToAgentId } from "@/shared/types/analysis-progress";
import {
  normalizeCopilotToolPayload,
  parseAgentToolResult,
} from "@/shared/lib/coerce-agent-tool-result";
import { coerceAnalyzeLogsResult } from "@/shared/lib/analysis-chat";
import { AnalyzeLogsResult } from "@/shared/types/aiops";
import { RunReporterAgentData } from "@/shared/types/agent-tool-response";
import { AIOpsAgentToolId } from "@/shared/types/session-artifact-cache";

function normalizeToolStatus(status: string): string {
  return status.trim().toLowerCase();
}

function workflowForTool(toolName: AIOpsAgentToolId, status: string): AnalysisWorkflowStage {
  const normalized = normalizeToolStatus(status);
  if (normalized === "failed" || normalized === "error") return "error";
  if (normalized !== "complete") {
    if (toolName === "runTelemetryAgent") return "reading_telemetry";
    if (toolName === "runAnalystAgent") return "root_cause_analysis";
    if (toolName === "runReporterAgent") return "reporting";
    return "reading_telemetry";
  }
  if (toolName === "runReporterAgent" || toolName === "analyzeLogs") return "ready";
  if (toolName === "runAnalystAgent") return "reporting";
  return "reading_telemetry";
}

interface IncrementalToolCardProps {
  toolName: AIOpsAgentToolId;
  label: string;
  status: string;
  result: unknown;
  onApplyResult: (result: AnalyzeLogsResult) => void;
  onApplyIncremental: (toolName: AIOpsAgentToolId, result: unknown) => boolean;
  onWorkflowUpdate: (
    stage: AnalysisWorkflowStage,
    source: "manual" | "copilot" | "system",
    detail: string,
  ) => void;
}

function dashboardSyncMessage(toolName: AIOpsAgentToolId): string {
  if (toolName === "runReporterAgent") {
    return "Opening the in-dashboard report layer with structured PRIME sections.";
  }
  if (toolName === "runAnalystAgent") {
    return "Root-cause summary is in the dashboard dynamic context slot.";
  }
  if (toolName === "runTelemetryAgent") {
    return "Incident scope is in the dashboard dynamic context slot.";
  }
  return "Analysis blocks are in the dashboard dynamic context slot.";
}

function IncrementalToolStatus({
  label,
  status,
  toolName,
}: {
  label: string;
  status: string;
  toolName: AIOpsAgentToolId;
}) {
  const isTelemetry = toolName === "runTelemetryAgent";
  const isAnalyst = toolName === "runAnalystAgent";

  const normalized = normalizeToolStatus(status);

  if (normalized === "inprogress" || normalized === "executing") {
    if (isTelemetry || isAnalyst) {
      return null;
    }
    return (
      <p className="my-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        Running {label}…
      </p>
    );
  }

  if (normalized === "complete") {
    const isReporter = toolName === "runReporterAgent";
    return (
      <p className="my-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200/90">
        {label} complete — {dashboardSyncMessage(toolName)}
        {isReporter ? (
          <span className="mt-1 block text-emerald-100/80">
            Edit sections in the report layer overlay on top of the dashboard.
          </span>
        ) : null}
      </p>
    );
  }

  if (normalized === "failed" || normalized === "error") {
    return (
      <p className="my-2 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-700">
        {label} failed. Retry from suggestions or run the specific step again.
      </p>
    );
  }

  return null;
}

function IncrementalToolCard({
  toolName,
  label,
  status,
  result,
  onApplyResult,
  onApplyIncremental,
  onWorkflowUpdate,
}: IncrementalToolCardProps) {
  const { generateReportCanvas, applyCopilotAgentProgress } = useAIOpsSession();
  const prevStatusRef = useRef<string | undefined>(undefined);
  const pipelineAgent = copilotToolToAgentId(toolName);

  useEffect(() => {
    const normalizedStatus = normalizeToolStatus(status);
    const prevStatus = prevStatusRef.current
      ? normalizeToolStatus(prevStatusRef.current)
      : undefined;
    prevStatusRef.current = status;

    const enteredComplete =
      normalizedStatus === "complete" && prevStatus !== "complete";
    const enteredError =
      (normalizedStatus === "failed" || normalizedStatus === "error") &&
      prevStatus !== "failed" &&
      prevStatus !== "error";
    const enteredExecuting =
      (normalizedStatus === "executing" || normalizedStatus === "inprogress") &&
      prevStatus !== "executing" &&
      prevStatus !== "inprogress";

    const stage = workflowForTool(toolName, normalizedStatus);
    const payload = normalizeCopilotToolPayload(result);
    const parsed = parseAgentToolResult(payload);

    if (enteredComplete) {
      if (pipelineAgent) {
        applyCopilotAgentProgress(
          pipelineAgent,
          "complete",
          `${label} completed — dashboard synchronized.`,
        );
      }

      if (parsed?.ok) {
        const applied = onApplyIncremental(toolName, payload);
        if (!applied) {
          const legacy = coerceAnalyzeLogsResult(payload);
          if (legacy) onApplyResult(legacy);
        }
        onWorkflowUpdate(stage, "copilot", `${label} completed — session cache updated.`);

        if (toolName === "runReporterAgent") {
          const reportData = parsed.data as RunReporterAgentData;
          void generateReportCanvas({ report: reportData.primeReport });
        } else if (toolName === "analyzeLogs") {
          const legacy = coerceAnalyzeLogsResult(payload);
          if (legacy) {
            void generateReportCanvas({
              report: legacy.primeReport,
              query: legacy.query,
            });
          }
        }
        return;
      }

      if (parsed && !parsed.ok) {
        onWorkflowUpdate("error", "copilot", parsed.error.message);
        return;
      }

      const legacy = coerceAnalyzeLogsResult(payload);
      if (legacy) {
        onApplyResult(legacy);
        onWorkflowUpdate("ready", "copilot", `${label} completed.`);
        return;
      }

      const fallbackApplied = onApplyIncremental(toolName, payload);
      if (fallbackApplied) {
        onWorkflowUpdate(stage, "copilot", `${label} completed — dashboard synchronized.`);
      }
      return;
    }

    if (enteredError) {
      if (pipelineAgent) {
        applyCopilotAgentProgress(pipelineAgent, "error", `${label} failed.`);
      }
      onWorkflowUpdate("error", "copilot", `${label} failed.`);
      return;
    }

    if (enteredExecuting) {
      onWorkflowUpdate(stage, "copilot", `Copilot dispatched ${label}.`);
      if (pipelineAgent) {
        applyCopilotAgentProgress(pipelineAgent, "running", `Copilot dispatched ${label}.`);
      }
    }
  }, [
    toolName,
    label,
    status,
    result,
    onApplyResult,
    onApplyIncremental,
    onWorkflowUpdate,
    generateReportCanvas,
    applyCopilotAgentProgress,
    pipelineAgent,
  ]);

  return <IncrementalToolStatus label={label} status={status} toolName={toolName} />;
}


export function useIncrementalAgentCopilotTools({
  onApplyResult,
  onApplyIncremental,
  onWorkflowUpdate,
}: {
  onApplyResult: (result: AnalyzeLogsResult) => void;
  onApplyIncremental: (toolName: AIOpsAgentToolId, result: unknown) => boolean;
  onWorkflowUpdate: IncrementalToolCardProps["onWorkflowUpdate"];
}) {
  const { artifactCache, projectCatalog, selectedScope } = useAIOpsSession();

  useCopilotChatSuggestions(
    {
      suggestions: [
        {
          title: "Analisi oggi",
          message:
            "Mostrami il riepilogo dell'analisi di oggi e renderizza la summary card nel chat.",
        },
        {
          title: "Analysis summary",
          message: "Show me summary of today's analysis and render the analysis summary card.",
        },
        {
          title: "My projects",
          message: "Which projects do I have and what services belong to each?",
        },
        ...(selectedScope
          ? [
              {
                title: `Analyze ${selectedScope.projectName}`,
                message: `Run telemetry for project ${selectedScope.projectName} (projectId: ${selectedScope.projectId}, companyId: ${selectedScope.companyId})`,
              },
            ]
          : projectCatalog.length > 0
            ? [
                {
                  title: "Analyze Project Gem",
                  message:
                    "Run telemetry for Project Gem (projectId: project-gem, companyId: acme-corp)",
                },
              ]
            : []),
        { title: "Run telemetry", message: "Run telemetry and scan logs for incidents" },
        ...(artifactCache.incidents.length > 0
          ? [{ title: "Run analyst", message: "Analyze incidents from the session cache" }]
          : []),
        ...(artifactCache.incidents.length > 0
          ? [
              {
                title: "Generate PRIME report",
                message: "Generate PRIME report from last analysis in cache",
              },
            ]
          : []),
      ],
      available: "after-first-message",
    },
    [
      artifactCache.incidents.length,
      artifactCache.analyses.length,
      projectCatalog.length,
      selectedScope?.projectId,
    ],
  );

  useHumanInTheLoop({
    name: "confirmRunAnalyst",
    description: "Ask the user to confirm before calling runAnalystAgent.",
    parameters: z.object({ incidentCount: z.number().optional() }),
    render: ({ status, args, respond }) => {
      const count = args.incidentCount ?? artifactCache.incidents.length;

      if (status !== "executing") {
        return (
          <p className="text-sm text-muted-foreground mt-2">
            Analyst confirmation {status === "complete" ? "recorded" : "pending"}.
          </p>
        );
      }

      return (
        <div className="mt-4 rounded-2xl border border-border bg-secondary/20 p-5 text-sm w-full max-w-sm">
          <p className="font-medium text-foreground mb-2">Confirm Analysis</p>
          <p className="text-muted-foreground mb-4">
            Run analyst on {count} incident{count === 1 ? "" : "s"} from session cache?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="bg-primary/10 text-primary border border-primary/25 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/15 transition-colors"
              onClick={() => respond?.({ confirmed: true })}
            >
              Run Analyst
            </button>
            <button
              type="button"
              className="bg-white text-muted-foreground border border-border px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-secondary transition-colors"
              onClick={() => respond?.({ confirmed: false })}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    },
  });

  useHumanInTheLoop({
    name: "confirmRunReporter",
    description: "Ask the user to confirm before calling runReporterAgent.",
    parameters: z.object({ allowEmptyReport: z.boolean().optional() }),
    render: ({ status, args, respond }) => {
      const empty = artifactCache.incidents.length === 0;

      if (status !== "executing") {
        return (
          <p className="text-sm text-muted-foreground mt-2">
            Reporter confirmation {status === "complete" ? "recorded" : "pending"}.
          </p>
        );
      }

      return (
        <div className="mt-4 rounded-2xl border border-border bg-secondary/20 p-5 text-sm w-full max-w-sm">
          <p className="font-medium text-foreground mb-2">Confirm Report</p>
          <p className="text-muted-foreground mb-4">
            {empty
              ? "No incidents in cache. Generate an empty executive report?"
              : `Generate PRIME report from ${artifactCache.analyses.length} analyses and ${artifactCache.incidents.length} incidents?`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="bg-primary/10 text-primary border border-primary/25 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/15 transition-colors"
              onClick={() => respond?.({ confirmed: true, allowEmptyReport: empty || args.allowEmptyReport })}
            >
              Generate Report
            </button>
            <button
              type="button"
              className="bg-white text-muted-foreground border border-border px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-secondary transition-colors"
              onClick={() => respond?.({ confirmed: false })}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    },
  });

  useRenderTool({
    name: "runTelemetryAgent",
    parameters: z.object({}),
    render: (props) => (
      <IncrementalToolCard
        toolName="runTelemetryAgent"
        label="Telemetry agent"
        {...props}
        onApplyResult={onApplyResult}
        onApplyIncremental={onApplyIncremental}
        onWorkflowUpdate={onWorkflowUpdate}
      />
    ),
  });

  useRenderTool({
    name: "runAnalystAgent",
    parameters: z.object({}),
    render: (props) => (
      <IncrementalToolCard
        toolName="runAnalystAgent"
        label="Analyst agent"
        {...props}
        onApplyResult={onApplyResult}
        onApplyIncremental={onApplyIncremental}
        onWorkflowUpdate={onWorkflowUpdate}
      />
    ),
  });

  useRenderTool({
    name: "runReporterAgent",
    parameters: z.object({}),
    render: (props) => (
      <IncrementalToolCard
        toolName="runReporterAgent"
        label="PRIME reporter"
        {...props}
        onApplyResult={onApplyResult}
        onApplyIncremental={onApplyIncremental}
        onWorkflowUpdate={onWorkflowUpdate}
      />
    ),
  });

  useRenderTool({
    name: "analyzeLogs",
    parameters: z.object({}),
    render: (props) => (
      <IncrementalToolCard
        toolName="analyzeLogs"
        label="Full ADK pipeline"
        {...props}
        onApplyResult={onApplyResult}
        onApplyIncremental={onApplyIncremental}
        onWorkflowUpdate={onWorkflowUpdate}
      />
    ),
  });
}
