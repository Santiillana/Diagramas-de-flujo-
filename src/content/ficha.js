// Datos oficiales de Mi ficha.
// El contenido marcado como demostrativo se sustituye por información confirmada.
// El moderador actualiza horario, actividades, clases, recursos y documentos aquí.
// Los archivos no se guardan en este manifiesto: se alojan en una URL compartida
// y el manifiesto conserva su metadata y sus relaciones.
export const FICHA = {
  meta: {
    programa: "Tecnólogo ADSO (ejemplo editable)",
    codigo: "228118",
    version: "v2 · demostración",
    ficha: "Por configurar",
    actualizado: "2026-11-17",
    fuente: "Datos de demostración para desarrollo; reemplazar por la ficha oficial.",
    esDemostracion: true
  },
  competencias: [
    { id: "logica-programacion", codigo: "LP-01", nombre: "Lógica de programación", comp: 1 },
    { id: "competencia-por-configurar", codigo: "COMP-02", nombre: "Competencia por configurar", comp: 2 }
  ],
  instructores: [
    { id: "instructor-por-configurar", nombre: "Instructor por configurar" }
  ],
  // Convención: dia 1=lunes ... 6=sábado. No se inventan bloques horarios:
  // completar cada fila con el horario oficial validado por el moderador.
  horario: [],
  actividades: [
    {
      id: "actividad-diagrama",
      competenciaId: "logica-programacion",
      titulo: "Reconocer las figuras del diagrama",
      descripcion: "Identificar la función de las figuras básicas de un diagrama de flujo.",
      paraQueSirve: "Relacionar cada símbolo con la acción que representa dentro de un algoritmo.",
      instrucciones: ["Revisar las figuras de inicio, proceso, decisión y salida.", "Construir un recorrido breve y comprobar su secuencia."],
      entregables: ["Diagrama de flujo exportado o enlace al trabajo."],
      apertura: "2026-11-10",
      limite: "2026-11-16",
      fuente: "Ejemplo editable; confirmar con el instructor.",
      actualizado: "2026-11-17",
      leccionIds: ["terminals"],
      ejercicioIds: [],
      documentoIds: []
    },
    {
      id: "actividad-comparaciones",
      competenciaId: "logica-programacion",
      titulo: "Aplicar operadores de comparación",
      descripcion: "Resolver condiciones usando operadores relacionales.",
      paraQueSirve: "Entender cómo una condición determina el camino que sigue un algoritmo.",
      instrucciones: ["Identificar los operandos.", "Evaluar cada comparación con sus valores.", "Comprobar el resultado verdadero o falso."],
      entregables: ["Solución de los ejercicios asignados."],
      apertura: "2026-11-11",
      limite: "2026-11-18",
      fuente: "Ejemplo editable; confirmar con el instructor.",
      actualizado: "2026-11-17",
      leccionIds: ["comparisons"],
      ejercicioIds: [5, 6, 7],
      documentoIds: []
    },
    {
      id: "actividad-ciclos",
      competenciaId: "logica-programacion",
      titulo: "Practicar ciclos",
      descripcion: "Diferenciar ciclos Para, Mientras y Hacer–Mientras.",
      paraQueSirve: "Elegir una estructura de repetición según la condición de entrada y salida.",
      instrucciones: ["Comparar cuándo se evalúa la condición.", "Seguir una iteración de cada ciclo.", "Verificar el criterio de terminación."],
      entregables: ["Pseudocódigo y tabla de seguimiento."],
      apertura: "2026-11-12",
      limite: "2026-11-21",
      fuente: "Ejemplo editable; confirmar con el instructor.",
      actualizado: "2026-11-17",
      leccionIds: ["for", "while", "do-while"],
      ejercicioIds: [10, 11, 12, 13, 14, 15, 16, 19, 20],
      documentoIds: []
    },
    {
      id: "actividad-validacion",
      competenciaId: "logica-programacion",
      titulo: "Validar datos y usar centinelas",
      descripcion: "Construir una lectura repetida con condición de validación o centinela.",
      paraQueSirve: "Evitar procesar datos inválidos y controlar el final de una entrada.",
      instrucciones: ["Definir el rango válido o el valor centinela.", "Comprobar la condición de repetición.", "Evitar procesar el centinela como dato."],
      entregables: ["Algoritmo validado con casos normales y límite."],
      apertura: "2026-11-13",
      limite: null,
      fuente: "Ejemplo editable; confirmar con el instructor.",
      actualizado: "2026-11-17",
      leccionIds: ["validation-sentinel"],
      ejercicioIds: [19, 20],
      documentoIds: []
    }
  ],
  clases: [
    {
      id: "clase-ejemplo-01",
      fecha: "2026-11-16",
      competenciaId: "logica-programacion",
      titulo: "Figuras y comparaciones",
      temas: [
        { id: "tema-figuras", texto: "Figuras del diagrama de flujo", leccionId: "terminals", ejercicioIds: [] },
        { id: "tema-comparaciones", texto: "Operadores de comparación", leccionId: "comparisons", ejercicioIds: [5, 6, 7] }
      ],
      documentoIds: []
    },
    {
      id: "clase-ejemplo-02",
      fecha: "2026-11-17",
      competenciaId: "logica-programacion",
      titulo: "Ciclos y control de repetición",
      temas: [
        { id: "tema-for", texto: "Ciclo Para", leccionId: "for", ejercicioIds: [10, 11, 12, 13] },
        { id: "tema-while", texto: "Ciclo Mientras", leccionId: "while", ejercicioIds: [14, 15, 16] },
        { id: "tema-do-while", texto: "Ciclo Hacer–Mientras", leccionId: "do-while", ejercicioIds: [19, 20] }
      ],
      documentoIds: []
    }
  ],
  // Registro editorial de archivos compartidos. En el paso 5 se define el contrato;
  // la carga binaria requerirá almacenamiento compartido y se conecta en la fase UI.
  documentos: [],
  recursos: [
    {
      id: "recurso-sena-ejemplo-01",
      espacio: "sena",
      tipo: "guia",
      titulo: "Guía de aprendizaje (pendiente de cargar)",
      url: null,
      documentoId: null,
      tema: "Fundamentos",
      competenciaId: "logica-programacion",
      fuente: "Pendiente de confirmar por el moderador",
      fecha: null,
      programa: "Tecnólogo ADSO (ejemplo editable)",
      codigo: "228118",
      version: "Por confirmar"
    },
    {
      id: "recurso-sena-ejemplo-02",
      espacio: "sena",
      tipo: "material",
      titulo: "Material de formación (pendiente de cargar)",
      url: null,
      documentoId: null,
      tema: "Lógica de programación",
      competenciaId: "logica-programacion",
      fuente: "Pendiente de confirmar por el moderador",
      fecha: null,
      programa: "Tecnólogo ADSO (ejemplo editable)",
      codigo: "228118",
      version: "Por confirmar"
    },
    {
      id: "recurso-extra-ejemplo-01",
      espacio: "extra",
      tipo: "recurso",
      titulo: "Recurso complementario (pendiente de configurar)",
      url: null,
      documentoId: null,
      tema: "Algoritmos",
      competenciaId: "logica-programacion",
      fuente: "Pendiente de seleccionar",
      fecha: null,
      programa: "Tecnólogo ADSO (ejemplo editable)",
      codigo: "228118",
      version: "Por confirmar"
    }
  ],
  accesos: [
    { id: "zajuna", nombre: "Zajuna", url: "https://zajuna.sena.edu.co/" },
    { id: "sofia-plus", nombre: "SOFIA Plus", url: "https://oferta.senasofiaplus.edu.co/sofia-oferta/" },
    { id: "biblioteca", nombre: "Biblioteca SENA", url: "https://biblioteca.sena.edu.co/" },
    { id: "correo", nombre: "Correo institucional", url: "https://outlook.office.com/mail/" }
  ]
};
