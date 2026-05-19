import { PrimeKpiViewModel } from "@/shared/types/aiops";
import { kpiScaleValue } from "@/shared/lib/kpi-display";

interface ProjectServiceBarChartProps {
  kpis: PrimeKpiViewModel[];
}

export function ProjectServiceBarChart({ kpis }: ProjectServiceBarChartProps) {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">KPI Bars</p>
      <div className="mt-3 space-y-3">
        {kpis.slice(0, 4).map((kpi) => (
          <div key={`${kpi.name}-bar`} className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>{kpi.name}</span>
              <span className="font-mono">
                {kpi.value}
                {kpi.unit}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-800/90">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                style={{ width: `${kpiScaleValue(kpi)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
