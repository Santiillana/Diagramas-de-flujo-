import { displayValue } from "./common.js";

export function render(event) {
  const result = event.condition?.result;
  return '<div class="scene-figure scene-loop scene-loop-do-while">'+
    '<span class="scene-loop-order">PREGUNTA AL FINAL</span>'+
    '<div class="scene-loop-body"><span class="scene-caption">CUERPO</span><strong>La primera vuelta ya ocurrió</strong></div>'+
    '<div class="scene-loop-question"><span class="scene-caption">CONDICIÓN</span><strong>'+displayValue(event.condition?.expression ?? event.expression)+'</strong></div>'+
    '<div class="scene-loop-answer '+(result ? "is-true" : "is-false")+'">'+(result ? "V · Repetir" : "F · Salir")+'</div>'+
    '</div>';
}