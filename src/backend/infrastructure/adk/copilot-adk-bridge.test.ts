import { describe, expect, it } from "vitest";
import { EventType as AdkEventType } from "@google/adk";
import { EventType } from "@ag-ui/client";
import { mapAdkStructuredEventsToAgUiForTest } from "./copilot-adk-bridge-mapper";

describe("copilot-adk-bridge AG-UI tool events", () => {
  it("does not emit TOOL_CALL_ARGS for ADK-internal transfer_to_agent", () => {
    const events = mapAdkStructuredEventsToAgUiForTest([
      {
        type: AdkEventType.TOOL_CALL,
        call: {
          id: "adk-72ec2f72-be6e-4d49-b775-23764403faa5",
          name: "transfer_to_agent",
          args: { agent_name: "telemetry_worker" },
        },
      },
    ]);

    expect(events.some((event) => event.type === EventType.TOOL_CALL_START)).toBe(
      false,
    );
    expect(events.some((event) => event.type === EventType.TOOL_CALL_ARGS)).toBe(
      false,
    );
  });

  it("emits START, ARGS, END for runTelemetryAgent", () => {
    const events = mapAdkStructuredEventsToAgUiForTest([
      {
        type: AdkEventType.TOOL_CALL,
        call: {
          id: "call-1",
          name: "runTelemetryAgent",
          args: { projectId: "project-gem" },
        },
      },
    ]);

    const types = events.map((event) => event.type);
    expect(types).toEqual([
      EventType.TOOL_CALL_START,
      EventType.STATE_SNAPSHOT,
      EventType.TOOL_CALL_ARGS,
      EventType.TOOL_CALL_END,
    ]);
  });
});
