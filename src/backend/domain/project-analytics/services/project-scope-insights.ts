import { SeverityLevel } from "../../common/value-objects/severity";
import { TimeWindow } from "../../common/value-objects/time-window";
import { Incident } from "../../observability/entities/incident";

export interface SeverityMixSlice {
  severity: SeverityLevel;
  count: number;
  percentage: number;
}

export interface ProjectIncidentTrendPoint {
  label: string;
  timestamp: string;
  incidentCount: number;
  criticalCount: number;
}

const SEVERITY_ORDER: SeverityLevel[] = ["critical", "high", "medium", "low"];

export function buildSeverityMix(incidents: Incident[]): SeverityMixSlice[] {
  const counts: Record<SeverityLevel, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const incident of incidents) {
    const level = incident.severity.value();
    counts[level] += 1;
  }

  const total = incidents.length;

  return SEVERITY_ORDER.map((severity) => ({
    severity,
    count: counts[severity],
    percentage: total > 0 ? Math.round((counts[severity] / total) * 1000) / 10 : 0,
  }));
}

export function buildIncidentTrend(
  incidents: Incident[],
  timeWindow: TimeWindow,
  bucketCount = 6,
): ProjectIncidentTrendPoint[] {
  const startMs = timeWindow.from.getTime();
  const endMs = timeWindow.to.getTime();
  const spanMs = Math.max(endMs - startMs, 60_000);
  const bucketMs = spanMs / bucketCount;

  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = startMs + index * bucketMs;
    return {
      label: new Date(bucketStart).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: new Date(bucketStart).toISOString(),
      incidentCount: 0,
      criticalCount: 0,
    };
  });

  for (const incident of incidents) {
    const at = incident.startedAt.getTime();
    const rawIndex = Math.floor((at - startMs) / bucketMs);
    const index = Math.min(Math.max(rawIndex, 0), bucketCount - 1);
    buckets[index].incidentCount += 1;
    if (incident.severity.value() === "critical") {
      buckets[index].criticalCount += 1;
    }
  }

  return buckets;
}
