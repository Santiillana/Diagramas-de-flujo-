import { displayValue, loopTrack } from "./common.js";

export function render(event) {
  const round=event.loop?.round??event.raw?.iteration??0;
  const type=event.loop?.type??"while";
  const stages=type==="doWhile"?["Cuerpo","Comprobar","Repetir / salir"]:
    type==="for"?["Preparar","Comprobar","Cuerpo","Avanzar","Salir"]:
    ["Comprobar","Cuerpo","Volver a preguntar","Salir"];
  return '<div class="scene-figure scene-loop scene-loop-exit">'+
    '<div class="scene-loop-heading"><span class="scene-loop-round">Ciclo finalizado</span><strong>'+displayValue(round)+' vueltas</strong></div>'+
    loopTrack(stages,stages.length-1)+
    '<div class="scene-loop-detail">La condición fue falsa. La ficha sale del ciclo y continúa con la siguiente instrucción.</div>'+
    '<div class="scene-loop-answer is-false">F · Salir del ciclo</div>'+
    '</div>';
}
