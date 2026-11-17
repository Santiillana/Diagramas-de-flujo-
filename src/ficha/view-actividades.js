import { FICHA } from "../content/ficha.js";
import { lessons } from "../content/lessons.js";
import { exercises } from "../content/exercises.js";
import { ESTADO, ESTADOS } from "./estados.js";
import { leerFichaEstricto, leerFicha, guardarFicha } from "./store.js";
import { clasificar } from "./selectores.js";
import { parsearFechaLocal, fechaISO, hoy, textoRelativo } from "./fechas.js";
import { documentosPublicados } from "./documentos.js";
import {
  registroActividad,
  actualizarChecklistActividad,
  actualizarNotasActividad,
  registrarResultadoTranscrito
} from "./actividades.js";
import { escaparHTML, formatearFecha, renderEstado } from "./view-utils.js";

let seleccionada = FICHA.actividades[0]?.id ?? null;
let busqueda = "";
let filtroEstado = "todas";
let filtroCompetencia = "todas";
let mensajeGuardado = "";

const ETIQUETAS_JUICIO = {
  aprobado: "Resultado favorable",
  no_aprobado: "Solicita correcciones"
};

function hoyISO() {
  return fechaISO(hoy());
}

function nombreCompetencia(competenciaId) {
  return FICHA.competencias.find(item => item.id === competenciaId)?.nombre ??
    "Competencia por confirmar";
}

function estadoActividad(actividad, personal) {
  const registro = registroActividad(personal, actividad.id);
  const clasificacion = clasificar(actividad, personal, hoy());
  return clasificacion === "atrasada"
    ? ESTADO.ATRASADA
    : (registro.estado ?? ESTADO.PENDIENTE);
}

function textoFechaLimite(actividad) {
  if (!actividad.limite) return "Sin fecha límite";
  return textoRelativo(actividad.limite, hoy()) + " · " +
    formatearFecha(parsearFechaLocal(actividad.limite));
}

function actividadesFiltradas(personal) {
  const consulta = busqueda.trim().toLocaleLowerCase("es");

  return FICHA.actividades
    .filter(actividad => {
      const texto = [
        actividad.titulo,
        actividad.descripcion,
        nombreCompetencia(actividad.competenciaId)
      ].join(" ").toLocaleLowerCase("es");

      if (!texto.includes(consulta)) return false;
      if (filtroEstado !== "todas" && estadoActividad(actividad, personal) !== filtroEstado) {
        return false;
      }
      if (filtroCompetencia !== "todas" && actividad.competenciaId !== filtroCompetencia) {
        return false;
      }
      return true;
    })
    .sort((a, b) =>
      (a.limite || "9999-99-99").localeCompare(b.limite || "9999-99-99") ||
      a.id.localeCompare(b.id)
    );
}

function renderFiltros() {
  const opcionesEstado = Object.entries(ESTADOS)
    .map(([id, meta]) =>
      '<option value="' + escaparHTML(id) + '"' +
      (id === filtroEstado ? " selected" : "") + ">" +
      escaparHTML(meta.etiqueta) + "</option>"
    ).join("");

  const opcionesCompetencia = FICHA.competencias
    .map(competencia =>
      '<option value="' + escaparHTML(competencia.id) + '"' +
      (competencia.id === filtroCompetencia ? " selected" : "") + ">" +
      escaparHTML(competencia.nombre) + "</option>"
    ).join("");

  return `
    <div class="ficha-activities-filters">
      <label>
        Buscar actividad
        <input type="search" id="activity-search" value="${escaparHTML(busqueda)}"
          placeholder="Nombre o descripción" autocomplete="off">
      </label>
      <label>
        Estado
        <select id="activity-status-filter">
          <option value="todas">Todos</option>${opcionesEstado}
        </select>
      </label>
      <label>
        Competencia
        <select id="activity-competence-filter">
          <option value="todas">Todas</option>${opcionesCompetencia}
        </select>
      </label>
      <button type="button" class="ficha-filter-clear" data-activity-clear>
        Limpiar filtros
      </button>
    </div>`;
}

