# Guion de demo — sustentación (~5 min)

**URL:** http://localhost:3000/aiops · **Setup:** [README.md](../README.md)

1. **Problema (30 s)** — Overview: de telemetría a incidentes, RCA y reporte PRIME por proyecto.
2. **Chat multiagente (2–3 min)** — Copilot: listar proyectos → telemetría → analista (HITL) → reporter; señalar tarjetas incrementales y `runId`.
3. **API / dashboard + report canvas (1 min)** — Projects → análisis por stream; pipeline en vivo; abrir report canvas → **Ask why** o **Edit** en una sección (el copilot responde con contexto de la sección, no narrativa completa en chat) → PDF.
4. **Arquitectura (30 s)** — [ENTREGABLES.md](./ENTREGABLES.md) → diagramas ADK y CopilotKit.
5. **Metodología / IA (30 s, opcional)** — SDD en Notion; **Claude** (plan) + **Codex** (código); MCP Context7 y CopilotKit; skills UX/ADK — [metodologia-desarrollo-con-ia.md](./metodologia-desarrollo-con-ia.md).
6. **Cierre** — [decisiones-1-pagina.md](./platform/decisiones-1-pagina.md).

**Plan B:** `GET /api/aiops/runtime-status`; datos seed Acme Corp / Project Gem en README.
