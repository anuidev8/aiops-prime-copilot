import { Analysis } from "../../aiops-analysis/entities/analysis";
import { Incident } from "../../observability/entities/incident";
import { PrimeKpi } from "../../prime-reporting/entities/prime-kpi";

/** Health score weight profile (must total 100). */
export const PROJECT_HEALTH_SCORE_WEIGHTS = {
  mttr: 30,
  criticalIncidentRate: 25,
  autoHandleableRate: 20,
  rootCauseConfidence: 15,
  recurrentIncidentRatio: 10,
} as const;

/**
 * Normalization constants for health-score sub-metrics.
 * These are explicit for auditability and can be tuned per business policy.
 */
export const PROJECT_HEALTH_NORMALIZATION = {
  mttrWorstMinutes: 60,
  criticalRateWorstPercent: 40,
  recurrentRatioWorstPercent: 35,
} as const;

export interface ProjectKpiAggregationResult {
  kpis: PrimeKpi[];
  healthScore: number;
  criticalIncidentRate: number;
  recurrentIncidentRatio: number;
  serviceStabilityCoverage: number;
  projectIncidentVolume: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function percentage(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, current) => sum + current, 0) / values.length;
}

function normalizedInverse(value: number, worstThreshold: number): number {
  if (worstThreshold <= 0) return 0;
  const ratio = clamp(value / worstThreshold, 0, 1);
  return (1 - ratio) * 100;
}

export class ProjectKpiAggregator {
  aggregate(params: {
    incidents: Incident[];
    analyses: Analysis[];
    scopedServiceNames: string[];
  }): ProjectKpiAggregationResult {
    const scopedServices = Array.from(
      new Set(
        params.scopedServiceNames
          .map((service) => service.trim().toLowerCase())
          .filter(Boolean),
      ),
    );

    const fallbackServices = Array.from(
      new Set(params.incidents.map((incident) => incident.service.value())),
    );
    const allServices = scopedServices.length > 0 ? scopedServices : fallbackServices;

    const incidentCount = params.incidents.length;
    const criticalCount = params.incidents.filter(
      (incident) => incident.severity.value() === "critical",
    ).length;

    const autoHandleableRate = percentage(
      params.incidents.filter((incident) => incident.isAutoHandleable()).length,
      incidentCount,
    );

    const rootCauseConfidence = average(
      params.analyses.map((analysis) => analysis.rootCause.confidence * 100),
    );

    const mttr = average(params.incidents.map((incident) => incident.durationMinutes()));

    const byFingerprint = new Map<string, number>();
    for (const incident of params.incidents) {
      byFingerprint.set(
        incident.fingerprint,
        (byFingerprint.get(incident.fingerprint) ?? 0) + 1,
      );
    }

    let recurrentIncidentCount = 0;
    for (const incident of params.incidents) {
      if ((byFingerprint.get(incident.fingerprint) ?? 0) > 1) {
        recurrentIncidentCount += 1;
      }
    }

    const recurrentIncidentRatio = percentage(recurrentIncidentCount, incidentCount);
    const criticalIncidentRate = percentage(criticalCount, incidentCount);

    const criticalServices = new Set(
      params.incidents
        .filter((incident) => incident.severity.value() === "critical")
        .map((incident) => incident.service.value()),
    );

    const stableServiceCount = allServices.filter(
      (service) => !criticalServices.has(service),
    ).length;
    const serviceStabilityCoverage = percentage(stableServiceCount, allServices.length);

    const mttrScore = normalizedInverse(
      mttr,
      PROJECT_HEALTH_NORMALIZATION.mttrWorstMinutes,
    );
    const criticalScore = normalizedInverse(
      criticalIncidentRate,
      PROJECT_HEALTH_NORMALIZATION.criticalRateWorstPercent,
    );
    const recurrentScore = normalizedInverse(
      recurrentIncidentRatio,
      PROJECT_HEALTH_NORMALIZATION.recurrentRatioWorstPercent,
    );

    const weightedScore =
      mttrScore * PROJECT_HEALTH_SCORE_WEIGHTS.mttr +
      criticalScore * PROJECT_HEALTH_SCORE_WEIGHTS.criticalIncidentRate +
      clamp(autoHandleableRate, 0, 100) * PROJECT_HEALTH_SCORE_WEIGHTS.autoHandleableRate +
      clamp(rootCauseConfidence, 0, 100) *
        PROJECT_HEALTH_SCORE_WEIGHTS.rootCauseConfidence +
      recurrentScore * PROJECT_HEALTH_SCORE_WEIGHTS.recurrentIncidentRatio;

    const healthScore = round(weightedScore / 100);

    const kpis: PrimeKpi[] = [
      new PrimeKpi(
        "Project Incident Volume",
        incidentCount,
        "incidents",
        incidentCount > 5 ? "down" : "flat",
        "Total incidents attributed to the selected project scope.",
      ),
      new PrimeKpi(
        "Critical Incident Rate",
        round(criticalIncidentRate),
        "%",
        criticalIncidentRate > 20 ? "down" : "flat",
        "Share of incidents classified as critical severity.",
      ),
      new PrimeKpi(
        "Service Stability Coverage",
        round(serviceStabilityCoverage),
        "%",
        serviceStabilityCoverage >= 80 ? "up" : "down",
        "Percent of in-scope services with zero critical incidents.",
      ),
      new PrimeKpi(
        "Recurrent Incident Ratio",
        round(recurrentIncidentRatio),
        "%",
        recurrentIncidentRatio > 15 ? "down" : "flat",
        "Portion of incidents that repeat an existing fingerprint.",
      ),
      new PrimeKpi(
        "Project Health Score",
        healthScore,
        "/100",
        healthScore >= 75 ? "up" : healthScore < 50 ? "down" : "flat",
        "Weighted project reliability score from MTTR, severity, automation, confidence, and recurrence.",
      ),
    ];

    return {
      kpis,
      healthScore,
      criticalIncidentRate: round(criticalIncidentRate),
      recurrentIncidentRatio: round(recurrentIncidentRatio),
      serviceStabilityCoverage: round(serviceStabilityCoverage),
      projectIncidentVolume: incidentCount,
    };
  }
}
