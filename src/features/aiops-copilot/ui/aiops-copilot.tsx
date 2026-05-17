"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CopilotChat,
  CopilotChatViewProps,
  CopilotKit,
  JsonSerializable,
  useAgent,
  useAgentContext,
  useDefaultRenderTool,
} from "@copilotkit/react-core/v2";
import {
  coerceAnalyzeLogsResult,
  parseAnalysisChatIntent,
} from "@/shared/lib/analysis-chat";
import {
  AnalysisWorkflowStage,
  useAIOpsSession,
} from "@/processes/aiops-analysis-session/model/aiops-session-context";
import { fetchAIOpsRuntimeStatus } from "@/shared/api/aiops-client";
import { AnalyzeLogsResult } from "@/shared/types/aiops";
import { AIOpsRuntimeStatus } from "@/shared/types/runtime-status";
import { Panel } from "@/shared/ui/panel";

const workflowSequence: Array<{
  stage: AnalysisWorkflowStage;
  label: string;
}> = [
  { stage: "collecting_scope", label: "Scope" },
  { stage: "reading_telemetry", label: "Telemetry" },
  { stage: "root_cause_analysis", label: "Analysis" },
  { stage: "reporting", label: "Reporting" },
  { stage: "ready", label: "Ready" },
];

function stageIndex(stage: AnalysisWorkflowStage): number {
  if (stage === "idle") return -1;
  if (stage === "error") return workflowSequence.length;
  return workflowSequence.findIndex((step) => step.stage === stage);
}

