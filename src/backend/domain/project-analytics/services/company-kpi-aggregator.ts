import { PrimeKpi } from "../../prime-reporting/entities/prime-kpi";
import { ProjectKpiAggregationResult } from "./project-kpi-aggregator";

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export class CompanyKpiAggregator {
  aggregate(params: {
    projectKpis: ProjectKpiAggregationResult;
    companyServiceCount: number;
  }): { kpis: PrimeKpi[]; topRisks: string[] } {
    const project = params.projectKpis;

    const kpis: PrimeKpi[] = [
      new PrimeKpi(
        "Company Critical Incident Rate",
        project.criticalIncidentRate,
        "%",
        project.criticalIncidentRate > 20 ? "down" : "flat",
        "Critical incident pressure across the current company scope.",
      ),
      new PrimeKpi(
        "Company Service Stability Coverage",
        project.serviceStabilityCoverage,
        "%",
        project.serviceStabilityCoverage >= 80 ? "up" : "down",
        "Stable service coverage for services mapped to the selected company scope.",
      ),
      new PrimeKpi(
        "Company Recurrent Incident Ratio",
        project.recurrentIncidentRatio,
        "%",
        project.recurrentIncidentRatio > 15 ? "down" : "flat",
        "Recurring incident footprint across company projects.",
      ),
      new PrimeKpi(
        "Company Health Proxy",
        project.healthScore,
        "/100",
        project.healthScore >= 75 ? "up" : project.healthScore < 50 ? "down" : "flat",
        "Current company-level proxy based on scoped incident evidence.",
      ),
      new PrimeKpi(
        "Company Service Count",
        round(params.companyServiceCount),
        "services",
        "flat",
        "Total known services in the selected company scope.",
      ),
    ];

    const topRisks: string[] = [];

    if (project.criticalIncidentRate > 20) {
      topRisks.push("Critical incident rate is above 20%.");
    }

    if (project.recurrentIncidentRatio > 15) {
      topRisks.push("Recurring incident fingerprints exceed 15% of total incidents.");
    }

    if (project.serviceStabilityCoverage < 80) {
      topRisks.push("Stable service coverage is below 80%.");
    }

    if (topRisks.length === 0) {
      topRisks.push("No immediate company-level risk concentration detected in current scope.");
    }

    return { kpis, topRisks };
  }
}
