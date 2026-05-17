export type CopilotProvider = "google" | "vertex" | "other";
export type AdkBackend = "VERTEX_AI" | "GEMINI_API";
export type AdcPrincipalType =
  | "service_account"
  | "authorized_user"
  | "external_account"
  | "unknown";

export interface AIOpsRuntimeStatus {
  checkedAt: string;
  adk: {
    backend: AdkBackend;
    model: string;
    ready: boolean;
    vertexEnabled: boolean;
    hasApiKey: boolean;
    project?: string;
    location?: string;
  };
  adc: {
    required: boolean;
    configured: boolean;
    tokenReady: boolean;
    principalType: AdcPrincipalType;
    principal?: string;
    error?: string;
  };
  copilot: {
    model: string;
    provider: CopilotProvider;
    usesApiKey: boolean;
  };
  message: string;
}
