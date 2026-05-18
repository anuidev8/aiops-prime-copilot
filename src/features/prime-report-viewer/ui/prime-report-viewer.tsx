"use client";

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
          <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-slate-900/60 to-cyan-900/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500/80">Generated</p>
            <p className="mt-1 text-sm font-medium text-white font-mono">{generationTime}</p>
            <div className="mt-4 pt-3 border-t border-cyan-500/20">
               <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Company priority</p>
               <p className="text-sm text-cyan-100/90 leading-relaxed">
                 {priorityFromKpis(report.kpis)}
               </p>
            </div>
          </div>

          <div className="glass-panel p-4 bg-[#090c15]/60 border-slate-800/60">
             <PrimeKpiGrid kpis={report.kpis} />
          </div>
          
          <div className="glass-panel p-4 bg-[#090c15]/60 border-slate-800/60">
             <PrimeNarrative
               narrative={report.narrative}
               businessSummary={report.businessSummary}
             />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-3 border border-slate-700/50">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-slate-500"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Run an analysis to populate PRIME KPI cards, business narrative, and executive priorities.
          </p>
        </div>
      )}
    </Panel>
  );
}

