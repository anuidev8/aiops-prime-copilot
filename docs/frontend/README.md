# Frontend documentation

Client-side architecture for the AIOps workspace (Next.js App Router, React 19, Feature-Sliced Design).

| Doc | Topic |
|-----|--------|
| [**CopilotKit on the frontend**](./copilotkit.md) | Provider, hooks, tools, HITL, report canvas bridge, chat UI |
| [UI layer (overview)](../ui/README.md) | Workspace layout, generative UI, design tokens |
| [AG-UI protocol](../ui/ag-ui-protocol.md) | Streaming events (server ↔ client) |

---

## How the page is wired

```text
src/fsd/pages/aiops/ui/aiops-page.tsx
└── AIOpsSessionProvider          ← all analysis + cache state
    └── AIOpsWorkspaceLayout
        ├── dashboard features
        └── CopilotAssistantPanel
            └── AIOpsCopilot      ← CopilotKit provider (see copilotkit.md)
```

CopilotKit **must** render inside `AIOpsSessionProvider` so hooks can read `artifactCache`, `workflow`, and dashboard actions.

---

## Frontend folders (Copilot-related)

| Path | Role |
|------|------|
| `src/features/aiops-copilot/` | `CopilotKit` provider, chat surface, incremental tools |
| `src/features/copilot-assistant/` | Docked panel shell (chat vs avatar tab) |
| `src/features/agent-pipeline/` | Pipeline activity in chat (`useSyncAdkPipelineChatActivity`) |
| `src/processes/aiops-analysis-session/` | Session state consumed by copilot hooks |
| `src/shared/lib/coerce-agent-tool-result.ts` | Normalize backend tool JSON → cache |
| `src/shared/lib/build-aiops-workspace-state.ts` | Structured state for `useAgentContext` |
| `src/shared/types/report-copilot-intent.ts` | Canvas → chat intents (`ask_why`, `help_edit`) and UI actions |
| `src/features/report-canvas/` | Report overlay; queues actions consumed by `AIOpsCopilot` |

---

## Two UI protocols (don’t confuse them)

| Protocol | Where | Purpose |
|----------|--------|---------|
| **AG-UI** | HTTP stream from `/api/copilotkit` | Chat text, backend tool lifecycle |
| **Generative UI** | `GenerativeUiBlock[]` on analysis results | Dashboard blocks (not CopilotKit-specific) |

Details: [copilotkit.md](./copilotkit.md) · [../ui/generative-ui.md](../ui/generative-ui.md)
