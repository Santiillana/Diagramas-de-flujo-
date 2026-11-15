import { displayValue } from "./common.js";

export function render(event) {
  const value = event.raw?.value;
  return '<div class="scene-figure scene-output">'+
    '<div class="scene-output-source"><span class="scene-caption">EL VALOR NO CAMBIA</span><strong>'+displayValue(Object.entries(event.variables ?? {}).map(([key,val])=>key+" = "+val).join(" · ") || "Sin variables")+'</strong></div>'+
    '<div class="scene-output-paper"><span class="scene-caption">IMPRIMIR</span><strong>'+displayValue(value)+'</strong><span class="scene-paper-edge"></span></div>'+
    '</div>';
}