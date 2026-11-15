import { displayValue } from "./common.js";

export function render(event) {
  const round = event.loop?.round ?? "—";
  return '<div class="scene-figure scene-loop scene-loop-exit">'+
    '<span class="scene-loop-order">FIN DEL CICLO</span>'+
    '<div class="scene-loop-answer is-false">F · La condición ya no se cumple</div>'+
    '<p class="scene-loop-note">Se completaron '+displayValue(round)+' vueltas. El recorrido continúa fuera del ciclo.</p>'+
    '</div>';
}