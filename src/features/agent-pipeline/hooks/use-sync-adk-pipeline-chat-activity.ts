"use client";

import { useEffect, useRef } from "react";
import type { ActivityMessage } from "@ag-ui/core";
import type { AbstractAgent } from "@ag-ui/client";
import {
  AIOPS_ADK_PIPELINE_ACTIVITY_TYPE,
  AIOPS_ADK_PIPELINE_CHAT_MESSAGE_ID,
  type AdkPipelineActivityContent,
} from "@/features/agent-pipeline/model/adk-pipeline-activity";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";

function shouldShowPipeline(
  isAnalyzing: boolean,
  agentPipeline: AdkPipelineActivityContent["agentPipeline"],
): boolean {
  return (
    isAnalyzing || agentPipeline.some((step) => step.status !== "pending")
  );
}

export function useSyncAdkPipelineChatActivity(agent: AbstractAgent): void {
  const { agentPipeline, executionChannel, incidentProgress, isAnalyzing } = useAIOpsSession();
  const visibleRef = useRef(false);

  useEffect(() => {
    if (executionChannel === "voice") {
      visibleRef.current = false;
      agent.setMessages(
        agent.messages.filter((message) => message.id !== AIOPS_ADK_PIPELINE_CHAT_MESSAGE_ID),
      );
      return;
    }

    const visible = shouldShowPipeline(isAnalyzing, agentPipeline);

    if (!visible) {
      if (!visibleRef.current) {
        return;
      }

      visibleRef.current = false;
      agent.setMessages(
        agent.messages.filter((message) => message.id !== AIOPS_ADK_PIPELINE_CHAT_MESSAGE_ID),
      );
      return;
    }

    visibleRef.current = true;

    const content: AdkPipelineActivityContent = {
      isAnalyzing,
      agentPipeline,
      incidentProgress: incidentProgress ?? null,
    };

    const activityMessage = {
      id: AIOPS_ADK_PIPELINE_CHAT_MESSAGE_ID,
      role: "activity",
      activityType: AIOPS_ADK_PIPELINE_ACTIVITY_TYPE,
      content,
    } as ActivityMessage;

    const withoutPipeline = agent.messages.filter(
      (message) => message.id !== AIOPS_ADK_PIPELINE_CHAT_MESSAGE_ID,
    );

    agent.setMessages([...withoutPipeline, activityMessage]);
  }, [agent, agentPipeline, executionChannel, incidentProgress, isAnalyzing]);
}
