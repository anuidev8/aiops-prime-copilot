"use client";

import { createContext, type FC, type ReactNode, useContext, useMemo } from "react";
import { useLiveAPI, type UseLiveAPIResults } from "@/features/voice-live/hooks/use-live-api";

const LiveAPIContext = createContext<UseLiveAPIResults | undefined>(undefined);

export type LiveAPIProviderProps = {
  children: ReactNode;
  apiKey: string;
};

export const LiveAPIProvider: FC<LiveAPIProviderProps> = ({ apiKey, children }) => {
  const stableKey = useMemo(() => apiKey.trim(), [apiKey]);
  const liveAPI = useLiveAPI(stableKey);
  return <LiveAPIContext.Provider value={liveAPI}>{children}</LiveAPIContext.Provider>;
};

export function useLiveAPIContext(): UseLiveAPIResults {
  const context = useContext(LiveAPIContext);
  if (!context) {
    throw new Error("useLiveAPIContext must be used within a LiveAPIProvider");
  }
  return context;
}
