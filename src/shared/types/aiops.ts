export type SeverityLevel = "critical" | "high" | "medium" | "low";

export interface SeverityMixSliceViewModel {
  severity: SeverityLevel;
  count: number;
  percentage: number;
}

export interface ProjectIncidentTrendPointViewModel {
  label: string;
  timestamp: string;
  incidentCount: number;
  criticalCount: number;
}

export interface ProjectOwnershipViewModel {
  id: string;
  companyId: string;
  name: string;
  serviceNames: string[];
}

export interface AnalyzeLogsPayload {
  prompt?: string;
  companyId?: string;
  projectId?: string;
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
  projectSummary?: {
    projectId: string;
    projectName: string;
    healthScore: number;
    kpis: PrimeKpiViewModel[];
    severityMix: SeverityMixSliceViewModel[];
    incidentTrend: ProjectIncidentTrendPointViewModel[];
    recommendation: {
      priority: "P0" | "P1" | "P2";
      riskLevel: "high" | "medium" | "low";
      confidence: number;
      evidence: string[];
      immediateAction: string;
      shortTermAction: string;
      strategicAction: string;
    };
  };
  companySummary?: {
    companyId: string;
    companyName: string;
    kpis: PrimeKpiViewModel[];
    topRisks: string[];
    recommendation: {
      priority: "P0" | "P1" | "P2";
      riskLevel: "high" | "medium" | "low";
      confidence: number;
      evidence: string[];
      immediateAction: string;
      shortTermAction: string;
      strategicAction: string;
    };
  };
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
    requestedCompanyId?: string | null;
    requestedProjectId?: string | null;
    resolvedCompanyId?: string | null;
    resolvedProjectId?: string | null;
    resolvedProjectName?: string | null;
    resolvedServiceCount?: number;
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
