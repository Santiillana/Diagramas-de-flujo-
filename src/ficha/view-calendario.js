import { FICHA } from "../content/ficha.js";
import { leerFicha } from "./store.js";
import { hoy, fechaISO, parsearFechaLocal } from "./fechas.js";
import { renderFiltros, filtrarActividades, competenciaPasaFiltro, obtenerFiltros } from "./filtros.js";
import { escaparHTML, avisoFuente, obtenerEstadoVisual, formatearFecha } from "./view-utils.js";

let mesActual = new Date(hoy().getFullYear(), hoy().getMonth(), 1);
let diaSeleccionado = fechaISO(hoy());
let detalleVisible = true;
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function sumarDias(fecha, cantidad) {
  const salida = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  salida.setDate(salida.getDate() + cantidad);
  return salida;
}

function eventosDelDia(iso, personal, filtros) {
  const actividades = filtrarActividades(
    FICHA.actividades.filter(item => item.limite === iso), personal, hoy(), filtros
  ).map(item => ({ tipo: "actividad", item }));
  const fecha = parsearFechaLocal(iso);
  const dia = fecha.getDay() === 0 ? 7 : fecha.getDay();
  const clasesHorario = FICHA.horario
    .filter(item => item.dia === dia && competenciaPasaFiltro(item.competenciaId, filtros))
    .map(item => {
      const competencia = FICHA.competencias.find(value => value.id === item.competenciaId);
      const instructor = FICHA.instructores.find(value => value.id === item.instructorId);
      return { tipo: "horario", item: { ...item, titulo: item.titulo || competencia?.nombre || "Clase", nombreCompetencia: competencia?.nombre, nombreInstructor: instructor?.nombre } };
    });
  const notasHorario = FICHA.horarioNotas.filter(item => item.dia === dia && competenciaPasaFiltro(item.competenciaId, filtros)).map(item => {
    const instructor = FICHA.instructores.find(value => value.id === item.instructorId);
    return { tipo: "nota", item: { ...item, nombreInstructor: instructor?.nombre } };
  });
  const clasesRegistradas = FICHA.clases
    .filter(item => item.fecha === iso && competenciaPasaFiltro(item.competenciaId, filtros))
    .map(item => ({ tipo: "clase", item }));
  return [...clasesHorario, ...notasHorario, ...clasesRegistradas, ...actividades];
}

function etiquetaEvento(evento, personal, iso) {
  if (evento.tipo === "nota") {
    return `<span class="ficha-calendar-event ficha-calendar-event--note" title="${escaparHTML(evento.item.titulo)}">
      <span aria-hidden="true">•</span><span>${escaparHTML(evento.item.titulo)} · ${escaparHTML(evento.item.nombreInstructor || "Instructor")}</span></span>`;
  }
  if (evento.tipo === "clase" || evento.tipo === "horario") {
    const hora = evento.item.inicio ? " · " + evento.item.inicio : "";
    return `<span class="ficha-calendar-event ficha-calendar-event--class" title="${escaparHTML(evento.item.titulo)}">
      <span aria-hidden="true">▣</span><span>Clase${escaparHTML(hora)} · ${escaparHTML(evento.item.titulo)}</span></span>`;
  }
  const visual = obtenerEstadoVisual(evento.item, personal, hoy());
  return `<span class="ficha-calendar-event ficha-calendar-event--activity ficha-calendar-event--${escaparHTML(visual.estado)}" title="${escaparHTML(evento.item.titulo)}">
    <span aria-hidden="true">${visual.meta.icono}</span><span>${escaparHTML(evento.item.titulo)}</span></span>`;
}

function renderGrid(personal, filtros) {
  const first = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
  const start = sumarDias(first, -((first.getDay() + 6) % 7));
  const cells = Array.from({ length: 42 }, (_, index) => sumarDias(start, index));

  return `<div class="ficha-calendar-grid" role="grid" aria-label="Calendario mensual">
    ${DIAS.map(day => `<div class="ficha-calendar-weekday" role="columnheader">${day}</div>`).join("")}
    ${cells.map(date => {
      const iso = fechaISO(date);
      const events = eventosDelDia(iso, personal, filtros);
      const visible = events.slice(0, 3).map(event => etiquetaEvento(event, personal, iso)).join("");
      const more = events.length > 3 ? `<span class="ficha-calendar-more">+${events.length - 3}</span>` : "";
      const currentMonth = date.getMonth() === mesActual.getMonth();
      const isToday = iso === fechaISO(hoy());
      const selected = iso === diaSeleccionado;
      const label = formatearFecha(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      return `<div class="ficha-calendar-cell ${currentMonth ? "" : "is-other-month"} ${isToday ? "is-today" : ""} ${selected ? "is-selected" : ""}" role="gridcell">
        <button type="button" data-calendar-day="${iso}" aria-pressed="${selected}" aria-label="${escaparHTML(label + (events.length ? ", " + events.length + " eventos" : ", sin eventos"))}">
          <span class="ficha-calendar-number">${date.getDate()}</span>
          <span class="ficha-calendar-events">${visible}</span>${more}
          <span class="ficha-calendar-dots" aria-hidden="true">${events.slice(0, 3).map(event =>
            `<i class="${event.tipo === "clase" ? "is-class" : "is-activity"}"></i>`).join("")}</span>
        </button>
      </div>`;
    }).join("")}
  </div>`;
}