function renderLista(personal) {
  const root = document.querySelector("#ficha-activity-list");
  const count = document.querySelector("#ficha-activity-count");
  if (!root || !count) return;

  const actividades = actividadesFiltradas(personal);
  if (!actividades.some(item => item.id === seleccionada)) {
    seleccionada = actividades[0]?.id ?? null;
  }

  count.textContent = actividades.length +
    (actividades.length === 1 ? " actividad" : " actividades");

  root.innerHTML = actividades.length
    ? actividades.map(actividad => {
      const estado = estadoActividad(actividad, personal);
      const activa = actividad.id === seleccionada;
      return `
        <button type="button" class="ficha-activity-option${activa ? " is-active" : ""}"
          data-activity-select="${escaparHTML(actividad.id)}" aria-pressed="${activa}">
          <span class="ficha-activity-option-main">
            <strong>${escaparHTML(actividad.titulo)}</strong>
            <small>${escaparHTML(nombreCompetencia(actividad.competenciaId))}</small>
            <small>${escaparHTML(textoFechaLimite(actividad))}</small>
          </span>
          <span class="ficha-activity-option-status">
            ${escaparHTML(ESTADOS[estado]?.etiqueta ?? "Pendiente")}
          </span>
        </button>`;
    }).join("")
    : `
      <div class="ficha-empty-inline">
        <strong>No hay resultados</strong>
        <span>Prueba otra búsqueda o limpia los filtros.</span>
      </div>`;

  renderDetalle(personal);
}

function renderRelacionados(actividad) {
  const lecciones = (actividad.leccionIds ?? [])
    .map(id => lessons.find(leccion => leccion.id === id))
    .filter(Boolean);
  const retos = (actividad.ejercicioIds ?? [])
    .map(id => exercises.find(ejercicio => ejercicio.id === id))
    .filter(Boolean);

  if (!lecciones.length && !retos.length) return "";

  const listaLecciones = lecciones.length
    ? `
      <h4>Lecciones</h4>
      <ul>${lecciones.map(item => "<li>" + escaparHTML(item.title) + "</li>").join("")}</ul>
      <button type="button" class="ficha-filter-clear" data-go="learn">Abrir Aprende</button>`
    : "";

  const listaRetos = retos.length
    ? `
      <h4>Ejercicios</h4>
      <ul>${retos.map(item => "<li>" + escaparHTML(item.title) + "</li>").join("")}</ul>
      <button type="button" class="ficha-filter-clear" data-go="exercises">Abrir Ejercicios</button>`
    : "";

  return `
    <section class="ficha-activity-section">
      <h3>Contenidos relacionados</h3>
      ${listaLecciones}
      ${listaRetos}
    </section>`;
}

function renderDocumentos(actividad) {
  const documentos = documentosPublicados("actividades", {
    actividadId: actividad.id
  });

  if (!documentos.length) {
    return `
      <div class="ficha-empty-inline">
        <strong>Sin documentos publicados</strong>
        <span>Los materiales oficiales aparecerán aquí cuando el moderador los publique.</span>
      </div>`;
  }

  return `
    <ul class="ficha-activity-documents">
      ${documentos.map(documento => `
        <li>
          <a href="${escaparHTML(documento.url)}" target="_blank" rel="noopener noreferrer">
            <span>
              <strong>${escaparHTML(documento.titulo)}</strong>
              <small>${escaparHTML(documento.nombreArchivo)}</small>
            </span>
            <span aria-hidden="true">↗</span>
          </a>
        </li>`).join("")}
    </ul>`;
}

