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
  ViewModeToggle,
  WorkspaceViewMode,
} from "@/shared/ui/layout/view-mode-toggle";
import { VoiceCommandBar } from "@/shared/ui/dashboard/voice-command-bar";

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
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>("split");
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
        initial: { opacity: 1, width: "min(420px, 38%)" },
        animate: { opacity: 1, width: "min(420px, 38%)" },
        exit: { opacity: 1, width: "min(420px, 38%)" },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, width: 0 },
        animate: { opacity: 1, width: "min(420px, 38%)" },
        exit: { opacity: 0, width: 0 },
        transition: { duration: 0.4, ease: easeOut },
      };

  function handleToggleReportLayer() {
    if (!reportLayerOpen && !reportCanvas && !reportCanvasGenerating) {
      void generateReportCanvas();
      return;
    }
    if (reportCanvasGenerating && reportLayerOpen) {
      return;
    }
    if (!reportLayerOpen) {
      setReportCanvasMode("present");
    }
    setReportLayerOpen(!reportLayerOpen);
  }

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

        <div className="grid-bg flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-5 pt-4 sm:px-6">
          <div className="flex min-h-0 flex-1 gap-0 overflow-hidden">
            <section className="glass-strong flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-border/80">
              <header className="shrink-0 border-b border-border/70 px-4 py-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                      {reportFocusMode ? "Report Agent" : "Analysis Agent"}
                      {reportFocusMode ? (
                        <span className="ml-3 inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 align-middle text-xs font-semibold text-indigo-700">
                          Draft in progress
                        </span>
                      ) : null}
                      {!reportFocusMode ? (
                        <span
                          className={[
                            "ml-3 inline-flex rounded-full border px-2.5 py-1 align-middle text-xs font-semibold",
                            workflowBadge.className,
                          ].join(" ")}
                        >
                          {workflowBadge.label}
                        </span>
                      ) : null}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {reportFocusMode
                        ? "AI is building your report. Review, edit and approve each section."
                        : "Deep analysis, correlation, and insights from your operational data."}
                    </p>
                    {!reportFocusMode ? (
                      <h2 className="mt-1 text-[11px] font-medium text-muted-foreground">
                        Operations workspace
                      </h2>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    {!reportFocusMode ? (
                      <>
                        <button
                          type="button"
                          className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-slate-50 flex items-center gap-1.5"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                          Analysis settings
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-slate-50 flex items-center gap-1.5"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
                          Version history
                        </button>
                        <div className="flex rounded-lg overflow-hidden border border-indigo-600">
                          <button
                            type="button"
                            className="bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 border-r border-indigo-700"
                          >
                            Export
                          </button>
                          <button
                            type="button"
                            className="bg-indigo-600 px-2 py-1.5 text-white transition-colors hover:bg-indigo-700 flex items-center justify-center"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground"
                        onClick={() => setReportLayerOpen(false)}
                      >
                        Exit report mode
                      </button>
                    )}
                  </div>
                </div>

              </header>

              <div className="relative flex min-h-0 flex-1 gap-0 overflow-hidden p-3 sm:p-4">
                {reportFocusMode ? (
                  <motion.div
                    className="custom-scrollbar flex-1 overflow-y-auto pb-3 pr-0 lg:pr-2"
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
                        className="custom-scrollbar flex-1 overflow-y-auto pb-3 pr-0 lg:pr-2"
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
                        className="flex flex-1 overflow-hidden p-2 lg:p-3"
                        {...chatEnter}
                      >
                        <CopilotAssistantPanel chat={copilot} viewMode="chat" />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                )}
              </div>
            </section>

            <AnimatePresence initial={false}>
              {showDockedCopilot && !showFullChat ? (
                <motion.aside
                  key="copilot-docked"
                  className="hidden h-full shrink-0 overflow-hidden pl-3 lg:block"
                  {...dockedEnter}
                >
                  <div className="h-full min-h-0 min-w-[360px] w-[min(420px,38vw)]">
                    <CopilotAssistantPanel chat={copilot} viewMode={effectiveViewMode} />
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
