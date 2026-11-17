import { initFiltros } from "./filtros.js";
import { initControl, renderControl } from "./view-control.js";
import { initClases, renderClases } from "./view-clases.js";
import { initActividades, renderActividades } from "./view-actividades.js";
import { CLAVE_FICHA } from "./store.js";

let inicializada = false;

export function initFicha() {
  if (inicializada || typeof document === "undefined") return;
  inicializada = true;
  initFiltros();
  initControl();
  initClases();
  initActividades();

  document.addEventListener("traza:ficha-actualizada", () => {
    renderControl();
    renderClases();
    renderActividades();
  });

  window.addEventListener("storage", event => {
    if (event.key !== CLAVE_FICHA && event.key !== null) return;
    renderControl();
    renderClases();
    renderActividades();
  });
}
