export interface GeminiRuntimeConfig {
  model: string;
  apiKey?: string;
  vertexai: boolean;
  project?: string;
  location?: string;
}

function toBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return value.toLowerCase() === "true" || value === "1";
}

export function getGeminiRuntimeConfig(): GeminiRuntimeConfig {
  const model =
    process.env.GEMINI_MODEL ?? process.env.ADK_MODEL ?? "gemini-2.5-flash";

  const vertexai = toBoolean(process.env.GOOGLE_GENAI_USE_VERTEXAI);
  const apiKey =
    process.env.GOOGLE_GENAI_API_KEY ??
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_API_KEY;

  return {
    model,
    apiKey,
    vertexai,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION,
  };
}

export function canUseGeminiWithCurrentEnv(): boolean {
  const cfg = getGeminiRuntimeConfig();

  if (cfg.vertexai) {
    return Boolean(cfg.project && cfg.location);
  }

  return Boolean(cfg.apiKey);
}
