import { displayValue, loopTrack } from "./common.js";

export function render(event) {
  const result=event.condition?.result;
  const exiting=result===false;
  const active=exiting?3:0;
  const completed=exiting?(Number(event.loop?.round)>0?[0,1,2]:[0]):[];
  const condition=event.condition?.substituted??event.condition?.expression??event.expression;
  return '<div class="scene-figure scene-loop scene-loop-while">'+
    '<div class="scene-loop-heading"><span class="scene-loop-order">MIENTRAS</span><strong>Pregunta antes de entrar</strong></div>'+
    loopTrack(["Comprobar","Cuerpo","Volver a preguntar","Salir"],active,completed)+
    '<div class="scene-loop-question"><span class="scene-caption">CONDICIÓN CON VALORES</span><strong>'+displayValue(condition)+'</strong></div>'+
    '<div class="scene-loop-answer '+(result?"is-true":"is-false")+'">'+(result===true?"V · Entrar al cuerpo":"F · Salir sin otra vuelta")+'</div>'+
    '<p class="scene-loop-detail">'+(result===false?"Si es falsa desde el inicio, el cuerpo puede ejecutarse cero veces.":"Si es verdadera, se ejecuta el cuerpo y después se vuelve a comprobar.")+'</p>'+
    '</div>';
}
