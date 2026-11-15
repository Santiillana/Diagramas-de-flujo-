import { variableCards } from "./common.js";

export function render(event) {
  const start = event.kind === "start";
  const label = start ? "Inicio" : "Fin";
  const memory = start ? '<span class="scene-empty-memory">Aún no hay variables</span>' : variableCards(event.variables);
  return '<div class="scene-figure scene-terminal">'+
    '<div class="scene-terminal-shape">'+label+'</div>'+
    '<div class="scene-memory-box"><span class="scene-caption">MEMORIA</span><div class="scene-memory-values">'+memory+'</div></div>'+
    '</div>';
}