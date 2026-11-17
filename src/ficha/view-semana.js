import { FICHA } from "../content/ficha.js";
import { leerFicha } from "./store.js";
import { hoy, fechaISO, inicioSemana, finSemana, diaSemana } from "./fechas.js";
import { renderFiltros, filtrarActividades, competenciaPasaFiltro, obtenerFiltros } from "./filtros.js";
import { escaparHTML, avisoFuente, formatearFecha } from "./view-utils.js";

let referenciaSemana = hoy();
let diaSeleccionado = Math.min(diaSemana(referenciaSemana), 6);
const DIAS = [
  { dia: 1, corto: "Lun", largo: "Lunes" }, { dia: 2, corto: "Mar", largo: "Martes" },
  { dia: 3, corto: "Mié", largo: "Miércoles" }, { dia: 4, corto: "Jue", largo: "Jueves" },
  { dia: 5, corto: "Vie", largo: "Viernes" }, { dia: 6, corto: "Sáb", largo: "Sábado" }
];

function sumarDias(fecha, cantidad) {
  const salida = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  salida.setDate(salida.getDate() + cantidad);
  return salida;
}
function minutos(hora) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hora || "");
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}
function horarioVisible(filtros) {
  return FICHA.horario.filter(item => competenciaPasaFiltro(item.competenciaId, filtros));
}
function notasDelDia(dia, filtros) {
  return FICHA.horarioNotas.filter(item => item.dia === dia && competenciaPasaFiltro(item.competenciaId, filtros)).map(item => {
    const instructor = FICHA.instructores.find(value => value.id === item.instructorId);
    return `<div class="ficha-week-note"><strong>${escaparHTML(item.titulo)}</strong>
      <span>${escaparHTML(instructor?.nombre ?? "Instructor por confirmar")} · ${escaparHTML(item.nota)}</span></div>`;
  }).join("");
}
function tarjetaClase(item) {
  const comp = FICHA.competencias.find(value => value.id === item.competenciaId);
  const instructor = FICHA.instructores.find(value => value.id === item.instructorId);
  return `<article class="ficha-week-class"><time>${escaparHTML(item.inicio)}–${escaparHTML(item.fin)}</time>
    <strong>${escaparHTML(comp?.codigo ?? "Competencia")}</strong>
    <span>${escaparHTML(comp?.nombre ?? "Competencia por configurar")}</span>
    <small>${escaparHTML(instructor?.nombre ?? "Instructor por confirmar")} · ${escaparHTML(item.ambiente || "Ambiente por confirmar")}</small></article>`;
}
function renderEmptyGrid(start, due, filtros) {
  return `<div class="ficha-week-empty-grid">${DIAS.map((day, index) => {
    const date = sumarDias(start, index);
    return `<section class="ficha-week-empty-day ${fechaISO(date) === fechaISO(hoy()) ? "is-today" : ""}">
      <h3>${day.largo} <time>${escaparHTML(formatearFecha(date, { day: "numeric", month: "short" }))}</time></h3>
      ${due[fechaISO(date)] || ""}
      ${notasDelDia(day.dia, filtros)}
      <p>${FICHA.meta.esDemostracion || !FICHA.horario.length ? "Sin horario publicado" : "Sin clases este día"}</p>
    </section>`;
  }).join("")}</div>`;
}
function renderDesktopGrid(start, horario, due, filtros) {
  const clases = horario.map(item => ({ ...item, start: minutos(item.inicio), end: minutos(item.fin) }))
    .filter(item => item.start !== null && item.end !== null && item.end > item.start);
  if (!clases.length) return renderEmptyGrid(start, due, filtros);

  const primera = Math.floor(Math.min(...clases.map(item => item.start)) / 60);
  const ultima = Math.ceil(Math.max(...clases.map(item => item.end)) / 60);
  const horas = Math.max(1, ultima - primera);
  const alto = horas * 60;
  const labelsHoras = Array.from({ length: horas }, (_, i) =>
    `<span>${String(primera + i).padStart(2, "0")}:00</span>`).join("");

  return `<div class="ficha-week-grid" style="--week-hours:${horas};--week-height:${alto}px">
    <div class="ficha-week-corner">Hora</div>
    ${DIAS.map((day, index) => {
      const date = sumarDias(start, index);
      return `<div class="ficha-week-day-heading ${fechaISO(date) === fechaISO(hoy()) ? "is-today" : ""}">
        <strong>${day.largo}</strong><time>${escaparHTML(formatearFecha(date, { day: "numeric", month: "short" }))}</time></div>`;
    }).join("")}
    <div class="ficha-week-time-axis">${labelsHoras}</div>
    ${DIAS.map((day, index) => {
      const date = sumarDias(start, index);
      const items = clases.filter(item => item.dia === day.dia);
      const blocks = items.map(item => {
        const top = item.start - primera * 60;
        const height = item.end - item.start;
        const comp = FICHA.competencias.find(value => value.id === item.competenciaId);
        const instructor = FICHA.instructores.find(value => value.id === item.instructorId);
        return `<article class="ficha-week-block" style="--block-top:${top}px;--block-height:${height}px">
          <time>${escaparHTML(item.inicio)}–${escaparHTML(item.fin)}</time>
          <strong>${escaparHTML(comp?.codigo ?? "Clase")}</strong>
          <span>${escaparHTML(comp?.nombre ?? "Competencia")}</span>
          <small>${escaparHTML(instructor?.nombre ?? "Instructor")} · ${escaparHTML(item.ambiente || "Ambiente")}</small>
        </article>`;
      }).join("");
      return `<div class="ficha-week-day-column ${fechaISO(date) === fechaISO(hoy()) ? "is-today" : ""}" style="--week-height:${alto}px">
        <div class="ficha-week-hour-lines"></div>${due[fechaISO(date)] || ""}${notasDelDia(day.dia, filtros)}${blocks}
        ${blocks ? "" : `<span class="ficha-week-no-class">Sin clases</span>`}</div>`;
    }).join("")}
  </div>`;
}
function renderMobile(start, horario, due, filtros) {
  const day = DIAS.find(item => item.dia === diaSeleccionado) ?? DIAS[0];
  const date = sumarDias(start, day.dia - 1);
  const clases = horario.filter(item => item.dia === day.dia).sort((a, b) => a.inicio.localeCompare(b.inicio));
  return `<div class="ficha-mobile-week">
    <div class="ficha-day-picker" role="group" aria-label="Seleccionar día de la semana">
      ${DIAS.map(item => `<button type="button" data-mobile-day="${item.dia}" aria-pressed="${item.dia === diaSeleccionado}">
        <span>${item.corto}</span><small>${escaparHTML(formatearFecha(sumarDias(start, item.dia - 1), { day: "numeric" }))}</small></button>`).join("")}
    </div>
    <section class="ficha-mobile-agenda"><h3>${day.largo} · ${escaparHTML(formatearFecha(date, { day: "numeric", month: "long" }))}</h3>
      ${due[fechaISO(date)] || ""}
      ${notasDelDia(day.dia, filtros)}
      ${!FICHA.horario.length
        ? `<div class="ficha-empty-inline"><strong>Horario pendiente de publicación</strong><span>El moderador aún no ha registrado los bloques oficiales.</span></div>`
        : clases.length ? clases.map(tarjetaClase).join("")
        : `<div class="ficha-empty-inline"><strong>Sin clases este día</strong><span>No hay bloques registrados para este día.</span></div>`}
    </section>
  </div>`;
}

