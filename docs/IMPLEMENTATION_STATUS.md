# Estado de implementación · Traza

**Actualizado:** 16 de noviembre de 2026  
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
La existencia de rutas de navegación no equivale a la implementación de las vistas. En `main`, `index.html` contiene los contenedores de Hoy, Semana, Calendario, Actividades y Biblioteca, pero todos siguen siendo placeholders (`shell-placeholder`). `src/app.js` no inicializa un módulo de Mi ficha y no existe `src/content/ficha.js` en `main`.

- **Paso 5 v4 · Núcleo y persistencia:** en desarrollo en esta rama. Se creó `src/ui/ficha-store.js` con modelo Activity, entregas, devoluciones, bitácora, reglas de estado, persistencia tolerante y contrato de respaldo versionado; pruebas unitarias añadidas. Pendientes: controles de respaldo, formularios/selectores compartidos, E2E y conexión completa de las vistas.
- **Paso 6 v4 · Hoy, Semana y Calendario:** integración inicial en esta rama con horario oficial en `America/Bogota`, navegación semanal/mensual y estados temporales. Pendiente conectar eventos y fechas de actividades desde el repositorio M5.
- **Paso 7 v4 · Actividades:** no implementado en `main`; la vista es un placeholder.
- **Biblioteca y puente Clases ↔ Aprende:** no implementados.

No confundir el M6 de la Fase 6 del informe de mejoras v2 (Inicio/Constructor, ya integrado) con el paso 6 de la secuencia v4 de Mi ficha (Hoy/Semana/Calendario, pendiente).

### Horario oficial de clases
- Fuente de contenido creada en `src/content/ficha.js`, con ocho bloques y zona `America/Bogota`.
- El horario es contenido oficial editable del proyecto, no dato personal del navegador.
- Supuestos y reglas documentados en `docs/OFFICIAL_CLASS_SCHEDULE.md`.
- La prueba `tests/ficha-schedule.test.js` valida la estructura, el cambio de lunes y las materias no informadas del sábado.
- **En `main`:** las vistas Hoy, Semana y Calendario siguen siendo placeholders.
- **En esta rama M7:** `src/ui/ficha-schedule.js` y `src/styles/ficha-schedule.css` conectan el horario a Hoy, Semana y Calendario; `index.html` y `src/app.js` inicializan estas vistas. CI de arquitectura y navegador aprobada en el run 43964672938 para el SHA 3116f55.
- Esto no completa el paso 5 v4 ni la persistencia personal, Actividades o Biblioteca.

### M7 · Actividades y detalle de Mi ficha
- Rama de trabajo: `v4/module-7-activities`.
- Especificación técnica creada en `docs/MODULE_7_ACTIVITY_DETAIL.md`. El repositorio M5 ya tiene una primera implementación en esta rama; la interfaz M7 sigue pendiente.
- La especificación define catálogo, detalle, entregas, devoluciones, estados, bitácora, persistencia, fechas, accesibilidad e integración.
- **No implementado todavía:** la vista Actividades continúa siendo provisional.
- Dependencia obligatoria: cerrar la integración y aceptación de los pasos 5 y 6 de Mi ficha antes de cerrar M7. La interfaz M7 debe consumir `src/ui/ficha-store.js` y no crear almacenamiento paralelo.

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
- Horario oficial: `docs/OFFICIAL_CLASS_SCHEDULE.md`.
- Informe acumulado v2: `docs/INFORME_MEJORAS.md`.
- Aceptación: `docs/FINAL_ACCEPTANCE.md`.
