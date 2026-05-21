"use client";

import dynamic from "next/dynamic";
import { AIOpsCopilotRoot } from "@/features/aiops-copilot/ui/aiops-copilot";
import { VisionCopilotSessionBridge } from "@/features/vision-control/ui/vision-copilot-session-bridge";
import { AIOpsSessionProvider } from "@/processes/aiops-analysis-session/model/aiops-session-context";

const VisionControlHud = dynamic(
  () =>
    import("@/features/vision-control/ui/vision-control-hud").then(
      (mod) => mod.VisionControlHud,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950 text-sm text-zinc-400">
        Loading vision HUD…
      </div>
    ),
  },
);

export function VisionPage() {
  return (
    <AIOpsSessionProvider>
      <AIOpsCopilotRoot>
        <VisionCopilotSessionBridge />
        <VisionControlHud />
      </AIOpsCopilotRoot>
    </AIOpsSessionProvider>
  );
}
