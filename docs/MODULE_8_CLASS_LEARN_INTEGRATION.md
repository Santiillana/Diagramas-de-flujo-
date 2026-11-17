# Módulo 8 · Clases y conexión con Aprende

**Estado:** vista Clases implementada y cubierta por pruebas. El mapa curricular verificable con las 17 lecciones y 45 ejercicios está preparado, pero permanece vacío hasta recibir asociaciones oficiales confirmadas. No se crean vínculos por coincidencia de nombres.

## Fuentes oficiales

- `src/content/ficha.js`: bloques semanales, materia, instructor, horas y vigencias.
- `src/content/lessons.js`: catálogo de lecciones reales de Aprende.
- `src/content/exercises.js`: catálogo de ejercicios reales de Aprende.
- `src/content/class-learning-map.js`: asociaciones explícitas por identificador; el mapa inicial permanece vacío.
- `src/content/ficha-activities.js` y `src/content/ficha-resources.js`: publicaciones oficiales opcionales por clase.

El horario es la única fuente para los bloques y las sesiones. Una coincidencia textual entre materia, lección y ejercicio no demuestra relación curricular.

## Comportamiento implementado

- `src/ui/ficha-classes.js` presenta bloques vigentes en la fecha de Colombia, vigencias futuras y un historial de bloques terminados.
- `classVigencyState` distingue `upcoming`, `active` e `historical`; un bloque que todavía no inicia no se clasifica como historial.
- `validateHorarioClases` impide IDs duplicados, días inválidos, horarios mal formados, intervalos invertidos y solapamientos de hora mientras las vigencias coinciden.
- Cada tarjeta muestra materia, instructor, día y horario en formato de 12 horas. Los dos bloques del sábado permanecen como “Clase del sábado” mientras su materia siga sin confirmarse.
- Actividades y recursos oficiales se muestran en solo lectura cuando tienen un `classId` real. Sus catálogos pasan por validadores de contenido y solo admiten URLs HTTP/HTTPS seguras.
- La vista no duplica las recurrencias de Hoy/Semana/Calendario ni mantiene un segundo calendario.
- Cuando la asociación con Aprende no existe, se informa “Sin asociación pedagógica confirmada para esta clase todavía”.

## Asociaciones exactas con Aprende

`src/content/class-learning-map.js` exporta `CLASS_LEARNING_MAP` y `validateClassLearningMap`. Cada relación contiene:

```js
{
  classId: "jueves-tics",
  lessonIds: ["id-real-de-leccion"],
  exerciseIds: [1]
}
```

Las asociaciones deben salir de una matriz curricular o instrucción oficial, no de una aproximación. El validador comprueba que:
- `classId` exista en `HORARIO_CLASES`.
- Cada ID de lección exista en `lessons`.
- Cada ID de ejercicio exista en `exercises`.
- No se repita una clase ni un ID dentro de sus listas.

Cuando un registro válido se publica, Clases muestra controles que llevan al elemento exacto: la lección seleccionada o el ejercicio seleccionado. La navegación usa los eventos internos `traza:navigate`, `traza:select-lesson` y `traza:select-exercise`. No se presenta un botón de Aprende sin destino real.

## Archivos y pruebas

- `src/ui/ficha-classes.js`: vista e integración de rutas.
- `src/styles/ficha-classes.css`: tarjetas responsive y secciones de vigencia.
- `src/content/class-learning-map.js`: fuente de asociaciones curriculares.
- `tests/ficha-classes.test.js`: vigencias futuras, actuales e históricas.
- `tests/class-learning-map.test.js`: IDs válidos, duplicados y referencias inexistentes.
- `tests/ficha-schedule.test.js`: horario, fechas de corte y solapamientos.
- `e2e/module-8-classes.spec.js`: vista, horario vigente, historial, sábado, ausencia de asociaciones inventadas y navegación a elementos exactos de Aprende con referencias válidas.

## Pendiente real para cerrar el vínculo curricular

- Recibir el plan oficial de formación o una matriz de competencias/resultados por materia.
- Confirmar qué lecciones y ejercicios corresponden a cada bloque.
- Añadir esos IDs a `CLASS_LEARNING_MAP` y conservar la evidencia que respalda cada vínculo.

La vista Clases y su estructura de navegación están implementadas. Lo que falta no es otra pantalla: es la información curricular autorizada para poblar el mapa sin inventar relaciones.
