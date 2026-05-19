"use client";

import { IncidentViewModel } from "@/shared/types/aiops";
import { Sparkline } from "@/shared/ui/dashboard/sparkline";

const SEV_CLASS: Record<IncidentViewModel["severity"], string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-[hsl(var(--sev-high)/0.15)] text-[hsl(var(--sev-high))] border-[hsl(var(--sev-high)/0.3)]",
  medium: "bg-warning/15 text-warning border-warning/30",
  low: "bg-primary/15 text-primary border-primary/30",
};

function trendPoints(incident: IncidentViewModel): number[] {
  const base = incident.logCount || 1;
  return [
    base * 0.4,
    base * 0.6,
    base * 0.5,
    base * 0.9,
    base,
    base * 0.85,
  ];
}

interface ActiveIncidentsTableProps {
  incidents: IncidentViewModel[];
  onSelect?: (incident: IncidentViewModel) => void;
}

export function ActiveIncidentsTable({ incidents, onSelect }: ActiveIncidentsTableProps) {
  if (incidents.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/60 bg-secondary/20 p-6 text-sm text-muted-foreground text-center">
        No active incidents for the selected scope. Run analysis on a project to populate telemetry.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/40">
      <table className="w-full text-sm">
        <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-secondary/40">
          <tr>
            <th className="text-left px-3 py-2 font-medium">Service</th>
            <th className="text-left px-3 py-2 font-medium">Severity</th>
            <th className="text-left px-3 py-2 font-medium">Duration</th>
            <th className="text-left px-3 py-2 font-medium">Status</th>
            <th className="text-left px-3 py-2 font-medium">Trend</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <tr
              key={incident.id}
              onClick={() => onSelect?.(incident)}
              className={[
                "border-t border-border/30 transition-colors",
                onSelect ? "cursor-pointer hover:bg-secondary/30" : "",
              ].join(" ")}
            >
              <td className="px-3 py-2.5">
                <div className="font-medium text-foreground">{incident.service}</div>
                <div className="text-[10px] font-mono text-muted-foreground">
                  {incident.id}
                </div>
              </td>
              <td className="px-3 py-2.5">
                <span
                  className={[
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border",
                    SEV_CLASS[incident.severity],
                  ].join(" ")}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {incident.severity}
                </span>
              </td>
              <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                {incident.durationMinutes.toFixed(0)}m
              </td>
              <td className="px-3 py-2.5">
                <span className="text-xs capitalize px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  {incident.status}
                </span>
              </td>
              <td className="px-3 py-2.5 w-24">
                <Sparkline points={trendPoints(incident)} className="h-6 w-20" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
