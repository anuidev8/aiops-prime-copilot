"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Edit2,
  HelpCircle,
  MoreHorizontal,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { ReportCanvasChartVisual } from "@/features/report-canvas/ui/report-canvas-visuals";
import type { ReportCanvasBlock } from "@/shared/types/report-canvas";
import type { ReportSectionReviewStatus } from "@/shared/types/report-section";
import { formatRelativeTime } from "@/shared/types/report-section";

function reviewLabel(status: ReportSectionReviewStatus): string {
  if (status === "approved") return "Approved";
  if (status === "review") return "Review";
  if (status === "needs_review") return "Needs review";
  return "Draft";
}

interface ReportSectionDetailProps {
  block: ReportCanvasBlock;
  blockIndex: number;
  reviewStatus: ReportSectionReviewStatus;
  generatedAt: string;
  isEditing: boolean;
  rejectPending: boolean;
  onApprove: () => void;
  onEdit: () => void;
  onAskWhy: () => void;
  onReject: () => void;
  onConfirmReject: () => void;
  onCancelReject: () => void;
  onRegenerate: () => void;
  onUpdateText: (fields: { title?: string; content?: string }) => void;
  onUpdateChart: (fields: {
    title?: string;
    metricName?: string;
    value?: number;
    unit?: string;
    note?: string;
  }) => void;
}

export function ReportSectionDetail({
  block,
  blockIndex,
  reviewStatus,
  generatedAt,
  isEditing,
  rejectPending,
  onApprove,
  onEdit,
  onAskWhy,
  onReject,
  onConfirmReject,
  onCancelReject,
  onRegenerate,
  onUpdateText,
  onUpdateChart,
}: ReportSectionDetailProps) {
  return (
    <motion.div
      layout
      key={block.id}
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <motion.div className="flex items-start justify-between border-b border-slate-100 p-5">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-base font-bold text-indigo-600">
            {blockIndex + 1}
          </div>
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <input
                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-lg font-bold text-slate-900"
                value={block.title}
                onChange={(event) => {
                  if (block.type === "text") {
                    onUpdateText({ title: event.target.value });
                    return;
                  }
                  onUpdateChart({ title: event.target.value });
                }}
              />
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{block.title}</h2>
                <span className="rounded border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  {reviewLabel(reviewStatus)}
                </span>
              </div>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Generated {formatRelativeTime(generatedAt)}
              {isEditing ? " · Editing" : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onRegenerate}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {rejectPending ? (
        <div className="border-b border-rose-100 bg-rose-50/80 px-5 py-4">
          <p className="text-sm font-semibold text-rose-800">Reject this section?</p>
          <p className="mt-1 text-xs text-rose-700/90">
            The assistant knows you requested rejection. Confirm to mark &quot;{block.title}&quot; as
            needs review, or cancel to keep working.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onConfirmReject}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Confirm reject
            </button>
            <button
              type="button"
              onClick={onCancelReject}
              className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      ) : null}

      <div className="p-6">
        {block.type === "text" ? (
          isEditing ? (
            <label className="block w-full text-sm text-slate-600">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Section content
              </span>
              <textarea
                className="min-h-[220px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-relaxed text-slate-800"
                value={block.content}
                onChange={(event) => onUpdateText({ content: event.target.value })}
              />
            </label>
          ) : (
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {block.content.trim() || (
                <span className="text-slate-400">No content yet — use Edit or ask the assistant.</span>
              )}
            </motion.div>
          )
        ) : isEditing ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-slate-500">
              Metric name
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={block.metricName}
                onChange={(event) => onUpdateChart({ metricName: event.target.value })}
              />
            </label>
            <label className="block text-xs text-slate-500">
              Value
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={block.value}
                onChange={(event) => onUpdateChart({ value: Number(event.target.value) })}
              />
            </label>
            <label className="block text-xs text-slate-500 sm:col-span-2">
              Unit
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={block.unit}
                onChange={(event) => onUpdateChart({ unit: event.target.value })}
              />
            </label>
            <label className="block text-xs text-slate-500 sm:col-span-2">
              Note
              <textarea
                className="mt-1 min-h-[120px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={block.note}
                onChange={(event) => onUpdateChart({ note: event.target.value })}
              />
            </label>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-2xl font-bold text-slate-900">
                {block.value}
                {block.unit}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-600">{block.metricName}</p>
              <p className="mt-2 text-xs text-slate-500">Trend: {block.trend}</p>
              {block.note ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{block.note}</p>
              ) : null}
            </motion.div>
            <ReportCanvasChartVisual block={block} />
          </motion.div>
        )}
      </motion.div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-slate-100 bg-slate-50/50 p-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onApprove}
            disabled={rejectPending}
            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-6 py-2 text-sm font-medium text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </button>
          <button
            type="button"
            onClick={onEdit}
            disabled={rejectPending}
            className={[
              "flex items-center gap-2 rounded-lg border px-6 py-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50",
              isEditing
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50",
            ].join(" ")}
          >
            <Edit2 className="h-4 w-4" />
            {isEditing ? "Done editing" : "Edit"}
          </button>
        </motion.div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onAskWhy}
            disabled={rejectPending}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <HelpCircle className="h-4 w-4 text-slate-400" />
            Ask why
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={rejectPending}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
