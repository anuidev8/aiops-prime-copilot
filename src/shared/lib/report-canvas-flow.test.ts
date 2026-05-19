import { describe, expect, it } from "vitest";
import { createReportCanvasDocument, updateCanvasBlock } from "./report-canvas";
import { renderCanvasPdf, sanitizePdfFilename } from "./report-pdf";
import { PrimeReportViewModel } from "../types/aiops";

const report: PrimeReportViewModel = {
  generatedAt: "2026-05-18T12:00:00.000Z",
  narrative: "Service health remains stable with one elevated risk area.",
  businessSummary: "Payments latency improved after queue tuning.",
  kpis: [
    {
      name: "MTTR",
      value: 42,
      unit: "m",
      trend: "down",
      description: "Mean time to resolve in minutes.",
    },
    {
      name: "Critical incident rate",
      value: 12,
      unit: "%",
      trend: "flat",
      description: "Share of critical incidents.",
    },
    {
      name: "Auto-handleable rate",
      value: 38,
      unit: "%",
      trend: "up",
      description: "Automation candidate ratio.",
    },
  ],
  projectSummary: {
    projectId: "project-gem",
    projectName: "Project Gem",
    healthScore: 78,
    kpis: [],
    severityMix: [],
    incidentTrend: [],
    recommendation: {
      priority: "P1",
      riskLevel: "medium",
      confidence: 0.82,
      evidence: [],
      immediateAction: "Review retry/backoff policy for payment workers.",
      shortTermAction: "Instrument queue depth alerting.",
      strategicAction: "Adopt adaptive autoscaling guardrails.",
    },
  },
};

describe("report canvas flow", () => {
  it("supports generate, edit, and PDF export in one path", async () => {
    const canvas = createReportCanvasDocument({
      report,
      query: {
        requestedCompanyId: "acme-corp",
        requestedProjectId: "project-gem",
        resolvedCompanyId: "acme-corp",
        resolvedProjectId: "project-gem",
        resolvedProjectName: "Project Gem",
        resolvedServiceCount: 4,
        requestedServices: [],
        analyzedServices: ["auth-service", "payments-api"],
        requestedTimeWindowMinutes: 60,
        resolvedTimeWindowMinutes: 60,
        resolvedWindowFrom: "2026-05-18T11:00:00.000Z",
        resolvedWindowTo: "2026-05-18T12:00:00.000Z",
      },
    });

    const narrativeBlock = canvas.blocks.find(
      (block) => block.type === "text" && block.title === "Executive narrative",
    );
    expect(narrativeBlock?.type).toBe("text");
    if (narrativeBlock?.type === "text") {
      expect(narrativeBlock.content).toContain("Service health");
    }

    const textBlock = canvas.blocks.find((block) => block.type === "text");
    expect(textBlock).toBeDefined();
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Expected at least one text block.");
    }

    const chartBlock = canvas.blocks.find((block) => block.type === "chart");
    expect(chartBlock).toBeDefined();
    if (!chartBlock || chartBlock.type !== "chart") {
      throw new Error("Expected at least one chart block.");
    }

    const textEdited = updateCanvasBlock(canvas, textBlock.id, (block) => {
      if (block.type !== "text") return block;
      return {
        ...block,
        content: "Rewritten summary for executive review.",
      };
    });

    const chartEdited = updateCanvasBlock(textEdited, chartBlock.id, (block) => {
      if (block.type !== "chart") return block;
      return {
        ...block,
        metricName: "MTTR (edited)",
        value: 35,
        unit: "m",
        note: "Improved after targeted worker rollout.",
      };
    });

    const pdf = renderCanvasPdf(chartEdited);
    const pdfText = new TextDecoder().decode(pdf);
    expect(pdfText.startsWith("%PDF-1.4")).toBe(true);
    expect(pdfText).toContain("Rewritten summary for executive review.");
    expect(pdfText).toContain("MTTR \\(edited\\): 35m");
    expect(sanitizePdfFilename("Project Gem Brief (May).pdf")).toBe(
      "Project-Gem-Brief-May-.pdf",
    );
  });
});
