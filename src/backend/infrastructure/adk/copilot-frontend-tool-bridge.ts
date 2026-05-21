import { FunctionTool } from "@google/adk";
import { z } from "zod";

/** Tool names registered via `useFrontendTool` in CopilotKit (browser execution). */
export const COPILOT_FRONTEND_TOOL_NAMES = [
  "setDashboardFocus",
  "openReportCanvas",
  "downloadReportPdf",
  "selectReportSection",
  "startReportSectionEdit",
  "updateReportSection",
  "setReportSectionReviewStatus",
  "suggestReportSectionEdits",
  "confirmRejectReportSection",
  "rewriteSelectedCanvasText",
  "suggestSelectedCanvasChartKpi",
  "showRecommendationCard",
  "renderAnalysisSummary",
] as const;

export type CopilotFrontendToolName = (typeof COPILOT_FRONTEND_TOOL_NAMES)[number];

function createFrontendPassthroughTool<TParameters extends z.ZodObject<z.ZodRawShape>>(
  config: {
    name: CopilotFrontendToolName;
    description: string;
    parameters: TParameters;
  },
) {
  return new FunctionTool<TParameters>({
    name: config.name,
    description: config.description,
    parameters: config.parameters,
    execute: async (args) => ({
      ok: true,
      forwarded: true,
      tool: config.name,
      args,
    }),
  });
}

/**
 * Passthrough ADK tools for CopilotKit frontend handlers.
 * Not attached to the slim coordinator used by `adk web` — only the copilot bridge profile.
 */
export function createCopilotFrontendPassthroughTools() {
  return [
    createFrontendPassthroughTool({
      name: "setDashboardFocus",
      description:
        "Update the in-place dashboard focus to overview, project, or service without changing sidebar navigation.",
      parameters: z.object({
        scope: z.enum(["overview", "project", "service"]).optional(),
        projectId: z.string().optional(),
        projectName: z.string().optional(),
        serviceName: z.string().optional(),
        metricName: z.string().optional(),
        reason: z.string().optional(),
      }),
    }),
    createFrontendPassthroughTool({
      name: "openReportCanvas",
      description:
        "Open the in-dashboard report layer with structured PRIME sections. Call after runReporterAgent instead of pasting the full report in chat.",
      parameters: z.object({}),
    }),
    createFrontendPassthroughTool({
      name: "downloadReportPdf",
      description: "Download the current report canvas as PDF.",
      parameters: z.object({
        filename: z.string().optional(),
      }),
    }),
    createFrontendPassthroughTool({
      name: "selectReportSection",
      description: "Select a report section by block id or title.",
      parameters: z.object({
        blockId: z.string().optional(),
        title: z.string().optional(),
      }),
    }),
    createFrontendPassthroughTool({
      name: "startReportSectionEdit",
      description: "Switch the selected report section to edit mode.",
      parameters: z.object({
        blockId: z.string().optional(),
        title: z.string().optional(),
      }),
    }),
    createFrontendPassthroughTool({
      name: "updateReportSection",
      description: "Update fields for a selected report section.",
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
    }),
    createFrontendPassthroughTool({
      name: "setReportSectionReviewStatus",
      description: "Set section review status.",
      parameters: z.object({
        blockId: z.string().optional(),
        status: z.enum(["approved", "review", "needs_review", "draft"]),
      }),
    }),
    createFrontendPassthroughTool({
      name: "suggestReportSectionEdits",
      description:
        "Render 2–3 edit suggestions for the selected report section in chat (user can apply one).",
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
    }),
    createFrontendPassthroughTool({
      name: "confirmRejectReportSection",
      description:
        "Request human confirmation before rejecting a report section (HITL in browser).",
      parameters: z.object({
        blockId: z.string().optional(),
        reason: z.string(),
      }),
    }),
    createFrontendPassthroughTool({
      name: "rewriteSelectedCanvasText",
      description: "Propose a human-approved text rewrite for the selected canvas block.",
      parameters: z.object({
        blockId: z.string().optional(),
        title: z.string().optional(),
        content: z.string(),
      }),
    }),
    createFrontendPassthroughTool({
      name: "suggestSelectedCanvasChartKpi",
      description: "Propose a human-approved chart KPI update for the selected canvas block.",
      parameters: z.object({
        blockId: z.string().optional(),
        title: z.string().optional(),
        metricName: z.string(),
        value: z.number(),
        unit: z.string(),
        note: z.string().optional(),
      }),
    }),
    createFrontendPassthroughTool({
      name: "showRecommendationCard",
      description: "Show an actionable recommendation card on the dashboard.",
      parameters: z.object({
        title: z.string(),
        priority: z.enum(["P0", "P1", "P2"]).optional(),
        riskLevel: z.enum(["high", "medium", "low"]).optional(),
        content: z.string(),
        projectId: z.string().optional(),
        projectName: z.string().optional(),
        reason: z.string().optional(),
      }),
    }),
    createFrontendPassthroughTool({
      name: "renderAnalysisSummary",
      description:
        "Render the analysis summary card in chat synced with dashboard KPIs.",
      parameters: z.object({
        reason: z.string().optional(),
      }),
    }),
  ];
}
