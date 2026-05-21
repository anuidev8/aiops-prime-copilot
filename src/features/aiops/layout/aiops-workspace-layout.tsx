"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ReactNode, useState } from "react";
import { CopilotAssistantPanel } from "@/features/copilot-assistant/ui/copilot-assistant-panel";
import { OperationsOverviewDashboard } from "@/features/operations-dashboard/ui/operations-overview-dashboard";
import { IncidentDashboard } from "@/features/incident-dashboard/ui/incident-dashboard";
import { ProjectCatalog } from "@/features/project-scope/ui/project-catalog";
import { ReportCanvas } from "@/features/report-canvas/ui/report-canvas";
import { WorkspaceViewportSync } from "@/features/aiops/ui/workspace-viewport-sync";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import { AppNavId, AppSidebar } from "@/shared/ui/layout/app-sidebar";
import { AppTopBar } from "@/shared/ui/layout/app-top-bar";
import {
  WorkspaceViewMode,
} from "@/shared/ui/layout/view-mode-toggle";
import { VoiceCommandBarSlot } from "@/features/voice-live/ui/voice-command-bar-slot";

interface AIOpsWorkspaceLayoutProps {
  copilot: ReactNode;
}

const easeOut = [0.32, 0.72, 0, 1] as const;

function stageBadge(workflowStage: string): { label: string; className: string } {
  if (workflowStage === "ready") {
    return {
      label: "Ready",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }
  if (workflowStage === "error") {
    return {
      label: "Error",
      className: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }
  if (workflowStage === "idle") {
    return {
      label: "Idle",
      className: "border-slate-200 bg-slate-100 text-slate-600",
    };
  }
  return {
    label: "In progress",
    className: "border-indigo-200 bg-indigo-50 text-indigo-700",
  };
}

export function AIOpsWorkspaceLayout({ copilot }: AIOpsWorkspaceLayoutProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const [viewMode] = useState<WorkspaceViewMode>("split");
  const [navId, setNavId] = useState<AppNavId>("overview");
  const {
    workflow,
    reportLayerOpen,
    setReportLayerOpen,
    reportCanvas,
    reportCanvasGenerating,
    setReportCanvasMode,
    generateReportCanvas,
  } = useAIOpsSession();

  const effectiveViewMode: WorkspaceViewMode =
    reportLayerOpen && viewMode === "chat" ? "split" : viewMode;
  const showDashboard =
    effectiveViewMode === "dashboard" ||
    effectiveViewMode === "split" ||
    effectiveViewMode === "avatar";
  const showFullChat = effectiveViewMode === "chat";
  const showDockedCopilot = effectiveViewMode !== "chat";
  const reportFocusMode = reportLayerOpen && !showFullChat;
  const showVoiceCommandBar = !showFullChat && (navId === "overview" || reportFocusMode);
  const workflowBadge = stageBadge(workflow.stage);

  const dashboardEnter = reducedMotion
    ? {
        initial: { opacity: 1, x: 0 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 1, x: 0 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, x: -16 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -12 },
        transition: { duration: 0.35, ease: easeOut },
      };

  const chatEnter = reducedMotion
    ? {
        initial: { opacity: 1, scale: 1 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 1, scale: 1 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, scale: 0.98 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.98 },
        transition: { duration: 0.35, ease: easeOut },
      };

  const dockedEnter = reducedMotion
    ? {
        initial: { opacity: 1, width: 320 },
        animate: { opacity: 1, width: 320 },
        exit: { opacity: 1, width: 320 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, width: 0 },
        animate: { opacity: 1, width: 320 },
        exit: { opacity: 0, width: 0 },
        transition: { duration: 0.4, ease: easeOut },
      };

  function renderCenterContent() {
    if (navId === "projects") return <ProjectCatalog />;
    if (navId === "incidents") return <IncidentDashboard />;
    return <OperationsOverviewDashboard />;
  }

  function handleNavSelect(nextNavId: AppNavId) {
    if (nextNavId === "prime") {
      if (!reportLayerOpen && !reportCanvas && !reportCanvasGenerating) {
        void generateReportCanvas();
      } else {
        setReportCanvasMode("present");
        setReportLayerOpen(true);
      }
      setNavId("overview");
      return;
    }
    setNavId(nextNavId);
  }

  return (
    <div className="flex h-full min-h-0 w-full">
      <WorkspaceViewportSync navId={navId} />
      <AppSidebar activeId={reportFocusMode ? "prime" : navId} onSelect={handleNavSelect} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppTopBar reportFocusMode={reportFocusMode} />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 flex-1 gap-0 overflow-hidden">
            <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r border-slate-200 bg-white">
              <header className="shrink-0 border-b border-slate-100 px-4 py-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      {reportFocusMode ? "Report Agent" : "Analysis Agent"}
                      {reportFocusMode ? (
                        <span className="ml-3 inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 align-middle text-xs font-medium text-indigo-600">
                          Draft in progress
                        </span>
                      ) : null}
                      {!reportFocusMode ? (
                        <span
                          className={[
                            "ml-3 inline-flex rounded-full border px-2.5 py-1 align-middle text-xs font-medium",
                            workflowBadge.className,
                          ].join(" ")}
                        >
                          {workflowBadge.label}
                        </span>
                      ) : null}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                      {reportFocusMode
                        ? "AI is building your report. Review, edit and approve each section."
                        : "Deep analysis, correlation, and insights from your operational data."}
                    </p>
                    {!reportFocusMode ? (
                      <h2 className="mt-1 text-xs font-medium text-slate-400">
                        Operations workspace
                      </h2>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    {!reportFocusMode ? (
                      <>
                        <button
                          type="button"
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                          Analysis settings
                        </button>
                        <button
                          type="button"
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
                          Version history
                        </button>
                        <div className="flex overflow-hidden rounded-lg shadow-sm">
                          <button
                            type="button"
                            className="border-r border-indigo-500 bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                          >
                            Export
                          </button>
                          <button
                            type="button"
                            className="flex items-center justify-center bg-indigo-700 px-2 py-2 text-white transition-colors hover:bg-indigo-800"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                        onClick={() => setReportLayerOpen(false)}
                      >
                        Exit report mode
                      </button>
                    )}
                  </div>
                </div>

              </header>

              <div className="relative flex min-h-0 flex-1 gap-0 overflow-hidden bg-slate-50 p-4 sm:p-6">
                <div className="flex min-h-0 flex-1 flex-col gap-4">
                  <div className="min-h-0 flex-1 overflow-hidden">
                    {reportFocusMode ? (
                      <motion.div
                        className="custom-scrollbar h-full overflow-y-auto pb-3 pr-0 lg:pr-2"
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: reducedMotion ? 0 : 0.2, ease: easeOut }}
                      >
                        <ReportCanvas />
                      </motion.div>
                    ) : (
                      <AnimatePresence mode="wait" initial={false}>
                        {showDashboard && !showFullChat ? (
                          <motion.div
                            key={`analysis-main-${navId}`}
                            className="custom-scrollbar flex h-full flex-col gap-6 overflow-y-auto pb-3 pr-0 lg:pr-2"
                            {...dashboardEnter}
                          >
                            {renderCenterContent()}
                          </motion.div>
                        ) : null}

                        {showFullChat ? (
                          <motion.div
                            key="chat-full"
                            className="flex flex-1 overflow-hidden p-2 lg:p-3"
                            {...chatEnter}
                          >
                            <CopilotAssistantPanel chat={copilot} viewMode="chat" />
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    )}
                  </div>

                  {showVoiceCommandBar ? (
                    <div className="hidden shrink-0 lg:block">
                      <VoiceCommandBarSlot />
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            <AnimatePresence initial={false}>
              {showDockedCopilot && !showFullChat ? (
                <motion.aside
                  key="copilot-docked"
                  className="hidden h-full w-80 shrink-0 overflow-hidden border-l border-slate-200 bg-white lg:block"
                  {...dockedEnter}
                >
                  <CopilotAssistantPanel chat={copilot} viewMode={effectiveViewMode} />
                </motion.aside>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
