# Estado de implementación

Última actualización: 2026-11-14

## Repositorio y ramas
- Repositorio: `Santiillana/Diagramas-de-flujo-`
- Rama predeterminada: `main`
- Rama M5: `module-5/final-audit-release`
- Último commit validado de M5: `045f5be0b2f5dc7fe39eb34797a69cba26448612`
- M1 integrado: `19c1efb82623a671ecd8d205a5cfe6c6939405fb`
- M2 inicial integrado: `b15acd5bdd59238f127d6d96972d719b96c2d671`
- M3 integrado: `fd7d574abdf8b13e151d8cb6038e7d0e4344f363`
- M4 integrado: `fc77b2d68a6454101d6edb915a117fafd3cdea34`
- PR #1 (M1), #2 (M2), #4 (M3) y #5 (M4) están integrados. El PR #3 se cerró como sustituido por #5; sus correcciones principales están consolidadas.
- PR M5 #6 fusionado; merge commit: `e510f534049c0a990ee03fde38d6b21ec40e8505`.

## Estado de los cinco módulos

| Módulo | Estado | Commit integrado / validado | Pruebas | Pendientes |
|---|---|---|---|---|
| 1. Arquitectura y experiencia visual | **Aceptado e integrado** | `19c1efb82623a671ecd8d205a5cfe6c6939405fb` | 7/7 Node + 7/7 Chromium iniciales; regresiones posteriores mantienen cinco espacios | Ninguno dentro de alcance; M5 incluye responsive y visual audit |
| 2. Aprende y 40 ejercicios | **Aceptado e integrado** | `b15acd5bdd59238f127d6d96972d719b96c2d671` + correcciones consolidadas en M4 | 14 lecciones, 40 retos 20/10/10; oráculo matemático independiente de 170 escenarios | Ninguno dentro del alcance; modos de reto y correcciones integrados |
| 3. Parser, intérprete, diagrama y simulador | **Aceptado e integrado** | `fd7d574abdf8b13e151d8cb6038e7d0e4344f363` | 31/31 Node + 16/16 Chromium en aceptación M3; suites M5 vuelven a cubrir el simulador | Ninguno dentro del alcance |
| 4. Laboratorio y constructor | **Aceptado e integrado** | `fc77b2d68a6454101d6edb915a117fafd3cdea34` | 216/216 Node + 28/28 Chromium en aceptación M4 | Limitación explícita: el constructor es estructurado, no ofrece conexiones manuales arbitrarias por puerto |
| 5. Integración, auditoría y publicación | **Aceptado e integrado en main; deploy Pages pendiente de activación** | `e510f534049c0a990ee03fde38d6b21ec40e8505` | **222/222 Node + 38/38 Chromium**, CI main #43615474220 — success | Activar Pages desde Settings y verificar URL |


## M1 — Arquitectura y experiencia visual
- Cinco espacios de navegación, shell visual y responsive.
- Tokens, tema, motion reducido, navegación por teclado y layout del simulador.
- README, decisiones, estado y referencia original.

## M2 — Aprende y catálogo
- `src/content/lessons.js`: 14 lecciones con explicación, ejemplo, visualización y quiz.
- `src/content/exercises.js`: exactamente 40 ejercicios (20/10/10).
- `src/ui/content-view.js`: buscador, niveles, métodos y ficha detallada.
- Modo reto: análisis/proceso, persistencia local, pistas y solución voluntaria.
- `tests/reference-results.test.js`: 170 escenarios calculados con oráculo independiente de las soluciones.

## M3 — Motor y simulador
- Parser restringido, expresiones, intérprete determinista y límites de seguridad.
- SVG generado desde AST y resaltado del paso real.
- Snapshot único para pseudocódigo, escena, variables, historial y salida.
- Avance/retroceso determinista y mensajes de error pedagógicos.

