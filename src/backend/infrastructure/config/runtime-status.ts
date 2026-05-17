import { GoogleAuth } from "google-auth-library";
import { AIOpsRuntimeStatus, AdcPrincipalType, CopilotProvider } from "@/shared/types/runtime-status";
import { canUseGeminiWithCurrentEnv, getGeminiRuntimeConfig } from "./vertex-config";

const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function inferProvider(model: string): CopilotProvider {
  if (model.startsWith("google/") || model.startsWith("google:")) {
    return "google";
  }

  if (model.startsWith("vertex/") || model.startsWith("vertex:")) {
    return "vertex";
  }

  return "other";
}

function resolveCopilotConfig(): AIOpsRuntimeStatus["copilot"] {
  const requestedModel = envValue("COPILOTKIT_MODEL");
  const googleApiKey =
    envValue("GOOGLE_API_KEY") ??
    envValue("GOOGLE_GENAI_API_KEY") ??
    envValue("GEMINI_API_KEY");

  const fallbackModel = googleApiKey
    ? "google/gemini-2.5-flash"
    : "vertex/gemini-2.5-flash";

  const model = requestedModel ?? fallbackModel;
  const provider = inferProvider(model);

  return {
    model,
    provider,
    usesApiKey: provider === "google" && Boolean(googleApiKey),
  };
}

function inferPrincipalTypeFromClient(clientName: string | undefined): AdcPrincipalType {
  const normalizedName = clientName?.toLowerCase() ?? "";

  if (normalizedName.includes("external")) {
    return "external_account";
  }

  return "unknown";
}

function resolvePrincipalFromClient(
  client: unknown,
): { principal?: string; principalType: AdcPrincipalType } {
  const typed = client as {
    email?: unknown;
    credentials?: {
      client_email?: unknown;
      client_id?: unknown;
    };
    constructor?: { name?: unknown };
  };

  if (typeof typed.email === "string" && typed.email.length > 0) {
    return {
      principal: typed.email,
      principalType: "service_account",
    };
  }

  if (
    typed.credentials &&
    typeof typed.credentials.client_email === "string" &&
    typed.credentials.client_email.length > 0
  ) {
    return {
      principal: typed.credentials.client_email,
      principalType: "service_account",
    };
  }

  if (
    typed.credentials &&
    typeof typed.credentials.client_id === "string" &&
    typed.credentials.client_id.length > 0
  ) {
    return {
      principal: typed.credentials.client_id,
      principalType: "authorized_user",
    };
  }

  const principalType = inferPrincipalTypeFromClient(
    typeof typed.constructor?.name === "string"
      ? typed.constructor.name
      : undefined,
  );

  return { principalType };
}

async function checkAdc(required: boolean): Promise<AIOpsRuntimeStatus["adc"]> {
  if (!required) {
    return {
      required: false,
      configured: false,
      tokenReady: false,
      principalType: "unknown",
    };
  }

  const auth = new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] });

  try {
    const [client, credentials] = await Promise.all([
      auth.getClient(),
      auth.getCredentials(),
    ]);

    const principalFromCredentials =
      typeof credentials.client_email === "string" && credentials.client_email.length > 0
        ? credentials.client_email
        : undefined;

    const principalContext = principalFromCredentials
      ? ({
          principal: principalFromCredentials,
          principalType: "service_account",
        } as const)
      : resolvePrincipalFromClient(client);

    try {
      const accessToken = await client.getAccessToken();
      const token =
        typeof accessToken === "string"
          ? accessToken
          : accessToken?.token;

      return {
        required: true,
        configured: true,
        tokenReady: Boolean(token),
        principalType: principalContext.principalType,
        principal: principalContext.principal,
      };
    } catch (tokenError) {
      return {
        required: true,
        configured: true,
        tokenReady: false,
        principalType: principalContext.principalType,
        principal: principalContext.principal,
        error: tokenError instanceof Error ? tokenError.message : "Failed to fetch ADC token.",
      };
    }
  } catch (error) {
    return {
      required: true,
      configured: false,
      tokenReady: false,
      principalType: "unknown",
      error:
        error instanceof Error
          ? error.message
          : "ADC not configured. Run gcloud auth application-default login.",
    };
  }
}

export async function buildRuntimeStatus(): Promise<AIOpsRuntimeStatus> {
  const gemini = getGeminiRuntimeConfig();
  const adkBackend = gemini.vertexai ? "VERTEX_AI" : "GEMINI_API";
  const adkReadyByEnv = canUseGeminiWithCurrentEnv();
  const adc = await checkAdc(gemini.vertexai);

  const adkReady = gemini.vertexai
    ? adkReadyByEnv && adc.configured && adc.tokenReady
    : adkReadyByEnv;

  let message = "ADK runtime is ready.";

  if (!gemini.vertexai && !adkReadyByEnv) {
    message = "Gemini API mode is enabled but API key is missing.";
  }

  if (gemini.vertexai && (!gemini.project || !gemini.location)) {
    message = "Vertex mode is enabled but GOOGLE_CLOUD_PROJECT or GOOGLE_CLOUD_LOCATION is missing.";
  } else if (gemini.vertexai && !adc.configured) {
    message = "Vertex mode is enabled but ADC credentials are not configured.";
  } else if (gemini.vertexai && !adc.tokenReady) {
    message = "ADC exists but token retrieval failed. Check account permissions.";
  } else if (gemini.vertexai && adkReady) {
    message = "Vertex mode is active and ADC token is ready.";
  }

  return {
    checkedAt: new Date().toISOString(),
    adk: {
      backend: adkBackend,
      model: gemini.model,
      ready: adkReady,
      vertexEnabled: gemini.vertexai,
      hasApiKey: Boolean(gemini.apiKey),
      project: gemini.project,
      location: gemini.location,
    },
    adc,
    copilot: resolveCopilotConfig(),
    message,
  };
}
