import { displayValue } from "./common.js";

export function render(event) {
  const rawExpression=event.substituted||event.expression||event.sourceText||"Operación";
  const expression=String(rawExpression).replace(/\s*(>=|<=|<>|!=|==|[+*/<>=])\s*/g," $1 ").replace(/\s+/g," ").trim();
  const variable=event.variable??"RESULTADO";
  const previous=event.previous;
  const next=event.next;
  const result=previous===undefined
    ?displayValue(variable)+" = "+displayValue(next)
    :displayValue(variable)+": "+displayValue(previous)+" → "+displayValue(next);
  return '<div class="scene-figure scene-process">'+
    '<div class="scene-operation-breakdown">'+
      '<span class="scene-caption">OPERACIÓN</span>'+
      '<strong>'+displayValue(expression)+' = '+displayValue(next)+'</strong>'+
    '</div>'+
    '<div class="scene-process-result"><span class="scene-caption">VALOR GUARDADO</span><strong>'+result+'</strong></div>'+
    '</div>';
}
