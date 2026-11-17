import { FICHA } from "../content/ficha.js";
import { leerFicha } from "./store.js";
import { hoy } from "./fechas.js";
import { panel, clasesDelDia } from "./selectores.js";
import { renderFiltros, filtrarActividades, competenciaPasaFiltro, obtenerFiltros } from "./filtros.js";
import { escaparHTML, avisoFuente, renderActividad, renderEnlaceExterno, formatearFecha } from "./view-utils.js";

let soloLoQueFalta = false;
const GRUPOS = [
  ["atrasadas", "Atrasadas"], ["porCorregir", "Por corregir"],
  ["hoy", "Vencen hoy"], ["semana", "Esta semana"],
  ["proxima", "Próximas"], ["sinFecha", "Sin fecha límite"],
  ["entregadas", "Entregadas"], ["aprobadas", "Aprobadas"]
];

function renderGrupo(titulo, actividades, personal, fecha) {
  if (!actividades.length) return "";
  return `<section class="ficha-activity-group">
    <details open>
      <summary><span>${titulo}</span><strong>${actividades.length}</strong></summary>
      <div class="ficha-activity-list">${actividades.map(item => renderActividad(item, personal, fecha)).join("")}</div>
    </details>
  </section>`;
}

function renderClases(fecha, filtros) {
  const clases = clasesDelDia(fecha).filter(item => competenciaPasaFiltro(item.competenciaId, filtros));
  const dia = fecha.getDay() === 0 ? 7 : fecha.getDay();
  const notas = FICHA.horarioNotas.filter(item => item.dia === dia);
  const notaHTML = notas.map(item => {
    const instructor = FICHA.instructores.find(value => value.id === item.instructorId);
    return \`<div class="ficha-schedule-note"><strong>\${escaparHTML(item.titulo)}</strong>
      <span>\${escaparHTML(instructor?.nombre ?? "Instructor por confirmar")} · \${escaparHTML(item.nota)}</span></div>\`;
  }).join("");
  if (!FICHA.horario.length) {
    return \`<div class="ficha-empty-inline"><strong>Horario pendiente de publicación</strong>
      <span>El moderador aún no ha registrado los bloques oficiales de clase.</span></div>\${notaHTML}\`;
  }
  const lista = clases.length
    ? \`<ul class="ficha-class-list">\${clases.map(item => \`<li class="ficha-class-item">
        <time>\${escaparHTML(item.inicio)}–\${escaparHTML(item.fin)}</time>
        <div><strong>\${escaparHTML(item.competencia?.nombre ?? "Competencia")}</strong>
          <span>\${escaparHTML(item.ambiente || "Ambiente por confirmar")}</span>
          <small>\${escaparHTML(item.instructor?.nombre ?? "Instructor por confirmar")}</small></div>
      </li>\`).join("")}</ul>\`
    : \`<div class="ficha-empty-inline"><strong>Sin clases este día</strong>
        <span>No hay bloques programados para hoy con los filtros actuales.</span></div>\`;
  return notaHTML + lista;
}

export function renderHoy() {
  const root = document.querySelector("#view-hoy");
  if (!root) return;
  const fecha = hoy();
  const personal = leerFicha();
  const filtros = obtenerFiltros();
  const datos = panel(personal, fecha, { soloLoQueFalta });
  let total = 0;
  const grupos = GRUPOS.map(([clave, titulo]) => {
    const items = filtrarActividades(datos[clave], personal, fecha, filtros);
    total += items.length;
    return renderGrupo(titulo, items, personal, fecha);
  }).join("");

  const vacio = total ? "" : `<div class="ficha-empty-state">
    <span aria-hidden="true">✓</span>
    <h3>${filtros.competenciaId !== "todas" || filtros.estado !== "todos" ? "No hay resultados con estos filtros" : "Estás al día"}</h3>
    <p>${filtros.competenciaId !== "todas" || filtros.estado !== "todos" ? "Limpia los filtros para volver a ver todas las actividades." : "No hay actividades pendientes en los grupos visibles."}</p>
  </div>`;

  const accesos = FICHA.accesos.map(renderEnlaceExterno).filter(Boolean).join("");
  root.innerHTML = `<div class="ficha-view-content">
    <header class="ficha-view-heading">
      <div><p class="eyebrow">MI FICHA · HOY</p>
        <h2 id="hoy-title">Hoy · ${escaparHTML(formatearFecha(fecha, { weekday: "long", day: "numeric", month: "long" }))}</h2>
        ${avisoFuente()}</div>
      <label class="ficha-switch"><input type="checkbox" data-only-pending ${soloLoQueFalta ? "checked" : ""}><span>Solo lo que falta</span></label>
    </header>
    ${renderFiltros("hoy", FICHA)}
    <div class="ficha-dashboard-grid">
      <div class="ficha-activity-panel" role="region" aria-label="Actividades por atender">${grupos}${vacio}</div>
      <aside class="ficha-side-panel">
        <section class="ficha-side-section"><h3>Clases de hoy</h3>${renderClases(fecha, filtros)}</section>
        <section class="ficha-side-section"><h3>Accesos rápidos</h3>
          <div class="ficha-quick-links">${accesos || "<span>No hay accesos publicados.</span>"}</div></section>
      </aside>
    </div>
    <footer class="ficha-personal-note">Tus datos de seguimiento se guardan en este navegador.</footer>
  </div>`;
}

export function initHoy() {
  const root = document.querySelector("#view-hoy");
  if (!root || root.dataset.fichaReady === "true") return;
  root.dataset.fichaReady = "true";
  root.addEventListener("change", event => {
    if (event.target.matches("[data-only-pending]")) {
      soloLoQueFalta = event.target.checked;
      renderHoy();
    }
  });
  document.addEventListener("traza:filtros-ficha-cambiados", renderHoy);
  renderHoy();
}
