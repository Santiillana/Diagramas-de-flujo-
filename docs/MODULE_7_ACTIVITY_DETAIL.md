# Módulo 7 · Actividades y detalle

**Programa:** Traza v4  
**Repositorio:** `Santiillana/Traza`  
**Rama:** `v4/module-7-activities`  
**Base:** integración del Módulo 6, commit `cd9c7598969d9487c779234451a32d9e5f3d67c6`  
**Estado:** catálogo y detalle funcionales en construcción avanzada dentro de esta rama: crear, editar, buscar, filtrar, registrar entregas, devoluciones transcritas, notas, bitácora y archivo lógico. La aceptación final depende de CI y de cerrar los casos E2E.

## 1. Objetivo

Construir la vista Actividades de Mi ficha como el centro de seguimiento del trabajo académico. Debe permitir consultar cada actividad, conocer sus fechas y requisitos, registrar intentos y entregas, conservar devoluciones y resultados, y revisar una bitácora verificable de lo ocurrido.

La vista no será un sistema de calificación oficial ni una integración con Zajuna o SOFIA Plus. Los datos personales se guardarán localmente en el navegador y no se presentarán como verificados por el SENA.

## 2. Dependencias y regla de secuencia

El Módulo 7 depende de contratos que pertenecen a los módulos anteriores:

- **Módulo 5:** modelo común, persistencia local protegida, validación estricta y respaldo versionado en `src/ui/ficha-store.js` y `src/ui/ficha-backup.js`.
- **Módulo 6:** Hoy, Semana y Calendario consumen ese mismo repositorio para fechas de asignación y vencimiento.
- La interfaz de Actividades vive en `src/ui/ficha-activities.js`; no crea una segunda base de datos.

Por tanto, este módulo no debe inventar una segunda base de datos ni implementar almacenamiento paralelo. Los registros creados desde esta pantalla son datos personales del estudiante en su propio navegador. No son tareas publicadas a un grupo por un moderador ni se sincronizan entre usuarios.

## Estado de implementación de la interfaz

La primera interfaz funcional está conectada desde `src/app.js` y `index.html`. Incluye un bloque independiente de actividades oficiales publicadas desde `src/content/ficha-activities.js` (solo lectura y compartidas) y un catálogo personal almacenado localmente:

- Catálogo con búsqueda, filtros por estado y condición temporal, y orden por vencimiento.
- Creación y edición de una actividad, con fechas opcionales y clase relacionada opcional.
- Detalle con estado, fechas, intentos, devoluciones y bitácora.
- Transiciones permitidas: Pendiente → En curso; registro de entrega; devolución transcrita que puede solicitar corrección o indicar resultado favorable.
- Notas personales, archivo lógico y conservación del historial.
- Estados vacíos, mensajes de error, controles por teclado y diseño responsive.

Los E2E de navegador de `e2e/module-7-activities.spec.js` cubren el ciclo de vida, filtros y la protección frente a almacenamiento corrupto. Deben pasar en el SHA final antes de aceptar el módulo.

**Límite deliberado:** las actividades personales son locales. Las actividades oficiales se editan en el archivo central de contenido, se revisan mediante PR y se muestran en solo lectura a todos los visitantes. El catálogo actual no segmenta cohortes ni usuarios. La edición global desde un panel requeriría un servicio central con autenticación y roles de moderador; no se simula con datos locales.

## 3. Experiencia de usuario

### 3.1 Catálogo de actividades

Cada fila o tarjeta muestra, como mínimo:

- Nombre de la actividad.
- Clase, módulo o competencia relacionada, cuando exista.
- Fecha de asignación y fecha límite.
- Estado académico.
- Indicador calculado de vencimiento.
- Último movimiento registrado.
- Acceso al detalle.

Controles de consulta:
- Búsqueda por nombre y descripción.
- Filtro por estado.
- Filtro por clase o competencia.
- Filtro por periodo o vencimiento.
- Orden por fecha límite, actualización y nombre.
- Acción para limpiar filtros.

Los filtros no deben cambiar ni borrar los registros. La lista debe funcionar con teclado, lectores de pantalla y anchuras móviles.

### 3.2 Detalle de actividad

La ficha individual organiza la información en bloques:

1. **Consigna:** título, descripción, instrucciones y criterios conocidos.
2. **Organización:** clase, competencia, fecha de asignación y vencimiento.
3. **Estado:** estado académico actual y condición de atraso calculada.
4. **Entregas:** intentos, fecha de registro, descripción, enlace y observaciones.
5. **Devoluciones:** retroalimentación registrada, fecha, resultado y observaciones.
6. **Notas personales:** apuntes privados del estudiante.
7. **Bitácora:** secuencia cronológica de eventos de la actividad.

