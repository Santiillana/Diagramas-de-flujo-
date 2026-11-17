# Módulo 5 v4 · Núcleo y persistencia de Mi ficha

**Rama de trabajo:** `v4/module-7-activities`  
**Estado:** repositorio, integración de agenda y controles visibles de respaldo implementados en esta rama; formularios de Actividades y aceptación E2E final pendientes.

## Objetivo y límites

Este módulo establece un único repositorio local para los datos personales de Mi ficha. El horario oficial permanece como contenido versionado del proyecto en `src/content/ficha.js`; nunca se copia al almacenamiento del navegador.

Los registros personales no son calificaciones oficiales ni una conexión con plataformas institucionales. Las devoluciones se identifican como transcripciones del estudiante. No se afirma sincronización entre dispositivos.

## Contrato de almacenamiento

- Clave: `traza:v4:ficha`.
- Esquema: versión 1.
- Persistencia: `localStorage`, aislada del horario oficial y de las claves de progreso de Aprende.
- Lectura tolerante: almacenamiento bloqueado, JSON corrupto o esquema desconocido producen un estado vacío seguro.
- Escritura: valida y normaliza antes de persistir; devuelve un resultado explícito si el almacenamiento falla.
- Notificación: evento `traza:ficha-change` después de una escritura confirmada.

## Entidades

### Activity

`id`, `title`, `description`, `classId`, `competencyId`, `assignedOn`, `dueOn`, `status`, `createdAt`, `updatedAt`, `attempts`, `feedbackEntries`, `notes`, `archivedAt`, `events`.

El vínculo `classId` solo admite identificadores existentes en el horario oficial. Las fechas de asignación y vencimiento son fechas civiles `YYYY-MM-DD`; las marcas de creación y modificación son ISO 8601.

### SubmissionAttempt

Cada entrega genera un identificador propio, instante ISO, número consecutivo, resumen, enlace opcional y observación. No se afirma que el archivo exista ni que un enlace temporal esté respaldado.

### FeedbackEntry

La fuente se fija en `student_transcription`. El resultado puede ser favorable, solicitud de corrección o informativo. Una devolución favorable cambia el estado a Aprobada; una solicitud de corrección lo cambia a Por corregir. La aplicación no autentica al instructor.

### ActivityEvent

La bitácora conserva creación, edición, cambios de estado, entregas, devoluciones, notas y archivo lógico. Cada cambio agrega un evento; no se borra el historial anterior.

## Reglas de negocio

- Estados: `pending`, `in_progress`, `submitted`, `needs_correction`, `approved`.
- El estudiante no puede pasar directamente a Aprobada.
- Una entrega crea un nuevo intento y cambia a Entregada.
- Una nueva entrega después de una solicitud de corrección crea otro intento, sin reemplazar el anterior.
- Atrasada es una condición calculada; nunca se persiste como estado.
- Las fechas se comparan como cadenas civiles validadas, sin construir fechas con `new Date('YYYY-MM-DD')`.
- Los registros se archivan lógicamente para preservar la bitácora.

## API implementada

En `src/ui/ficha-store.js`:

- `createEmptyFichaData`, `normalizeFichaData`, `readFichaData`, `writeFichaData`.
- `createActivity`, `updateActivity`, `transitionActivity`.
- `addSubmission`, `addFeedback`, `archiveActivity`.
- `isCivilDate`, `isActivityOverdue`.
- `createFichaBackup`, `validateFichaBackup`, `importFichaBackup`.

Las operaciones de dominio son puras respecto al almacenamiento: devuelven el nuevo estado y la interfaz debe persistirlo mediante `writeFichaData`. Esto permite probar reglas sin depender del navegador y evita que Actividades cree una segunda base de datos.

## Respaldo

El formato versionado es `traza-ficha-backup`, versión 1. La validación se realiza antes de sustituir el contenido local. Se rechazan versiones desconocidas, registros inválidos, IDs duplicados y referencias a clases o entregas inexistentes. La implementación actual ofrece el contrato de exportación/importación; los controles visibles de respaldo y pruebas de archivo descargado quedan para la integración de interfaz.

## Pruebas

`tests/ficha-store.test.js` cubre fechas civiles, creación, edición, transiciones, aprobación por devolución transcrita, entregas consecutivas, atraso calculado, almacenamiento bloqueado/corrupto, normalización, respaldo e historial de archivo.

## Pendiente para aceptar el paso 5

- Integrar los formularios y selectores compartidos en Mi ficha.
- Añadir migraciones explícitas si se publica una versión futura del esquema.
- Cerrar E2E de persistencia, restauración, almacenamiento bloqueado y accesibilidad.
