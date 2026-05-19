import { PrimeKpiViewModel } from "@/shared/types/aiops";

interface ProjectHealthCardsProps {
  projectName: string;
  healthScore: number;
  kpis: PrimeKpiViewModel[];
}

export function ProjectHealthCards({
  projectName,
  healthScore,
  kpis,
}: ProjectHealthCardsProps) {
  return (
    <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300/80">
        Project Summary
      </p>
      <p className="mt-1 text-sm text-white">
        {projectName} · Health score{" "}
        <span className="font-mono text-cyan-300">{healthScore}/100</span>
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {kpis.slice(0, 4).map((kpi) => (
          <div
            key={kpi.name}
            className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2"
          >
            <p className="text-[11px] text-slate-400">{kpi.name}</p>
            <p className="text-sm font-medium text-white">
              {kpi.value} {kpi.unit}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