function renderIntentos(registro) {
  const intentos = registro.intentos ?? [];
  if (!intentos.length) {
    return `
      <div class="ficha-empty-inline">
        <strong>Sin devoluciones registradas</strong>
        <span>Podrás transcribir una respuesta cuando la recibas.</span>
      </div>`;
  }

  return `
    <ol class="ficha-attempt-list">
      ${intentos.map(intento => `
        <li class="ficha-attempt-item">
          <div>
            <strong>Intento ${intento.n} · ${escaparHTML(ETIQUETAS_JUICIO[intento.juicio] ?? intento.juicio)}</strong>
            <time>${escaparHTML(formatearFecha(intento.fecha))}</time>
          </div>
          ${intento.correccion ? "<p>" + escaparHTML(intento.correccion) + "</p>" : ""}
          ${intento.enlace
            ? '<a href="' + escaparHTML(intento.enlace) + '" target="_blank" rel="noopener noreferrer">Ver evidencia ↗</a>'
            : ""}
          <small>Resultado transcrito por el estudiante; no verificado por Traza.</small>
        </li>`).join("")}
    </ol>`;
}

function renderErrorAlmacenamiento(razon) {
  return `
    <div class="ficha-storage-error" role="alert">
      <strong>No se pueden modificar tus datos.</strong>
      <p>El almacenamiento está dañado, no disponible o usa una versión desconocida.
        No se sobrescribió información.</p>
      <small>Motivo: ${escaparHTML(razon)}</small>
    </div>`;
}

function renderDetalle(personal) {
  const root = document.querySelector("#ficha-activity-detail");
  if (!root) return;

  const actividad = FICHA.actividades.find(item => item.id === seleccionada);
  if (!actividad) {
    root.innerHTML = `
      <div class="ficha-empty-state">
        <h3>Selecciona una actividad</h3>
        <p>Elige una actividad para consultar sus requisitos.</p>
      </div>`;
    return;
  }

  const lectura = leerFichaEstricto();
  if (!lectura.ok) {
    root.innerHTML = renderErrorAlmacenamiento(lectura.razon);
    return;
  }

  const registro = registroActividad(personal, actividad.id);
  const estado = estadoActividad(actividad, personal);
  const bloqueada = registro.estado === ESTADO.APROBADA;
  const instrucciones = (actividad.instrucciones ?? [])
    .map(texto => "<li>" + escaparHTML(texto) + "</li>").join("");
  const entregables = (actividad.entregables ?? [])
    .map(texto => "<li>" + escaparHTML(texto) + "</li>").join("");

  root.innerHTML = `
    <article class="ficha-activity-detail">
      <header class="ficha-activity-detail-heading">
        <div>
          <p class="eyebrow">MI FICHA · DETALLE</p>
          <h2>${escaparHTML(actividad.titulo)}</h2>
          <p>${escaparHTML(nombreCompetencia(actividad.competenciaId))}</p>
        </div>
        ${renderEstado(estado)}
      </header>

      <div class="ficha-activity-summary">
        <div>
          <span>Apertura</span>
          <strong>${escaparHTML(actividad.apertura ? formatearFecha(actividad.apertura) : "Por confirmar")}</strong>
        </div>
        <div>
          <span>Fecha límite</span>
          <strong>${escaparHTML(textoFechaLimite(actividad))}</strong>
        </div>
        <div>
          <span>Fuente</span>
          <strong>${escaparHTML(actividad.fuente || "Por confirmar")}</strong>
        </div>
      </div>

      <section class="ficha-activity-section">
        <h3>¿Qué debes hacer?</h3>
        <p>${escaparHTML(actividad.descripcion)}</p>
        ${actividad.paraQueSirve
          ? '<p class="ficha-activity-purpose">' + escaparHTML(actividad.paraQueSirve) + "</p>"
          : ""}
        ${instrucciones ? "<h4>Instrucciones</h4><ol>" + instrucciones + "</ol>" : ""}
        ${entregables ? "<h4>Entregables</h4><ul>" + entregables + "</ul>" : ""}
      </section>

      ${renderRelacionados(actividad)}

      <section class="ficha-activity-section">
        <h3>Documentos y materiales</h3>
        ${renderDocumentos(actividad)}
      </section>

      <section class="ficha-activity-section">
        <h3>Tu seguimiento</h3>
        <p class="ficha-activity-help">
          Marca los pasos a medida que avanzas. Confirmar la entrega cambia el estado a Entregada.
        </p>
        <div class="ficha-activity-checks">
          ${[
            ["subida", "Actividad subida"],
            ["enviada", "Actividad enviada"],
            ["confirmada", "Entrega confirmada"]
          ].map(([campo, etiqueta]) => `
            <label>
              <input type="checkbox" data-checklist-field="${campo}"
                ${registro.checklist?.[campo] ? "checked" : ""}
                ${bloqueada ? "disabled" : ""}>
              <span>${etiqueta}</span>
            </label>`).join("")}
        </div>

        <form id="activity-notes-form" class="ficha-activity-notes">
          <label for="activity-notes">Notas personales</label>
          <textarea id="activity-notes" name="notes" maxlength="4000" rows="3"
            ${bloqueada ? "disabled" : ""}>${escaparHTML(registro.notas || "")}</textarea>
          <button type="submit" class="ficha-filter-clear" ${bloqueada ? "disabled" : ""}>
            Guardar notas
          </button>
        </form>
      </section>

      <section class="ficha-activity-section">
        <h3>Devoluciones y resultados</h3>
        <p class="ficha-activity-help">
          Transcribe el resultado que recibiste. Traza no autentica al instructor ni verifica la calificación.
        </p>
        ${renderIntentos(registro)}
        <form id="activity-result-form" class="ficha-activity-result-form">
          <label>
            Resultado recibido
            <select name="juicio" required>
              <option value="">Selecciona</option>
              <option value="aprobado">Favorable</option>
              <option value="no_aprobado">Solicita correcciones</option>
            </select>
          </label>
          <label>
            Fecha
            <input name="fecha" type="date" value="${escaparHTML(hoyISO())}" required>
          </label>
          <label>
            Corrección u observación
            <textarea name="correccion" maxlength="2000" rows="3"
              placeholder="Obligatoria si te solicitaron correcciones"></textarea>
          </label>
          <label>
            Enlace de evidencia (opcional)
            <input name="enlace" type="url" placeholder="https://...">
          </label>
          <button type="submit" class="ficha-filter-clear"
            ${bloqueada || !registro.checklist?.confirmada ? "disabled" : ""}>
            Guardar resultado transcrito
          </button>
          <p class="ficha-activity-help">
            Confirma primero la entrega en el checklist. La transcripción no equivale a una validación institucional.
          </p>
        </form>
      </section>

      <p class="ficha-activity-help ficha-activity-save-status" role="status" aria-live="polite">
        ${escaparHTML(mensajeGuardado)}
      </p>
    </article>`;
}

