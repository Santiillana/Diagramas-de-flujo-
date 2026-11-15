import { displayValue } from "./common.js";

export function render(event) {
  const round = event.loop?.round ?? "—";
  const label = event.raw?.loopStack?.length > 1 ? "Ciclo interior" : "Ciclo actual";
  return '<div class="scene-figure scene-loop scene-loop-iteration">'+
    '<span class="scene-loop-order">'+label+'</span>'+
    '<div class="scene-loop-round">Vuelta '+displayValue(round)+'</div>'+
    '<p class="scene-loop-note">La ficha entra al cuerpo del ciclo. Al terminar, vuelve a comprobar la condición.</p>'+
    '</div>';
}