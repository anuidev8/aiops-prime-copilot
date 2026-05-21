export type SlideDeckItem = {
  id: number;
  title: string;
};

// We keep a lightweight data array just for the slider iteration.
// The actual rich content will be hardcoded in the slide components 
// since each slide in the design is highly custom and visually unique.
export const slideDeck: SlideDeckItem[] = [
  { id: 1, title: "¿Cómo decido las tecnologías a usar?" },
  { id: 2, title: "A veces es difícil elegir la mejor tecnología" },
  { id: 3, title: "Mi proceso para elegir la tecnología correcta" },
  { id: 4, title: "Preguntas clave para resolver el problema antes de codificar" },
  { id: 5, title: "¿Qué problema se resuelve?" },
  { id: 6, title: "Este producto ofrece" },
  { id: 7, title: "Principio clave: no todo es \"un agente\"" },
  { id: 8, title: "Orquestación con ADK + Ejecución incremental" },
  { id: 9, title: "¿Por qué esta arquitectura?" },
  { id: 10, title: "Trade-offs que aceptamos" },
  { id: 11, title: "¿Por qué CopilotKit + Next.js?" },
  { id: 12, title: "Tecnologías utilizadas" },
];
