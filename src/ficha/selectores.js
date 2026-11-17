import { FICHA } from "../content/ficha.js";
import { ESTADO } from "./estados.js";
import { diaSemana, finSemana, hoy, parsearFechaLocal } from "./fechas.js";

function obtenerRegistro(personal, actividadId) {
  if (personal && Object.hasOwn(personal, "estado")) return personal;
  return personal?.actividades?.[actividadId] ?? {};
}

function fechaReferencia(valor) {
  if (valor instanceof Date) {
    return Number.isFinite(valor.getTime())
      ? new Date(valor.getFullYear(), valor.getMonth(), valor.getDate())
      : null;
  }
  return parsearFechaLocal(valor);
}

/**
 * Prioridad: Aprobada > Por corregir > Entregada > Atrasada > Hoy > Semana > Próxima.
 * "entregada" se explicita para no confundir una entrega ya realizada con un atraso.
 */
export function clasificar(actividad, personal = {}, fechaActual = hoy()) {
  if (!actividad || typeof actividad !== "object") {
    throw new TypeError("Se necesita una actividad para clasificar.");
  }

  const registro = obtenerRegistro(personal, actividad.id);
  const estado = registro.estado ?? actividad.estado ?? ESTADO.PENDIENTE;
  if (estado === ESTADO.APROBADA) return "aprobada";
  if (estado === ESTADO.POR_CORREGIR) return "porCorregir";
  if (estado === ESTADO.ENTREGADA) return "entregada";

  const limite = parsearFechaLocal(actividad.limite);
  if (!limite) return "sinFecha";
  const referencia = fechaReferencia(fechaActual);
  if (!referencia) throw new TypeError("La fecha de referencia no es válida.");

  const diferencia = Date.UTC(limite.getFullYear(), limite.getMonth(), limite.getDate()) -
    Date.UTC(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
  if (diferencia < 0) return "atrasada";
  if (diferencia === 0) return "hoy";
  return limite <= finSemana(referencia) ? "semana" : "proxima";
}

function compararLimites(a, b) {
  const fechaA = parsearFechaLocal(a.limite);
  const fechaB = parsearFechaLocal(b.limite);
  if (!fechaA && !fechaB) return a.id.localeCompare(b.id, "es");
  if (!fechaA) return 1;
  if (!fechaB) return -1;
  return fechaA - fechaB || a.id.localeCompare(b.id, "es");
}

const GRUPO = Object.freeze({
  atrasada: "atrasadas",
  porCorregir: "porCorregir",
  hoy: "hoy",
  semana: "semana",
  proxima: "proxima",
  sinFecha: "sinFecha",
  entregada: "entregadas",
  aprobada: "aprobadas"
});

/** Selector único para la vista Hoy, con grupos estables y ordenables por fecha. */
export function panel(personal = {}, fechaActual = hoy(), opciones = {}, ficha = FICHA) {
  const grupos = {
    atrasadas: [], porCorregir: [], hoy: [], semana: [],
    proxima: [], sinFecha: [], entregadas: [], aprobadas: []
  };

  for (const actividad of ficha.actividades) {
    const registro = obtenerRegistro(personal, actividad.id);
    const clasificacion = clasificar(actividad, personal, fechaActual);
    if (opciones.soloLoQueFalta && ["entregada", "aprobada"].includes(clasificacion)) continue;

    grupos[GRUPO[clasificacion]].push({
      ...actividad,
      estado: registro.estado ?? actividad.estado ?? ESTADO.PENDIENTE,
      clasificacion
    });
  }

  for (const lista of Object.values(grupos)) lista.sort(compararLimites);
  const total = Object.values(grupos).reduce((suma, lista) => suma + lista.length, 0);
  const totalPendiente = total - grupos.entregadas.length - grupos.aprobadas.length;
  return { ...grupos, total, totalPendiente };
}

/** Horario del día; acepta un calendario alternativo para probar/validar datos antes de publicarlos. */
export function clasesDelDia(fechaActual = hoy(), horario = FICHA.horario) {
  const fecha = fechaReferencia(fechaActual);
  if (!fecha) throw new TypeError("La fecha del horario no es válida.");
  const dia = diaSemana(fecha);
  if (dia < 1 || dia > 6) return [];

  return horario
    .filter(clase => clase.dia === dia)
    .map(clase => ({
      ...clase,
      competencia: FICHA.competencias.find(item => item.id === clase.competenciaId) ?? null,
      instructor: FICHA.instructores.find(item => item.id === clase.instructorId) ?? null
    }))
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
}

/** El porcentaje refleja exclusivamente aprobaciones registradas por el instructor. */
export function resumenPorCompetencia(personal = {}, fechaActual = hoy(), ficha = FICHA) {
  return ficha.competencias.map(competencia => {
    const actividades = ficha.actividades.filter(item => item.competenciaId === competencia.id);
    const clasificaciones = actividades.map(item => clasificar(item, personal, fechaActual));
    const aprobadas = clasificaciones.filter(item => item === "aprobada").length;
    const entregadas = clasificaciones.filter(item => item === "entregada").length;
    const porCorregir = clasificaciones.filter(item => item === "porCorregir").length;
    const atrasadas = clasificaciones.filter(item => item === "atrasada").length;
    const total = actividades.length;

    return {
      ...competencia, total, aprobadas, entregadas, porCorregir, atrasadas,
      pendientes: total - aprobadas - entregadas,
      porcentajeAprobado: total ? Math.round((aprobadas / total) * 100) : 0
    };
  });
}
