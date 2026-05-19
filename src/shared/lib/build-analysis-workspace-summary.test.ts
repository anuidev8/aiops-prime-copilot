import { describe, expect, it } from "vitest";
import { buildAnalysisWorkspaceSummary } from "./build-analysis-workspace-summary";
import { createInitialAgentPipeline } from "../types/analysis-progress";

describe("buildAnalysisWorkspaceSummary", () => {
  it("derives scoped KPIs and marks cost as estimated", () => {
    const summary = buildAnalysisWorkspaceSummary({
      projectCatalog: [
        {
          id: "project-gem",
          companyId: "acme",
          name: "Project Gem",
          serviceNames: ["auth-api", "payments-api"],
        },
      ],
      portfolioHealth: [
        {
          projectId: "project-gem",
          projectName: "Project Gem",
          companyId: "acme",
          healthScore: 72,
          merit: "yellow",
          incidentCount: 2,
          criticalCount: 1,
          mttrMinutes: 42,
          autoHandleableRate: null,
          hasData: true,
          updatedAt: "2026-05-19T00:00:00.000Z",
          source: "copilot",
        },
      ],
      incidents: [
        {
          id: "inc-1",
          service: "payments-api",
          fingerprint: "fp",
          severity: "high",
          startedAt: "2026-05-19T00:00:00.000Z",
          endedAt: "2026-05-19T01:00:00.000Z",
          durationMinutes: 30,
          logCount: 10,
          status: "open",
        },
      ],
      analyses: [],
      primeReport: null,
      selectedProjectId: "project-gem",
      resolvedServiceCount: 2,
      workflowStage: "reading_telemetry",
      agentPipeline: createInitialAgentPipeline(),
      isAnalyzing: true,
    });

    expect(summary.totalProjects).toBe(1);
    expect(summary.totalServices).toBe(2);
    expect(summary.activeIncidents).toBe(1);
    expect(summary.cost.source).toBe("estimated");
    expect(summary.cost.totalUsd).toBe(8540);
    expect(summary.projectRows[0]?.name).toBe("Project Gem");
  });
});
