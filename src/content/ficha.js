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
