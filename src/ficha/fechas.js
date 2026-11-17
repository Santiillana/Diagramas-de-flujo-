function fechaLocal(valor) {
  if (valor instanceof Date) {
    if (!Number.isFinite(valor.getTime())) return null;
    return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  }
  return parsearFechaLocal(valor);
}

/** Parsea YYYY-MM-DD a medianoche local; nunca interpreta la cadena como UTC. */
export function parsearFechaLocal(valor) {
  if (typeof valor !== "string") return null;
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!coincidencia) return null;

  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);
  const fecha = new Date(0);
  fecha.setHours(0, 0, 0, 0);
  fecha.setFullYear(anio, mes - 1, dia);

  if (
    fecha.getFullYear() !== anio ||
    fecha.getMonth() !== mes - 1 ||
    fecha.getDate() !== dia
  ) return null;

  return fecha;
}

/** Fecha local actual, inyectable mediante Date o una función que devuelva Date. */
export function hoy(reloj = () => new Date()) {
  const valor = typeof reloj === "function" ? reloj() : reloj;
  const fecha = fechaLocal(valor);
  if (!fecha) throw new TypeError("La referencia para hoy debe ser una fecha válida.");
  return fecha;
}

export function fechaISO(valor) {
  const fecha = fechaLocal(valor);
  if (!fecha) return null;
  return [
    String(fecha.getFullYear()).padStart(4, "0"),
    String(fecha.getMonth() + 1).padStart(2, "0"),
    String(fecha.getDate()).padStart(2, "0")
  ].join("-");
}

/** Diferencia en días naturales: fecha objetivo menos fecha de referencia. */
export function diferenciaDias(fecha, referencia = hoy()) {
  const objetivo = fechaLocal(fecha);
  const base = fechaLocal(referencia);
  if (!objetivo || !base) return null;

  const objetivoUTC = Date.UTC(objetivo.getFullYear(), objetivo.getMonth(), objetivo.getDate());
  const baseUTC = Date.UTC(base.getFullYear(), base.getMonth(), base.getDate());
  return Math.round((objetivoUTC - baseUTC) / 86400000);
}

/** Inicio de semana en lunes. */
export function inicioSemana(valor = hoy()) {
  const inicio = fechaLocal(valor);
  if (!inicio) return null;
  inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
  return inicio;
}

/** Fin de la semana académica: sábado. El domingo queda fuera del periodo lectivo. */
export function finSemana(valor = hoy()) {
  const fin = inicioSemana(valor);
  if (!fin) return null;
  fin.setDate(fin.getDate() + 5);
  return fin;
}

/** Convierte Date.getDay() a lunes=1 ... sábado=6, domingo=7. */
export function diaSemana(valor) {
  const fecha = fechaLocal(valor);
  if (!fecha) return null;
  return fecha.getDay() === 0 ? 7 : fecha.getDay();
}

/** Texto relativo para una fecha límite. */
export function textoRelativo(fecha, referencia = hoy()) {
  const diferencia = diferenciaDias(fecha, referencia);
  if (diferencia === null) return "";
  if (diferencia === 0) return "vence hoy";
  if (diferencia === 1) return "vence mañana";
  if (diferencia > 1) return "vence en " + diferencia + " días";
  if (diferencia === -1) return "venció ayer";
  return "venció hace " + Math.abs(diferencia) + " días";
}
