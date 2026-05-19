import { LlmAgent } from "@google/adk";
import {
  createProjectOwnershipRepository,
  createRunAnalystUseCase,
  createRunReporterUseCase,
  createRunTelemetryUseCase,
} from "../bootstrap";
import { resolveAdkGeminiModel } from "./adk-model";
import {
  AIOPS_COORDINATOR_INSTRUCTION,
  ANALYST_WORKER_INSTRUCTION,
  REPORTER_WORKER_INSTRUCTION,
  TELEMETRY_WORKER_INSTRUCTION,
} from "./aiops-coordinator-prompt";
import { createAIOpsCoordinatorTools } from "./aiops-coordinator-tools";

let cachedCoordinator: LlmAgent | null = null;

export function createAIOpsCoordinatorAgent(): LlmAgent {
  if (cachedCoordinator) {
    return cachedCoordinator;
  }

  const runTelemetryUseCase = createRunTelemetryUseCase();
  const runAnalystUseCase = createRunAnalystUseCase();
  const runReporterUseCase = createRunReporterUseCase();
  const projectOwnershipRepository = createProjectOwnershipRepository();

  const tools = createAIOpsCoordinatorTools({
    runTelemetryUseCase,
    runAnalystUseCase,
    runReporterUseCase,
    projectOwnershipRepository,
  });

  const model = resolveAdkGeminiModel();

  const telemetryWorker = new LlmAgent({
    name: "telemetry_worker",
    description:
      "Detects incidents from observability telemetry for a company/project scope.",
    model,
    instruction: TELEMETRY_WORKER_INSTRUCTION,
    tools: [tools.runTelemetryAgentTool],
    disallowTransferToPeers: true,
  });

  const analystWorker = new LlmAgent({
    name: "analyst_worker",
    description:
      "Runs root-cause and remediation analysis on incidents already in the session cache.",
    model,
    instruction: ANALYST_WORKER_INSTRUCTION,
    tools: [tools.runAnalystAgentTool],
    disallowTransferToPeers: true,
  });

  const reporterWorker = new LlmAgent({
    name: "reporter_worker",
    description:
      "Builds PRIME KPIs and executive narrative from cached incidents and analyses.",
    model,
    instruction: REPORTER_WORKER_INSTRUCTION,
    tools: [tools.runReporterAgentTool],
    disallowTransferToPeers: true,
  });

  cachedCoordinator = new LlmAgent({
    name: "aiops_coordinator",
    description:
      "AIOps Prime coordinator — routes chat to telemetry, analyst, and reporter workers.",
    model,
    instruction: AIOPS_COORDINATOR_INSTRUCTION,
    tools: [tools.listProjectOwnershipTool, tools.analyzeLogsTool],
    subAgents: [telemetryWorker, analystWorker, reporterWorker],
  });

  return cachedCoordinator;
}

/** @internal Test-only reset for singleton coordinator. */
export function resetAIOpsCoordinatorAgentForTests(): void {
  cachedCoordinator = null;
}
