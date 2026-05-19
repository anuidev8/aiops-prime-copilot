# Arquitectura de plataforma

Cómo encajan **CopilotKit**, **Google ADK** y el **pipeline de dominio AIOps** en una sola aplicación Next.js.

> **Entregable del reto:** diagramas en [diagramas/](./diagramas/) · decisiones en [decisiones-1-pagina.md](./decisiones-1-pagina.md) · versión extendida en [decisiones-arquitectura-agentes.md](../decisiones-arquitectura-agentes.md)

---

## Diagramas oficiales (entregable)

### Orquestación multiagente — Google ADK

![Orquestador aiops_coordinator y workers ADK](./diagramas/arquitectura-adk-orquestacion.png)

**Incluye:** usuario, CopilotKit runtime, `POST /api/copilotkit`, `aiops_coordinator`, workers (`telemetry_worker`, `analyst_worker`, `reporter_worker`), herramientas, integraciones y store compartido por `runId`.

### Frontend — CopilotKit y flujo de mensajes

![CopilotKit en el frontend — componentes, tools y AG-UI](./diagramas/arquitectura-copilotkit-frontend.png)

**Incluye:** árbol React (`AIOpsCopilot`, sesión), `useAgentContext`, herramientas backend/frontend/HITL, flujo hasta actualización de dashboard y report canvas.

---

## Tres capas

| Capa | Rol | Tecnología |
|------|-----|------------|
| **Experiencia** | Chat, dashboard, report canvas, HITL | React, CopilotKit, Framer Motion |
| **Orquestación de chat** | Enrutar intención del usuario a workers | Google ADK `aiops_coordinator` |
| **Trabajo de dominio** | Incidentes, RCA, reporte PRIME | Use cases TypeScript + servicios de dominio |

**CopilotKit no es el cerebro** cuando Gemini/Vertex está configurado. Es el **runtime AG-UI + UI**. ADK orquesta el chat.

---

## Diagrama de sistema (Mermaid — referencia en texto)

```mermaid
flowchart TB
  subgraph Browser["Navegador"]
    Session["AIOpsSessionProvider"]
    Layout["AIOpsWorkspaceLayout"]
    Copilot["AIOpsCopilot / CopilotKit"]
    Dash["Dashboard + UI generativa"]
  end

  subgraph API["API Next.js"]
    CK["POST /api/copilotkit"]
    Analyze["POST /api/aiops/analyze/stream"]
  end

  subgraph Runtime["Runtime CopilotKit"]
    Factory["createAIOpsCopilotAgent()"]
    Bridge["copilot-adk-bridge"]
  end

  subgraph ADK["Google ADK"]
    Coord["aiops_coordinator"]
    W1["telemetry_worker"]
    W2["analyst_worker"]
    W3["reporter_worker"]
  end

  subgraph Domain["Dominio compartido"]
    UC["Run*UseCase / AnalyzeLogsUseCase"]
    Store["inMemoryArtifactStore"]
  end

  Copilot --> CK
  Session --> Analyze
  CK --> Factory
  Factory --> Bridge --> Coord
  Coord --> W1 & W2 & W3
  W1 & W2 & W3 --> UC
  UC --> Store
  Analyze --> UC
  Dash --> Session
  Copilot --> Session
```

---

## Flujo de petición en chat (secuencia)

```mermaid
sequenceDiagram
  participant U as Usuario
  participant R as CopilotKit React
  participant API as /api/copilotkit
  participant B as copilot-adk-bridge
  participant ADK as InMemoryRunner
  participant UC as Use cases

  U->>R: mensaje + contexto JSON
  R->>API: RunAgentInput (AG-UI)
  API->>B: streamAdkCoordinatorAsAgUiEvents
  B->>ADK: runAsync + contexto en prompt
  ADK->>UC: FunctionTool
  UC-->>ADK: JSON herramienta
  ADK-->>B: StructuredEvent SSE
  B-->>API: stream BaseEvent AG-UI
  API-->>R: texto + eventos tool
  R->>R: tools incrementales → artifactCache → dashboard
```

---

## Grafo del coordinador ADK

```mermaid
flowchart LR
  C["aiops_coordinator"]
  T["telemetry_worker"]
  A["analyst_worker"]
  R["reporter_worker"]

  C -->|transfer_to_agent| T
  C -->|transfer_to_agent| A
  C -->|transfer_to_agent| R

  T --> t1["runTelemetryAgent"]
  A --> a1["runAnalystAgent"]
  R --> r1["runReporterAgent"]
  C --> l1["listProjectOwnership"]
  C --> f1["analyzeLogs"]
  C --> f2["report canvas bridge tools"]
```

