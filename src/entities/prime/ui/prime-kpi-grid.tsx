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
  if (trend === "up") return "text-emerald-700 bg-emerald-100 border-emerald-200";
  if (trend === "down") return "text-rose-700 bg-rose-100 border-rose-200";
  return "text-slate-700 bg-slate-100 border-slate-200";
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
          className="rounded-xl border border-slate-200 bg-white p-3 shadow-[0_6px_20px_-18px_rgba(2,6,23,0.35)]"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{kpi.name}</p>
            <span
              className={[
                "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                trendColor(kpi.trend),
              ].join(" ")}
            >
              {trendIndicator(kpi.trend)}
            </span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {kpi.value} <span className="text-sm text-slate-500">{kpi.unit}</span>
          </p>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div
              className={[
                "h-2 rounded-full",
                kpi.trend === "up"
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
                  : kpi.trend === "down"
                    ? "bg-gradient-to-r from-rose-500 to-orange-500"
                    : "bg-gradient-to-r from-slate-500 to-slate-400",
              ].join(" ")}
              style={{ width: `${barWidth(kpi)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-600">{kpi.description}</p>
        </article>
      ))}
    </div>
  );
}

