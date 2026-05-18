import { z } from "zod";

export const AIOPS_ADK_PIPELINE_ACTIVITY_TYPE = "aiops-adk-pipeline";

export const adkPipelineActivityContentSchema = z.object({
  isAnalyzing: z.boolean(),
  agentPipeline: z.array(
    z.object({
      id: z.enum(["scope", "telemetry", "analyst", "reporter"]),
      label: z.string(),
      subtitle: z.string(),
      status: z.enum(["pending", "running", "complete", "error"]),
      detail: z.string(),
      startedAt: z.string().optional(),
      completedAt: z.string().optional(),
    }),
  ),
  incidentProgress: z
    .object({
      current: z.number(),
      total: z.number(),
      incidentId: z.string(),
      service: z.string(),
    })
    .nullable()
    .optional(),
});

export type AdkPipelineActivityContent = z.infer<typeof adkPipelineActivityContentSchema>;

export const AIOPS_ADK_PIPELINE_CHAT_MESSAGE_ID = "aiops-adk-pipeline-activity";
