export type SeverityLevel = "critical" | "high" | "medium" | "low";

export interface AnalyzeLogsPayload {
  prompt?: string;
  services?: string[];
  timeWindowMinutes?: number;
}

export interface IncidentViewModel {
  id: string;
  service: string;
  fingerprint: string;
  severity: SeverityLevel;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  logCount: number;
  status: string;
}

export interface AnalysisViewModel {
  incidentId: string;
  summary: string;
  rootCause: {
    hypothesis: string;
    evidence: string[];
    confidence: number;
  };
  remediationPlan: {
    summary: string;
    steps: string[];
    automationCandidate: boolean;
    estimatedMinutes: number;
  };
}

export interface PrimeKpiViewModel {
  name: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "flat";
  description: string;
}

export interface PrimeReportViewModel {
  generatedAt: string;
  narrative: string;
  businessSummary: string;
  kpis: PrimeKpiViewModel[];
}

export type GenerativeUiBlock =
  | { type: "IncidentTable"; props: { incidents: IncidentViewModel[] } }
  | { type: "PrimeKpiCards"; props: { kpis: PrimeKpiViewModel[] } }
  | {
      type: "PrimeNarrative";
      props: { narrative: string; businessSummary: string };
    };

export interface AnalyzeLogsResult {
  query: {
    requestedServices: string[];
    analyzedServices: string[];
    requestedTimeWindowMinutes: number | null;
    resolvedTimeWindowMinutes: number;
    resolvedWindowFrom: string;
    resolvedWindowTo: string;
  };
  incidents: IncidentViewModel[];
  analyses: AnalysisViewModel[];
  primeReport: PrimeReportViewModel;
  ui: GenerativeUiBlock[];
}
