import { initFiltros } from "./filtros.js";
import { initHoy, renderHoy } from "./view-hoy.js";
import { initSemana, renderSemana } from "./view-semana.js";
import { initCalendario, renderCalendario } from "./view-calendario.js";
import { initActividades, renderActividades } from "./view-actividades.js";
import { CLAVE_FICHA } from "./store.js";

let inicializada = false;

export function initFicha() {
  if (inicializada || typeof document === "undefined") return;
  inicializada = true;
  initFiltros();
  initHoy();
  initSemana();
  initCalendario();
  initActividades();

  document.addEventListener("traza:ficha-actualizada", () => {
    renderHoy();
    renderSemana();
    renderCalendario();
    renderActividades();
  });

  window.addEventListener("storage", event => {
    if (event.key !== CLAVE_FICHA && event.key !== null) return;
    renderHoy();
    renderSemana();
    renderCalendario();
    renderActividades();
  });
}
