import { TimeWindow } from "../../common/value-objects/time-window";
import { Analysis } from "../../aiops-analysis/entities/analysis";
import { Incident } from "../../observability/entities/incident";
import { PrimeKpi } from "../entities/prime-kpi";

export class KpiCalculator {
  compute(params: {
    incidents: Incident[];
    analyses: Analysis[];
    timeWindow: TimeWindow;
  }): PrimeKpi[] {
    const { incidents, analyses, timeWindow } = params;
    const totalIncidents = incidents.length;

    const avgMttrMinutes =
      totalIncidents === 0
        ? 0
        : incidents.reduce((sum, incident) => sum + incident.durationMinutes(), 0) /
          totalIncidents;

    const autoHandleable = incidents.filter((incident) => incident.isAutoHandleable())
      .length;

    const autoHandleableRate =
      totalIncidents === 0 ? 0 : (autoHandleable / totalIncidents) * 100;

    const confidenceAvg =
      analyses.length === 0
        ? 0
        : analyses.reduce((sum, analysis) => sum + analysis.rootCause.confidence, 0) /
          analyses.length;

    const incidentRatePerHour =
      totalIncidents / Math.max(timeWindow.durationMinutes() / 60, 1 / 60);

    return [
      new PrimeKpi(
        "MTTR",
        round(avgMttrMinutes),
        "minutes",
        avgMttrMinutes > 25 ? "down" : "up",
        "Mean Time to Resolve across grouped incidents.",
      ),
      new PrimeKpi(
        "Auto-handleable incident rate",
        round(autoHandleableRate),
        "%",
        autoHandleableRate >= 50 ? "up" : "down",
        "Share of incidents likely resolvable with automation playbooks.",
      ),
      new PrimeKpi(
        "Incident density",
        round(incidentRatePerHour),
        "incidents/hour",
        incidentRatePerHour > 3 ? "down" : "flat",
        "Incident arrival intensity for the selected window.",
      ),
      new PrimeKpi(
        "Root-cause confidence",
        round(confidenceAvg * 100),
        "%",
        confidenceAvg >= 0.7 ? "up" : "flat",
        "Average confidence score for generated root-cause analyses.",
      ),
    ];
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
