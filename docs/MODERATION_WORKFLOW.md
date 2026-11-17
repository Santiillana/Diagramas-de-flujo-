# Operación editorial y moderación de Traza

**Estado actual:** no existe todavía un panel seguro de administración ni una base de datos compartida. Traza se ejecuta como aplicación estática en el navegador. No hay autenticación de usuarios, roles, API de escritura ni almacenamiento centralizado.

## Separación de información

### Contenido oficial del proyecto
Incluye horario, materias, instructores, vigencias, calendarios académicos, actividades oficiales de grupo y recursos de biblioteca. Debe vivir en archivos de contenido versionados y ser publicado mediante revisión y despliegue.

| Información | Fuente actual o prevista | Estado |
|---|---|---|
| Horario de clases | `src/content/ficha.js` | Fuente central editable implementada |
| Vigencias y cambios de horario | `src/content/ficha.js` | Se registran con fechas de inicio y fin |
| Actividades oficiales | `src/content/ficha-activities.js` | Fuente compartida editable; catálogo inicial vacío |
| Recursos oficiales de Biblioteca | `src/content/ficha-resources.js` | Fuente compartida editable; catálogo inicial vacío |
| Relaciones de contenido con Aprende | Referencias verificadas, pendiente | No inventar enlaces |

### Información personal del estudiante
La pantalla Actividades separa las actividades oficiales publicadas (solo lectura, desde `src/content/ficha-activities.js`) de las actividades personales que cada estudiante crea y modifica. Estas últimas, con entregas, notas y devoluciones transcritas, se guardan en `localStorage` bajo `traza:v4:ficha`, en el navegador de ese estudiante. No aparecen automáticamente en otros navegadores ni en la cuenta de un moderador.

Biblioteca separa el catálogo oficial de solo lectura (`src/content/ficha-resources.js`) de los recursos personales que cada estudiante guarda en su navegador (`traza:v4:library`). Ambos catálogos oficiales están inicialmente vacíos: no se inventaron actividades, libros ni enlaces.

Las devoluciones se etiquetan como transcripciones del estudiante. La aplicación no autentica instructores ni certifica una calificación.

## Cómo publicar una actividad oficial

1. Editar `src/content/ficha-activities.js` y añadir un objeto con `id` único y estable, `title`, `description`, `classId` válido o `null`, `assignedOn`, `dueOn` e `instructionsUrl` opcional.
2. Mantener las fechas en `YYYY-MM-DD`; `null` significa que esa fecha no fue definida. La fecha de vencimiento no puede ser anterior a la asignación.
3. Las instrucciones solo admiten HTTP/HTTPS y no aceptan credenciales en la URL. No añadir notas, entregas ni calificaciones de estudiantes.
4. `validateOfficialActivities` comprueba IDs únicos, campos, clase existente, fechas y URL. Ejecutar `npm test` y `npm run test:browser`, revisar la vista y abrir PR.

El catálogo actual es compartido y público para todos los visitantes. Todavía no segmenta por ficha, cohorte o usuario. No añadir información privada ni datos de calificación a este archivo.

## Cómo publicar un recurso oficial

1. Editar `src/content/ficha-resources.js` y añadir un objeto con `id` único, `title`, `kind`, `url`, `description`, `classId` y `tags`.
2. `kind` admite `link`, `video`, `document`, `book` o `note`. Usar solo recursos revisados y enlaces HTTP/HTTPS. `url: ""` se reserva para referencias bibliográficas o apuntes sin enlace directo, que deben incluir descripción.
3. `classId` debe existir en el horario o ser `null`; las etiquetas deben ser únicas, no vacías y de hasta 32 caracteres. `validateOfficialResources` aplica estas reglas.
4. Ejecutar las pruebas, revisar el catálogo en Biblioteca y publicar mediante PR.

El estudiante puede abrir los recursos oficiales, pero no editarlos desde la aplicación. Sus propios recursos viven por separado en `traza:v4:library` y no modifican el catálogo común.

## Cómo cambiar el horario hoy

1. Editar `src/content/ficha.js` en una rama de trabajo.
2. Actualizar las fechas `vigenteDesde` y `vigenteHasta` del bloque afectado, sin borrar el historial anterior.
3. Mantener horas en formato 24 h y la zona `America/Bogota`. La vigencia inicial y final son inclusivas; si un bloque reemplaza otro, el anterior debe terminar el día previo.
4. `validateHorarioClases` comprueba IDs, días, horas, vigencias y solapamientos de bloques en el mismo día y período. Se permiten bloques contiguos y franjas iguales si sus vigencias no se cruzan.
5. Ejecutar `npm test` y `npm run test:browser`.
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