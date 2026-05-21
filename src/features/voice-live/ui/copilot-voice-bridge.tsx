"use client";

import { useCopilotVoiceBridgeRegistration } from "@/features/voice-live/hooks/use-copilot-voice-bridge";

/** Invisible registrar — mounts inside CopilotKit + LiveAPIProvider. */
export function CopilotVoiceBridge() {
  useCopilotVoiceBridgeRegistration();
  return null;
}
