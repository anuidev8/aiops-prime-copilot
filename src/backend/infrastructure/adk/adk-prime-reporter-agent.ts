import { FunctionTool, Gemini, InMemoryRunner, LlmAgent } from "@google/adk";
import { z } from "zod";
import { PrimeReporterAgent } from "../../application/contracts/agent-ports";
import { Analysis } from "../../domain/aiops-analysis/entities/analysis";
import { TimeWindow } from "../../domain/common/value-objects/time-window";
import { Incident } from "../../domain/observability/entities/incident";
import { PrimeReport } from "../../domain/prime-reporting/entities/prime-report";
import { KpiCalculator } from "../../domain/prime-reporting/services/kpi-calculator";
import { PrimeNarrativeBuilder } from "../../domain/prime-reporting/services/prime-narrative-builder";
import { canUseGeminiWithCurrentEnv, getGeminiRuntimeConfig } from "../config/vertex-config";
import {
  collectFinalResponseText,
  extractJsonObject,
  userTextMessage,
} from "./adk-helpers";

const primeNarrativeSchema = z.object({
  narrative: z.string(),
  businessSummary: z.string(),
});

type PrimeNarrativeOutput = z.infer<typeof primeNarrativeSchema>;

export class AdkPrimeReporterAgent implements PrimeReporterAgent {
  constructor(
    private readonly kpiCalculator: KpiCalculator,
    private readonly narrativeBuilder: PrimeNarrativeBuilder,
  ) {}

  async buildPrimeReport(input: {
    incidents: Incident[];
    analyses: Analysis[];
    timeWindow: TimeWindow;
  }): Promise<PrimeReport> {
    const kpis = this.kpiCalculator.compute({
      incidents: input.incidents,
      analyses: input.analyses,
      timeWindow: input.timeWindow,
    });

    const fallbackNarrative = this.narrativeBuilder.buildNarrative(kpis);
    const fallbackBusinessSummary = this.narrativeBuilder.buildBusinessSummary(kpis);

    if (input.incidents.length === 0) {
      return new PrimeReport(
        new Date(),
        input.timeWindow,
        kpis,
        "No incidents were detected in the selected telemetry scope.",
        "No active incident pressure was observed. Continue monitoring and keep remediation automations ready.",
      );
    }

    if (!canUseGeminiWithCurrentEnv()) {
      return new PrimeReport(
        new Date(),
        input.timeWindow,
        kpis,
        fallbackNarrative,
        fallbackBusinessSummary,
      );
    }

    try {
      const primeContextTool = new FunctionTool({
        name: "get_prime_context",
        description:
          "Provides KPI context and a compact list of top incident analysis findings.",
        parameters: z.object({ requestId: z.string() }),
        execute: async () => ({
          kpis: kpis.map((kpi) => ({
            name: kpi.name,
            value: kpi.value,
            unit: kpi.unit,
            trend: kpi.trend,
            description: kpi.description,
          })),
          analyses: input.analyses.slice(0, 3).map((analysis) => ({
            incidentId: analysis.incidentId,
            hypothesis: analysis.rootCause.hypothesis,
            confidence: analysis.rootCause.confidence,
            remediation: analysis.remediationPlan.summary,
          })),
        }),
      });

      const reporterAgent = new LlmAgent({
        name: "prime_reporter_agent",
        model: this.resolveModel(),
        instruction: [
          "You are a PRIME reporting agent for both operations and business stakeholders.",
          "Call get_prime_context, then return only valid JSON:",
          '{"narrative": string, "businessSummary": string}',
          "No markdown, no code fences, no extra keys.",
        ].join("\n"),
        tools: [primeContextTool],
      });

      const runner = new InMemoryRunner({
        agent: reporterAgent,
        appName: "aiops-prime-reporter",
      });

      const userId = "copilot-user";
      const sessionId = `prime-${Date.now()}`;

      await runner.sessionService.getOrCreateSession({
        appName: "aiops-prime-reporter",
        userId,
        sessionId,
      });

      const responseText = await collectFinalResponseText(
        runner.runAsync({
          userId,
          sessionId,
          newMessage: userTextMessage(
            "Generate concise PRIME narrative and business summary from current KPIs.",
          ),
        }),
      );

      const parsed = extractJsonObject<PrimeNarrativeOutput>(responseText);
      const validated = parsed ? primeNarrativeSchema.safeParse(parsed) : null;

      if (!validated || !validated.success) {
        return new PrimeReport(
          new Date(),
          input.timeWindow,
          kpis,
          fallbackNarrative,
          fallbackBusinessSummary,
        );
      }

      return new PrimeReport(
        new Date(),
        input.timeWindow,
        kpis,
        validated.data.narrative,
        validated.data.businessSummary,
      );
    } catch {
      return new PrimeReport(
        new Date(),
        input.timeWindow,
        kpis,
        fallbackNarrative,
        fallbackBusinessSummary,
      );
    }
  }

  private resolveModel(): Gemini | string {
    const config = getGeminiRuntimeConfig();

    if (config.vertexai) {
      return new Gemini({
        model: config.model,
        vertexai: true,
        project: config.project,
        location: config.location,
      });
    }

    return new Gemini({
      model: config.model,
      apiKey: config.apiKey,
      vertexai: false,
    });
  }
}
