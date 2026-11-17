# Módulo 8 · Clases y conexión con Aprende

**Estado:** vista Clases construida a partir del horario oficial, con histórico, actividades y recursos oficiales por bloque. La conexión pedagógica verificable con las 17 lecciones y 45 ejercicios de Aprende sigue pendiente; no se crean asociaciones por coincidencia de nombres.

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

## Vista de Clases implementada

- `src/ui/ficha-classes.js` renderiza solo bloques vigentes en la fecha de Colombia y conserva bloques terminados en un historial.
- `src/styles/ficha-classes.css` aporta tarjetas responsive.
- La sección se incorpora a la navegación Mi ficha mediante `src/ui/navigation.js`, `index.html` y `src/app.js`.
- Cada tarjeta presenta materia, instructor, día y horario en 12 horas; los sábados conservan sus dos bloques como “Clase del sábado”.
- Los catálogos oficiales de actividades y recursos se muestran en solo lectura cuando la entrada incluye un `classId` real.
- Las URLs externas se limitan a HTTP/HTTPS sin credenciales.
- Se muestra explícitamente “Sin asociación pedagógica confirmada para esta clase todavía” en vez de inventar relaciones con Aprende.
- E2E: `e2e/module-8-classes.spec.js` valida el cambio de lunes, siete bloques vigentes en la fecha actual, historial, horarios del sábado y ausencia de asociaciones inventadas.
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

## Implementación inicial disponible

La vista `Clases` está conectada a la navegación Mi ficha desde `index.html` y `src/app.js`. Consume `src/content/ficha.js` como única fuente de horarios; presenta bloques vigentes y bloques históricos, y muestra actividades y recursos oficiales cuyo `classId` coincide exactamente con el bloque. Los catálogos oficiales vacíos se identifican como tales. Para Aprende muestra el mensaje de ausencia de asociación confirmada y no crea enlaces ficticios.

La prueba E2E `e2e/module-8-classes.spec.js` verifica el número de bloques vigentes, el historial del lunes, los dos bloques del sábado, los instructores y la ausencia de relaciones inventadas.

## Pendiente para cerrar M8

- Recibir o localizar el plan oficial de formación / distribución de competencias por clase.
- Confirmar qué lecciones y ejercicios corresponden a cada materia.
- Crear asociaciones con IDs existentes y pruebas de integridad.
- Construir la vista de Clases y sus enlaces de ida y vuelta con Aprende.
- Verificar que no se alteren las 17 lecciones, 45 ejercicios, Simulador ni Laboratorio.
