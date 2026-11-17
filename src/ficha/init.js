import { initFiltros } from "./filtros.js";
import { initControl, renderControl } from "./view-control.js";
import { initSemana, renderSemana } from "./view-semana.js";
import { initCalendario, renderCalendario } from "./view-calendario.js";
import { initActividades, renderActividades } from "./view-actividades.js";
import { CLAVE_FICHA } from "./store.js";

let inicializada = false;

export function initFicha() {
  if (inicializada || typeof document === "undefined") return;
  inicializada = true;
  initFiltros();
  initControl();
  initSemana();
  initCalendario();
  initActividades();

  document.addEventListener("traza:ficha-actualizada", () => {
    renderControl();
    renderSemana();
    renderCalendario();
    renderActividades();
  });

  window.addEventListener("storage", event => {
    if (event.key !== CLAVE_FICHA && event.key !== null) return;
    renderControl();
    renderSemana();
    renderCalendario();
    renderActividades();
  });
}
