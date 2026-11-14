# Estado de implementación

Última actualización: 2026-11-14

## Repositorio y ramas
- Repositorio: `Santiillana/Diagramas-de-flujo-`
- Rama predeterminada: `main`
- M1 integrado: `19c1efb82623a671ecd8d205a5cfe6c6939405fb`
- M2 inicial integrado: `b15acd5bdd59238f127d6d96972d719b96c2d671`
- M3 integrado: `fd7d574abdf8b13e151d8cb6038e7d0e4344f363`
- M4 validado en rama: `d85385b0368ebf3cdc1ba6601f5d4ab5e3466d92`
- Rama activa: `module-4/lab-and-graph-builder`
- PR M1 #1, M2 #2 y M3 #4 integrados en main.
- PR M2 #3 permanece abierto; sus cambios relevantes del modo reto y del oráculo están presentes en la rama M4. Se debe cerrar como integrado/sustituido tras verificar el PR M4 o integrarlo primero en M5.

## Estado de los cinco módulos
| Módulo | Estado | Commit de cierre / base | Pruebas y evidencia | Pendientes |
|---|---|---|---|---|
| 1. Auditoría, arquitectura y experiencia visual | **Aceptado e integrado** | `19c1efb82623a671ecd8d205a5cfe6c6939405fb` | 7/7 Node + 7/7 Playwright en su aceptación inicial; regresiones M4 también cubren cinco espacios y responsive | Auditoría visual manual M5 |
| 2. Aprende y 40 ejercicios | **Contenido integrado; correcciones y modo reto consolidados en rama M4** | `b15acd5bdd59238f127d6d96972d719b96c2d671` + cambios de M2 follow-up transportados | 14 lecciones, 40 ejercicios 20/10/10; oráculo independiente de 170 escenarios añadido | Cierre formal de PR #3 en M5 |
| 3. Parser, intérprete, diagramas y simulación | **Aceptado e integrado** | `fd7d574abdf8b13e151d8cb6038e7d0e4344f363` | 31/31 Node + 16/16 Chromium en CI de M3; 40 ejercicios/métodos y trazas | Auditoría de funciones originales en M5 |
| 4. Laboratorio y constructor | **Implementado y validado en rama; integración pendiente** | `d85385b0368ebf3cdc1ba6601f5d4ab5e3466d92` | CI push run 43611043603: 216/216 Node + 28/28 Chromium, success | PR de integración; el editor usa conectores implícitos por orden/anidación, no cableado libre entre puertos |
| 5. Integración, auditoría, rendimiento y publicación | **En curso** | — | Oráculo independiente integrado en tests | revisión total, interacción original restante, manual visual, consola/performance y GitHub Pages |

## M1 — Evidencia
- Push: https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43573647719 — success.
- PR: https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43573651228 — success.
- Navegación, layout, dock, responsive, preferencias y referencia original.

## M2 — Contenido y práctica
- `src/content/lessons.js`: 14 lecciones con explicación intuitiva/técnica, visual por pasos, ejemplo, manipulación y quiz.
- `src/content/exercises.js`: exactamente 40 retos oficiales, 20/10/10.
- `src/ui/content-view.js`: buscador, filtro, ficha y métodos.
- Modo reto con campos de análisis, guardado local, pistas y solución voluntaria. Los métodos no se revelan antes de la decisión del estudiante.
- PR #3 incorpora correcciones, restauración de campos y pruebas independientes. Su contenido de ejercicios y UI coincide con la rama M4; queda pendiente cerrar el PR redundante tras integrar M4.
- `tests/reference-results.test.js`: oráculo matemático por ejercicio, independiente del pseudocódigo.

## M3 — Motor único
- `src/core/expression.js`: tokenizador/parser de expresiones y evaluación aritmética, comparaciones y lógica.
- `src/core/parser.js`: parser restringido para sintaxis del prototipo.
- `src/core/interpreter.js`: snapshots/eventos, avance/retroceso, límite de iteraciones y errores didácticos.
- `src/diagram/layout.js` y `renderer.js`: SVG generado desde AST, rutas y formas.
- `src/ui/simulator.js`: enunciado, datos, pseudocódigo, escena, variables, salida, historial y dock sincronizados.
- Sin `eval` ni `new Function`.

## M4 — Laboratorio y constructor
- `src/ui/lab.js`: seis actividades, consumiendo el evento/diagrama de la traza vigente.
- Predicción contrasta evento previsto con evento real.
- Tabla muestra paso, iteración, variables, primera asignación, anterior → actual y salida.
- Ordena conserva las líneas del método.
- Identifica símbolo utiliza el nodo vinculado al paso activo.
- Encuentra el error usa contraejemplos y un algoritmo correcto.
- ¿Y si…? ejecuta una copia independiente y compara salidas finales, variables y rutas; no cambia la traza original.
- `src/core/flow-compiler.js`: modelo estructurado, validación, compilación al pseudocódigo de M3.
- `src/ui/builder.js`: terminales, paleta, propiedades, reordenar/eliminar, ramas V/F, cuerpos de bucles, plantillas y ejecución compartida con M3.
- Los conectores se infieren del orden secuencial y la anidación estructurada. No es un editor de cableado libre con puertos arbitrarios; los caminos imposibles de representar en el modelo quedan excluidos, mientras que ramas/bucles incompletos se rechazan.
- CSS M4 responsive: `src/styles/lab-builder.css`.
- CI run push: https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43611043603 — **success**.
- Node: **216/216**.
- Playwright/Chromium: **28/28**. Incluye diagnóstico de arranque, cinco espacios, desktop/tablet/móvil, M2 gate, M3 simulator, seis actividades y builder.
- La misma CI ejecutó `tests/reference-results.test.js`; oráculo independiente del catálogo.

## Arquitectura y comandos
- HTML/CSS/JavaScript nativo con módulos ES.
- Sin dependencias de runtime; Playwright solo para test.
- Desarrollo: `python3 -m http.server 8000`
- Instalación: `npm install`
- Node: `npm test`
- Navegador: `npx playwright install chromium` y `npm run test:browser`
- Sitio estático, sin paso de bundler.

## Referencias inmutables
- HTML original Git blob: `9f7f5a3d68d10b004e2ea306df1109906f13bc33`.
- Master V5 Git blob: `c74422272ba8b89757af1be74bca2722337ec902`.

## M5 — auditoría pendiente
1. Comparar cada función de la referencia original contra la vista nueva, marcar equivalencia real o brecha.
2. Correr el oráculo independiente y confirmar todas las salidas/metodos, casos normales/límite/especiales.
3. Completar/validar zoom, cámara automática, pan, ajuste de texto, fullscreen, historial de variables y restauración de ejemplo.
4. Visual manual en escritorio, tableta horizontal y móvil; contraste y reducido movimiento.
5. Rendimiento de ciclos largos/diagramas, consola limpia.
6. Comprobar despliegue público de GitHub Pages; no afirmar sitio publicado antes de verificar la URL.
