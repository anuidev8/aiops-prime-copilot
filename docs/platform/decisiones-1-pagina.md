# Decisiones de arquitectura — AIOps Prime (1 página)

> **Versión extendida (Q&A):** [decisiones-arquitectura-agentes.md](../decisiones-arquitectura-agentes.md)

**Problema:** operaciones necesitan pasar de telemetría en nube a diagnóstico accionable y narrativa de negocio, sin pipelines monolíticos ni un único LLM con todo el contexto.

**Solución:** pipeline en tres roles (telemetría → analista → reporter), orquestado por **Google ADK**, misma lógica vía API o **CopilotKit**, estado por `runId`, dashboard y **report canvas** editables con copilot.

## Diseño elegido

| Capa | Rol | Tecnología |
|------|-----|------------|
| Experiencia | Chat, HITL, UI generativa, report canvas | CopilotKit + React |
| Orquestación | Routing a workers por intención | ADK `aiops_coordinator` |
| Dominio | Incidentes, RCA, PRIME | Use cases TypeScript |

**Patrón:** orchestrator-workers (no megaagente). Workers **no** se llaman entre sí; comparten `inMemoryArtifactStore` + `artifactCache` por `runId`.

**CopilotKit** = runtime AG-UI + UI. **ADK** = cerebro del chat cuando Gemini/Vertex está disponible (`copilot-adk-bridge.ts`).

## Trade-offs aceptados

| Sacrificio | Por qué |
|------------|---------|
| Store en memoria (servidor) | MVP simple; se pierde al reiniciar |
| Dos contextos (ADK + JSON Copilot) | Chat robusto; requiere `runId` alineado |
| HITL en cliente | Confirmaciones en React; ADK ve resultado en el siguiente turno |
| Herramientas “puente” en ADK | El coordinador conoce tools de report canvas; el handler corre en el navegador |

## Referencias

- Coordinador: `src/backend/infrastructure/adk/aiops-coordinator.ts`
- Tools: `src/backend/infrastructure/adk/aiops-coordinator-tools.ts`
- Puente: `src/backend/infrastructure/adk/copilot-adk-bridge.ts`
