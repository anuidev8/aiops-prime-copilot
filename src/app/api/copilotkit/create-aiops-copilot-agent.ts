import { BuiltInAgent, defineTool } from "@copilotkit/runtime/v2";
import { z } from "zod";
import {
  createProjectOwnershipRepository,
  createRunAnalystUseCase,
  createRunReporterUseCase,
  createRunTelemetryUseCase,
} from "@/backend/infrastructure/bootstrap";
import { streamAdkCoordinatorAsAgUiEvents } from "@/backend/infrastructure/adk/copilot-adk-bridge";
import { isAdkOrchestratorAvailable } from "@/backend/infrastructure/adk/adk-model";
import { listProjectOwnership } from "@/backend/interface/http/ownership-handlers";
import { COPILOT_POST_ADK_ANALYSIS_PREFIX } from "@/shared/lib/copilot-analysis-bridge";

function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function isVertexEnabled(): boolean {
  const value = process.env.GOOGLE_GENAI_USE_VERTEXAI?.toLowerCase();
  return value === "true" || value === "1";
}

function inferProvider(model: string): "google" | "vertex" | "other" {
  if (model.startsWith("google/") || model.startsWith("google:")) {
    return "google";
  }

  if (model.startsWith("vertex/") || model.startsWith("vertex:")) {
    return "vertex";
  }

  return "other";
}

function resolveCopilotModelAndApiKey(): { model: string; apiKey?: string } {
  const requestedModel = envValue("COPILOTKIT_MODEL");
  const googleApiKey =
    envValue("GOOGLE_API_KEY") ??
    envValue("GOOGLE_GENAI_API_KEY") ??
    envValue("GEMINI_API_KEY");

  const fallbackModel = googleApiKey
    ? "google/gemini-2.5-flash"
    : isVertexEnabled()
      ? "vertex/gemini-2.5-flash"
      : "google/gemini-2.5-flash";

  const model = requestedModel ?? fallbackModel;
  const provider = inferProvider(model);

  if (provider === "google" && googleApiKey) {
    return { model, apiKey: googleApiKey };
  }

  return { model };
}

