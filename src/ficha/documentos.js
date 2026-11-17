import { FICHA } from "../content/ficha.js";
import { parsearFechaLocal } from "./fechas.js";

export const SECCIONES_DOCUMENTO = Object.freeze(["clases", "actividades", "biblioteca"]);
const esObjeto = valor => valor !== null && typeof valor === "object" && !Array.isArray(valor);

function ubicacionSegura(url) {
  if (typeof url !== "string" || !url.trim() || /[\\s<>"']/.test(url)) return false;
  if (/^https:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && Boolean(parsed.hostname) &&
        !parsed.username && !parsed.password;
    } catch {
      return false;
    }
  }
  // Solo rutas relativas al mismo sitio; rechaza rutas protocol-relative y traversal,
  // incluso cuando los segmentos peligrosos están codificados.
  if (!/^(?:\/(?!\/)|\.\/)[A-Za-z0-9._~!$&'()*+,;=:@%/-]+$/.test(url)) return false;
  try {
    const decoded = decodeURIComponent(url);
    return !decoded.includes("\\") && !decoded.split("/").includes("..");
  } catch {
    return false;
  }
}

/**
 * Contrato editorial de un documento:
 * { id, titulo, descripcion, nombreArchivo, mimeType, tamanoBytes, url,
 *   secciones: ["clases"|"actividades"|"biblioteca"],
 *   claseId?, actividadId?, estadoPublicacion: "borrador"|"publicado",
 *   publicadoEn, actualizado, fuente }.
 *
 * El archivo binario no se guarda en localStorage ni en este manifiesto.
 * El moderador lo carga a un almacenamiento compartido y registra aquí la URL.
 */
export function validarDocumentoOficial(documento, contexto = {}) {
  const errores = [];
  if (!esObjeto(documento)) return { ok: false, errores: ["El documento debe ser un objeto."] };
  if (typeof documento.id !== "string" || !documento.id.trim()) errores.push("Falta el id del documento.");
  if (typeof documento.titulo !== "string" || !documento.titulo.trim()) errores.push("Falta el título.");
  if (typeof documento.nombreArchivo !== "string" || !documento.nombreArchivo.trim()) errores.push("Falta el nombre del archivo.");
  if (typeof documento.mimeType !== "string" || !documento.mimeType.trim()) errores.push("Falta el tipo MIME.");
  if (!["borrador", "publicado"].includes(documento.estadoPublicacion)) {
    errores.push("El estado debe ser borrador o publicado.");
  }
  if (!Array.isArray(documento.secciones) || !documento.secciones.length) {
    errores.push("El documento debe indicar al menos una sección de destino.");
  } else {
    if (documento.secciones.some(seccion => !SECCIONES_DOCUMENTO.includes(seccion))) {
      errores.push("Hay una sección de destino no reconocida.");
    }
    if (new Set(documento.secciones).size !== documento.secciones.length) {
      errores.push("Las secciones de destino no pueden repetirse.");
    }
  }

  if (documento.url !== null && documento.url !== undefined && !ubicacionSegura(documento.url)) {
    errores.push("La ubicación del archivo debe ser HTTPS o una ruta local segura.");
  }
  if (documento.estadoPublicacion === "publicado" && !ubicacionSegura(documento.url)) {
    errores.push("No se puede publicar un documento sin una ubicación de archivo válida.");
  }
  if (documento.publicadoEn !== null && documento.publicadoEn !== undefined &&
      (typeof documento.publicadoEn !== "string" || !parsearFechaLocal(documento.publicadoEn))) {
    errores.push("publicadoEn debe ser null o una fecha YYYY-MM-DD válida.");
  }
  if (documento.estadoPublicacion === "publicado" && !parsearFechaLocal(documento.publicadoEn)) {
    errores.push("Un documento publicado necesita fecha de publicación válida.");
  }
  if (documento.tamanoBytes !== null && documento.tamanoBytes !== undefined &&
      (!Number.isSafeInteger(documento.tamanoBytes) || documento.tamanoBytes < 0)) {
    errores.push("tamanoBytes debe ser un entero no negativo o null.");
  }

  if (documento.claseId && contexto.clases &&
      !contexto.clases.some(clase => clase.id === documento.claseId)) {
    errores.push("La clase asociada no existe.");
  }
  if (documento.actividadId && contexto.actividades &&
      !contexto.actividades.some(actividad => actividad.id === documento.actividadId)) {
    errores.push("La actividad asociada no existe.");
  }
  if (documento.claseId && !documento.secciones?.includes("clases")) {
    errores.push("Un documento asociado a una clase debe incluir la sección clases.");
  }
  if (documento.actividadId && !documento.secciones?.includes("actividades")) {
    errores.push("Un documento asociado a una actividad debe incluir la sección actividades.");
  }

  return { ok: errores.length === 0, errores };
}

/** Devuelve únicamente documentos publicados que correspondan al contexto solicitado. */
export function documentosPublicados(seccion, contexto = {}, ficha = FICHA) {
  if (!SECCIONES_DOCUMENTO.includes(seccion)) return [];
  return (ficha.documentos ?? []).filter(documento => {
    if (!validarDocumentoOficial(documento).ok) return false;
    if (documento.estadoPublicacion !== "publicado" || !documento.secciones?.includes(seccion)) return false;
    if (documento.claseId && documento.claseId !== contexto.claseId) return false;
    if (documento.actividadId && documento.actividadId !== contexto.actividadId) return false;
    return true;
  });
}
