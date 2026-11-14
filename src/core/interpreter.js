import { evaluateExpression } from "./expression.js";
import { parsePseudocode } from "./parser.js";

export class ExecutionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "ExecutionError";
    this.code = details.code ?? "execution-error";
    this.line = details.line ?? null;
    this.sourceText = details.sourceText ?? "";
    this.variable = details.variable ?? null;
  }
}

const DEFAULT_MAX_EVENTS = 2500;
const DEFAULT_MAX_ITERATIONS = 500;
const cloneVariables = variables => ({...variables});
const roundForDisplay = value => typeof value === "number" ? Number(value.toFixed(2)) : value;

function readInput(value, variable, line) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const normalized = value.trim().replace(",",".");
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  throw new ExecutionError("El dato para '"+variable+"' no es un número válido.",{
    code:"invalid-input",line,variable
  });
}
function sceneFor(type,detail) {
  const variable = detail.change?.name;
  const value = detail.change?.value;
  const previous = detail.change?.previous;
  const title = {
    "program-start":"Inicio del algoritmo",
    input:"Entra un dato",
    assignment:"Cambia una variable",
    output:"Aparece un resultado",
    decision:"Se evalúa una condición",
    "loop-init":"Se prepara un ciclo",
    "loop-condition":"Se comprueba si continúa",
    "loop-enter":"Comienza una vuelta",
    "loop-update":"Avanza el contador",
    "loop-exit":"Termina el ciclo",
    "program-end":"Fin del algoritmo",
    error:"La ejecución se detuvo"
  }[type] ?? "Paso de ejecución";
  let body = detail.message ?? "";
  if (type === "input") body = "Se recibe "+detail.value+" y se guarda en "+variable+".";
  if (type === "assignment") body = variable+" pasa de "+(previous===undefined?"(sin valor)":previous)+" a "+value+".";
  if (type === "output") body = "El programa muestra: "+detail.value+".";
  if (type === "decision") body = "La condición "+detail.condition+" resulta "+(detail.result?"verdadera (V).":"falsa (F).");
  if (type === "loop-condition") body = "La condición "+detail.condition+" resulta "+(detail.result?"verdadera: el cuerpo se repite.":"falsa: el ciclo termina.");
  if (type === "loop-enter") body = "Se ejecuta la vuelta "+detail.iteration+".";
  if (type === "loop-update") body = variable+" cambia de "+previous+" a "+value+" para preparar la siguiente vuelta.";
  if (type === "loop-exit") body = "La condición de continuación es falsa. Se sale del ciclo.";
  return {
    title,body,
    technical:detail.condition ? "Expresión evaluada: "+detail.condition+" = "+(detail.result?"V":"F") : detail.expression ? "Instrucción: "+detail.expression : detail.message ?? body,
    variable:variable??null
  };
}

