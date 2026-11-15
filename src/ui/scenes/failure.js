import { displayValue } from "./common.js";

export function render(event) {
  return '<div class="scene-figure scene-failure">'+
    '<span class="scene-loop-order">EJECUCIÓN DETENIDA</span>'+
    '<strong>'+displayValue(event.failure?.code ?? "Error")+'</strong>'+
    '<p>'+displayValue(event.failure?.message ?? event.scene?.body ?? "Revisa la instrucción indicada.")+'</p>'+
    '</div>';
}