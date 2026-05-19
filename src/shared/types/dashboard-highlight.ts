export type DashboardHighlightSection =
  | "kpis"
  | "telemetry-scope"
  | "generative-ui"
  | "projects"
  | "services"
  | "metrics"
  | "cost"
  | "service-status"
  | "insights";

export interface DashboardHighlightState {
  revision: number;
  sections: DashboardHighlightSection[];
  triggeredAt: string;
  source: "copilot" | "manual" | "system";
}

export function sectionsForCopilotTool(
  toolName: string,
): DashboardHighlightSection[] {
  if (toolName === "runTelemetryAgent") {
    return [
      "kpis",
      "projects",
      "services",
      "metrics",
      "cost",
      "service-status",
    ];
  }
  if (toolName === "runAnalystAgent") {
    return ["kpis", "insights", "generative-ui", "metrics", "service-status"];
  }
  if (toolName === "runReporterAgent" || toolName === "analyzeLogs") {
    return ["kpis", "generative-ui", "metrics", "cost", "insights"];
  }
  return ["kpis", "metrics"];
}
