import {
  type LiveConnectConfig,
  MediaResolution,
  Modality,
} from "@google/genai";

/**
 * Official Google Live sample (ai.google.dev / AI Studio export).
 * Matches @google/genai 1.52.0:
 *   model: models/gemini-3.1-flash-live-preview
 *   ai.live.connect({ model, callbacks, config })
 *   session.sendClientContent({ turns: ["..."] })
 */
export const GENAI_SDK_VERSION = "1.52.0";

export const OFFICIAL_LIVE_MODEL = "models/gemini-3.1-flash-live-preview";

export const VOICE_TRANSCRIPT_MESSAGE_ID_PREFIX = "voice-";

const RETIRED_LIVE_MODEL_MARKERS = [
  "gemini-2.0-flash-exp",
  "gemini-live-2.5-flash-preview",
  "gemini-2.0-flash-live-001",
  "gemini-2.5-flash-native-audio",
];

export function resolveLiveModel(): string {
  const fromEnv = process.env.NEXT_PUBLIC_GEMINI_LIVE_MODEL?.trim();
  const raw = fromEnv
    ? fromEnv.startsWith("models/")
      ? fromEnv
      : `models/${fromEnv}`
    : OFFICIAL_LIVE_MODEL;

  if (RETIRED_LIVE_MODEL_MARKERS.some((marker) => raw.includes(marker))) {
    console.warn(
      `[Gemini Live] Model "${raw}" is not supported. Using official ${OFFICIAL_LIVE_MODEL} (SDK ${GENAI_SDK_VERSION}).`,
    );
    return OFFICIAL_LIVE_MODEL;
  }
  return raw;
}

export function resolvePublicGeminiApiKey(): string | undefined {
  const key =
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY ??
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ??
    process.env.GEMINI_API_KEY;
  return key?.trim() || undefined;
}

/** Exact fields from the official Google Live TypeScript sample. */
export function buildOfficialGoogleLiveConfig(): LiveConnectConfig {
  return {
    responseModalities: [Modality.AUDIO],
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: "Zephyr",
        },
      },
    },
    contextWindowCompression: {
      triggerTokens: "104857",
      slidingWindow: { targetTokens: "52428" },
    },
  };
}

/**
 * Official config + read-only voice assistant mode for MVP demos.
 * `inputAudioTranscription` is enabled for optional local navigation commands.
 */
export function buildVoiceLiveConnectConfig(options?: {
  contextSnapshot?: string;
}): LiveConnectConfig {
  const contextSnapshot =
    options?.contextSnapshot?.trim() && options.contextSnapshot.trim().length > 0
      ? options.contextSnapshot.trim()
      : "No dashboard context is available yet.";

  return {
    ...buildOfficialGoogleLiveConfig(),
    inputAudioTranscription: {},
    systemInstruction: {
      parts: [
        {
          text: `You are the voice read-only assistant for AIOps Prime demo.

Rules:
- Do NOT trigger tools or actions.
- Do NOT claim to run telemetry, analyst, or reporter.
- Answer only from the Dashboard Context below.
- If user asks to navigate views, acknowledge navigation briefly; the app handles navigation locally.
- If data is missing, say exactly: "I don't have that data in the current dashboard context."
- Keep answers concise and factual.

Dashboard Context:
${contextSnapshot}`,
        },
      ],
    },
  };
}
