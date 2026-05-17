# AIOps Prime Copilot

A multi-agent AIOps product scaffold built with:

- Next.js 16 (App Router)
- Google ADK (TypeScript) + Gemini/Vertex
- CopilotKit runtime + Generative UI chat
- DDD + Clean Architecture (backend)
- Feature-Sliced-style layering (frontend)

## Architecture

### Backend (DDD + Clean)

- `src/backend/domain`
  - Common value objects: `Severity`, `ServiceName`, `TimeWindow`
  - Observability context: `LogEntry`, `Incident`, `IncidentGroup`, `IncidentDetector`
  - AIOps Analysis context: `Analysis`, `RootCause`, `RemediationPlan`
  - PRIME Reporting context: `PrimeKpi`, `PrimeReport`, KPI/narrative services
- `src/backend/application`
  - `AnalyzeLogsUseCase`
  - `GenerateBusinessSummaryUseCase`
  - agent ports/contracts
- `src/backend/infrastructure`
  - ADK agent implementations and factories
  - file-based logs repository (`sample-logs.json`)
  - Vertex/Gemini runtime config
- `src/app/api/*`
  - `/api/aiops/analyze`
  - `/api/aiops/prime-report`
  - `/api/copilotkit`

### Frontend (FSD-style)

- `src/app` routing layer
- `src/processes/aiops-analysis-session` session orchestration
- `src/features/*`
  - `incident-dashboard`
  - `prime-report-viewer`
  - `aiops-copilot`
- `src/entities/*` reusable domain UI blocks
- `src/shared/*` API + types + UI primitives
- `src/fsd/pages/aiops` route-level composition

## Endpoints

- `POST /api/aiops/analyze`
  - Input: `{ prompt?, services?, timeWindowMinutes? }`
  - Output: incidents + analyses + PRIME report + UI blocks + resolved scope metadata
  - Behavior: if `services` and/or `timeWindowMinutes` are omitted, analysis uses available telemetry scope instead of forcing static defaults.
- `POST /api/aiops/prime-report`
  - Input: same as analyze
  - Output: PRIME report + business headline
- `POST /api/copilotkit`
  - CopilotKit single-route runtime endpoint

## Run

1. Install dependencies:

```bash
npm install
```

2. Configure env:

```bash
cp .env.example .env.local
```

`NEXT_PUBLIC_COPILOT_RUNTIME_URL` defaults to `/api/copilotkit` and can be overridden for remote runtime deployments.

3. Start dev server:

```bash
npm run dev
```

4. Open:

- `http://localhost:3000/aiops`

## Validation

```bash
npm run lint
npm run build
```

Both commands pass in the current scaffold.
