import { displayValue, routeLabel } from "./common.js";

export function render(event) {
  const route = event.route;
  const parts = event.condition?.parts ?? [];
  const partRows = parts.length > 1 ? '<div class="scene-condition-parts">'+parts.map(part=>
    '<span>'+displayValue(part.expression)+' <b>'+(part.result === null ? "?" : part.result ? "V" : "F")+'</b></span>'
  ).join("")+'</div>' : "";
  return '<div class="scene-figure scene-decision">'+
    '<div class="scene-question-card"><span class="scene-caption">PREGUNTA</span><strong>'+displayValue(event.condition?.expression ?? event.expression)+'</strong></div>'+
    partRows+
    '<div class="scene-decision-paths"><span class="scene-path '+(route === "V" ? "is-active" : "")+'">V · Verdadero</span><span class="scene-path '+(route === "F" ? "is-active" : "")+'">F · Falso</span></div>'+
    '<div class="scene-whole-result">Todo junto: <b>'+(event.condition?.result === null ? routeLabel(route) : event.condition?.result ? "V · Verdadero" : "F · Falso")+'</b></div>'+
    '</div>';
}