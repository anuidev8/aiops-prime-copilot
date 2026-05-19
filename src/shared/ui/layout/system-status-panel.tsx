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
      label: "ADK",
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

  return (
    <div className="rounded-2xl border border-border bg-card/90 p-3 text-xs shadow-[0_12px_32px_-24px_hsl(225_30%_30%/0.5)]">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        System Status
      </p>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">{row.label}</p>
              <p className="truncate text-[10px] text-muted-foreground">{row.detail}</p>
            </div>
            <span
              className={[
                "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                row.ready
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-100 text-slate-500",
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