export function renderSemana() {
  const root = document.querySelector("#view-semana");
  if (!root) return;
  const personal = leerFicha();
  const filtros = obtenerFiltros();
  const start = inicioSemana(referenciaSemana);
  const end = finSemana(referenciaSemana);
  const isoStart = fechaISO(start), isoEnd = fechaISO(end);
  const horario = horarioVisible(filtros);
  const vencimientos = filtrarActividades(
    FICHA.actividades.filter(item => item.limite && item.limite >= isoStart && item.limite <= isoEnd),
    personal, hoy(), filtros
  );
  const due = {};
  for (let index = 0; index < 6; index++) {
    const iso = fechaISO(sumarDias(start, index));
    due[iso] = vencimientos.filter(item => item.limite === iso).map(item =>
      `<span class="ficha-due-flag"><strong>Vence:</strong> ${escaparHTML(item.titulo)}</span>`).join("");
  }

  root.innerHTML = `<div class="ficha-view-content">
    <header class="ficha-view-heading">
      <div><p class="eyebrow">MI FICHA · SEMANA</p><h2 id="semana-title">Semana</h2>
        <p class="ficha-date-range">${escaparHTML(formatearFecha(start, { day: "numeric", month: "short" }))} – ${escaparHTML(formatearFecha(end, { day: "numeric", month: "short", year: "numeric" }))}</p>
        ${avisoFuente()}</div>
      <div class="ficha-date-controls">
        <button type="button" data-week-action="previous" aria-label="Semana anterior">‹ Semana anterior</button>
        <button type="button" data-week-action="today">Hoy</button>
        <button type="button" data-week-action="next" aria-label="Semana siguiente">Semana siguiente ›</button>
      </div>
    </header>
    ${renderFiltros("semana", FICHA)}
    ${!FICHA.horario.length ? `<div class="ficha-demo-schedule-note" role="status">El horario semanal está preparado para edición del moderador; todavía no tiene bloques oficiales publicados.</div>` : ""}
    <div class="ficha-week-desktop">${renderDesktopGrid(start, horario, due, filtros)}</div>
    ${renderMobile(start, horario, due, filtros)}
    <footer class="ficha-personal-note">Semana académica de lunes a sábado. El domingo queda fuera del horario lectivo.</footer>
  </div>`;
}

export function initSemana() {
  const root = document.querySelector("#view-semana");
  if (!root || root.dataset.fichaReady === "true") return;
  root.dataset.fichaReady = "true";
  root.addEventListener("click", event => {
    const action = event.target.closest("[data-week-action]");
    if (action) {
      if (action.dataset.weekAction === "previous") referenciaSemana = sumarDias(referenciaSemana, -7);
      if (action.dataset.weekAction === "next") referenciaSemana = sumarDias(referenciaSemana, 7);
      if (action.dataset.weekAction === "today") referenciaSemana = hoy();
      renderSemana();
      return;
    }
    const day = event.target.closest("[data-mobile-day]");
    if (day) {
      diaSeleccionado = Number(day.dataset.mobileDay);
      renderSemana();
    }
  });
  document.addEventListener("traza:filtros-ficha-cambiados", renderSemana);
  renderSemana();
}
