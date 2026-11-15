import { displayValue } from "./common.js";

export function render(event) {
  const round = event.loop?.round ?? "—";
  const cells = [
    ["Preparación",event.kind === "for-init" ? event.raw?.change?.name+" = "+(event.next ?? "") : "Valor inicial"],
    ["Condición",event.condition?.expression ?? event.raw?.condition ?? "Condición del ciclo"],
    ["Avance",event.raw?.expression ?? "Actualiza el contador"]
  ];
  return '<div class="scene-figure scene-loop scene-loop-for">'+
    '<span class="scene-loop-round">Vuelta '+displayValue(round)+'</span>'+
    '<div class="scene-loop-cells">'+cells.map((item,index)=>'<div class="scene-loop-cell"><span>'+(index+1)+'</span><b>'+displayValue(item[0])+'</b><strong>'+displayValue(item[1])+'</strong></div>').join("")+'</div>'+
    '<p class="scene-loop-note">Preparar → preguntar → avanzar</p>'+
    '</div>';
}