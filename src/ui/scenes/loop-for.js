import { displayValue, loopTrack } from "./common.js";

export function render(event) {
  const round=event.loop?.round??"—";
  const active=event.kind==="for-init"?0:event.kind==="for-cond"?1:event.kind==="loop-iteration"?2:event.kind==="for-step"?3:4;
  const condition=event.condition?.substituted??event.raw?.condition??"Condición del ciclo";
  const counter=event.raw?.change?.name??event.raw?.update?.variable??"Contador";
  let detail="El ciclo prepara su contador y comprueba si debe continuar.";
  if(event.kind==="for-init")detail=counter+" comienza en "+displayValue(event.next)+".";
  else if(event.kind==="for-cond")detail=displayValue(condition)+" → "+(event.condition?.result?"V · continúa":"F · sale del ciclo");
  else if(event.kind==="loop-iteration")detail="Vuelta "+displayValue(round)+": se ejecuta el cuerpo.";
  else if(event.kind==="for-step")detail=counter+" cambia de "+displayValue(event.previous)+" a "+displayValue(event.next)+".";
  else if(event.kind==="loop-exit")detail="El ciclo termina después de "+displayValue(round)+" vueltas.";
  return '<div class="scene-figure scene-loop scene-loop-for">'+
    '<div class="scene-loop-heading"><span class="scene-loop-round">Vuelta '+displayValue(round)+'</span><strong>Cómo funciona Para</strong></div>'+
    loopTrack(["Preparar","Comprobar","Cuerpo","Avanzar","Salir"],active)+
    '<div class="scene-loop-detail">'+displayValue(detail)+'</div>'+
    '<div class="scene-loop-condition"><span class="scene-caption">CONDICIÓN ACTUAL</span><strong>'+displayValue(event.condition?.substituted??event.raw?.condition??"Se comprueba antes de cada vuelta")+'</strong></div>'+
    '</div>';
}
