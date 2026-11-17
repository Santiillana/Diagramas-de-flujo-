# Flujo de moderación · Mi ficha

## Estado actual y permisos

Traza se sirve como aplicación estática. Actualmente no existe una cuenta de moderador, inicio de sesión, panel administrativo, API de escritura ni almacenamiento compartido administrado por Traza. No se debe publicar una pantalla de carga como si esas capacidades existieran.

El moderador actualiza el contenido oficial mediante cambios versionados en el repositorio. Los cambios pasan por Pull Request, pruebas y revisión antes de llegar a `main`.

## 1. Actualizar el horario

Archivo: `src/content/ficha.js`, propiedad `FICHA.horario`.

Cada bloque contiene identificador, día (1=lunes a 6=sábado), hora inicial/final en formato 24 h, competencia, instructor y vigencia opcional.

Para cambiar un bloque desde una fecha:
1. Conserva el bloque anterior y fija `vigenteHasta` al día anterior al cambio.
2. Añade el nuevo bloque con un identificador único y `vigenteDesde` igual a la fecha efectiva.
3. Mantén los nombres de materias e instructores como datos confirmados; usa «por confirmar» cuando falte información.
4. Comprueba Hoy, Semana y Calendario tanto antes como después de la fecha de cambio.

Las fechas de vigencia son fechas civiles inclusivas con formato `YYYY-MM-DD`. La interpretación del horario de lunes a viernes y sábado se documenta en `OFFICIAL_CLASS_SCHEDULE.md`.

## 2. Publicar o actualizar una actividad

Archivo: `src/content/ficha.js`, propiedad `FICHA.actividades`.

Cada actividad oficial debe tener:
- `id` único y estable.
- `competenciaId` existente.
- Título y descripción claros.
- Propósito, instrucciones y entregables.
- Fechas de apertura y límite confirmadas (o `null` si no hay fecha).
- Fuente y fecha de actualización.
- Identificadores existentes en `leccionIds` y `ejercicioIds`.
- `documentoIds` si se utiliza un inventario documental adicional.

La vista de Actividades solo presenta el catálogo oficial como contenido de consulta. El checklist, las notas y las devoluciones transcritas se guardan en el navegador de cada estudiante y no modifican el catálogo.

Cuando se sustituyan todos los ejemplos por información institucional confirmada, actualiza `FICHA.meta.esDemostracion` a `false` y corrige `meta.fuente`, `meta.actualizado` y la versión.

## 3. Publicar documentos en una sección

Archivo: `src/content/ficha.js`, propiedad `FICHA.documentos`.

Antes de registrar metadata, el moderador debe cargar el archivo binario en un servicio de almacenamiento compartido autorizado y obtener una URL HTTPS estable. No se deben guardar binarios ni enlaces temporales en `localStorage`.

Contrato de metadata:
- `id`, `titulo`, `descripcion`, `nombreArchivo`.
- `mimeType` y `tamanoBytes`.
- `url` HTTPS sin credenciales o ruta local segura.
- `secciones`: una o más de `clases`, `actividades`, `biblioteca`.
- `claseId` cuando se asocia a una clase.
- `actividadId` cuando se asocia a una actividad.
- `estadoPublicacion`: `borrador` o `publicado`.
- `publicadoEn`, `actualizado` y `fuente`.

Ejemplo conceptual de documento publicado:
```js
{
  id: "guia-actividad-diagrama",
  titulo: "Guía de la actividad",
  descripcion: "Instrucciones y criterios de entrega",
  nombreArchivo: "guia-actividad.pdf",
  mimeType: "application/pdf",
  tamanoBytes: 245760,
  url: "https://archivos.ejemplo.edu/guia-actividad.pdf",
  secciones: ["actividades", "biblioteca"],
  actividadId: "actividad-diagrama",
  estadoPublicacion: "publicado",
  publicadoEn: "2026-11-18",
  actualizado: "2026-11-18",
  fuente: "Instructor responsable"
}
```

Reglas:
- Un documento en borrador no aparece a los estudiantes.
- Un documento publicado necesita URL segura y fecha válida.
- Un documento asociado a una actividad debe incluir la sección `actividades`.
- Un documento asociado a una clase debe incluir la sección `clases`.
- Los enlaces con protocolos distintos de HTTPS, credenciales incrustadas o rutas locales con traversal se rechazan.
- `documentosPublicados` vuelve a validar metadata antes de devolver documentos a una vista.

## 4. Revisión y publicación

Antes de abrir una PR:
1. Revisar que los identificadores sean únicos y que las relaciones apunten a actividades, clases, competencias, lecciones y ejercicios existentes.
2. Validar cada documento con `validarDocumentoOficial`.
3. Confirmar que solo los materiales aprobados estén en estado `publicado`.
4. Ejecutar `npm test` y `npm run test:browser`.
5. Revisar las vistas afectadas en escritorio y móvil.
6. Abrir PR con resumen de cambios, fecha efectiva y fuente de la información.

## 5. Qué falta para una carga directa desde Traza

Para que un moderador pueda iniciar sesión, cargar archivos y publicarlos desde la propia aplicación se necesita un servicio adicional:
- autenticación y sesiones;
- roles y autorización comprobada en servidor;
- almacenamiento de archivos con permisos y límites de tamaño/tipo;
- API para borradores, publicación, retirada y versiones;
- auditoría de quién cambió qué y cuándo;
- validación de archivos en servidor y política de acceso;
- almacenamiento compartido que entregue URLs estables.

Hasta que esa infraestructura exista, el flujo versionado anterior es el único flujo de publicación real.