import {
  archiveLibraryResource, createLibraryBackup, createLibraryResource,
  importLibraryBackup, readLibraryData, readLibraryDataStrict,
  updateLibraryResource, validateLibraryBackup, writeLibraryData
} from "./ficha-library-store.js";
import { HORARIO_CLASES } from "../content/ficha.js";
import { RECURSOS_OFICIALES } from "../content/ficha-resources.js";

const KIND_LABELS = Object.freeze({
  link: "Enlace", video: "Video", document: "Documento o PDF",
  book: "Libro", note: "Apunte"
});

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function classLabel(id) {
  const item = HORARIO_CLASES.find(entry => entry.id === id);
  return item ? (item.materia || "Clase del sábado") + " · " + item.instructor : "Sin clase relacionada";
}

function classOptions(selected = "") {
  return '<option value="">Sin clase relacionada</option>' + HORARIO_CLASES.map(item => {
    const label = classLabel(item.id) + " · " + item.horaInicio + "–" + item.horaFin;
    return '<option value="' + escapeHtml(item.id) + '"' +
      (item.id === selected ? " selected" : "") + ">" + escapeHtml(label) + "</option>";
  }).join("");
}

function setStatus(node, message, kind = "info") {
  node.textContent = message;
  node.dataset.status = kind;
}

function mutationMessage(reason) {
  return ({
    title_required: "Escribe un título para el recurso.",
    invalid_kind: "Selecciona un tipo de recurso válido.",
    invalid_url: "El enlace debe ser HTTP o HTTPS y no puede incluir credenciales.",
    invalid_class: "La clase seleccionada no existe en el horario oficial.",
    resource_content_required: "Añade un enlace o una descripción para guardar el recurso.",
    corrupt_storage: "La biblioteca local está dañada. Restaura un respaldo antes de editar.",
    existing_corrupt_storage: "La biblioteca local está dañada. Restaura un respaldo antes de editar.",
    unsupported_schema: "La biblioteca pertenece a una versión no compatible. No se sobrescribió.",
    existing_unsupported_schema: "La biblioteca pertenece a una versión no compatible. No se sobrescribió.",
    invalid_records: "La biblioteca contiene registros que necesitan recuperación.",
    existing_invalid_records: "La biblioteca contiene registros que necesitan recuperación.",
    duplicate_ids: "Hay identificadores duplicados; restaura un respaldo válido.",
    existing_duplicate_ids: "Hay identificadores duplicados; restaura un respaldo válido.",
    unavailable: "El almacenamiento local no está disponible en este navegador.",
    write_failed: "No se pudo guardar el cambio."
  })[reason] || "No se pudo completar la operación.";
}

function kindOptions(selected = "link") {
  return Object.entries(KIND_LABELS).map(([value, label]) =>
    '<option value="' + value + '"' + (value === selected ? " selected" : "") +
    ">" + label + "</option>"
  ).join("");
}

function resourceCard(item, selectedId) {
  const title = escapeHtml(item.title);
  const label = KIND_LABELS[item.kind];
  return '<button type="button" class="ficha-library-card' +
    (item.id === selectedId ? " is-selected" : "") +
    '" data-library-open="' + escapeHtml(item.id) +
    '" aria-pressed="' + (item.id === selectedId) + '">' +
    '<span class="ficha-library-card-icon" aria-hidden="true">' +
    ({ link: "↗", video: "▷", document: "▤", book: "▣", note: "✎" })[item.kind] +
    '</span><span class="ficha-library-card-copy"><strong>' + title +
    '</strong><small>' + escapeHtml(label) + " · " + escapeHtml(classLabel(item.classId)) +
    '</small><small>' + escapeHtml(item.tags.join(" · ") || "Sin etiquetas") +
    '</small></span></button>';
}

function resourceDate(value) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium", timeZone: "UTC"
  }).format(new Date(value));
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

const MAX_BACKUP_BYTES = 2 * 1024 * 1024;

