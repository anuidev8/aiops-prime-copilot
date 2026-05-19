import { describe, expect, it } from "vitest";
import { Severity } from "../../common/value-objects/severity";
import { ServiceName } from "../../common/value-objects/service-name";
import { TimeWindow } from "../../common/value-objects/time-window";
import { Incident } from "../../observability/entities/incident";
import { buildIncidentTrend, buildSeverityMix } from "./project-scope-insights";

function incident(severity: "critical" | "high" | "medium" | "low", startedAt: Date): Incident {
  return new Incident(
    `inc-${startedAt.getTime()}`,
    new ServiceName("auth-api"),
    "fp-1",
    new Severity(severity),
    startedAt,
    startedAt,
    [],
    "open",
  );
}

describe("buildSeverityMix", () => {
  it("returns percentage distribution across severities", () => {
    const mix = buildSeverityMix([
      incident("critical", new Date("2026-05-18T10:00:00Z")),
      incident("high", new Date("2026-05-18T10:05:00Z")),
      incident("critical", new Date("2026-05-18T10:10:00Z")),
    ]);

    expect(mix.find((slice) => slice.severity === "critical")?.count).toBe(2);
    expect(mix.find((slice) => slice.severity === "critical")?.percentage).toBe(66.7);
    expect(mix.find((slice) => slice.severity === "low")?.count).toBe(0);
  });
});

describe("buildIncidentTrend", () => {
  it("buckets incidents across the analysis window", () => {
    const window = new TimeWindow(
      new Date("2026-05-18T10:00:00Z"),
      new Date("2026-05-18T11:00:00Z"),
    );

    const trend = buildIncidentTrend(
      [
        incident("critical", new Date("2026-05-18T10:05:00Z")),
        incident("medium", new Date("2026-05-18T10:50:00Z")),
      ],
      window,
      4,
    );

    expect(trend).toHaveLength(4);
    expect(trend.reduce((sum, point) => sum + point.incidentCount, 0)).toBe(2);
    expect(trend.some((point) => point.criticalCount > 0)).toBe(true);
  });
});
