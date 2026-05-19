"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useState } from "react";
import { CopilotAssistantPanel } from "@/features/copilot-assistant/ui/copilot-assistant-panel";
import { OperationsOverviewDashboard } from "@/features/operations-dashboard/ui/operations-overview-dashboard";
import { IncidentDashboard } from "@/features/incident-dashboard/ui/incident-dashboard";
import { PrimeReportViewer } from "@/features/prime-report-viewer/ui/prime-report-viewer";
import { ProjectCatalog } from "@/features/project-scope/ui/project-catalog";
import { AgentPipelineLive } from "@/features/agent-pipeline/ui/agent-pipeline-live";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import { AppNavId, AppSidebar } from "@/shared/ui/layout/app-sidebar";
import { AppTopBar } from "@/shared/ui/layout/app-top-bar";
import {
  ViewModeToggle,
  WorkspaceViewMode,
} from "@/shared/ui/layout/view-mode-toggle";
import { VoiceCommandBar } from "@/shared/ui/dashboard/voice-command-bar";

interface AIOpsWorkspaceLayoutProps {
  copilot: ReactNode;
}

const easeOut = [0.32, 0.72, 0, 1] as const;

const dashboardEnter = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
  transition: { duration: 0.35, ease: easeOut },
};

const chatEnter = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: 0.35, ease: easeOut },
};

const dockedEnter = {
  initial: { opacity: 0, width: 0 },
  animate: { opacity: 1, width: "min(420px, 38%)" },
  exit: { opacity: 0, width: 0 },
  transition: { duration: 0.4, ease: easeOut },
};

export function AIOpsWorkspaceLayout({ copilot }: AIOpsWorkspaceLayoutProps) {
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>("split");
  const [navId, setNavId] = useState<AppNavId>("overview");
  const { isAnalyzing, agentPipeline } = useAIOpsSession();

  const showDashboard =
    viewMode === "dashboard" || viewMode === "split" || viewMode === "avatar";
  const showFullChat = viewMode === "chat";
  const showDockedCopilot = viewMode !== "chat";

  function renderCenterContent() {
    if (navId === "projects") return <ProjectCatalog />;
    if (navId === "prime") return <PrimeReportViewer />;
    if (navId === "incidents") return <IncidentDashboard />;
    return <OperationsOverviewDashboard />;
  }

  return (
    <div className="flex h-full min-h-0 w-full">
      <AppSidebar activeId={navId} onSelect={setNavId} />

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <AppTopBar />

        <div className="flex-1 min-h-0 flex flex-col px-4 sm:px-6 pt-4 pb-6 grid-bg overflow-hidden">
          <div className="flex items-center justify-between gap-4 mb-4 shrink-0 flex-wrap">
            <h1 className="font-display text-xl font-semibold tracking-tight">
              Operations{" "}
              <span className="text-muted-foreground font-normal">workspace</span>
            </h1>
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
          </div>

          <div className="mb-4 shrink-0">
            <AgentPipelineLive isAnalyzing={isAnalyzing} pipeline={agentPipeline} />
          </div>

          <div className="flex-1 min-h-0 flex gap-0 relative overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {showDashboard && !showFullChat ? (
                <motion.div
                  key={`main-${navId}`}
                  className="flex-1 min-w-0 overflow-y-auto custom-scrollbar pr-0 lg:pr-4 pb-4"
                  {...dashboardEnter}
                >
                  {renderCenterContent()}
                  {navId === "overview" ? (
                    <div className="mt-6 hidden lg:block">
                      <VoiceCommandBar />
                    </div>
                  ) : null}
                </motion.div>
              ) : null}

              {showFullChat ? (
                <motion.div
                  key="chat-full"
                  className="flex-1 min-w-0 p-2 lg:p-4 overflow-hidden"
                  {...chatEnter}
                >
                  <CopilotAssistantPanel chat={copilot} viewMode="chat" />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {showDockedCopilot && !showFullChat ? (
                <motion.aside
                  key="copilot-docked"
                  className="hidden lg:block shrink-0 overflow-hidden pl-2 pb-4 min-h-0"
                  {...dockedEnter}
                >
                  <div className="h-full min-w-[360px] w-[min(420px,38vw)]">
                    <CopilotAssistantPanel chat={copilot} viewMode={viewMode} />
                  </div>
                </motion.aside>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
