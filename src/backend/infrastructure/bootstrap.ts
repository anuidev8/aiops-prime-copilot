import { AnalyzeLogsUseCase } from "../application/use-cases/analyze-logs-use-case";
import { GenerateBusinessSummaryUseCase } from "../application/use-cases/generate-business-summary-use-case";
import {
  AnalystAgentFactory,
  ReporterAgentFactory,
  TelemetryAgentFactory,
} from "./adk/agent-factories";

export function createAnalyzeLogsUseCase(): AnalyzeLogsUseCase {
  return new AnalyzeLogsUseCase(
    TelemetryAgentFactory.create(),
    AnalystAgentFactory.create(),
    ReporterAgentFactory.create(),
  );
}

export function createGenerateBusinessSummaryUseCase(): GenerateBusinessSummaryUseCase {
  return new GenerateBusinessSummaryUseCase();
}
