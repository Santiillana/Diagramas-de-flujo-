# Estado de implementación

Última actualización: 2026-11-14

## Repositorio y ramas
- Repositorio: `Santiillana/Diagramas-de-flujo-`
- Rama predeterminada: `main`
- Base M1 integrada: `19c1efb82623a671ecd8d205a5cfe6c6939405fb`
- Rama M2: `module-2/lessons-exercise-catalog`
- Último commit M2 probado: `6cc719260a4333473965a1e3e32efabee93afb11`
- M1 PR #1 integrado en main.

## Estado de los cinco módulos
| Módulo | Estado | Commit | Pruebas y evidencia | Pendientes |
|---|---|---|---|---|
| 1. Arquitectura y experiencia visual | **Aceptado e integrado** | `19c1efb82623a671ecd8d205a5cfe6c6939405fb` | 7/7 Node + 7/7 Playwright; push y PR verdes | Ninguno dentro del alcance |
| 2. Aprende y 40 ejercicios | **Implementado y CI aprobada; integración pendiente** | `6cc719260a4333473965a1e3e32efabee93afb11` | Run 43574423097: 13/13 Node + 11/11 Playwright | PR de integración |
| 3. Parser, intérprete, diagramas y simulación | Pendiente | — | No ejecutadas | Integrar M2 |
| 4. Laboratorio y constructor | Pendiente | — | No ejecutadas | Depende de M1, M2 y M3 |
| 5. Integración, auditoría y publicación | Pendiente | — | No ejecutadas | Depende de M1 a M4 |

## M1 — Evidencia
- Push: https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43573647719 — success.
- Pull request: https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43573651228 — success.
- 7 pruebas estructurales y 7 pruebas Chromium: responsive, navegación, dock, preferencias y referencia original.

## M2 — Contenido implementado
- `src/content/lessons.js`: 14 lecciones en secuencia; cada una incluye objetivo, explicación intuitiva y técnica, visualización por pasos, ejemplo, manipulación y comprobación.
- `src/content/exercises.js`: exactamente 40 ejercicios; 20 básicos, 10 intermedios y 10 avanzados, con ficha de entradas, salidas, restricciones, análisis, métodos, pseudocódigo, ejemplos, casos y errores.
- `src/ui/content-view.js`: lecciones interactivas, buscador y filtro del catálogo, detalle de cada ejercicio y selector de métodos.
- `src/styles/content.css`: presentación responsive de contenido.
- `tests/content.test.js`: 6 pruebas de estructura y regresiones.
- `e2e/module-2.spec.js`: 4 pruebas de interacción de contenido.

### Regresiones contempladas
- Fibonacci termina en 34 y no imprime 55.
- Máximo/mínimo parten del primer dato, incluidos casos negativos.
- Factorial declara 0! = 1.
- No calcular promedios sin datos.
- Validaciones, centinelas, límites y empates explicitados.
- Sin matrices/arreglos como tema, funciones, procedimientos, recursividad ni operador módulo nuevo.

### CI M2
- https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43574423097 — success.
- Node: 13/13 pruebas.
- Playwright Chromium: 11/11 pruebas (arquitectura M1 y contenido M2).
- Ubuntu 24.04 / Node 22.

## Arquitectura y comandos
- HTML estático, CSS modular y JavaScript ES modules.
- Sin dependencias de runtime; Playwright solo para test.
- Desarrollo: `python3 -m http.server 8000`
- Instalar: `npm install`
- Node: `npm test`
- Navegador: `npx playwright install chromium` y `npm run test:browser`
- GitHub Pages, raíz del repo; no hay paso de build.

## Referencias inmutables
- HTML original Git blob: `9f7f5a3d68d10b004e2ea306df1109906f13bc33`.
- Master V5 Git blob: `c74422272ba8b89757af1be74bca2722337ec902`.
Ambos hashes coinciden con los adjuntos originales.

## Próximo paso
Integrar M2 y construir M3. El simulador solo se marcará funcional cuando una única traza determinista alimente el pseudocódigo, SVG, En escena, variables, historial y salida.
