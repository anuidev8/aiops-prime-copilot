import { TimeWindow } from "../../domain/common/value-objects/time-window";
import { Analysis } from "../../domain/aiops-analysis/entities/analysis";
import { Incident } from "../../domain/observability/entities/incident";
import { PrimeReport } from "../../domain/prime-reporting/entities/prime-report";

export interface TelemetryAgent {
  detectIncidents(input: {
    serviceNames?: string[];
    timeWindow?: TimeWindow;
  }): Promise<Incident[]>;
}

export interface AIOpsAnalystAgent {
  analyzeIncidents(input: {
    incidents: Incident[];
    onIncidentAnalyzed?: (input: {
      analysis: Analysis;
      index: number;
      total: number;
    }) => void;
  }): Promise<Analysis[]>;
}

export interface PrimeReporterAgent {
  buildPrimeReport(input: {
    incidents: Incident[];
    analyses: Analysis[];
    timeWindow: TimeWindow;
  }): Promise<PrimeReport>;
}
