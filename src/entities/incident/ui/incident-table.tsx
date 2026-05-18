import { IncidentViewModel } from "@/shared/types/aiops";

interface IncidentTableProps {
  incidents: IncidentViewModel[];
}

function severityBadgeClass(severity: IncidentViewModel["severity"]): string {
  switch (severity) {
    case "critical":
      return "bg-rose-500/20 text-rose-400 border border-rose-500/30";
    case "high":
      return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    case "medium":
      return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
  }
}

export function IncidentTable({ incidents }: IncidentTableProps) {
  if (incidents.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-3 text-sm text-slate-500">
        No incidents detected for the selected scope.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-[#0f172a]/40 backdrop-blur-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-900/60 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-800/60">
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
        <tbody className="divide-y divide-slate-800/60">
          {incidents.map((incident) => (
            <tr key={incident.id} className="hover:bg-slate-800/20 transition-colors">
              <td className="px-3 py-3 font-medium text-slate-300">{incident.service}</td>
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
              <td className="px-3 py-3 text-xs text-slate-400">
                {new Date(incident.startedAt).toLocaleTimeString()}
              </td>
              <td className="px-3 py-3 text-slate-300">
                {incident.durationMinutes.toFixed(1)}m
              </td>
              <td className="px-3 py-3 text-slate-300">{incident.logCount}</td>
              <td className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                {incident.status}
              </td>
              <td className="px-3 py-3 font-mono text-[10px] text-slate-500">
                {incident.fingerprint}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
