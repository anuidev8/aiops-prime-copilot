import { ProjectIncidentTrendPointViewModel } from "@/shared/types/aiops";
import { clamp } from "@/shared/lib/kpi-display";

interface ProjectIncidentTrendChartProps {
  points: ProjectIncidentTrendPointViewModel[];
}

export function ProjectIncidentTrendChart({ points }: ProjectIncidentTrendChartProps) {
  const maxCount = Math.max(...points.map((point) => point.incidentCount), 1);

  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">
        Incident Trend
      </p>
      {points.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">No trend points in this window.</p>
      ) : (
        <div className="mt-4 flex h-28 items-end gap-2">
          {points.map((point) => {
            const height = clamp((point.incidentCount / maxCount) * 100, 4, 100);
            const criticalHeight = clamp((point.criticalCount / maxCount) * 100, 0, height);

            return (
              <div key={point.timestamp} className="flex flex-1 flex-col items-center gap-1">
                <div className="relative flex h-20 w-full items-end justify-center rounded-md bg-slate-900/80">
                  <div
                    className="w-3/4 rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400"
                    style={{ height: `${height}%` }}
                    title={`${point.incidentCount} incidents`}
                  />
                  {point.criticalCount > 0 ? (
                    <div
                      className="absolute bottom-0 w-3/4 rounded-t bg-rose-500/90"
                      style={{ height: `${criticalHeight}%` }}
                      title={`${point.criticalCount} critical`}
                    />
                  ) : null}
                </div>
                <span className="text-[10px] text-slate-500">{point.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
