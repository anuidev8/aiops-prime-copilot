"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CopilotChat,
  CopilotChatViewProps,
  CopilotKit,
  JsonSerializable,
  useAgent,
  useAgentContext,
  useComponent,
  useDefaultRenderTool,
  useRenderTool,
} from "@copilotkit/react-core/v2";
import { z } from "zod";
import { adkPipelineActivityRenderer } from "@/features/agent-pipeline/ui/adk-pipeline-chat-activity";
import { useSyncAdkPipelineChatActivity } from "@/features/agent-pipeline/hooks/use-sync-adk-pipeline-chat-activity";
import { AgentPipelineLive } from "@/features/agent-pipeline/ui/agent-pipeline-live";
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
    <div className="mb-4 rounded-xl border border-cyan-500/20 bg-slate-900/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex flex-wrap items-center gap-2">
        {workflowSequence.map((step, index) => {
          const complete = activeIndex > index;
          const active = activeIndex === index;

          return (
            <span
              key={step.stage}
              className={[
                "rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide transition-colors",
                complete
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : active
                    ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                    : "border-slate-700/50 bg-slate-800/50 text-slate-500",
              ].join(" ")}
            >
              {step.label}
            </span>
          );
        })}
        {workflow.stage === "error" ? (
          <span className="rounded-full border border-rose-500/50 bg-rose-500/20 px-2.5 py-1 text-xs font-medium text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
            Error
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-slate-400 border-t border-slate-800/50 pt-2">{workflow.detail}</p>
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
    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
    : "border-amber-500/30 text-amber-400 bg-amber-500/10";
  const adcTone = status?.adc.tokenReady
    ? "text-emerald-400"
    : status?.adc.required
      ? "text-amber-400"
      : "text-slate-500";
  const checkedAt = status ? new Date(status.checkedAt).toLocaleTimeString() : "Pending";

  return (
    <section className="mb-4 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5 text-cyan-500"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
          Runtime Status
        </h3>
        <button
          type="button"
          onClick={() => void refreshStatus("manual")}
          className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>

      <p className="mb-3 text-xs text-slate-500 font-mono">Last check: {checkedAt}</p>

      {status ? (
        <div className="space-y-2.5 text-xs text-slate-300">
          <p className={`rounded-lg border px-3 py-2 ${statusTone}`}>{status.message}</p>
          <p>
            ADK: <strong className="text-white">{status.adk.backend}</strong> · model{" "}
            <strong className="text-cyan-400">{status.adk.model}</strong>
          </p>
          <p className={adcTone}>
            ADC: {status.adc.configured ? "configured" : "not configured"} · token{" "}
            {status.adc.tokenReady ? "ready" : "not ready"}
          </p>
          {status.adk.vertexEnabled ? (
            <p>
              Vertex scope: <strong className="text-white">{status.adk.project ?? "missing project"}</strong> ·{" "}
              <strong className="text-white">{status.adk.location ?? "missing location"}</strong>
            </p>
          ) : null}
          <p>
            Copilot: <strong className="text-white">{status.copilot.provider}</strong> · model{" "}
            <strong className="text-cyan-400">{status.copilot.model}</strong>
          </p>
          {status.adc.principal ? (
            <p className="truncate text-slate-500">
              Principal ({status.adc.principalType}): {status.adc.principal}
            </p>
          ) : null}
          {status.adc.error ? (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-400">
              ADC detail: {status.adc.error}
            </p>
          ) : null}
        </div>
      ) : null}

      {loading ? <p className="mt-3 text-xs text-cyan-500 animate-pulse">Checking runtime...</p> : null}
      {error ? <p className="mt-3 text-xs text-rose-500">{error}</p> : null}

      <div className="mt-4 rounded-lg border border-slate-800/50 bg-[#090c15] p-3 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Runtime Log
        </p>
        {logEntries.length === 0 ? (
          <p className="text-xs text-slate-600 font-mono">No checks yet.</p>
        ) : (
          <ul className="space-y-1.5 font-mono text-[10px]">
            {logEntries.map((entry) => (
              <li key={entry.id} className="text-slate-400">
                <span className="text-slate-600">[{new Date(entry.timestamp).toLocaleTimeString()}]</span>{" "}
                <span className={entry.level === 'error' ? 'text-rose-400' : entry.level === 'warn' ? 'text-amber-400' : 'text-emerald-400'}>
                  {entry.message}
                </span>
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

  const showPipeline =
    name === "analyzeLogs" &&
    (status === "inProgress" || status === "executing" || status === "complete");

  return (
    <div className="mt-2 space-y-2">
      {showPipeline ? <AgentPipelineLive compact /> : null}
      <details className="rounded-lg border border-cyan-500/20 bg-cyan-900/10 p-3 text-xs">
        <summary className="cursor-pointer font-medium text-cyan-400">
          {status === "complete" ? `Tool ${name} completed` : `Tool ${name} running`}
        </summary>
        <p className="mt-2 break-words rounded border border-slate-800 bg-[#090c15] p-2 font-mono text-[10px] text-slate-400">
          Args: {JSON.stringify(parameters)}
        </p>
      </details>
    </div>
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
  const {
    result,
    workflow,
    applyResultFromCopilot,
    setWorkflowStage,
    agentPipeline,
    incidentProgress,
    isAnalyzing,
  } = useAIOpsSession();
  const { agent } = useAgent({ agentId: "default" });

  useSyncAdkPipelineChatActivity(agent);

  useComponent({
    name: "showAdkAgentPipeline",
    description:
      "Render the live ADK agent pipeline (scope, telemetry, analyst, reporter) inside chat while analysis runs.",
    parameters: z.object({
      headline: z.string().optional(),
    }),
    render: () => <AgentPipelineLive compact />,
  });

  useRenderTool({
    name: "analyzeLogs",
    parameters: z.object({
      prompt: z.string().optional(),
      services: z.array(z.string()).optional(),
      timeWindowMinutes: z.number().optional(),
    }),
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

  const sharedContext = useMemo(
    () =>
      JSON.parse(
        JSON.stringify({
          query: result?.query ?? null,
          incidents: result?.incidents ?? [],
          kpis: result?.primeReport.kpis ?? [],
          workflow,
          agentPipeline,
          incidentProgress,
          isAnalyzing,
        }),
      ) as JsonSerializable,
    [result, workflow, agentPipeline, incidentProgress, isAnalyzing],
  );

  useAgentContext({
    description:
      "Current AIOps session context with live ADK agent pipeline status, incidents, PRIME KPIs, and workflow stage.",
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
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-1 flex-1 min-h-[400px] overflow-hidden">
      {/* We add global overrides for CopilotKit CSS to match dark theme */}
      <style dangerouslySetInnerHTML={{__html: `
        .copilotKitChat {
           --copilot-kit-background: transparent !important;
           --copilot-kit-primary-color: #00f0ff !important;
           --copilot-kit-secondary-color: rgba(30, 41, 59, 0.8) !important;
        }
        .copilotKitMessage { color: #d1d5db !important; }
        .copilotKitInput { 
           background: rgba(15, 23, 42, 0.8) !important;
           border: 1px solid rgba(0, 240, 255, 0.2) !important;
           color: white !important;
        }
      `}} />
      
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
      title="Multi Agent Decision Layer"
      subtitle="Chat + stateful workflow orchestration across telemetry, analysis and reporting"
      className="h-full flex flex-col"
    >
      <WorkflowRail />
      <RuntimeStatusCard />

      <form className="mb-4 grid gap-3 p-4 rounded-xl border border-slate-800/60 bg-[#090c15]/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]" onSubmit={onSubmit}>
        <div>
           <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5" htmlFor="services-input">
             Services Target
           </label>
           <input
             id="services-input"
             className="w-full rounded-lg border border-slate-700/50 bg-slate-900/80 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
             placeholder="payments-api, auth-service"
             value={servicesInput}
             onChange={(event) => setServicesInput(event.target.value)}
           />
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20"
            checked={useTimeWindow}
            onChange={(event) => setUseTimeWindow(event.target.checked)}
          />
          Use custom time window
        </label>

        {useTimeWindow ? (
          <div className="animate-in fade-in slide-in-from-top-2">
            <input
              id="window-input"
              type="number"
              min={1}
              max={1440}
              className="w-full rounded-lg border border-slate-700/50 bg-slate-900/80 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
              value={timeWindowInput}
              onChange={(event) => setTimeWindowInput(event.target.value)}
            />
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isAnalyzing}
          className="mt-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] disabled:opacity-50 disabled:shadow-none transition-all w-full border border-cyan-400/30"
        >
          {isAnalyzing ? "Executing Analysis Pipeline..." : "Execute Market / Signal Agents"}
        </button>
      </form>

      {result ? (
        <p className="mb-4 rounded-lg bg-slate-800/40 border border-slate-700/50 px-3 py-2.5 text-xs text-slate-300">
          <span className="text-cyan-400 mr-2">✓</span> Scope resolved to <span className="font-mono text-white">{result.query.analyzedServices.join(", ") || "all services"}</span> over{" "}
          <span className="font-mono text-white">{result.query.resolvedTimeWindowMinutes}</span> minutes.
        </p>
      ) : null}

      {error ? <p className="mb-4 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">{error}</p> : null}

      <CopilotChatSurface />
    </Panel>
  );
}

const aiopsActivityRenderers = [adkPipelineActivityRenderer] as const;

export function AIOpsCopilot() {
  const runtimeUrl = process.env.NEXT_PUBLIC_COPILOT_RUNTIME_URL ?? "/api/copilotkit";

  return (
    <CopilotKit
      runtimeUrl={runtimeUrl}
      useSingleEndpoint
      debug={false}
      renderActivityMessages={[...aiopsActivityRenderers]}
    >
      <AIOpsCopilotPanel />
    </CopilotKit>
  );
}
