# AIOps Prime Copilot

## Manual de arquitectura y decisiones de producto

**Versión:** 1.0 · **Proyecto:** `aiops-prime-copilot`

---

## Para quién es este documento

Este manual está pensado para **stakeholders, evaluadores y equipos técnicos** que necesitan entender, en una sola lectura:

- Qué problema resuelve el producto.
- Cómo se eligió la tecnología.
- Por qué la arquitectura no es “un chat que lo hace todo”.
- Qué trade-offs se aceptaron en el MVP.

No sustituye la documentación técnica del repo; la complementa con una narrativa clara y lista para compartir.

---

## Resumen ejecutivo

Los equipos de operaciones ya tienen logs y métricas en la nube. Lo que les falta no es más dato: es **interpretación confiable**, **priorización** y un **lenguaje que conecte con el negocio**.

**AIOps Prime Copilot** cierra esa brecha con un flujo guiado por conversación: detectar incidentes, analizar causa raíz, generar reportes ejecutivos PRIME y proponer alternativas de mejora — sin obligar al usuario a esperar un pipeline monolítico de varios minutos en cada interacción.

**En una frase:** CopilotKit es la cara del producto; Google ADK es el orquestador; el estado del pipeline vive en store + caché para no repetir el monolito en cada ejecución.

---

## 1. Cómo elegir tecnología (sin perderse en el hype)

No existe tecnología “buena” ni “mala”. Existe el **mejor match** para resolver un problema en su **mínima versión útil**.

Con tanta oferta en el mercado, es fácil confundirse. La decisión debe responder a tres criterios prácticos:

| # | Criterio | Pregunta que responde |
|---|----------|------------------------|
| 1 | **Accesibilidad y documentación** | ¿Hay ejemplos, comunidad activa y documentación que el equipo — y los agentes de IA de desarrollo — puedan usar como apoyo? |
| 2 | **Encaje con el producto** | ¿Encaja con el tipo de servicio de la empresa y con un **caso real** demostrable? |
| 3 | **Match con capacidades** | ¿Qué tan bien se alinea con las habilidades del equipo y el costo de mantenimiento? |

**Principio rector:** definir el problema **antes** de cosificar la solución. La arquitectura sirve al caso de uso, no al revés.

---

## 2. El problema que resolvemos

### Situación actual

- Operaciones vive entre dashboards técnicos y reuniones donde el negocio pide: *“¿qué pasó y qué hacemos?”*
- Un pipeline único (telemetría + análisis + reporte) en serie puede tardar **varios minutos** sin feedback útil.
- Un **único LLM** que “retenga todo” el contexto de GCP, proyectos, servicios e incidentes es frágil: mezcla responsabilidades y aumenta el riesgo de alucinaciones.

### Objetivo del producto

Pasar de *“tengo telemetría en la nube”* a *“entiendo qué falló, por qué importa y qué comunicar al negocio”*, y además:

- Medir **resultados de proyectos** en relación con clientes.
- Proponer **alternativas de solución** que mejoren esos resultados.

### Cinco capacidades en un solo flujo

1. **Detección de incidentes** — alcance empresa → proyecto → servicios.
2. **Análisis de causa raíz** — por incidente, con contexto acotado.
3. **Reporte ejecutivo PRIME** — KPIs + narrativa para stakeholders.
4. **Alternativas de solución** — orientadas a mejorar resultados con clientes.
5. **Chat operativo** — avance por pasos o flujo completo, con **confirmación humana** cuando corresponde.

---

## 3. Principio de diseño: no todo es “un agente”

Convertir cada función en un chat autónomo no escala. La arquitectura separa **tres capas** con responsabilidades claras:

| Capa | Rol | En este proyecto |
|------|-----|------------------|
| **Orquestación** | Quién ejecuta qué y en qué orden | Google ADK — `aiops_coordinator` + workers |
| **Dominio** | Reglas de negocio, KPIs, detección | Use cases TypeScript + agentes ADK acotados |
| **Experiencia** | Chat, estado compartido, HITL, UI generativa | CopilotKit (React + runtime HTTP) |

> Un **agente** es un rol con herramientas y prompt acotados — no un LLM libre que ejecuta todo el producto.

---

## 4. Por qué Google ADK como orquestador

### Alternativa evaluada: un solo LLM en CopilotKit

Un único agente que enruta telemetría, análisis y reporte vía herramientas (`defineTool`):

| | Detalle |
|---|---------|
| **Ventaja** | Menos piezas; despliegue más simple. |
| **Riesgo** | Un solo modelo decide el flujo; mayor alucinación de herramientas; pérdida de contexto en conversaciones largas; mezcla de telemetría, análisis, reporte y UI en un solo prompt. |

### Decisión adoptada: orchestrator + workers (Google ADK)

| | Detalle |
|---|---------|
| **Ventaja** | Subagentes con rol claro (`telemetry_worker`, `analyst_worker`, `reporter_worker`); delegación nativa; alineado con el patrón routing + workers de agentes efectivos. |
| **Costo** | Más código (puente ADK ↔ AG-UI) y dos sistemas que mantener. |

**Resultado:** CopilotKit **no** orquesta la lógica AIOps cuando Gemini/Vertex está disponible. Expone `POST /api/copilotkit` y traduce eventos. El cerebro del chat es **`aiops_coordinator`** en ADK, conectado por `copilot-adk-bridge.ts`.

### Ejecución incremental (la UX que importa)

