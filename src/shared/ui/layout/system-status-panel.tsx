"use client";

import { useEffect, useState } from "react";
import { AIOpsRuntimeStatus } from "@/shared/types/runtime-status";

export function SystemStatusPanel() {
  const [status, setStatus] = useState<AIOpsRuntimeStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/aiops/runtime-status");
        if (!response.ok) return;
        const payload = (await response.json()) as AIOpsRuntimeStatus;
        if (!cancelled) setStatus(payload);
      } catch {
        if (!cancelled) setStatus(null);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = [
    {
      label: "ADX",
      ready: status?.adk.ready ?? false,
      detail: status?.adk.backend ?? "Unavailable",
    },
    {
      label: "Vertex AI",
      ready: status?.adk.vertexEnabled ?? false,
      detail: status?.adk.project ?? "Unavailable",
    },
    {
      label: "Model",
      ready: Boolean(status?.adk.model),
      detail: status?.adk.model ?? "Gemini",
    },
  ];

  const allOperational = rows.every((row) => row.ready);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div>
        <h4 className="mb-1 text-xs font-semibold text-slate-900">System Status</h4>
        <p className={`text-xs font-medium ${allOperational ? "text-green-600" : "text-slate-500"}`}>
          {allOperational ? "All systems operational" : "Checking connections"}
        </p>
      </div>

      <div className="flex flex-col gap-2 text-xs">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-2">
            <span className="text-slate-600">{row.label}</span>
            <span
              className={[
                "rounded-full px-2 py-0.5 font-medium",
                row.ready
                  ? "bg-green-50 text-green-600"
                  : "bg-slate-100 text-slate-500",
              ].join(" ")}
            >
              {row.ready ? "Connected" : "Pending"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
