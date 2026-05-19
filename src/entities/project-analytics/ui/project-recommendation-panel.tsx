import { PrimeReportViewModel } from "@/shared/types/aiops";

type ProjectRecommendation = NonNullable<
  PrimeReportViewModel["projectSummary"]
>["recommendation"];

function recommendationTone(riskLevel: ProjectRecommendation["riskLevel"]): string {
  if (riskLevel === "high") return "border-rose-500/30 bg-rose-500/10 text-rose-100";
  if (riskLevel === "medium") return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
}

interface ProjectRecommendationPanelProps {
  recommendation: ProjectRecommendation;
}

export function ProjectRecommendationPanel({
  recommendation,
}: ProjectRecommendationPanelProps) {
  return (
    <div className={`rounded-xl border p-4 ${recommendationTone(recommendation.riskLevel)}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
        Decision Recommendation · {recommendation.priority} ·{" "}
        {recommendation.riskLevel.toUpperCase()} risk · {recommendation.confidence}%
        confidence
      </p>
      <ul className="mt-3 space-y-1 text-xs text-slate-300/90">
        {recommendation.evidence.map((line) => (
          <li key={line}>• {line}</li>
        ))}
      </ul>
      <p className="mt-2 text-sm">
        <span className="font-semibold">24h:</span> {recommendation.immediateAction}
      </p>
      <p className="mt-2 text-sm">
        <span className="font-semibold">7d:</span> {recommendation.shortTermAction}
      </p>
      <p className="mt-2 text-sm">
        <span className="font-semibold">30d:</span> {recommendation.strategicAction}
      </p>
    </div>
  );
}
