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
const pillTransition = { type: "spring" as const, stiffness: 400, damping: 32 };

function subStepIcon(status: "pending" | "running" | "complete"): string {
  if (status === "complete") return "✓";
  if (status === "running") return "⏳";
  return "○";
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
    reportLayerOpen,
    reportCanvas,
    reportSectionReviews,
    selectedCanvasBlockId,
    reportCanvasGenerating,
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

  return (
    <div className="flex h-full min-h-0 max-h-full flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-[0_16px_34px_-26px_hsl(225_30%_30%/0.45)]">
      <div className="shrink-0 border-b border-border/80 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-display text-lg font-semibold text-foreground">Data Assistant</p>
            <p className="text-xs text-muted-foreground">Powered by CopilotKit</p>
          </div>
          <button
            type="button"
            aria-label="Close panel"
            className="rounded-lg border border-border bg-white p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="relative mt-3 inline-flex rounded-xl border border-border bg-secondary/45 p-1">
          {(["chat", "avatar"] as const).map((id) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={[
                  "relative z-10 rounded-lg px-3 py-1.5 text-xs font-medium capitalize",
                  active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {active ? (
                  <motion.span
                    layoutId="copilot-tab-pill"
                    className="absolute inset-0 rounded-lg bg-gradient-primary"
                    transition={pillTransition}
                  />
                ) : null}
                <span className="relative">{id}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        {activeTab === "chat" ? (
          <>
            <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-white p-2">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key="chat"
                  className="flex h-full min-h-0 flex-col"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.28, ease: easeOut }}
                >
                  {chat}
                </motion.div>
              </AnimatePresence>
            </div>

            <section className="rounded-2xl border border-border bg-white p-3">
              <div className="flex items-center justify-between text-xs">
                <p className="font-medium text-foreground">Analysis Agent</p>
                <span className="text-muted-foreground">{summary.pipelineProgressPercent}%</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{summary.pipelinePhaseLabel}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${summary.pipelineProgressPercent}%` }}
                />
              </div>
              {incidentProgress ? (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Incident {incidentProgress.current} of {incidentProgress.total}:{" "}
                  {incidentProgress.service}
                </p>
              ) : null}
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Current steps
              </p>
              <ul className="mt-2 space-y-1.5 text-xs">
                {summary.telemetrySubSteps.map((step) => (
                  <li key={step.id} className="flex items-center gap-2">
                    <span className="w-4 shrink-0 text-center text-[11px]">
                      {subStepIcon(step.status)}
                    </span>
                    <span
                      className={
                        step.status === "complete"
                          ? "text-foreground"
                          : step.status === "running"
                            ? "font-medium text-primary"
                            : "text-muted-foreground"
                      }
                    >
                      {step.label}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key="avatar"
              className="flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.32, ease: easeOut }}
            >
              <CopilotAvatarView />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
