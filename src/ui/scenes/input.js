import { displayValue } from "./common.js";

export function render(event) {
  const values = event.inputQueue?.values ?? [];
  const position = event.inputQueue?.position ?? -1;
  const tape = values.length ? values.map((value,index)=>
    '<span class="scene-tape-item '+(index === position ? "is-current" : index < position ? "is-used" : "")+'">'+displayValue(value)+'</span>'
  ).join("") : '<span class="scene-empty-memory">No quedan datos</span>';
  const previous = event.previous === undefined ? "" :
    '<span class="scene-old-value">'+displayValue(event.previous)+'</span><span class="scene-arrow">→</span>';
  return '<div class="scene-figure scene-input">'+
    '<div class="scene-data-tape"><span class="scene-caption">DATOS DE ENTRADA</span>'+tape+'</div>'+
    '<div class="scene-transfer-lane">↓</div>'+
    '<div class="scene-variable-box"><span class="scene-caption">'+displayValue(event.variable)+'</span>'+previous+'<strong>'+displayValue(event.next)+'</strong></div>'+
    '</div>';
}