import { displayValue, loopTrack } from "./common.js";

export function render(event) {
  const round=event.loop?.round??event.raw?.iteration??"—";
  const type=event.loop?.type??event.raw?.loopStack?.at(-1)?.type??"while";
  const stages=type==="doWhile"?["Cuerpo","Comprobar","Repetir"]:
    type==="for"?["Preparar","Comprobar","Cuerpo","Avanzar","Salir"]:
    ["Comprobar","Cuerpo","Repetir","Salir"];
  const active=type==="doWhile"?0:type==="for"?2:1;
  const label=event.raw?.loopStack?.length>1?"Ciclo interior":"Ciclo actual";
  const style=type==="doWhile"?"doWhile":type==="for"?"for":"while";
  return '<div class="scene-figure scene-loop scene-loop-iteration scene-loop-iteration-'+style+'">'+
    '<div class="scene-loop-heading"><span class="scene-loop-round">Vuelta '+displayValue(round)+'</span><strong>'+label+'</strong></div>'+
    loopTrack(stages,active)+
    '<div class="scene-loop-detail">La ficha recorre el cuerpo. Al terminar, vuelve a la comprobación que controla el ciclo.</div>'+
    '</div>';
}