export function executePseudocode(source, inputValues = [], options = {}) {
  const program = parsePseudocode(source);
  const maxEvents = Math.max(20,options.maxEvents ?? DEFAULT_MAX_EVENTS);
  const maxIterations = Math.max(1,options.maxIterations ?? DEFAULT_MAX_ITERATIONS);
  const variables = Object.create(null);
  const outputs = [];
  const events = [];
  const loopStack = [];
  let inputIndex = 0;
  let totalIterations = 0;
  let runtimeError = null;

  const emit = (type,node,detail={}) => {
    if (events.length >= maxEvents - 1) {
      throw new ExecutionError("Se alcanzó el límite de pasos de seguridad. Revisa el ciclo y la condición que debería detenerlo.",{
        code:"step-limit",line:node?.line,sourceText:node?.source
      });
    }
    const event = {
      step:events.length,
      type,
      nodeId:node?.id ?? null,
      sourceLine:node?.line ?? null,
      sourceText:node?.source ?? "",
      variables:cloneVariables(variables),
      outputs:[...outputs],
      loopStack:loopStack.map(item=>({...item})),
      route:detail.route ?? null,
      condition:detail.condition ?? null,
      result:detail.result ?? null,
      change:detail.change ?? null,
      value:detail.value,
      expression:detail.expression ?? null,
      message:detail.message ?? "",
      iteration:detail.iteration ?? null,
      scene:null,
      ...detail
    };
    event.scene = sceneFor(type,event);
    events.push(event);
    return event;
  };
  const assign = (node,variable,value,expression,type="assignment") => {
    const previous = Object.hasOwn(variables,variable) ? variables[variable] : undefined;
    variables[variable] = value;
    emit(type,node,{
      expression,
      change:{name:variable,previous,value},
      message:"Se evalúa la expresión y se guarda el resultado en "+variable+"."
    });
  };
  const evaluate = (ast,node) => {
    try { return evaluateExpression(ast,variables); }
    catch (error) {
      throw new ExecutionError(error.message,{code:"expression-error",line:node?.line,sourceText:node?.source});
    }
  };
  const read = (node,variable) => {
    if (inputIndex >= inputValues.length) {
      throw new ExecutionError("Falta un dato: el programa necesita leer "+variable+".",{
        code:"missing-input",line:node.line,sourceText:node.source,variable
      });
    }
    const value = readInput(inputValues[inputIndex++],variable,node.line);
    const previous = Object.hasOwn(variables,variable) ? variables[variable] : undefined;
    variables[variable] = value;
    emit("input",node,{
      value,change:{name:variable,previous,value},
      message:"La entrada se guarda en "+variable+"."
    });
  };
  const testCondition = (node,condition,ast,type="decision") => {
    const result = evaluate(ast,node);
    if (typeof result !== "boolean") {
      throw new ExecutionError("La condición debe producir verdadero o falso.",{
        code:"invalid-condition",line:node.line,sourceText:node.source
      });
    }
    emit(type,node,{
      condition,result,route:result?"V":"F",
      message:"Se elige la ruta "+(result?"verdadera":"falsa")+"."
    });
    return result;
  };
  const bumpIteration = node => {
    totalIterations++;
    if (totalIterations > maxIterations) {
      throw new ExecutionError("El ciclo superó el límite de seguridad de "+maxIterations+" iteraciones. Verifica el avance y la condición de salida.",{
        code:"iteration-limit",line:node.line,sourceText:node.source
      });
    }
  };
  const withLoop = (node,iteration,callback) => {
    loopStack.push({nodeId:node.id,line:node.line,iteration,type:node.type});
    emit("loop-enter",node,{iteration,message:"Comienza la vuelta "+iteration+" del ciclo."});
    callback();
    loopStack.pop();
  };

  const runBlock = nodes => {
    for (const node of nodes) {
      if (node.type === "input") {
        for (const variable of node.variables) read(node,variable);
      } else if (node.type === "assignment") {
        assign(node,node.variable,evaluate(node.expressionAst,node),node.source);
      } else if (node.type === "output") {
        const value = evaluate(node.expressionAst,node);
        outputs.push(value);
        emit("output",node,{value,expression:node.expression,message:"El resultado se añade a la salida."});
      } else if (node.type === "if") {
        const result = testCondition(node,node.condition,node.conditionAst);
        emit("branch",node,{route:result?"V":"F",result,condition:node.condition,
          message:result?"Se entra en el bloque Si.":"Se entra en el bloque Sino o se continúa."});
        runBlock(result?node.thenBody:node.elseBody);
      } else if (node.type === "while") {
        let iteration = 0;
        while (testCondition(node,node.condition,node.conditionAst,"loop-condition")) {
          bumpIteration(node);
          iteration++;
          withLoop(node,iteration,()=>runBlock(node.body));
        }
        emit("loop-exit",node,{condition:node.condition,result:false,iteration});
      } else if (node.type === "for") {
        assign(node,node.initial.variable,evaluate(node.initial.expressionAst,node),node.initial.variable+" = "+node.initial.expression,"loop-init");
        let iteration = 0;
        while (testCondition(node,node.condition,node.conditionAst,"loop-condition")) {
          bumpIteration(node);
          iteration++;
          withLoop(node,iteration,()=>runBlock(node.body));
          const update = node.update;
          if (update.kind === "step") {
            const previous = variables[update.variable];
            if (typeof previous !== "number") {
              throw new ExecutionError("El contador de Para debe ser numérico.",{code:"invalid-counter",line:node.line,sourceText:node.source});
            }
            const value = previous + (update.operator === "++" ? 1 : -1);
            assign(node,update.variable,value,update.variable+update.operator,"loop-update");
          } else {
            assign(node,update.variable,evaluate(update.expressionAst,node),update.variable+" = "+update.expression,"loop-update");
          }
        }
        emit("loop-exit",node,{condition:node.condition,result:false,iteration});
      } else if (node.type === "doWhile") {
        let iteration = 0;
        while (true) {
          bumpIteration(node);
          iteration++;
          withLoop(node,iteration,()=>runBlock(node.body));
          const again = testCondition({...node,line:node.conditionLine,source:node.condition},node.condition,node.conditionAst,"loop-condition");
          if (!again) break;
        }
        emit("loop-exit",{...node,line:node.conditionLine,source:"hm "+node.condition},{
          condition:node.condition,result:false,iteration
        });
      }
    }
  };

  try {
    emit("program-start",null,{message:"El algoritmo comienza con la memoria vacía."});
    runBlock(program.body);
    emit("program-end",null,{message:"Se alcanzó el final del algoritmo."});
  } catch (error) {
    runtimeError = error instanceof ExecutionError
      ? error
      : new ExecutionError(error.message ?? "Error inesperado en la ejecución.",{code:"runtime-error"});
    if (events.length < maxEvents) {
      const node = {line:runtimeError.line,source:runtimeError.sourceText,id:null};
      emit("error",node,{message:runtimeError.message,errorCode:runtimeError.code,change:null});
    }
  }
  return {
    ok:runtimeError===null,
    program,
    events,
    outputs:[...outputs],
    variables:cloneVariables(variables),
    inputConsumed:inputIndex,
    error:runtimeError ? {
      code:runtimeError.code,message:runtimeError.message,
      line:runtimeError.line,sourceText:runtimeError.sourceText,variable:runtimeError.variable
    } : null
  };
}

export function createTimeline(execution) {
  if (!execution?.events?.length) throw new TypeError("La ejecución no contiene pasos.");
  let cursor = 0;
  const current = () => execution.events[cursor];
  return {
    get index(){ return cursor; },
    get length(){ return execution.events.length; },
    get current(){ return current(); },
    get progress(){ return execution.events.length<=1?1:cursor/(execution.events.length-1); },
    next(){ cursor=Math.min(execution.events.length-1,cursor+1); return current(); },
    previous(){ cursor=Math.max(0,cursor-1); return current(); },
    first(){ cursor=0; return current(); },
    last(){ cursor=execution.events.length-1; return current(); },
    seek(index){
      if (!Number.isFinite(index)) throw new TypeError("El paso debe ser un número.");
      cursor=Math.max(0,Math.min(execution.events.length-1,Math.trunc(index)));
      return current();
    }
  };
}
