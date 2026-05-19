import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import {
  createAIOpsCopilotAgent,
  describeAIOpsCopilotOrchestrator,
} from "./create-aiops-copilot-agent";

export const dynamic = "force-dynamic";

const aiopsCopilotAgent = createAIOpsCopilotAgent();

const runtime = new CopilotRuntime({
  agents: {
    default: aiopsCopilotAgent,
  },
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
});

export { handler as POST, describeAIOpsCopilotOrchestrator };
