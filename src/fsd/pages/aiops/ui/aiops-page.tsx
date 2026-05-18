"use client";

import { AgentPipelineLive } from "@/features/agent-pipeline/ui/agent-pipeline-live";
import { AIOpsCopilot } from "@/features/aiops-copilot/ui/aiops-copilot";
import { IncidentDashboard } from "@/features/incident-dashboard/ui/incident-dashboard";
import { PrimeReportViewer } from "@/features/prime-report-viewer/ui/prime-report-viewer";
import {
  AIOpsSessionProvider,
  useAIOpsSession,
} from "@/processes/aiops-analysis-session/model/aiops-session-context";

function AIOpsMainGrid() {
  const { isAnalyzing } = useAIOpsSession();

  return (
    <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
      <div className="grid gap-6">
        {isAnalyzing ? <AgentPipelineLive /> : null}
        <IncidentDashboard />
        <PrimeReportViewer />
      </div>

      <AIOpsCopilot />
    </div>
  );
}

export function AIOpsPage() {
  return (
    <AIOpsSessionProvider>
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6">
        <header className="mb-2">
          <h1 className="text-xl font-medium tracking-wide text-white flex items-center gap-2">
            Kinetic Monolith
          </h1>
        </header>

        {/* Top KPIs Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="glass-panel p-5 flex flex-col justify-between">
              <p className="text-xs text-slate-400 mb-2">Aggregate net alpha</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-semibold text-white tracking-tight">$1,28,490.44</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">Daily PnL <span className="ml-1">+12.4%</span></span>
              </div>
           </div>

           <div className="glass-panel p-5 relative overflow-hidden flex flex-col justify-between">
              <p className="text-xs text-slate-400">Kelly criterion</p>
              <div className="text-2xl font-semibold text-white mt-1">0.145</div>
              {/* Fake Chart */}
              <div className="absolute bottom-0 left-0 right-0 h-12 flex items-end px-2 pb-2">
                 <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full opacity-70">
                    <path d="M0,20 Q10,5 20,15 T40,25 T60,10 T80,20 T100,5" fill="none" stroke="#00e676" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M0,20 Q10,5 20,15 T40,25 T60,10 T80,20 T100,5 L100,30 L0,30 Z" fill="url(#kellyGrad)" stroke="none" />
                    <defs>
                      <linearGradient id="kellyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00e676" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#00e676" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                 </svg>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div className="glass-panel p-4 flex flex-col justify-between relative overflow-hidden">
                <p className="text-xs text-slate-400">Active exposure</p>
                <div className="text-xl font-semibold text-white mt-1">$4.2M</div>
                <div className="absolute right-4 bottom-4 w-1.5 h-10 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-full h-[60%] bg-blue-500 absolute bottom-0 shadow-[0_0_10px_#3b82f6]"></div>
                </div>
             </div>
             <div className="glass-panel p-4 flex flex-col justify-between relative overflow-hidden">
                <p className="text-xs text-slate-400 flex justify-between items-center">
                   Risk parity
                </p>
                <div className="text-base font-semibold text-white mt-1">Balanced</div>
                <div className="absolute bottom-0 left-0 right-0 h-10 flex items-end">
                   <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
                      <path d="M0,25 L20,15 L40,20 L60,10 L80,15 L100,5" fill="none" stroke="#00e676" strokeWidth="1.5" />
                   </svg>
                </div>
             </div>
           </div>
        </div>

        <AIOpsMainGrid />
      </main>
    </AIOpsSessionProvider>
  );
}