function createLegacyBuiltInAgent(): BuiltInAgent {
  const runTelemetryUseCase = createRunTelemetryUseCase();
  const runAnalystUseCase = createRunAnalystUseCase();
  const runReporterUseCase = createRunReporterUseCase();
  const projectOwnershipRepository = createProjectOwnershipRepository();

  const cacheQuerySchema = z
    .object({
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
    })
    .optional();

  const listProjectOwnershipTool = defineTool({
    name: "listProjectOwnership",
    description:
      "Lists companies and projects with owned service names (SPEC-009).",
    parameters: z.object({
      companyId: z.string().optional(),
      projectId: z.string().optional(),
    }),
    execute: async (args) => {
      const result = await listProjectOwnership(projectOwnershipRepository, {
        companyId: args.companyId,
        projectId: args.projectId,
      });
      return { ok: true, projects: result.projects };
    },
  });

  const runTelemetryAgentTool = defineTool({
    name: "runTelemetryAgent",
    description: "Runs ONLY telemetry to detect incidents.",
    parameters: z.object({
      companyId: z.string().optional(),
      projectId: z.string().optional(),
      services: z.array(z.string()).optional(),
      timeWindowMinutes: z.number().int().min(1).max(24 * 60).optional(),
    }),
    execute: async (args) =>
      runTelemetryUseCase.execute({
        companyId: args.companyId,
        projectId: args.projectId,
        services: args.services,
        timeWindowMinutes: args.timeWindowMinutes,
      }),
  });

  const runAnalystAgentTool = defineTool({
    name: "runAnalystAgent",
    description: "Runs ONLY analyst on cached incidents.",
    parameters: z.object({
      runId: z.string().optional(),
      incidentIds: z.array(z.string()).optional(),
      cacheQuery: cacheQuerySchema,
    }),
    execute: async (args) =>
      runAnalystUseCase.execute({
        runId: args.runId,
        incidentIds: args.incidentIds,
        cacheQuery: args.cacheQuery,
      }),
  });

  const runReporterAgentTool = defineTool({
    name: "runReporterAgent",
    description: "Runs ONLY PRIME reporter from cache.",
    parameters: z.object({
      runId: z.string().optional(),
      useCachedAnalysis: z.boolean().optional().default(true),
      allowEmptyReport: z.boolean().optional().default(false),
      cacheQuery: cacheQuerySchema,
    }),
    execute: async (args) =>
      runReporterUseCase.execute({
        runId: args.runId,
        useCachedAnalysis: args.useCachedAnalysis,
        allowEmptyReport: args.allowEmptyReport,
        cacheQuery: args.cacheQuery,
      }),
  });

  const analyzeLogsTool = defineTool({
    name: "analyzeLogs",
    description: "Full pipeline telemetry → analyst → reporter.",
    parameters: z.object({
      companyId: z.string().optional(),
      projectId: z.string().optional(),
      services: z.array(z.string()).optional(),
      timeWindowMinutes: z.number().int().min(1).max(24 * 60).optional(),
    }),
    execute: async (args) => {
      const telemetry = await runTelemetryUseCase.execute({
        companyId: args.companyId,
        projectId: args.projectId,
        services: args.services,
        timeWindowMinutes: args.timeWindowMinutes,
      });
      if (!telemetry.ok) return telemetry;

      const analyst = await runAnalystUseCase.execute({ runId: telemetry.runId });
      if (!analyst.ok) {
        return { ...telemetry, partialPipeline: { analystFailed: analyst.error } };
      }

      const reporter = await runReporterUseCase.execute({
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

  const { model: copilotModel, apiKey: copilotApiKey } =
    resolveCopilotModelAndApiKey();

  return new BuiltInAgent({
    model: copilotModel,
    apiKey: copilotApiKey,
    maxSteps: 8,
    tools: [
      listProjectOwnershipTool,
      runTelemetryAgentTool,
      runAnalystAgentTool,
      runReporterAgentTool,
      analyzeLogsTool,
    ],
    prompt: [
      "You are AIOps Prime Copilot (legacy CopilotKit orchestrator — Gemini unavailable for ADK).",
      `When the user message starts with "${COPILOT_POST_ADK_ANALYSIS_PREFIX}", summarize from session context only.`,
      "Prefer incremental tools: runTelemetryAgent, runAnalystAgent, runReporterAgent, or analyzeLogs for full pipeline.",
      "Do not run analyzeLogs unless the user explicitly asks for full end-to-end execution.",
      "Users can request telemetry, analyst, or reporter independently; reuse cache/runId context whenever available.",
      "Phase 1 telemetry rule: dashboard is source of truth for incidents/scope/pipeline; chat is orchestration and status only.",
      "After runTelemetryAgent, respond with compact status only (scope + incident count). Do not paste incident tables or full datasets in chat.",
      "Phase 2 analyst rule: dashboard is source of truth for analysis KPIs/charts/tables from runAnalystAgent.",
      "After runAnalystAgent, keep chat concise (confirmation + next step), and avoid pasting detailed metrics/evidence lists.",
      "Reporter rule: use a single surface (in-dashboard report layer overlay). Do not imply a separate report page.",
      "After runReporterAgent, reply with one short confirmation sentence only; do not restate report narrative blocks.",
    ].join("\n"),
  });
}

/** Chat agent: Google ADK coordinator when Gemini is configured; otherwise legacy BuiltInAgent. */
export function createAIOpsCopilotAgent(): BuiltInAgent {
  if (!isAdkOrchestratorAvailable()) {
    return createLegacyBuiltInAgent();
  }

  return new BuiltInAgent({
    type: "custom",
    factory: ({ input, abortSignal }) =>
      streamAdkCoordinatorAsAgUiEvents(input, abortSignal),
  });
}

export function describeAIOpsCopilotOrchestrator(): string {
  return isAdkOrchestratorAvailable()
    ? "google-adk-coordinator"
    : "copilotkit-builtin-fallback";
}
