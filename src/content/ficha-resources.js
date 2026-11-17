/**
 * Biblioteca oficial compartida por Traza.
 *
 * El contenido se publica como parte del sitio y queda disponible en modo
 * solo lectura para todos los estudiantes. Se modifica mediante PR revisada.
 *
 * Campos:
 * - id: identificador único y estable.
 * - title: nombre del recurso.
 * - kind: link | video | document | book | note.
 * - url: URL HTTP/HTTPS o cadena vacía para recursos bibliográficos sin enlace.
 * - description: resumen breve y utilidad pedagógica.
 * - classId: ID existente en src/content/ficha.js, o null si es transversal.
 * - tags: arreglo de etiquetas.
 *
 * Publicar solo enlaces y materiales revisados. No añadir enlaces ficticios.
 */
export const RECURSOS_OFICIALES = Object.freeze([]);

import { HORARIO_CLASES } from "./ficha.js";

const CLASS_IDS = new Set(HORARIO_CLASES.map(item => item.id));
const RESOURCE_KINDS = new Set(["link", "video", "document", "book", "note"]);

function isSafeUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username && !url.password;
  } catch {
    return false;
  }
}

export function validateOfficialResources(items = RECURSOS_OFICIALES) {
  if (!Array.isArray(items)) return { ok: false, reason: "invalid_collection" };
  const ids = new Set();

  for (const [index, item] of items.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item) ||
        typeof item.id !== "string" || !item.id.trim() ||
        item.id.length > 100 || typeof item.title !== "string" ||
        !item.title.trim() || item.title.length > 240 ||
        !RESOURCE_KINDS.has(item.kind) ||
        typeof item.url !== "string" ||
        (item.url !== "" && !isSafeUrl(item.url)) ||
        typeof item.description !== "string" ||
        !(item.classId === null || CLASS_IDS.has(item.classId)) ||
        !Array.isArray(item.tags) || item.tags.length > 20 ||
        item.tags.some(tag => typeof tag !== "string" || !tag.trim() || tag.length > 32) ||
        new Set(item.tags.map(tag => tag.trim().toLocaleLowerCase("es"))).size !== item.tags.length ||
        (!item.url && !item.description.trim())) {
      return { ok: false, reason: "invalid_entry", index };
    }
    if (ids.has(item.id)) return { ok: false, reason: "duplicate_id", index };
    ids.add(item.id);
  }

  return { ok: true, data: items };
}
