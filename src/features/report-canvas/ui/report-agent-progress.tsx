"use client";

import { motion } from "framer-motion";
import type { ReportCanvasBlock } from "@/shared/types/report-canvas";
import type { ReportSectionReviews } from "@/shared/types/report-section";
import { formatRelativeTime, reportProgressStats } from "@/shared/types/report-section";

interface ReportAgentProgressProps {
  blocks: ReportCanvasBlock[];
  reviews: ReportSectionReviews;
  generatedAt: string;
}

export function ReportAgentProgress({
  blocks,
  reviews,
  generatedAt,
}: ReportAgentProgressProps) {
  const stats = reportProgressStats(blocks, reviews);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-8 sm:gap-12">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Sections
          </h3>
          <p className="text-xl font-bold text-slate-900">
            {stats.ready} / <span className="text-slate-400">{stats.total}</span>
          </p>
        </motion.div>
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Approved
          </h3>
          <p className="text-xl font-bold text-emerald-600">{stats.approved}</p>
        </div>
        <motion.div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-orange-500">
            Needs review
          </h3>
          <p className="text-xl font-bold text-orange-500">{stats.needsReview}</p>
        </motion.div>
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Last updated
          </h3>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {formatRelativeTime(generatedAt)}
          </p>
        </div>
      </div>
      <div className="flex w-full items-center gap-4 sm:w-64">
        <motion.div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-indigo-600"
            initial={{ width: 0 }}
            animate={{ width: `${stats.percent}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>
        <span className="shrink-0 text-sm font-medium text-slate-600">
          {stats.percent}% complete
        </span>
      </div>
    </section>
  );
}
