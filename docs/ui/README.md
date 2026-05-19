# UI layer

Frontend for the AIOps workspace: layout, copilot, dashboard, and data-driven blocks. Built with **Next.js App Router**, **Feature-Sliced Design**-style folders, **CopilotKit**, and **Tailwind CSS v4**.

---

## Documentation in this folder

| Doc | Topic |
|-----|--------|
| [CopilotKit (frontend)](../frontend/copilotkit.md) | Provider, hooks, backend vs frontend tools, HITL, session sync |
| [ag-ui-protocol.md](./ag-ui-protocol.md) | Agent ↔ UI streaming (AG-UI), bridge events, activity messages |
| [generative-ui.md](./generative-ui.md) | Typed dashboard blocks from analysis results |
| [design-tokens.md](./design-tokens.md) | CSS variables, severity colors, motion |

---

## Page composition

```text
/aiops  (src/fsd/pages/aiops/ui/aiops-page.tsx)
└── AIOpsSessionProvider          ← global session state
    └── AIOpsWorkspaceLayout      ← shell + view modes
        ├── AppSidebar / AppTopBar / ViewModeToggle
        ├── OperationsOverviewDashboard
        ├── IncidentDashboard / ProjectCatalog
        ├── ReportCanvas overlay
        ├── AgentPipelineLive / TelemetrySubgraphBar
        └── CopilotAssistantPanel
            └── AIOpsCopilot (CopilotKit provider + chat)
```

**View modes:** `dashboard` · `split` · `chat` · `avatar`  
**Report layer:** in-dashboard overlay (not a separate route).

---

## Folder map (UI code)

| Area | Path | Role |
|------|------|------|
| Page | `src/fsd/pages/aiops/` | Route composition |
| Session | `src/processes/aiops-analysis-session/` | `artifactCache`, workflow, analyze stream |
| Copilot | `src/features/aiops-copilot/` | CopilotKit, tools, HITL, chat view |
| Dashboard | `src/features/operations-dashboard/` | Overview, generative UI renderer |
| Pipeline UI | `src/features/agent-pipeline/` | Live pipeline + ADK chat activity |
| Report | `src/features/report-canvas/` | Editable PRIME canvas + PDF |
| Entities | `src/entities/` | Charts, PRIME grids, project cards |
| Shared UI | `src/shared/ui/` | Layout, dashboard panels, tables |

---

## Protocols used in the UI

### 1. AG-UI (agent ↔ client)

CopilotKit v2 speaks **AG-UI** over HTTP/SSE to `/api/copilotkit`. The server streams `BaseEvent` types (`TEXT_MESSAGE_CHUNK`, `TOOL_CALL_*`, `STATE_SNAPSHOT`, etc.).

See [ag-ui-protocol.md](./ag-ui-protocol.md).

### 2. Generative UI (data ↔ dashboard)

Not the same as AG-UI. **Generative UI** here means typed **`GenerativeUiBlock[]`** payloads attached to analysis results; the dashboard maps each `type` to a React component.

See [generative-ui.md](./generative-ui.md).

### 3. CopilotKit-specific APIs

| API | Use in this app |
|-----|-----------------|
| `useAgentContext` | Push `artifactCache` + workspace state into every agent turn |
| `useFrontendTool` | Dashboard focus, open report canvas, PDF download |
| `useHumanInTheLoop` | Approve analyst/reporter runs, canvas text rewrite |
| `useRenderTool` | Show incremental tool status cards |
| `renderActivityMessages` | ADK pipeline widget inside chat |

---

## Styling

All visual consistency goes through **`src/app/globals.css`** tokens and Tailwind `@theme inline` mapping.

See [design-tokens.md](./design-tokens.md).

---

## Rules of thumb (UX contract)

1. **Dashboard is source of truth for data** — After telemetry/analyst/reporter, chat stays short; blocks and charts update via `artifactCache` / generative UI.
2. **Report lives in the overlay** — `openReportCanvas` / report layer, not long narrative in chat.
3. **HITL is client-side** — Confirmations render in React; ADK sees outcomes via context on the next turn.

---

## Related

- Platform bridge: [../platform/README.md](../platform/README.md)
- Tool → cache mapping: [../logic/README.md](../logic/README.md)
