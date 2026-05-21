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

/** Visual theme when Copilot pulses dashboard sections after a tool run. */
export type DashboardHighlightKind =
  | "telemetry"
  | "analyst"
  | "reporter"
  | "pipeline"
  | "default";

export interface DashboardHighlightState {
  revision: number;
  sections: DashboardHighlightSection[];
  kind: DashboardHighlightKind;
  triggeredAt: string;
  source: "copilot" | "manual" | "system";
}

export function kindForCopilotTool(toolName: string): DashboardHighlightKind {
  if (toolName === "runTelemetryAgent") return "telemetry";
  if (toolName === "runAnalystAgent") return "analyst";
  if (toolName === "runReporterAgent") return "reporter";
  if (toolName === "analyzeLogs") return "pipeline";
  return "default";
}

export function highlightDurationMs(kind: DashboardHighlightKind): number {
  switch (kind) {
    case "telemetry":
      return 2800;
    case "analyst":
      return 3600;
    case "reporter":
      return 3200;
    case "pipeline":
      return 4000;
    default:
      return 2600;
  }
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
