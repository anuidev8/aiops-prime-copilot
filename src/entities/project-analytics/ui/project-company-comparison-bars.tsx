interface ComparisonRow {
  label: string;
  project: { value: number; unit: string } | null;
  company: { value: number; unit: string } | null;
}

interface ProjectCompanyComparisonBarsProps {
  rows: ComparisonRow[];
}

export function ProjectCompanyComparisonBars({ rows }: ProjectCompanyComparisonBarsProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-slate-950/60 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
        Project vs Company KPI Comparison
      </p>
      <div className="mt-3 space-y-3">
        {rows.map((row) => {
          const maxValue = Math.max(row.project?.value ?? 0, row.company?.value ?? 0, 1);
          const projectWidth = ((row.project?.value ?? 0) / maxValue) * 100;
          const companyWidth = ((row.company?.value ?? 0) / maxValue) * 100;

          return (
            <div key={row.label} className="rounded-lg border border-slate-800/80 p-3">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>{row.label}</span>
                <span className="font-mono text-slate-400">
                  Project {row.project?.value}
                  {row.project?.unit} · Company {row.company?.value}
                  {row.company?.unit}
                </span>
              </div>
              <div className="mt-2 space-y-1.5">
                <div className="h-2 rounded-full bg-slate-800/90">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-sky-500"
                    style={{ width: `${projectWidth}%` }}
                  />
                </div>
                <div className="h-2 rounded-full bg-slate-800/90">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    style={{ width: `${companyWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
