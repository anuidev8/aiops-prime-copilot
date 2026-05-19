import { z } from "zod";

export const analyzeLogsRequestSchema = z.object({
  prompt: z.string().optional(),
  companyId: z.string().trim().min(1).optional(),
  projectId: z.string().trim().min(1).optional(),
  services: z.array(z.string()).optional(),
  timeWindowMinutes: z.number().int().min(1).max(24 * 60).optional(),
});

export type AnalyzeLogsRequestBody = z.infer<typeof analyzeLogsRequestSchema>;
