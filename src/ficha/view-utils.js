import { FICHA } from "../content/ficha.js";
import { ESTADO, ESTADOS } from "./estados.js";
import { clasificar } from "./selectores.js";
import { parsearFechaLocal, fechaISO, textoRelativo } from "./fechas.js";

export function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

export function formatearFecha(valor, opciones = { day: "numeric", month: "short", year: "numeric" }) {
  const fecha = valor instanceof Date ? valor : parsearFechaLocal(valor);
  return fecha ? new Intl.DateTimeFormat("es-CO", opciones).format(fecha) : "Fecha por confirmar";
}

export function avisoFuente() {
  const meta = FICHA.meta;
  const fuente = escaparHTML(meta.fuente || "Fuente por confirmar");
  const fecha = escaparHTML(formatearFecha(meta.actualizado));
  if (meta.esDemostracion) {
    return `<aside class="ficha-demo-notice" role="note">
      <strong>Datos de demostración.</strong>
      Las actividades, fechas y temas de clase son datos de demostración. El horario semanal se transcribió de la imagen compartida; los detalles que no aparecen especificados permanecen por confirmar.
      <span>Última edición del ejemplo: ${fecha} · ${fuente}</span>
    </aside>`;
  }
  return `<p class="ficha-source-line">Información actualizada: <time datetime="${escaparHTML(meta.actualizado)}">${fecha}</time> · Fuente: ${fuente}</p>`;
}

export function obtenerEstadoVisual(actividad, personal = {}, fechaActual) {
  const registro = personal?.actividades?.[actividad.id] ?? {};
  const clasificacion = clasificar(actividad, personal, fechaActual);
  const estado = clasificacion === "atrasada"
    ? ESTADO.ATRASADA
    : (registro.estado ?? actividad.estado ?? ESTADO.PENDIENTE);
  return { estado, clasificacion, registro, meta: ESTADOS[estado] ?? ESTADOS[ESTADO.PENDIENTE] };
}

export function renderEstado(estado, alterna = "") {
  const meta = ESTADOS[estado] ?? ESTADOS[ESTADO.PENDIENTE];
  return `<span class="ficha-state ficha-state--${escaparHTML(estado)}">
    <span class="ficha-state-icon" aria-hidden="true">${meta.icono}</span>
    <span>${escaparHTML(alterna || meta.etiqueta)}</span>
  </span>`;
}

export function renderChecklist(registro = {}) {
  const campos = [["subida", "Subida"], ["enviada", "Enviada"], ["confirmada", "Confirmada"]];
  return `<div class="ficha-checklist" aria-label="Checklist de entrega">
    ${campos.map(([campo, etiqueta]) => {
      const completo = registro.checklist?.[campo] === true;
      return `<span class="ficha-check-item ${completo ? "is-complete" : ""}" aria-label="${etiqueta}: ${completo ? "completado" : "pendiente"}">
        <span aria-hidden="true">${completo ? "●" : "○"}</span>${etiqueta}
      </span>`;
    }).join("")}
  </div>`;
}

export function renderActividad(actividad, personal = {}, fechaActual) {
  const visual = obtenerEstadoVisual(actividad, personal, fechaActual);
  const competencia = FICHA.competencias.find(item => item.id === actividad.competenciaId);
  const limite = actividad.limite ? parsearFechaLocal(actividad.limite) : null;
  const textoFecha = limite
    ? textoRelativo(fechaISO(limite), fechaActual) + " · " + formatearFecha(limite)
    : "Sin fecha límite";

  return `<article class="ficha-activity-card">
    <div class="ficha-activity-main">
      <div class="ficha-activity-title-row">
        <h3>${escaparHTML(actividad.titulo)}</h3>${renderEstado(visual.estado)}
      </div>
      <p>${escaparHTML(actividad.descripcion)}</p>
      <div class="ficha-activity-meta">
        ${competencia ? `<span class="ficha-competence-chip">${escaparHTML(competencia.codigo)}</span>` : ""}
        <time ${limite ? `datetime="${escaparHTML(actividad.limite)}"` : ""}>${escaparHTML(textoFecha)}</time>
      </div>
      ${renderChecklist(visual.registro)}
    </div>
  </article>`;
}

export function URLSegura(url) {
  return typeof url === "string" && /^https:\/\/[^\s]+$/i.test(url);
}

export function renderEnlaceExterno(item) {
  if (!URLSegura(item.url)) return "";
  return `<a class="ficha-quick-link" href="${escaparHTML(item.url)}" target="_blank" rel="noopener noreferrer">
    <span>${escaparHTML(item.nombre)}</span><span aria-hidden="true">↗</span>
  </a>`;
}
