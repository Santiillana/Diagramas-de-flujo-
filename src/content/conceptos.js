export const conceptos = [
  { id: "figuras", titulo: "Figuras", nivel: 1 },
  { id: "flujo", titulo: "Flujo y secuencia", nivel: 1 },
  { id: "entrada", titulo: "Entrada de datos", nivel: 1 },
  { id: "salida", titulo: "Imprimir", nivel: 1 },
  { id: "variables", titulo: "Variables", nivel: 1 },
  { id: "asignacion", titulo: "Asignación", nivel: 1 },
  { id: "operaciones", titulo: "Operaciones aritméticas", nivel: 2 },
  { id: "tipos", titulo: "Tipos de dato", nivel: 2 },
  { id: "comparaciones", titulo: "Comparaciones", nivel: 2 },
  { id: "decisiones", titulo: "Decisiones", nivel: 2 },
  { id: "logica", titulo: "Operadores lógicos", nivel: 3 },
  { id: "contadores", titulo: "Contadores", nivel: 3 },
  { id: "acumuladores", titulo: "Acumuladores", nivel: 3 },
  { id: "ciclo-para", titulo: "Ciclo Para", nivel: 3 },
  { id: "ciclo-mientras", titulo: "Ciclo Mientras", nivel: 3 },
  { id: "ciclo-hacer-mientras", titulo: "Ciclo Hacer–Mientras", nivel: 3 },
  { id: "traza", titulo: "Tabla de seguimiento", nivel: 4 },
  { id: "depuracion", titulo: "Depurar", nivel: 4 },
  { id: "programa", titulo: "Programa completo", nivel: 4 }
];

export const etiquetasConcepto = Object.freeze({
  "Entrada de datos": "entrada", "Asignación": "asignacion", "Imprimir": "salida",
  "Decisiones": "decisiones", "Ciclo Para": "ciclo-para", "Ciclo Mientras": "ciclo-mientras",
  "Ciclo Hacer–Mientras": "ciclo-hacer-mientras", "Operaciones aritméticas": "operaciones",
  "Comparaciones": "comparaciones", "Acumuladores": "acumuladores", "Contadores": "contadores",
  "Promedios": "operaciones", "Máximo y mínimo": "comparaciones", "Centinelas": "ciclo-mientras",
  "Validación": "decisiones", "Series y potencias": "operaciones", "Ciclos anidados": "ciclo-mientras"
});

export function conceptoPorEtiqueta(etiqueta) {
  const id = etiquetasConcepto[etiqueta];
  return conceptos.find(item => item.id === id) ?? null;
}