Los workers **no se llaman entre sí**. Comparten datos solo vía `runId` + store en servidor (ver [logic/README.md](../logic/README.md)).

### Herramientas del coordinador (resumen)

| Grupo | Tools | Ejecuta en |
|-------|-------|------------|
| **Backend** | `listProjectOwnership`, `runTelemetryAgent`, `runAnalystAgent`, `runReporterAgent`, `analyzeLogs` | Servidor (use cases) |
| **Puente frontend** | `setDashboardFocus`, `openReportCanvas`, `downloadReportPdf`, `selectReportSection`, `startReportSectionEdit`, `updateReportSection`, `setReportSectionReviewStatus`, `suggestReportSectionEdits`, `confirmRejectReportSection`, `rewriteSelectedCanvasText`, `suggestSelectedCanvasChartKpi`, `showRecommendationCard`, `renderAnalysisSummary` | Navegador (`useFrontendTool`); ADK emite la llamada y el bridge la reenvía a AG-UI |

Las tools de **puente** están definidas en `aiops-coordinator-tools.ts` con `createFrontendBridgeTool` para que el modelo las conozca en el prompt; el handler real vive en `aiops-copilot.tsx`.

---

## Dos caminos de ejecución (mismas reglas de negocio)

| Camino | Disparador | Orquestador | UI de progreso |
|--------|------------|-------------|----------------|
| **A — Chat** | Mensaje en copilot | Coordinador ADK (o fallback `BuiltInAgent`) | Tools en chat + actividad pipeline |
| **B — Dashboard** | Botón analizar / API stream | `AnalyzeLogsUseCase` | `agentPipeline` + eventos SSE |

---

## Puente CopilotKit ↔ ADK

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/app/api/copilotkit/route.ts` | `CopilotRuntime` + handler |
| `src/app/api/copilotkit/create-aiops-copilot-agent.ts` | Agente ADK vs fallback legacy |
| `src/backend/infrastructure/adk/copilot-adk-bridge.ts` | `InMemoryRunner`, prompt con contexto, SSE |
| `src/backend/infrastructure/adk/copilot-adk-bridge-mapper.ts` | Mapeo ADK → eventos AG-UI |

**Fallback:** si `isAdkOrchestratorAvailable()` es falso, `BuiltInAgent` de CopilotKit ejecuta las mismas tools vía `defineTool` (sin ADK).

Comprobar runtime: `GET /api/aiops/runtime-status` o `describeAIOpsCopilotOrchestrator()`.

---

## Estado (doble caché)

```mermaid
flowchart LR
  Client["artifactCache (React)"]
  Ctx["useAgentContext → prompt ADK"]
  Server["inMemoryArtifactStore (runId)"]
  ADK["Sesión ADK (threadId)"]

  Client <-->|resultados tool| Server
  Client --> Ctx --> ADK
```

- **Caché cliente** — alimenta dashboard y UI generativa en la sesión del navegador.
- **Store servidor** — enlaza analista/reporter con telemetría; **se pierde al reiniciar** el servidor.
- **Sesión ADK** — memoria conversacional por `threadId`.

---

## Pila de protocolos

```text
UI React
  → CopilotKit React (tools, HITL, useAgentContext)
    → AG-UI (eventos @ag-ui/client)
      → CopilotKit Runtime v2
        → factory BuiltInAgent OR legacy BuiltInAgent
          → copilot-adk-bridge (si ADK)
            → Google ADK + Gemini/Vertex
              → Use cases + dominio
```

Detalle UI: [../ui/ag-ui-protocol.md](../ui/ag-ui-protocol.md)

---

## Variables de entorno clave

| Variable | Efecto |
|----------|--------|
| `GOOGLE_API_KEY` / flags Vertex | Habilita orquestador ADK |
| `NEXT_PUBLIC_COPILOT_RUNTIME_URL` | Endpoint Copilot (default `/api/copilotkit`) |
| `COPILOTKIT_MODEL` | Modelo del fallback legacy |

---

## Índice de archivos

| Tema | Ruta |
|------|------|
| Ruta Copilot | `src/app/api/copilotkit/route.ts` |
| Factory agente | `src/app/api/copilotkit/create-aiops-copilot-agent.ts` |
| Coordinador ADK | `src/backend/infrastructure/adk/aiops-coordinator.ts` |
| Tools ADK | `src/backend/infrastructure/adk/aiops-coordinator-tools.ts` |
| Sesión (cliente) | `src/processes/aiops-analysis-session/model/aiops-session-context.tsx` |
| UI chat | `src/features/aiops-copilot/ui/aiops-copilot.tsx` |
