import { SeverityLevel } from "../../domain/common/value-objects/severity";

export interface AnalyzeLogsCommand {
  prompt?: string;
  services?: string[];
  timeWindowMinutes?: number;
}

export interface IncidentDto {
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

export interface AnalysisDto {
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

export interface PrimeKpiDto {
  name: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "flat";
  description: string;
}

export interface PrimeReportDto {
  generatedAt: string;
  narrative: string;
  businessSummary: string;
  kpis: PrimeKpiDto[];
}

export type GenerativeUiBlock =
  | {
      type: "IncidentTable";
      props: { incidents: IncidentDto[] };
    }
  | {
      type: "PrimeKpiCards";
      props: { kpis: PrimeKpiDto[] };
    }
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
  incidents: IncidentDto[];
  analyses: AnalysisDto[];
  primeReport: PrimeReportDto;
  ui: GenerativeUiBlock[];
}
