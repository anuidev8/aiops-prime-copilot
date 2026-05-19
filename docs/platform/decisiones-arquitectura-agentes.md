# Documento de decisiones — Agentes AIOps Prime (versión extendida)

> **Entregable del reto (≤1 página):** [decisiones-1-pagina.md](./decisiones-1-pagina.md)  
> **Índice de entregables:** [../ENTREGABLES.md](../ENTREGABLES.md)

**Alcance:** problema · diseño elegido · alternativas · trade-offs  
**Proyecto:** `aiops-prime-copilot`

## Qué problema se resuelve

Los equipos de operaciones necesitan pasar de "tengo logs y métricas en la nube" a "entiendo qué falló, por qué importa y qué comunicar al negocio", sin ejecutar siempre un pipeline monolítico de varios minutos ni depender de un único LLM que retenga todo el contexto de GCP, proyectos, servicios e incidentes.

Además del diagnóstico técnico, se busca medir resultados de los proyectos en su relación con clientes y proponer alternativas de solución que mejoren esos resultados.

Este producto ofrece:

1. **Detección de incidentes** (telemetría) sobre el alcance empresa → proyecto → servicios.  
2. **Análisis de causa raíz** por incidente.  
3. **Reporte ejecutivo PRIME** (KPIs + narrativa).  
4. **Alternativas de solución** para mejorar resultados hacia clientes.  
5. **Chat** que permite avanzar por pasos o solicitar el flujo completo, con confirmaciones humanas cuando hace falta.

---

## Principio clave: no todo es "un agente"

No se convierte cada función en un chat autónomo. La arquitectura separa tres capas:

| Capa | Rol | En este repo |
|------|-----|----------------|
| **Orquestación** | Quién ejecuta qué y en qué orden | Google ADK (`aiops_coordinator` + subagentes) |
| **Trabajo de dominio** | Reglas de negocio, KPIs, detección | Use cases TypeScript + agentes ADK acotados |
| **Experiencia** | Chat, estado compartido, HITL, UI generativa | CopilotKit (React + runtime HTTP) |

Un "agente" se entiende como un **rol con herramientas y prompt acotados**, no como un LLM libre que ejecuta todo.

---

## Por qué Google ADK como orquestador (y no CopilotKit como cerebro)

### Alternativas evaluadas

**Opción A — Un solo LLM en CopilotKit** que enruta todo vía `defineTool` (telemetry, analyst, reporter en un mismo agente).

- Pros: menos piezas y despliegue más simple.  
- Contras: un solo modelo decide el flujo; mayor riesgo de **alucinación de herramientas**, **pérdida de contexto** en conversaciones largas y mezcla de responsabilidades (telemetría + análisis + reporte + UI) en un único prompt.

**Opción B — Google ADK con patrón orchestrator-workers** y CopilotKit solo como **runtime + UI**.

