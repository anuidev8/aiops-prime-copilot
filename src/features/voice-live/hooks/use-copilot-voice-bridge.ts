"use client";

import { useEffect, useMemo, useRef } from "react";
import { useLiveAPIContext } from "@/features/voice-live/context/live-api-context";
import { buildVoiceLiveConnectConfig } from "@/features/voice-live/lib/voice-live-config";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import { buildAnalysisWorkspaceSummary } from "@/shared/lib/build-analysis-workspace-summary";
import type { AppNavId } from "@/shared/ui/layout/app-sidebar";

const MAX_NARRATIVE_CHARS = 220;
const MAX_BUSINESS_SUMMARY_CHARS = 220;
const MAX_WORKFLOW_DETAIL_CHARS = 180;
const MAX_CONTEXT_SEED_CHARS = 2400;

function compactText(text: string | null | undefined, maxChars: number): string {
  if (!text) {
    return "";
  }
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= maxChars) {
    return compact;
  }
  return `${compact.slice(0, maxChars - 1)}…`;
}

function formatVoiceContext(params: {
  workflowStage: string;
  workflowDetail: string;
  scopeLabel: string;
  navId: AppNavId;
  reportLayerOpen: boolean;
  incidentCount: number;
  analysesCount: number;
  topIncidents: string[];
  topRootCauses: string[];
  kpis: string[];
  narrative: string;
  businessSummary: string;
  costSummaryLine: string;
  navCommandHints: string;
}): string {
  const lines: string[] = [
    `Workflow: ${params.workflowStage}.`,
    `Workflow detail: ${params.workflowDetail || "No active workflow detail."}`,
    `Selected scope: ${params.scopeLabel}.`,
    `Current screen: ${params.navId}${params.reportLayerOpen ? " (report layer open)" : ""}.`,
    `Incidents: ${params.incidentCount}. Analyses: ${params.analysesCount}.`,
    params.costSummaryLine,
    params.navCommandHints,
  ];

  if (params.topIncidents.length > 0) {
    lines.push(`Top incidents: ${params.topIncidents.join(" | ")}.`);
  }

  if (params.topRootCauses.length > 0) {
    lines.push(`Top root-cause hypotheses: ${params.topRootCauses.join(" | ")}.`);
  }

  if (params.kpis.length > 0) {
    lines.push(`KPI snapshot: ${params.kpis.join(" | ")}.`);
  }

  if (params.narrative) {
    lines.push(`Report narrative: ${params.narrative}.`);
  }

  if (params.businessSummary) {
    lines.push(`Business summary: ${params.businessSummary}.`);
  }

  return lines.join("\n");
}