function guardarCambios(datos) {
  const resultado = guardarFicha(datos);
  if (!resultado.ok) {
    mensajeGuardado = resultado.errores?.join(" ") ??
      resultado.razon ??
      "No fue posible guardar los cambios.";
    renderActividades();
    return false;
  }

  mensajeGuardado = "Cambios guardados en este navegador.";
  document.dispatchEvent(new CustomEvent("traza:ficha-actualizada"));
  return true;
}

function mensajeError(razon) {
  const mensajes = {
    actividad_inexistente: "La actividad seleccionada ya no existe en el catálogo.",
    actividad_bloqueada: "La actividad aprobada está bloqueada.",
    entrega_no_confirmada: "Confirma primero la entrega en el checklist.",
    juicio_invalido: "Selecciona un resultado válido.",
    correccion_requerida: "Escribe la corrección solicitada.",
    correccion_invalida: "La corrección supera el límite permitido.",
    enlace_invalido: "El enlace debe ser HTTPS y no incluir credenciales.",
    fecha_invalida: "La fecha no es válida.",
    notas_invalidas: "Las notas superan el límite permitido.",
    datos_invalidos: "Los datos no superaron la validación."
  };
  return mensajes[razon] ?? "No se pudo registrar el cambio.";
}

export function renderActividades() {
  const root = document.querySelector("#view-actividades");
  if (!root) return;

  const lectura = leerFichaEstricto();
  const personal = lectura.ok ? lectura.datos : leerFicha();
  const actividades = actividadesFiltradas(personal);

  if (!actividades.some(item => item.id === seleccionada)) {
    seleccionada = actividades[0]?.id ?? null;
  }

  root.innerHTML = `
    <div class="ficha-view-content ficha-activities-view-content">
      <header class="ficha-view-heading">
        <div>
          <p class="eyebrow">MI FICHA · SEGUIMIENTO</p>
          <h2 id="actividades-title">Actividades</h2>
          <p>Consulta las consignas y registra tu avance personal.</p>
        </div>
        <span id="ficha-activity-count"></span>
      </header>

      ${FICHA.meta.esDemostracion
        ? `
          <aside class="ficha-demo-notice" role="note">
            <strong>Contenido de demostración.</strong>
            Las consignas y fechas son ejemplos editables, no asignaciones oficiales.
          </aside>`
        : ""}

      ${renderFiltros()}

      <div class="ficha-activities-layout">
        <aside class="ficha-activity-list-panel" aria-label="Catálogo de actividades">
          <div id="ficha-activity-list"></div>
        </aside>
        <div id="ficha-activity-detail" aria-live="polite"></div>
      </div>

      <footer class="ficha-personal-note">
        Tu seguimiento, notas y resultados transcritos se guardan solo en este navegador.
      </footer>
    </div>`;

  renderLista(personal);
}