- Pros: subagentes con **rol claro** (`telemetry_worker`, `analyst_worker`, `reporter_worker`), delegación nativa (`transfer_to_agent`), herramientas por worker, y alineación con [patrones de agentes efectivos](https://www.anthropic.com/engineering/building-effective-agents) (routing + workers, no un megaagente).  
- Contras: más código (puente ADK ↔ AG-UI) y dos sistemas que mantener.

**Decisión:** **Opción B**. CopilotKit **no** orquesta la lógica AIOps cuando Gemini/Vertex está disponible; expone `POST /api/copilotkit` y traduce eventos. El cerebro del chat es **`aiops_coordinator`** en ADK, conectado por `copilot-adk-bridge.ts`.

### Por qué orchestrator-workers (y ejecución incremental)

En pruebas, un pipeline completo en serie (telemetría ~minutos + análisis + reporte) dejaba al usuario esperando demasiado tiempo sin feedback útil.

Se adoptan **workers separados invocables bajo demanda**, apoyados en:

- **`inMemoryArtifactStore`** en servidor (clave `runId`: incidentes, análisis, query).  
- **`artifactCache` en React** + `useAgentContext` (estado visible en el chat por turno).

Con este enfoque, si el reporte del día ya está en caché, se puede ir directo al reporter sin repetir telemetría ni análisis. El coordinador ADK enruta; los use cases **validan** (por ejemplo, reporter sin datos → error claro y `suggestAction: runTelemetryAgent`).

> **Importante:** los subagentes **no se comunican entre sí**. Comparten store por `runId`; no hay espera automática (el reporter no se bloquea hasta que termine el analyst).

---

## Roles de cada pieza

```text
Usuario → CopilotKit (UI, HITL, contexto JSON)
       → /api/copilotkit (runtime AG-UI)
       → copilot-adk-bridge
       → aiops_coordinator (ADK)
            ├─ telemetry_worker  → RunTelemetryUseCase
            ├─ analyst_worker    → RunAnalystUseCase (+ LlmAgent por incidente)
            └─ reporter_worker   → RunReporterUseCase (+ LlmAgent para narrativa)
```

- **Telemetría:** lógica determinística de incidentes (no un LLM extenso recorriendo "toda GCP" en un solo prompt).  
- **Analyst / reporter:** LLM acotado con tools y fallbacks si el modelo falla.  
- **Dashboard / API** (`/api/aiops/analyze`): mismo pipeline en código (`AnalyzeLogsUseCase`), sin pasar por chat.

---

## Por qué CopilotKit + Next.js (y no solo Vercel AI SDK en frontend)

Se comparó **Vercel AI SDK** (sólido para streaming y UI custom) con **CopilotKit**:

| Criterio | CopilotKit | Vercel AI SDK solo |
|----------|------------|-------------------|
| Componentes de chat / copilot | Listos, stateless-friendly | Más custom |
| Human-in-the-loop | `useHumanInTheLoop` integrado | Se implementa manualmente |
| UI generativa / actividad en chat | Sí (AG-UI) | Más manual |
| Protocolo agente ↔ UI | AG-UI (ecosistema en crecimiento) | Varias integraciones posibles |
| Integración con agente externo (ADK) | `BuiltInAgent` factory custom | Posible, con más puente propio |

La elección de CopilotKit responde a que el valor principal del producto está en **conversación + aprobaciones + tarjetas de pipeline**, no solo en streaming de texto. ADK encaja en el backend TypeScript; CopilotKit encaja en la capa conversacional.

---

## Por qué backend en Next.js (y no un servicio Python aparte)

- **Google ADK tiene soporte TypeScript** (`@google/adk`), lo que facilita la implementación y el uso del mismo proceso/runtime que CopilotKit, sin despliegue adicional.  
- Un monolito en Next reduce fricción operativa: ownership, telemetría mock/real, PDF y copilot en un solo repo.

**No** se usa NestJS en este caso; el backend se implementa con API routes y use cases bajo `src/backend/`.

---

## Trade-offs explícitos

| Sacrificio | Motivo de aceptación |
|------------|----------------------|
| **Un solo LLM / un solo framework** | Mayor control y menor alucinación en routing AIOps |
| **Store en memoria** (`inMemoryArtifactStore`) | Simplicidad para MVP; se pierde al reiniciar servidor → requiere re-ejecutar telemetría |
| **Dos fuentes de contexto** (ADK session + JSON en Copilot) | Robustez del chat; requiere mantener `runId` alineado |
| **Pipeline no bloqueado por ADK** | UX incremental; reporter puede correr con `analyses: []` si el usuario salta pasos (use cases devuelven error o reporte débil) |
| **Sin CopilotKit MCP / agente remoto separado** | ADK in-process en Next; menos operación, más acoplamiento |
| **HITL en cliente, no en ADK** | `confirmRunAnalyst` / `confirmRunReporter` viven en React; el coordinador confía en contexto + reglas de prompt |

---

**CopilotKit es el runtime y la cara del producto; Google ADK es el orquestador con subagentes por rol; el estado del pipeline vive en store + caché de cliente para evitar que el usuario espere un monolito en cada ejecución.**

---

## Referencias en el repo

- Runtime: `src/app/api/copilotkit/route.ts`  
- Agente + fallback: `src/app/api/copilotkit/create-aiops-copilot-agent.ts`  
- Puente ADK ↔ AG-UI: `src/backend/infrastructure/adk/copilot-adk-bridge.ts`  
- Coordinador: `src/backend/infrastructure/adk/aiops-coordinator.ts`  
- Store: `src/backend/infrastructure/session/in-memory-artifact-store.ts`
