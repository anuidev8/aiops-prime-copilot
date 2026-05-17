import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
  defineTool,
} from "@copilotkit/runtime/v2";
import { z } from "zod";
import { createAnalyzeLogsUseCase } from "@/backend/infrastructure/bootstrap";

export const dynamic = "force-dynamic";

const analyzeLogsUseCase = createAnalyzeLogsUseCase();

const analyzeLogsTool = defineTool({
  name: "analyzeLogs",
  description:
    "Analyze observability logs, detect incidents, explain likely root causes, and produce PRIME KPIs plus narratives. Omit services to analyze all telemetry. If timeWindowMinutes is omitted, use the full available scope.",
  parameters: z.object({
    prompt: z.string().optional(),
    services: z.array(z.string()).optional(),
    timeWindowMinutes: z.number().int().min(1).max(24 * 60).optional(),
  }),
  execute: async (args) => {
    return analyzeLogsUseCase.execute(args);
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
  maxSteps: 4,
  tools: [analyzeLogsTool],
  prompt: [
    "You are AIOps Prime Copilot.",
    "When the user asks to run, start, or execute analysis (including typos like analisis) without naming specific services, immediately call analyzeLogs with an empty argument object {} to analyze all available telemetry.",
    "Never ask the user to specify services for a full-scope analysis request.",
    "Only pass services to analyzeLogs when the user explicitly names one or more services.",
    "When the user does not provide a time window, omit timeWindowMinutes so the pipeline uses full available scope.",
    "After analyzeLogs completes, summarize technical findings and business impact separately using the tool output.",
    "When session context already includes fresh incidents and KPIs, summarize that data instead of calling analyzeLogs again.",
    "When tool data includes `ui` blocks, explain what the UI should render.",
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
