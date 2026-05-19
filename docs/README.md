# AIOps Prime — Documentación

Documentación técnica de la plataforma. El [README.md](../README.md) en la raíz es el **runbook corto** (instalación, APIs, datos demo, enlaces al reto). El detalle vive aquí.

---

## Paquete de entrega (reto técnico)

Documentación pensada para evaluadores — alineada 1:1 con los entregables del reto:

| Documento | Descripción |
|-----------|-------------|
| [**ENTREGABLES.md**](./ENTREGABLES.md) | Índice: repo, diagramas, decisiones, demo |
| [**metodologia-desarrollo-con-ia.md**](./metodologia-desarrollo-con-ia.md) | SDD (Notion), uso de IA, capturas de referencia |
| [**decisiones-1-pagina.md**](./platform/decisiones-1-pagina.md) | Decisiones de arquitectura (≤1 página) |
| [**diagramas/**](./platform/diagramas/) | Diagramas oficiales ADK + CopilotKit (PNG) |

---

## Estructura por capas

| Carpeta | Contenido |
|---------|-----------|
| [**platform/**](./platform/README.md) | Arquitectura end-to-end: CopilotKit, Google ADK, puente AG-UI, estado |
| [**frontend/**](./frontend/README.md) | CopilotKit: hooks, tools, HITL, sincronización con sesión |
| [**ui/**](./ui/README.md) | Workspace, protocolo AG-UI, UI generativa, design tokens |
| [**backend/**](./backend/README.md) | Rutas API, DDD, workers ADK, variables de entorno |

---

## Navegación rápida

### Plataforma

- [Arquitectura de plataforma](./platform/README.md) — diagramas y mapa de componentes
- [Decisiones (1 página)](./platform/decisiones-1-pagina.md) — entregable del reto
- [Decisiones (extendido)](./platform/decisiones-arquitectura-agentes.md) — alternativas y detalle para Q&A
- [Metodología SDD y uso de IA](./metodologia-desarrollo-con-ia.md) — criterio “uso de IA en el proceso”

### Frontend (CopilotKit)

- [Índice frontend](./frontend/README.md)
- [CopilotKit en el frontend](./frontend/copilotkit.md)

### UI

- [Capa UI](./ui/README.md)
- [Protocolo AG-UI](./ui/ag-ui-protocol.md)
- [UI generativa](./ui/generative-ui.md)
- [Design tokens](./ui/design-tokens.md)

### Lógica

- [Lógica de negocio y pipeline](./logic/README.md)
- [Especificación analytics empresa/proyecto](./logic/project-company-analytics-spec.md)

### Backend

- [Backend y APIs](./backend/README.md)

---

## Mapa de código (vista rápida)

```text
src/
├── app/                    # Rutas Next.js + handlers API
├── features/               # Copilot, dashboards, report canvas
├── processes/              # AIOpsSessionProvider (orquestación cliente)
├── entities/               # UI reutilizable (charts, PRIME)
├── shared/                 # Tipos, clientes, builders UI generativa
└── backend/                # domain → application → infrastructure → interface
```
