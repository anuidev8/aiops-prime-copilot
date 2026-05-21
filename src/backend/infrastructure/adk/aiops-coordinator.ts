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
import { createCopilotFrontendPassthroughTools } from "./copilot-frontend-tool-bridge";

/** Slim tree for `adk web` / `adk run`. Copilot chat uses `copilot` profile. */
export type AIOpsCoordinatorProfile = "adk-dev" | "copilot";

const coordinatorCache: Partial<Record<AIOpsCoordinatorProfile, LlmAgent>> = {};

export function createAIOpsCoordinatorAgent(
  profile: AIOpsCoordinatorProfile = "adk-dev",
): LlmAgent {
  const cached = coordinatorCache[profile];
  if (cached) {
    return cached;
  }

  const tools = createAIOpsCoordinatorTools({
    runTelemetryUseCase: createRunTelemetryUseCase(),
    runAnalystUseCase: createRunAnalystUseCase(),
    runReporterUseCase: createRunReporterUseCase(),
    projectOwnershipRepository: createProjectOwnershipRepository(),
  });

  const coordinatorTools =
    profile === "copilot"
      ? [
          tools.listProjectOwnershipTool,
          tools.analyzeLogsTool,
          ...createCopilotFrontendPassthroughTools(),
        ]
      : [tools.listProjectOwnershipTool, tools.analyzeLogsTool];

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

  const coordinator = new LlmAgent({
    name: "aiops_coordinator",
    description:
      "AIOps Prime coordinator — routes chat to telemetry, analyst, and reporter workers.",
    model,
    instruction: AIOPS_COORDINATOR_INSTRUCTION,
    tools: coordinatorTools,
    subAgents: [telemetryWorker, analystWorker, reporterWorker],
  });

  coordinatorCache[profile] = coordinator;
  return coordinator;
}

/** @internal Test-only reset for singleton coordinators. */
export function resetAIOpsCoordinatorAgentForTests(): void {
  for (const key of Object.keys(coordinatorCache) as AIOpsCoordinatorProfile[]) {
    delete coordinatorCache[key];
  }
}
