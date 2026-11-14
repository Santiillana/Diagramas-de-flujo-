import { escapeHTML as esc } from "./escape.js";

const valueText = value => value === undefined || value === null
  ? "—"
  : typeof value === "number" ? String(Number(value.toFixed(6))) : String(value);

function frame(kind, label, body) {
  return '<div class="scene-visual scene-visual-'+kind+'" data-scene-visual="'+kind+'" role="group" aria-label="'+esc(label)+'">'+body+'</div>';
}

function variableBox(name, value, caption="VARIABLE") {
  return '<div class="scene-visual-variable"><span>'+esc(caption)+'</span><b>'+esc(name || "—")+'</b><strong>'+esc(valueText(value))+'</strong></div>';
}

function decisionVisual(event, kind="decision") {
  const chosen = event.result === true ? "true" : "false";
  const expression = event.condition ?? event.sourceText ?? "Condición";
  const route = event.route ?? (event.result === true ? "V" : event.result === false ? "F" : "—");
  return frame(kind, "Evaluación de condición",
    '<div class="scene-visual-decision-diamond"><span>CONDICIÓN</span><code>'+esc(expression)+'</code></div>'+
    '<div class="scene-visual-branches">'+
      '<span class="scene-visual-branch '+(chosen==="true"?"is-chosen-true":"")+'"><b>V</b> Verdadera</span>'+
      '<span class="scene-visual-branch '+(chosen==="false"?"is-chosen-false":"")+'"><b>F</b> Falsa</span>'+
    '</div>'+
    '<div class="scene-visual-result '+(chosen==="true"?"is-true":chosen==="false"?"is-false":"")+'">Ruta elegida: <strong>'+esc(route)+'</strong></div>'
  );
}

export function renderSceneVisual(event) {
  if (!event || typeof event !== "object") return frame("empty","Sin evento","<span>Esperando un paso</span>");
  const change = event.change ?? null;
  const name = change?.name ?? event.variable ?? "—";
  const currentValue = change?.value ?? event.value;
  const previousValue = change?.previous;

  switch (event.type) {
    case "program-start":
      return frame("start","Inicio del algoritmo",
        '<div class="scene-visual-terminal scene-visual-terminal-start">INICIO</div>'+
        '<div class="scene-visual-caption">La ejecución comienza</div>'
      );
    case "input":
      return frame("input","Entrada de datos",
        '<div class="scene-visual-data"><span>DATO RECIBIDO</span><strong>'+esc(valueText(event.value ?? currentValue))+'</strong></div>'+
        '<span class="scene-visual-arrow" aria-hidden="true">→</span>'+
        variableBox(name,currentValue,"SE GUARDA EN")
      );
    case "assignment":
      return frame("assignment","Asignación de variable",
        '<div class="scene-visual-operation"><span>INSTRUCCIÓN</span><code>'+esc(event.expression ?? event.sourceText ?? "Asignación")+'</code></div>'+
        '<div class="scene-visual-assignment-target">'+variableBox(name,currentValue,"VARIABLE ACTUALIZADA")+'</div>'
      );
    case "output":
      return frame("output","Salida impresa",
        '<div class="scene-visual-output-paper"><span>PANTALLA</span><strong>'+esc(valueText(event.value))+'</strong><small>Resultado mostrado</small></div>'+
        '<div class="scene-visual-output-order">Salida <b>'+esc(String(event.outputs?.length ?? "—"))+'</b></div>'
      );
    case "decision":
    case "branch":
      return decisionVisual(event,"decision");
    case "loop-init":
      return frame("loop-init","Preparación del ciclo",
        '<div class="scene-visual-loop-track"><span>INICIO DEL CICLO</span><div class="scene-visual-loop-counter">'+esc(name)+'<b>'+esc(valueText(currentValue))+'</b></div></div>'+
        '<div class="scene-visual-caption">'+esc(event.expression ?? event.sourceText ?? "Se prepara el contador")+'</div>'
      );
    case "loop-condition":
      return decisionVisual(event,"loop-condition");
    case "loop-enter": {
      const stack = event.loopStack ?? [];
      const iteration = event.iteration ?? stack[stack.length-1]?.iteration ?? "—";
      return frame("loop-enter","Entrada a una vuelta",
        '<div class="scene-visual-loop-ring"><span>VUELTA</span><strong>'+esc(String(iteration))+'</strong></div>'+
        '<div class="scene-visual-loop-levels">'+
          (stack.length ? stack.map((loop,index)=>'<span class="'+(index===stack.length-1?"is-current":"")+'">'+esc(index===0?"Exterior":index===stack.length-1?"Interior":"Anidado")+' · '+esc(String(loop.iteration))+'</span>').join("") : '<span>Comienza la repetición</span>')+
        '</div>'
      );
    }
    case "loop-update":
      return frame("loop-update","Avance del contador",
        '<div class="scene-visual-counter-change">'+
          '<span>'+esc(name)+'</span>'+
          '<strong>'+esc(valueText(previousValue))+'</strong><i aria-hidden="true">→</i><strong>'+esc(valueText(currentValue))+'</strong>'+
        '</div>'+
        '<div class="scene-visual-caption">Valor registrado para la siguiente evaluación</div>'
      );
    case "loop-exit":
      return frame("loop-exit","Salida del ciclo",
        '<div class="scene-visual-loop-exit"><span>CONDICIÓN FINAL</span><strong>F · FALSA</strong></div>'+
        '<div class="scene-visual-caption">'+esc(event.condition ?? "El ciclo termina")+'</div>'
      );
    case "program-end":
      return frame("end","Fin del algoritmo",
        '<div class="scene-visual-terminal scene-visual-terminal-end">FIN</div>'+
        '<div class="scene-visual-caption">Se alcanzó el final del recorrido</div>'
      );
    case "error":
      return frame("error","Error de ejecución",
        '<div class="scene-visual-error-mark" aria-hidden="true">!</div>'+
        '<strong>'+esc(event.message ?? "La ejecución se detuvo")+'</strong>'+
        '<small>'+esc(event.errorCode ?? "error")+'</small>'
      );
    default:
      return frame("other","Paso del algoritmo",
        '<div class="scene-visual-operation"><span>'+esc(String(event.type ?? "EVENTO").toUpperCase())+'</span><code>'+esc(event.sourceText ?? event.message ?? "")+'</code></div>'
      );
  }
}