export function initActividades() {
  const root = document.querySelector("#view-actividades");
  if (!root || root.dataset.fichaReady === "true") return;
  root.dataset.fichaReady = "true";

  root.addEventListener("input", event => {
    if (event.target.id !== "activity-search") return;

    busqueda = event.target.value;
    const posicion = event.target.selectionStart;
    renderLista(leerFicha());

    const input = document.querySelector("#activity-search");
    input?.focus();
    input?.setSelectionRange(posicion, posicion);
  });

  root.addEventListener("change", event => {
    if (event.target.id === "activity-status-filter") {
      filtroEstado = event.target.value;
      renderActividades();
      return;
    }
    if (event.target.id === "activity-competence-filter") {
      filtroCompetencia = event.target.value;
      renderActividades();
      return;
    }
    if (!event.target.matches("[data-checklist-field]")) return;

    const lectura = leerFichaEstricto();
    if (!lectura.ok) {
      renderActividades();
      return;
    }

    const cambio = actualizarChecklistActividad(
      lectura.datos,
      seleccionada,
      event.target.dataset.checklistField,
      event.target.checked
    );
    if (!cambio.ok) {
      mensajeGuardado = mensajeError(cambio.razon);
      renderActividades();
      return;
    }
    guardarCambios(cambio.datos);
  });

  root.addEventListener("click", event => {
    if (event.target.closest("[data-activity-clear]")) {
      busqueda = "";
      filtroEstado = "todas";
      filtroCompetencia = "todas";
      renderActividades();
      return;
    }

    const button = event.target.closest("[data-activity-select]");
    if (button) {
      seleccionada = button.dataset.activitySelect;
      mensajeGuardado = "";
      renderActividades();
    }
  });

  root.addEventListener("submit", event => {
    if (!["activity-notes-form", "activity-result-form"].includes(event.target.id)) return;
    event.preventDefault();

    const lectura = leerFichaEstricto();
    if (!lectura.ok) {
      renderActividades();
      return;
    }

    let resultado;
    if (event.target.id === "activity-notes-form") {
      resultado = actualizarNotasActividad(
        lectura.datos,
        seleccionada,
        event.target.elements.notes.value
      );
    } else {
      resultado = registrarResultadoTranscrito(lectura.datos, seleccionada, {
        juicio: event.target.elements.juicio.value,
        fecha: event.target.elements.fecha.value,
        correccion: event.target.elements.correccion.value,
        enlace: event.target.elements.enlace.value
      });
    }

    if (!resultado.ok) {
      mensajeGuardado = mensajeError(resultado.razon);
      renderActividades();
      return;
    }
    guardarCambios(resultado.datos);
  });

  document.addEventListener("traza:filtros-ficha-cambiados", renderActividades);
  renderActividades();
}
