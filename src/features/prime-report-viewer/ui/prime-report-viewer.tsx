"use client";

import { ProjectCompanyComparisonBars } from "@/entities/project-analytics/ui/project-company-comparison-bars";
import { ProjectHealthCards } from "@/entities/project-analytics/ui/project-health-cards";
import { ProjectIncidentTrendChart } from "@/entities/project-analytics/ui/project-incident-trend-chart";
import { ProjectRecommendationPanel } from "@/entities/project-analytics/ui/project-recommendation-panel";
import { ProjectSeverityDonut } from "@/entities/project-analytics/ui/project-severity-donut";
import { ProjectServiceBarChart } from "@/entities/project-analytics/ui/project-service-bar-chart";
import { PrimeKpiGrid } from "@/entities/prime/ui/prime-kpi-grid";
import { PrimeNarrative } from "@/entities/prime/ui/prime-narrative";
import { DashboardAnalyzingPlaceholder } from "@/features/agent-pipeline/ui/dashboard-analyzing-placeholder";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import { Panel } from "@/shared/ui/panel";

function priorityFromKpis(kpis: Array<{ name: string; value: number }>): string {
  const mttr = kpis.find((kpi) => kpi.name === "MTTR")?.value ?? 0;
  const autoHandleable =
    kpis.find((kpi) => kpi.name === "Auto-handleable incident rate")?.value ?? 0;
  const density = kpis.find((kpi) => kpi.name === "Incident density")?.value ?? 0;

  if (density > 3) {
    return "Contain incident inflow with immediate dependency safeguards and fast rollback playbooks.";
  }

  if (mttr > 20) {
    return "Reduce MTTR with tighter on-call routing and pre-approved remediation automations.";
  }

  if (autoHandleable < 50) {
    return "Increase automation coverage for recurring incidents to protect engineering focus.";
  }

  return "Stabilize current trend and convert successful remediation steps into reusable runbooks.";
}

function findKpiValue(
  kpis: Array<{ name: string; value: number; unit: string }>,
  targetName: string,
): { value: number; unit: string } | null {
  const hit = kpis.find((kpi) => kpi.name === targetName);
  if (!hit) return null;
  return { value: hit.value, unit: hit.unit };
}

export function PrimeReportViewer() {
  const { result, isAnalyzing, agentPipeline } = useAIOpsSession();
  const report = result?.primeReport;
  const hasReport = Boolean(report?.kpis.length);
  const reporterRunning = agentPipeline.some(
    (step) => step.id === "reporter" && step.status === "running",
  );
  const showReportPlaceholder = isAnalyzing && !hasReport;
  const generationTime = report
    ? new Date(report.generatedAt).toLocaleString()
    : "No report generated yet";

  const comparisonRows =
    report?.projectSummary && report.companySummary
      ? [
          {
            label: "Critical Incident Rate",
            project: findKpiValue(
              report.projectSummary.kpis,
              "Critical Incident Rate",
            ),
            company: findKpiValue(
              report.companySummary.kpis,
              "Company Critical Incident Rate",
            ),
          },
          {
            label: "Service Stability Coverage",
            project: findKpiValue(
              report.projectSummary.kpis,
              "Service Stability Coverage",
            ),
            company: findKpiValue(
              report.companySummary.kpis,
              "Company Service Stability Coverage",
            ),
          },
          {
            label: "Recurrent Incident Ratio",
            project: findKpiValue(
              report.projectSummary.kpis,
              "Recurrent Incident Ratio",
            ),
            company: findKpiValue(
              report.companySummary.kpis,
              "Company Recurrent Incident Ratio",
            ),
          },
          {
            label: "Health Score",
            project: {
              value: report.projectSummary.healthScore,
              unit: "/100",
            },
            company: findKpiValue(report.companySummary.kpis, "Company Health Proxy"),
          },
        ].filter((row) => row.project && row.company)
      : [];

  return (
    <Panel
      title="PRIME Executive Report"
      subtitle="KPI intelligence with business-impact narrative for operations and leadership"
    >
      {showReportPlaceholder ? (
        <DashboardAnalyzingPlaceholder
          title="PRIME report in progress"
          waitingLabel={
            reporterRunning
              ? "PRIME Reporter Agent is synthesizing KPIs and executive narrative."
              : "Waiting for analyst agents to finish before reporting."
          }
        />
      ) : null}

      {report && hasReport ? (
        <div className="space-y-4">
          <div className="glass rounded-2xl border-primary/30 p-4 relative overflow-hidden neon-ring">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              Generated
            </p>
            <p className="mt-1 text-sm font-medium text-white font-mono">{generationTime}</p>
            <div className="mt-4 pt-3 border-t border-primary/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Company priority
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {priorityFromKpis(report.kpis)}
              </p>
            </div>
          </div>

          {report.projectSummary ? (
            <>
              <ProjectHealthCards
                projectName={report.projectSummary.projectName}
                healthScore={report.projectSummary.healthScore}
                kpis={report.projectSummary.kpis}
              />
              <div className="grid gap-4 lg:grid-cols-2">
                <ProjectSeverityDonut severityMix={report.projectSummary.severityMix} />
                <ProjectServiceBarChart kpis={report.projectSummary.kpis} />
              </div>
              <ProjectIncidentTrendChart points={report.projectSummary.incidentTrend} />
            </>
          ) : null}

          {report.projectSummary?.recommendation ? (
            <ProjectRecommendationPanel recommendation={report.projectSummary.recommendation} />
          ) : null}

          {report.companySummary ? (
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Company Summary · {report.companySummary.companyName}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {report.companySummary.kpis.slice(0, 4).map((kpi) => (
                  <div
                    key={kpi.name}
                    className="rounded-lg border border-slate-800 bg-[#090c15]/80 px-3 py-2"
                  >
                    <p className="text-[11px] text-slate-500">{kpi.name}</p>
                    <p className="text-sm text-slate-100">
                      {kpi.value} {kpi.unit}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-300">Top risks</p>
                <div className="mt-2 space-y-1.5">
                  {report.companySummary.topRisks.map((risk) => (
                    <p key={risk} className="text-xs text-slate-400">
                      - {risk}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <ProjectCompanyComparisonBars rows={comparisonRows} />

          <div className="glass rounded-2xl p-4">
            <PrimeKpiGrid kpis={report.kpis} />
          </div>

          <div className="glass rounded-2xl p-4">
            <PrimeNarrative
              narrative={report.narrative}
              businessSummary={report.businessSummary}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-3 border border-slate-700/50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-slate-500">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Run an analysis to populate PRIME KPI cards, business narrative, and executive
            priorities.
          </p>
        </div>
      )}
    </Panel>
  );
}
