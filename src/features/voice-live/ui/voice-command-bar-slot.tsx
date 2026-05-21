"use client";

import { resolvePublicGeminiApiKey } from "@/features/voice-live/lib/voice-live-config";
import { VoiceLiveCommandBar } from "@/features/voice-live/ui/voice-live-command-bar";
import { VoiceCommandBar } from "@/shared/ui/dashboard/voice-command-bar";

export function VoiceCommandBarSlot() {
  const apiKey = resolvePublicGeminiApiKey();
  if (!apiKey) {
    return <VoiceCommandBar />;
  }
  return <VoiceLiveCommandBar />;
}
