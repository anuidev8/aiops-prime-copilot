import type { AnalyzeLogsResult, IncidentViewModel } from "@/shared/types/aiops";
import type { WorkspaceTelemetryMetrics } from "@/shared/types/workspace-telemetry-metrics";

function severityWeight(severity: IncidentViewModel["severity"]): number {
  if (severity === "critical") return 1;
  if (severity === "high") return 0.85;
  if (severity === "medium") return 0.55;
  return 0.25;
}

export function buildWorkspaceTelemetryMetrics(params: {
  incidents: IncidentViewModel[];
  query: AnalyzeLogsResult["query"] | null;
  resolvedServiceCount: number;
}): WorkspaceTelemetryMetrics {
  const { incidents, query, resolvedServiceCount } = params;
  const serviceCount = Math.max(
    1,
    resolvedServiceCount ||
      query?.analyzedServices.length ||
      query?.requestedServices.length ||
      1,
  );
  const windowMinutes = query?.resolvedTimeWindowMinutes ?? 60;
  const windowLabel =
    windowMinutes >= 24 * 60
      ? `Last ${Math.round(windowMinutes / (24 * 60))} days`
      : `Last ${windowMinutes} min`;

  const logLinesProcessed = incidents.reduce(
    (sum, incident) => sum + Math.max(incident.logCount, 1),
    0,
  );

  const requestVolumeK = Math.round((logLinesProcessed / 1000) * 10) / 10;

  const errorRatePercent =
    incidents.length === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            (incidents.filter((incident) => incident.severity !== "low").length /
              incidents.length) *
              1000,
          ) / 10,
        );

  const latencyP95Ms =
    incidents.length === 0
      ? 0
      : Math.round(
          incidents.reduce(
            (sum, incident) => sum + incident.durationMinutes * 12 * severityWeight(incident.severity),
            0,
          ) / incidents.length,
        );

  const saturationPercent =
    incidents.length === 0
      ? 0
      : Math.min(99, Math.round(42 + incidents.length * 4 + serviceCount * 2));

  const availabilityPercent =
    incidents.length === 0
      ? 100
      : Math.max(85, Math.round(100 - errorRatePercent / 8 - incidents.length * 0.5));

  const scopeFactor = serviceCount / 12;
  const incidentFactor = 1 + incidents.length * 0.12 + errorRatePercent / 100;
  const windowFactor = Math.max(0.05, windowMinutes / (7 * 24 * 60));
  const estimatedTotalCostUsd = Math.round(
    8540 * scopeFactor * incidentFactor * Math.max(0.35, windowFactor * 7),
  );

  return {
    requestVolumeK,
    errorRatePercent,
    latencyP95Ms,
    saturationPercent,
    availabilityPercent,
    estimatedTotalCostUsd,
    costWindowLabel: windowLabel,
    logLinesProcessed,
    serviceCount,
    incidentCount: incidents.length,
  };
}
