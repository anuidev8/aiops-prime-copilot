import { PrimeKpi } from "../entities/prime-kpi";

export class PrimeNarrativeBuilder {
  buildNarrative(kpis: PrimeKpi[]): string {
    const mttr = kpis.find((kpi) => kpi.name === "MTTR")?.value ?? 0;
    const automationRate =
      kpis.find((kpi) => kpi.name === "Auto-handleable incident rate")?.value ?? 0;
    const incidentDensity =
      kpis.find((kpi) => kpi.name === "Incident density")?.value ?? 0;

    return [
      `Operational reliability remains ${mttr <= 20 ? "stable" : "stressed"} with MTTR at ${mttr} minutes.`,
      `Automation readiness is ${automationRate}% of observed incidents, signaling ${automationRate >= 50 ? "good" : "limited"} auto-remediation coverage.`,
      `Incident inflow is ${incidentDensity} incidents/hour, requiring ${incidentDensity > 3 ? "immediate capacity guardrails" : "ongoing monitoring"}.`,
    ].join(" ");
  }

  buildBusinessSummary(kpis: PrimeKpi[]): string {
    const mttr = kpis.find((kpi) => kpi.name === "MTTR")?.value ?? 0;
    const confidence =
      kpis.find((kpi) => kpi.name === "Root-cause confidence")?.value ?? 0;

    return [
      `Service interruption handling currently averages ${mttr} minutes.`,
      `Root-cause confidence is ${confidence}%, which should guide escalation confidence for business stakeholders.`,
      "Recommended focus: reduce manual intervention by expanding automation on recurrent failure signatures.",
    ].join(" ");
  }
}
