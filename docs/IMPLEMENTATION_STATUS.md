# Estado de implementación · Traza

**Actualizado:** 17 de noviembre de 2026  
**Repositorio:** `Santiillana/Traza`  
**Rama principal:** `main`  
**SHA de main después de M6:** `cd9c7598969d9487c779234451a32d9e5f3d67c6`  
**PR M6:** [#21](https://github.com/Santiillana/Traza/pull/21), fusionada el 16 de noviembre de 2026.

## Estado ejecutivo

Los módulos V5 y la ampliación v4 del catálogo están integrados en `main`. La auditoría M5 se fusionó mediante la PR #20 el 16 de noviembre; la CI posterior sobre `main` fue correcta. El Módulo 6, derivado de la Fase 6 del informe de mejoras v2, amplía la portada v4 y verifica el historial del Constructor. Su PR #21 está fusionada en `main`.

| Área | Estado | Evidencia |
|---|---|---|
| Base visual y navegación | Integrada y auditada | 10 vistas, teclado y responsive |
| Aprende | Integrado | 17 lecciones, cuatro bloques, escenas y progreso local |
| Ejercicios | Integrado | 45 retos, distribución 20/10/10/5, búsqueda y filtros |
| Simulador y motor | Integrados y revalidados | Parser/intérprete determinista, traza común y regresiones |
| Laboratorio y constructor | Integrados y revalidados | Ocho actividades; Constructor estructurado sobre el motor común |
| M5 · auditoría y release | **Integrado en main** | PR #20 fusionada; 267 Node y 99 Chromium aprobadas en el SHA de auditoría |
| M5 · publicación pública | Pendiente externo | Falta origen HTTPS real y smoke test posterior al despliegue |
| M6 · Inicio y Constructor (Fase 6 mejoras v2) | **Integrado en main** | PR #21 fusionada; 267/267 Node y 103/103 Playwright aprobadas |

## Secuencia y alcance

### Módulos del documento maestro V5
- **M1:** arquitectura visual, sistema de estilos, navegación y responsive.
- **M2:** lecciones y catálogo didáctico.
- **M3:** parser, intérprete determinista, SVG y sincronización del Simulador.
- **M4:** Laboratorio y constructor estructurado, con traza y motor común.
- **M5:** integración, auditoría, rendimiento y preparación de publicación.

El Documento maestro V5 define cinco módulos. El Módulo 6 procede de la secuencia complementaria del documento `docs/INFORME_MEJORAS.md` (Fase 6), no es un sexto módulo retroactivo de V5. La evolución v4 de Mi ficha mantiene su propia secuencia de diez pasos.

### Continuidad v4
La iteración v4 reorganiza la plataforma en Inicio, Mi ficha y Aprende. El rediseño del catálogo de Ejercicios fue integrado mediante PR #19; su merge commit fue `e80d5773eed6ab0c193ad351e618ce744b0c8441`.

### M5 · Integración, auditoría, rendimiento y publicación
- PR #20: [fusionada](https://github.com/Santiillana/Traza/pull/20), merge commit `ea25db33153afbb6ee506647496a74e6dc0f9fde`.
- CI de auditoría: [run 43955709695](https://github.com/Santiillana/Traza/actions/runs/43955709695).
- Resultado: **267/267 Node**, **99/99 Playwright/Chromium**, 18 capturas.
- M5 queda aceptado a nivel de código, documentación y CI.
- El deployment público sigue pendiente porque no se ha verificado un origen HTTPS real ni se ha ejecutado el smoke test de producción.

### M6 · Inicio y pulido del Constructor
El alcance procede de la Fase 6 del informe de mejoras v2. La PR #7 fue fusionada el 15 de noviembre de 2026 (merge commit `893dd1cf4192be1a627d8e21eea49d012506e3fb`) e integró la base del panel de Inicio y el historial de 60 estados del Constructor. El rediseño v4 posterior sustituyó esa portada por una portada de secciones, y el M6 actual completa su continuidad:

- Inicio muestra lecciones completadas de 17, porcentaje, barra de progreso accesible y mensaje contextual.
- El dato se lee de la clave persistente existente `traza:v2:learn`; no se duplica ni cambia su esquema.
- Inicio ofrece atajos directos a Ejercicios, Simulador y Laboratorio.
- Los botones Deshacer/Rehacer anuncian nombres accesibles y atajos de teclado.
- El historial existente de 60 snapshots no se reimplementa; se añaden pruebas del límite real, undo/redo, atajos y descarte de rama futura.

#### Resultado CI de M6
- PR: [#21](https://github.com/Santiillana/Traza/pull/21), fusionada el 16 de noviembre de 2026.
- Merge commit: `cd9c7598969d9487c779234451a32d9e5f3d67c6`.
- CI final: [GitHub Actions 43962065870](https://github.com/Santiillana/Traza/actions/runs/43962065870).
- SHA probado: `c5c0df01eb7054f5767ca4cc8348512305df6bf8`.
- Node: **267/267**, cero fallos.
- Playwright/Chromium: **103/103**, cero fallos.
- Artefacto visual: `ui-audit-7ff31ec21cce8e9256bd5be23ce0f204181c52ca`, ID `14274866581`, 18 capturas.

### Auditoría de la secuencia v4 · Mi ficha

La secuencia de diez pasos de Mi ficha es independiente de los cinco módulos del Documento maestro V5 y de la Fase 6 del informe de mejoras v2. La PR #22 desarrolla los pasos 5–10; sigue abierta, en borrador y sin integrar en `main`.

| Paso v4 | Estado en `main` | Estado en PR #22 |
|---|---|---|
| 1. Sistema visual y temas | Integrado con el shell v4 | Tema independiente para Inicio, Aprende y Mi ficha; valores por defecto comprobados y preferencias separadas verificadas por Playwright |
| 2. Portada y navegación | Integrado mediante PR #21 | Conservado |
| 3. Aprende y Laboratorio | Integrados; 17 lecciones y 8 actividades de laboratorio | Sin cambios previstos |
| 4. Ejercicios | Integrado; 45 ejercicios | Sin cambios previstos |
| 5. Núcleo de Mi ficha | No implementado | Repositorio común y persistencia local protegida; E2E de ciclo de vida y recuperación aprobados. Falta definir migraciones antes de cambiar el esquema |
| 6. Hoy, Semana y Calendario | No implementado | Horario oficial en Colombia, recurrencias, vigencias, navegación, estados temporales y fechas de actividades |
| 7. Actividades y detalle | No implementado | Catálogo oficial separado e interfaz personal completa; ciclo de vida, filtros, edición y protección de datos corruptos cubiertos por E2E aprobados |
| 8. Clases y conexión con Aprende | Parcial implementado | Vista Clases, horario vigente e historial, publicaciones oficiales y mapa curricular con validación de IDs; enlaces exactos de Aprende se activarán solo cuando existan asociaciones verificadas |
| 9. Biblioteca | No implementado | Interfaz personal, almacenamiento separado y respaldos implementados; E2E de creación, edición, filtros, archivo y restauración aprobados. Fuente oficial preparada y vacía |
| 10. Respaldo, auditoría y documentación | Parcial avanzado | Respaldos granulares e integral de Actividades/Biblioteca, validación estricta y rollback compensatorio; faltan migraciones, pruebas de fallo extremo, auditoría completa y verificación externa de publicación |

#### Paso 5 · núcleo y persistencia

- Fuente de contenido oficial: `src/content/ficha.js`; no se copia a `localStorage`.
- Clave personal: `traza:v4:ficha`, esquema 1.
- La lectura estricta diferencia datos corruptos, registros inválidos y esquemas futuros.
- Las escrituras se bloquean cuando el estado existente no es válido, para impedir que una lectura de emergencia como “vacío” destruya información.
- Los respaldos validan estructura completa y campos anidados. La restauración de un respaldo válido es el único flujo que puede reemplazar explícitamente un estado local dañado.
- La información sigue siendo local a cada navegador. No hay sincronización multiusuario.

#### Paso 6 · horario y agenda

- Archivo oficial: `src/content/ficha.js`; zona `America/Bogota`; ocho bloques semanales.
- `src/ui/ficha-schedule.js` conecta Hoy, Semana y Calendario.
- Las fechas de asignación y vencimiento se consultan desde el mismo repositorio personal.
- Se probaron recurrencias pasadas/futuras, vigencia histórica del lunes, dos bloques del sábado, domingo sin clases y estados Ahora/Próxima/Ya terminó.
- Se corrigió la selección del calendario para que corresponda al mes visible.
- El horario es editable en el repositorio, no desde un panel de moderación.

#### Paso 7 · Actividades

- `src/ui/ficha-activities.js` y `src/styles/ficha-activities.css` implementan la primera interfaz funcional.
- `src/content/ficha-activities.js` contiene el catálogo público oficial de solo lectura. Está vacío hasta que el moderador incorpore actividades verificadas mediante PR.
- La pantalla permite crear/editar, buscar, filtrar, registrar intentos, transcribir devoluciones, guardar notas personales y archivar sin borrar la bitácora.
- Los enlaces de evidencia admiten solo HTTP/HTTPS.
- El estado Aprobada solo se refleja a partir de una devolución favorable transcrita, claramente identificada como no verificada por Traza.
- Estos registros pertenecen al estudiante local. No son actividades oficiales publicadas para todo un grupo.

#### Resultado de validación de la rama

- PR: [#22](https://github.com/Santiillana/Traza/pull/22), abierta, en borrador y sin fusionar.
- SHA validado por GitHub Actions: `04b699f737ba1866a025c6aaed79dbfa956598a3`.
- GitHub Actions: run [43996077312](https://github.com/Santiillana/Traza/actions/runs/43996077312), **300/300 pruebas Node y 116/116 pruebas Playwright aprobadas**, cero fallos.
- El check externo **Workers Builds: diagramas-de-flujo** para este SHA terminó en **failure** (build Cloudflare `60f5ad16-c73d-4434-997e-2b5fedc869aa`). GitHub no recibió anotaciones ni causa técnica de Cloudflare.
- El mismo check externo también aparece fallido en el SHA base de `main` (`cd9c7598969d9487c779234451a32d9e5f3d67c6`, build `726475b5-3558-4061-a5b4-bc4b58cdb949`). Por tanto, el fallo ya estaba presente en la base; sigue siendo un bloqueo operativo que debe revisarse desde el panel de Cloudflare antes de publicar.
- No se ha ejecutado un smoke test del sitio desplegado. La CI de GitHub no sustituye el build externo ni el smoke test.
- Ningún archivo protegido del Simulador está incluido en los cambios de la PR.

#### Paso 8 · Clases y conexión con Aprende

- `src/ui/ficha-classes.js` y `src/styles/ficha-classes.css` implementan una vista de Clases alimentada desde `src/content/ficha.js`.
- Muestra las materias y docentes vigentes, los dos bloques del sábado como `Clase del sábado`, materiales y actividades oficiales asociadas por `classId`, y el historial de vigencias anteriores.
- No asocia automáticamente lecciones ni ejercicios de Aprende. `src/content/class-learning-map.js` define el mapa explícito y valida los IDs frente a horarios, 17 lecciones y 45 ejercicios; permanece vacío hasta contar con asociaciones oficiales.
- `e2e/module-8-classes.spec.js` cubre los siete bloques vigentes al 17 de noviembre de 2026, el bloque histórico del lunes anterior al 2 de noviembre, los dos bloques del sábado y la ausencia de asociaciones pedagógicas inventadas.
- Para habilitar enlaces pedagógicos hacen falta las asociaciones oficiales por competencia/materia. El archivo y su validación de IDs reales ya están preparados.

#### Paso 9 · Biblioteca

- `src/ui/ficha-library.js` y `src/styles/ficha-library.css` implementan el catálogo personal, búsqueda, filtros, edición, archivo y apertura segura de enlaces.
- `src/ui/ficha-library-store.js` mantiene el almacenamiento separado `traza:v4:library`, validación estricta, bloqueo de sobrescritura y respaldo/importación versionados.
- `src/content/ficha-resources.js` contiene el catálogo oficial de solo lectura. Está vacío hasta que se incorporen recursos revisados.
- Hay respaldos granulares para restauración selectiva y un respaldo integral para guardar Actividades y Biblioteca personales en un solo archivo.

#### Paso 10 · Respaldo y auditoría

- Se mantienen respaldos independientes para Actividades y Biblioteca, y se añadió el respaldo integral `traza-full-ficha-backup` que combina ambas áreas personales.
- La importación integral valida los dos formatos antes de escribir, conserva snapshots de ambas claves y hace rollback compensatorio si falla la segunda escritura. No puede ofrecer atomicidad real multi-clave ante cierre abrupto del navegador.
- `tests/ficha-full-backup.test.js` cubre exportación, validación, restauración integral, rechazo de contenido malformado y rollback ante fallo transitorio.
- La vista Hoy permite crear y restaurar un respaldo integral de las dos claves personales; la restauración actualiza las vistas de Actividades y Biblioteca.
- La interfaz ofrece exportar/restaurar el archivo integral desde Hoy; los archivos oficiales del horario y catálogos se recuperan del historial Git.
- Pendiente: migraciones entre versiones, pruebas de cuota y fallos persistentes, recuperación ante rollback fallido, auditoría editorial completa y smoke test del build externo.

#### Moderación y operación editorial

- `docs/MODERATION_WORKFLOW.md` define cómo actualizar el horario y separa contenido oficial de datos personales.
- Todavía no existe panel seguro de moderador. Para publicar actividades globales, biblioteca y cambios compartidos hacen falta autenticación, roles, API y base de datos; no se debe simular seguridad solo con JavaScript.

#### Pendiente para cerrar Mi ficha

1. Repetir CI después de cualquier cambio posterior al SHA validado y mantener los checks verdes.
2. Revisar el build de Cloudflare Workers de forma directa y hacer smoke test de la previsualización; no se da por aprobada su publicación solo por la CI de GitHub.
3. Completar el puente Clases ↔ Aprende solo con asociaciones reales y verificadas.
4. Diseñar el backend, segmentación de cohortes y panel de moderador antes de permitir administración global desde la aplicación.
5. Añadir recursos y actividades oficiales verificados; ambos catálogos centrales están preparados pero vacíos.
6. Ejecutar auditoría integral y smoke test de aceptación antes de fusionar/desplegar.

No fusionar ni publicar la PR #22 mientras falle el build externo o queden incompletos los criterios de aceptación.


## Arquitectura y comandos

- Runtime: HTML/CSS/JavaScript ES nativo; sin bundler ni dependencias de runtime.
- Instalar: `npm install`
- Desarrollo local: `python3 -m http.server 8000`
- Node: `npm test`
- Chromium: `npx playwright install chromium` y `npm run test:browser`

## Publicación y limitaciones

- `.github/workflows/pages.yml` permite una ejecución manual de respaldo en GitHub Pages. El comentario del workflow identifica Cloudflare Workers como hosting primario, pero no hay evidencia automatizada del estado actual de ese hosting.
- `.github/workflows/post-deploy.yml` requiere el origen HTTPS real, espera la marca exacta `traza-release` y ejecuta `e2e/production-smoke.spec.js`. No se ha ejecutado porque no se ha verificado el origen de producción.
- No afirmar que la aplicación está publicada hasta completar ese smoke test.
- Responsive se prueba en Chromium emulado, no en un teléfono o tableta física.
- El constructor es estructurado (secuencia, ramas V/F y ciclos anidados); no es un editor libre de conexiones manuales arbitrarias entre puertos SVG.
- Las pruebas de rendimiento cubren límites funcionales de iteración/traza; no equivalen a benchmarks en hardware físico ni a pruebas de carga multiusuario.

## Referencias

- Especificación: `docs/MASTER_SPEC.md`.
- Informe M5: `docs/MODULE_5_RELEASE_AUDIT.md`.
- Informe M6: `docs/MODULE_6_HOME_BUILDER.md`.
- Especificación M7: `docs/MODULE_7_ACTIVITY_DETAIL.md`.
- Integración Clases ↔ Aprende: `docs/MODULE_8_CLASS_LEARN_INTEGRATION.md`.
- Biblioteca M9: `docs/MODULE_9_LIBRARY.md`.
- Respaldo y auditoría M10: `docs/MODULE_10_BACKUP_AUDIT.md`.
- Horario oficial: `docs/OFFICIAL_CLASS_SCHEDULE.md`.
- Informe acumulado v2: `docs/INFORME_MEJORAS.md`.
- Aceptación: `docs/FINAL_ACCEPTANCE.md`.
