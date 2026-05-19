export type SlideTable = {
  columns: string[];
  rows: string[][];
};

export type SlideDeckItem = {
  id: number;
  title: string;
  bullets?: string[];
  table?: SlideTable;
  decision?: string;
  closingLine?: string;
  speakerNote: string;
};

export const slideDeck: SlideDeckItem[] = [
  {
    id: 1,
    title: "No hay tecnologia buena ni mala: hay el mejor match para el MVP",
    bullets: [
      "Tanta oferta hace facil perderse; el objetivo es resolver el problema en su minima version util.",
      "Criterio 1: facil, documentada y con ejemplos; tanto yo como los agentes de IA nos apoyamos en esa documentacion.",
      "Criterio 2: encaje con el producto y el caso real de la empresa.",
      "Criterio 3: match con mis habilidades y con lo que el equipo puede mantener.",
    ],
    speakerNote:
      "Antes de codificar, defini que necesitaba el problema y no que moda tecnologica seguir.",
  },
  {
    id: 2,
    title: "De 'tengo logs en la nube' a 'se que fallo y que decirle al negocio'",
    bullets: [
      "Los equipos de operaciones tienen telemetria, pero les cuesta diagnosticar, priorizar y comunicar.",
      "Un pipeline monolitico de varios minutos no escala como experiencia diaria.",
      "Un solo LLM con todo el contexto de GCP, proyectos y servicios no es confiable.",
      "Tambien importa considerar resultados del proyecto con clientes y alternativas de mejora.",
    ],
    speakerNote:
      "El dolor no es falta de datos; es falta de interpretacion accionable y narrativa ejecutiva.",
  },
  {
    id: 3,
    title: "Cinco capacidades, un mismo flujo",
    bullets: [
      "Deteccion de incidentes (empresa -> proyecto -> servicios).",
      "Analisis de causa raiz por incidente.",
      "Reporte ejecutivo PRIME (KPIs + narrativa).",
      "Alternativas de solucion orientadas al cliente.",
      "Chat por pasos o flujo completo, con confirmacion humana cuando hace falta.",
    ],
    speakerNote:
      "Telemetria, analisis, reporte y mejora; no solo un chat que responde texto.",
  },
  {
    id: 4,
    title: "No todo es 'un agente'",
    table: {
      columns: ["Capa", "Rol", "En este proyecto"],
      rows: [
        [
          "Orquestacion",
          "Quien ejecuta que y cuando",
          "Google ADK (aiops_coordinator + workers)",
        ],
        [
          "Dominio",
          "Reglas, KPIs, deteccion",
          "Use cases TypeScript + agentes acotados",
        ],
        ["Experiencia", "Chat, HITL, UI generativa", "CopilotKit + React"],
      ],
    },
    bullets: [
      "Un agente es rol + herramientas + prompt acotado, no un LLM libre que hace todo.",
    ],
    speakerNote:
      "Separe cerebro de orquestacion, logica de negocio y experiencia de usuario.",
  },
  {
    id: 5,
    title: "Orchestrator + workers, no megaagente",
    bullets: [
      "Opcion A - Un solo LLM en CopilotKit: menos piezas, pero mezcla roles, alucinacion de tools y perdida de contexto.",
      "Opcion B - ADK orquesta y CopilotKit es UI (elegida): delegacion clara entre telemetry_worker, analyst_worker y reporter_worker.",
      "Trade-off: mas codigo por el puente ADK <-> AG-UI.",
    ],
    decision:
      "Decision: CopilotKit expone /api/copilotkit y el cerebro es aiops_coordinator via copilot-adk-bridge.",
    speakerNote:
      "Alineado con el patron routing + workers de agentes efectivos: un coordinador, varios especialistas.",
  },
  {
    id: 6,
    title: "El usuario no espera un monolito de varios minutos",
    bullets: [
      "Pipeline en serie significa mucha espera sin feedback util.",
      "Workers invocables bajo demanda + artefactos por runId.",
      "Servidor: inMemoryArtifactStore.",
      "Cliente: artifactCache + contexto visible en el chat.",
      "Si el reporte ya esta en cache, se va directo al reporter sin repetir telemetria y analisis.",
      "Los workers no se hablan entre si; comparten store y los use cases validan errores claros.",
    ],
    speakerNote:
      "Incremental no es solo tecnico: es respetar el tiempo del operador.",
  },
  {
    id: 7,
    title: "Quien hace que",
    bullets: [
      "Usuario -> CopilotKit (UI, HITL, contexto) -> /api/copilotkit -> copilot-adk-bridge.",
      "aiops_coordinator (ADK) delega a telemetry_worker, analyst_worker y reporter_worker.",
      "Dashboard/API (/api/aiops/analyze) usa el mismo pipeline en codigo sin pasar por chat.",
      "Telemetria es deteccion deterministica; analyst/reporter usan LLM acotado con limites y fallbacks.",
    ],
    speakerNote:
      "El sistema separa lectura de senales, razonamiento y narrativa para mantener control.",
  },
  {
    id: 8,
    title: "CopilotKit + Next.js como capa conversacional",
    bullets: [
      "No es solo streaming de texto: el valor esta en conversacion, aprobaciones y tarjetas del pipeline.",
      "CopilotKit integra HITL y AG-UI para esa experiencia.",
      "Next.js monolito (sin NestJS y sin backend Python aparte).",
      "ADK en TypeScript (@google/adk): mismo runtime que CopilotKit.",
      "Un repo para copilot, PDF, telemetria mock/real y menor friccion operativa.",
    ],
    speakerNote:
      "Elegi un stack con documentacion rica para humanos y para agentes de desarrollo con IA.",
  },
  {
    id: 9,
    title: "El modelo no escribe JSX: devuelve bloques tipados",
    bullets: [
      "Backend y use cases producen GenerativeUiBlock[] (tablas, KPIs, graficos, narrativa).",
      "El dashboard los renderiza con componentes React conocidos.",
      "Esto se separa de AG-UI (chat y streaming de tools).",
      "Flujo: use case -> buildGenerativeUiBlocks() -> cache de sesion -> GenerativeUiRenderer.",
      "Resultado: dashboard que se actualiza con el pipeline, no solo texto en el chat.",
    ],
    speakerNote:
      "Generative UI es un contrato de datos seguro; AG-UI es el protocolo conversacional.",
  },
  {
    id: 10,
    title: "Que sacrificamos a cambio de que",
    table: {
      columns: ["Sacrificio", "Por que lo aceptamos"],
      rows: [
        ["Mas de un sistema (ADK + CopilotKit)", "Menos alucinacion y roles claros"],
        ["Store en memoria (MVP)", "Simplicidad; se pierde al reiniciar"],
        ["Dos contextos (ADK + JSON Copilot)", "Chat robusto con runId alineado"],
        ["Pipeline no bloqueante", "UX incremental con validacion en use cases"],
        ["HITL en React, no en ADK", "Aprobaciones naturales en la UI"],
      ],
    },
    closingLine:
      "CopilotKit es la cara del producto, ADK el orquestador y Store + cache evitan repetir el monolito en cada turno.",
    speakerNote:
      "La tecnologia se eligio por match con problema, empresa, skills y documentacion; no por hype.",
  },
];
