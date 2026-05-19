import type { ReportCanvasBlock } from "@/shared/types/report-canvas";

/** Human review workflow for a report section (distinct from block streaming status). */
export type ReportSectionReviewStatus =
  | "draft"
  | "needs_review"
  | "review"
  | "approved";

export type ReportSectionReviews = Record<string, ReportSectionReviewStatus>;

export function defaultReviewStatusForBlock(
  block: ReportCanvasBlock,
  index: number,
): ReportSectionReviewStatus {
  if (block.status === "pending" || block.status === "streaming") {
    return "draft";
  }
  if (index <= 1) return "approved";
  if (index <= 3) return "review";
  return "needs_review";
}

export function initializeSectionReviews(
  blocks: ReportCanvasBlock[],
): ReportSectionReviews {
  return Object.fromEntries(
    blocks.map((block, index) => [block.id, defaultReviewStatusForBlock(block, index)]),
  );
}

export function sectionDescription(block: ReportCanvasBlock): string {
  if (block.type === "text") {
    const preview = block.content.trim().replace(/\s+/g, " ").slice(0, 72);
    return preview ? `${preview}${block.content.length > 72 ? "…" : ""}` : "Narrative section";
  }
  return block.note || `${block.metricName} metric snapshot`;
}

export function formatRelativeTime(iso: string | undefined): string {
  if (!iso) return "—";
  const deltaMs = Date.now() - new Date(iso).getTime();
  if (deltaMs < 60_000) return "Just now";
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function reportProgressStats(
  blocks: ReportCanvasBlock[],
  reviews: ReportSectionReviews,
): {
  total: number;
  ready: number;
  approved: number;
  needsReview: number;
  percent: number;
} {
  const total = blocks.length;
  const ready = blocks.filter(
    (block) => block.status === "done" || block.status === undefined,
  ).length;
  const approved = blocks.filter((block) => reviews[block.id] === "approved").length;
  const needsReview = blocks.filter((block) => {
    const status = reviews[block.id];
    return status === "needs_review" || status === "review";
  }).length;
  const percent = total === 0 ? 0 : Math.round((approved / total) * 100);

  return { total, ready, approved, needsReview, percent };
}
