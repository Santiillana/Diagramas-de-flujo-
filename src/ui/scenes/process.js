import { displayValue, variableCards } from "./common.js";

export function render(event) {
  const role = event.role ? '<span class="scene-role">'+displayValue(event.role)+'</span>' : "";
  const expression = event.substituted || event.expression || event.sourceText || "Proceso";
  const partials = (event.partials ?? []).map(step =>
    '<li><code>'+displayValue(step.left)+' '+displayValue(step.operator)+' '+displayValue(step.right)+' = <b>'+displayValue(step.result)+'</b></code></li>'
  ).join("");
  return '<div class="scene-figure scene-process">'+
    '<div class="scene-process-input"><span class="scene-caption">VALORES ANTERIORES</span>'+variableCards(event.previousVariables)+'</div>'+
    '<div class="scene-process-bubble"><span class="scene-caption">CUENTA</span><strong>'+displayValue(expression)+'</strong>'+role+'</div>'+
    '<div class="scene-process-result"><span class="scene-caption">'+displayValue(event.variable ?? "RESULTADO")+'</span>'+
      (event.previous === undefined ? "" : '<del>'+displayValue(event.previous)+'</del><span class="scene-arrow">→</span>')+
      '<strong>'+displayValue(event.next)+'</strong></div>'+
    (partials ? '<ol class="scene-partials">'+partials+'</ol>' : "")+
    '</div>';
}