## M4 — Laboratorio y constructor
- Seis actividades conectadas a la traza real.
- Experimentos aislados para que ¿Y si…? no mutile la ejecución base.
- Builder con nodos y bloques anidados compilados a pseudocódigo M3; mismo intérprete, sin motor paralelo.
- Modelo estructurado: secuencia, ramas V/F y cuerpos de ciclos. No se afirma edición libre de puertos arbitrarios.

## M5 — Auditoría final y experiencia de simulación
- Auto-cámara y pan manual en el mismo desplazamiento del SVG.
- Token móvil y realce de la rama V/F elegida.
- Fit por viewBox, zoom, fullscreen y salida de fullscreen dentro del lienzo.
- Historial de variables con eventos, origen y cambios anteriores/nuevos.
- Restauración de muestra, tamaño de pseudocódigo persistente, desglose de operaciones.
- “En escena” minimizable y con estado de vueltas anidadas.
- Pestañas móviles para Problema, Diagrama, En escena, Variables, Salida e Historial.
- Capturas CI de simulador, laboratorio y constructor en desktop/tablet/móvil.
- CI: https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43614738106 — **success**.
- Node: **222/222**; incluye oráculo independiente, parser/interpreter, rendimiento y regresiones.
- Playwright Chromium: **38/38**; navegación 5 espacios, 40 ejercicios/14 lecciones, simulador, laboratorio, constructor, fullscreen/pan/zoom/mobile tabs, responsive 390/1024/1440px, consola.
- Artefacto de capturas: `ui-audit-045f5be0b2f5dc7fe39eb34797a69cba26448612` (retención de CI 7 días). El conjunto se revisó visualmente.

## Arquitectura y comandos
- HTML/CSS/JavaScript ES nativo, sin dependencias de runtime.
- Desarrollo: `python3 -m http.server 8000`
- Instalación: `npm install`
- Node: `npm test`
- Chromium: `npx playwright install chromium` y `npm run test:browser`
- Publicación estática, sin build de bundler.

## Referencias inmutables
- HTML original Git blob: `9f7f5a3d68d10b004e2ea306df1109906f13bc33`.
- Master V5 Git blob: `c74422272ba8b89757af1be74bca2722337ec902`.

## Pendientes externos / diferencias declaradas
1. Crear PR del M5, comprobar sus checks y fusionarlo.
2. GitHub Pages: el repo es estático y compatible, pero no se verificó su configuración ni una URL pública desde esta ejecución; activar Pages desde Settings si no está habilitado.
3. Constructor: editor estructurado de secuencias y bloques anidados, no libre conexión manual de cualquier puerto.
4. La cámara y la inspección se prueban mediante Chromium y capturas automatizadas; no se realizó prueba táctil en un dispositivo físico real.


## Extensión en revisión — rama `mejoras/traza-v2`

Este apartado describe cambios posteriores al estado histórico de M5. No modifica el hecho de que los cinco módulos base se integraron en `main`; estas mejoras siguen separadas y no están fusionadas.

- Aprende: 17 lecciones, cinco bloques, cinco pantallas por lección y progreso local.
- Ejercicios: 45 en total (20 básicos, 10 intermedios, 10 avanzados y 5 expertos). Se preservan los 40 originales.
- Retos expertos: Euclides (MCD/MCM), divisores y primalidad, Cramer 3×3, Newton–Raphson y Simpson 1/3.
- Catálogo: búsqueda, nivel, filtro conceptual derivado del pseudocódigo, filtro «De clase» y paginación.
- Laboratorio: ocho actividades con progreso y dos actividades nuevas basadas en la traza real.
- Simulador: escenas específicas y narración conectadas a eventos reales.
- Constructor: historial de deshacer/rehacer, con atajos Ctrl/Cmd+Z y Ctrl/Cmd+Y.
- Inicio: panel de acceso rápido con estadísticas y progreso de aprendizaje.

**Validación pendiente:** Node y Playwright deben ejecutarse sobre el commit final de esta rama. No declarar aceptación hasta revisar CI y corregir cualquier fallo. `main` y las rutas protegidas permanecen intactas.
