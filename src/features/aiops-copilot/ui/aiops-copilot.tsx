"use client";

import { type PropsWithChildren, useCallback, useEffect, useMemo, useRef } from "react";
import {
  CopilotChat,
  CopilotKit,
  JsonSerializable,
  useAgent,
  useAgentContext,
  useCopilotKit,
  useFrontendTool,
  useHumanInTheLoop,
} from "@copilotkit/react-core/v2";
import { z } from "zod";
import { useSyncAdkPipelineChatActivity } from "@/features/agent-pipeline/hooks/use-sync-adk-pipeline-chat-activity";
import { adkPipelineActivityRenderer } from "@/features/agent-pipeline/ui/adk-pipeline-chat-activity";
import { AnalysisSummaryChatCard } from "@/features/aiops-copilot/ui/analysis-summary-chat-card";
import { AIOpsCopilotChatView } from "@/features/aiops-copilot/ui/aiops-copilot-chat-view";
import { LiveAPIProvider } from "@/features/voice-live/context/live-api-context";
import {
  executeOpenReportCanvas,
  executeSetDashboardFocus,
  executeShowRecommendationCard,
} from "@/features/voice-live/lib/voice-copilot-actions";
import { resolvePublicGeminiApiKey } from "@/features/voice-live/lib/voice-live-config";
import { CopilotVoiceBridge } from "@/features/voice-live/ui/copilot-voice-bridge";
import {
  ReportSectionSuggestionCard,
  type ReportEditSuggestion,
} from "@/features/aiops-copilot/ui/report-section-suggestion-card";
import { useIncrementalAgentCopilotTools } from "@/features/aiops-copilot/ui/incremental-agent-tools";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import { downloadReportCanvasPdf } from "@/shared/api/report-canvas-client";
import { buildAIOpsWorkspaceState } from "@/shared/lib/build-aiops-workspace-state";
import { buildReportSectionSnapshot } from "@/shared/lib/build-report-section-snapshot";
import type { ReportCopilotUiAction } from "@/shared/types/report-copilot-intent";

const ACTIVITY_RENDERERS = [adkPipelineActivityRenderer];

function reportActionMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `report-action-message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildReportActionPrompt(action: ReportCopilotUiAction): string {
  if (action.type === "approve") {
    return `I approved report section "${action.sectionTitle}" (${action.blockId}). Keep this approved and guide me to the next best section to review.`;
  }
  if (action.type === "edit") {
    return `Help me edit report section "${action.sectionTitle}" (${action.blockId}). Give 2-3 clear alternatives I can apply.`;
  }
  if (action.type === "ask_why") {
    return `Ask why for report section "${action.sectionTitle}" (${action.blockId}). Explain the rationale from current session context and this section only.`;
  }
  return `I want to reject report section "${action.sectionTitle}" (${action.blockId}). Ask me to confirm in chat before rejecting.`;
}

function CopilotChatSurface() {
  const {
    artifactCache,
    projectCatalog,
    projectCatalogLoading,
    portfolioHealth,
    selectedScope,
    dashboardFocus,
    workspaceNavId,
    reportLayerOpen,
    setReportLayerOpen,
    reportCanvas,
    reportCanvasMode,
    setReportCanvasMode,
    selectedCanvasBlockId,
    setSelectedCanvasBlockId,
    reportSectionReviews,
    reportSectionEditing,
    setReportSectionEditing,
    setReportSectionReview,
    reportCopilotIntent,
    setReportCopilotIntent,
    reportCopilotUiAction,
    clearReportCopilotUiAction,
    reportRejectPendingBlockId,
    requestReportReject,
    confirmReportReject,
    cancelReportReject,
    lastCanvasEdit,
    result,
    workflow,
    applyResultFromCopilot,
    applyIncrementalToolResult,
    setWorkflowStage,
    setDashboardFocus,
    generateReportCanvas,
    reportCanvasGenerating,
    executionChannel,
    updateCanvasTextBlock,
    updateCanvasChartBlock,
    agentPipeline,
    incidentProgress,
    isAnalyzing,
  } = useAIOpsSession();
  const { agent } = useAgent({ agentId: "default" });
  const { copilotkit } = useCopilotKit();
  const reportActionRunRef = useRef<string | null>(null);
  const voiceAutoResponsesRef = useRef<Set<string>>(new Set());
  const agentIsRunning = agent.isRunning;
  useSyncAdkPipelineChatActivity(agent);

  useEffect(() => {
    if (executionChannel !== "voice") {
      voiceAutoResponsesRef.current.clear();
    }
  }, [executionChannel]);

  const maybeAutoRespondInVoice = useCallback(
    ({
      key,
      status,
      respond,
      payload,
      afterRespond,
    }: {
      key: string;
      status: string;
      respond?: (value: Record<string, unknown>) => void | Promise<void>;
      payload: Record<string, unknown>;
      afterRespond?: () => void;
    }): boolean => {
      if (executionChannel !== "voice" || status !== "executing" || !respond) {
        return false;
      }

      const responseKey = `${key}:${JSON.stringify(payload)}`;
      if (voiceAutoResponsesRef.current.has(responseKey)) {
        return true;
      }

      voiceAutoResponsesRef.current.add(responseKey);
      queueMicrotask(() => {
        void respond(payload);
        afterRespond?.();
      });
      return true;
    },
    [executionChannel],
  );

  useIncrementalAgentCopilotTools({
    onApplyResult: applyResultFromCopilot,
    onApplyIncremental: applyIncrementalToolResult,
    onWorkflowUpdate: setWorkflowStage,
  });

  useEffect(() => {
    if (!reportCopilotUiAction) {
      return;
    }
    if (agentIsRunning) {
      return;
    }
    if (reportActionRunRef.current === reportCopilotUiAction.id) {
      return;
    }

    reportActionRunRef.current = reportCopilotUiAction.id;
    agent.addMessage({
      id: reportActionMessageId(),
      role: "user",
      content: buildReportActionPrompt(reportCopilotUiAction),
    });

    void copilotkit
      .runAgent({ agent })
      .finally(() => {
        clearReportCopilotUiAction(reportCopilotUiAction.id);
        if (reportActionRunRef.current === reportCopilotUiAction.id) {
          reportActionRunRef.current = null;
        }
      });
  }, [
    agent,
    agentIsRunning,
    clearReportCopilotUiAction,
    copilotkit,
    reportCopilotUiAction,
  ]);

  useFrontendTool({
    name: "setDashboardFocus",
    description:
      "Update the in-place dashboard focus to overview, project, or service without changing sidebar navigation.",
    parameters: z.object({
      scope: z.enum(["overview", "project", "service"]).default("overview"),
      projectId: z.string().optional(),
      projectName: z.string().optional(),
      serviceName: z.string().optional(),
      metricName: z.string().optional(),
      reason: z.string().optional(),
    }),
    handler: async (args) =>
      executeSetDashboardFocus({
        args,
        projectCatalog,
        setDashboardFocus,
      }),
  }, [projectCatalog, setDashboardFocus]);

  useFrontendTool({
    name: "openReportCanvas",
    description:
      "Open the in-dashboard report layer with structured PRIME sections (narrative, KPIs, recommendations). Call after runReporterAgent instead of pasting the full report in chat.",
    parameters: z.object({}),
    handler: async () =>
      executeOpenReportCanvas({
        reportLayerOpen,
        reportCanvas,
        reportCanvasGenerating,
        setReportCanvasMode,
        setReportLayerOpen,
        generateReportCanvas,
      }),
    render: ({ status }) => {
      if (executionChannel === "voice") {
        return null;
      }
      if (status === "inProgress" || status === "executing" || reportCanvasGenerating) {
        return (
          <div className="my-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
            <span className="inline-flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-300 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
              </span>
              Building report layer on the dashboard…
            </span>
          </div>
        );
      }
      if (status === "complete") {
        return (
          <p className="my-2 text-xs text-emerald-700">
            Report layer ready — edit structured sections in the dashboard overlay.
          </p>
        );
      }
      return null;
    },
  }, [
    generateReportCanvas,
    reportCanvas,
    reportCanvasGenerating,
    reportLayerOpen,
    executionChannel,
    setReportCanvasMode,
    setReportLayerOpen,
  ]);

  useFrontendTool({
    name: "downloadReportPdf",
    description: "Generate and download the current report canvas as PDF.",
    parameters: z.object({
      filename: z.string().optional(),
    }),
    handler: async ({ filename }) => {
      if (!reportCanvas) {
        return { ok: false, message: "No report canvas available." };
      }
      await downloadReportCanvasPdf(reportCanvas, filename);
      return { ok: true, message: "PDF generated and downloaded." };
    },
  }, [reportCanvas]);

  useFrontendTool({
    name: "selectReportSection",
    description:
      "Focus a report section by block id or title so the user can review or edit it. Use when the user refers to a report section.",
    parameters: z.object({
      blockId: z.string().optional(),
      title: z.string().optional(),
    }),
    handler: async ({ blockId, title }) => {
      if (!reportCanvas) {
        return { ok: false, message: "No report is open." };
      }
      const match =
        (blockId
          ? reportCanvas.blocks.find((block) => block.id === blockId)
          : undefined) ??
        (title
          ? reportCanvas.blocks.find(
              (block) => block.title.toLowerCase() === title.toLowerCase(),
            )
          : undefined);
      if (!match) {
        return { ok: false, message: "Section not found." };
      }
      setSelectedCanvasBlockId(match.id);
      setReportSectionEditing(false);
      setReportCanvasMode("present");
      cancelReportReject();
      setReportCopilotIntent(null);
      return {
        ok: true,
        message: `Selected section "${match.title}".`,
        blockId: match.id,
        reviewStatus: reportSectionReviews[match.id] ?? "draft",
      };
    },
  }, [
    reportCanvas,
    reportSectionReviews,
    cancelReportReject,
    setReportCanvasMode,
    setReportCopilotIntent,
    setReportSectionEditing,
    setSelectedCanvasBlockId,
  ]);

  useFrontendTool({
    name: "startReportSectionEdit",
    description:
      "Select a report section and switch the report canvas into edit mode so recommendations can target that section.",
    parameters: z.object({
      blockId: z.string().optional(),
      title: z.string().optional(),
    }),
    handler: async ({ blockId, title }) => {
      if (!reportCanvas) {
        return { ok: false, message: "No report is open." };
      }
      const match =
        (blockId
          ? reportCanvas.blocks.find((block) => block.id === blockId)
          : undefined) ??
        (title
          ? reportCanvas.blocks.find(
              (block) => block.title.toLowerCase() === title.toLowerCase(),
            )
          : undefined) ??
        (selectedCanvasBlockId
          ? reportCanvas.blocks.find((block) => block.id === selectedCanvasBlockId)
          : undefined);

      if (!match) {
        return { ok: false, message: "Section not found." };
      }

      setSelectedCanvasBlockId(match.id);
      setReportCanvasMode("edit");
      setReportSectionEditing(true);
      cancelReportReject();
      setReportCopilotIntent({
        type: "help_edit",
        blockId: match.id,
        sectionTitle: match.title,
        blockType: match.type,
        visualKind: match.type === "chart" ? match.visual?.kind : undefined,
        requestedAt: new Date().toISOString(),
      });

      return {
        ok: true,
        message: `Editing "${match.title}".`,
        blockId: match.id,
        blockType: match.type,
      };
    },
  }, [
    cancelReportReject,
    reportCanvas,
    selectedCanvasBlockId,
    setReportCanvasMode,
    setReportCopilotIntent,
    setReportSectionEditing,
    setSelectedCanvasBlockId,
  ]);

  useFrontendTool({
    name: "updateReportSection",
    description:
      "Update the currently selected report section fields (title, narrative, or KPI values). Only call when a section is selected.",
    parameters: z.object({
      blockId: z.string().optional(),
      title: z.string().optional(),
      content: z.string().optional(),
      metricName: z.string().optional(),
      value: z.number().optional(),
      unit: z.string().optional(),
      note: z.string().optional(),
      visualKind: z.enum(["kpi", "bars", "ring", "trend"]).optional(),
    }),
    handler: async (args) => {
      const targetId = args.blockId ?? selectedCanvasBlockId;
      if (!targetId || !reportCanvas) {
        return { ok: false, message: "No report section selected." };
      }
      const block = reportCanvas.blocks.find((entry) => entry.id === targetId);
      if (!block) {
        return { ok: false, message: "Section not found." };
      }
      setSelectedCanvasBlockId(targetId);
      setReportSectionEditing(true);
      setReportCanvasMode("edit");
      setReportCopilotIntent({
        type: "help_edit",
        blockId: block.id,
        sectionTitle: block.title,
        blockType: block.type,
        visualKind: block.type === "chart" ? block.visual?.kind : undefined,
        requestedAt: new Date().toISOString(),
      });
      if (block.type === "text") {
        updateCanvasTextBlock(
          targetId,
          { title: args.title, content: args.content },
          { source: "copilot" },
        );
      } else {
        updateCanvasChartBlock(
          targetId,
          {
            title: args.title,
            metricName: args.metricName,
            value: args.value,
            unit: args.unit,
            note: args.note,
            visualKind: args.visualKind,
          },
          { source: "copilot" },
        );
      }
      return {
        ok: true,
        message: `Updated section "${block.title}".`,
        blockId: targetId,
        lastEdit: lastCanvasEdit,
      };
    },
  }, [
    lastCanvasEdit,
    reportCanvas,
    selectedCanvasBlockId,
    setReportCanvasMode,
    setReportCopilotIntent,
    setReportSectionEditing,
    setSelectedCanvasBlockId,
    updateCanvasChartBlock,
    updateCanvasTextBlock,
  ]);

  useFrontendTool({
    name: "setReportSectionReviewStatus",
    description: "Approve, reject, or mark a report section for review.",
    parameters: z.object({
      blockId: z.string().optional(),
      status: z.enum(["approved", "review", "needs_review", "draft"]),
    }),
    handler: async ({ blockId, status }) => {
      const targetId = blockId ?? selectedCanvasBlockId;
      if (!targetId) {
        return { ok: false, message: "No section specified." };
      }
      setReportSectionReview(targetId, status);
      if (status === "approved") {
        setReportSectionEditing(false);
        setReportCanvasMode("present");
        cancelReportReject();
        setReportCopilotIntent(null);
      }
      if (status === "needs_review") {
        requestReportReject(targetId);
        return {
          ok: true,
          message:
            "Reject is pending confirmation in chat. Call confirmRejectReportSection before applying needs_review.",
          blockId: targetId,
          pendingReject: true,
        };
      }
      cancelReportReject();
      return { ok: true, message: `Section marked as ${status}.`, blockId: targetId };
    },
  }, [
    cancelReportReject,
    setReportCanvasMode,
    selectedCanvasBlockId,
    setReportSectionEditing,
    setReportSectionReview,
    setReportCopilotIntent,
    requestReportReject,
  ]);

  const reportSectionSnapshot = useMemo(() => {
    if (!reportCanvas || !selectedCanvasBlockId) return null;
    const block = reportCanvas.blocks.find((entry) => entry.id === selectedCanvasBlockId);
    if (!block) return null;
    const index = reportCanvas.blocks.findIndex((entry) => entry.id === selectedCanvasBlockId);
    return buildReportSectionSnapshot({
      block,
      index: index >= 0 ? index : 0,
      reviewStatus: reportSectionReviews[selectedCanvasBlockId] ?? "draft",
      isEditing: reportSectionEditing,
    });
  }, [
    reportCanvas,
    reportSectionEditing,
    reportSectionReviews,
    selectedCanvasBlockId,
  ]);

  useFrontendTool({
    name: "suggestReportSectionEdits",
    description:
      "Show styled edit recommendations in chat for the selected report section. Call when the user asks for help editing the current section (including KPI/chart fields).",
    parameters: z.object({
      blockId: z.string().optional(),
      suggestions: z
        .array(
          z.object({
            id: z.string(),
            label: z.string(),
            summary: z.string(),
            proposedTitle: z.string().optional(),
            proposedContent: z.string().optional(),
            proposedMetricName: z.string().optional(),
            proposedValue: z.number().optional(),
            proposedUnit: z.string().optional(),
            proposedNote: z.string().optional(),
            proposedVisualKind: z.enum(["kpi", "bars", "ring", "trend"]).optional(),
          }),
        )
        .min(1),
    }),
    handler: async () => ({
      ok: true,
      message: "Edit suggestions displayed in chat.",
    }),
    render: ({ status, args }) => {
      if (executionChannel === "voice") {
        return null;
      }
      if (status !== "complete") {
        return (
          <p className="my-2 text-xs text-muted-foreground">Preparing edit suggestions…</p>
        );
      }

      const targetId = args.blockId ?? selectedCanvasBlockId;
      const block = reportCanvas?.blocks.find((entry) => entry.id === targetId);
      if (!block) {
        return (
          <p className="my-2 text-xs text-rose-600">
            No report section selected. Ask the user to pick a section first.
          </p>
        );
      }

      const suggestions = args.suggestions as ReportEditSuggestion[];

      return (
        <ReportSectionSuggestionCard
          sectionTitle={block.title}
          sectionKind={block.type}
          suggestions={suggestions}
          onApply={(item) => {
            setSelectedCanvasBlockId(targetId!);
            if (block.type === "text") {
              updateCanvasTextBlock(
                targetId!,
                {
                  title: item.proposedTitle,
                  content: item.proposedContent,
                },
                { source: "copilot" },
              );
            } else {
              updateCanvasChartBlock(
                targetId!,
                {
                  title: item.proposedTitle,
                  metricName: item.proposedMetricName,
                  value: item.proposedValue,
                  unit: item.proposedUnit,
                  note: item.proposedNote,
                  visualKind: item.proposedVisualKind,
                },
                { source: "copilot" },
              );
            }
            setReportCopilotIntent(null);
          }}
        />
      );
    },
  }, [
    executionChannel,
    reportCanvas,
    selectedCanvasBlockId,
    setReportCopilotIntent,
    setSelectedCanvasBlockId,
    updateCanvasChartBlock,
    updateCanvasTextBlock,
  ]);

  useHumanInTheLoop({
    name: "confirmRejectReportSection",
    description:
      "Ask the user to confirm rejecting a report section before marking it needs review.",
    parameters: z.object({
      blockId: z.string().optional(),
      reason: z.string(),
    }),
    render: ({ status, args, respond }) => {
      const targetId = args.blockId ?? selectedCanvasBlockId;
      if (
        maybeAutoRespondInVoice({
          key: `confirmRejectReportSection:${targetId ?? "none"}`,
          status,
          respond,
          payload: { confirmed: false, blockId: targetId ?? null },
          afterRespond: cancelReportReject,
        })
      ) {
        return null;
      }
      if (executionChannel === "voice") {
        return null;
      }
      if (status !== "executing" || !respond || !targetId) {
        return null;
      }

      const block = reportCanvas?.blocks.find((entry) => entry.id === targetId);
      if (!block) {
        return (
          <p className="mt-3 text-xs text-rose-600">Section not found for rejection.</p>
        );
      }

      return (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-sm">
          <p className="font-medium text-rose-900">Reject section?</p>
          <p className="mt-1 text-xs text-rose-800">{args.reason}</p>
          <p className="mt-2 text-xs text-rose-700">
            Section: <span className="font-semibold">{block.title}</span>
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
              onClick={() => {
                setSelectedCanvasBlockId(targetId);
                setReportCanvasMode("present");
                setReportSectionEditing(false);
                confirmReportReject(targetId);
                void respond({ confirmed: true, blockId: targetId });
              }}
            >
              Confirm reject
            </button>
            <button
              type="button"
              className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs text-rose-700"
              onClick={() => {
                cancelReportReject();
                void respond({ confirmed: false, blockId: targetId });
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    },
  }, [
    executionChannel,
    maybeAutoRespondInVoice,
    cancelReportReject,
    confirmReportReject,
    reportCanvas,
    selectedCanvasBlockId,
    setReportCanvasMode,
    setReportSectionEditing,
    setSelectedCanvasBlockId,
  ]);

  useHumanInTheLoop({
    name: "rewriteSelectedCanvasText",
    description:
      "Human-approved rewrite for a selected text block in the report canvas.",
    parameters: z.object({
      blockId: z.string().optional(),
      title: z.string().optional(),
      content: z.string(),
    }),
    render: ({ status, args, respond }) => {
      const targetId = args.blockId ?? selectedCanvasBlockId;
      const targetBlock = reportCanvas?.blocks.find((block) => block.id === targetId);
      if (
        maybeAutoRespondInVoice({
          key: `rewriteSelectedCanvasText:${targetId ?? "none"}`,
          status,
          respond,
          payload: { approved: false, blockId: targetId ?? null },
        })
      ) {
        return null;
      }
      if (executionChannel === "voice") {
        return null;
      }
      if (status !== "executing" || !respond || !targetId) {
        return null;
      }

      if (!targetBlock || targetBlock.type !== "text") {
        return (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            Selected block is not a text block. Choose a text block first.
          </div>
        );
      }

      return (
        <div className="mt-3 rounded-xl border border-border/50 bg-secondary/30 p-4 text-sm">
          <p className="font-medium text-foreground">Approve text rewrite?</p>
          <p className="mt-2 text-xs text-muted-foreground">Current title: {targetBlock.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Proposed title: {args.title ?? targetBlock.title}
          </p>
          <div className="mt-2 rounded-lg border border-border/40 bg-background/70 p-2 text-xs text-muted-foreground">
            {args.content}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              onClick={() => {
                setSelectedCanvasBlockId(targetId);
                updateCanvasTextBlock(targetId, {
                  title: args.title,
                  content: args.content,
                }, { source: "hitl" });
                void respond({ approved: true, blockId: targetId });
              }}
            >
              Approve
            </button>
            <button
              type="button"
              className="rounded-lg border border-border/50 px-3 py-1.5 text-xs text-muted-foreground"
              onClick={() => void respond({ approved: false, blockId: targetId })}
            >
              Deny
            </button>
          </div>
        </div>
      );
    },
  }, [
    executionChannel,
    maybeAutoRespondInVoice,
    reportCanvas,
    selectedCanvasBlockId,
    setSelectedCanvasBlockId,
    updateCanvasTextBlock,
  ]);

  useHumanInTheLoop({
    name: "suggestSelectedCanvasChartKpi",
    description:
      "Human-approved KPI suggestion for a selected chart block in the report canvas.",
    parameters: z.object({
      blockId: z.string().optional(),
      title: z.string().optional(),
      metricName: z.string(),
      value: z.number(),
      unit: z.string(),
      note: z.string().optional(),
    }),
    render: ({ status, args, respond }) => {
      const targetId = args.blockId ?? selectedCanvasBlockId;
      const targetBlock = reportCanvas?.blocks.find((block) => block.id === targetId);
      if (
        maybeAutoRespondInVoice({
          key: `suggestSelectedCanvasChartKpi:${targetId ?? "none"}`,
          status,
          respond,
          payload: { approved: false, blockId: targetId ?? null },
        })
      ) {
        return null;
      }
      if (executionChannel === "voice") {
        return null;
      }
      if (status !== "executing" || !respond || !targetId) {
        return null;
      }

      if (!targetBlock || targetBlock.type !== "chart") {
        return (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            Selected block is not a chart block. Choose a chart block first.
          </div>
        );
      }

      return (
        <div className="mt-3 rounded-xl border border-border/50 bg-secondary/30 p-4 text-sm">
          <p className="font-medium text-foreground">Approve KPI suggestion?</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {args.metricName}: {args.value}
            {args.unit}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{args.note ?? "No note"}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              onClick={() => {
                setSelectedCanvasBlockId(targetId);
                updateCanvasChartBlock(targetId, {
                  title: args.title,
                  metricName: args.metricName,
                  value: args.value,
                  unit: args.unit,
                  note: args.note,
                }, { source: "hitl" });
                void respond({ approved: true, blockId: targetId });
              }}
            >
              Approve
            </button>
            <button
              type="button"
              className="rounded-lg border border-border/50 px-3 py-1.5 text-xs text-muted-foreground"
              onClick={() => void respond({ approved: false, blockId: targetId })}
            >
              Deny
            </button>
          </div>
        </div>
      );
    },
  }, [
    executionChannel,
    maybeAutoRespondInVoice,
    reportCanvas,
    selectedCanvasBlockId,
    setSelectedCanvasBlockId,
    updateCanvasChartBlock,
  ]);

  useFrontendTool({
    name: "showRecommendationCard",
    description: "Show a recommendation card in the dynamic dashboard slot.",
    parameters: z.object({
      title: z.string(),
      priority: z.enum(["P0", "P1", "P2"]).default("P1"),
      riskLevel: z.enum(["high", "medium", "low"]).default("medium"),
      content: z.string(),
      projectId: z.string().optional(),
      projectName: z.string().optional(),
      reason: z.string().optional(),
    }),
    handler: async (args) =>
      executeShowRecommendationCard({
        args,
        projectCatalog,
        setDashboardFocus,
      }),
  }, [projectCatalog, setDashboardFocus]);

  const workspaceState = useMemo(
    () =>
      buildAIOpsWorkspaceState({
        navId: workspaceNavId,
        reportLayerOpen,
        dashboardFocus,
        selectedScope,
        workflow,
        agentPipeline,
        incidentProgress,
        isAnalyzing,
        reportCanvas,
        reportCanvasGenerating,
        reportCanvasMode,
        selectedCanvasBlockId,
        reportSectionEditing,
        reportSectionReviews,
        lastCanvasEdit,
        artifactCache,
        projectCatalog,
        portfolioHealth,
      }),
    [
      workspaceNavId,
      reportLayerOpen,
      dashboardFocus,
      selectedScope,
      workflow,
      agentPipeline,
      incidentProgress,
      isAnalyzing,
      reportCanvas,
      reportCanvasGenerating,
      reportCanvasMode,
      selectedCanvasBlockId,
      reportSectionEditing,
      reportSectionReviews,
      lastCanvasEdit,
      artifactCache,
      projectCatalog,
      portfolioHealth,
    ],
  );

  useFrontendTool({
    name: "renderAnalysisSummary",
    description:
      "Render a generative UI summary card in chat that mirrors dashboard KPIs (projects, services, incidents, anomalies, estimated cost). Call when the user asks for analisi, analysis summary, or today's overview.",
    parameters: z.object({
      reason: z.string().optional(),
    }),
    handler: async () => ({
      ok: true,
      message: "Analysis summary card rendered in chat.",
      summary: workspaceState.analysisSummary,
    }),
    render: ({ status }) => {
      if (executionChannel === "voice") {
        return null;
      }
      if (status !== "complete") {
        return (
          <p className="my-2 text-xs text-muted-foreground">
            Building analysis summary…
          </p>
        );
      }

      return (
        <AnalysisSummaryChatCard
          summary={workspaceState.analysisSummary}
          onViewReport={() => {
            setReportLayerOpen(true);
            void generateReportCanvas();
          }}
        />
      );
    },
  }, [
    executionChannel,
    workspaceState.analysisSummary,
    generateReportCanvas,
    setReportLayerOpen,
  ]);

  const sharedContext = useMemo(
    () =>
      JSON.parse(
        JSON.stringify({
          query: artifactCache.query,
          incidents: artifactCache.incidents,
          analyses: artifactCache.analyses,
          primeReport: artifactCache.primeReport,
          lastRunMeta: artifactCache.lastRunMeta,
          kpis: result?.primeReport.kpis ?? artifactCache.primeReport?.kpis ?? [],
          projectCatalog,
          projectCatalogLoading,
          portfolioHealth,
          analysisSummary: workspaceState.analysisSummary,
          selectedScope,
          dashboardFocus,
          workspaceNavId,
          reportLayerOpen,
          reportCanvas,
          reportCanvasMode,
          selectedCanvasBlockId,
          reportSectionReviews,
          reportSectionEditing,
          reportCopilotIntent,
          reportCopilotUiAction,
          reportRejectPendingBlockId,
          lastCanvasEdit,
          workflow,
          agentPipeline,
          incidentProgress,
          isAnalyzing,
          executionChannel,
        }),
      ) as JsonSerializable,
    [
      artifactCache,
      result,
      projectCatalog,
      projectCatalogLoading,
      portfolioHealth,
      workspaceState.analysisSummary,
      selectedScope,
      dashboardFocus,
      workspaceNavId,
      reportLayerOpen,
      reportCanvas,
      reportCanvasMode,
      selectedCanvasBlockId,
      reportSectionReviews,
      reportSectionEditing,
      reportCopilotIntent,
      reportCopilotUiAction,
      reportRejectPendingBlockId,
      lastCanvasEdit,
      workflow,
      agentPipeline,
      incidentProgress,
      isAnalyzing,
      executionChannel,
    ],
  );

  useAgentContext({
    description: "Current AIOps session artifact cache and dashboard viewport",
    value: sharedContext,
  });

  useAgentContext({
    description: "Structured workspace state for chat-with-your-data",
    value: workspaceState as unknown as JsonSerializable,
  });

  useAgentContext({
    description:
      "Report Agent: selected section snapshot, review state, edit/reject intents, and pending reject confirmation",
    value: {
      reportLayerOpen,
      selectedBlockId: selectedCanvasBlockId,
      sectionEditing: reportSectionEditing,
      sectionReviews: reportSectionReviews,
      lastEdit: lastCanvasEdit,
      selectedSection: reportSectionSnapshot,
      copilotIntent: reportCopilotIntent,
      latestUiAction: reportCopilotUiAction,
      rejectPendingBlockId: reportRejectPendingBlockId,
      sections: workspaceState.reportDraft.sections,
    } as unknown as JsonSerializable,
  });

  useEffect(() => {
    agent.setState({
      ...workspaceState,
      selectedCanvasBlockId,
    });
  }, [agent, workspaceState, selectedCanvasBlockId]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col" data-sidebar-chat>
      <CopilotChat
        chatView={AIOpsCopilotChatView}
        labels={{
          chatInputPlaceholder: reportLayerOpen
            ? "Ask about this report…"
            : "Ask about your data…",
          modalHeaderTitle: "AIOps Copilot",
        }}
      />
    </div>
  );
}

/** CopilotKit + optional Gemini Live voice layer (wraps workspace + chat). */
export function AIOpsCopilotRoot({ children }: PropsWithChildren) {
  const runtimeUrl = process.env.NEXT_PUBLIC_COPILOT_RUNTIME_URL ?? "/api/copilotkit";
  const apiKey = resolvePublicGeminiApiKey();

  return (
    <CopilotKit
      runtimeUrl={runtimeUrl}
      useSingleEndpoint
      debug={false}
      renderActivityMessages={ACTIVITY_RENDERERS}
    >
      {apiKey ? (
        <LiveAPIProvider apiKey={apiKey}>
          <CopilotVoiceBridge />
          {children}
        </LiveAPIProvider>
      ) : (
        children
      )}
    </CopilotKit>
  );
}

export function AIOpsCopilot() {
  return <CopilotChatSurface />;
}
