import { randomUUID } from "crypto";
import { EventType as AdkEventType, type StructuredEvent } from "@google/adk";
import { EventType, type BaseEvent } from "@ag-ui/client";

export const COPILOT_BACKEND_TOOL_NAMES = new Set([
  "listProjectOwnership",
  "runTelemetryAgent",
  "runAnalystAgent",
  "runReporterAgent",
  "analyzeLogs",
]);

/** ADK-internal tools (e.g. transfer_to_agent) must not emit AG-UI tool events. */
export function isCopilotBackendTool(toolName: string): boolean {
  return COPILOT_BACKEND_TOOL_NAMES.has(toolName);
}

export type AdkBridgeState = {
  messageId: string;
  toolCalls: Map<string, { name: string; started: boolean; ended: boolean }>;
};

function toolToPipelineAgent(
  toolName: string,
): "scope" | "telemetry" | "analyst" | "reporter" | null {
  if (toolName === "runTelemetryAgent") return "telemetry";
  if (toolName === "runAnalystAgent") return "analyst";
  if (toolName === "runReporterAgent") return "reporter";
  if (toolName === "analyzeLogs") return "scope";
  return null;
}

function buildPredictiveSnapshot(
  toolName: string,
  phase: "started" | "completed",
): Record<string, unknown> {
  const agent = toolToPipelineAgent(toolName);
  const worker =
    agent === "telemetry"
      ? "telemetry_worker"
      : agent === "analyst"
        ? "analyst_worker"
        : agent === "reporter"
          ? "reporter_worker"
          : "coordinator";

  return {
    telemetryRun: {
      status: phase === "started" ? "running" : "done",
      activeWorker: worker,
      phase:
        phase === "started"
          ? `Running ${toolName}…`
          : `${toolName} completed`,
    },
    observed_steps: agent
      ? [
          {
            id: agent,
            label: agent,
            status: phase === "started" ? "running" : "complete",
          },
        ]
      : [],
  };
}

export function* mapAdkStructuredToAgUi(
  structured: StructuredEvent,
  state: AdkBridgeState,
): Generator<BaseEvent> {
  if (structured.type === AdkEventType.CONTENT && structured.content) {
    yield {
      type: EventType.TEXT_MESSAGE_CHUNK,
      role: "assistant",
      messageId: state.messageId,
      delta: structured.content,
    };
    return;
  }

  if (structured.type === AdkEventType.TOOL_CALL && structured.call) {
    const callId = structured.call.id ?? randomUUID();
    const toolName = structured.call.name ?? "unknown_tool";

    if (!isCopilotBackendTool(toolName)) {
      return;
    }

    let toolState = state.toolCalls.get(callId);

    if (!toolState) {
      toolState = { name: toolName, started: false, ended: false };
      state.toolCalls.set(callId, toolState);
    }

    if (!toolState.started) {
      toolState.started = true;
      yield {
        type: EventType.TOOL_CALL_START,
        parentMessageId: state.messageId,
        toolCallId: callId,
        toolCallName: toolName,
      };
      yield {
        type: EventType.STATE_SNAPSHOT,
        snapshot: buildPredictiveSnapshot(toolName, "started"),
      };
    }

    const args =
      typeof structured.call.args === "string"
        ? structured.call.args
        : JSON.stringify(structured.call.args ?? {});

    if (args.length > 0) {
      yield {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: callId,
        delta: args,
      };
    }

    if (!toolState.ended) {
      toolState.ended = true;
      yield {
        type: EventType.TOOL_CALL_END,
        toolCallId: callId,
      };
    }

    return;
  }

  if (structured.type === AdkEventType.TOOL_RESULT && structured.result) {
    const callId = structured.result.id ?? randomUUID();
    const toolState = state.toolCalls.get(callId);

    if (!toolState?.started) {
      return;
    }

    const response =
      structured.result.response ??
      structured.result.name ??
      structured.result;

    let serialized: string;
    try {
      serialized =
        typeof response === "string" ? response : JSON.stringify(response);
    } catch {
      serialized = "[Unserializable ADK tool result]";
    }

    yield {
      type: EventType.TOOL_CALL_RESULT,
      role: "tool",
      messageId: randomUUID(),
      toolCallId: callId,
      content: serialized,
    };

    if (toolState.name) {
      yield {
        type: EventType.STATE_SNAPSHOT,
        snapshot: buildPredictiveSnapshot(toolState.name, "completed"),
      };
    }

    state.toolCalls.delete(callId);
    return;
  }

  if (structured.type === AdkEventType.ERROR) {
    throw structured.error;
  }
}

export function mapAdkStructuredEventsToAgUiForTest(
  structuredEvents: StructuredEvent[],
): BaseEvent[] {
  const state: AdkBridgeState = {
    messageId: "test-message-id",
    toolCalls: new Map(),
  };
  const collected: BaseEvent[] = [];
  for (const structured of structuredEvents) {
    collected.push(...mapAdkStructuredToAgUi(structured, state));
  }
  return collected;
}
