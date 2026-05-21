"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveAPIContext } from "@/features/voice-live/context/live-api-context";
import { AudioRecorder } from "@/features/voice-live/lib/audio-recorder";
import { resolvePublicGeminiApiKey } from "@/features/voice-live/lib/voice-live-config";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";

function statusLabelFor(
  apiKey: string | undefined,
  voiceSessionStatus: string,
  isConnecting: boolean,
  connectionError: string | null,
  voiceCopilotReady: boolean,
): string {
  if (!apiKey) {
    return "Set NEXT_PUBLIC_GOOGLE_API_KEY for voice";
  }
  if (connectionError) {
    return connectionError;
  }
  if (isConnecting) {
    return "Connecting to Gemini Live…";
  }
  if (voiceSessionStatus === "thinking") {
    return "Processing your voice question…";
  }
  if (voiceSessionStatus === "speaking") {
    return "Speaking response…";
  }
  if (voiceSessionStatus === "connected") {
    return voiceCopilotReady
      ? "Listening — ask about current dashboard data"
      : "Connected — preparing dashboard context…";
  }
  return "Tap mic to start voice";
}

export function VoiceLiveCommandBar() {
  const apiKey = resolvePublicGeminiApiKey();
  const {
    client,
    connected,
    isConnecting,
    connectionError,
    connect,
    disconnect,
    volume,
    clearConnectionError,
  } = useLiveAPIContext();
  const { voiceSessionStatus, voiceCopilotReady } = useAIOpsSession();
  const [muted, setMuted] = useState(false);
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());

  const statusLabel = statusLabelFor(
    apiKey,
    voiceSessionStatus,
    isConnecting,
    connectionError,
    voiceCopilotReady,
  );

  const waveScale = useMemo(() => {
    const level = Math.max(inVolume, connected ? volume * 0.85 : 0);
    return 0.35 + Math.min(1, level * 4);
  }, [connected, inVolume, volume]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };

    if (connected && !muted && voiceCopilotReady) {
      void audioRecorder.on("data", onData).on("volume", setInVolume).start();
    } else {
      audioRecorder.stop();
    }

    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [audioRecorder, client, connected, muted, voiceCopilotReady]);

  async function toggleSession() {
    if (!apiKey) {
      return;
    }

    clearConnectionError();

    if (connected || isConnecting) {
      audioRecorder.stop();
      setMuted(false);
      await disconnect();
      return;
    }

    const ok = await connect();
    if (!ok) {
      audioRecorder.stop();
    }
  }

  const busy = voiceSessionStatus === "thinking" || voiceSessionStatus === "speaking";
  const micDisabled = !apiKey || busy;

  return (
    <div className="flex items-center gap-4 rounded-[2rem] border border-border bg-white/92 px-6 py-4 shadow-[0_16px_36px_-28px_hsl(225_30%_30%/0.55)]">
      <span
        className={[
          "hidden min-w-0 flex-1 truncate text-sm sm:block",
          connectionError ? "text-rose-600" : "text-muted-foreground",
        ].join(" ")}
        title={statusLabel}
      >
        {statusLabel}
      </span>
      <div className="flex h-8 flex-1 items-end justify-center gap-0.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={`l-${i}`}
            className="animate-wave w-0.5 rounded-full bg-primary/45"
            style={{
              height: `${(20 + Math.sin(i / 2) * 40 + 30) * (connected ? waveScale : 0.55)}%`,
              animationDelay: `${i * 60}ms`,
            }}
          />
        ))}
        <button
          type="button"
          aria-label={connected ? "Stop voice session" : "Start voice session"}
          aria-pressed={connected}
          disabled={micDisabled && !connected && !isConnecting}
          onClick={() => void toggleSession()}
          className={[
            "relative mx-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-primary-foreground shadow-[0_14px_32px_-14px_hsl(var(--primary)/0.8)] transition-transform",
            connected || isConnecting
              ? "bg-rose-500 hover:bg-rose-600"
              : "bg-gradient-primary hover:scale-[1.02]",
            micDisabled && !connected && !isConnecting ? "cursor-not-allowed opacity-50" : "",
          ].join(" ")}
        >
          {connected || isConnecting ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <rect x="7" y="7" width="10" height="10" rx="1" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
          )}
        </button>
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={`r-${i}`}
            className="animate-wave w-0.5 rounded-full bg-primary/38"
            style={{
              height: `${(20 + Math.cos(i / 2) * 40 + 30) * (connected ? waveScale : 0.55)}%`,
              animationDelay: `${(i + 12) * 60}ms`,
            }}
          />
        ))}
      </div>
      {connected ? (
        <button
          type="button"
          className="hidden shrink-0 text-xs font-medium text-slate-500 hover:text-slate-800 sm:block"
          onClick={() => setMuted((value) => !value)}
          disabled={!voiceCopilotReady}
        >
          {muted ? "Unmute" : "Mute"}
        </button>
      ) : null}
    </div>
  );
}
