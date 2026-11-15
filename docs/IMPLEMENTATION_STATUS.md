# Estado de implementación

Última actualización: 14 de noviembre de 2026

## Repositorio y ramas

- Repositorio: `Santiillana/Diagramas-de-flujo-`
- Rama predeterminada: `main`
- Último commit de `main` inspeccionado: `d63acf146860209b2866460fbe34294b7c2d28ae`
- Rama de trabajo de la Instrucción maestra 2: `instruction-2/live-lab-phase`
- Comparación observada: la rama de fase 2 está 85 commits por delante de `main` y 0 por detrás.
- La fase 2 parte del estado integrado de M1–M5. No reinicia el proyecto ni modifica `reference/`.

## Estado de los cinco módulos V5

| Módulo | Estado | Evidencia |
|---|---|---|
| 1. Arquitectura y experiencia visual | **Aceptado e integrado en main** | 7/7 Node + 7/7 Chromium iniciales |
| 2. Aprende y 40 ejercicios | **Aceptado e integrado en main** | 14 lecciones, 40 ejercicios 20/10/10 y oráculo independiente de 170 escenarios |
| 3. Parser, intérprete y simulador | **Aceptado e integrado en main** | 31/31 Node + 16/16 Chromium en aceptación M3 |
| 4. Laboratorio y constructor | **Aceptado e integrado en main con límite documentado** | 216/216 Node + 28/28 Chromium en aceptación M4 |
| 5. Integración y auditoría V5 | **Aceptado e integrado en main** | CI main registrada: 222/222 Node + 38/38 Chromium |

El PR #6 de M5 está fusionado. No queda pendiente crear ni fusionar ese PR.

## Evidencia V5 disponible

- CI de M5: https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43614738106
- CI de main: https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43615474220
- Capturas CI: `ui-audit-045f5be0b2f5dc7fe39eb34797a69cba26448612`
- HTML original inmutable: `reference/diagramas_de_flujo_original.html`, Git blob `9f7f5a3d68d10b004e2ea306df1109906f13bc33`
- Especificación V5: `docs/MASTER_SPEC.md`, blob `c74422272ba8b89757af1be74bca2722337ec902`

## Limitaciones heredadas de V5

1. El Constructor es un editor estructurado por secuencia, ramas V/F y bloques anidados. No es un editor de conexiones libres entre puertos.
2. No se realizó prueba táctil física en un dispositivo real; las pruebas responsive son automatizadas en Chromium.
3. GitHub Pages no se considera publicado hasta verificar la URL pública.

## Instrucción maestra 2 — progreso verificado

| Tarea | Estado | Evidencia / notas |
|---|---|---|
| T0 · Higiene previa | **Aceptado** | Commit `8ae08c1d55466cedd6af671a49c93089856b0bff`; CI #173: 224/224 Node y 38/38 Chromium, success |
| T1 · Bugs conocidos | **Aceptado** | Commits `ab141be8ea425f8dc2f16139e929da6405d3402f` y correcciones; CI #174: 228/228 Node y 41/41 Chromium, success |
| A · Escenario | **Aceptado** | Commit `01bd31191199abbaddbe4936f32cb9829484967a`; CI #177: 232/232 Node y 46/46 Chromium, success; capturas desktop/tablet/mobile |
| B · Selector, teclado y velocidad | **Aceptado** | Commit `9c6cb7b4122b4a20b07c68eb7b3bf581ced4a4de`; CI #188: 235/235 Node y 51/51 Chromium, success |
| C · Animación por eventos | **Aceptado** | Commit `1fc3872f4e381b4d6cc5b1740113fee31abcfd7e`; CI #191: 240/240 Node y 54/54 Chromium, success |
| D · En escena visual | **Aceptado** | Commit `30a67f23f6cfa3f9a6f65c12ac27273a613383d3`; CI #194: 245/245 Node y 57/57 Chromium, success |
| E · Cámara y fullscreen | **Aceptado** | Commits `c2628180da5166ce12a8cfbb951e59f4f48d0fd5`, `e32051cb7870fc79c726502b8d5b5d5ab4695adc` y correcciones; CI #198: 250/250 Node y 61/61 Chromium, success |
| F · Aprende vivo | **Aceptado** | Commit `280bd48cba4e056cb7282f6d6f9dfb06007948ff`; CI #199: 255/255 Node y 64/64 Chromium, success |
| G · Guía de figuras y ciclos | **Aceptado** | CI run `43643271857`: 260/260 Node y 67/67 Chromium, success |
| H · Laboratorio sin bloqueo | **Aceptado** | CI run `43643879643`: 263/263 Node y 70/70 Chromium, success |
| I · Razonamiento, pistas y métodos | **Aceptado** | CI run `43644547610`: 267/267 Node y 73/73 Chromium, success |
| J · Aprendizaje activo | **Implementado; aceptación técnica en curso** | Código presente para oráculo del Constructor, tabla rellenable, persistencia de pistas/errores, enlaces con datos y predicción, proyector, controles de ciclo y onboarding. Pruebas en `tests/active-learning.test.js`, `e2e/active-learning.spec.js` y `tests/reference-results.test.js`. CI run `43658925370`: 79/79 Chromium, success. Falta una validación final consolidada después de K y revisar el flujo guiado contra el criterio literal del primer paso en el simulador. |
| K · Pulido visual global | **Parcial / en validación** | `src/styles/polish.css` aplica mínimos tipográficos, tokens semánticos y foco visible. `e2e/visual-polish.spec.js` verifica tamaños y contraste ≥ 4.5:1 de tokens semánticos en ambos temas. Falta auditoría automatizada de accesibilidad de la interfaz completa y CI final verde con revisión de capturas. |
| L · Auditoría y piloto | **Parcial** | `e2e/final-audit.spec.js` cubre capturas de cinco secciones en tres tamaños, un ciclo de 499 vueltas y consola sin errores/advertencias al recorrer 40 ejercicios. `docs/PARITY_CHECKLIST.md` registra las brechas. Faltan auditoría axe completa, piloto humano en dos rondas y verificación de la URL pública. |

## Brechas reales para cerrar la fase 2

1. **Accesibilidad integral:** el test actual calcula contraste de tokens semánticos; no equivale a una auditoría axe ni demuestra WCAG AA para cada texto, control y estado real.
2. **Onboarding literal:** existe un recorrido guiado de cuatro pasos y persistencia, pero debe verificarse que acompañe la primera interacción de avance `→` dentro del simulador, como exige la sección 19.9.
3. **Piloto humano:** faltan 3–5 participantes en la primera ronda y 2 personas nuevas en la segunda. No se inventarán participantes ni resultados.
4. **Despliegue:** falta abrir y comprobar la URL pública final. No se afirmará publicación por la mera existencia de un workflow.
5. **Aceptación consolidada:** volver a ejecutar `npm ci`, `npm test` y `npm run test:browser` sobre el estado final y revisar las capturas generadas.

## Comandos reproducibles

- Requisito: Node.js 22.
- Instalación limpia: `npm ci`
- Pruebas Node: `npm test`
- Navegador: `npx playwright install chromium`
- Pruebas browser: `npm run test:browser`
- Servidor local: `python3 -m http.server 8000`

## Reglas de continuidad

- `main` conserva el cierre aceptado de los cinco módulos V5.
- La Instrucción maestra 2 se desarrolla en `instruction-2/live-lab-phase`.
- No marcar una tarea como aceptada sin pruebas y evidencia correspondientes.
- `reference/` permanece inmutable.
- El piloto humano y la publicación solo se cierran con evidencia real.
