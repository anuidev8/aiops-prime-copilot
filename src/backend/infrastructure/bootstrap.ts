import { AnalyzeLogsUseCase } from "../application/use-cases/analyze-logs-use-case";
import { GenerateBusinessSummaryUseCase } from "../application/use-cases/generate-business-summary-use-case";
import { RunAnalystUseCase } from "../application/use-cases/run-analyst-use-case";
import { RunReporterUseCase } from "../application/use-cases/run-reporter-use-case";
import { RunTelemetryUseCase } from "../application/use-cases/run-telemetry-use-case";
import { InMemoryProjectOwnershipRepository } from "./repositories/in-memory-project-ownership-repository";
import {
  AnalystAgentFactory,
  ReporterAgentFactory,
  TelemetryAgentFactory,
} from "./adk/agent-factories";

function createAgents() {
  const telemetry = TelemetryAgentFactory.create();
  const analyst = AnalystAgentFactory.create();
  const reporter = ReporterAgentFactory.create();
  return { telemetry, analyst, reporter };
}

export function createProjectOwnershipRepository(): InMemoryProjectOwnershipRepository {
  return new InMemoryProjectOwnershipRepository();
}

export function createAnalyzeLogsUseCase(): AnalyzeLogsUseCase {
  const { telemetry, analyst, reporter } = createAgents();
  return new AnalyzeLogsUseCase(
    telemetry,
    analyst,
    reporter,
    createProjectOwnershipRepository(),
  );
}

export function createRunTelemetryUseCase(): RunTelemetryUseCase {
  return new RunTelemetryUseCase(
    TelemetryAgentFactory.create(),
    createProjectOwnershipRepository(),
  );
}

export function createRunAnalystUseCase(): RunAnalystUseCase {
  const { telemetry, analyst } = createAgents();
  return new RunAnalystUseCase(analyst, telemetry);
}

export function createRunReporterUseCase(): RunReporterUseCase {
  return new RunReporterUseCase(ReporterAgentFactory.create());
}

export function createGenerateBusinessSummaryUseCase(): GenerateBusinessSummaryUseCase {
  return new GenerateBusinessSummaryUseCase();
}
