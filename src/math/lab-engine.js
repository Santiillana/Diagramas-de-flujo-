import { evaluateMathExpression, formatDecimalOrRational, rational, solveDirectRule, solveInverseRule } from "./exact.js";
import { generateMathExercise } from "./generators.js";

export const MATH_LAB = Object.freeze({
  enteros: ["order", "fill-gap", "error", "whatif", "predict", "number-line"],
  racionales: ["match", "order", "fill-gap", "error", "predict", "fraction-bar"],
  "regla-de-tres": ["match", "order", "fill-gap", "error", "whatif", "predict"]
});

const labels = {
  order: "Ordena", "fill-gap": "Completa el hueco", error: "Encuentra el error",
  whatif: "¿Y si…?", predict: "Predice", "number-line": "Ubica en la recta",
  match: "Empareja", "fraction-bar": "Completa la barra"
};
const families = { order: "Observa", predict: "Observa", "fill-gap": "Construye", match: "Construye", "number-line": "Construye", "fraction-bar": "Construye", error: "Investiga", whatif: "Investiga" };

function hash(value) {
  let result = 2166136261;
  for (const char of String(value)) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
  return result >>> 0;
}
function shuffle(items, seed) {
  const result = [...items]; let state = seed || 1;
  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1); [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function numericDistractors(answer) {
  const value = answer.n / answer.d;
  const candidates = [rational(answer.n + answer.d, answer.d), rational(answer.n - answer.d, answer.d), rational(-answer.n, answer.d), rational(answer.n * 2n, answer.d)];
  return candidates.filter(item => item.n !== answer.n || item.d !== answer.d).filter((item, index, list) => list.findIndex(other => other.n === item.n && other.d === item.d) === index).slice(0, 3);
}
function asValue(value) { return typeof value === "object" && value?.n !== undefined ? value : rational(BigInt(value), 1n); }
function optionSet(answer, seed) {
  const target = asValue(answer);
  return shuffle([target, ...numericDistractors(target)].map(value => ({ value, label: formatDecimalOrRational(value), correct: value.n === target.n && value.d === target.d })), seed);
}

function makeChallenge(topic, mechanic, difficulty, seed, round) {
  let exerciseSeed = `${seed}:${round}`;
  let exercise = generateMathExercise(topic, difficulty, exerciseSeed);
  const id = `ML-${topic}-${mechanic}-${difficulty}-${hash(exerciseSeed).toString(16)}`;
  if (mechanic === "number-line") {
    for (let retry = 0; retry < 32 && exercise.expected.d !== 1n; retry++) exercise = generateMathExercise(topic, 1, `${exerciseSeed}:integer:${retry}`);
  }
  const base = { id, topic, mechanic, mechanicLabel: labels[mechanic], family: families[mechanic], difficulty, seed: exerciseSeed, exercise };

  if (mechanic === "fill-gap") {
    const answer = exercise.expectedText;
    const question = topic === "regla-de-tres"
      ? `Completa el dato que falta: ${exercise.statement}`
      : `Completa el resultado: ${exercise.expression} = ___`;
    return { ...base, kind: "input", question, answer, explanation: `El valor exacto que completa el reto es ${answer}.` };
  }
  const result = exercise.expected;

  if (mechanic === "order") {
    let steps = exercise.solution ? [...exercise.solution] : [];
    if (topic === "regla-de-tres") steps = [
      { expression: "Identificar las magnitudes y sus unidades", result: exercise.type },
      { expression: exercise.type === "directa" ? "Comprobar que ambas aumentan juntas" : "Comprobar que producto × producto se conserva", result: "relación" },
      { expression: "Multiplicar los datos conocidos en cruz", result: "producto" },
      { expression: "Dividir por el dato correspondiente", result: exercise.expectedText },
      { expression: "Comprobar el resultado en el enunciado", result: "comprobado" }
    ];
    steps = steps.slice(0, 5).map((step, index) => ({ id: `step-${index}`, label: topic === "regla-de-tres" ? step.expression : `${step.expression} = ${step.result}` }));
    if (steps.length < 2) steps.push({ id: "simplify", label: "Simplificar el resultado" });
    const order = steps.map(step => step.id);
    return { ...base, kind: "order", question: topic === "regla-de-tres" ? "Ordena los pasos para resolver y comprobar la proporción." : "Ordena los pasos según la jerarquía de operaciones.", items: shuffle(steps, hash(`${exerciseSeed}:order`)), answer: order, explanation: "Resuelve primero los pasos prioritarios y conserva el resultado exacto." };
  }

  if (mechanic === "number-line") {
    const integerResult = Number(result.n);
    const positions = [integerResult - 2, integerResult - 1, integerResult, integerResult + 1, integerResult + 2];
    return { ...base, kind: "number-line", question: `Ubica el resultado de ${exercise.expression} en la recta.`, target: integerResult, positions: shuffle(positions, hash(`${exerciseSeed}:line`)), answer: integerResult, explanation: "La ficha queda en la marca que representa el resultado exacto." };
  }

  if (mechanic === "fraction-bar") {
    const denominator = 8 + hash(exerciseSeed) % 5;
    const numerator = 1 + hash(`${exerciseSeed}:numerator`) % (denominator - 1);
    const target = rational(BigInt(numerator), BigInt(denominator));
    return { ...base, kind: "fraction-bar", question: `Sombrea ${numerator}/${denominator} de la barra.`, numerator, denominator, answer: `${numerator}/${denominator}`, explanation: "Cuenta las partes iguales: las sombreadas forman el numerador y todas forman el denominador." };
  }

  if (mechanic === "error") {
    let wrong;
    if (topic === "regla-de-tres") {
      const { a, b, c } = exercise.rule;
      const wrongType = exercise.type === "directa" ? "inversa" : "directa";
      const wrongValue = wrongType === "directa" ? solveDirectRule(a, b, c) : solveInverseRule(a, c, b);
      return { ...base, kind: "choice", question: `Se resolvió con tipo ${wrongType} y se obtuvo ${formatDecimalOrRational(wrongValue)}. ¿Qué debes corregir?`, options: [{ label: `Nada: ${wrongType} es correcto`, value: "wrong", correct: false }, { label: `Usar proporción ${exercise.type}; resultado ${exercise.expectedText}`, value: "right", correct: true }], answer: "right", explanation: `La relación es ${exercise.type}, así que el resultado correcto es ${exercise.expectedText}.` };
    } else if (topic === "racionales") {
      const a = 1 + hash(exerciseSeed) % 4, b = 2 + hash(`${exerciseSeed}:b`) % 5;
      const c = 1 + hash(`${exerciseSeed}:c`) % 4, d = 2 + hash(`${exerciseSeed}:d`) % 5;
      const faulty = rational(BigInt(a + c), BigInt(b + d));
      const actual = rational(BigInt(a) * BigInt(d) + BigInt(c) * BigInt(b), BigInt(b) * BigInt(d));
      return { ...base, kind: "choice", question: `Una compañera resuelve ${a}/${b} + ${c}/${d} como ${formatDecimalOrRational(faulty)}. ¿Qué observas?`, options: [{ label: `Está bien: ${formatDecimalOrRational(faulty)}`, value: "wrong", correct: false }, { label: `Hay error: el resultado es ${formatDecimalOrRational(actual)}`, value: "right", correct: true }], answer: "right", explanation: `No se suman los denominadores. El resultado exacto es ${formatDecimalOrRational(actual)}.` };
    } else {
      const candidates = numericDistractors(asValue(result));
      const faulty = candidates[0] ?? rational(result.n + 1n, result.d);
      wrong = { prompt: `${exercise.expression} = ${formatDecimalOrRational(faulty)}`, answer: "error", explanation: `Ese resultado no coincide. El valor correcto es ${exercise.expectedText}.` };
    }
    return { ...base, kind: "choice", question: `Una respuesta propone ${wrong.prompt}. ¿Qué debes concluir?`, options: [{ label: "Ese resultado es correcto", value: "wrong", correct: false }, { label: `Hay error: el resultado es ${exercise.expectedText}`, value: "right", correct: true }], answer: "right", explanation: `Ese resultado no coincide. El valor correcto es ${exercise.expectedText}.` };
  }

  if (mechanic === "whatif") {
    if (topic === "regla-de-tres") {
      const r = exercise.rule;
      const wrongType = exercise.type === "directa" ? "inversa" : "directa";
      const alternative = wrongType === "directa" ? solveDirectRule(r.a, r.b, r.c) : solveInverseRule(r.a, r.c, r.b);
      return { ...base, kind: "choice", question: `Si se usa proporción ${wrongType} en vez de ${exercise.type}, ¿qué resultado se obtiene?`, options: optionSet(alternative, hash(`${exerciseSeed}:whatif`)), answer: alternative, explanation: `El tipo adecuado es ${exercise.type}; ${wrongType} daría ${formatDecimalOrRational(alternative)}.` };
    }
    const changed = exercise.expression.replace(/(^|[([{+−×·÷])\s*(-?\d+)/, (match, prefix, number) => `${prefix}${number.startsWith("-") ? number.slice(1) : `−${number}`}`);
    const changedResult = evaluateMathExpression(changed).value;
    return { ...base, kind: "choice", question: `¿Qué resultado da ${changed} al cambiar el signo del primer número?`, options: optionSet(changedResult, hash(`${exerciseSeed}:whatif`)), answer: changedResult, explanation: `Al cambiar el signo, el resultado pasa a ${formatDecimalOrRational(changedResult)}.` };
  }

  if (mechanic === "match" && topic === "regla-de-tres") {
    return { ...base, kind: "choice", question: `¿Qué relación describe este problema? ${exercise.statement}`, options: shuffle([{ label: "Directa", value: "directa", correct: exercise.type === "directa" }, { label: "Inversa", value: "inversa", correct: exercise.type === "inversa" }], hash(`${exerciseSeed}:match`)), answer: exercise.type, explanation: `La relación es ${exercise.type}; al sustituir los datos, el cálculo conserva esa relación.` };
  }

  const answer = mechanic === "match" ? rational(result.n * 2n, result.d * 2n) : result;
  return { ...base, kind: "choice", question: mechanic === "match" ? `Empareja ${exercise.expectedText} con una fracción equivalente.` : `¿Cuál es el resultado exacto de ${exercise.expression ?? exercise.statement}?`, options: optionSet(answer, hash(`${exerciseSeed}:${mechanic}`)), answer, explanation: mechanic === "match" ? "Las fracciones equivalentes representan la misma cantidad aunque cambien numerador y denominador." : `El resultado exacto es ${exercise.expectedText}.` };
}

export function buildMathLabChallenge(topic, mechanic, difficulty = 1, seed = "traza", round = 0) {
  if (!MATH_LAB[topic]) throw new RangeError("Tema matemático desconocido.");
  if (!MATH_LAB[topic].includes(mechanic)) throw new RangeError("Mecánica no disponible para este tema.");
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 4) throw new RangeError("La dificultad debe estar entre 1 y 4.");
  if (!Number.isInteger(round) || round < 0) throw new RangeError("La ronda debe ser un entero no negativo.");
  return makeChallenge(topic, mechanic, difficulty, String(seed), round);
}

export function mathLabCatalog(topic, progress = null) {
  if (!MATH_LAB[topic]) return [];
  return MATH_LAB[topic].map(mechanic => ({ id: mechanic, label: labels[mechanic], family: families[mechanic], stars: Math.max(0, Math.min(3, Number(progress?.topics?.[topic]?.concepts?.[topic]?.[mechanic]?.stars) || 0)) }));
}
