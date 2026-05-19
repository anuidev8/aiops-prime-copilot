"use client";

import type { AnalysisWorkspaceSummary } from "@/shared/types/analysis-workspace-summary";

interface AnalysisSummaryChatCardProps {
  summary: AnalysisWorkspaceSummary;
  onViewReport?: () => void;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function AnalysisSummaryChatCard({
  summary,
  onViewReport,
}: AnalysisSummaryChatCardProps) {
  const costEstimated = summary.cost.source === "estimated";

  return (
    <div className="my-2 w-full max-w-md rounded-2xl border border-border bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Today&apos;s analysis summary
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <SummaryMetric label="Total projects" value={String(summary.totalProjects)} />
        <SummaryMetric label="Total services" value={String(summary.totalServices)} />
        <SummaryMetric
          label="Active incidents"
          value={String(summary.activeIncidents)}
          highlight={summary.activeIncidents > 0 ? "danger" : undefined}
        />
        <SummaryMetric
          label="Anomalies detected"
          value={String(summary.anomaliesDetected)}
        />
        <SummaryMetric
          label={`Est. cost (${summary.cost.windowLabel.toLowerCase()})`}
          value={formatUsd(summary.cost.totalUsd)}
          hint={costEstimated ? "Estimated — no billing API yet" : undefined}
          className="col-span-2"
        />
      </dl>

      {summary.topRecommendation ? (
        <p className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {summary.topRecommendation}
        </p>
      ) : null}

      {onViewReport ? (
        <button
          type="button"
          onClick={onViewReport}
          className="mt-3 w-full rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
        >
          View full report
        </button>
      ) : null}
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  highlight,
  hint,
  className,
}: {
  label: string;
  value: string;
  highlight?: "danger";
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd
        className={[
          "font-semibold text-foreground",
          highlight === "danger" ? "text-rose-600" : "",
        ].join(" ")}
      >
        {value}
      </dd>
      {hint ? <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
