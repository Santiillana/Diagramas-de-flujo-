import { HORARIO_CLASES } from "../content/ficha.js";
import { ACTIVIDADES_OFICIALES } from "../content/ficha-activities.js";
import {
  addFeedback, addSubmission, archiveActivity, createActivity,
  isActivityOverdue, readFichaData, readFichaDataStrict, updateActivity,
  transitionActivity, writeFichaData
} from "./ficha-store.js";

const STATUS_LABELS = Object.freeze({
  pending: "Pendiente",
  in_progress: "En curso",
  submitted: "Entregada",
  needs_correction: "Por corregir",
  approved: "Aprobada"
});
const DAY_LABELS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

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

function classLabel(classId) {
  const item = HORARIO_CLASES.find(entry => entry.id === classId);
  if (!item) return "Sin clase relacionada";
  const weekday = DAY_LABELS[item.diaSemana];
  const subject = item.materia || "Clase del sábado";
  return subject + " · " + weekday + " · " + item.instructor;
}

function classOptions(selected = "") {
  return '<option value="">Sin clase relacionada</option>' + HORARIO_CLASES.map(item => {
    const label = classLabel(item.id) + " · " + item.horaInicio + "–" + item.horaFin;
    return '<option value="' + escapeHtml(item.id) + '"' +
      (item.id === selected ? " selected" : "") + ">" + escapeHtml(label) + "</option>";
  }).join("");
}

function dateLabel(value) {
  if (!value) return "Sin fecha";
  const parts = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
  }).format(new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12)));
}

function setStatus(node, message, kind = "info") {
  if (!node) return;
  node.textContent = message;
  node.dataset.status = kind;
}

function persist(result, onSuccess) {
  if (!result?.ok) return result;
  const saved = writeFichaData(result.data);
  if (!saved.ok) return saved;
  onSuccess?.(result, saved.data);
  return saved;
}

function mutationMessage(reason) {
  return ({
    title_required: "Escribe un título para la actividad.",
    invalid_date: "Revisa las fechas. Usa fechas válidas.",
    invalid_date_order: "La fecha de vencimiento no puede ser anterior a la asignación.",
    invalid_class: "La clase seleccionada no existe en el horario oficial.",
    invalid_transition: "Ese cambio de estado no está permitido.",
    submission_empty: "Añade un resumen, un enlace o una observación para registrar la entrega.",
    feedback_required: "Escribe la devolución que recibiste.",
    invalid_feedback: "Selecciona un tipo de devolución válido.",
    invalid_score: "La calificación debe ser numérica.",
    invalid_evidence_url: "El enlace de evidencia debe ser una dirección HTTP o HTTPS segura.",
    existing_corrupt_storage: "Los datos locales están dañados. Restaura un respaldo antes de modificarlos.",
    existing_unsupported_schema: "Los datos pertenecen a una versión no compatible. No se sobrescribieron.",
    existing_invalid_records: "Hay registros locales que necesitan recuperación antes de editarlos.",
    unavailable: "El almacenamiento local no está disponible en este navegador.",
    write_failed: "No se pudieron guardar los cambios. Tus datos anteriores se conservaron."
  })[reason] || "No se pudo completar la operación.";
}

function renderActivityCard(activity, selectedId, today) {
  const overdue = isActivityOverdue(activity, today);
  const due = activity.dueOn ? dateLabel(activity.dueOn) : "Sin vencimiento";
  const status = STATUS_LABELS[activity.status] || "Pendiente";
  return '<button type="button" class="ficha-activity-row' +
    (activity.id === selectedId ? " is-selected" : "") +
    '" data-activity-open="' + escapeHtml(activity.id) +
    '" aria-pressed="' + (activity.id === selectedId) + '">' +
    '<span class="ficha-activity-row-copy"><strong>' + escapeHtml(activity.title) +
    '</strong><small>' + escapeHtml(classLabel(activity.classId)) +
    '</small><small>Vence: ' + escapeHtml(due) + '</small></span>' +
    '<span class="ficha-activity-row-state"><b>' + escapeHtml(overdue ? "Atrasada" : status) +
    '</b><small>' + escapeHtml(status) + "</small></span></button>";
}

