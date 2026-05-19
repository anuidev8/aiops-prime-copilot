/** Scoped telemetry snapshot for the operations workspace (metrics + cost panels). */
export interface WorkspaceTelemetryMetrics {
  requestVolumeK: number;
  errorRatePercent: number;
  latencyP95Ms: number;
  saturationPercent: number;
  availabilityPercent: number;
  estimatedTotalCostUsd: number;
  costWindowLabel: string;
  logLinesProcessed: number;
  serviceCount: number;
  incidentCount: number;
}
