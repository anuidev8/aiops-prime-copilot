# Backend

Server-side code under `src/backend/` plus Next.js **API routes** in `src/app/api/`. Organized as **DDD + Clean Architecture** (domain → application → infrastructure → interface).

---

## API routes

| Method | Path | Handler / use case |
|--------|------|-------------------|
| `POST` | `/api/copilotkit` | CopilotKit runtime → ADK bridge or legacy agent |
| `POST` | `/api/aiops/analyze` | `AnalyzeLogsUseCase` (JSON body) |
| `POST` | `/api/aiops/analyze/stream` | Same + SSE progress events |
| `GET` | `/api/aiops/ownership/projects` | Project catalog (SPEC-009) |
| `POST` | `/api/aiops/report-pdf` | Report canvas → PDF |
| `GET` | `/api/aiops/runtime-status` | Gemini/Vertex/ADC/copilot mode |
| `GET` | `/api/aiops/prime-report` | PRIME report utilities (if enabled) |

Request validation: `src/backend/interface/http/analyze-request-schema.ts` (Zod).

---

## Layer diagram

```text
┌─────────────────────────────────────────┐
│  interface/http   Zod, ownership handlers │
├─────────────────────────────────────────┤
│  infrastructure   ADK, repos, config    │
├─────────────────────────────────────────┤
│  application      use cases, contracts    │
├─────────────────────────────────────────┤
│  domain           entities, services      │
└─────────────────────────────────────────┘
         ▲
         │  src/app/api/* imports bootstrap
```

---

## Directory map

```text
src/backend/
├── domain/
│   ├── common/                 # Severity, TimeWindow, ServiceName
│   ├── observability/          # Incident, logs, detection
│   ├── aiops-analysis/         # Analysis, root cause, remediation
│   ├── prime-reporting/        # PrimeReport, KPIs, narrative
│   └── project-analytics/      # Company, project, recommendations
├── application/
│   ├── use-cases/              # AnalyzeLogs, RunTelemetry, …
│   ├── contracts/              # DTOs, agent ports, progress
│   └── shared/                 # scope resolver, mappers
├── infrastructure/
│   ├── adk/                    # Coordinator, bridge, agent adapters
│   ├── repositories/           # File logs, in-memory ownership
│   ├── session/                # inMemoryArtifactStore
│   ├── config/                 # vertex-config, runtime-status
│   ├── data/                   # mock telemetry, sample logs
│   └── bootstrap.ts            # Factory functions for API routes
└── interface/http/             # Schemas, ownership handlers
```

---

## Google ADK (chat orchestration)

| Module | Role |
|--------|------|
| `aiops-coordinator.ts` | `LlmAgent` + 3 sub-agents |
| `aiops-coordinator-tools.ts` | `FunctionTool` → use cases |
| `aiops-coordinator-prompt.ts` | Instructions per worker |
| `copilot-adk-bridge.ts` | `InMemoryRunner` + AG-UI stream |
| `copilot-adk-bridge-mapper.ts` | Event translation |
| `adk-model.ts` | Gemini / Vertex config |
| `telemetry-agent.ts` | Telemetry port adapter |
| `adk-analyst-agent.ts` | Analyst port adapter |
| `adk-prime-reporter-agent.ts` | Reporter port adapter |

**Availability:** `isAdkOrchestratorAvailable()` — requires API key or Vertex env (see `vertex-config.ts`).

---

## CopilotKit integration (backend side)

```text
src/app/api/copilotkit/route.ts
  → createAIOpsCopilotAgent()
       ├─ ADK: BuiltInAgent { type: "custom", factory: streamAdk… }
       └─ Fallback: BuiltInAgent { model, tools: defineTool(…) }
```

Legacy tools duplicate coordinator tools for environments without ADK.

---

## Data sources

| Source | Implementation |
|--------|----------------|
| Logs | `FileLogsRepository` + `sample-logs.json` |
| Ownership | `InMemoryProjectOwnershipRepository` (seeded) |
| Telemetry API | `mock-telemetry-api.ts` (demo) |

Production would swap repositories via bootstrap without changing use cases.

---

## Environment variables (backend-relevant)

| Variable | Purpose |
|----------|---------|
| `GOOGLE_API_KEY` / `GEMINI_API_KEY` | Gemini for ADK |
| `GOOGLE_GENAI_USE_VERTEXAI` | Use Vertex |
| `GOOGLE_CLOUD_PROJECT` / `LOCATION` | Vertex project |
| `COPILOTKIT_MODEL` | Legacy agent model |
| `NEXT_PUBLIC_COPILOT_RUNTIME_URL` | Client → copilot route |

Full list: root [README.md](../../README.md) and `runtime-status` endpoint.

---

## Testing

| Area | Tests |
|------|-------|
| ADK bridge mapper | `copilot-adk-bridge.test.ts` |
| Scope resolver | `hierarchical-scope-resolver.test.ts` |
| Ownership HTTP | `ownership-handlers.test.ts` |
| Request schema | `analyze-request-schema.test.ts` |
| Domain KPIs | `project-kpi-aggregator.test.ts`, etc. |

---

## Related

- [../platform/README.md](../platform/README.md) — how ADK connects to CopilotKit
- [../logic/README.md](../logic/README.md) — use cases and pipeline
- [../ui/ag-ui-protocol.md](../ui/ag-ui-protocol.md) — streamed events to the client
