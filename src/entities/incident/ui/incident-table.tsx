import { IncidentViewModel } from "@/shared/types/aiops";

interface IncidentTableProps {
  incidents: IncidentViewModel[];
}

function severityBadgeClass(severity: IncidentViewModel["severity"]): string {
  switch (severity) {
    case "critical":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "high":
      return "bg-orange-50 text-orange-700 border border-orange-200";
    case "medium":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    default:
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }
}

export function IncidentTable({ incidents }: IncidentTableProps) {
  if (incidents.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
        No incidents detected for the selected scope.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-3">Service</th>
            <th className="px-3 py-3">Severity</th>
            <th className="px-3 py-3">Started</th>
            <th className="px-3 py-3">Duration</th>
            <th className="px-3 py-3">Logs</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Fingerprint</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {incidents.map((incident) => (
            <tr key={incident.id} className="transition-colors hover:bg-secondary/35">
              <td className="px-3 py-3 font-medium text-foreground">{incident.service}</td>
              <td className="px-3 py-3">
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    severityBadgeClass(incident.severity),
                  ].join(" ")}
                >
                  {incident.severity}
                </span>
              </td>
              <td className="px-3 py-3 text-xs text-muted-foreground">
                {new Date(incident.startedAt).toLocaleTimeString()}
              </td>
              <td className="px-3 py-3 text-foreground">
                {incident.durationMinutes.toFixed(1)}m
              </td>
              <td className="px-3 py-3 text-foreground">{incident.logCount}</td>
              <td className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {incident.status}
              </td>
              <td className="px-3 py-3 font-mono text-[10px] text-muted-foreground">
                {incident.fingerprint}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