El detalle debe mostrar claramente qué información es oficial editable de contenido, qué información introdujo el estudiante y qué información fue transcrita por él a partir de una devolución recibida.

## 4. Estados y transiciones

Estados persistidos permitidos:

- `pending`: Pendiente.
- `in_progress`: En curso.
- `submitted`: Entregada.
- `needs_correction`: Por corregir.
- `approved`: Aprobada.

La condición **Atrasada** no es un estado persistido. Se calcula cuando existe fecha límite, la fecha local actual supera esa fecha y la actividad no está aprobada. La comparación usa fechas civiles `YYYY-MM-DD`, no `new Date('YYYY-MM-DD')`.

Reglas obligatorias:

- Una actividad nueva inicia Pendiente.
- El estudiante puede pasar de Pendiente a En curso.
- Registrar una entrega crea un intento y cambia el estado a Entregada.
- Una devolución que solicita cambios cambia el estado a Por corregir.
- Una devolución con resultado favorable puede cambiar el estado a Aprobada.
- El estudiante no puede marcar directamente una actividad como Aprobada.
- Una nueva entrega después de Por corregir registra otro intento y vuelve a Entregada.
- Una devolución posterior puede volver a dejarla Por corregir o aprobarla.
- No se borra el historial al cambiar el estado.
- Una devolución no favorable no equivale automáticamente a una aprobación ni debe ocultarse.

La aplicación no puede verificar la identidad del instructor sin autenticación institucional. La interfaz debe usar expresiones honestas como **“Devolución registrada por el estudiante”** o **“Resultado transcrito”**. Nunca mostrar “Verificado por instructor” sin una integración autenticada.

## 5. Contrato de datos propuesto

Los tipos definitivos deben armonizarse con el modelo M5 antes de codificar. Este contrato define los campos mínimos requeridos, no una segunda persistencia.

### Activity

- `id`: identificador estable.
- `title`: nombre obligatorio.
- `description`: consigna.
- `classId`: referencia opcional a una clase.
- `competencyId`: referencia opcional a competencia o resultado.
- `assignedOn`: fecha civil opcional.
- `dueOn`: fecha civil opcional.
- `status`: uno de los cinco estados permitidos.
- `createdAt`, `updatedAt`: marcas temporales ISO.
- `attempts`: referencias o colección de entregas.
- `feedbackEntries`: referencias o colección de devoluciones.
- `notes`: notas privadas del estudiante.
- `archivedAt`: fecha opcional de archivo lógico.

### SubmissionAttempt

- `id`, `activityId`.
- `submittedAt`: instante ISO.
- `summary`: descripción de lo entregado.
- `evidenceUrl`: enlace opcional.
- `studentNote`: observación opcional.
- `attemptNumber`: número consecutivo calculado por actividad.

No afirmar que un archivo adjunto está respaldado si solo se conserva su nombre o una URL temporal. La primera versión puede registrar descripción, enlace y observaciones; el almacenamiento real de archivos requiere una decisión explícita del sistema de respaldo.

### FeedbackEntry

- `id`, `activityId`, `submissionId` opcional.
- `recordedAt`: instante ISO.
- `source`: `student_transcription`.
- `result`: `favorable`, `correction_requested` o `informational`.
- `comment`: texto de la devolución.
- `score`: valor opcional, solo si se conoce.
- `scoreScale`: escala opcional para evitar interpretar una nota sin contexto.

La retroalimentación registrada no prueba quién la emitió. No se inventan calificaciones, escalas ni nombres de instructores.

### ActivityEvent

- `id`, `activityId`.
- `type`: creación, edición, cambio de estado, entrega, devolución, nota o archivo.
- `occurredAt`: instante ISO.
- `from`, `to`: valores anteriores y nuevos cuando aplique.
- `description`: explicación legible.
- `source`: acción local del estudiante o importación de respaldo.

La bitácora es cronológica y no se reescribe al editar el contenido actual. Una corrección de un dato debe producir un nuevo evento, no borrar silenciosamente el anterior.

## 6. Persistencia, fechas y respaldo

