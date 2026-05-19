import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
  defineTool,
} from "@copilotkit/runtime/v2";
import { z } from "zod";
import {
  createProjectOwnershipRepository,
  createRunAnalystUseCase,
  createRunReporterUseCase,
  createRunTelemetryUseCase,
} from "@/backend/infrastructure/bootstrap";
import { listProjectOwnership } from "@/backend/interface/http/ownership-handlers";
import { COPILOT_POST_ADK_ANALYSIS_PREFIX } from "@/shared/lib/copilot-analysis-bridge";

export const dynamic = "force-dynamic";

const runTelemetryUseCase = createRunTelemetryUseCase();
const runAnalystUseCase = createRunAnalystUseCase();
const runReporterUseCase = createRunReporterUseCase();
const projectOwnershipRepository = createProjectOwnershipRepository();

const listProjectOwnershipTool = defineTool({
  name: "listProjectOwnership",
  description:
    "Lists companies and projects with owned service names (SPEC-009). Use when the user asks which projects exist, what services belong to a project, or you need projectId/companyId before runTelemetryAgent.",
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

const runTelemetryAgentTool = defineTool({
  name: "runTelemetryAgent",
  description:
    "Runs ONLY the telemetry ADK agent to detect incidents and establish scope. Supports optional company/project scope hints, but keeps current incident detection logic. Does not run analyst or reporter.",
  parameters: z.object({
    companyId: z.string().optional(),
    projectId: z.string().optional(),
    services: z.array(z.string()).optional(),
    timeWindowMinutes: z.number().int().min(1).max(24 * 60).optional(),
  }),
  execute: async (args) => {
    return runTelemetryUseCase.execute({
      companyId: args.companyId,
      projectId: args.projectId,
      services: args.services,
      timeWindowMinutes: args.timeWindowMinutes,
    });
  },
});

const runAnalystAgentTool = defineTool({
  name: "runAnalystAgent",
  description:
    "Runs ONLY the analyst ADK agent on incidents already in session. Requires prior telemetry. Pass runId from lastRunMeta in session context. Optionally pass cacheQuery when rehydrating scope.",
  parameters: z.object({
    runId: z.string().optional(),
    incidentIds: z.array(z.string()).optional(),
    cacheQuery: cacheQuerySchema,
  }),
  execute: async (args) => {
    return runAnalystUseCase.execute({
      runId: args.runId,
      incidentIds: args.incidentIds,
      cacheQuery: args.cacheQuery,
    });
  },
});

const runReporterAgentTool = defineTool({
  name: "runReporterAgent",
  description:
    "Runs ONLY the PRIME reporter ADK agent using cached incidents and analyses. Does not re-run telemetry or analyst. Pass runId from lastRunMeta. Set allowEmptyReport only after user confirms via confirmRunReporter HITL.",
  parameters: z.object({
    runId: z.string().optional(),
    useCachedAnalysis: z.boolean().optional().default(true),
    allowEmptyReport: z.boolean().optional().default(false),
    cacheQuery: cacheQuerySchema,
    cacheIncidents: z.array(z.record(z.string(), z.unknown())).optional(),
    cacheAnalyses: z.array(z.record(z.string(), z.unknown())).optional(),
  }),
  execute: async (args) => {
    return runReporterUseCase.execute({
      runId: args.runId,
      useCachedAnalysis: args.useCachedAnalysis,
      allowEmptyReport: args.allowEmptyReport,
      cacheQuery: args.cacheQuery,
    });
  },
});

/** Legacy full pipeline — prefer incremental tools unless user requests full analysis. */
const analyzeLogsTool = defineTool({
  name: "analyzeLogs",
  description:
    "LEGACY: Runs the full Google ADK pipeline (telemetry → analyst → reporter) in one shot. Use ONLY when the user explicitly asks for full analysis, complete pipeline, or execute everything. For incremental steps use runTelemetryAgent, runAnalystAgent, runReporterAgent instead.",
  parameters: z.object({
    prompt: z.string().optional(),
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

    if (!telemetry.ok) {
      return telemetry;
    }

    const analyst = await runAnalystUseCase.execute({
      runId: telemetry.runId,
    });

    if (!analyst.ok) {
      return {
        ...telemetry,
        partialPipeline: { analystFailed: analyst.error },
      };
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

const { model: copilotModel, apiKey: copilotApiKey } =
  resolveCopilotModelAndApiKey();

const aiopsBuiltInAgent = new BuiltInAgent({
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
    "You are AIOps Prime Copilot — the chat orchestrator for incremental ADK agents.",
    `When the user message starts with "${COPILOT_POST_ADK_ANALYSIS_PREFIX}", do NOT call any ADK tools. Summarize from session context only.`,
    "PROJECT SCOPE (SPEC-009):",
    "- Services are organized by company → project. When the user asks which projects they have, what project is active, or names a project (e.g. Project Gem), call listProjectOwnership first.",
    "- Match user project names to catalog ids (e.g. Project Gem → project-gem). Always pass companyId and projectId to runTelemetryAgent or analyzeLogs when analyzing a specific project.",
    "- Prefer selectedScope from session context when set; otherwise resolve from listProjectOwnership.",
    "- Do not claim no project is resolved if projectCatalog or selectedScope is present in context.",
    "ROUTING (prefer incremental tools):",
    "- Telemetry / scan logs / detect incidents → runTelemetryAgent only (with project scope when applicable).",
    "- If user gives company or project identifiers, pass companyId/projectId to runTelemetryAgent or analyzeLogs.",
    "- Analyze incidents / root cause (with incidents in cache) → confirmRunAnalyst HITL first, then runAnalystAgent with runId from lastRunMeta and cacheQuery if needed.",
    "- PRIME report / KPIs from cache → confirmRunReporter HITL first, then runReporterAgent with runId and useCachedAnalysis:true.",
    "- Full pipeline / execute everything → analyzeLogs OR sequence: runTelemetryAgent → confirmRunAnalyst → runAnalystAgent → confirmRunReporter → runReporterAgent.",
    "- Summarize findings when cache has data → no tools; use session context.",
    "Always pass lastRunMeta.runId from session context when calling runAnalystAgent or runReporterAgent after telemetry.",
    "Never ask the user to specify services for a full-scope analysis request.",
    "Only pass services when the user explicitly names them.",
    "When no time window is given, omit timeWindowMinutes for full available scope.",
    "After tool success, summarize technical findings and suggest next steps (analyst, reporter, or done).",
    "When a tool returns ok:false, explain the error and suggest the suggestAction.",
  ].join("\n"),
});

const runtime = new CopilotRuntime({
  agents: {
    default: aiopsBuiltInAgent,
  },
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
});

export { handler as POST };