function normalizeAgentState(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function WorkflowRail() {
  const { workflow } = useAIOpsSession();
  const activeIndex = stageIndex(workflow.stage);

  return (
    <div className="mb-3 rounded-xl border border-cyan-200/80 bg-cyan-50/80 p-3">
      <div className="flex flex-wrap items-center gap-2">
        {workflowSequence.map((step, index) => {
          const complete = activeIndex > index;
          const active = activeIndex === index;

          return (
            <span
              key={step.stage}
              className={[
                "rounded-full border px-2 py-1 text-xs font-medium",
                complete
                  ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                  : active
                    ? "border-cyan-300 bg-cyan-100 text-cyan-800"
                    : "border-slate-200 bg-white text-slate-500",
              ].join(" ")}
            >
              {step.label}
            </span>
          );
        })}
        {workflow.stage === "error" ? (
          <span className="rounded-full border border-rose-300 bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700">
            Error
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-slate-700">{workflow.detail}</p>
    </div>
  );
}

type RuntimeLogLevel = "ok" | "warn" | "error";

interface RuntimeLogEntry {
  id: string;
  timestamp: string;
  level: RuntimeLogLevel;
  message: string;
}

function RuntimeStatusCard() {
  const [status, setStatus] = useState<AIOpsRuntimeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logEntries, setLogEntries] = useState<RuntimeLogEntry[]>([]);

  const appendLog = useCallback((level: RuntimeLogLevel, message: string) => {
    setLogEntries((current) =>
      [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
          level,
          message,
        },
        ...current,
      ].slice(0, 6),
    );
  }, []);

  const refreshStatus = useCallback(
    async (source: "auto" | "manual") => {
      setLoading(true);
      setError(null);

      try {
        const runtimeStatus = await fetchAIOpsRuntimeStatus();
        setStatus(runtimeStatus);

        const level: RuntimeLogLevel = runtimeStatus.adk.ready
          ? "ok"
          : runtimeStatus.adc.required
            ? "warn"
            : "error";

        appendLog(level, `[${source}] ${runtimeStatus.message}`);
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Failed to load runtime status.";
        setError(message);
        appendLog("error", `[${source}] ${message}`);
      } finally {
        setLoading(false);
      }
    },
    [appendLog],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshStatus("auto");
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshStatus]);

  const statusTone = status?.adk.ready
    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : "border-amber-200 bg-amber-50 text-amber-900";
  const adcTone = status?.adc.tokenReady
    ? "text-emerald-700"
    : status?.adc.required
      ? "text-amber-700"
      : "text-slate-600";
  const checkedAt = status ? new Date(status.checkedAt).toLocaleTimeString() : "Pending";

  return (
    <section className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Runtime Status
        </h3>
        <button
          type="button"
          onClick={() => void refreshStatus("manual")}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <p className="mb-2 text-xs text-slate-600">Last check: {checkedAt}</p>

      {status ? (
        <div className="space-y-2 text-xs">
          <p className={`rounded-lg border px-2 py-1 ${statusTone}`}>{status.message}</p>
          <p>
            ADK: <strong>{status.adk.backend}</strong> · model{" "}
            <strong>{status.adk.model}</strong>
          </p>
          <p className={adcTone}>
            ADC: {status.adc.configured ? "configured" : "not configured"} · token{" "}
            {status.adc.tokenReady ? "ready" : "not ready"}
          </p>
          {status.adk.vertexEnabled ? (
            <p>
              Vertex scope: <strong>{status.adk.project ?? "missing project"}</strong> ·{" "}
              <strong>{status.adk.location ?? "missing location"}</strong>
            </p>
          ) : null}
          <p>
            Copilot: <strong>{status.copilot.provider}</strong> · model{" "}
            <strong>{status.copilot.model}</strong>
          </p>
          {status.adc.principal ? (
            <p className="truncate text-slate-600">
              Principal ({status.adc.principalType}): {status.adc.principal}
            </p>
          ) : null}
          {status.adc.error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700">
              ADC detail: {status.adc.error}
            </p>
          ) : null}
        </div>
      ) : null}

      {loading ? <p className="mt-2 text-xs text-slate-500">Checking runtime...</p> : null}
      {error ? <p className="mt-2 text-xs text-rose-700">{error}</p> : null}

      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Runtime Log
        </p>
        {logEntries.length === 0 ? (
          <p className="text-xs text-slate-500">No checks yet.</p>
        ) : (
          <ul className="space-y-1">
            {logEntries.map((entry) => (
              <li key={entry.id} className="text-xs text-slate-700">
                [{new Date(entry.timestamp).toLocaleTimeString()}] {entry.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

interface ToolRenderCardProps {
  name: string;
  status: string;
  parameters: unknown;
  result: unknown;
  onApplyResult: (result: AnalyzeLogsResult) => void;
  onWorkflowUpdate: (
    stage: AnalysisWorkflowStage,
    source: "manual" | "copilot" | "system",
    detail: string,
  ) => void;
}

function ToolRenderCard({
  name,
  status,
  parameters,
  result,
  onApplyResult,
  onWorkflowUpdate,
}: ToolRenderCardProps) {
  useEffect(() => {
    if (name !== "analyzeLogs") return;

    const parsedResult = coerceAnalyzeLogsResult(result);

    if (status === "complete" && parsedResult) {
      onWorkflowUpdate("reporting", "copilot", "Copilot consolidated KPI report output.");
      onApplyResult(parsedResult);
      return;
    }

    if (status === "failed" || status === "error") {
      onWorkflowUpdate("error", "copilot", "Copilot analysis failed.");
      return;
    }

    if (status === "executing" || status === "inProgress") {
      onWorkflowUpdate(
        "reading_telemetry",
        "copilot",
        "Copilot dispatched ADK analysis across telemetry sources.",
      );
      return;
    }

    onWorkflowUpdate(
      "root_cause_analysis",
      "copilot",
      "Copilot is evaluating incidents and drafting remediation.",
    );
  }, [name, status, result, onApplyResult, onWorkflowUpdate]);

  return (
    <details className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs">
      <summary className="cursor-pointer font-medium text-slate-700">
        {status === "complete" ? `Tool ${name} completed` : `Tool ${name} running`}
      </summary>
      <p className="mt-1 break-words text-slate-600">Args: {JSON.stringify(parameters)}</p>
    </details>
  );
}

function AIOpsCopilotChatViewInner(props: CopilotChatViewProps) {
  const { runAnalysis, setWorkflowStage } = useAIOpsSession();

  const handleSubmitMessage = useCallback(
    (value: string) => {
      const intent = parseAnalysisChatIntent(value);

      if (!intent) {
        props.onSubmitMessage?.(value);
        return;
      }

      const scopeLabel =
        intent.payload.services?.join(", ") ?? "all available services";

      setWorkflowStage(
        "collecting_scope",
        "copilot",
        `Chat requested analysis for ${scopeLabel}. Dispatching ADK pipeline.`,
      );

      void (async () => {
        await runAnalysis(intent.payload, "copilot");
        props.onSubmitMessage?.(value);
      })();
    },
    [props, runAnalysis, setWorkflowStage],
  );

  return <CopilotChat.View {...props} onSubmitMessage={handleSubmitMessage} />;
}

const AIOpsCopilotChatView = Object.assign(
  AIOpsCopilotChatViewInner,
  CopilotChat.View,
);

function CopilotChatSurface() {
  const { result, workflow, applyResultFromCopilot, setWorkflowStage, isAnalyzing } =
    useAIOpsSession();
  const { agent } = useAgent({ agentId: "default" });

  const sharedContext = useMemo(
    () =>
      JSON.parse(
        JSON.stringify({
          query: result?.query ?? null,
          incidents: result?.incidents ?? [],
          kpis: result?.primeReport.kpis ?? [],
          workflow,
        }),
      ) as JsonSerializable,
    [result, workflow],
  );

  useAgentContext({
    description:
      "Current AIOps session context with latest incidents, PRIME KPIs, workflow state, and analysis scope.",
    value: sharedContext,
  });

  useEffect(() => {
    const baseState = normalizeAgentState(agent.state);
    agent.setState({
      ...baseState,
      aiopsWorkflow: workflow,
      latestScope: result?.query ?? null,
    });
  }, [agent, workflow, result]);

  useEffect(() => {
    const subscription = agent.subscribe({
      onRunStartedEvent: () => {
        setWorkflowStage(
          "reading_telemetry",
          "copilot",
          "Copilot run started and requested telemetry scope.",
        );
      },
      onRunFinalized: () => {
        setWorkflowStage("ready", "copilot", "Copilot response finalized.");
      },
      onRunErrorEvent: (input) => {
        const detail =
          input.event.type === "RUN_ERROR"
            ? input.event.message
            : "Copilot run failed unexpectedly.";
        setWorkflowStage("error", "copilot", detail);
      },
    });

    return () => subscription.unsubscribe();
  }, [agent, setWorkflowStage]);

  useDefaultRenderTool({
    render: ({ name, status, parameters, result: toolResult }) => (
      <ToolRenderCard
        name={name}
        status={status}
        parameters={parameters}
        result={toolResult}
        onApplyResult={applyResultFromCopilot}
        onWorkflowUpdate={setWorkflowStage}
      />
    ),
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2">
      {isAnalyzing ? (
        <p className="mb-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-900">
          ADK analysis in progress — dashboard will refresh when incidents and KPIs are ready.
        </p>
      ) : null}
      <CopilotChat
        chatView={AIOpsCopilotChatView}
        labels={{
          chatInputPlaceholder:
            'Try: "run analysis" or "analyze payments-api for last 30 minutes"',
        }}
      />
    </div>
  );
}

function AIOpsCopilotPanel() {
  const { result, runAnalysis, isAnalyzing, error, setWorkflowStage } = useAIOpsSession();
  const [servicesInput, setServicesInput] = useState("");
  const [useTimeWindow, setUseTimeWindow] = useState(false);
  const [timeWindowInput, setTimeWindowInput] = useState("15");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const services = servicesInput
      .split(",")
      .map((service) => service.trim())
      .filter(Boolean);

    const payload: { services?: string[]; timeWindowMinutes?: number } = {};

    if (services.length > 0) {
      payload.services = services;
    }

    if (useTimeWindow) {
      const parsed = Number(timeWindowInput);

      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 1440) {
        setWorkflowStage(
          "error",
          "manual",
          "Time window must be a number between 1 and 1440 minutes.",
        );
        return;
      }

      payload.timeWindowMinutes = Math.floor(parsed);
    }

    setWorkflowStage("collecting_scope", "manual", "Scope captured. Starting analysis.");
    await runAnalysis(payload);
  }

  return (
    <Panel
      title="AIOps Prime Copilot"
      subtitle="Chat + stateful workflow orchestration across telemetry, analysis and reporting"
      className="h-full"
    >
      <WorkflowRail />
      <RuntimeStatusCard />

      <form className="mb-3 grid gap-2" onSubmit={onSubmit}>
        <label className="text-xs font-medium text-slate-600" htmlFor="services-input">
          Services (optional, comma-separated)
        </label>
        <input
          id="services-input"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="payments-api, auth-service"
          value={servicesInput}
          onChange={(event) => setServicesInput(event.target.value)}
        />

        <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            checked={useTimeWindow}
            onChange={(event) => setUseTimeWindow(event.target.checked)}
          />
          Use time window (optional)
        </label>

        {useTimeWindow ? (
          <input
            id="window-input"
            type="number"
            min={1}
            max={1440}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={timeWindowInput}
            onChange={(event) => setTimeWindowInput(event.target.value)}
          />
        ) : null}

        <button
          type="submit"
          disabled={isAnalyzing}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isAnalyzing ? "Analyzing..." : "Run analysis"}
        </button>
      </form>

      {result ? (
        <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">
          Scope resolved to {result.query.analyzedServices.join(", ") || "all services"} over{" "}
          {result.query.resolvedTimeWindowMinutes} minutes.
        </p>
      ) : null}

      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}

      <CopilotChatSurface />
    </Panel>
  );
}

export function AIOpsCopilot() {
  const runtimeUrl = process.env.NEXT_PUBLIC_COPILOT_RUNTIME_URL ?? "/api/copilotkit";

  return (
    <CopilotKit runtimeUrl={runtimeUrl} useSingleEndpoint debug={false}>
      <AIOpsCopilotPanel />
    </CopilotKit>
  );
}