function renderAttempt(attempt) {
  return '<article class="ficha-record-card"><header><strong>Entrega ' +
    escapeHtml(attempt.attemptNumber) + '</strong><time>' +
    escapeHtml(new Date(attempt.submittedAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })) +
    '</time></header><p>' + escapeHtml(attempt.summary || "Sin resumen") + "</p>" +
    (attempt.evidenceUrl ? '<p><a href="' + escapeHtml(attempt.evidenceUrl) +
      '" target="_blank" rel="noopener noreferrer">Abrir evidencia ↗</a></p>' : "") +
    (attempt.studentNote ? "<p>" + escapeHtml(attempt.studentNote) + "</p>" : "") +
    "</article>";
}

function renderFeedback(entry) {
  const label = ({
    favorable: "Resultado favorable",
    correction_requested: "Solicitaron correcciones",
    informational: "Información"
  })[entry.result] || "Devolución";
  const score = entry.score === null ? "" :
    "<small>Calificación transcrita: " + escapeHtml(entry.score) +
    (entry.scoreScale ? " / " + escapeHtml(entry.scoreScale) : "") + "</small>";
  return '<article class="ficha-record-card"><header><strong>' + label +
    '</strong><time>' + escapeHtml(new Date(entry.recordedAt).toLocaleString("es-CO", {
      dateStyle: "medium", timeStyle: "short"
    })) + '</time></header><p>' + escapeHtml(entry.comment) +
    '</p>' + score + '<small class="ficha-transcription-note">Transcripción registrada por el estudiante; no verificada por Traza.</small></article>';
}

function renderEvent(event) {
  return '<li><time>' + escapeHtml(new Date(event.occurredAt).toLocaleString("es-CO", {
    dateStyle: "medium", timeStyle: "short"
  })) + '</time><span>' + escapeHtml(event.description) + "</span></li>";
}

