import type { Message, ToolMessage } from "@ag-ui/core";
import { coerceAnalyzeLogsResult } from "@/shared/lib/analysis-chat";
import {
  normalizeCopilotToolPayload,
  parseAgentToolResult,
} from "@/shared/lib/coerce-agent-tool-result";
import type {
  RunAnalystAgentData,
  RunReporterAgentData,
  RunTelemetryAgentData,
} from "@/shared/types/agent-tool-response";
import type {
  AnalyzeLogsResult,
  PrimeReportViewModel,
  ProjectOwnershipViewModel,
} from "@/shared/types/aiops";
import type { AnalysisWorkspaceSummary } from "@/shared/types/analysis-workspace-summary";
import type {
  AIOpsSessionArtifactCache,
} from "@/shared/types/session-artifact-cache";
import type { ReportCanvasDocument } from "@/shared/types/report-canvas";
import type {
  AnalysisWorkflowState,
  DashboardFocusState,
  ReportCanvasMode,
} from "@/processes/aiops-analysis-session/model/aiops-session-context";

type SetDashboardFocusFn = (
  focus: Omit<DashboardFocusState, "updatedAt"> & { updatedAt?: string },
) => void;

export interface SetDashboardFocusToolArgs {
  scope: "overview" | "project" | "service";
  projectId?: string;
  projectName?: string;
  serviceName?: string;
  metricName?: string;
  reason?: string;
}

export interface VoiceTelemetryToolArgs {
  companyId?: string;
  projectId?: string;
  projectName?: string;
  services?: string[];
}

export function buildRunTelemetryVoicePrompt(args: VoiceTelemetryToolArgs = {}): string {
  const services =
    args.services?.map((service) => service.trim()).filter(Boolean) ?? [];
  const projectLabel =
    args.projectName?.trim() || args.projectId?.trim() || "the selected project";
  const companyId = args.companyId?.trim();
  const context: string[] = [];
  if (companyId) {
    context.push(`companyId: ${companyId}`);
  }
  if (args.projectId?.trim()) {
    context.push(`projectId: ${args.projectId.trim()}`);
  }
  if (services.length > 0) {
    context.push(`services: ${services.join(", ")}`);
  }

  const suffix = context.length > 0 ? ` (${context.join(", ")})` : "";
  return `Run telemetry for ${projectLabel}${suffix}.`;
}

export function buildRunAnalystVoicePrompt(): string {
  return "Analyze incidents from cache using runAnalystAgent and summarize what changed.";
}

export function buildRunReporterVoicePrompt(): string {
  return "Generate the PRIME report from current cache and open the report canvas.";
}

export function executeSetDashboardFocus(params: {
  args: SetDashboardFocusToolArgs;
  projectCatalog: ProjectOwnershipViewModel[];
  setDashboardFocus: SetDashboardFocusFn;
}): { ok: true; message: string } {
  const { args, projectCatalog, setDashboardFocus } = params;
  const projectName =
    args.projectName ??
    (args.projectId
      ? projectCatalog.find((project) => project.id === args.projectId)?.name
      : undefined);

  setDashboardFocus({
    scope: args.scope,
    projectId: args.projectId,
    projectName,
    serviceName: args.serviceName,
    metricName: args.metricName,
    reason: args.reason ?? `Copilot set dashboard focus to ${args.scope}.`,
    source: "copilot",
  });

  return {
    ok: true,
    message: `Dashboard focus set to ${args.scope}.`,
  };
}

export interface OpenReportCanvasExecutorInput {
  reportLayerOpen: boolean;
  reportCanvas: ReportCanvasDocument | null;
  reportCanvasGenerating: boolean;
  setReportCanvasMode: (mode: ReportCanvasMode) => void;
  setReportLayerOpen: (open: boolean) => void;
  generateReportCanvas: () => Promise<void>;
}

export async function executeOpenReportCanvas({
  reportLayerOpen,
  reportCanvas,
  reportCanvasGenerating,
  setReportCanvasMode,
  setReportLayerOpen,
  generateReportCanvas,
}: OpenReportCanvasExecutorInput): Promise<{ ok: true; message: string }> {
  if (reportLayerOpen && reportCanvas && !reportCanvasGenerating) {
    return {
      ok: true,
      message: "Report canvas is already open in the workspace.",
    };
  }
  if (reportCanvas && !reportLayerOpen && !reportCanvasGenerating) {
    setReportCanvasMode("present");
    setReportLayerOpen(true);
    return {
      ok: true,
      message: "Report canvas opened in presentation mode.",
    };
  }

  await generateReportCanvas();
  return {
    ok: true,
    message: "Report layer opened with structured sections.",
  };
}

