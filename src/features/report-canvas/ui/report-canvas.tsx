"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Clock, Settings } from "lucide-react";
import { useMemo } from "react";
import { ReportAgentProgress } from "@/features/report-canvas/ui/report-agent-progress";
import { ReportCanvasTransform } from "@/features/report-canvas/ui/report-canvas-transform";
import { ReportSectionDetail } from "@/features/report-canvas/ui/report-section-detail";
import { ReportSectionsList } from "@/features/report-canvas/ui/report-sections-list";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import { downloadReportCanvasPdf } from "@/shared/api/report-canvas-client";
import type { ReportCanvasChartBlock } from "@/shared/types/report-canvas";

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
    rejectReportSection,
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

  const chartBlocks = useMemo(
    () =>
      (reportCanvas?.blocks.filter((block) => block.type === "chart") ??
        []) as ReportCanvasChartBlock[],
    [reportCanvas],
  );

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
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <Settings className="h-4 w-4" />
              Report settings
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <Clock className="h-4 w-4" />
              Version history
            </button>
            <motion.div className="flex overflow-hidden rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => void downloadReportCanvasPdf(reportCanvas)}
                className="border-r border-indigo-700 bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Export
              </button>
              <button
                type="button"
                className="flex items-center bg-indigo-700 px-2 py-2 text-white transition-colors hover:bg-indigo-800"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </motion.div>
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
          }}
        />

        {selectedBlock ? (
          <ReportSectionDetail
            block={selectedBlock}
            blockIndex={selectedIndex}
            reviewStatus={reportSectionReviews[selectedBlock.id] ?? "draft"}
            generatedAt={reportCanvas.generatedAt}
            isEditing={isEditingSelected}
            chartBlocks={chartBlocks}
            onApprove={() => approveReportSection(selectedBlock.id)}
            onReject={() => rejectReportSection(selectedBlock.id)}
            onEdit={() => {
              if (isEditingSelected) {
                setReportSectionEditing(false);
                setReportCanvasMode("present");
                return;
              }
              setReportSectionEditing(true);
              setReportCanvasMode("edit");
            }}
            onAskWhy={() => {
              setDashboardFocus({
                scope: "overview",
                reason: `User asked why for report section "${selectedBlock.title}" (${selectedBlock.id}).`,
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
