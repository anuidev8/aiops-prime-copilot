"use client";

import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { useCallback, useRef } from "react";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import { extractMessageText } from "@/features/voice-live/lib/extract-message-text";

function visionMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `vision-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Sends a question to the ADK-backed CopilotKit agent (must run inside AIOpsCopilotRoot).
 */
export function useVisionCopilotAsk() {
  const { agent } = useAgent({ agentId: "default" });
  const { copilotkit } = useCopilotKit();
  const { setWorkflowStage } = useAIOpsSession();
  const busyRef = useRef(false);

  const askCopilot = useCallback(
    async (prompt: string): Promise<string | null> => {
      const text = prompt.trim();
      if (!text || busyRef.current || agent.isRunning) {
        return null;
      }

      busyRef.current = true;
      setWorkflowStage("collecting_scope", "copilot", "Vision HUD question…");

      const messageCountBefore = agent.messages.length;
      agent.addMessage({
        id: visionMessageId(),
        role: "user",
        content: text,
      });

      try {
        await copilotkit.runAgent({ agent });
      } catch (err) {
        console.error("Vision HUD → CopilotKit failed", err);
        return null;
      } finally {
        busyRef.current = false;
      }

      const newMessages = agent.messages.slice(messageCountBefore);
      const assistantMessage = [...newMessages]
        .reverse()
        .find((message) => message.role === "assistant");

      return assistantMessage
        ? extractMessageText(assistantMessage.content)
        : null;
    },
    [agent, copilotkit, setWorkflowStage],
  );

  return { askCopilot, agentRunning: agent.isRunning };
}
