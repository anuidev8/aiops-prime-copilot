"use client";

import { motion } from "framer-motion";

export interface ReportEditSuggestion {
  id: string;
  label: string;
  summary: string;
  proposedTitle?: string;
  proposedContent?: string;
  proposedMetricName?: string;
  proposedValue?: number;
  proposedUnit?: string;
  proposedNote?: string;
}

interface ReportSectionSuggestionCardProps {
  sectionTitle: string;
  sectionKind: "text" | "chart";
  suggestions: ReportEditSuggestion[];
  onApply?: (suggestion: ReportEditSuggestion) => void;
}

export function ReportSectionSuggestionCard({
  sectionTitle,
  sectionKind,
  suggestions,
  onApply,
}: ReportSectionSuggestionCardProps) {
  return (
    <motion.div
      className="my-3 space-y-3 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 p-4 shadow-sm"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
          Edit suggestions
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{sectionTitle}</p>
        <p className="text-xs text-slate-500">
          {sectionKind === "chart" ? "KPI / chart section" : "Narrative section"} — pick a direction
          or ask for more variants in chat.
        </p>
      </div>
      <div className="space-y-2">
        {suggestions.map((item, index) => (
          <motion.div
            key={item.id}
            className="rounded-xl border border-slate-200/80 bg-white p-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-indigo-700">{item.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{item.summary}</p>
              </div>
              <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                Option {index + 1}
              </span>
            </div>
            {onApply ? (
              <button
                type="button"
                onClick={() => onApply(item)}
                className="mt-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Apply this version
              </button>
            ) : null}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