function renderDetalle(personal, filtros) {
  const date = parsearFechaLocal(diaSeleccionado);
  const events = eventosDelDia(diaSeleccionado, personal, filtros);
  return `<aside class="ficha-calendar-detail ${detalleVisible ? "is-open" : "is-closed"}" aria-live="polite" aria-label="Detalle del día seleccionado">
    <header><p class="eyebrow">DETALLE DEL DÍA</p><button type="button" class="ficha-detail-close" data-calendar-detail-close aria-label="Cerrar detalle">×</button><h3>${escaparHTML(formatearFecha(date, { weekday: "long", day: "numeric", month: "long" }))}</h3></header>
    ${events.length ? events.map(event => {
      if (event.tipo === "nota") {
        return `<article class="ficha-calendar-detail-item"><span class="ficha-calendar-detail-icon" aria-hidden="true">•</span>
          <div><strong>${escaparHTML(event.item.titulo)}</strong>
          <span>${escaparHTML(event.item.nombreInstructor || "Instructor por confirmar")}</span>
          <p>${escaparHTML(event.item.nota)}</p></div></article>`;
      }
      if (event.tipo === "horario") {
        return `<article class="ficha-calendar-detail-item"><span class="ficha-calendar-detail-icon" aria-hidden="true">▣</span>
          <div><strong>${escaparHTML(event.item.titulo)}</strong>
          <span>${escaparHTML(event.item.inicio)}–${escaparHTML(event.item.fin)} · ${escaparHTML(event.item.nombreInstructor || "Instructor")}</span>
          <p>${escaparHTML(event.item.nombreCompetencia || "Tema por confirmar")}</p></div></article>`;
      }
      if (event.tipo === "clase") {
        const comp = FICHA.competencias.find(item => item.id === event.item.competenciaId);
        const topics = (event.item.temas || []).map(topic => `<li>${escaparHTML(topic.texto)}</li>`).join("");
        return `<article class="ficha-calendar-detail-item"><span class="ficha-calendar-detail-icon" aria-hidden="true">▣</span>
          <div><strong>${escaparHTML(event.item.titulo)}</strong><span>${escaparHTML(comp?.codigo ?? "Clase")} · Clase registrada</span>
          ${topics ? `<ul>${topics}</ul>` : ""}</div></article>`;
      }
      const visual = obtenerEstadoVisual(event.item, personal, hoy());
      const comp = FICHA.competencias.find(item => item.id === event.item.competenciaId);
      return `<article class="ficha-calendar-detail-item"><span class="ficha-calendar-detail-icon" aria-hidden="true">${visual.meta.icono}</span>
        <div><strong>${escaparHTML(event.item.titulo)}</strong><span>${escaparHTML(visual.meta.etiqueta)} · ${escaparHTML(comp?.codigo ?? "Competencia")}</span>
        <p>${escaparHTML(event.item.descripcion)}</p></div></article>`;
    }).join("") : `<div class="ficha-empty-inline"><strong>Sin actividades ni clases registradas</strong><span>Este día no tiene eventos publicados.</span></div>`}
  </aside>`;
}

export function renderCalendario() {
  const root = document.querySelector("#view-calendario");
  if (!root) return;
  const personal = leerFicha();
  const filtros = obtenerFiltros();
  const title = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(mesActual);

  root.innerHTML = `<div class="ficha-view-content">
    <header class="ficha-view-heading">
      <div><p class="eyebrow">MI FICHA · CALENDARIO</p><h2 id="calendario-title">Calendario</h2>
        <p class="ficha-month-title">${escaparHTML(title)}</p>${avisoFuente()}</div>
      <div class="ficha-date-controls">
        <button type="button" data-month-action="previous" aria-label="Mes anterior">‹</button>
        <button type="button" data-month-action="today">Hoy</button>
        <button type="button" data-month-action="next" aria-label="Mes siguiente">›</button>
      </div>
    </header>
    ${renderFiltros("calendario", FICHA)}
    <div class="ficha-calendar-layout"><div class="ficha-calendar-main" role="region" aria-label="Días del calendario">${renderGrid(personal, filtros)}</div>
      ${renderDetalle(personal, filtros)}
      ${detalleVisible ? "" : `<button type="button" class="ficha-detail-open" data-calendar-detail-open>Ver detalle del día</button>`}</div>
    <footer class="ficha-personal-note">La semana comienza el lunes. El domingo se atenúa y queda fuera del horario académico.</footer>
  </div>`;
}

export function initCalendario() {
  const root = document.querySelector("#view-calendario");
  if (!root || root.dataset.fichaReady === "true") return;
  root.dataset.fichaReady = "true";
  root.addEventListener("click", event => {
    if (event.target.closest("[data-calendar-detail-close]")) { detalleVisible = false; renderCalendario(); return; }
    if (event.target.closest("[data-calendar-detail-open]")) { detalleVisible = true; renderCalendario(); return; }
    const action = event.target.closest("[data-month-action]");
    if (action) {
      if (action.dataset.monthAction === "previous") mesActual = new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1);
      if (action.dataset.monthAction === "next") mesActual = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1);
      if (action.dataset.monthAction !== "today") diaSeleccionado = fechaISO(mesActual);
      if (action.dataset.monthAction === "today") {
        mesActual = new Date(hoy().getFullYear(), hoy().getMonth(), 1);
        diaSeleccionado = fechaISO(hoy());
      }
      renderCalendario();
      return;
    }
    const day = event.target.closest("[data-calendar-day]");
    if (day) {
      diaSeleccionado = day.dataset.calendarDay;
      detalleVisible = true;
      const date = parsearFechaLocal(diaSeleccionado);
      mesActual = new Date(date.getFullYear(), date.getMonth(), 1);
      renderCalendario();
    }
  });
  document.addEventListener("traza:filtros-ficha-cambiados", renderCalendario);
  renderCalendario();
}
