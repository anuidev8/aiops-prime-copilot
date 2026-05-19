"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { ReportAgentProgress } from "@/features/report-canvas/ui/report-agent-progress";
import { ReportCanvasTransform } from "@/features/report-canvas/ui/report-canvas-transform";
import { ReportSectionDetail } from "@/features/report-canvas/ui/report-section-detail";
import { ReportSectionsList } from "@/features/report-canvas/ui/report-sections-list";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import { downloadReportCanvasPdf } from "@/shared/api/report-canvas-client";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function ReportCanvas() {
  const reducedMotion = Boolean(useReducedMotion());
  const {
    reportCanvas,
    reportCanvasGenerating,
    reportSectionReviews,
    reportSectionEditing,
    setReportSectionEditing,
    setReportCanvasMode,
    selectedCanvasBlockId,
    setSelectedCanvasBlockId,
    approveReportSection,
    requestReportReject,
    cancelReportReject,
    setReportCopilotIntent,
    queueReportCopilotUiAction,
    setReportSectionReview,
    updateCanvasTextBlock,
    updateCanvasChartBlock,
    generateReportCanvas,
    setReportLayerOpen,
    lastCanvasEdit,
    result,
    artifactCache,
    setDashboardFocus,
  } = useAIOpsSession();

  const projectName = useMemo(
    () =>
      reportCanvas?.sourceProjectName ??
      result?.query?.resolvedProjectName ??
      artifactCache.query?.resolvedProjectName ??
      null,
    [
      artifactCache.query?.resolvedProjectName,
      reportCanvas?.sourceProjectName,
      result?.query?.resolvedProjectName,
    ],
  );

  const selectedBlock = useMemo(
    () =>
      reportCanvas?.blocks.find((block) => block.id === selectedCanvasBlockId) ??
      reportCanvas?.blocks[0] ??
      null,
    [reportCanvas, selectedCanvasBlockId],
  );

  const selectedIndex = useMemo(() => {
    if (!reportCanvas || !selectedBlock) return 0;
    return reportCanvas.blocks.findIndex((block) => block.id === selectedBlock.id);
  }, [reportCanvas, selectedBlock]);

  const isEditingSelected =
    reportSectionEditing && selectedBlock?.id === selectedCanvasBlockId;

  if (reportCanvasGenerating) {
    return <ReportCanvasTransform projectName={projectName} />;
  }

  if (!reportCanvas) {
    return (
      <motion.div
        className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center"
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="font-display text-xl font-bold text-slate-900">Report Agent</h2>
        <p className="mt-2 text-sm text-slate-500">
          Generate a structured PRIME report from the latest analysis session.
        </p>
        <button
          type="button"
          onClick={() => void generateReportCanvas()}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Generate report
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: easeOut }}
    >
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Report Agent</h1>
            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
              Draft in progress
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void downloadReportCanvasPdf(reportCanvas)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Export PDF
            </button>
            <button
              type="button"
              onClick={() => setReportLayerOpen(false)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-500">
          AI is building your report. Review, edit and approve each section.
        </p>
      </header>

      <ReportAgentProgress
        blocks={reportCanvas.blocks}
        reviews={reportSectionReviews}
        generatedAt={reportCanvas.generatedAt}
      />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <ReportSectionsList
          blocks={reportCanvas.blocks}
          reviews={reportSectionReviews}
          selectedBlockId={selectedCanvasBlockId}
          generatedAt={reportCanvas.generatedAt}
          lastEditBlockId={lastCanvasEdit?.blockId ?? null}
          lastEditAt={lastCanvasEdit?.updatedAt ?? null}
          onSelect={(blockId) => {
            setSelectedCanvasBlockId(blockId);
            setReportSectionEditing(false);
            setReportCanvasMode("present");
            setReportCopilotIntent(null);
            cancelReportReject();
          }}
        />

        {selectedBlock ? (
          <ReportSectionDetail
            block={selectedBlock}
            blockIndex={selectedIndex}
            reviewStatus={reportSectionReviews[selectedBlock.id] ?? "draft"}
            generatedAt={reportCanvas.generatedAt}
            isEditing={isEditingSelected}
            onApprove={() => {
              approveReportSection(selectedBlock.id);
              cancelReportReject();
              setReportCopilotIntent(null);
              queueReportCopilotUiAction({
                type: "approve",
                blockId: selectedBlock.id,
                sectionTitle: selectedBlock.title,
                blockType: selectedBlock.type,
                visualKind:
                  selectedBlock.type === "chart"
                    ? selectedBlock.visual?.kind
                    : undefined,
              });
            }}
            onReject={() => {
              requestReportReject(selectedBlock.id);
              setReportCanvasMode("present");
              setReportSectionEditing(false);
              setReportCopilotIntent(null);
              queueReportCopilotUiAction({
                type: "reject",
                blockId: selectedBlock.id,
                sectionTitle: selectedBlock.title,
                blockType: selectedBlock.type,
                visualKind:
                  selectedBlock.type === "chart"
                    ? selectedBlock.visual?.kind
                    : undefined,
              });
            }}
            onEdit={() => {
              if (isEditingSelected) {
                setReportSectionEditing(false);
                setReportCanvasMode("present");
                setReportCopilotIntent(null);
                return;
              }
              setReportSectionEditing(true);
              setReportCanvasMode("edit");
              setReportCopilotIntent({
                type: "help_edit",
                blockId: selectedBlock.id,
                sectionTitle: selectedBlock.title,
                blockType: selectedBlock.type,
                visualKind:
                  selectedBlock.type === "chart"
                    ? selectedBlock.visual?.kind
                    : undefined,
                requestedAt: new Date().toISOString(),
              });
              queueReportCopilotUiAction({
                type: "edit",
                blockId: selectedBlock.id,
                sectionTitle: selectedBlock.title,
                blockType: selectedBlock.type,
                visualKind:
                  selectedBlock.type === "chart"
                    ? selectedBlock.visual?.kind
                    : undefined,
              });
            }}
            onAskWhy={() => {
              setReportCopilotIntent({
                type: "ask_why",
                blockId: selectedBlock.id,
                sectionTitle: selectedBlock.title,
                blockType: selectedBlock.type,
                visualKind:
                  selectedBlock.type === "chart"
                    ? selectedBlock.visual?.kind
                    : undefined,
                requestedAt: new Date().toISOString(),
              });
              queueReportCopilotUiAction({
                type: "ask_why",
                blockId: selectedBlock.id,
                sectionTitle: selectedBlock.title,
                blockType: selectedBlock.type,
                visualKind:
                  selectedBlock.type === "chart"
                    ? selectedBlock.visual?.kind
                    : undefined,
              });
              setDashboardFocus({
                scope: "overview",
                reason: `User asked why for report section "${selectedBlock.title}" (${selectedBlock.id}). Explain using session analysis and this section's current content only.`,
                source: "manual",
              });
            }}
            onRegenerate={() => {
              setReportSectionReview(selectedBlock.id, "review");
            }}
            onUpdateText={(fields) => updateCanvasTextBlock(selectedBlock.id, fields)}
            onUpdateChart={(fields) => updateCanvasChartBlock(selectedBlock.id, fields)}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Select a section to review and edit.
          </div>
        )}
      </div>
    </motion.div>
  );
}
