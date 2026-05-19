# Entregables — Reto técnico multiagente

Índice alineado con los entregables del reto (repositorio, diagrama, decisiones, demo). El código y la documentación de profundidad viven en el resto de `docs/`.

---

## Checklist de entrega

| Entregable | Dónde está | Qué valida |
|------------|------------|------------|
| **Repositorio Git** | Este repo + [README.md](../README.md) | Runbook: install, env, APIs, demo seed |
| **Diagrama de arquitectura** | [platform/diagramas/](./platform/diagramas/) | Agentes, roles, flujo de mensajes, herramientas |
| **Documento de decisiones (≤1 pág.)** | [platform/decisiones-1-pagina.md](./platform/decisiones-1-pagina.md) | Problema, diseño, trade-offs |
| **Demo funcional** | [DEMO-SUSTENTACION.md](./DEMO-SUSTENTACION.md) | Guion para sustentación en vivo |

---

## Cumplimiento de restricciones técnicas

| Requisito | Cómo se cumple |
|-----------|----------------|
| **≥2 agentes con roles diferenciados** | `telemetry_worker`, `analyst_worker`, `reporter_worker` (Google ADK) |
| **Orquestación explícita** | `aiops_coordinator` delega con `transfer_to_agent` y herramientas por worker |
| **Framework permitido** | **Google ADK** (TypeScript) + Gemini/Vertex AI |
| **Repositorio versionado** | GitHub con README de instalación y ejecución |

---

## Diagramas de arquitectura (oficiales)

### 1. Orquestación multiagente (Google ADK)

![Arquitectura ADK — orquestador y workers](./platform/diagramas/arquitectura-adk-orquestacion.png)

**Muestra:** usuario → CopilotKit runtime → `aiops_coordinator` → workers (telemetría, analista, reporter) → use cases de dominio → store compartido por `runId`.

**Archivo:** [arquitectura-adk-orquestacion.png](./platform/diagramas/arquitectura-adk-orquestacion.png)

### 2. Frontend y flujo de mensajes (CopilotKit)

![Arquitectura CopilotKit en el frontend](./platform/diagramas/arquitectura-copilotkit-frontend.png)

**Muestra:** árbol de componentes React, `useAgentContext`, herramientas backend/frontend/HITL, flujo AG-UI hasta actualización del dashboard.

**Archivo:** [arquitectura-copilotkit-frontend.png](./platform/diagramas/arquitectura-copilotkit-frontend.png)

Narrativa complementaria (Mermaid y secuencias): [platform/README.md](./platform/README.md).

---

## Documento de decisiones

- **≤1 página:** [platform/decisiones-1-pagina.md](./platform/decisiones-1-pagina.md)
- **Extendido:** [platform/decisiones-arquitectura-agentes.md](./platform/decisiones-arquitectura-agentes.md)

---

## Uso de IA en el proceso de construcción

**Detalle completo:** [metodologia-desarrollo-con-ia.md](./metodologia-desarrollo-con-ia.md) (SDD, capturas Notion, guion de sustentación).

| Rol | Herramienta |
|-----|-------------|
| **Planificación** | **Claude** — specs, arquitectura, tareas, decisiones |
| **Ejecución** | **Codex** — código, tests, refactors |
| **MCP** | **Context7** (docs librerías) · **CopilotKit MCP** (runtime, HITL, AG-UI) |
| **Skills** | UX/UI (`ui-designer`, guidelines, motion, a11y) · **Google ADK** (orquestación y workers) |
| **Metodología** | **SDD** en Notion → plan → tareas → código |
| **Calidad** | Vitest, Playwright, lint, build, demo en `/aiops` |

---

## Documentación de implementación (opcional)

| Tema | Enlace |
|------|--------|
| Índice general | [README.md](./README.md) |
| Plataforma | [platform/README.md](./platform/README.md) |
| CopilotKit | [frontend/copilotkit.md](./frontend/copilotkit.md) |
| Lógica de negocio | [logic/README.md](./logic/README.md) |
| Backend / APIs | [backend/README.md](./backend/README.md) |
