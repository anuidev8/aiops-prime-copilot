import { FunctionTool } from "@google/adk";
import { z } from "zod";
import { listProjectOwnership } from "@/backend/interface/http/ownership-handlers";
import { RunAnalystUseCase } from "@/backend/application/use-cases/run-analyst-use-case";
import { RunReporterUseCase } from "@/backend/application/use-cases/run-reporter-use-case";
import { RunTelemetryUseCase } from "@/backend/application/use-cases/run-telemetry-use-case";
import { InMemoryProjectOwnershipRepository } from "../repositories/in-memory-project-ownership-repository";

const cacheQuerySchema = z.object({
  requestedCompanyId: z.string().nullable().optional(),
  requestedProjectId: z.string().nullable().optional(),
  resolvedCompanyId: z.string().nullable().optional(),
  resolvedProjectId: z.string().nullable().optional(),
  resolvedProjectName: z.string().nullable().optional(),
  resolvedServiceCount: z.number().optional(),
  requestedServices: z.array(z.string()),
  analyzedServices: z.array(z.string()),
  requestedTimeWindowMinutes: z.number().nullable(),
  resolvedTimeWindowMinutes: z.number(),
  resolvedWindowFrom: z.string(),
  resolvedWindowTo: z.string(),
});

export interface AIOpsCoordinatorToolDeps {
  runTelemetryUseCase: RunTelemetryUseCase;
  runAnalystUseCase: RunAnalystUseCase;
  runReporterUseCase: RunReporterUseCase;
  projectOwnershipRepository: InMemoryProjectOwnershipRepository;
}

