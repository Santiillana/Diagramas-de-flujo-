# Módulo 8 · Clases y conexión con Aprende

**Estado:** vista Clases implementada y cubierta por E2E. El mapa curricular verificable con las 17 lecciones y 45 ejercicios está preparado y validado, pero permanece vacío hasta recibir asociaciones confirmadas; no se crean enlaces por coincidencia de nombres.

## Fuentes confirmadas

- `src/content/ficha.js`: bloques semanales, instructor, materia, horas y vigencias; `validateHorarioClases` impide IDs duplicados, horas inválidas, vigencias invertidas y solapamientos.
- `src/content/lessons.js`: catálogo de lecciones reales de Aprende.
- `src/content/exercises.js`: catálogo de ejercicios reales.
- `src/content/class-learning-map.js`: esquema validado para asociaciones explícitas; se mantiene vacío hasta recibir un mapa curricular confirmado.

Los identificadores de los bloques del horario (por ejemplo `jueves-tics`) son las claves disponibles para asociar actividades personales a una clase. Eso no demuestra por sí solo qué lecciones o ejercicios corresponden a cada clase.

## Objetivo funcional

La sección Clases debe permitir consultar, sin duplicar el calendario:

- Materia y docente confirmados.
- Día y franja horaria, con vigencias históricas.
- Próxima sesión y estado temporal se consultan desde Hoy/Semana/Calendario, que son la fuente única de agenda en `America/Bogota`.
- Materiales y actividades oficiales publicados para la clase.
- Vínculos de Aprende únicamente cuando se haya confirmado la relación pedagógica.

## Vista de Clases implementada

- `src/ui/ficha-classes.js` renderiza bloques vigentes en la fecha de Colombia, muestra vigencias futuras en “Próximas vigencias” y conserva los bloques terminados en el historial. Una vigencia futura ya no se clasifica erróneamente como historial.
- `src/styles/ficha-classes.css` aporta tarjetas responsive.
- La sección se incorpora a la navegación Mi ficha mediante `src/ui/navigation.js`, `index.html` y `src/app.js`.
- Cada tarjeta presenta materia, instructor, día y horario en 12 horas; los sábados conservan sus dos bloques como “Clase del sábado”.
- Los catálogos oficiales de actividades y recursos se muestran en solo lectura cuando la entrada incluye un `classId` real.
- Las URLs externas se limitan a HTTP/HTTPS sin credenciales.
- Se muestra explícitamente “Sin asociación pedagógica confirmada para esta clase todavía” en vez de inventar relaciones con Aprende.
- Pruebas: `tests/ficha-classes.test.js` comprueba la separación entre vigencias futuras, actuales e históricas; `e2e/module-8-classes.spec.js` comprueba navegación a una lección y ejercicio exactos cuando la vista recibe referencias válidas, además de horarios y ausencia de asociaciones inventadas.
## Registro explícito de relaciones

Cuando exista evidencia del programa de formación, se añadirán asociaciones en `src/content/class-learning-map.js` con estructura explícita:

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

## Implementación inicial disponible

La vista `Clases` está conectada a la navegación Mi ficha desde `index.html` y `src/app.js`. Consume `src/content/ficha.js` como única fuente de horarios; presenta bloques vigentes y bloques históricos, y muestra actividades y recursos oficiales cuyo `classId` coincide exactamente con el bloque. Los catálogos oficiales vacíos se identifican como tales. Usa `learningForClass` y `validateClassLearningMap` para validar referencias a lecciones y ejercicios; cuando existe una asociación confirmada muestra un acceso al elemento exacto de Aprende. Mientras el mapa permanezca vacío, muestra la ausencia de asociación y no crea enlaces ficticios.

Las pruebas `e2e/module-8-classes.spec.js` verifican el número de bloques vigentes, el historial del lunes, los dos bloques del sábado, los instructores, la ausencia de relaciones inventadas y la navegación a IDs exactos de Aprende cuando se proporciona un vínculo válido.

## Pendiente para cerrar M8

- Recibir el plan de formación o una matriz oficial que relacione materias, competencias y resultados de aprendizaje.
- Confirmar qué lecciones y ejercicios corresponden a cada materia; insertar esos IDs en `CLASS_LEARNING_MAP`.
- Añadir E2E de navegación a los destinos exactos cuando exista al menos una asociación validada.
- No vincular por aproximación ni completar el mapa con supuestos.
