import { AIOpsAnalystAgent, PrimeReporterAgent, TelemetryAgent } from "../../application/contracts/agent-ports";
import { IncidentDetector } from "../../domain/observability/services/incident-detector";
import { AdkTelemetryAgent } from "./telemetry-agent";
import { AdkAIOpsAnalystAgent } from "./adk-analyst-agent";
import { AdkPrimeReporterAgent } from "./adk-prime-reporter-agent";
import { RootCauseAnalyzer } from "../../domain/aiops-analysis/services/root-cause-analyzer";
import { RemediationPlanner } from "../../domain/aiops-analysis/services/remediation-planner";
import { KpiCalculator } from "../../domain/prime-reporting/services/kpi-calculator";
import { PrimeNarrativeBuilder } from "../../domain/prime-reporting/services/prime-narrative-builder";

export class TelemetryAgentFactory {
  static create(): TelemetryAgent {
    const incidentDetector = new IncidentDetector();

    return new AdkTelemetryAgent(incidentDetector);
  }
}

export class AnalystAgentFactory {
  static create(): AIOpsAnalystAgent {
    const rootCauseAnalyzer = new RootCauseAnalyzer();
    const remediationPlanner = new RemediationPlanner();

    return new AdkAIOpsAnalystAgent(rootCauseAnalyzer, remediationPlanner);
  }
}

export class ReporterAgentFactory {
  static create(): PrimeReporterAgent {
    const kpiCalculator = new KpiCalculator();
    const narrativeBuilder = new PrimeNarrativeBuilder();

    return new AdkPrimeReporterAgent(kpiCalculator, narrativeBuilder);
  }
}
