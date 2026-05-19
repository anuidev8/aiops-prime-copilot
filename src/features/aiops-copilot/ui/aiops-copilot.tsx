"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CopilotChat,
  CopilotChatViewProps,
  CopilotKit,
  JsonSerializable,
  useAgent,
  useAgentContext,
  useComponent,
} from "@copilotkit/react-core/v2";
import { z } from "zod";
import { adkPipelineActivityRenderer } from "@/features/agent-pipeline/ui/adk-pipeline-chat-activity";
import { useSyncAdkPipelineChatActivity } from "@/features/agent-pipeline/hooks/use-sync-adk-pipeline-chat-activity";
import { AgentPipelineLive } from "@/features/agent-pipeline/ui/agent-pipeline-live";
import { useIncrementalAgentCopilotTools } from "@/features/aiops-copilot/ui/incremental-agent-tools";
import {
  AnalysisWorkflowStage,
  useAIOpsSession,
} from "@/processes/aiops-analysis-session/model/aiops-session-context";

function normalizeAgentState(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function AIOpsCopilotChatViewInner(props: CopilotChatViewProps) {
  // Replace the default input with our custom voice-like input if we want, or just wrap it.
  // The user wanted the UI to look exactly like the design.
  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto pb-32">
        <CopilotChat.View {...props} />
      </div>
      
      {/* Voice Input visualizer overlay at the bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl glass-strong rounded-[2rem] px-6 py-4 flex items-center gap-4 z-50 neon-ring">
        <span className="text-muted-foreground text-sm shrink-0 hidden sm:block">Listening…</span>
        
        {/* Waveform visualizer */}
        <div className="flex items-end gap-0.5 h-8 flex-1 justify-center pointer-events-none">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={`l-${i}`}
              className="w-0.5 rounded-full bg-primary/60 animate-wave"
              style={{
                height: `${20 + Math.sin(i / 2) * 40 + 30}%`,
                animationDelay: `${i * 60}ms`,
              }}
            />
          ))}

          <div className="mx-4 relative shrink-0">
             <div className="absolute inset-0 bg-primary rounded-full blur-[20px] opacity-40" />
             <button type="button" aria-label="Voice input" className="relative w-14 h-14 rounded-full bg-gradient-primary text-primary-foreground border border-primary/40 flex items-center justify-center shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.6)] hover:scale-105 transition-transform z-10">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
             </button>
          </div>
          
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={`r-${i}`}
              className="w-0.5 rounded-full bg-primary/50 animate-wave"
              style={{
                height: `${20 + Math.cos(i / 2) * 40 + 30}%`,
                animationDelay: `${(i + 14) * 60}ms`,
              }}
            />
          ))}
        </div>
        
        <span className="text-muted-foreground text-xs text-right max-w-[140px] shrink-0 hidden md:block">Ask follow-up or request actions</span>
      </div>

      {/* Since we can't easily replace the internal input without losing CopilotKit logic, 
          we hide the default input with CSS and make the voice overlay clickable to focus it? 
          Or we just style the default input to look like a subtle bar below the voice visualizer. */}
      <style dangerouslySetInnerHTML={{__html: `
        .copilotKitInput {
          opacity: 0.1 !important;
          position: absolute;
          bottom: 0;
          z-index: 100;
          width: 100%;
        }
        .copilotKitInput:focus-within {
          opacity: 1 !important;
          background: rgba(15, 23, 42, 0.95) !important;
        }
      `}} />
    </div>
  );
}

const AIOpsCopilotChatView = Object.assign(
  AIOpsCopilotChatViewInner,
  CopilotChat.View,
);

function CopilotChatSurface() {
  const {
    artifactCache,
    projectCatalog,
    projectCatalogLoading,
    selectedScope,
    result,
    workflow,
    applyResultFromCopilot,
    applyIncrementalToolResult,
    setWorkflowStage,
    agentPipeline,
    incidentProgress,
    isAnalyzing,
  } = useAIOpsSession();
  const { agent } = useAgent({ agentId: "default" });

  useSyncAdkPipelineChatActivity(agent);

  useIncrementalAgentCopilotTools({
    onApplyResult: applyResultFromCopilot,
    onApplyIncremental: applyIncrementalToolResult,
    onWorkflowUpdate: setWorkflowStage,
  });

  useComponent({
    name: "showAdkAgentPipeline",
    description: "Render the live ADK agent pipeline.",
    parameters: z.object({ headline: z.string().optional() }),
    render: () => <AgentPipelineLive isAnalyzing={isAnalyzing} pipeline={agentPipeline} />,
  });

  const sharedContext = useMemo(
    () =>
      JSON.parse(
        JSON.stringify({
          query: artifactCache.query,
          incidents: artifactCache.incidents,
          analyses: artifactCache.analyses,
          primeReport: artifactCache.primeReport,
          lastRunMeta: artifactCache.lastRunMeta,
          kpis: result?.primeReport.kpis ?? artifactCache.primeReport?.kpis ?? [],
          projectCatalog,
          projectCatalogLoading,
          selectedScope,
          workflow,
          agentPipeline,
          incidentProgress,
          isAnalyzing,
        }),
      ) as JsonSerializable,
    [
      artifactCache,
      result,
      projectCatalog,
      projectCatalogLoading,
      selectedScope,
      workflow,
      agentPipeline,
      incidentProgress,
      isAnalyzing,
    ],
  );

  useAgentContext({
    description: "Current AIOps session artifact cache",
    value: sharedContext,
  });

  useEffect(() => {
    const baseState = normalizeAgentState(agent.state);
    agent.setState({
      ...baseState,
      aiopsWorkflow: workflow,
      latestScope: result?.query ?? null,
      selectedScope,
      projectCatalog,
    });
  }, [agent, workflow, result, selectedScope, projectCatalog]);

  return (
    <div className="w-full h-full flex flex-col relative">
      <CopilotChat
        chatView={AIOpsCopilotChatView}
        labels={{ chatInputPlaceholder: 'Type a command...' }}
      />
    </div>
  );
}

const aiopsActivityRenderers = [adkPipelineActivityRenderer] as const;

export function AIOpsCopilot() {
  const runtimeUrl = process.env.NEXT_PUBLIC_COPILOT_RUNTIME_URL ?? "/api/copilotkit";

  return (
    <CopilotKit
      runtimeUrl={runtimeUrl}
      useSingleEndpoint
      debug={false}
      renderActivityMessages={[...aiopsActivityRenderers]}
    >
      <CopilotChatSurface />
    </CopilotKit>
  );
}