function normalizeTranscript(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function mergeTranscriptChunk(current: string, incoming: string): string {
  const previous = current.replace(/\s+/g, " ").trim();
  const next = incoming.replace(/\s+/g, " ").trim();
  if (!next) {
    return previous;
  }
  if (!previous) {
    return next;
  }
  if (next === previous) {
    return previous;
  }
  if (next.startsWith(previous)) {
    return next;
  }
  if (previous.startsWith(next)) {
    return previous;
  }
  if (previous.endsWith(next) || previous.includes(next)) {
    return previous;
  }
  return `${previous} ${next}`;
}

type VoiceNavIntent =
  | {
      navId: AppNavId;
      openReportLayer: boolean;
      closeReportLayer: boolean;
      ensureReportCanvas: boolean;
    }
  | null;

function parseVoiceNavigationIntent(rawText: string): VoiceNavIntent {
  const text = normalizeTranscript(rawText);
  if (!text) {
    return null;
  }

  if (
    text.includes("report view") ||
    text.includes("reports view") ||
    text.includes("open report") ||
    text.includes("show report") ||
    text.includes("report page") ||
    text.includes("go to report") ||
    text.includes("navigate to report")
  ) {
    return {
      navId: "prime",
      openReportLayer: true,
      closeReportLayer: false,
      ensureReportCanvas: true,
    };
  }

  if (
    text.includes("analysis dashboard") ||
    text.includes("telemetry dashboard") ||
    text.includes("open dashboard") ||
    text.includes("show dashboard") ||
    text.includes("dashboard view") ||
    text.includes("go to dashboard") ||
    text.includes("back to dashboard") ||
    text.includes("return to dashboard") ||
    text.includes("navigate to dashboard")
  ) {
    return {
      navId: "overview",
      openReportLayer: false,
      closeReportLayer: true,
      ensureReportCanvas: false,
    };
  }

  if (text.includes("incidents view") || text.includes("open incidents")) {
    return {
      navId: "incidents",
      openReportLayer: false,
      closeReportLayer: false,
      ensureReportCanvas: false,
    };
  }

  if (text.includes("services view") || text.includes("open services")) {
    return {
      navId: "services",
      openReportLayer: false,
      closeReportLayer: false,
      ensureReportCanvas: false,
    };
  }

  if (text.includes("projects view") || text.includes("open projects")) {
    return {
      navId: "projects",
      openReportLayer: false,
      closeReportLayer: false,
      ensureReportCanvas: false,
    };
  }

  if (text.includes("recommendations view") || text.includes("open recommendations")) {
    return {
      navId: "recommendations",
      openReportLayer: false,
      closeReportLayer: false,
      ensureReportCanvas: false,
    };
  }

  return null;
}

/**
 * Read-only voice bridge for MVP demos:
 * - keeps Gemini Live connected
 * - seeds dashboard/cache context into system instructions
 * - never runs CopilotKit agents from voice
 */
export function useCopilotVoiceBridgeRegistration() {
  const { client, connected, setConfig } = useLiveAPIContext();
  const {
    artifactCache,
    projectCatalog,
    portfolioHealth,
    result,
    selectedScope,
    workflow,
    agentPipeline,
    isAnalyzing,
    workspaceNavId,
    reportLayerOpen,
    reportCanvas,
    reportCanvasGenerating,
    setWorkspaceNavId,
    setReportLayerOpen,
    generateReportCanvas,
    registerVoiceCopilotHandlers,
    setVoiceSessionStatus,
    setExecutionChannel,
  } = useAIOpsSession();

  const contextSnapshot = useMemo(() => {
    const report = result?.primeReport ?? artifactCache.primeReport;
    const summary = buildAnalysisWorkspaceSummary({
      projectCatalog,
      portfolioHealth,
      incidents: artifactCache.incidents,
      analyses: artifactCache.analyses,
      primeReport: report,
      selectedProjectId: selectedScope?.projectId ?? null,
      resolvedServiceCount: selectedScope?.serviceNames.length ?? null,
      workflowStage: workflow.stage,
      agentPipeline,
      isAnalyzing,
      workspaceMetrics: artifactCache.workspaceMetrics,
    });

    const topIncidents = artifactCache.incidents.slice(0, 5).map((incident) => {
      return `${incident.service} (${incident.severity}, ${incident.status})`;
    });

    const topRootCauses = artifactCache.analyses
      .slice(0, 4)
      .map((analysis) => compactText(analysis.rootCause.hypothesis, 90))
      .filter(Boolean);

    const kpis = (report?.kpis ?? [])
      .slice(0, 6)
      .map((kpi) => `${kpi.name}: ${kpi.value}${kpi.unit}`);

    const scopeLabel = selectedScope
      ? `${selectedScope.projectName} (${selectedScope.projectId})`
      : "No explicit project selected";

    const costBreakdown = summary.cost.breakdown
      .map(
        (item) =>
          `${item.label}: $${item.amountUsd.toLocaleString("en-US")} (${item.percent}%)`,
      )
      .join(" | ");

    const costSummaryLine = `Cost overview (${summary.cost.windowLabel}): Total $${summary.cost.totalUsd.toLocaleString(
      "en-US",
    )}. ${costBreakdown}.`;

    const navCommandHints =
      "Navigation voice commands supported by app: report page, analysis dashboard, incidents view, services view, projects view, recommendations view.";

    return formatVoiceContext({
      workflowStage: workflow.stage,
      workflowDetail: compactText(workflow.detail, MAX_WORKFLOW_DETAIL_CHARS),
      scopeLabel,
      navId: workspaceNavId,
      reportLayerOpen,
      incidentCount: artifactCache.incidents.length,
      analysesCount: artifactCache.analyses.length,
      topIncidents,
      topRootCauses,
      kpis,
      narrative: compactText(report?.narrative, MAX_NARRATIVE_CHARS),
      businessSummary: compactText(
        report?.businessSummary,
        MAX_BUSINESS_SUMMARY_CHARS,
      ),
      costSummaryLine,
      navCommandHints,
    });
  }, [
    artifactCache.analyses,
    artifactCache.incidents,
    artifactCache.primeReport,
    artifactCache.workspaceMetrics,
    agentPipeline,
    isAnalyzing,
    portfolioHealth,
    projectCatalog,
    reportLayerOpen,
    result?.primeReport,
    selectedScope,
    workflow.detail,
    workflow.stage,
    workspaceNavId,
  ]);

  useEffect(() => {
    setConfig(buildVoiceLiveConnectConfig({ contextSnapshot }));
  }, [contextSnapshot, setConfig]);

  const lastSeededContextRef = useRef("");
  useEffect(() => {
    if (!connected) {
      lastSeededContextRef.current = "";
      return;
    }

    const seed =
      contextSnapshot.length > MAX_CONTEXT_SEED_CHARS
        ? `${contextSnapshot.slice(0, MAX_CONTEXT_SEED_CHARS - 1)}…`
        : contextSnapshot;

    if (!seed || seed === lastSeededContextRef.current) {
      return;
    }

    client.send(`Dashboard context snapshot:\n${seed}`, false);
    lastSeededContextRef.current = seed;
  }, [client, connected, contextSnapshot]);

  useEffect(() => {
    setExecutionChannel("chat");
    setVoiceSessionStatus(connected ? "connected" : "disconnected");
  }, [connected, setExecutionChannel, setVoiceSessionStatus]);

  useEffect(() => {
    const submitUtterance = async (text: string): Promise<string | null> => {
      const normalized = text.trim();
      if (!normalized || !connected) {
        return null;
      }
      client.send(normalized, true);
      return normalized;
    };

    registerVoiceCopilotHandlers({ submitUtterance });
    return () => {
      registerVoiceCopilotHandlers(null);
    };
  }, [client, connected, registerVoiceCopilotHandlers]);

  const lastHandledTranscriptRef = useRef<{ text: string; at: number }>({
    text: "",
    at: 0,
  });
  const transcriptBufferRef = useRef("");

  useEffect(() => {
    const applyVoiceNavigationIntent = (rawTranscript: string) => {
      const normalized = normalizeTranscript(rawTranscript);
      if (!normalized) {
        return;
      }

      const now = Date.now();
      if (
        normalized === lastHandledTranscriptRef.current.text &&
        now - lastHandledTranscriptRef.current.at < 1500
      ) {
        return;
      }
      lastHandledTranscriptRef.current = { text: normalized, at: now };

      const intent = parseVoiceNavigationIntent(normalized);
      if (!intent) {
        return;
      }

      setWorkspaceNavId(intent.navId);
      if (intent.openReportLayer) {
        setReportLayerOpen(true);
      }
      if (intent.closeReportLayer) {
        setReportLayerOpen(false);
      }
      if (
        intent.ensureReportCanvas &&
        !reportCanvas &&
        !reportCanvasGenerating
      ) {
        void generateReportCanvas();
      }
    };

    const onInputTranscription = (text: string, finished: boolean) => {
      transcriptBufferRef.current = mergeTranscriptChunk(transcriptBufferRef.current, text);
      if (!finished) {
        return;
      }
      applyVoiceNavigationIntent(transcriptBufferRef.current);
      transcriptBufferRef.current = "";
    };

    const onTurnComplete = () => {
      applyVoiceNavigationIntent(transcriptBufferRef.current);
      transcriptBufferRef.current = "";
    };

    client.on("inputtranscription", onInputTranscription);
    client.on("turncomplete", onTurnComplete);
    return () => {
      client.off("inputtranscription", onInputTranscription);
      client.off("turncomplete", onTurnComplete);
    };
  }, [
    client,
    generateReportCanvas,
    reportCanvas,
    reportCanvasGenerating,
    setReportLayerOpen,
    setWorkspaceNavId,
  ]);
}
