import { parseExpression, evaluateExpression, traceExpression } from "../../core/expression.js";

const EVENT_KIND = {
  "program-start":"start",
  "program-end":"end",
  input:"input",
  assignment:"process",
  output:"output",
  decision:"decision",
  branch:"decision",
  "loop-init":"for-init",
  "loop-update":"for-step",
  "loop-enter":"loop-iteration",
  "loop-exit":"loop-exit",
  error:"failure"
};

const format = value => typeof value === "number" ? String(Number(value.toFixed(6))) : String(value ?? "");

function findNodeType(program, nodeId) {
  if (nodeId === null || nodeId === undefined || !program) return null;
  const visit = nodes => {
    for (const node of nodes ?? []) {
      if (String(node.id) === String(nodeId)) return node.type;
      for (const key of ["thenBody","elseBody","body"]) {
        if (Array.isArray(node[key])) {
          const found = visit(node[key]);
          if (found) return found;
        }
      }
    }
    return null;
  };
  return visit(program.body);
}

function splitLogical(source) {
  let depth = 0, quoted = false, start = 0;
  const parts = [], operators = [];
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (ch === '"' && source[i - 1] !== "\\") quoted = !quoted;
    if (quoted) continue;
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (depth === 0) {
      const match = /^\s+(Y|O)\s+/i.exec(source.slice(i));
      if (match) {
        parts.push(source.slice(start, i).trim());
        operators.push(match[1].toUpperCase());
        i += match[0].length - 1;
        start = i + 1;
      }
    }
  }
  if (parts.length) parts.push(source.slice(start).trim());
  return {parts,operators};
}

function conditionParts(expression, variables) {
  const split = splitLogical(expression ?? "");
  if (!split.parts.length) return [];
  return split.parts.map((part, index) => {
    try {
      return { expression:part, operatorAfter:split.operators[index] ?? null,
        result:Boolean(evaluateExpression(parseExpression(part),variables)) };
    } catch {
      return { expression:part, operatorAfter:split.operators[index] ?? null, result:null };
    }
  });
}

function expressionDetails(event, previousVariables) {
  const source = String(event.expression ?? event.sourceText ?? "");
  const assignment = /^([A-Za-z_][A-Za-z0-9_]*)\s*=(?!=)\s*(.+)$/.exec(source.trim());
  const expression = assignment ? assignment[2] : source;
  let substituted = expression;
  for (const [name,value] of Object.entries(previousVariables ?? {})) {
    substituted = substituted.replace(new RegExp("\\b"+name+"\\b","g"), format(value));
  }
  let partials = [];
  try {
    partials = traceExpression(expression, previousVariables).steps ?? [];
  } catch {}
  const variable = event.change?.name;
  let role = null;
  if (["loop-init","loop-update"].includes(event.type) || /\+\+|--/.test(source)) role = "contador";
  else if (assignment && variable && new RegExp("\\b"+variable+"\\b").test(assignment[2]) && assignment[2].includes("*")) role = "acumulador de producto";
  else if (assignment && variable && new RegExp("\\b"+variable+"\\b").test(assignment[2]) && assignment[2].includes("+")) role = "acumulador";
  else if (assignment) role = "cálculo";
  return {expression,substituted,partials,role};
}

export function toSceneEvent(event, context = {}) {
  const events = context.events ?? context.execution?.events ?? [];
  const program = context.execution?.program ?? context.program ?? null;
  const nodeType = findNodeType(program,event?.nodeId);
  const kind = event?.type === "loop-condition"
    ? (nodeType === "for" ? "for-cond" : nodeType === "doWhile" ? "dowhile-cond" : "while-cond")
    : EVENT_KIND[event?.type] ?? "process";
  const stepIndex = Number.isInteger(event?.step) ? event.step : 0;
  const previousEvent = events[stepIndex - 1];
  const previousVariables = previousEvent?.variables ?? {};
  const details = ["assignment","loop-init","loop-update"].includes(event?.type)
    ? expressionDetails(event,previousVariables)
    : {expression:event?.condition ?? event?.expression ?? event?.sourceText ?? "",substituted:event?.condition ?? event?.expression ?? event?.sourceText ?? "",partials:[],role:null};
  const inputs = context.inputValues ?? [];
  const inputPosition = events.slice(0,stepIndex + 1).filter(item=>item.type === "input").length - 1;
  const loopStack = event?.loopStack ?? [];
  const expression = event?.condition ?? details.expression;
  return {
    kind,stepIndex,stepCount:events.length || stepIndex + 1,
    line:event?.sourceLine ?? null,sourceText:event?.sourceText ?? "",
    variable:event?.change?.name ?? null,
    previous:event?.change?.previous,
    next:event?.change?.value ?? event?.value,
    expression,substituted:details.substituted,
    partials:details.partials,
    condition:expression ? {
      expression,parts:conditionParts(expression,event?.variables ?? {}),
      result:typeof event?.result === "boolean" ? event.result : null
    } : null,
    loop:{
      round:event?.iteration ?? loopStack.at(-1)?.iteration ?? null,
      values:event?.variables ?? {},
      limit:null,
      exited:event?.type === "loop-exit" || (event?.type === "loop-condition" && event?.result === false)
    },
    role:details.role,
    output:event?.type === "output" ? event.value : (event?.outputs ?? []),
    inputQueue:{values:inputs,position:Math.max(-1,inputPosition)},
    failure:event?.type === "error" ? {code:event.errorCode ?? context.execution?.error?.code ?? "runtime-error",message:event.message ?? ""} : null,
    variables:event?.variables ?? {},
    previousVariables,
    route:event?.route ?? (typeof event?.result === "boolean" ? (event.result ? "V" : "F") : null),
    scene:event?.scene ?? {},
    raw:event
  };
}