import { displayValue, loopTrack } from "./common.js";

export function render(event) {
  const result=event.condition?.result;
  const condition=event.condition?.substituted??event.condition?.expression??event.expression;
  return '<div class="scene-figure scene-loop scene-loop-do-while">'+
    '<div class="scene-loop-heading"><span class="scene-loop-order">HACER–MIENTRAS</span><strong>Primero ejecuta</strong></div>'+
    loopTrack(["Cuerpo","Comprobar","Repetir"],1)+
    '<div class="scene-loop-body"><span class="scene-caption">CUERPO YA EJECUTADO</span><strong>La vuelta ya ocurrió</strong></div>'+
    '<div class="scene-loop-question"><span class="scene-caption">CONDICIÓN CON VALORES</span><strong>'+displayValue(condition)+'</strong></div>'+
    '<div class="scene-loop-answer '+(result?"is-true":"is-false")+'">'+(result?"V · Repetir el cuerpo":"F · Salir del ciclo")+'</div>'+
    '</div>';
}
