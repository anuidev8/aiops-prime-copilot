"use client";

import { useCallback } from "react";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import type { ProjectOwnershipViewModel } from "@/shared/types/aiops";

export function useVisionAnalysisBridge() {
  const {
    runAnalysis,
    isAnalyzing,
    setSelectedScope,
    setWorkflowStage,
    result,
    artifactCache,
    workflow,
    agentPipeline,
    error,
  } = useAIOpsSession();

  const analyzeProject = useCallback(
    async (project: ProjectOwnershipViewModel) => {
      setSelectedScope({
        companyId: project.companyId,
        projectId: project.id,
        projectName: project.name,
        serviceNames: project.serviceNames,
      });
      setWorkflowStage(
        "collecting_scope",
        "manual",
        `Vision HUD: analyzing ${project.name}.`,
      );

      await runAnalysis({
        companyId: project.companyId,
        projectId: project.id,
        services: project.serviceNames,
        prompt: `Analyze ${project.name} and summarize incidents, root cause, and PRIME KPIs.`,
      });
    },
    [runAnalysis, setSelectedScope, setWorkflowStage],
  );

  return {
    analyzeProject,
    isAnalyzing,
    result,
    artifactCache,
    workflow,
    agentPipeline,
    error,
  };
}
