"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  FileText,
  MoreHorizontal,
  Plus,
  RefreshCw,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import type { ReportCanvasBlock } from "@/shared/types/report-canvas";
import type { ReportSectionReviewStatus, ReportSectionReviews } from "@/shared/types/report-section";
import { formatRelativeTime, sectionDescription } from "@/shared/types/report-section";

function sectionIcon(block: ReportCanvasBlock): LucideIcon {
  const title = block.title.toLowerCase();
  if (title.includes("risk")) return ShieldAlert;
  if (title.includes("recommend")) return ShieldAlert;
  if (title.includes("timeline") || title.includes("trajectory")) return Activity;
  if (title.includes("kpi") || title.includes("spread") || block.type === "chart") {
    return BarChart3;
  }
  if (title.includes("executive") || title.includes("headline")) return FileText;
  return FileText;
}

function reviewMeta(status: ReportSectionReviewStatus): {
  label: string;
  color: "emerald" | "indigo" | "orange" | "slate";
} {
  if (status === "approved") return { label: "Approved", color: "emerald" };
  if (status === "review") return { label: "Review", color: "indigo" };
  if (status === "needs_review") return { label: "Needs review", color: "orange" };
  return { label: "Draft", color: "slate" };
}

interface ReportSectionsListProps {
  blocks: ReportCanvasBlock[];
  reviews: ReportSectionReviews;
  selectedBlockId: string | null;
  generatedAt: string;
  lastEditBlockId: string | null;
  lastEditAt: string | null;
  onSelect: (blockId: string) => void;
}

export function ReportSectionsList({
  blocks,
  reviews,
  selectedBlockId,
  generatedAt,
  lastEditBlockId,
  lastEditAt,
  onSelect,
}: ReportSectionsListProps) {
  return (
    <motion.div
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      layout
    >
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-700">Report sections</h2>
        <motion.div className="flex items-center gap-12 text-xs font-medium text-slate-500">
          <span className="w-16">Status</span>
          <span className="w-16">Updated</span>
        </motion.div>
      </div>

      <div className="flex flex-col divide-y divide-slate-100">
        {blocks.map((block, index) => {
          const active = block.id === selectedBlockId;
          const review = reviewMeta(reviews[block.id] ?? "draft");
          const Icon = sectionIcon(block);
          const updatedLabel =
            block.id === lastEditBlockId && lastEditAt
              ? formatRelativeTime(lastEditAt)
              : formatRelativeTime(generatedAt);

          return (
            <motion.button
              key={block.id}
              type="button"
              onClick={() => onSelect(block.id)}
              className={[
                "group relative flex w-full items-center justify-between p-4 text-left transition-colors",
                active ? "bg-indigo-50/30" : "hover:bg-slate-50",
              ].join(" ")}
              whileHover={{ x: active ? 0 : 2 }}
            >
              {active ? (
                <div className="absolute bottom-0 left-0 top-0 w-1 rounded-r-full bg-indigo-600" />
              ) : null}
              <div className="flex items-center gap-4">
                <div className="text-slate-300">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="9" cy="12" r="1" />
                    <circle cx="9" cy="5" r="1" />
                    <circle cx="9" cy="19" r="1" />
                    <circle cx="15" cy="12" r="1" />
                    <circle cx="15" cy="5" r="1" />
                    <circle cx="15" cy="19" r="1" />
                  </svg>
                </div>
                <div
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium",
                    active
                      ? "border-indigo-100 bg-white text-indigo-600"
                      : "border-slate-100 bg-slate-50 text-slate-500",
                  ].join(" ")}
                >
                  {index + 1}
                </div>
                <div
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    review.color === "emerald"
                      ? "bg-emerald-50 text-emerald-600"
                      : review.color === "indigo"
                        ? "bg-indigo-50 text-indigo-600"
                        : review.color === "orange"
                          ? "bg-orange-50 text-orange-500"
                          : "bg-slate-50 text-slate-400",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h4
                    className={[
                      "text-sm font-semibold",
                      active ? "text-indigo-900" : "text-slate-900",
                    ].join(" ")}
                  >
                    {block.title}
                  </h4>
                  <p className="mt-0.5 text-xs text-slate-500">{sectionDescription(block)}</p>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <motion.div className="flex w-24 items-center gap-1.5">
                  {review.color === "emerald" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : null}
                  {review.color === "indigo" ? (
                    <RefreshCw className="h-3.5 w-3.5 text-indigo-500" />
                  ) : null}
                  {review.color === "orange" ? (
                    <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                  ) : null}
                  {review.color === "slate" ? (
                    <div className="ml-1 h-1.5 w-1.5 rounded-full bg-slate-300" />
                  ) : null}
                  <span
                    className={[
                      "text-xs font-medium",
                      review.color === "emerald"
                        ? "text-emerald-600"
                        : review.color === "indigo"
                          ? "text-indigo-600"
                          : review.color === "orange"
                            ? "text-orange-500"
                            : "text-slate-500",
                    ].join(" ")}
                  >
                    {review.label}
                  </span>
                </motion.div>
                <div className="flex w-16 items-center justify-between">
                  <span className="text-xs text-slate-500">{updatedLabel}</span>
                  <span className="text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="border-t border-slate-100 bg-slate-50/50 p-4">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-indigo-200 py-2.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
        >
          <Plus className="h-4 w-4" />
          Add section
        </button>
      </div>
    </motion.div>
  );
}
