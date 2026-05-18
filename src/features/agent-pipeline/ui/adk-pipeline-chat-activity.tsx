"use client";

import type { ActivityMessage } from "@ag-ui/core";
import type { AbstractAgent } from "@ag-ui/client";
import type { ReactActivityMessageRenderer } from "@copilotkit/react-core/v2";
import { AgentPipelineLive } from "@/features/agent-pipeline/ui/agent-pipeline-live";
import {
  AIOPS_ADK_PIPELINE_ACTIVITY_TYPE,
  adkPipelineActivityContentSchema,
  type AdkPipelineActivityContent,
} from "@/features/agent-pipeline/model/adk-pipeline-activity";

function AdkPipelineActivityView({
  content,
}: {
  content: AdkPipelineActivityContent;
  activityType: string;
  message: ActivityMessage;
  agent: AbstractAgent | undefined;
}) {
  const showPipeline =
    content.isAnalyzing ||
    content.agentPipeline.some((step) => step.status !== "pending");

  if (!showPipeline) {
    return null;
  }

  return (
    <div className="my-3 w-full max-w-full">
      <AgentPipelineLive
        compact
        pipeline={content.agentPipeline}
        incidentProgress={content.incidentProgress ?? null}
        isAnalyzing={content.isAnalyzing}
      />
    </div>
  );
}

export const adkPipelineActivityRenderer: ReactActivityMessageRenderer<AdkPipelineActivityContent> =
  {
    activityType: AIOPS_ADK_PIPELINE_ACTIVITY_TYPE,
    content: adkPipelineActivityContentSchema,
    render: AdkPipelineActivityView,
  };
