/**
 * Actividades oficiales publicadas por Traza.
 *
 * Esta lista es contenido compartido y de solo lectura para el estudiante.
 * Se actualiza mediante cambios revisados en GitHub, no desde localStorage.
 *
 * Campos:
 * - id: identificador único y estable.
 * - title: nombre visible.
 * - description: instrucciones o contexto.
 * - classId: ID existente en src/content/ficha.js, o null si es transversal.
 * - assignedOn / dueOn: fecha civil YYYY-MM-DD o null.
 * - instructionsUrl: URL HTTPS/HTTP opcional a instrucciones oficiales.
 *
 * No introducir entregas, notas o calificaciones individuales aquí.
 * No crear relaciones con Aprende salvo que exista una referencia comprobada.
 */
export const ACTIVIDADES_OFICIALES = Object.freeze([]);

import { HORARIO_CLASES } from "./ficha.js";

const CLASS_IDS = new Set(HORARIO_CLASES.map(item => item.id));

function isCivilDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day;
}

function isSafeUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username && !url.password;
  } catch {
    return false;
  }
}

export function validateOfficialActivities(items = ACTIVIDADES_OFICIALES) {
  if (!Array.isArray(items)) return { ok: false, reason: "invalid_collection" };
  const ids = new Set();

  for (const [index, item] of items.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item) ||
        typeof item.id !== "string" || !item.id.trim() ||
        item.id.length > 100 || typeof item.title !== "string" ||
        !item.title.trim() || item.title.length > 240 ||
        typeof item.description !== "string" ||
        !(item.classId === null || CLASS_IDS.has(item.classId)) ||
        !(item.assignedOn === null || isCivilDate(item.assignedOn)) ||
        !(item.dueOn === null || isCivilDate(item.dueOn)) ||
        !(item.instructionsUrl === undefined || item.instructionsUrl === null ||
          item.instructionsUrl === "" ||
          (typeof item.instructionsUrl === "string" && isSafeUrl(item.instructionsUrl)))) {
      return { ok: false, reason: "invalid_entry", index };
    }
    if (ids.has(item.id)) return { ok: false, reason: "duplicate_id", index };
    ids.add(item.id);
    if (item.assignedOn && item.dueOn && item.assignedOn > item.dueOn) {
      return { ok: false, reason: "invalid_date_order", index };
    }
  }

  return { ok: true, data: items };
}