- Usar exclusivamente el repositorio común de M5.
- Validar datos al leer y escribir; tolerar almacenamiento bloqueado o JSON corrupto sin romper toda la aplicación.
- No guardar secretos, credenciales ni datos institucionales sensibles.
- Las fechas límite se guardan como fechas civiles `YYYY-MM-DD`.
- Las marcas temporales se guardan como ISO 8601.
- La interfaz interpreta las fechas en la zona local del usuario; el proyecto se prueba con la zona horaria de Colombia.
- No usar `new Date('YYYY-MM-DD')` para construir fechas civiles.
- Importar y exportar mediante el formato versionado del respaldo M5.
- La importación debe validar esquema, referencias, duplicados y límites antes de sustituir datos.
- No afirmar sincronización entre dispositivos ni conexión con plataformas externas.

## 7. Integración con otras vistas

El módulo publica cambios mediante el mecanismo de eventos del repositorio M5. No mantiene contadores o copias independientes.

- **Hoy:** actividades vencidas, próximas y que requieren atención.
- **Semana:** fechas límite y entregas organizadas por día.
- **Calendario:** asignación y vencimiento.
- **Clases:** vínculo de la actividad con su clase.
- **Aprende:** vínculo opcional con lecciones y ejercicios relacionados, sin cambiar su progreso ni sus datos.

Si una actividad no tiene fecha, no debe inventarse una para ubicarla en calendario.

## 8. Accesibilidad y diseño

- Mantener identidad visual de Mi ficha y sus temas claro/oscuro independientes de Aprende.
- Contraste WCAG AA para texto y controles.
- Estados identificados con texto e icono, no solo color.
- Orden de foco lógico, foco visible y diálogos con gestión correcta del foco.
- Mensajes de validación asociados a sus campos.
- Confirmación antes de archivar o eliminar datos.
- En móvil, el catálogo pasa a tarjetas legibles y el detalle se organiza en secciones apiladas.
- Respetar movimiento reducido y no usar animaciones como único indicador de cambio.

## 9. Pruebas de aceptación obligatorias

### Modelo y reglas
1. Crear actividad con campos mínimos y valores opcionales.
2. Rechazar título vacío y fechas inválidas.
3. Transiciones válidas e inválidas de estado.
4. Impedir aprobación directa por el estudiante.
5. Registrar entregas consecutivas sin sobrescribir intentos previos.
6. Registrar devolución favorable, solicitud de corrección e informativa.
7. Confirmar que una devolución queda identificada como transcripción local.
8. Calcular atraso sin persistirlo como estado.
9. Mantener bitácora cronológica e íntegra.
10. Evitar duplicados y referencias rotas en importación.

### Persistencia y fechas
11. Los datos sobreviven a recarga.
12. La aplicación tolera localStorage bloqueado y datos corruptos.
13. Las fechas civiles se mantienen iguales en zona horaria Colombia.
14. Los respaldos exportados se pueden importar sin pérdida de campos.
15. Una importación inválida no destruye el estado previo.

### Interfaz y regresión
16. Búsqueda, filtros, orden y limpieza funcionan.
17. El detalle refleja el mismo registro del catálogo.
18. Cambios aparecen en Hoy, Semana y Calendario a través del repositorio común.
19. Navegación por teclado, lector de pantalla y contraste.
20. E2E a 390, 768, 1024 y 1440 px, sin desbordamiento horizontal.
21. Las vistas existentes de Aprende, Ejercicios, Simulador y Laboratorio mantienen su funcionamiento.

## 10. Horario oficial y puente Clases ↔ Aprende
El horario oficial se define en `src/content/ficha.js` y se documenta en `docs/OFFICIAL_CLASS_SCHEDULE.md`. Es contenido editable del proyecto, separado de la persistencia personal.

- M7 debe asociar las actividades con los bloques de clase mediante identificadores estables cuando el modelo de clases del paso 5 esté disponible.
- No duplicar ni convertir el horario oficial en datos del navegador.
- No inventar relaciones entre materias y las 17 lecciones o 45 ejercicios. Solo se añaden enlaces cuando una relación está demostrada por el contenido real.
- El cambio de lunes y las materias no informadas del sábado son supuestos expresos pendientes de confirmación; respetar el documento del horario.
- La zona horaria de las vistas es `America/Bogota`.

## 11. Condiciones para declarar M7 terminado

M7 no se acepta por mostrar tarjetas o formularios. Debe existir modelo integrado, persistencia común, transiciones verificadas, historial íntegro, pruebas unitarias y E2E aprobadas, accesibilidad comprobada y regresión completa.

La implementación comienza después de que M5 y M6 proporcionen sus contratos integrados. Hasta entonces, este documento es la especificación de construcción y no una declaración de que el módulo ya funciona.
