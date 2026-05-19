import { SeverityLevel } from "../../domain/common/value-objects/severity";
import {
  ProjectIncidentTrendPoint,
  SeverityMixSlice,
} from "../../domain/project-analytics/services/project-scope-insights";

export interface AnalyzeLogsCommand {
  prompt?: string;
  companyId?: string;
  projectId?: string;
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
  projectSummary?: {
    projectId: string;
    projectName: string;
    healthScore: number;
    kpis: PrimeKpiDto[];
    severityMix: SeverityMixSlice[];
    incidentTrend: ProjectIncidentTrendPoint[];
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
    kpis: PrimeKpiDto[];
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
    }
  | {
      type: "ProjectHealthCards";
      props: {
        projectName: string;
        healthScore: number;
        kpis: PrimeKpiDto[];
      };
    }
  | {
      type: "ProjectSeverityDonut";
      props: { severityMix: SeverityMixSlice[] };
    }
  | {
      type: "ProjectServiceBarChart";
      props: { kpis: PrimeKpiDto[] };
    }
  | {
      type: "ProjectIncidentTrendChart";
      props: { points: ProjectIncidentTrendPoint[] };
    }
  | {
      type: "RecommendationCard";
      props: {
        title: string;
        priority: "P0" | "P1" | "P2";
        riskLevel: "high" | "medium" | "low";
        content: string;
      };
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
  incidents: IncidentDto[];
  analyses: AnalysisDto[];
  primeReport: PrimeReportDto;
  ui: GenerativeUiBlock[];
}
