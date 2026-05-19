"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
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
  onApprove: () => void;
  onEdit: () => void;
  onAskWhy: () => void;
  onReject: () => void;
  onRegenerate: () => void;
  onUpdateText: (fields: { title?: string; content?: string }) => void;
  onUpdateChart: (fields: {
    title?: string;
    metricName?: string;
    value?: number;
    unit?: string;
    note?: string;
    visualKind?: "kpi" | "bars" | "ring" | "trend";
  }) => void;
}

export function ReportSectionDetail({
  block,
  blockIndex,
  reviewStatus,
  generatedAt,
  isEditing,
  onApprove,
  onEdit,
  onAskWhy,
  onReject,
  onRegenerate,
  onUpdateText,
  onUpdateChart,
}: ReportSectionDetailProps) {
  const titleField = isEditing ? (
    <input
      className="w-full rounded-lg border border-slate-200 px-2 py-1 text-lg font-bold text-slate-900"
      value={block.title}
      onChange={(event) => {
        if (block.type === "text") {
          onUpdateText({ title: event.target.value });
        } else {
          onUpdateChart({ title: event.target.value });
        }
      }}
    />
  ) : (
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="text-lg font-bold text-slate-900">{block.title}</h2>
      <span className="rounded border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
        {reviewLabel(reviewStatus)}
      </span>
    </div>
  );

  let body: ReactNode;
  if (block.type === "text") {
    body = isEditing ? (
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
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {block.content.trim() || "No content yet — use Edit or ask the assistant."}
      </p>
    );
  } else if (isEditing) {
    body = (
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
            onChange={(event) => {
              const parsed = Number(event.target.value);
              if (Number.isFinite(parsed)) {
                onUpdateChart({ value: parsed });
              }
            }}
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
          Graphic style
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={block.visual?.kind ?? "kpi"}
            onChange={(event) =>
              onUpdateChart({
                visualKind: event.target.value as "kpi" | "bars" | "ring" | "trend",
              })
            }
          >
            <option value="kpi">KPI card</option>
            <option value="bars">Bars</option>
            <option value="ring">Ring</option>
            <option value="trend">Trend</option>
          </select>
        </label>
        <label className="block text-xs text-slate-500 sm:col-span-2">
          Note
          <textarea
            className="mt-1 min-h-[120px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={block.note}
            onChange={(event) => onUpdateChart({ note: event.target.value })}
          />
        </label>
      </div>
    );
  } else {
    body = (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-2xl font-bold text-slate-900">
            {block.value}
            {block.unit}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-600">{block.metricName}</p>
          <p className="mt-2 text-xs text-slate-500">Trend: {block.trend}</p>
          {block.note ? <p className="mt-2 text-sm text-slate-600">{block.note}</p> : null}
        </div>
        <ReportCanvasChartVisual block={block} />
      </div>
    );
  }

  return (
    <motion.div
      layout
      key={block.id}
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-start justify-between border-b border-slate-100 p-5">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-base font-bold text-indigo-600">
            {blockIndex + 1}
          </div>
          <div className="min-w-0 flex-1">
            {titleField}
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
            className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-6">{body}</div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 p-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onApprove}
            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-6 py-2 text-sm font-medium text-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </button>
          <button
            type="button"
            onClick={onEdit}
            className={
              isEditing
                ? "flex items-center gap-2 rounded-lg border border-indigo-600 bg-indigo-600 px-6 py-2 text-sm font-medium text-white"
                : "flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-6 py-2 text-sm font-medium text-indigo-700"
            }
          >
            <Edit2 className="h-4 w-4" />
            {isEditing ? "Done editing" : "Edit"}
          </button>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onAskWhy}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
          >
            <HelpCircle className="h-4 w-4 text-slate-400" />
            Ask why
          </button>
          <button
            type="button"
            onClick={onReject}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm text-red-600"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>
        </div>
      </div>
    </motion.div>
  );
}
