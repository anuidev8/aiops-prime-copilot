import { PrimeRecommendation } from "../../prime-reporting/entities/prime-report";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export class RecommendationBuilder {
  build(params: {
    healthScore: number;
    criticalIncidentRate: number;
    recurrentIncidentRatio: number;
    serviceStabilityCoverage: number;
  }): PrimeRecommendation {
    const confidence = round(
      clamp(
        params.serviceStabilityCoverage * 0.4 +
          (100 - params.criticalIncidentRate) * 0.3 +
          (100 - params.recurrentIncidentRatio) * 0.2 +
          params.healthScore * 0.1,
        0,
        100,
      ),
    );

    const evidence = [
      `Health score: ${params.healthScore}/100`,
      `Critical incident rate: ${params.criticalIncidentRate}%`,
      `Recurrent incident ratio: ${params.recurrentIncidentRatio}%`,
      `Service stability coverage: ${params.serviceStabilityCoverage}%`,
    ];

    if (params.healthScore < 50 || params.criticalIncidentRate > 25) {
      return {
        priority: "P0",
        riskLevel: "high",
        confidence,
        evidence,
        immediateAction:
          "Within 24h: enforce on-call escalation, isolate top failing dependency paths, and pre-approve rollback playbooks.",
        shortTermAction:
          "Within 7 days: reduce critical exposure by hardening top incident fingerprints and increasing guardrail alerts.",
        strategicAction:
          "Within 30 days: formalize reliability SLO burn controls and automate remediation for repeat critical patterns.",
      };
    }

    if (params.healthScore < 75 || params.recurrentIncidentRatio > 15) {
      return {
        priority: "P1",
        riskLevel: "medium",
        confidence,
        evidence,
        immediateAction:
          "Within 24h: target recurrent fingerprints with owner assignment and confirm runbook freshness.",
        shortTermAction:
          "Within 7 days: expand auto-remediation for frequent failure signatures and tighten recovery verification.",
        strategicAction:
          "Within 30 days: refine architecture resilience for noisy components and standardize incident postmortem actions.",
      };
    }

    return {
      priority: "P2",
      riskLevel: "low",
      confidence,
      evidence,
      immediateAction:
        "Within 24h: continue monitoring and validate alert fidelity for early anomaly detection.",
      shortTermAction:
        "Within 7 days: convert successful fixes into reusable playbooks and track automation adoption.",
      strategicAction:
        "Within 30 days: optimize reliability investment toward proactive testing and capacity safeguards.",
    };
  }
}
