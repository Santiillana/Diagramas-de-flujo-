import { displayValue } from "./common.js";

export function render(event) {
  const result = event.condition?.result;
  return '<div class="scene-figure scene-loop scene-loop-while">'+
    '<span class="scene-loop-order">PREGUNTA ANTES DE ENTRAR</span>'+
    '<div class="scene-loop-question"><span class="scene-caption">CONDICIÓN</span><strong>'+displayValue(event.condition?.expression ?? event.expression)+'</strong></div>'+
    '<div class="scene-loop-answer '+(result ? "is-true" : "is-false")+'">'+(result ? "V · Entra al cuerpo" : "F · No entra al cuerpo")+'</div>'+
    '<p class="scene-loop-note">'+(result === false ? "El cuerpo no se ejecuta en esta comprobación." : "El cuerpo se ejecuta antes de volver a preguntar.")+'</p>'+
    '</div>';
}