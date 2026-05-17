import { FunctionTool, InMemoryRunner, LlmAgent, Gemini } from "@google/adk";
import { z } from "zod";
import { Analysis } from "../../domain/aiops-analysis/entities/analysis";
import { RemediationPlan } from "../../domain/aiops-analysis/entities/remediation-plan";
import { RootCause } from "../../domain/aiops-analysis/entities/root-cause";
import { Incident } from "../../domain/observability/entities/incident";
import { RootCauseAnalyzer } from "../../domain/aiops-analysis/services/root-cause-analyzer";
import { RemediationPlanner } from "../../domain/aiops-analysis/services/remediation-planner";
import { AIOpsAnalystAgent } from "../../application/contracts/agent-ports";
import { canUseGeminiWithCurrentEnv, getGeminiRuntimeConfig } from "../config/vertex-config";
import {
  collectFinalResponseText,
  extractJsonObject,
  userTextMessage,
} from "./adk-helpers";

const analystOutputSchema = z.object({
  summary: z.string(),
  rootCause: z.object({
    hypothesis: z.string(),
    evidence: z.array(z.string()),
    confidence: z.number(),
  }),
  remediationPlan: z.object({
    summary: z.string(),
    steps: z.array(z.string()),
    automationCandidate: z.boolean(),
    estimatedMinutes: z.number(),
  }),
});

type AnalystOutput = z.infer<typeof analystOutputSchema>;

export class AdkAIOpsAnalystAgent implements AIOpsAnalystAgent {
  constructor(
    private readonly rootCauseAnalyzer: RootCauseAnalyzer,
    private readonly remediationPlanner: RemediationPlanner,
  ) {}

  async analyzeIncidents(input: { incidents: Incident[] }): Promise<Analysis[]> {
    const analyses: Analysis[] = [];

    for (const incident of input.incidents) {
      analyses.push(await this.analyzeSingleIncident(incident));
    }

    return analyses;
  }

  private async analyzeSingleIncident(incident: Incident): Promise<Analysis> {
    const deterministic = this.fallbackAnalysis(incident);

    if (!canUseGeminiWithCurrentEnv()) {
      return deterministic;
    }

    try {
      const incidentContextTool = new FunctionTool({
        name: "get_incident_context",
        description: "Returns incident details and representative logs.",
        parameters: z.object({
          incidentId: z
            .string()
            .describe("The incident identifier returned in telemetry output."),
        }),
        execute: async ({ incidentId }) => {
          if (incidentId !== incident.id) {
            return { error: "Incident not found" };
          }

          return {
            incidentId: incident.id,
            service: incident.service.value(),
            severity: incident.severity.value(),
            startedAt: incident.startedAt.toISOString(),
            endedAt: incident.endedAt.toISOString(),
            durationMinutes: incident.durationMinutes(),
            logs: incident.logs.slice(0, 8).map((log) => ({
              timestamp: log.timestamp.toISOString(),
              severity: log.severity.value(),
              message: log.message,
              attributes: log.attributes,
            })),
          };
        },
      });

      const analystAgent = new LlmAgent({
        name: "aiops_analyst_agent",
        model: this.resolveModel(),
        instruction: [
          "You are an AIOps incident analyst.",
          "Always call get_incident_context before answering.",
          "Return a single JSON object with this shape:",
          "{\"summary\": string, \"rootCause\": {\"hypothesis\": string, \"evidence\": string[], \"confidence\": number}, \"remediationPlan\": {\"summary\": string, \"steps\": string[], \"automationCandidate\": boolean, \"estimatedMinutes\": number}}",
          "Confidence must be from 0 to 1.",
          "No markdown, no code fences, no extra text.",
        ].join("\n"),
        tools: [incidentContextTool],
      });

      const runner = new InMemoryRunner({
        agent: analystAgent,
        appName: "aiops-prime-analyst",
      });

      const userId = "copilot-user";
      const sessionId = `analysis-${incident.id}`;

      await runner.sessionService.getOrCreateSession({
        appName: "aiops-prime-analyst",
        userId,
        sessionId,
      });

      const prompt = [
        `Analyze incident ${incident.id}.`,
        "Use the incident context tool and return only valid JSON matching the required schema.",
      ].join(" ");

      const responseText = await collectFinalResponseText(
        runner.runAsync({
          userId,
          sessionId,
          newMessage: userTextMessage(prompt),
        }),
      );

      const parsed = extractJsonObject<AnalystOutput>(responseText);

      if (!parsed) {
        return deterministic;
      }

      const validated = analystOutputSchema.safeParse(parsed);

      if (!validated.success) {
        return deterministic;
      }

      const confidence = Math.max(0, Math.min(validated.data.rootCause.confidence, 1));

      return new Analysis(
        incident.id,
        new RootCause(
          validated.data.rootCause.hypothesis,
          validated.data.rootCause.evidence,
          confidence,
        ),
        new RemediationPlan(
          validated.data.remediationPlan.summary,
          validated.data.remediationPlan.steps,
          validated.data.remediationPlan.automationCandidate,
          Math.max(1, validated.data.remediationPlan.estimatedMinutes),
        ),
        validated.data.summary,
      );
    } catch {
      return deterministic;
    }
  }

  private fallbackAnalysis(incident: Incident): Analysis {
    const rootCause = this.rootCauseAnalyzer.inferFromLogs(incident);
    const remediation = this.remediationPlanner.build(incident, rootCause);

    return new Analysis(
      incident.id,
      rootCause,
      remediation,
      `Incident ${incident.id} on ${incident.service.value()} appears linked to ${rootCause.hypothesis.toLowerCase()}`,
    );
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