export interface ShowRecommendationCardToolArgs {
  title: string;
  priority: "P0" | "P1" | "P2";
  riskLevel: "high" | "medium" | "low";
  content: string;
  projectId?: string;
  projectName?: string;
  reason?: string;
}

export function executeShowRecommendationCard(params: {
  args: ShowRecommendationCardToolArgs;
  projectCatalog: ProjectOwnershipViewModel[];
  setDashboardFocus: SetDashboardFocusFn;
}): { ok: true; message: string } {
  const { args, projectCatalog, setDashboardFocus } = params;
  const projectName =
    args.projectName ??
    (args.projectId
      ? projectCatalog.find((project) => project.id === args.projectId)?.name
      : undefined);

  setDashboardFocus({
    scope: "recommendation",
    projectId: args.projectId,
    projectName,
    recommendationTitle: args.title,
    recommendationPriority: args.priority,
    recommendationRiskLevel: args.riskLevel,
    recommendationContent: args.content,
    reason: args.reason ?? "Copilot surfaced a recommendation card.",
    source: "copilot",
  });

  return {
    ok: true,
    message: `Recommendation card "${args.title}" displayed.`,
  };
}

interface ToolOutcomeSummaryInput {
  toolName: string | null;
  result: unknown;
  artifactCache: AIOpsSessionArtifactCache;
}

function labelForTool(toolName: string | null): string {
  if (toolName === "runTelemetryAgent") return "telemetry";
  if (toolName === "runAnalystAgent") return "analyst";
  if (toolName === "runReporterAgent") return "reporter";
  if (toolName === "analyzeLogs") return "analysis pipeline";
  return "copilot run";
}

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

function projectScopeLabel(
  query: AnalyzeLogsResult["query"] | null,
  fallback = "the selected scope",
): string {
  return (
    query?.resolvedProjectName?.trim() ||
    query?.requestedProjectId?.trim() ||
    query?.resolvedProjectId?.trim() ||
    fallback
  );
}

function summarizePrimeReport(report: PrimeReportViewModel | null): string {
  if (!report) return "Report generated and synchronized on the dashboard.";
  const kpiCount = report.kpis.length;
  if (kpiCount > 0) {
    return `Report generated with ${kpiCount} ${pluralize(kpiCount, "KPI")} and synchronized on the dashboard.`;
  }
  return "Report generated and synchronized on the dashboard.";
}

function summarizeToolOutcome({
  toolName,
  result,
  artifactCache,
}: ToolOutcomeSummaryInput): string | null {
  const parsed = parseAgentToolResult<unknown>(normalizeCopilotToolPayload(result));
  if (!parsed) {
    return null;
  }

  if (!parsed.ok) {
    return `${labelForTool(toolName)} failed: ${parsed.error.message}`;
  }

  if (toolName === "runTelemetryAgent") {
    const telemetry = parsed.data as Partial<RunTelemetryAgentData>;
    const incidentsCount =
      telemetry.incidents?.length ?? parsed.cachePatch.incidents?.length ?? artifactCache.incidents.length;
    const scope = projectScopeLabel(telemetry.query ?? parsed.cachePatch.query ?? artifactCache.query);
    return `Telemetry completed for ${scope}. I found ${incidentsCount} ${pluralize(incidentsCount, "incident")}.`;
  }

  if (toolName === "runAnalystAgent") {
    const analyst = parsed.data as Partial<RunAnalystAgentData>;
    const analysesCount =
      analyst.analyses?.length ?? parsed.cachePatch.analyses?.length ?? artifactCache.analyses.length;
    return `Analyst completed with ${analysesCount} ${pluralize(analysesCount, "analysis")} ready on the dashboard.`;
  }

  if (toolName === "runReporterAgent") {
    const reporter = parsed.data as Partial<RunReporterAgentData>;
    return summarizePrimeReport(reporter.primeReport ?? parsed.cachePatch.primeReport ?? artifactCache.primeReport);
  }

  if (toolName === "analyzeLogs") {
    const maybeFull = coerceAnalyzeLogsResult(normalizeCopilotToolPayload(result));
    if (maybeFull) {
      const scope = projectScopeLabel(maybeFull.query);
      return `Analysis completed for ${scope}: ${maybeFull.incidents.length} ${pluralize(maybeFull.incidents.length, "incident")} and ${maybeFull.analyses.length} ${pluralize(maybeFull.analyses.length, "analysis")}.`;
    }
    return "Analysis pipeline completed and dashboard state is synchronized.";
  }

  return `${labelForTool(toolName)} completed and dashboard state is synchronized.`;
}

