"use client";

import { PortfolioProjectHealthViewModel } from "@/shared/types/aiops";

interface PortfolioMeritGridProps {
  projects: PortfolioProjectHealthViewModel[];
}

const MERIT_STYLES: Record<
  PortfolioProjectHealthViewModel["merit"],
  { badge: string; card: string; label: string }
> = {
  green: {
    badge: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
    card: "border-emerald-500/20",
    label: "Green",
  },
  yellow: {
    badge: "border-amber-500/35 bg-amber-500/10 text-amber-300",
    card: "border-amber-500/20",
    label: "Yellow",
  },
  red: {
    badge: "border-rose-500/35 bg-rose-500/10 text-rose-300",
    card: "border-rose-500/20",
    label: "Red",
  },
};

function scoreLabel(project: PortfolioProjectHealthViewModel): string {
  if (project.healthScore === null) {
    return "No score yet";
  }
  return `${project.healthScore}/100`;
}

export function PortfolioMeritGrid({ projects }: PortfolioMeritGridProps) {
  if (projects.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/60 bg-secondary/20 p-6 text-sm text-muted-foreground text-center">
        Portfolio catalog is empty. Connect projects to populate merit status.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {projects.map((project) => {
        const style = MERIT_STYLES[project.merit];
        return (
          <article
            key={project.projectId}
            className={[
              "rounded-xl border bg-slate-900/40 p-3.5 transition-colors",
              style.card,
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{project.projectName}</p>
                <p className="truncate text-[10px] font-mono text-slate-500">
                  {project.projectId}
                </p>
              </div>
              <span
                className={[
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  style.badge,
                ].join(" ")}
              >
                {style.label}
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-400">Health score</p>
            <p className="text-lg font-semibold text-slate-100">{scoreLabel(project)}</p>

            <p className="mt-2 text-[11px] text-slate-500">
              Incidents {project.incidentCount} · Critical {project.criticalCount}
            </p>
          </article>
        );
      })}
    </div>
  );
}
