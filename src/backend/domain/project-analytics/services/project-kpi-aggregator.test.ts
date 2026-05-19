import { describe, expect, it } from "vitest";
import { Analysis } from "../../aiops-analysis/entities/analysis";
import { RemediationPlan } from "../../aiops-analysis/entities/remediation-plan";
import { RootCause } from "../../aiops-analysis/entities/root-cause";
import { ServiceName } from "../../common/value-objects/service-name";
import { Severity } from "../../common/value-objects/severity";
import { Incident } from "../../observability/entities/incident";
import { LogEntry } from "../../observability/entities/log-entry";
import {
  PROJECT_HEALTH_SCORE_WEIGHTS,
  ProjectKpiAggregator,
} from "./project-kpi-aggregator";

function makeIncident(input: {
  id: string;
  service: string;
  fingerprint: string;
  severity: Severity;
  startedAt: Date;
  endedAt: Date;
  logCount: number;
}): Incident {
  const logs = Array.from({ length: input.logCount }).map(
    (_, index) =>
      new LogEntry(
        `${input.id}-log-${index}`,
        new Date(input.startedAt.getTime() + index * 1000),
        ServiceName.from(input.service),
        input.severity,
        `log-${index}`,
      ),
  );

  return new Incident(
    input.id,
    ServiceName.from(input.service),
    input.fingerprint,
    input.severity,
    input.startedAt,
    input.endedAt,
    logs,
    "closed",
  );
}

function makeAnalysis(incidentId: string, confidence: number): Analysis {
  return new Analysis(
    incidentId,
    new RootCause("dependency hotspot", ["trace"], confidence),
    new RemediationPlan("apply guardrail", ["step-1"], true, 10),
    "summary",
  );
}

describe("ProjectKpiAggregator", () => {
  it("uses an explicit 100-point weight profile", () => {
    const weightTotal = Object.values(PROJECT_HEALTH_SCORE_WEIGHTS).reduce(
      (sum, value) => sum + value,
      0,
    );

    expect(weightTotal).toBe(100);
  });

  it("computes project KPI rollups and bounded health score", () => {
    const aggregator = new ProjectKpiAggregator();
    const now = new Date("2026-05-18T12:00:00.000Z");

    const incidents = [
      makeIncident({
        id: "inc-1",
        service: "auth-api",
        fingerprint: "db-timeout",
        severity: Severity.critical(),
        startedAt: new Date(now.getTime() - 30 * 60_000),
        endedAt: now,
        logCount: 8,
      }),
      makeIncident({
        id: "inc-2",
        service: "payments-api",
        fingerprint: "db-timeout",
        severity: Severity.critical(),
        startedAt: new Date(now.getTime() - 20 * 60_000),
        endedAt: new Date(now.getTime() - 5 * 60_000),
        logCount: 15,
      }),
      makeIncident({
        id: "inc-3",
        service: "worker-sync",
        fingerprint: "queue-lag",
        severity: Severity.high(),
        startedAt: new Date(now.getTime() - 15 * 60_000),
        endedAt: new Date(now.getTime() - 10 * 60_000),
        logCount: 6,
      }),
      makeIncident({
        id: "inc-4",
        service: "notifications",
        fingerprint: "smtp-rate-limit",
        severity: Severity.medium(),
        startedAt: new Date(now.getTime() - 10 * 60_000),
        endedAt: new Date(now.getTime() - 2 * 60_000),
        logCount: 4,
      }),
    ];

    const analyses = incidents.map((incident, index) =>
      makeAnalysis(incident.id, 0.6 + index * 0.1),
    );

    const result = aggregator.aggregate({
      incidents,
      analyses,
      scopedServiceNames: [
        "auth-api",
        "payments-api",
        "worker-sync",
        "notifications",
      ],
    });

    expect(result.projectIncidentVolume).toBe(4);
    expect(result.criticalIncidentRate).toBe(50);
    expect(result.recurrentIncidentRatio).toBe(50);
    expect(result.serviceStabilityCoverage).toBe(50);
    expect(result.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.healthScore).toBeLessThanOrEqual(100);
    expect(result.kpis.map((kpi) => kpi.name)).toEqual([
      "Project Incident Volume",
      "Critical Incident Rate",
      "Service Stability Coverage",
      "Recurrent Incident Ratio",
      "Project Health Score",
    ]);
  });
});
