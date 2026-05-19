export type ReportCopilotIntentType = "ask_why" | "help_edit";

export interface ReportCopilotIntent {
  type: ReportCopilotIntentType;
  blockId: string;
  sectionTitle: string;
  blockType: "text" | "chart";
  visualKind?: "kpi" | "bars" | "ring" | "trend";
  requestedAt: string;
}

export type ReportCopilotUiActionType =
  | "approve"
  | "edit"
  | "ask_why"
  | "reject";

export interface ReportCopilotUiAction {
  id: string;
  type: ReportCopilotUiActionType;
  blockId: string;
  sectionTitle: string;
  blockType: "text" | "chart";
  visualKind?: "kpi" | "bars" | "ring" | "trend";
  triggeredAt: string;
}
