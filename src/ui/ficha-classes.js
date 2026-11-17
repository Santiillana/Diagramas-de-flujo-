import { HORARIO_CLASES } from "../content/ficha.js";
import { validateOfficialActivities } from "../content/ficha-activities.js";
import { validateOfficialResources } from "../content/ficha-resources.js";
import { lessons } from "../content/lessons.js";
import { exercises } from "../content/exercises.js";
import { learningForClass } from "../content/class-learning-map.js";

const DAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function todayInBogota() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return values.year + "-" + values.month + "-" + values.day;
}

function isActiveOnDate(item, date) {
  return (!item.vigenteDesde || item.vigenteDesde <= date) &&
    (!item.vigenteHasta || item.vigenteHasta >= date);
}

function formatTime(value) {
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours < 12 ? "a. m." : "p. m.";
  const normalized = hours % 12 || 12;
  return normalized + (minutes ? ":" + String(minutes).padStart(2, "0") : "") + " " + suffix;
}

function classTitle(item) {
  if (item.materia) return item.materia;
  return item.diaSemana === 6 ? "Clase del sábado" : "Clase sin materia confirmada";
}

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
      ? url.href : null;
  } catch {
    return null;
  }
}

function renderOfficialItems(items, type, isValid = true) {
  if (!isValid) {
    return '<p class="ficha-class-empty">El catálogo oficial necesita revisión antes de mostrarse.</p>';
  }
  if (!items.length) {
    return '<p class="ficha-class-empty">Aún no hay ' +
      (type === "activity" ? "actividades oficiales" : "recursos oficiales") +
      " publicados para esta clase.</p>";
  }
  return '<ul class="ficha-class-content-list">' + items.map(item =>
    '<li><strong>' + escapeHtml(item.title) + '</strong>' +
    (item.description ? '<p>' + escapeHtml(item.description) + '</p>' : "") +
    (safeExternalUrl(item.url || item.instructionsUrl || "")
      ? '<a href="' + escapeHtml(safeExternalUrl(item.url || item.instructionsUrl)) +
        '" target="_blank" rel="noopener noreferrer">Abrir ↗</a>' : "") +
    '</li>'
  ).join("") + "</ul>";
}

export function initFichaClasses() {
  const root = document.querySelector("#ficha-clases");
  if (!root) return;

  function render() {
  const today = todayInBogota();
  const active = HORARIO_CLASES.filter(item => isActiveOnDate(item, today))
    .slice().sort((a, b) => a.diaSemana - b.diaSemana ||
      a.horaInicio.localeCompare(b.horaInicio));
  const historical = HORARIO_CLASES.filter(item => !isActiveOnDate(item, today))
    .slice().sort((a, b) => a.diaSemana - b.diaSemana ||
      a.horaInicio.localeCompare(b.horaInicio));

  const activitiesValidation = validateOfficialActivities();
  const resourcesValidation = validateOfficialResources();
  const officialActivities = activitiesValidation.ok ? activitiesValidation.data : [];
  const officialResources = resourcesValidation.ok ? resourcesValidation.data : [];

  const cards = active.map(item => {
    const activities = officialActivities.filter(entry => entry.classId === item.id);
    const resources = officialResources.filter(entry => entry.classId === item.id);
    const learning = learningForClass(item.id);
    const linkedLessons = learning ? learning.lessonIds
      .map(id => lessons.find(entry => entry.id === id)).filter(Boolean) : [];
    const linkedExercises = learning ? learning.exerciseIds
      .map(id => exercises.find(entry => entry.id === id)).filter(Boolean) : [];
    const learningMarkup = linkedLessons.length || linkedExercises.length
      ? '<div class="ficha-class-learning-links">' +
        linkedLessons.map(entry => '<button type="button" data-class-open-lesson="' + escapeHtml(entry.id) + '">Lección: ' + escapeHtml(entry.title) + ' ↗</button>').join("") +
        linkedExercises.map(entry => '<button type="button" data-class-open-exercise="' + escapeHtml(entry.id) + '">Ejercicio ' + escapeHtml(entry.id) + ': ' + escapeHtml(entry.title) + ' ↗</button>').join("") +
        '</div>'
      : '<p>Sin asociación pedagógica confirmada para esta clase todavía.</p>';
    const label = classTitle(item);
    const block = item.diaSemana === 6
      ? "Bloque " + (item.id === "sabado-bloque-1" ? "1" : "2")
      : "Clase semanal";
    return '<article class="ficha-class-card"><div class="ficha-class-card-top"><div>' +
      '<p class="eyebrow">' + escapeHtml(block) + '</p><h3>' + escapeHtml(label) + '</h3>' +
      '<p class="ficha-class-teacher">' + escapeHtml(item.instructor) + '</p></div>' +
      '<span class="ficha-class-day">' + DAY_LABELS[item.diaSemana] + '</span></div>' +
      '<div class="ficha-class-time"><strong>' + formatTime(item.horaInicio) + ' – ' +
      formatTime(item.horaFin) + '</strong><small>' + escapeHtml(item.horaInicio) +
      '–' + escapeHtml(item.horaFin) + ' · Hora de Colombia</small></div>' +
      '<div class="ficha-class-published"><section><h4>Actividades oficiales</h4>' +
      renderOfficialItems(activities, "activity", activitiesValidation.ok) + '</section><section><h4>Biblioteca oficial</h4>' +
      renderOfficialItems(resources, "resource", resourcesValidation.ok) + '</section></div>' +
      '<div class="ficha-class-learn"><strong>Contenido de Aprende</strong>' +
      learningMarkup + '</div></article>';
  }).join("");

  root.innerHTML = '<header class="ficha-classes-heading"><div><p class="eyebrow">MI FICHA · FORMACIÓN</p>' +
    '<h2>Mis clases</h2><p>Consulta las materias, instructores, horarios y publicaciones oficiales.</p></div>' +
    '<span>' + active.length + ' bloques vigentes</span></header>' +
    (cards ? '<div class="ficha-classes-grid">' + cards + '</div>' :
      '<p class="ficha-class-empty">No hay bloques de clase vigentes para hoy.</p>') +
    (historical.length ? '<details class="ficha-classes-history"><summary>Historial de bloques con vigencia terminada (' +
      historical.length + ')</summary><ul>' + historical.map(item =>
        '<li><strong>' + escapeHtml(classTitle(item)) + '</strong> · ' +
        DAY_LABELS[item.diaSemana] + ' · ' + escapeHtml(formatTime(item.horaInicio)) +
        '–' + escapeHtml(formatTime(item.horaFin)) + ' · ' +
        escapeHtml(item.instructor) + ' · Vigente hasta ' +
        escapeHtml(item.vigenteHasta || "fecha no indicada") + '</li>'
      ).join("") + '</ul></details>' : "");
  }
  root.addEventListener("click", event => {
    const lesson = event.target.closest("[data-class-open-lesson]");
    const exercise = event.target.closest("[data-class-open-exercise]");
    if (lesson) {
      document.dispatchEvent(new CustomEvent("traza:navigate", { detail: { space: "learn" } }));
      document.dispatchEvent(new CustomEvent("traza:select-lesson", {
        detail: { lessonId: lesson.dataset.classOpenLesson }
      }));
    } else if (exercise) {
      document.dispatchEvent(new CustomEvent("traza:navigate", { detail: { space: "exercises" } }));
      document.dispatchEvent(new CustomEvent("traza:select-exercise", {
        detail: { exerciseId: exercise.dataset.classOpenExercise }
      }));
    }
  });

  render();
  window.setInterval(render, 60_000);
  window.addEventListener("focus", render);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) render();
  });
}
