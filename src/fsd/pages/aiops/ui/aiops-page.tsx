"use client";

import { AIOpsCopilot } from "@/features/aiops-copilot/ui/aiops-copilot";
import { AIOpsWorkspaceLayout } from "@/features/aiops/layout/aiops-workspace-layout";
import { AIOpsSessionProvider } from "@/processes/aiops-analysis-session/model/aiops-session-context";

export function AIOpsPage() {
  return (
    <AIOpsSessionProvider>
      <div className="h-full min-h-0 w-full flex flex-col">
        <AIOpsWorkspaceLayout copilot={<AIOpsCopilot />} />
      </div>
    </AIOpsSessionProvider>
  );
}