function createFrontendBridgeTool<TParameters extends z.ZodObject<z.ZodRawShape>>(
  config: {
  name: string;
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

export function createAIOpsCoordinatorTools(deps: AIOpsCoordinatorToolDeps) {
  const listProjectOwnershipTool = new FunctionTool({
    name: "listProjectOwnership",
    description:
      "Lists companies and projects with owned service names (SPEC-009). Use before scoped telemetry when project/company is unknown.",
    parameters: z.object({
      companyId: z.string().optional(),
      projectId: z.string().optional(),
    }),
    execute: async (args) => {
      const result = await listProjectOwnership(deps.projectOwnershipRepository, {
        companyId: args.companyId,
        projectId: args.projectId,
      });
      return { ok: true, projects: result.projects };
    },
  });

  const runTelemetryAgentTool = new FunctionTool({
    name: "runTelemetryAgent",
    description:
      "Runs ONLY telemetry to detect incidents and establish scope. Does not run analyst or reporter.",
    parameters: z.object({
      companyId: z.string().optional(),
      projectId: z.string().optional(),
      services: z.array(z.string()).optional(),
      timeWindowMinutes: z.number().int().min(1).max(24 * 60).optional(),
    }),
    execute: async (args) =>
      deps.runTelemetryUseCase.execute({
        companyId: args.companyId,
        projectId: args.projectId,
        services: args.services,
        timeWindowMinutes: args.timeWindowMinutes,
      }),
  });

  const runAnalystAgentTool = new FunctionTool({
    name: "runAnalystAgent",
    description:
      "Runs ONLY the analyst on incidents in session. Requires prior telemetry. Pass runId from lastRunMeta.",
    parameters: z.object({
      runId: z.string().optional(),
      incidentIds: z.array(z.string()).optional(),
      cacheQuery: cacheQuerySchema.optional(),
    }),
    execute: async (args) =>
      deps.runAnalystUseCase.execute({
        runId: args.runId,
        incidentIds: args.incidentIds,
        cacheQuery: args.cacheQuery,
      }),
  });

  const runReporterAgentTool = new FunctionTool({
    name: "runReporterAgent",
    description:
      "Runs ONLY the PRIME reporter from cached incidents and analyses. Pass runId from lastRunMeta.",
    parameters: z.object({
      runId: z.string().optional(),
      useCachedAnalysis: z.boolean().optional().default(true),
      allowEmptyReport: z.boolean().optional().default(false),
      cacheQuery: cacheQuerySchema.optional(),
    }),
    execute: async (args) =>
      deps.runReporterUseCase.execute({
        runId: args.runId,
        useCachedAnalysis: args.useCachedAnalysis,
        allowEmptyReport: args.allowEmptyReport,
        cacheQuery: args.cacheQuery,
      }),
  });

  const analyzeLogsTool = new FunctionTool({
    name: "analyzeLogs",
    description:
      "Runs the full pipeline (telemetry → analyst → reporter) in one shot. Use when the user explicitly requests full analysis.",
    parameters: z.object({
      companyId: z.string().optional(),
      projectId: z.string().optional(),
      services: z.array(z.string()).optional(),
      timeWindowMinutes: z.number().int().min(1).max(24 * 60).optional(),
    }),
    execute: async (args) => {
      const telemetry = await deps.runTelemetryUseCase.execute({
        companyId: args.companyId,
        projectId: args.projectId,
        services: args.services,
        timeWindowMinutes: args.timeWindowMinutes,
      });

      if (!telemetry.ok) {
        return telemetry;
      }

      const analyst = await deps.runAnalystUseCase.execute({
        runId: telemetry.runId,
      });

      if (!analyst.ok) {
        return {
          ...telemetry,
          partialPipeline: { analystFailed: analyst.error },
        };
      }

      const reporter = await deps.runReporterUseCase.execute({
        runId: telemetry.runId,
        useCachedAnalysis: true,
      });

      if (!reporter.ok) {
        return {
          ok: true as const,
          data: {
            query: telemetry.data.query,
            incidents: telemetry.data.incidents,
            analyses: analyst.data.analyses,
            primeReport: null,
          },
          cachePatch: {
            query: telemetry.data.query,
            incidents: telemetry.data.incidents,
            analyses: analyst.data.analyses,
            primeReport: null,
          },
          ui: [...telemetry.ui, ...analyst.ui],
          runId: telemetry.runId,
          reporterError: reporter.error,
        };
      }

      return {
        ok: true as const,
        data: {
          query: telemetry.data.query,
          incidents: telemetry.data.incidents,
          analyses: analyst.data.analyses,
          primeReport: reporter.data.primeReport,
        },
        cachePatch: {
          query: telemetry.data.query,
          incidents: telemetry.data.incidents,
          analyses: analyst.data.analyses,
          primeReport: reporter.data.primeReport,
        },
        ui: [...telemetry.ui, ...analyst.ui, ...reporter.ui],
        runId: telemetry.runId,
      };
    },
  });

  const setDashboardFocusTool = createFrontendBridgeTool({
    name: "setDashboardFocus",
    description:
      "Frontend bridge tool: focus dashboard scope to overview/project/service.",
    parameters: z.object({
      scope: z.enum(["overview", "project", "service"]).optional(),
      projectId: z.string().optional(),
      projectName: z.string().optional(),
      serviceName: z.string().optional(),
      metricName: z.string().optional(),
      reason: z.string().optional(),
    }),
  });

  const openReportCanvasTool = createFrontendBridgeTool({
    name: "openReportCanvas",
    description: "Frontend bridge tool: open the report canvas overlay.",
    parameters: z.object({}),
  });

  const downloadReportPdfTool = createFrontendBridgeTool({
    name: "downloadReportPdf",
    description: "Frontend bridge tool: download report PDF from current canvas.",
    parameters: z.object({
      filename: z.string().optional(),
    }),
  });

  const selectReportSectionTool = createFrontendBridgeTool({
    name: "selectReportSection",
    description: "Frontend bridge tool: select a report section by block id or title.",
    parameters: z.object({
      blockId: z.string().optional(),
      title: z.string().optional(),
    }),
  });

  const startReportSectionEditTool = createFrontendBridgeTool({
    name: "startReportSectionEdit",
    description: "Frontend bridge tool: switch selected report section to edit mode.",
    parameters: z.object({
      blockId: z.string().optional(),
      title: z.string().optional(),
    }),
  });

  const updateReportSectionTool = createFrontendBridgeTool({
    name: "updateReportSection",
    description: "Frontend bridge tool: update fields for a selected report section.",
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
  });

  const setReportSectionReviewStatusTool = createFrontendBridgeTool({
    name: "setReportSectionReviewStatus",
    description: "Frontend bridge tool: set section review status.",
    parameters: z.object({
      blockId: z.string().optional(),
      status: z.enum(["approved", "review", "needs_review", "draft"]),
    }),
  });

  const suggestReportSectionEditsTool = createFrontendBridgeTool({
    name: "suggestReportSectionEdits",
    description:
      "Frontend bridge tool: render suggestions for editing the selected report section.",
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
  });

  const confirmRejectReportSectionTool = createFrontendBridgeTool({
    name: "confirmRejectReportSection",
    description:
      "Frontend bridge tool: request human confirmation before rejecting a report section.",
    parameters: z.object({
      blockId: z.string().optional(),
      reason: z.string(),
    }),
  });

  const rewriteSelectedCanvasTextTool = createFrontendBridgeTool({
    name: "rewriteSelectedCanvasText",
    description: "Frontend bridge tool: human-approved text rewrite proposal.",
    parameters: z.object({
      blockId: z.string().optional(),
      title: z.string().optional(),
      content: z.string(),
    }),
  });

  const suggestSelectedCanvasChartKpiTool = createFrontendBridgeTool({
    name: "suggestSelectedCanvasChartKpi",
    description: "Frontend bridge tool: human-approved chart KPI proposal.",
    parameters: z.object({
      blockId: z.string().optional(),
      title: z.string().optional(),
      metricName: z.string(),
      value: z.number(),
      unit: z.string(),
      note: z.string().optional(),
    }),
  });

  const showRecommendationCardTool = createFrontendBridgeTool({
    name: "showRecommendationCard",
    description: "Frontend bridge tool: render recommendation card on dashboard.",
    parameters: z.object({
      title: z.string(),
      priority: z.enum(["P0", "P1", "P2"]).optional(),
      riskLevel: z.enum(["high", "medium", "low"]).optional(),
      content: z.string(),
      projectId: z.string().optional(),
      projectName: z.string().optional(),
      reason: z.string().optional(),
    }),
  });

  const renderAnalysisSummaryTool = createFrontendBridgeTool({
    name: "renderAnalysisSummary",
    description: "Frontend bridge tool: render analysis summary card in chat.",
    parameters: z.object({
      reason: z.string().optional(),
    }),
  });

  return {
    listProjectOwnershipTool,
    runTelemetryAgentTool,
    runAnalystAgentTool,
    runReporterAgentTool,
    analyzeLogsTool,
    setDashboardFocusTool,
    openReportCanvasTool,
    downloadReportPdfTool,
    selectReportSectionTool,
    startReportSectionEditTool,
    updateReportSectionTool,
    setReportSectionReviewStatusTool,
    suggestReportSectionEditsTool,
    confirmRejectReportSectionTool,
    rewriteSelectedCanvasTextTool,
    suggestSelectedCanvasChartKpiTool,
    showRecommendationCardTool,
    renderAnalysisSummaryTool,
  };
}
