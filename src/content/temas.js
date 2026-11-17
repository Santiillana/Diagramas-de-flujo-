import { FICHA } from "./ficha.js";
import { lessons } from "./lessons.js";
import { exercises } from "./exercises.js";

const competencia = id => FICHA.competencias.find(item => item.id === id);

export const competenciasAprende = [
  { id: "establecer-requisitos", titulo: "Establecer requisitos", forma: "circulo" },
  { id: "evaluar-requisitos", titulo: "Evaluación de requisitos", forma: "rombo" },
  { id: "tics", titulo: "TICs", forma: "cuadrado" },
  { id: "comunicacion", titulo: "Comunicación", forma: "triangulo" },
  { id: "matematicas", titulo: "Matemáticas", forma: "hexagono" }
].map(item => ({ ...item, fuente: competencia(item.id) })).filter(item => item.fuente);

const leccionesDiagramas = lessons.map(item => item.id);

export const temas = [
  { id: "diagramas-flujo", competenciaId: "evaluar-requisitos", titulo: "Diagramas de flujo", icono: "↘", dificultad: 1, estado: "disponible", conceptos: ["figuras", "flujo", "entrada", "salida", "variables", "asignacion", "operaciones", "decisiones", "ciclos"], lecciones: leccionesDiagramas, ejercicios: exercises.map(item => item.id), simulador: { tipo: "flujo" }, laboratorio: { mecanicas: ["predict", "table", "order", "symbol", "error", "whatif", "fill-gap", "follow-arrow"] } },
  { id: "fuentes-informacion", competenciaId: "establecer-requisitos", titulo: "Fuentes de información", icono: "⌕", dificultad: 1, estado: "proximamente", conceptos: [], lecciones: [], ejercicios: [], simulador: null, laboratorio: null },
  ...["enteros", "racionales", "regla-de-tres"].map((id, index) => ({ id, competenciaId: "matematicas", titulo: ["Números enteros", "Números racionales", "Regla de tres"][index], icono: ["±", "½", "%"][index], dificultad: index + 1, estado: "proximamente", conceptos: [], lecciones: [], ejercicios: [], simulador: null, laboratorio: null }))
];

export function temaPorId(id) { return temas.find(item => item.id === id) ?? null; }
