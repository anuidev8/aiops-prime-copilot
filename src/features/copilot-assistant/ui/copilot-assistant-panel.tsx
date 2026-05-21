"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useMemo, useState } from "react";
import { CopilotAvatarView } from "@/features/copilot-assistant/ui/copilot-avatar-view";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import { buildAnalysisWorkspaceSummary } from "@/shared/lib/build-analysis-workspace-summary";
import { WorkspaceViewMode } from "@/shared/ui/layout/view-mode-toggle";

type CopilotTab = "chat" | "avatar";

interface CopilotAssistantPanelProps {
  chat: ReactNode;
  viewMode?: WorkspaceViewMode;
}

const easeOut = [0.32, 0.72, 0, 1] as const;
const pillTransition = { type: "spring" as const, stiffness: 420, damping: 34 };

const TAB_LABELS: Record<CopilotTab, string> = {
  chat: "Chat",
  avatar: "Avatar",
};

function StepIcon({ status }: { status: "pending" | "running" | "complete" }) {
  if (status === "complete") {
    return (
      <div className="text-green-500">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }
  if (status === "running") {
    return (
      <div
        className="h-3.5 w-3.5 rounded-full border-2 border-indigo-600 border-r-transparent animate-spin"
        aria-hidden
      />
    );
  }
  return <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-200" aria-hidden />;
}

export function CopilotAssistantPanel({ chat, viewMode }: CopilotAssistantPanelProps) {
  const [tab, setTab] = useState<CopilotTab>("chat");
  const activeTab: CopilotTab = viewMode === "avatar" ? "avatar" : tab;
  const {
    result,
    artifactCache,
    projectCatalog,
    portfolioHealth,
    selectedScope,
    agentPipeline,
    incidentProgress,
    workflow,
    isAnalyzing,
  } = useAIOpsSession();

  const summary = useMemo(
    () =>
      buildAnalysisWorkspaceSummary({
        projectCatalog,
        portfolioHealth,
        incidents: result?.incidents ?? artifactCache.incidents,
        analyses: result?.analyses ?? artifactCache.analyses,
        primeReport: result?.primeReport ?? artifactCache.primeReport ?? null,
        selectedProjectId: selectedScope?.projectId ?? null,
        resolvedServiceCount:
          result?.query.resolvedServiceCount ??
          artifactCache.query?.resolvedServiceCount ??
          null,
        workflowStage: workflow.stage,
        agentPipeline,
        isAnalyzing,
      }),
    [
      projectCatalog,
      portfolioHealth,
      result,
      artifactCache,
      selectedScope?.projectId,
      workflow.stage,
      agentPipeline,
      isAnalyzing,
    ],
  );

  const pipelineRunning = agentPipeline.some((step) => step.status === "running");

  return (
    <div className="flex h-full min-h-0 max-h-full flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <div className="flex h-8 items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Data Assistant</p>
          <button
            type="button"
            aria-label="Close panel"
            className="text-slate-400 transition-colors hover:text-slate-600"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="relative mt-3 flex w-full rounded-full border border-slate-200 bg-slate-50 p-1">
          {(["chat", "avatar"] as const).map((id) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={[
                  "relative z-10 flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  active ? "text-white" : "text-slate-600 hover:text-slate-900",
                ].join(" ")}
              >
                {active ? (
                  <motion.span
                    layoutId="copilot-tab-pill"
                    className="absolute inset-0 rounded-full bg-indigo-600"
                    transition={pillTransition}
                  />
                ) : null}
                <span className="relative">{TAB_LABELS[id]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        {activeTab === "chat" ? (
          <>
            <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key="chat"
                  className="flex h-full min-h-0 flex-col"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.24, ease: easeOut }}
                >
                  {chat}
                </motion.div>
              </AnimatePresence>
            </div>

            <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-900">Analysis Agent</h4>
                <div
                  className={[
                    "h-2 w-2 rounded-full",
                    pipelineRunning ? "animate-pulse bg-indigo-500" : "bg-green-500",
                  ].join(" ")}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span className="truncate pr-2">{summary.pipelinePhaseLabel}</span>
                  <span className="shrink-0">{summary.pipelineProgressPercent}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${summary.pipelineProgressPercent}%` }}
                  />
                </div>
              </div>

              {incidentProgress ? (
                <p className="text-[11px] text-slate-500">
                  Incident {incidentProgress.current} of {incidentProgress.total}:{" "}
                  {incidentProgress.service}
                </p>
              ) : null}

              <div className="mt-1 flex flex-col gap-2.5">
                <h5 className="text-xs font-semibold text-slate-900">Current steps</h5>
                <ul className="flex flex-col gap-2 text-xs text-slate-600">
                  {summary.telemetrySubSteps.map((step) => (
                    <li
                      key={step.id}
                      className={[
                        "flex items-center gap-2",
                        step.status === "running" ? "font-medium text-slate-900" : "",
                        step.status === "pending" ? "text-slate-400" : "",
                      ].join(" ")}
                    >
                      <StepIcon status={step.status} />
                      <span>{step.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key="avatar"
              className="flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.28, ease: easeOut }}
            >
              <CopilotAvatarView />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
