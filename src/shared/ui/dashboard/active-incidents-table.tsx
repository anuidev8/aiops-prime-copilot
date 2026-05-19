"use client";

import { motion, useReducedMotion } from "framer-motion";
import { IncidentViewModel } from "@/shared/types/aiops";
import { Sparkline } from "@/shared/ui/dashboard/sparkline";

const SEV_CLASS: Record<IncidentViewModel["severity"], string> = {
  critical: "border-rose-200 bg-rose-50 text-rose-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
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
  animateKey?: string;
}

export function ActiveIncidentsTable({
  incidents,
  onSelect,
  animateKey,
}: ActiveIncidentsTableProps) {
  const reducedMotion = Boolean(useReducedMotion());
  if (incidents.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-secondary/40 p-6 text-center text-sm text-muted-foreground">
        No active incidents for the selected scope. Run analysis on a project to populate telemetry.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-secondary text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Service</th>
            <th className="px-3 py-2 text-left font-medium">Severity</th>
            <th className="px-3 py-2 text-left font-medium">Duration</th>
            <th className="px-3 py-2 text-left font-medium">Status</th>
            <th className="px-3 py-2 text-left font-medium">Trend</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident, index) => (
            <motion.tr
              key={animateKey ? `${animateKey}-${incident.id}` : incident.id}
              onClick={() => onSelect?.(incident)}
              initial={reducedMotion ? false : { opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.32,
                delay: reducedMotion ? 0 : index * 0.03,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={[
                "border-t border-border/70 transition-colors",
                onSelect ? "cursor-pointer hover:bg-secondary/40" : "",
              ].join(" ")}
            >
              <td className="px-3 py-2.5">
                <div className="font-medium text-foreground">{incident.service}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{incident.id}</div>
              </td>
              <td className="px-3 py-2.5">
                <span
                  className={[
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
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
                <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">
                  {incident.status}
                </span>
              </td>
              <td className="w-24 px-3 py-2.5">
                <Sparkline points={trendPoints(incident)} className="h-6 w-20" />
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
