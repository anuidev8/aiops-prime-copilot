# AG-UI protocol in AIOps Prime

[AG-UI](https://github.com/ag-ui-protocol/ag-ui) is the **agent ↔ UI event protocol** used by CopilotKit v2. This app does not implement AG-UI end-to-end by hand; it **consumes** `@ag-ui/client` on the server bridge and **CopilotKit React** on the client.

---

## Where AG-UI appears

| Location | Package | Role |
|----------|---------|------|
| Server bridge | `@ag-ui/client` | `RunAgentInput`, `BaseEvent`, `EventType` |
| Server mapper | `@google/adk` → AG-UI | `copilot-adk-bridge-mapper.ts` |
| Client activity | `@ag-ui/core`, `@ag-ui/client` | `ActivityMessage`, `AbstractAgent` |
| Copilot runtime | `@copilotkit/runtime/v2` | HTTP handler, `BuiltInAgent` custom factory |

---

## Request path

```text
CopilotChat (React)
  → POST /api/copilotkit  (single-route mode)
    → CopilotRuntime.agents.default
      → streamAdkCoordinatorAsAgUiEvents(input, abortSignal)
        → yields AsyncGenerator<BaseEvent>
```

Entry: `src/app/api/copilotkit/route.ts`  
Factory: `src/app/api/copilotkit/create-aiops-copilot-agent.ts`  
Stream: `src/backend/infrastructure/adk/copilot-adk-bridge.ts`

---

## Input: what the UI sends

`RunAgentInput` includes:

- **`messages`** — conversation (latest user message used in ADK prompt)
- **`threadId`** — reused as ADK `sessionId` / `userId` for session continuity
- **`context`** — JSON from `useAgentContext` (artifact cache, workspace, pipeline)

The bridge builds one text prompt:

```text
Session context (JSON):
{ ... artifactCache, workflow, dashboardFocus, ... }

User request:
<latest user message>
```

---

## Output: ADK → AG-UI mapping

Implemented in `src/backend/infrastructure/adk/copilot-adk-bridge-mapper.ts`.

| ADK `StructuredEvent` | AG-UI `EventType` | UI effect |
|----------------------|-------------------|-----------|
| `CONTENT` | `TEXT_MESSAGE_CHUNK` | Streaming assistant text |
| `TOOL_CALL` (backend tools only) | `TOOL_CALL_START`, `TOOL_CALL_ARGS`, `TOOL_CALL_END` | Tool execution in chat |
| same | `STATE_SNAPSHOT` | Predictive pipeline status for activity sync |
| `TOOL_RESULT` | `TOOL_CALL_RESULT` | Tool output → `useRenderTool` / incremental handlers |
| `ERROR` | thrown | Error surface to CopilotKit |

### Backend tool allowlist

Only these names emit AG-UI tool events (ADK internals like `transfer_to_agent` are **hidden**):

- `listProjectOwnership`
- `runTelemetryAgent`
- `runAnalystAgent`
- `runReporterAgent`
- `analyzeLogs`

Constant: `COPILOT_BACKEND_TOOL_NAMES` in the mapper file.

### STATE_SNAPSHOT payload

Used for lightweight pipeline hints before tool results land in React:

```json
{
  "telemetryRun": {
    "status": "running",
    "activeWorker": "telemetry_worker",
    "phase": "Running runTelemetryAgent…"
  },
  "observed_steps": [{ "id": "telemetry", "label": "telemetry", "status": "running" }]
}
```

---

## Client: agent context (not an AG-UI event)

`useAgentContext` in `aiops-copilot.tsx` mirrors session state into **every** run so ADK can read `runId`, scope, and cache without re-fetching:

```typescript
useAgentContext({
  description: "Current AIOps session artifact cache and dashboard viewport",
  value: sharedContext,
});

useAgentContext({
  description: "Structured workspace state for chat-with-your-data",
  value: workspaceState,
});
```

Also: `agent.setState(workspaceState)` for CopilotKit agent state.

---

## Activity messages (AG-UI extension in chat)

**Activity messages** are a CopilotKit/AG-UI pattern for non-text UI inside the thread.

| Piece | Path |
|-------|------|
| Type constant | `src/features/agent-pipeline/model/adk-pipeline-activity.ts` |
| Renderer | `src/features/agent-pipeline/ui/adk-pipeline-chat-activity.tsx` |
| Sync hook | `src/features/agent-pipeline/hooks/use-sync-adk-pipeline-chat-activity.ts` |

Flow:

1. Session updates `agentPipeline` / `isAnalyzing` from tools or stream API.
2. `useSyncAdkPipelineChatActivity` injects or removes a synthetic `role: "activity"` message.
3. `renderActivityMessages={[adkPipelineActivityRenderer]}` on `<CopilotKit>` renders `AgentPipelineLive` in compact mode.

Registered on:

```tsx
<CopilotKit renderActivityMessages={ACTIVITY_RENDERERS} ...>
```

---

## Tool name sets (mapper)

| Set | Constant | Runs on |
|-----|----------|---------|
| Pipeline / domain | `COPILOT_BACKEND_TOOL_NAMES` | Server use cases |
| UI / report canvas | `COPILOT_FRONTEND_BRIDGE_TOOL_NAMES` | Browser (`useFrontendTool`) |

`isCopilotTool()` is true for both. ADK-internal tools (e.g. `transfer_to_agent`) are filtered out and do not emit AG-UI tool events.

---

## How to add a new AG-UI-facing tool

### Server-side tool

1. Add `FunctionTool` in `aiops-coordinator-tools.ts` and wire use case.
2. Add name to `COPILOT_BACKEND_TOOL_NAMES`.
3. `useRenderTool` + `applyIncrementalToolResult` on the client.

### Browser-only tool (with ADK awareness)

1. `useFrontendTool` in `aiops-copilot.tsx`.
2. Matching passthrough tool in `copilot-frontend-tool-bridge.ts` (copilot profile only).
3. Add name to `COPILOT_FRONTEND_TOOL_NAMES` in that file.
4. Document in `aiops-coordinator-prompt.ts`.

Optional: extend `toolToPipelineAgent` in the mapper for `STATE_SNAPSHOT` labels (backend tools only).

---

## Fallback path (no ADK)

When Gemini is unavailable, CopilotKit **`BuiltInAgent`** runs tools directly — still AG-UI on the wire, but **no** `copilot-adk-bridge`. Same tool names, same client incremental handlers.

---

## Tests

- `src/backend/infrastructure/adk/copilot-adk-bridge.test.ts` — mapper unit tests with fixture `StructuredEvent`s

---

## Related

- [generative-ui.md](./generative-ui.md) — dashboard blocks (separate from AG-UI stream)
- [../platform/README.md](../platform/README.md) — full platform diagram
