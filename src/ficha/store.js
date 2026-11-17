import { parsearFechaLocal } from "./fechas.js";
import { ESTADOS_PERSISTIBLES } from "./estados.js";

export const CLAVE_FICHA = "traza:v4:ficha";
export const VERSION_FICHA = 1;
const CAMPOS_CHECKLIST = ["subida", "enviada", "confirmada"];
const esObjeto = valor => valor !== null && typeof valor === "object" && !Array.isArray(valor);

function almacenamientoPorDefecto() {
  try { return globalThis.localStorage ?? null; }
  catch { return null; }
}

function fechaISOValida(valor) {
  return typeof valor === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(valor) &&
    parsearFechaLocal(valor) !== null;
}

export function crearFichaInicial() {
  return {
    v: VERSION_FICHA,
    ultimoExport: null,
    actividades: {},
    favoritos: [],
    guardados: []
  };
}

/** Valida los datos antes de guardarlos o aceptarlos desde un respaldo. */
export function validarFichaPersonal(datos) {
  const errores = [];
  if (!esObjeto(datos)) {
    return { ok: false, errores: ["La ficha personal debe ser un objeto."] };
  }
  if (datos.v !== VERSION_FICHA) errores.push("La versión de la ficha no es compatible.");
  if (datos.ultimoExport !== null && !fechaISOValida(datos.ultimoExport)) {
    errores.push("ultimoExport debe ser null o una fecha YYYY-MM-DD válida.");
  }

  if (!esObjeto(datos.actividades)) {
    errores.push("actividades debe ser un objeto indexado por identificador.");
  } else {
    for (const [id, registro] of Object.entries(datos.actividades)) {
      const prefijo = "Actividad " + id + ": ";
      if (!id.trim()) errores.push("Hay una actividad sin identificador.");
      if (!esObjeto(registro)) {
        errores.push(prefijo + "el registro debe ser un objeto.");
        continue;
      }
      if (!ESTADOS_PERSISTIBLES.includes(registro.estado)) {
        errores.push(prefijo + "el estado no es persistible.");
      }
      if (typeof registro.notas !== "string") errores.push(prefijo + "notas debe ser texto.");

      if (!esObjeto(registro.checklist)) {
        errores.push(prefijo + "checklist debe ser un objeto.");
      } else {
        for (const campo of CAMPOS_CHECKLIST) {
          if (typeof registro.checklist[campo] !== "boolean") {
            errores.push(prefijo + "checklist." + campo + " debe ser booleano.");
          }
        }
      }

      if (!Array.isArray(registro.intentos)) {
        errores.push(prefijo + "intentos debe ser una lista.");
      } else {
        const numeros = new Set();
        for (const intento of registro.intentos) {
          if (!esObjeto(intento)) {
            errores.push(prefijo + "cada intento debe ser un objeto.");
            continue;
          }
          if (!Number.isInteger(intento.n) || intento.n < 1 || numeros.has(intento.n)) {
            errores.push(prefijo + "cada intento necesita un número positivo y único.");
          } else {
            numeros.add(intento.n);
          }
          if (!fechaISOValida(intento.fecha)) {
            errores.push(prefijo + "la fecha del intento debe ser YYYY-MM-DD válida.");
          }
          if (!["aprobado", "no_aprobado"].includes(intento.juicio)) {
            errores.push(prefijo + "el juicio debe ser aprobado o no_aprobado.");
          }
          if (typeof intento.correccion !== "string") {
            errores.push(prefijo + "correccion debe ser texto.");
          } else if (intento.juicio === "no_aprobado" && !intento.correccion.trim()) {
            errores.push(prefijo + "la corrección es obligatoria cuando no está aprobado.");
          }
          if (intento.enlace !== null && typeof intento.enlace !== "string") {
            errores.push(prefijo + "enlace debe ser texto o null.");
          }
        }
      }
    }
  }

  for (const campo of ["favoritos", "guardados"]) {
    const lista = datos[campo];
    if (!Array.isArray(lista) || lista.some(item => typeof item !== "string" || !item.trim())) {
      errores.push(campo + " debe ser una lista de identificadores de texto no vacíos.");
    } else if (new Set(lista).size !== lista.length) {
      errores.push(campo + " no puede contener identificadores duplicados.");
    }
  }

  return { ok: errores.length === 0, errores };
}

export function leerFicha(almacenamiento = almacenamientoPorDefecto()) {
  const inicial = crearFichaInicial();
  if (!almacenamiento || typeof almacenamiento.getItem !== "function") return inicial;

  try {
    const serializado = almacenamiento.getItem(CLAVE_FICHA);
    if (!serializado) return inicial;
    const datos = JSON.parse(serializado);
    return validarFichaPersonal(datos).ok ? datos : inicial;
  } catch {
    return inicial;
  }
}

export function guardarFicha(datos, almacenamiento = almacenamientoPorDefecto()) {
  const validacion = validarFichaPersonal(datos);
  if (!validacion.ok) return { ok: false, errores: validacion.errores };
  if (!almacenamiento || typeof almacenamiento.setItem !== "function") {
    return { ok: false, errores: ["El almacenamiento local no está disponible."] };
  }

  try {
    almacenamiento.setItem(CLAVE_FICHA, JSON.stringify(datos));
    return { ok: true, errores: [] };
  } catch {
    return { ok: false, errores: ["No fue posible guardar la ficha en este navegador."] };
  }
}

export function borrarFicha(almacenamiento = almacenamientoPorDefecto()) {
  if (!almacenamiento || typeof almacenamiento.removeItem !== "function") return false;
  try {
    almacenamiento.removeItem(CLAVE_FICHA);
    return true;
  } catch {
    return false;
  }
}
