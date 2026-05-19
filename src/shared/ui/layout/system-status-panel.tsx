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
      detail: status?.adk.backend ?? "—",
    },
    {
      label: "Vertex AI",
      ready: status?.adk.vertexEnabled ?? false,
      detail: status?.adk.project ?? "—",
    },
    {
      label: "Model",
      ready: Boolean(status?.adk.model),
      detail: status?.adk.model ?? "Gemini",
    },
  ];

  return (
    <div className="glass rounded-2xl p-3 text-xs space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        System status
      </p>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-foreground">{row.label}</p>
            <p className="text-[10px] text-muted-foreground truncate">{row.detail}</p>
          </div>
          <span
            className={[
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              row.ready
                ? "bg-success/15 text-success border border-success/30"
                : "bg-secondary/60 text-muted-foreground border border-border/40",
            ].join(" ")}
          >
            {row.ready ? "Connected" : "Pending"}
          </span>
        </div>
      ))}
    </div>
  );
}
