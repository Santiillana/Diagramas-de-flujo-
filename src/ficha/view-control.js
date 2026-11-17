import { FICHA } from "../content/ficha.js";
import { leerFicha } from "./store.js";
import { hoy, inicioSemana, fechaISO, textoRelativo, diferenciaDias } from "./fechas.js";
import { formatearFecha, escaparHTML } from "./view-utils.js";
import { clasesDelDia, panel } from "./selectores.js";
import { ESTADO } from "./estados.js";

const KEY_HECHAS = "traza:v4:evidencias-hechas";
const nombresDia = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const leerHechas = () => {
  try { const value = JSON.parse(localStorage.getItem(KEY_HECHAS) || "[]"); return Array.isArray(value) ? value.filter(id => typeof id === "string") : []; }
  catch { return []; }
};
const guardarHechas = value => { try { localStorage.setItem(KEY_HECHAS, JSON.stringify(value)); } catch { /* La marca es local y opcional. */ } };

function renderHorario(fecha) {
  const lunes = inicioSemana(fecha);
  return nombresDia.map((nombre, index) => {
    const dia = new Date(lunes); dia.setDate(dia.getDate() + index);
    const actual = fechaISO(dia) === fechaISO(fecha);
    const clases = clasesDelDia(dia);
    const interior = clases.length ? clases.map(clase => `<div class="control-class">
      <time>${escaparHTML(clase.inicio)} – ${escaparHTML(clase.fin)}</time>
      <strong>${escaparHTML(clase.competencia?.nombre ?? clase.titulo ?? "Por confirmar")}</strong>
      <span>${escaparHTML(clase.instructor?.nombre ?? "Instructor por confirmar")}</span>
    </div>`).join("") : `<p class="control-confirm">Por confirmar</p>`;
    return `<article class="control-day${actual ? " is-today" : ""}"><header><strong>${nombre}</strong><time>${dia.getDate()}</time>${actual ? '<span class="control-today">◷ Hoy</span>' : ""}</header>${interior}</article>`;
  }).join("");
}

function renderEvidencias(fecha, personal) {
  const grupos = panel(personal, fecha);
  const pendientes = [...grupos.atrasadas, ...grupos.hoy, ...grupos.semana, ...grupos.proxima, ...grupos.sinFecha]
    .sort((a, b) => (a.limite || "9999-99-99").localeCompare(b.limite || "9999-99-99"));
  const hechas = leerHechas();
  const visibles = pendientes.filter(item => !hechas.includes(item.id)).slice(0, 5);
  const filas = visibles.map(item => {
    const comp = FICHA.competencias.find(value => value.id === item.competenciaId);
    const diferencia = item.limite ? textoRelativo(item.limite, fecha) : "Sin fecha";
    return `<label class="control-evidence"><input type="checkbox" data-evidence-done="${escaparHTML(item.id)}" aria-label="Marcar como hecha: ${escaparHTML(item.titulo)}"><span class="control-evidence-copy"><strong>${escaparHTML(item.titulo)}</strong><small><i aria-hidden="true"></i>${escaparHTML(comp?.nombre ?? "Competencia por confirmar")}</small></span><span class="control-date">◷ ${escaparHTML(diferencia)}</span></label>`;
  }).join("");
  const hechosHTML = hechas.length ? `<details class="control-done"><summary>Hechas (${hechas.length})</summary>${hechas.map(id => FICHA.actividades.find(item => item.id === id)).filter(Boolean).map(item => `<p>✓ <s>${escaparHTML(item.titulo)}</s><button type="button" data-evidence-undo="${escaparHTML(item.id)}">Deshacer</button></p>`).join("")}</details>` : "";
  return `${filas || '<p class="control-empty">✓ Estás al día con las evidencias</p>'}${hechosHTML}<a class="control-link" href="#view-actividades" data-go="actividades">Ver todas</a>`;
}

