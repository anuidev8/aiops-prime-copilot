import { TimeWindow } from "../../common/value-objects/time-window";
import {
  ProjectIncidentTrendPoint,
  SeverityMixSlice,
} from "../../project-analytics/services/project-scope-insights";
import { PrimeKpi } from "./prime-kpi";

export type RecommendationPriority = "P0" | "P1" | "P2";
export type RecommendationRiskLevel = "high" | "medium" | "low";

export interface PrimeRecommendation {
  priority: RecommendationPriority;
  riskLevel: RecommendationRiskLevel;
  confidence: number;
  evidence: string[];
  immediateAction: string;
  shortTermAction: string;
  strategicAction: string;
}

export interface ProjectPrimeSummary {
  projectId: string;
  projectName: string;
  healthScore: number;
  kpis: PrimeKpi[];
  recommendation: PrimeRecommendation;
  severityMix: SeverityMixSlice[];
  incidentTrend: ProjectIncidentTrendPoint[];
}

export interface CompanyPrimeSummary {
  companyId: string;
  companyName: string;
  kpis: PrimeKpi[];
  topRisks: string[];
  recommendation: PrimeRecommendation;
}

export class PrimeReport {
  constructor(
    public readonly generatedAt: Date,
    public readonly timeWindow: TimeWindow,
    public readonly kpis: PrimeKpi[],
    public readonly narrative: string,
    public readonly businessSummary: string,
    public readonly projectSummary?: ProjectPrimeSummary,
    public readonly companySummary?: CompanyPrimeSummary,
  ) {}
}
