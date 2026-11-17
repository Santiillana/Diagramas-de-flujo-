# Operación editorial y moderación de Traza

**Estado actual:** no existe todavía un panel seguro de administración ni una base de datos compartida. Traza se ejecuta como aplicación estática en el navegador. No hay autenticación de usuarios, roles, API de escritura ni almacenamiento centralizado.

## Separación de información

### Contenido oficial del proyecto
Incluye horario, materias, instructores, vigencias, calendarios académicos, actividades oficiales de grupo y recursos de biblioteca. Debe vivir en archivos de contenido versionados y ser publicado mediante revisión y despliegue.

| Información | Fuente actual o prevista | Estado |
|---|---|---|
| Horario de clases | `src/content/ficha.js` | Fuente central editable implementada |
| Vigencias y cambios de horario | `src/content/ficha.js` | Se registran con fechas de inicio y fin |
| Actividades oficiales para un grupo | Fuente central de contenido, pendiente | No confundir con actividades personales |
| Recursos de Biblioteca | Fuente central de biblioteca, pendiente | Biblioteca aún no construida |
| Relaciones de contenido con Aprende | Referencias verificadas, pendiente | No inventar enlaces |

### Información personal del estudiante
La pantalla Actividades permite crear y modificar actividades personales, entregas, notas y devoluciones transcritas. Se guarda en `localStorage` bajo `traza:v4:ficha`, en el navegador de ese estudiante. No aparece automáticamente en otros navegadores ni en la cuenta de un moderador.

Las devoluciones se etiquetan como transcripciones del estudiante. La aplicación no autentica instructores ni certifica una calificación.

## Cómo cambiar el horario hoy

1. Editar `src/content/ficha.js` en una rama de trabajo.
2. Actualizar las fechas `vigenteDesde` y `vigenteHasta` del bloque afectado, sin borrar el historial anterior.
3. Mantener horas en formato 24 h y la zona `America/Bogota`.
4. Ejecutar `npm test` y `npm run test:browser`.
5. Revisar la vista Hoy, Semana y Calendario, incluidos el día del cambio y las fechas anteriores.
6. Abrir una PR, revisar diferencias y checks; integrar solo cuando el build y el smoke test aplicable estén aprobados.

Ejemplo: si una materia cambia desde una fecha, se cierra la vigencia del registro anterior el día previo y se añade el registro nuevo con `vigenteDesde` igual a la fecha efectiva. No se sobrescribe retroactivamente la historia.

## Qué se necesita para un panel real de moderador

Antes de permitir altas y cambios globales desde la interfaz hacen falta:

- Identidad y autenticación del moderador.
- Roles y permisos aplicados en el servidor, no solo ocultando botones.
- API de lectura y escritura con validación de esquema.
- Base de datos compartida para horario, actividades oficiales, recursos y relaciones.
- Registro de auditoría con autor, fecha, valores anteriores y nuevos.
- Publicación controlada, vista previa y posibilidad de revertir cambios.
- Reglas de privacidad que separen los datos de cada estudiante del contenido público.

No se debe añadir un supuesto botón de administración protegido únicamente por JavaScript: en una web estática cualquiera podría inspeccionar el código o manipular las peticiones. Hasta disponer del backend, los cambios oficiales se hacen mediante commits y PR; los datos personales se administran en el navegador de cada estudiante.

## Regla de operación

No editar datos personales de estudiantes desde archivos de contenido. No publicar un cambio global desde `localStorage`. No introducir materias, fechas, instructores ni relaciones sin una fuente confirmada. Todo cambio oficial debe ser revisable y trazable.