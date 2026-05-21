"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveConnectConfig } from "@google/genai";
import { GenAILiveClient } from "@/features/voice-live/lib/genai-live-client";
import { AudioStreamer } from "@/features/voice-live/lib/audio-streamer";
import {
  GENAI_SDK_VERSION,
  buildVoiceLiveConnectConfig,
  resolveLiveModel,
} from "@/features/voice-live/lib/voice-live-config";
import { audioContext } from "@/features/voice-live/lib/utils";
import VolMeterWorket from "@/features/voice-live/lib/worklets/vol-meter";

export type UseLiveAPIResults = {
  client: GenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;
  model: string;
  setModel: (model: string) => void;
  connected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  volume: number;
  clearConnectionError: () => void;
};

export function useLiveAPI(apiKey: string): UseLiveAPIResults {
  const clientRef = useRef<GenAILiveClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = new GenAILiveClient({ apiKey });
  }
  const client = clientRef.current;

  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [model, setModel] = useState(resolveLiveModel);
  const [config, setConfig] = useState<LiveConnectConfig>(buildVoiceLiveConnectConfig);
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);

  const clearConnectionError = useCallback(() => setConnectionError(null), []);

  useEffect(() => {
    if (audioStreamerRef.current) {
      return;
    }
    void audioContext({ id: "audio-out" }).then((audioCtx) => {
      audioStreamerRef.current = new AudioStreamer(audioCtx);
      void audioStreamerRef.current
        .addWorklet("vumeter-out", VolMeterWorket, (ev: MessageEvent<{ volume: number }>) => {
          setVolume(ev.data.volume);
        })
        .catch((error) => {
          console.error("Failed to attach output vu meter worklet", error);
        });
    });
  }, []);

  useEffect(() => {
    const onOpen = () => {
      setConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
    };
    const onClose = (event: CloseEvent) => {
      const reason = event.reason?.trim() || "connection closed";
      console.info("[Gemini Live] closed", {
        code: event.code,
        reason,
        model,
        sdk: GENAI_SDK_VERSION,
      });
      setConnected(false);
      setIsConnecting(false);
      if (event.code !== 1000) {
        setConnectionError(`Live closed (${event.code}): ${reason}`);
      }
    };
    const onSetupComplete = () => {
      setConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
    };
    const onError = (error: ErrorEvent) => {
      const message = error.message?.trim() || "Gemini Live connection error";
      console.error("[Gemini Live] error", { message, model, sdk: GENAI_SDK_VERSION, error });
      setConnectionError(message);
      setConnected(false);
      setIsConnecting(false);
    };
    const stopAudioStreamer = () => audioStreamerRef.current?.stop();
    const onAudio = (data: ArrayBuffer) =>
      audioStreamerRef.current?.addPCM16(new Uint8Array(data));

    client
      .on("error", onError)
      .on("open", onOpen)
      .on("close", onClose)
      .on("setupcomplete", onSetupComplete)
      .on("interrupted", stopAudioStreamer)
      .on("audio", onAudio);

    return () => {
      client
        .off("error", onError)
        .off("open", onOpen)
        .off("close", onClose)
        .off("setupcomplete", onSetupComplete)
        .off("interrupted", stopAudioStreamer)
        .off("audio", onAudio);
    };
  }, [client, model]);

  useEffect(() => {
    return () => {
      client.disconnect();
    };
  }, [client]);

  const connect = useCallback(async () => {
    if (!config || Object.keys(config).length === 0) {
      setConnectionError("Voice session config is not ready yet.");
      return false;
    }

    const resolvedModel = resolveLiveModel();
    if (resolvedModel !== model) {
      setModel(resolvedModel);
    }

    setIsConnecting(true);
    setConnectionError(null);
    client.disconnect();
    setConnected(false);

    console.info("[Gemini Live] connecting", {
      model: resolvedModel,
      sdk: GENAI_SDK_VERSION,
    });

    const ok = await client.connect(resolvedModel, config);
    if (!ok) {
      setConnectionError(
        `Could not connect to Gemini Live (${resolvedModel}, SDK ${GENAI_SDK_VERSION}). Check API key and model.`,
      );
      setIsConnecting(false);
      return false;
    }

    setConnected(true);
    setIsConnecting(false);
    return true;
  }, [client, config, model]);

  const disconnect = useCallback(async () => {
    client.disconnect();
    setConnected(false);
    setIsConnecting(false);
    setConnectionError(null);
  }, [client]);

  return {
    client,
    config,
    setConfig,
    model,
    setModel,
    connected,
    isConnecting,
    connectionError,
    connect,
    disconnect,
    volume,
    clearConnectionError,
  };
}
