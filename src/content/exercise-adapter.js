import { conceptoPorEtiqueta } from "./conceptos.js";

const levelOrder = Object.freeze({ basic: 1, intermediate: 2, advanced: 3, expert: 4 });

export function adaptLegacyExercise(exercise, labels, isClassExercise = false) {
  return {
    id: exercise.id,
    temaId: "diagramas-flujo",
    titulo: exercise.title,
    dificultad: levelOrder[exercise.level] ?? 0,
    conceptos: [...new Set(labels.map(label => conceptoPorEtiqueta(label)?.id).filter(Boolean))],
    enunciado: exercise.statement,
    datos: exercise.inputs,
    esDeClase: isClassExercise,
    preguntasGuia: ["¿Qué entra y qué se imprime?", "¿Qué se calcula y en qué orden?", "¿Algo se decide o se repite?"],
    oraculo: () => exercise.methods.flatMap(method => method.tests ?? [])
  };
}

export function validateExercise(exercise) {
  return Boolean(exercise && Number.isInteger(exercise.id) && exercise.temaId && exercise.titulo &&
    exercise.dificultad >= 1 && exercise.dificultad <= 4 && Array.isArray(exercise.conceptos) &&
    typeof exercise.enunciado === "string" && Array.isArray(exercise.datos) &&
    typeof exercise.esDeClase === "boolean" && Array.isArray(exercise.preguntasGuia) &&
    typeof exercise.oraculo === "function");
}
