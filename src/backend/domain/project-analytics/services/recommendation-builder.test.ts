import { describe, expect, it } from "vitest";
import { RecommendationBuilder } from "./recommendation-builder";

describe("RecommendationBuilder", () => {
  it("returns high-priority recommendations for high-risk projects", () => {
    const builder = new RecommendationBuilder();

    const recommendation = builder.build({
      healthScore: 42,
      criticalIncidentRate: 35,
      recurrentIncidentRatio: 22,
      serviceStabilityCoverage: 48,
    });

    expect(recommendation.priority).toBe("P0");
    expect(recommendation.riskLevel).toBe("high");
    expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
    expect(recommendation.confidence).toBeLessThanOrEqual(100);
  });

  it("returns low-priority recommendations for stable projects", () => {
    const builder = new RecommendationBuilder();

    const recommendation = builder.build({
      healthScore: 89,
      criticalIncidentRate: 4,
      recurrentIncidentRatio: 3,
      serviceStabilityCoverage: 95,
    });

    expect(recommendation.priority).toBe("P2");
    expect(recommendation.riskLevel).toBe("low");
    expect(recommendation.confidence).toBeGreaterThan(70);
  });
});