En pruebas, el pipeline completo en serie dejó al usuario esperando demasiado sin valor intermedio.

**Solución adoptada:**

- Workers invocables **bajo demanda**.
- Artefactos compartidos por `runId`:
  - **Servidor:** `inMemoryArtifactStore` (incidentes, análisis, query).
  - **Cliente:** `artifactCache` + contexto visible en el chat por turno.
- Si el reporte ya está en caché → ir **directo al reporter** sin repetir telemetría ni análisis.
- Los workers **no se comunican entre sí**; comparten store por `runId`.
- Los use cases **validan** (ej.: reporter sin datos → error claro y `suggestAction: runTelemetryAgent`).

---

## 5. Flujo del sistema

```
Usuario
  → CopilotKit (UI, confirmaciones humanas, contexto JSON)
  → POST /api/copilotkit (runtime AG-UI)
  → copilot-adk-bridge
  → aiops_coordinator (ADK)
       ├─ telemetry_worker  → RunTelemetryUseCase (detección determinística)
       ├─ analyst_worker    → RunAnalystUseCase (LLM acotado por incidente)
       └─ reporter_worker   → RunReporterUseCase (narrativa PRIME)
```

### Rol de cada pieza

| Pieza | Responsabilidad |
|-------|-----------------|
| **Telemetría** | Lógica determinística de incidentes — no un LLM recorriendo “toda GCP” en un prompt. |
| **Analyst / Reporter** | LLM acotado con tools y fallbacks si el modelo falla. |
| **Dashboard / API** | Mismo pipeline en código (`AnalyzeLogsUseCase` vía `/api/aiops/analyze`), sin pasar por chat. |

---

## 6. Por qué CopilotKit y Next.js

### CopilotKit frente a “solo Vercel AI SDK”

El valor del producto está en **conversación + aprobaciones + tarjetas de pipeline**, no solo en streaming de texto.

| Criterio | CopilotKit | Vercel AI SDK solo |
|----------|------------|---------------------|
| Componentes de chat / copilot | Listos | Más construcción manual |
| Human-in-the-loop | Integrado (`useHumanInTheLoop`) | Implementación propia |
| UI generativa / actividad en chat | Sí (AG-UI) | Más manual |
| Integración con agente externo (ADK) | Factory custom (`BuiltInAgent`) | Posible, con más puente propio |

### Next.js monolito (sin servicio Python aparte)

- Google ADK con soporte **TypeScript** (`@google/adk`) — mismo runtime que CopilotKit, sin despliegue adicional.
- Un repositorio: copilot, PDF, telemetría mock/real — menos fricción operativa.
- Backend con API routes y use cases bajo `src/backend/` (no NestJS en este MVP).

---

## 7. UI generativa

La UI generativa **no** es “el modelo escribe JSX arbitrario”. Es un **contrato de datos tipado**:

- El backend (o builders en cliente) produce bloques `GenerativeUiBlock[]`: tablas de incidentes, KPIs PRIME, gráficos, narrativa.
- React los renderiza con componentes conocidos (`GenerativeUiRenderer`).
- Está **separado de AG-UI** (protocolo de chat y herramientas).

**Beneficio para el usuario:** el dashboard evoluciona con el pipeline — no solo lee párrafos en el chat.

---

## 8. Trade-offs conscientes (MVP con intención)

| Lo que sacrificamos | Por qué lo aceptamos |
|---------------------|----------------------|
| Más de un sistema (ADK + CopilotKit) | Menor alucinación en routing; roles claros por worker |
| Store en memoria (`inMemoryArtifactStore`) | Simplicidad de MVP; se pierde al reiniciar el servidor |
| Dos fuentes de contexto (sesión ADK + JSON en Copilot) | Chat robusto; requiere mantener `runId` alineado |
| Pipeline no bloqueante en ADK | UX incremental; reporter puede correr con datos incompletos (use cases validan) |
| Sin agente remoto / MCP separado | ADK in-process en Next; menos operación, más acoplamiento |
| HITL en cliente (React), no en ADK | Aprobaciones naturales en la UI (`confirmRunAnalyst`, `confirmRunReporter`) |

---

## 9. Mensaje de cierre

| Rol | Tecnología |
|-----|------------|
| **Cara del producto** | CopilotKit — conversación, confirmaciones, tarjetas de pipeline |
| **Cerebro de orquestación** | Google ADK — coordinador + workers por rol |
| **Estado del pipeline** | Store en servidor + caché en cliente — evitar el monolito en cada turno |

La tecnología se eligió por **match con el problema**, el **caso real de la empresa**, la **documentación disponible** y las **capacidades del equipo** — no por moda.

---

## Referencias en el repositorio

| Tema | Archivo |
|------|---------|
| Decisiones extendidas | `docs/platform/decisiones-arquitectura-agentes.md` |
| Decisiones (1 página) | `docs/platform/decisiones-1-pagina.md` |
| UI generativa | `docs/ui/generative-ui.md` |
| Metodología SDD + IA | `docs/metodologia-desarrollo-con-ia.md` |
| Runtime CopilotKit | `src/app/api/copilotkit/route.ts` |
| Puente ADK ↔ AG-UI | `src/backend/infrastructure/adk/copilot-adk-bridge.ts` |
| Coordinador ADK | `src/backend/infrastructure/adk/aiops-coordinator.ts` |

---

*Manual para sustentación y entrega a stakeholders · Proyecto aiops-prime-copilot*
