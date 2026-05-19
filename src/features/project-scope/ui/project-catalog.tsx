"use client";

import { useEffect, useMemo, useState } from "react";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import { ProjectOwnershipViewModel } from "@/shared/types/aiops";
import { Panel } from "@/shared/ui/panel";

const COMPANY_LABELS: Record<string, string> = {
  "acme-corp": "Acme Corp",
  "stellar-inc": "Stellar Inc",
};

function companyLabel(companyId: string): string {
  return COMPANY_LABELS[companyId] ?? companyId;
}

export function ProjectCatalog() {
  const {
    runAnalysis,
    isAnalyzing,
    result,
    setWorkflowStage,
    projectCatalog,
    projectCatalogLoading,
    selectedScope,
    setSelectedScope,
  } = useAIOpsSession();
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectCatalogLoading && projectCatalog.length === 0) {
      setLoadError("Could not load projects.");
    } else {
      setLoadError(null);
    }
  }, [projectCatalog, projectCatalogLoading]);

  const projects = projectCatalog;
  const loading = projectCatalogLoading;

  const grouped = useMemo(() => {
    const map = new Map<string, ProjectOwnershipViewModel[]>();

    for (const project of projects) {
      const list = map.get(project.companyId) ?? [];
      list.push(project);
      map.set(project.companyId, list);
    }

    return Array.from(map.entries()).map(([companyId, companyProjects]) => ({
      companyId,
      label: companyLabel(companyId),
      projects: companyProjects,
    }));
  }, [projects]);

  async function analyzeProject(project: ProjectOwnershipViewModel) {
    setSelectedScope({
      companyId: project.companyId,
      projectId: project.id,
      projectName: project.name,
      serviceNames: project.serviceNames,
    });
    setWorkflowStage(
      "collecting_scope",
      "manual",
      `Analyzing ${project.name} (${project.serviceNames.length} services).`,
    );

    await runAnalysis({
      companyId: project.companyId,
      projectId: project.id,
      services: project.serviceNames,
    });
  }

  const resolvedId =
    selectedScope?.projectId ??
    result?.query.resolvedProjectId ??
    result?.query.requestedProjectId ??
    null;

  return (
    <Panel
      title="Your Projects"
      subtitle="Pick a project to run telemetry, analysis, and PRIME reporting on its services"
    >
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/50"
            />
          ))}
        </div>
      ) : null}

      {loadError ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {loadError}
        </p>
      ) : null}

      {!loading && !loadError ? (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.companyId}>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {group.label}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.projects.map((project) => {
                  const isActive = resolvedId === project.id;
                  const isRunning = isAnalyzing && isActive;

                  return (
                    <button
                      key={project.id}
                      type="button"
                      disabled={isAnalyzing}
                      onClick={() => void analyzeProject(project)}
                      className={[
                        "group rounded-xl border p-4 text-left transition-all",
                        "disabled:cursor-not-allowed disabled:opacity-60",
                        isActive
                          ? "border-primary/50 bg-primary/10 neon-ring"
                          : "border-border/70 bg-secondary/40 hover:border-primary/30 hover:bg-secondary/60",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-white">{project.name}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500 font-mono">
                            {project.id}
                          </p>
                        </div>
                        <span
                          className={[
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            isActive
                              ? "border-primary/40 text-primary bg-primary/10"
                              : "border-border text-muted-foreground bg-secondary/80",
                          ].join(" ")}
                        >
                          {project.serviceNames.length} svc
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {project.serviceNames.map((service) => (
                          <span
                            key={service}
                            className="rounded-md border border-border/60 bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                      <p className="mt-3 text-[11px] text-muted-foreground group-hover:text-primary transition-colors">
                        {isRunning
                          ? "Running agents…"
                          : isActive
                            ? "Last analysis for this project"
                            : "Click to analyze"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}
