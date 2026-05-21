"use client";

import { useAgent } from "@copilotkit/react-core/v2";
import { useSyncAdkPipelineChatActivity } from "@/features/agent-pipeline/hooks/use-sync-adk-pipeline-chat-activity";
import { useIncrementalAgentCopilotTools } from "@/features/aiops-copilot/ui/incremental-agent-tools";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";

/**
 * Registers CopilotKit ↔ session sync on the vision page (no chat UI).
 */
export function VisionCopilotSessionBridge() {
  const { agent } = useAgent({ agentId: "default" });
  const {
    applyResultFromCopilot,
    applyIncrementalToolResult,
    setWorkflowStage,
  } = useAIOpsSession();

  useSyncAdkPipelineChatActivity(agent);

  useIncrementalAgentCopilotTools({
    onApplyResult: applyResultFromCopilot,
    onApplyIncremental: applyIncrementalToolResult,
    onWorkflowUpdate: setWorkflowStage,
  });

  return null;
}
