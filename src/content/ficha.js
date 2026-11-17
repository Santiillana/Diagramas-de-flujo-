/**
 * Horario oficial de clases de Mi ficha.
 *
 * Fuente de contenido editable del proyecto. No es información personal del
 * navegador: las preferencias, notas, entregas y estados del estudiante viven
 * en la persistencia personal de Mi ficha.
 *
 * Día de semana: 0 = domingo, 1 = lunes, ..., 6 = sábado.
 * Horas: formato 24 h, zona America/Bogota.
 *
 * Supuestos pendientes de confirmación:
 * - Matemáticas reemplaza Evaluar requisitos los lunes desde 2026-11-02.
 * - Los bloques del sábado aún no tienen materia informada; se deja null.
 */
export const FICHA_TIME_ZONE = "America/Bogota";

export const HORARIO_CLASES = [
  {
    id: "lunes-evaluar-requisitos",
    diaSemana: 1,
    horaInicio: "18:00",
    horaFin: "22:00",
    materia: "Evaluar requisitos",
    instructor: "Jair Castañeda",
    vigenteDesde: null,
    vigenteHasta: "2026-11-01"
  },
  {
    id: "lunes-matematicas",
    diaSemana: 1,
    horaInicio: "18:00",
    horaFin: "22:00",
    materia: "Matemáticas",
    instructor: "Yilliam Romero",
    vigenteDesde: "2026-11-02",
    vigenteHasta: null
  },
  {
    id: "martes-comunicacion",
    diaSemana: 2,
    horaInicio: "18:00",
    horaFin: "22:00",
    materia: "Comunicación",
    instructor: "Sandra Lizcano",
    vigenteDesde: null,
    vigenteHasta: null
  },
  {
    id: "miercoles-evaluar-requisitos",
    diaSemana: 3,
    horaInicio: "18:00",
    horaFin: "22:00",
    materia: "Evaluar requisitos",
    instructor: "Jair Castañeda",
    vigenteDesde: null,
    vigenteHasta: null
  },
  {
    id: "jueves-tics",
    diaSemana: 4,
    horaInicio: "18:00",
    horaFin: "22:00",
    materia: "TICS",
    instructor: "Yonel Torres",
    vigenteDesde: null,
    vigenteHasta: null
  },
  {
    id: "viernes-establecer-requisitos",
    diaSemana: 5,
    horaInicio: "18:00",
    horaFin: "22:00",
    materia: "Establecer requisitos",
    instructor: "Gloria Romero",
    vigenteDesde: null,
    vigenteHasta: null
  },
  {
    id: "sabado-bloque-1",
    diaSemana: 6,
    horaInicio: "12:00",
    horaFin: "16:00",
    materia: null,
    instructor: "Gloria Romero",
    vigenteDesde: null,
    vigenteHasta: null
  },
  {
    id: "sabado-bloque-2",
    diaSemana: 6,
    horaInicio: "16:00",
    horaFin: "22:00",
    materia: null,
    instructor: "Jair Castañeda",
    vigenteDesde: null,
    vigenteHasta: null
  }
];

export const DIAS_SIN_CLASES = [0];


function isCivilDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day;
}

function minutesOfDay(value) {
  if (typeof value !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function dateRangesOverlap(a, b) {
  const aStart = a.vigenteDesde || "0000-01-01";
  const aEnd = a.vigenteHasta || "9999-12-31";
  const bStart = b.vigenteDesde || "0000-01-01";
  const bEnd = b.vigenteHasta || "9999-12-31";
  return aStart <= bEnd && bStart <= aEnd;
}

/**
 * Validate the official timetable before it is rendered or published.
 * Time intervals are treated as [start, end); vigency dates are inclusive.
 */
export function validateHorarioClases(items = HORARIO_CLASES) {
  if (!Array.isArray(items)) return { ok: false, reason: "invalid_collection" };
  const ids = new Set();
  const intervals = [];

  for (const [index, item] of items.entries()) {
    const start = minutesOfDay(item?.horaInicio);
    const end = minutesOfDay(item?.horaFin);
    if (!item || typeof item !== "object" || Array.isArray(item) ||
        typeof item.id !== "string" || !item.id.trim() || item.id.length > 100 ||
        !Number.isInteger(item.diaSemana) || item.diaSemana < 0 || item.diaSemana > 6 ||
        DIAS_SIN_CLASES.includes(item.diaSemana) ||
        start === null || end === null || start >= end ||
        !(item.materia === null ||
          (typeof item.materia === "string" && item.materia.trim())) ||
        typeof item.instructor !== "string" || !item.instructor.trim() ||
        !(item.vigenteDesde === null || isCivilDate(item.vigenteDesde)) ||
        !(item.vigenteHasta === null || isCivilDate(item.vigenteHasta))) {
      return { ok: false, reason: "invalid_entry", index };
    }
    if (ids.has(item.id)) return { ok: false, reason: "duplicate_id", index };
    ids.add(item.id);
    if (item.vigenteDesde && item.vigenteHasta &&
        item.vigenteDesde > item.vigenteHasta) {
      return { ok: false, reason: "invalid_vigency_order", index };
    }

    for (const previous of intervals) {
      if (previous.item.diaSemana !== item.diaSemana ||
          !dateRangesOverlap(previous.item, item)) continue;
      const overlaps = start < previous.end && end > previous.start;
      if (overlaps) {
        return {
          ok: false,
          reason: "overlapping_class_blocks",
          index,
          conflictingId: previous.item.id
        };
      }
    }
    intervals.push({ item, start, end });
  }

  return { ok: true, data: items };
}