function renderInstructores() {
  return FICHA.instructores.map(instructor => {
    const clase = FICHA.horario.find(item => item.instructorId === instructor.id);
    const competencia = FICHA.competencias.find(item => item.id === clase?.competenciaId);
    const iniciales = instructor.nombre.split(/\s+/).slice(0, 2).map(p => p[0]).join("").toLocaleUpperCase("es");
    return `<article class="control-instructor"><span class="control-avatar" aria-hidden="true">${escaparHTML(iniciales)}</span><span><strong>${escaparHTML(instructor.nombre)}</strong><small>${escaparHTML(competencia?.nombre ?? "Materia por confirmar")} · ${escaparHTML(competencia?.nombre ?? "Competencia por confirmar")}</small><small>Contacto por confirmar</small></span></article>`;
  }).join("") || '<p class="control-empty">Instructores por confirmar</p>';
}

function renderComunicados(fecha) {
  const items = [...(FICHA.comunicados || [])].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  if (!items.length) return '<p class="control-empty">Sin comunicados por ahora</p>';
  return items.map(item => {
    const delta = diferenciaDias(item.fecha, fecha);
    const relativa = delta === 0 ? "Hoy" : delta === -1 ? "Ayer" : formatearFecha(item.fecha, { day: "numeric", month: "short" });
    return `<article class="control-announcement"><span class="control-announce-type" data-type="${item.tipo === "importante" ? "importante" : "informativo"}">${item.tipo === "importante" ? "⚠ Importante" : "ⓘ Informativo"}</span><time>${escaparHTML(relativa)}</time><strong>${escaparHTML(item.titulo)}</strong><p>${escaparHTML(item.texto)}</p><button type="button" class="control-read-more" aria-expanded="false">Leer más</button></article>`;
  }).join("");
}

export function renderControl() {
  const root = document.querySelector("#view-hoy");
  if (!root) return;
  const fecha = hoy();
  const personal = leerFicha();
  const clasesHoy = clasesDelDia(fecha);
  const pendientes = FICHA.actividades.filter(item => ![ESTADO.APROBADA, ESTADO.ENTREGADA].includes(personal.actividades?.[item.id]?.estado)).length;
  const resumen = [pendientes ? `${pendientes} ${pendientes === 1 ? "evidencia por entregar" : "evidencias por entregar"}` : "Sin evidencias próximas", clasesHoy.length ? `clase hoy a las ${clasesHoy[0].inicio}` : "sin clase hoy"].join(" · ");
  root.innerHTML = `<div class="ficha-view-content control-view">
    <header class="ficha-view-heading"><div><p class="eyebrow">MI FICHA · CENTRO DE CONTROL</p><h2 id="hoy-title">${escaparHTML(formatearFecha(fecha, { weekday: "long", day: "numeric", month: "long" }))}</h2><p class="control-summary">${escaparHTML(resumen)}</p>${FICHA.meta.esDemostracion ? '<span class="control-demo">Datos de demostración</span>' : ""}</div></header>
    <div class="control-grid">
      <section class="control-panel control-schedule"><h3>Horario</h3><div class="control-days">${renderHorario(fecha)}</div><a class="control-link" href="#view-clases" data-go="clases">Ver clases</a></section>
      <section class="control-panel control-evidences"><h3>Evidencias pendientes</h3>${renderEvidencias(fecha, personal)}</section>
      <section class="control-panel control-announcements-list"><h3>Comunicados</h3>${renderComunicados(fecha)}</section>
      <section class="control-panel control-instructors-list"><h3>Instructores</h3>${renderInstructores()}</section>
    </div><footer class="ficha-personal-note">Tus marcas de evidencias se guardan solo en este navegador.</footer>
  </div>`;
}

export function initControl() {
  const root = document.querySelector("#view-hoy");
  if (!root || root.dataset.controlReady) return;
  root.dataset.controlReady = "true";
  root.addEventListener("change", event => {
    const checkbox = event.target.closest("[data-evidence-done]");
    if (!checkbox) return;
    const id = checkbox.dataset.evidenceDone;
    const hechas = new Set(leerHechas());
    hechas.add(id);
    guardarHechas([...hechas]);
    renderControl();
  });
  root.addEventListener("click", event => {
    const undo = event.target.closest("[data-evidence-undo]");
    if (undo) {
      guardarHechas(leerHechas().filter(id => id !== undo.dataset.evidenceUndo));
      renderControl();
      return;
    }
    const toggle = event.target.closest(".control-read-more");
    if (toggle) {
      const expanded = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.closest(".control-announcement").classList.toggle("is-expanded", expanded);
      toggle.textContent = expanded ? "Leer menos" : "Leer más";
    }
  });
  renderControl();
}
