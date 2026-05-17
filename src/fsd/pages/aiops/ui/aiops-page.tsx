"use client";

import { AIOpsCopilot } from "@/features/aiops-copilot/ui/aiops-copilot";
import { IncidentDashboard } from "@/features/incident-dashboard/ui/incident-dashboard";
import { PrimeReportViewer } from "@/features/prime-report-viewer/ui/prime-report-viewer";
import { AIOpsSessionProvider } from "@/processes/aiops-analysis-session/model/aiops-session-context";

export function AIOpsPage() {
  return (
    <AIOpsSessionProvider>
      <main className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col gap-4 px-4 py-6 lg:px-8">
        <header className="rounded-2xl border border-cyan-200/60 bg-gradient-to-r from-cyan-50 via-white to-emerald-50 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">AIOps Prime</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Multi-Agent Incident Intelligence Copilot
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Observe logs, detect correlated incidents, infer root causes, and produce
            PRIME KPIs plus stakeholder-ready narratives.
          </p>
        </header>

        <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
          <div className="grid gap-4">
            <IncidentDashboard />
            <PrimeReportViewer />
          </div>

          <AIOpsCopilot />
        </div>
      </main>
    </AIOpsSessionProvider>
  );
}
