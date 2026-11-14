# Estado de implementación

Última actualización: 2026-11-14

## Repositorio y ramas
- Repositorio: `Santiillana/Diagramas-de-flujo-`
- Rama predeterminada: `main`
- M1 integrado: `19c1efb82623a671ecd8d205a5cfe6c6939405fb`
- M2 integrado: `b15acd5bdd59238f127d6d96972d719b96c2d671`
- Rama de trabajo M3: `module-3/deterministic-pseudocode-engine`
- Último commit M3 probado: `92d3d9f92c33276b466eeea82c7e1a92b3cfcc1d`
- PR M1 #1 y PR M2 #2 integrados en `main`.

## Estado de los cinco módulos
| Módulo | Estado | Commit | Pruebas y evidencia | Pendientes |
|---|---|---|---|---|
| 1. Auditoría, arquitectura y experiencia visual | **Aceptado e integrado** | `19c1efb82623a671ecd8d205a5cfe6c6939405fb` | 7/7 Node + 7/7 Playwright | Ninguno dentro del alcance |
| 2. Aprende y catálogo de 40 ejercicios | **Aceptado e integrado** | `b15acd5bdd59238f127d6d96972d719b96c2d671` | 13/13 Node + 11/11 Playwright; distribución 20/10/10 | La ejecución semántica de cada método quedó comprobada en M3 |
| 3. Parser, intérprete, diagrama y simulador | **Implementado y validado; PR de integración pendiente** | `92d3d9f92c33276b466eeea82c7e1a92b3cfcc1d` | 31/31 Node + 16/16 Playwright | Integración en main |
| 4. Laboratorio y constructor | Pendiente | — | No ejecutadas | Depende de integrar M3 |
| 5. Integración, auditoría y publicación | Pendiente | — | No ejecutadas | Depende de M1 a M4 |

## M1 — Evidencia
- Push: https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43573647719 — success.
- PR: https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43573651228 — success.
- 7 pruebas estructurales y 7 Chromium: navegación, responsive, dock, preferencias y referencia original.

## M2 — Contenido aceptado
- `src/content/lessons.js`: 14 lecciones con objetivo, explicación intuitiva/técnica, visualización, ejemplo, manipulación y comprobación.
- `src/content/exercises.js`: exactamente 40 fichas, 20/10/10, con datos, restricciones, análisis, métodos y escenarios.
- `src/ui/content-view.js`: catálogo interactivo, filtros y contenido de Aprende.
- `tests/content.test.js` y `e2e/module-2.spec.js`: estructura, niveles, búsquedas, ficha y métodos.
- La validación de ejecución de métodos se completa contra el intérprete M3, sin dar por bueno el resultado solo por estar escrito en la ficha.

## M3 — Motor y simulador implementados
- `src/core/expression.js`: tokenizador, parser de expresiones y evaluador de operaciones aritméticas, comparaciones y lógica.
- `src/core/parser.js`: parser recursivo de pseudocódigo; estructura errores con línea y fuente.
- `src/core/interpreter.js`: intérprete determinista, snapshots de variables/salida, eventos, errores pedagógicos y timeline reversible.
- `src/diagram/layout.js`, `src/diagram/renderer.js`: layout desde AST y SVG con terminal, entrada, proceso, salida, decisión, Para, conectores, rutas y retornos.
- `src/ui/simulator.js`, `src/styles/simulator.css`: selección de método, entrada editable, pseudocódigo resaltado, diagrama sincronizado, escena, variables, salida, historial y dock.
- Se mantiene una única fuente de verdad: el snapshot de traza del motor. No hay `eval` ni `new Function`.

### Correcciones confirmadas al comparar el catálogo con la ejecución
- Ejercicio 34: si cuatro valores son iguales, la primera posición de máximo y mínimo es 1, no 2.
- Ejercicio 36: con notas 3, 4 y 5 el promedio es 4 y se aprueban tres; se corrigió el resultado esperado.
- Fibonacci: 0,1,1,2,3,5,8,13,21,34; no 55.
- Máximos/mínimos con negativos, factorial 0! = 1, centinelas y promedios sin datos permanecen cubiertos.

### CI M3
- Run push: https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43575439638 — **success**.
- Node: **31/31**. Incluye todos los métodos y todos los escenarios declarados de los 40 ejercicios.
- Playwright Chromium: **16/16**. Incluye M1, M2 y cinco pruebas del simulador: ejecución, sincronización de paneles, avance/retroceso, selección desde catálogo, entradas incompletas y responsive.
- Sin errores de consola durante las pruebas de navegador.

## Arquitectura y comandos
- HTML/CSS/JavaScript ES modules, sin dependencias de runtime.
- Playwright solo para test.
- Desarrollo: `python3 -m http.server 8000`
- Instalación: `npm install`
- Node: `npm test`
- Navegador: `npx playwright install chromium` y `npm run test:browser`
- GitHub Pages: root; no hay build de bundler.

## Referencias inmutables
- HTML original Git blob: `9f7f5a3d68d10b004e2ea306df1109906f13bc33`.
- Master V5 Git blob: `c74422272ba8b89757af1be74bca2722337ec902`.

## Siguiente paso
Integrar M3 en main y empezar M4. El constructor debe compilar al mismo modelo y ejecutar usando este intérprete; no debe existir un segundo motor.
