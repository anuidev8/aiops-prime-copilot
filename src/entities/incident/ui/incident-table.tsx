import { IncidentViewModel } from "@/shared/types/aiops";

interface IncidentTableProps {
  incidents: IncidentViewModel[];
}

function severityBadgeClass(severity: IncidentViewModel["severity"]): string {
  switch (severity) {
    case "critical":
      return "bg-rose-100 text-rose-700";
    case "high":
      return "bg-orange-100 text-orange-700";
    case "medium":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function IncidentTable({ incidents }: IncidentTableProps) {
  if (incidents.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-600">
        No incidents detected for the selected scope.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-2 py-2">Service</th>
            <th className="px-2 py-2">Severity</th>
            <th className="px-2 py-2">Started</th>
            <th className="px-2 py-2">Duration</th>
            <th className="px-2 py-2">Logs</th>
            <th className="px-2 py-2">Status</th>
            <th className="px-2 py-2">Fingerprint</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <tr key={incident.id} className="border-t border-slate-100">
              <td className="px-2 py-2 font-medium text-slate-800">{incident.service}</td>
              <td className="px-2 py-2">
                <span
                  className={[
                    "rounded-full px-2 py-1 text-xs font-semibold",
                    severityBadgeClass(incident.severity),
                  ].join(" ")}
                >
                  {incident.severity}
                </span>
              </td>
              <td className="px-2 py-2 text-xs text-slate-600">
                {new Date(incident.startedAt).toLocaleTimeString()}
              </td>
              <td className="px-2 py-2 text-slate-700">
                {incident.durationMinutes.toFixed(1)}m
              </td>
              <td className="px-2 py-2 text-slate-700">{incident.logCount}</td>
              <td className="px-2 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                {incident.status}
              </td>
              <td className="px-2 py-2 font-mono text-xs text-slate-500">
                {incident.fingerprint}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