export function initFichaActivities() {
  const root = document.querySelector("#ficha-actividades");
  if (!root) return;

  root.innerHTML = '<section class="ficha-official-activities" aria-labelledby="ficha-official-activities-title">' +
    '<div><p class="eyebrow">PUBLICADAS POR TRAZA</p><h2 id="ficha-official-activities-title">Actividades oficiales</h2>' +
    '<p>Instrucciones y fechas compartidas. Este contenido es de solo lectura.</p></div>' +
    '<div id="ficha-official-activities-list"></div></section>' +
    '<div class="ficha-activities-toolbar"><div><p class="eyebrow">SEGUIMIENTO PERSONAL</p>' +
    '<h2>Mis actividades</h2><p>Organiza tus entregas y conserva el historial de cada intento.</p></div>' +
    '<button type="button" class="ficha-primary-button" data-activity-create-toggle aria-expanded="false" aria-controls="ficha-activity-create">+ Nueva actividad</button></div>' +
    '<section class="ficha-activity-create" id="ficha-activity-create" hidden><h3>Registrar actividad</h3>' +
    '<form id="ficha-activity-create-form" class="ficha-activity-form">' +
    '<label>Título <input name="title" maxlength="240" required></label>' +
    '<label>Descripción <textarea name="description" rows="3"></textarea></label>' +
    '<label>Clase relacionada <select name="classId">' + classOptions() + '</select></label>' +
    '<div class="ficha-form-dates"><label>Fecha de asignación <input name="assignedOn" type="date"></label>' +
    '<label>Fecha de vencimiento <input name="dueOn" type="date"></label></div>' +
    '<div class="ficha-form-actions"><button class="ficha-primary-button" type="submit">Guardar actividad</button>' +
    '<button class="ficha-secondary-button" type="button" data-activity-create-toggle>Cancelar</button></div></form></section>' +
    '<p class="ficha-activity-feedback" id="ficha-activities-status" role="status" aria-live="polite"></p>' +
    '<div class="ficha-activities-layout"><section class="ficha-activities-catalog" aria-labelledby="ficha-catalog-title">' +
    '<div class="ficha-catalog-heading"><h3 id="ficha-catalog-title">Tu seguimiento</h3><span id="ficha-activity-count"></span></div>' +
    '<div class="ficha-activity-filters"><label class="ficha-filter-search">Buscar <input id="ficha-activity-search" type="search" placeholder="Nombre o descripción"></label>' +
    '<label>Estado <select id="ficha-activity-filter"><option value="all">Todos</option>' +
    '<option value="pending">Pendiente</option><option value="in_progress">En curso</option>' +
    '<option value="submitted">Entregada</option><option value="needs_correction">Por corregir</option>' +
    '<option value="approved">Aprobada</option></select></label>' +
    '<label>Fecha <select id="ficha-activity-date-filter"><option value="all">Todas</option>' +
    '<option value="overdue">Atrasadas</option><option value="upcoming">Próximas</option>' +
    '</select></label></div><div id="ficha-activities-list" class="ficha-activities-list"></div></section>' +
    '<section class="ficha-activity-detail" id="ficha-activity-detail" aria-live="polite" aria-label="Detalle de actividad">' +
    '<div class="ficha-detail-empty"><span aria-hidden="true">◎</span><h3>Selecciona una actividad</h3>' +
    '<p>El detalle mostrará fechas, entregas, devoluciones y bitácora.</p></div></section></div>';

  let selectedId = null;
  const statusNode = root.querySelector("#ficha-activities-status");
  const listNode = root.querySelector("#ficha-activities-list");
  const countNode = root.querySelector("#ficha-activity-count");
  const detailNode = root.querySelector("#ficha-activity-detail");
  const createPanel = root.querySelector("#ficha-activity-create");

  function currentData() {
    return readFichaData();
  }

  function renderOfficialActivities() {
    const target = root.querySelector("#ficha-official-activities-list");
    const entries = ACTIVIDADES_OFICIALES.filter(item =>
      item && typeof item.id === "string" && typeof item.title === "string" && item.title.trim()
    );
    if (!entries.length) {
      target.innerHTML = '<p class="ficha-official-empty">Todavía no hay actividades oficiales publicadas.</p>';
      return;
    }
    target.innerHTML = entries.map(item => {
      const link = item.instructionsUrl ? safeInstructionsUrl(item.instructionsUrl) : null;
      return '<article class="ficha-official-activity"><div><h3>' + escapeHtml(item.title) +
        '</h3><p>' + escapeHtml(item.description || "Sin descripción") + '</p><small>' +
        escapeHtml(classLabel(item.classId)) + ' · Asignada: ' + escapeHtml(dateLabel(item.assignedOn)) +
        ' · Vence: ' + escapeHtml(dateLabel(item.dueOn)) + '</small></div>' +
        (link ? '<a href="' + escapeHtml(link) + '" target="_blank" rel="noopener noreferrer">Ver instrucciones ↗</a>' : "") +
        '</article>';
    }).join("");
  }

  function safeInstructionsUrl(value) {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
    } catch {
      return null;
    }
  }

  function renderList() {
    const today = todayInBogota();
    const stored = readFichaDataStrict();
    const data = stored.ok ? stored.data : { activities: [] };
    if (!stored.ok) {
      setStatus(statusNode, "No se pueden leer los datos locales (" + stored.reason + "). Restaura un respaldo válido antes de continuar.", "error");
    }
    const query = root.querySelector("#ficha-activity-search").value.trim().toLocaleLowerCase("es");
    const status = root.querySelector("#ficha-activity-filter").value;
    const dateFilter = root.querySelector("#ficha-activity-date-filter").value;
    const records = data.activities.filter(item => {
      if (item.archivedAt) return false;
      if (status !== "all" && item.status !== status) return false;
      if (query && !(item.title + " " + item.description).toLocaleLowerCase("es").includes(query)) return false;
      if (dateFilter === "overdue" && !isActivityOverdue(item, today)) return false;
      if (dateFilter === "upcoming" && (!item.dueOn || item.dueOn < today ||
          item.status === "approved")) return false;
      return true;
    }).sort((a, b) => {
      if (!a.dueOn && !b.dueOn) return a.title.localeCompare(b.title, "es");
      if (!a.dueOn) return 1;
      if (!b.dueOn) return -1;
      return a.dueOn.localeCompare(b.dueOn) || a.title.localeCompare(b.title, "es");
    });
    countNode.textContent = records.length + (records.length === 1 ? " actividad" : " actividades");
    listNode.innerHTML = records.length
      ? records.map(item => renderActivityCard(item, selectedId, today)).join("")
      : '<div class="ficha-detail-empty"><h3>No hay actividades en esta vista</h3><p>Crea una actividad o cambia los filtros.</p></div>';
    if (selectedId && !data.activities.some(item => item.id === selectedId && !item.archivedAt)) {
      selectedId = null;
    }
    if (selectedId) renderDetail();
    else detailNode.innerHTML = '<div class="ficha-detail-empty"><span aria-hidden="true">◎</span><h3>Selecciona una actividad</h3><p>El detalle mostrará fechas, entregas, devoluciones y bitácora.</p></div>';
  }

  function renderDetail() {
    const activity = currentData().activities.find(item => item.id === selectedId && !item.archivedAt);
    if (!activity) {
      detailNode.innerHTML = '<div class="ficha-detail-empty"><h3>Selecciona una actividad</h3><p>El detalle aparecerá aquí.</p></div>';
      return;
    }
    const today = todayInBogota();
    const overdue = isActivityOverdue(activity, today);
    const status = STATUS_LABELS[activity.status] || "Pendiente";
    const attempts = activity.attempts.map(renderAttempt).join("");
    const feedback = activity.feedbackEntries.map(renderFeedback).join("");
    const events = activity.events.slice().reverse().map(renderEvent).join("");
    const canSubmit = ["pending", "in_progress", "needs_correction"].includes(activity.status);
    detailNode.innerHTML = '<div class="ficha-detail-heading"><div><p class="eyebrow">DETALLE DE ACTIVIDAD</p>' +
      '<h3>' + escapeHtml(activity.title) + '</h3><span class="ficha-detail-badge">' +
      escapeHtml(overdue ? "Atrasada · " + status : status) + '</span></div>' +
      '<button type="button" class="ficha-secondary-button" data-activity-close-detail>Cerrar</button></div>' +
      '<div class="ficha-detail-meta"><span>Asignada: ' + escapeHtml(dateLabel(activity.assignedOn)) +
      '</span><span>Vence: ' + escapeHtml(dateLabel(activity.dueOn)) +
      '</span><span>' + escapeHtml(classLabel(activity.classId)) + '</span></div>' +
      (activity.description ? '<p class="ficha-detail-description">' + escapeHtml(activity.description) + '</p>' : "") +
      (activity.status === "pending" ? '<button type="button" class="ficha-secondary-button" data-activity-start>Marcar como En curso</button>' : "") +
      '<details class="ficha-detail-section"><summary>Editar información</summary><form id="ficha-activity-edit-form" class="ficha-activity-form">' +
      '<label>Título <input name="title" maxlength="240" required value="' + escapeHtml(activity.title) + '"></label>' +
      '<label>Descripción <textarea name="description" rows="3">' + escapeHtml(activity.description) + '</textarea></label>' +
      '<label>Clase relacionada <select name="classId">' + classOptions(activity.classId || "") + '</select></label>' +
      '<div class="ficha-form-dates"><label>Fecha de asignación <input name="assignedOn" type="date" value="' + escapeHtml(activity.assignedOn || "") + '"></label>' +
      '<label>Fecha de vencimiento <input name="dueOn" type="date" value="' + escapeHtml(activity.dueOn || "") + '"></label></div>' +
      '<button class="ficha-primary-button" type="submit">Guardar cambios</button></form></details>' +
      '<section class="ficha-detail-section"><h4>Entregas e intentos</h4>' +
      (attempts || '<p class="ficha-detail-muted">Todavía no has registrado entregas.</p>') +
      (canSubmit ? '<form id="ficha-activity-submit-form" class="ficha-activity-form ficha-inline-form">' +
        '<label>Resumen de la entrega <textarea name="summary" rows="2" placeholder="Qué entregaste" required></textarea></label>' +
        '<label>Enlace de evidencia <input name="evidenceUrl" type="url" placeholder="https://..."></label>' +
        '<label>Observación <textarea name="studentNote" rows="2"></textarea></label>' +
        '<button class="ficha-primary-button" type="submit">Registrar entrega</button></form>' : "") +
      '</section><section class="ficha-detail-section"><h4>Devoluciones</h4>' +
      (feedback || '<p class="ficha-detail-muted">Aún no hay devoluciones registradas.</p>') +
      (activity.attempts.length ? '<form id="ficha-activity-feedback-form" class="ficha-activity-form ficha-inline-form">' +
        '<p class="ficha-transcription-note">Registra aquí lo que te comunicó tu instructor. Traza no verifica su identidad.</p>' +
        '<label>Resultado <select name="result"><option value="informational">Información</option>' +
        '<option value="correction_requested">Solicitaron correcciones</option><option value="favorable">Favorable</option></select></label>' +
        '<label>Comentario <textarea name="comment" rows="3" required></textarea></label>' +
        '<div class="ficha-form-dates"><label>Calificación (opcional) <input name="score" type="number" step="any"></label>' +
        '<label>Escala (opcional) <input name="scoreScale" placeholder="Ej. 0 a 5"></label></div>' +
        '<button class="ficha-primary-button" type="submit">Guardar devolución transcrita</button></form>' : "") +
      '</section><details class="ficha-detail-section"><summary>Notas personales</summary>' +
      '<form id="ficha-activity-notes-form" class="ficha-activity-form"><label>Notas <textarea name="notes" rows="4">' +
      escapeHtml(activity.notes) + '</textarea></label><button class="ficha-primary-button" type="submit">Guardar notas</button></form></details>' +
      '<details class="ficha-detail-section"><summary>Bitácora (' + activity.events.length + ')</summary><ol class="ficha-activity-timeline">' +
      (events || "<li>Sin movimientos.</li>") + '</ol></details>' +
      '<div class="ficha-detail-danger"><button type="button" class="ficha-danger-button" data-activity-archive>Archivar actividad</button></div>';
  }

  root.addEventListener("input", event => {
    if (event.target.matches("#ficha-activity-search")) renderList();
  });
  root.addEventListener("change", event => {
    if (event.target.matches("#ficha-activity-filter, #ficha-activity-date-filter")) renderList();
  });
  root.addEventListener("click", event => {
    const createToggle = event.target.closest("[data-activity-create-toggle]");
    if (createToggle) {
      createPanel.hidden = !createPanel.hidden;
      root.querySelectorAll("[data-activity-create-toggle]").forEach(button =>
        button.setAttribute("aria-expanded", String(!createPanel.hidden)));
      if (!createPanel.hidden) root.querySelector('#ficha-activity-create-form [name="title"]').focus();
      return;
    }
    const open = event.target.closest("[data-activity-open]");
    if (open) {
      selectedId = open.dataset.activityOpen;
      renderList();
      return;
    }
    if (event.target.closest("[data-activity-close-detail]")) {
      selectedId = null;
      renderList();
      return;
    }
    if (event.target.closest("[data-activity-start]")) {
      const result = transitionActivity(selectedId, "in_progress");
      const saved = persist(result, () => renderList());
      setStatus(statusNode, saved.ok ? "Actividad marcada En curso." : mutationMessage(saved.reason), saved.ok ? "success" : "error");
      return;
    }
    if (event.target.closest("[data-activity-archive]")) {
      if (!window.confirm("La actividad se archivará y conservará su bitácora. ¿Continuar?")) return;
      const result = archiveActivity(selectedId);
      const saved = persist(result, () => { selectedId = null; renderList(); });
      setStatus(statusNode, saved.ok ? "Actividad archivada." : mutationMessage(saved.reason), saved.ok ? "success" : "error");
    }
  });

  root.addEventListener("submit", event => {
    const form = event.target;
    if (!form.matches("form")) return;
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (form.id === "ficha-activity-create-form" || form.id === "ficha-activity-edit-form") {
      values.assignedOn = values.assignedOn || null;
      values.dueOn = values.dueOn || null;
      values.classId = values.classId || null;
    }
    let result;
    let message = "Cambios guardados.";

    if (form.id === "ficha-activity-create-form") {
      result = createActivity(values);
      message = "Actividad creada.";
    } else if (form.id === "ficha-activity-edit-form") {
      result = updateActivity(selectedId, values);
      message = "Actividad actualizada.";
    } else if (form.id === "ficha-activity-submit-form") {
      result = addSubmission(selectedId, values);
      message = "Entrega registrada.";
    } else if (form.id === "ficha-activity-feedback-form") {
      result = addFeedback(selectedId, values);
      message = "Devolución transcrita.";
    } else if (form.id === "ficha-activity-notes-form") {
      result = updateActivity(selectedId, { notes: values.notes });
      message = "Notas guardadas.";
    } else {
      return;
    }

    const saved = persist(result, (mutation) => {
      if (form.id === "ficha-activity-create-form") {
        selectedId = mutation.activity.id;
        createPanel.hidden = true;
        root.querySelectorAll("[data-activity-create-toggle]").forEach(button =>
          button.setAttribute("aria-expanded", "false"));
        form.reset();
      }
      renderList();
    });
    setStatus(statusNode, saved.ok ? message : mutationMessage(saved.reason), saved.ok ? "success" : "error");
  });

  renderOfficialActivities();
  window.addEventListener("traza:ficha-change", renderList);
  renderList();
}