function plainText(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_>#~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateToTwoSentences(text: string): string {
  const trimmed = plainText(text);
  if (!trimmed) return "";
  const sentences = trimmed.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length === 0) return "";
  if (sentences.length === 1) {
    return sentences[0]!.slice(0, 240).trim();
  }
  return `${sentences[0]} ${sentences[1]}`.slice(0, 320).trim();
}

function cacheSummaryForVoice(
  summary: AnalysisWorkspaceSummary | null | undefined,
  artifactCache: AIOpsSessionArtifactCache,
  workflow: AnalysisWorkflowState,
): string {
  const scope = projectScopeLabel(artifactCache.query, "current scope");
  const phaseDetail = workflow.detail ? ` ${plainText(workflow.detail).slice(0, 120)}.` : "";
  const incidentsCount = summary?.activeIncidents ?? artifactCache.incidents.length;
  const anomaliesCount =
    summary?.anomaliesDetected ??
    artifactCache.incidents.filter(
      (incident) => incident.severity === "critical" || incident.severity === "high",
    ).length;
  const statusLabel = summary?.pipelinePhaseLabel ?? "Analysis state updated";
  const recommendation = summary?.topRecommendation
    ? ` Top recommendation: ${plainText(summary.topRecommendation).slice(0, 120)}.`
    : "";
  return `Status: ${statusLabel}.${phaseDetail} In ${scope}, there are ${incidentsCount} active ${pluralize(incidentsCount, "incident")} and ${anomaliesCount} ${pluralize(anomaliesCount, "anomaly")}.${recommendation}`.replace(
    /\s+/g,
    " ",
  ).trim();
}

export function buildVoiceStatusReadout(
  summary: AnalysisWorkspaceSummary | null | undefined,
  artifactCache: AIOpsSessionArtifactCache,
  workflow: AnalysisWorkflowState,
): string {
  return cacheSummaryForVoice(summary, artifactCache, workflow);
}

function isInformationalUtterance(transcript: string): boolean {
  const normalized = transcript.trim().toLowerCase();
  return /(status|summary|today|analysis|cache|kpi|what('?| i)s|how many|overview)/.test(
    normalized,
  );
}

function latestToolOutcomeSummary(
  messagesSinceRunStart: Message[],
  artifactCache: AIOpsSessionArtifactCache,
): string | null {
  const toolNameByCallId = new Map<string, string>();

  for (const message of messagesSinceRunStart) {
    if (message.role !== "assistant" || !message.toolCalls) continue;
    for (const toolCall of message.toolCalls) {
      toolNameByCallId.set(toolCall.id, toolCall.function.name);
    }
  }

  const toolMessages = messagesSinceRunStart.filter(
    (message): message is ToolMessage => message.role === "tool",
  );

  for (let index = toolMessages.length - 1; index >= 0; index -= 1) {
    const toolMessage = toolMessages[index];
    if (!toolMessage) continue;
    const summary = summarizeToolOutcome({
      toolName: toolNameByCallId.get(toolMessage.toolCallId) ?? null,
      result: toolMessage.content,
      artifactCache,
    });
    if (summary) return summary;
  }

  return null;
}

export interface BuildVoiceReadoutInput {
  transcript: string;
  messagesSinceRunStart: Message[];
  assistantReply: string;
  artifactCache: AIOpsSessionArtifactCache;
  analysisSummary?: AnalysisWorkspaceSummary | null;
  workflow: AnalysisWorkflowState;
}

export function buildVoiceReadout({
  transcript,
  messagesSinceRunStart,
  assistantReply,
  artifactCache,
  analysisSummary = null,
  workflow,
}: BuildVoiceReadoutInput): string {
  const fromTool = latestToolOutcomeSummary(messagesSinceRunStart, artifactCache);
  if (fromTool) {
    return truncateToTwoSentences(fromTool);
  }

  if (isInformationalUtterance(transcript) || !assistantReply.trim()) {
    return cacheSummaryForVoice(analysisSummary, artifactCache, workflow);
  }

  const fallback = truncateToTwoSentences(assistantReply);
  if (fallback) {
    return fallback;
  }

  return cacheSummaryForVoice(analysisSummary, artifactCache, workflow);
}
