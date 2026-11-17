import { FICHA } from "../content/ficha.js";
import { fechaISO, hoy, parsearFechaLocal } from "./fechas.js";
import {
  ESTADO,
  actualizarChecklist,
  checklistVacio,
  registrarResultadoInstructor
} from "./estados.js";
import { validarFichaPersonal } from "./store.js";

const MAX_NOTAS = 4000;
const MAX_CORRECCION = 2000;

function actividadExiste(actividadId) {
  return FICHA.actividades.some(actividad => actividad.id === actividadId);
}

function validarEnlaceEvidencia(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor !== "string" || valor.length > 2048 || !/^https:\/\//i.test(valor)) {
    return false;
  }

  try {
    const url = new URL(valor);
    return url.protocol === "https:" && Boolean(url.hostname) &&
      !url.username && !url.password ? valor : false;
  } catch {
    return false;
  }
}

function componerFicha(personal, actividadId, registro) {
  const base = personal ?? {};
  return {
    ...base,
    v: 1,
    ultimoExport: base.ultimoExport ?? null,
    favoritos: base.favoritos ?? [],
    guardados: base.guardados ?? [],
    actividades: {
      ...(base.actividades ?? {}),
      [actividadId]: registro
    }
  };
}

function validarResultado(datos) {
  const validacion = validarFichaPersonal(datos);
  return validacion.ok
    ? { ok: true, datos }
    : { ok: false, razon: "datos_invalidos", errores: validacion.errores };
}

export function registroActividad(personal, actividadId) {
  return personal?.actividades?.[actividadId] ?? {
    estado: ESTADO.PENDIENTE,
    notas: "",
    checklist: checklistVacio(),
    intentos: []
  };
}

export function actualizarChecklistActividad(personal, actividadId, campo, valor) {
  if (!actividadExiste(actividadId)) {
    return { ok: false, razon: "actividad_inexistente" };
  }

  const actual = registroActividad(personal, actividadId);
  const cambio = actualizarChecklist(actual.estado, actual.checklist, campo, valor);
  if (!cambio.permitido) {
    return { ok: false, razon: "actividad_bloqueada" };
  }

  const datos = componerFicha(personal, actividadId, {
    ...actual,
    estado: cambio.estado,
    checklist: cambio.checklist
  });
  return validarResultado(datos);
}

export function actualizarNotasActividad(personal, actividadId, notas) {
  if (!actividadExiste(actividadId)) {
    return { ok: false, razon: "actividad_inexistente" };
  }
  if (typeof notas !== "string" || notas.length > MAX_NOTAS) {
    return { ok: false, razon: "notas_invalidas" };
  }

  const actual = registroActividad(personal, actividadId);
  if (actual.estado === ESTADO.APROBADA) {
    return { ok: false, razon: "actividad_bloqueada" };
  }

  const datos = componerFicha(personal, actividadId, { ...actual, notas });
  return validarResultado(datos);
}

/**
 * Registra el resultado que el estudiante transcribe de una devolución recibida.
 * No autentica al instructor ni convierte la transcripción en una calificación oficial.
 */
export function registrarResultadoTranscrito(personal, actividadId, entrada, fechaActual = hoy()) {
  if (!actividadExiste(actividadId)) {
    return { ok: false, razon: "actividad_inexistente" };
  }

  const actual = registroActividad(personal, actividadId);
  if (actual.estado === ESTADO.APROBADA) {
    return { ok: false, razon: "actividad_bloqueada" };
  }
  if (!actual.checklist?.confirmada) {
    return { ok: false, razon: "entrega_no_confirmada" };
  }

  const juicio = entrada?.juicio;
  if (!["aprobado", "no_aprobado"].includes(juicio)) {
    return { ok: false, razon: "juicio_invalido" };
  }

  const correccion = typeof entrada?.correccion === "string"
    ? entrada.correccion.trim()
    : "";
  if (juicio === "no_aprobado" && !correccion) {
    return { ok: false, razon: "correccion_requerida" };
  }
  if (correccion.length > MAX_CORRECCION) {
    return { ok: false, razon: "correccion_invalida" };
  }

  const enlace = validarEnlaceEvidencia(entrada?.enlace);
  if (enlace === false) {
    return { ok: false, razon: "enlace_invalido" };
  }

  const fecha = typeof entrada?.fecha === "string" && entrada.fecha
    ? entrada.fecha
    : (typeof fechaActual === "string" ? fechaActual : fechaISO(fechaActual));
  if (!parsearFechaLocal(fecha)) {
    return { ok: false, razon: "fecha_invalida" };
  }

  const resultado = registrarResultadoInstructor(juicio);
  const intentos = actual.intentos ?? [];
  const intento = {
    n: Math.max(0, ...intentos.map(item => Number(item.n) || 0)) + 1,
    fecha,
    juicio,
    correccion,
    enlace
  };

  const datos = componerFicha(personal, actividadId, {
    ...actual,
    estado: resultado.estado,
    checklist: resultado.checklist,
    intentos: [...intentos, intento]
  });

  const validacion = validarResultado(datos);
  return validacion.ok ? { ...validacion, intento } : validacion;
}
