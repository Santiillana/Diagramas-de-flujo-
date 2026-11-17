# Módulo 8 · Clases y conexión con Aprende

**Estado:** horario y bloques de clase disponibles como fuente oficial; vista unificada de Clases y relaciones verificadas con Aprende pendientes. No se crean asociaciones por coincidencia de nombres.

## Fuentes confirmadas

- `src/content/ficha.js`: bloques semanales, instructor, materia, horas y vigencias.
- `src/content/lessons.js`: catálogo de lecciones reales de Aprende.
- `src/content/exercises.js`: catálogo de ejercicios reales.

Los identificadores de los bloques del horario (por ejemplo `jueves-tics`) son las claves disponibles para asociar actividades personales a una clase. Eso no demuestra por sí solo qué lecciones o ejercicios corresponden a cada clase.

## Objetivo funcional

La sección Clases debe permitir consultar, sin duplicar el calendario:

- Materia y docente confirmados.
- Día y franja horaria, con vigencias históricas.
- Próxima sesión y estado temporal calculados en `America/Bogota`.
- Materiales y actividades oficiales publicados para la clase.
- Vínculos de Aprende únicamente cuando se haya confirmado la relación pedagógica.

## Registro explícito de relaciones

Cuando exista evidencia del programa de formación, se añadirá un archivo de asociaciones (propuesta: `src/content/class-learning-map.js`) con estructura explícita:

```js
export const CLASS_LEARNING_MAP = [
  {
    classId: "jueves-tics",
    lessonIds: [],
    exerciseIds: []
  }
];
```

Los arreglos se dejan vacíos hasta tener asociaciones confirmadas. Cada ID debe existir en el catálogo fuente correspondiente. Una relación inválida debe fallar en pruebas; no se debe resolver mediante búsqueda aproximada por materia, título o instructor.

La UI debe mostrar “Contenido de Aprende aún no vinculado” cuando no exista relación. No debe mostrar un botón sin destino, ni sugerir que un ejercicio pertenece a una clase cuando no se sabe.

## Reglas de integridad

1. Mantener el horario como única fuente para días, horas, docentes y vigencias.
2. No copiar manualmente horarios a una segunda estructura.
3. No reescribir asociaciones históricas si el contenido cambia; las relaciones necesitan IDs estables.
4. No inferir la materia de los bloques del sábado: permanece sin nombre mientras el moderador no tenga dato oficial.
5. No relacionar automáticamente Matemáticas con una lección homónima, ni TICS con un recurso por similitud textual.
6. Probar vigencias, cambios de fecha, fechas civiles y zona `America/Bogota`.

## Pendiente para cerrar M8

- Recibir o localizar el plan oficial de formación / distribución de competencias por clase.
- Confirmar qué lecciones y ejercicios corresponden a cada materia.
- Crear asociaciones con IDs existentes y pruebas de integridad.
- Construir la vista de Clases y sus enlaces de ida y vuelta con Aprende.
- Verificar que no se alteren las 17 lecciones, 45 ejercicios, Simulador ni Laboratorio.