export function initFichaLibrary() {
  const root = document.querySelector("#ficha-biblioteca");
  if (!root) return;

  root.innerHTML = '<section class="ficha-official-library" aria-labelledby="ficha-official-library-title">' +
    '<div><p class="eyebrow">PUBLICADOS POR TRAZA</p><h2 id="ficha-official-library-title">Recursos oficiales</h2>' +
    '<p>Materiales revisados y compartidos para todos los estudiantes.</p></div>' +
    '<div id="ficha-official-library-list"></div></section>' +
    '<div class="ficha-library-toolbar"><div><p class="eyebrow">RECURSOS PERSONALES</p>' +
    '<h2>Mi biblioteca</h2><p>Guarda enlaces, videos, documentos, libros y apuntes relacionados con tus clases.</p></div>' +
    '<button type="button" class="ficha-primary-button" data-library-create-toggle aria-expanded="false" aria-controls="ficha-library-create">+ Añadir recurso</button></div>' +
    '<p class="ficha-library-local-note">Biblioteca personal de este navegador. Los recursos oficiales compartidos por Traza se publicarán por separado.</p>' +
    '<section id="ficha-library-create" class="ficha-library-create" hidden><h3>Añadir a mi biblioteca</h3>' +
    '<form id="ficha-library-create-form" class="ficha-library-form">' +
    '<label>Nombre del recurso <input name="title" maxlength="240" required></label>' +
    '<div class="ficha-library-form-grid"><label>Tipo <select name="kind">' + kindOptions() + '</select></label>' +
    '<label>Clase relacionada <select name="classId">' + classOptions() + '</select></label></div>' +
    '<label>Enlace (opcional) <input name="url" type="url" placeholder="https://..."></label>' +
    '<label>Descripción o apunte <textarea name="description" rows="3" placeholder="Qué contiene y para qué te sirve"></textarea></label>' +
    '<label>Etiquetas <input name="tags" placeholder="Ej. algoritmos, repaso, evidencia"></label>' +
    '<div class="ficha-library-form-actions"><button type="submit" class="ficha-primary-button">Guardar recurso</button>' +
    '<button type="button" class="ficha-secondary-button" data-library-create-toggle>Cancelar</button></div></form></section>' +
    '<p id="ficha-library-status" class="ficha-library-status" role="status" aria-live="polite"></p>' +
    '<div class="ficha-library-layout"><section class="ficha-library-catalog" aria-labelledby="ficha-library-catalog-title">' +
    '<div class="ficha-library-heading"><h3 id="ficha-library-catalog-title">Mis recursos</h3><span id="ficha-library-count"></span></div>' +
    '<div class="ficha-library-filters"><label>Buscar <input id="ficha-library-search" type="search" placeholder="Título, descripción o etiqueta"></label>' +
    '<label>Tipo <select id="ficha-library-kind-filter"><option value="all" selected>Todos</option>' + kindOptions(null) +
    '</select></label></div><div id="ficha-library-list" class="ficha-library-list"></div></section>' +
    '<section id="ficha-library-detail" class="ficha-library-detail" aria-live="polite" aria-label="Detalle del recurso">' +
    '<div class="ficha-library-empty"><h3>Selecciona un recurso</h3><p>Podrás consultar sus datos, abrir el enlace y editar tus notas.</p></div></section></div>' +
    '<section class="ficha-library-backup"><div><h3>Respaldo de biblioteca</h3><p>Exporta o restaura los recursos personales de este navegador. Este respaldo es independiente del de Actividades.</p></div>' +
    '<div class="ficha-library-backup-actions"><button type="button" id="ficha-library-export">Descargar biblioteca</button>' +
    '<button type="button" id="ficha-library-import">Importar biblioteca</button>' +
    '<input type="file" id="ficha-library-file" accept="application/json,.json" hidden></div>' +
    '<p id="ficha-library-backup-status" role="status" aria-live="polite">Sin operaciones recientes.</p></section>';

  let selectedId = null;
  const statusNode = root.querySelector("#ficha-library-status");
  const listNode = root.querySelector("#ficha-library-list");
  const countNode = root.querySelector("#ficha-library-count");
  const detailNode = root.querySelector("#ficha-library-detail");
  const createPanel = root.querySelector("#ficha-library-create");

  function readStrict() {
    return readLibraryDataStrict();
  }

  function renderOfficialResources() {
    const target = root.querySelector("#ficha-official-library-list");
    const entries = RECURSOS_OFICIALES.filter(item =>
      item && typeof item.id === "string" && typeof item.title === "string" && item.title.trim()
    );
    if (!entries.length) {
      target.innerHTML = '<p class="ficha-official-empty">Todavía no hay recursos oficiales publicados.</p>';
      return;
    }
    target.innerHTML = entries.map(item => {
      const link = item.url ? safeExternalUrl(item.url) : null;
      const tags = Array.isArray(item.tags) ? item.tags : [];
      return '<article class="ficha-official-resource"><div><h3>' + escapeHtml(item.title) +
        '</h3><p>' + escapeHtml(item.description || "Sin descripción") + '</p><small>' +
        escapeHtml(KIND_LABELS[item.kind] || "Recurso") + ' · ' + escapeHtml(classLabel(item.classId)) +
        (tags.length ? ' · ' + escapeHtml(tags.join(" · ")) : "") + '</small></div>' +
        (link ? '<a href="' + escapeHtml(link) + '" target="_blank" rel="noopener noreferrer">Abrir recurso ↗</a>' : "") +
        '</article>';
    }).join("");
  }

  function renderList() {
    const stored = readStrict();
    if (!stored.ok) {
      setStatus(statusNode, "No se pueden leer los recursos locales (" + stored.reason + "). Restaura un respaldo válido antes de continuar.", "error");
    }
    const data = stored.ok ? stored.data : { resources: [] };
    const query = root.querySelector("#ficha-library-search").value.trim().toLocaleLowerCase("es");
    const kind = root.querySelector("#ficha-library-kind-filter").value;
    const records = data.resources.filter(item => {
      if (item.archivedAt) return false;
      if (kind !== "all" && item.kind !== kind) return false;
      return !query || (item.title + " " + item.description + " " + item.tags.join(" "))
        .toLocaleLowerCase("es").includes(query);
    }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    countNode.textContent = records.length + (records.length === 1 ? " recurso" : " recursos");
    listNode.innerHTML = records.length
      ? records.map(item => resourceCard(item, selectedId)).join("")
      : '<div class="ficha-library-empty"><h3>No hay recursos en esta vista</h3><p>Añade un enlace o apunte, o cambia los filtros.</p></div>';
    if (selectedId && !data.resources.some(item => item.id === selectedId && !item.archivedAt)) {
      selectedId = null;
    }
    if (selectedId) renderDetail();
    else detailNode.innerHTML = '<div class="ficha-library-empty"><h3>Selecciona un recurso</h3><p>Podrás consultar sus datos, abrir el enlace y editar tus notas.</p></div>';
  }

  function renderDetail() {
    const stored = readStrict();
    const resource = stored.ok
      ? stored.data.resources.find(item => item.id === selectedId && !item.archivedAt)
      : null;
    if (!resource) {
      detailNode.innerHTML = '<div class="ficha-library-empty"><h3>Selecciona un recurso</h3><p>El detalle aparecerá aquí.</p></div>';
      return;
    }
    const safeUrl = resource.url ? safeExternalUrl(resource.url) : null;
    detailNode.innerHTML = '<div class="ficha-library-detail-heading"><div><p class="eyebrow">DETALLE DEL RECURSO</p>' +
      '<h3>' + escapeHtml(resource.title) + '</h3><span>' + escapeHtml(KIND_LABELS[resource.kind]) + '</span></div>' +
      '<button type="button" class="ficha-secondary-button" data-library-close>Volver</button></div>' +
      '<p class="ficha-library-detail-meta">' + escapeHtml(classLabel(resource.classId)) +
      '</p><p class="ficha-library-detail-description">' + escapeHtml(resource.description || "Sin descripción") + '</p>' +
      (resource.tags.length ? '<div class="ficha-library-tags">' + resource.tags.map(tag =>
        '<span>' + escapeHtml(tag) + '</span>').join("") + '</div>' : "") +
      (safeUrl ? '<a class="ficha-library-open-link" href="' + escapeHtml(safeUrl) +
        '" target="_blank" rel="noopener noreferrer">Abrir recurso ↗</a>' : '<p class="ficha-library-no-link">Este registro no contiene un enlace externo.</p>') +
      '<p class="ficha-library-updated">Actualizado: ' + escapeHtml(resourceDate(resource.updatedAt)) + '</p>' +
      '<details class="ficha-library-edit"><summary>Editar recurso</summary><form id="ficha-library-edit-form" class="ficha-library-form">' +
      '<label>Nombre <input name="title" maxlength="240" required value="' + escapeHtml(resource.title) + '"></label>' +
      '<div class="ficha-library-form-grid"><label>Tipo <select name="kind">' + kindOptions(resource.kind) + '</select></label>' +
      '<label>Clase <select name="classId">' + classOptions(resource.classId || "") + '</select></label></div>' +
      '<label>Enlace <input name="url" type="url" value="' + escapeHtml(resource.url) + '" placeholder="https://..."></label>' +
      '<label>Descripción o apunte <textarea name="description" rows="3">' + escapeHtml(resource.description) + '</textarea></label>' +
      '<label>Etiquetas <input name="tags" value="' + escapeHtml(resource.tags.join(", ")) + '"></label>' +
      '<button type="submit" class="ficha-primary-button">Guardar cambios</button></form></details>' +
      '<div class="ficha-library-danger"><button type="button" class="ficha-danger-button" data-library-archive>Archivar recurso</button></div>';
  }

  function persist(result, successMessage) {
    if (!result?.ok) {
      setStatus(statusNode, mutationMessage(result?.reason), "error");
      return false;
    }
    const saved = writeLibraryData(result.data);
    if (!saved.ok) {
      setStatus(statusNode, mutationMessage(saved.reason), "error");
      return false;
    }
    setStatus(statusNode, successMessage, "success");
    renderList();
    return true;
  }

  function backupStatus(message, kind = "info") {
    setStatus(root.querySelector("#ficha-library-backup-status"), message, kind);
  }

  root.addEventListener("input", event => {
    if (event.target.matches("#ficha-library-search")) renderList();
  });
  root.addEventListener("change", event => {
    if (event.target.matches("#ficha-library-kind-filter")) renderList();
  });
  root.addEventListener("click", event => {
    const toggle = event.target.closest("[data-library-create-toggle]");
    if (toggle) {
      createPanel.hidden = !createPanel.hidden;
      root.querySelectorAll("[data-library-create-toggle]").forEach(button =>
        button.setAttribute("aria-expanded", String(!createPanel.hidden)));
      if (!createPanel.hidden) root.querySelector('#ficha-library-create-form [name="title"]').focus();
      return;
    }
    const open = event.target.closest("[data-library-open]");
    if (open) {
      selectedId = open.dataset.libraryOpen;
      renderList();
      return;
    }
    if (event.target.closest("[data-library-close]")) {
      selectedId = null;
      renderList();
      return;
    }
    if (event.target.closest("[data-library-archive]")) {
      if (!window.confirm("El recurso se archivará y dejará de aparecer en el catálogo. ¿Continuar?")) return;
      const result = archiveLibraryResource(selectedId);
      persist(result, "Recurso archivado. Su registro se conserva en el almacenamiento local.");
    }
  });

  root.addEventListener("submit", event => {
    const form = event.target;
    if (!form.matches("form")) return;
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    values.classId = values.classId || null;
    const result = form.id === "ficha-library-create-form"
      ? createLibraryResource(values)
      : form.id === "ficha-library-edit-form"
        ? updateLibraryResource(selectedId, values) : null;
    const success = form.id === "ficha-library-create-form"
      ? "Recurso guardado en tu biblioteca."
      : "Recurso actualizado.";
    if (persist(result, success) && form.id === "ficha-library-create-form") {
      selectedId = result.resource.id;
      createPanel.hidden = true;
      root.querySelectorAll("[data-library-create-toggle]").forEach(button =>
        button.setAttribute("aria-expanded", "false"));
      form.reset();
      renderList();
    }
  });

  root.querySelector("#ficha-library-export").addEventListener("click", () => {
    const stored = readStrict();
    if (!stored.ok) {
      backupStatus("No se exportó un archivo vacío: la biblioteca local necesita recuperación (" + stored.reason + ").", "error");
      return;
    }
    try {
      const backup = createLibraryBackup(stored.data);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "traza-biblioteca-" + new Date().toISOString().slice(0, 10) + ".json";
      anchor.hidden = true;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      backupStatus("Respaldo de biblioteca descargado.", "success");
    } catch {
      backupStatus("No se pudo crear el respaldo de biblioteca.", "error");
    }
  });

  const fileInput = root.querySelector("#ficha-library-file");
  root.querySelector("#ficha-library-import").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error("size");
      const parsed = JSON.parse(await file.text());
      const validation = validateLibraryBackup(parsed);
      if (!validation.ok) {
        backupStatus("El archivo no es válido o contiene datos inconsistentes. No se modificó la biblioteca.", "error");
        return;
      }
      const confirmed = window.confirm("Vas a reemplazar la biblioteca local por " +
        validation.data.resources.length + " recurso(s) del respaldo. ¿Continuar?");
      if (!confirmed) {
        backupStatus("Importación cancelada. La biblioteca no cambió.");
        return;
      }
      const imported = importLibraryBackup(parsed);
      if (!imported.ok) {
        backupStatus("No se pudo restaurar la biblioteca: " + imported.reason, "error");
        return;
      }
      selectedId = null;
      renderList();
      backupStatus("Biblioteca restaurada: " + imported.data.resources.length + " recurso(s).", "success");
    } catch (error) {
      backupStatus(error.message === "size" ? "El archivo supera el límite de 2 MB." :
        "No se pudo leer el archivo JSON. La biblioteca no cambió.", "error");
    } finally {
      fileInput.value = "";
    }
  });

  renderOfficialResources();
  renderList();
}
