import { PrimeKpiViewModel } from "@/shared/types/aiops";

interface PrimeKpiGridProps {
  kpis: PrimeKpiViewModel[];
}

function trendIndicator(trend: PrimeKpiViewModel["trend"]): string {
  if (trend === "up") return "Improving";
  if (trend === "down") return "Needs action";
  return "Stable";
}

function trendColor(trend: PrimeKpiViewModel["trend"]): string {
  if (trend === "up") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  if (trend === "down") return "text-rose-400 bg-rose-500/10 border-rose-500/30";
  return "text-slate-400 bg-slate-500/10 border-slate-500/30";
}

function barWidth(kpi: PrimeKpiViewModel): number {
  if (kpi.unit === "%") {
    return Math.max(8, Math.min(kpi.value, 100));
  }

  if (kpi.name === "Incident density") {
    return Math.max(8, Math.min(kpi.value * 14, 100));
  }

  if (kpi.name === "MTTR") {
    return Math.max(8, Math.min(kpi.value * 3.5, 100));
  }

  return Math.max(8, Math.min(kpi.value, 100));
}

export function PrimeKpiGrid({ kpis }: PrimeKpiGridProps) {
  if (kpis.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {kpis.map((kpi) => (
        <article
          key={kpi.name}
          className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-colors hover:bg-slate-800/50"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{kpi.name}</p>
            <span
              className={[
                "rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                trendColor(kpi.trend),
              ].join(" ")}
            >
              {trendIndicator(kpi.trend)}
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-white drop-shadow-sm">
            {kpi.value} <span className="text-sm text-slate-500 font-mono">{kpi.unit}</span>
          </p>
          <div className="mt-3 h-1.5 rounded-full bg-slate-800 overflow-hidden relative">
            <div
              className={[
                "absolute inset-y-0 left-0 rounded-full shadow-[0_0_8px_currentColor]",
                kpi.trend === "up"
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-400 text-emerald-500"
                  : kpi.trend === "down"
                    ? "bg-gradient-to-r from-rose-600 to-rose-400 text-rose-500"
                    : "bg-gradient-to-r from-slate-600 to-slate-400 text-slate-500",
              ].join(" ")}
              style={{ width: `${barWidth(kpi)}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-slate-500">{kpi.description}</p>
        </article>
      ))}
    </div>
  );
}
