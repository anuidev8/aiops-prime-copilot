import { describe, expect, it } from "vitest";
import { buildAIOpsWorkspaceState } from "./build-aiops-workspace-state";
import { createInitialAgentPipeline } from "../types/analysis-progress";

describe("buildAIOpsWorkspaceState", () => {
  it("includes viewport, telemetry run, and report draft summary", () => {
    const pipeline = createInitialAgentPipeline().map((step) =>
      step.id === "telemetry"
        ? { ...step, status: "running" as const, detail: "Scanning logs" }
        : step,
    );

    const state = buildAIOpsWorkspaceState({
      navId: "overview",
      reportLayerOpen: true,
      dashboardFocus: {
        scope: "project",
        projectId: "project-gem",
        projectName: "Project Gem",
        source: "copilot",
        updatedAt: "2026-05-19T00:00:00.000Z",
      },
      selectedScope: null,
      workflow: {
        stage: "reading_telemetry",
        source: "copilot",
        detail: "Scanning logs",
        updatedAt: "2026-05-19T00:00:00.000Z",
      },
      agentPipeline: pipeline,
      incidentProgress: null,
      isAnalyzing: true,
      reportCanvas: null,
      reportCanvasGenerating: false,
      reportCanvasMode: "present",
      selectedCanvasBlockId: null,
      reportSectionEditing: false,
      reportSectionReviews: {},
      lastCanvasEdit: null,
      artifactCache: {
        query: null,
        incidents: [],
        analyses: [],
        primeReport: null,
        lastRunMeta: null,
        workspaceMetrics: null,
      },
      projectCatalog: [],
      portfolioHealth: [],
    });

    expect(state.viewport.navId).toBe("overview");
    expect(state.telemetryRun.activeWorker).toBe("telemetry_worker");
    expect(state.telemetryRun.status).toBe("running");
    expect(state.reportDraft.status).toBe("empty");
    expect(state.reportDraft.mode).toBe("present");
    expect(state.reportDraft.selectedBlockId).toBeNull();
    expect(state.reportDraft.lastEdit).toBeNull();
    expect(state.artifactCache.lastRunMeta).toBeNull();
  });
});
