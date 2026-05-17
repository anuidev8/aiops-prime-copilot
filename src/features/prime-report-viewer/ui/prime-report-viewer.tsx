"use client";

import { PrimeKpiGrid } from "@/entities/prime/ui/prime-kpi-grid";
import { PrimeNarrative } from "@/entities/prime/ui/prime-narrative";
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
  const { result } = useAIOpsSession();
  const report = result?.primeReport;
  const generationTime = report
    ? new Date(report.generatedAt).toLocaleString()
    : "No report generated yet";

  return (
    <Panel
      title="PRIME Executive Report"
      subtitle="KPI intelligence with business-impact narrative for operations and leadership"
    >
      {report ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-white to-cyan-50 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Generated</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{generationTime}</p>
            <p className="mt-2 text-sm text-slate-700">
              Company priority: {priorityFromKpis(report.kpis)}
            </p>
          </div>

          <PrimeKpiGrid kpis={report.kpis} />
          <PrimeNarrative
            narrative={report.narrative}
            businessSummary={report.businessSummary}
          />
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          Run an analysis to populate PRIME KPI cards, business narrative, and
          executive priorities.
        </p>
      )}
    </Panel>
  );
}

