import { Gemini } from "@google/adk";
import { canUseGeminiWithCurrentEnv, getGeminiRuntimeConfig } from "../config/vertex-config";

/** Shared Gemini model handle for all ADK LlmAgents in this app. */
export function resolveAdkGeminiModel(): Gemini | string {
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

export function isAdkOrchestratorAvailable(): boolean {
  return canUseGeminiWithCurrentEnv();
}
