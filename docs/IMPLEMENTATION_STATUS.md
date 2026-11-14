# Estado de implementación

Última actualización: 14 de noviembre de 2026

## Repositorio y ramas
- Repositorio: `Santiillana/Diagramas-de-flujo-`
- Rama predeterminada: `main`
- Último commit de `main` inspeccionado antes de la fase 2: `d63acf146860209b2866460fbe34294b7c2d28ae`
- Rama de trabajo de la Instrucción maestra 2: `instruction-2/live-lab-phase`
- La fase 2 parte del estado integrado de M1–M5. No se reinicia el proyecto ni se modifica `reference/`.

## Estado de los cinco módulos V5

| Módulo | Estado | Commit integrado / validado | Evidencia registrada |
|---|---|---|---|
| 1. Arquitectura y experiencia visual | **Aceptado e integrado en main** | `19c1efb82623a671ecd8d205a5cfe6c6939405fb` | 7/7 Node + 7/7 Chromium iniciales |
| 2. Aprende y 40 ejercicios | **Aceptado e integrado en main** | `b15acd5bdd59238f127d6d96972d719b96c2d671` y correcciones posteriores | 14 lecciones, 40 ejercicios 20/10/10, oráculo independiente de 170 escenarios |
| 3. Parser, intérprete y simulador | **Aceptado e integrado en main** | `fd7d574abdf8b13e151d8cb6038e7d0e4344f363` | 31/31 Node + 16/16 Chromium en aceptación M3 |
| 4. Laboratorio y constructor | **Aceptado e integrado en main con límite documentado** | `fc77b2d68a6454101d6edb915a117fafd3cdea34` | 216/216 Node + 28/28 Chromium en aceptación M4 |
| 5. Integración y auditoría V5 | **Aceptado e integrado en main** | Merge `e510f534049c0a990ee03fde38d6b21ec40e8505` | CI main registrada: 222/222 Node + 38/38 Chromium |

El PR #6 de M5 está fusionado. No queda pendiente crear ni fusionar ese PR.

## Evidencia V5 disponible
- CI de M5: https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43614738106
- CI de main: https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43615474220
- Capturas CI: `ui-audit-045f5be0b2f5dc7fe39eb34797a69cba26448612`
- HTML original inmutable: `reference/diagramas_de_flujo_original.html`, Git blob `9f7f5a3d68d10b004e2ea306df1109906f13bc33`
- Especificación V5: `docs/MASTER_SPEC.md`, blob `c74422272ba8b89757af1be74bca2722337ec902`

## Limitaciones conocidas que siguen explícitas
1. El Constructor es un editor estructurado por secuencia, ramas V/F y bloques anidados. No es todavía un editor de conexiones libres entre puertos.
2. No se realizó prueba táctil física en un dispositivo real; las pruebas responsive son automatizadas en Chromium.
3. GitHub Pages no se considera publicado hasta verificar la URL pública. La entrega de esta fase se preparará además para Netlify como sitio estático.

## Instrucción maestra 2 — progreso
| Tarea | Estado | Evidencia / notas |
|---|---|---|
| T0 · Higiene previa | **Aceptado** | Commit `8ae08c1d55466cedd6af671a49c93089856b0bff`; CI #173: 224/224 Node y 38/38 Chromium, success |
| T1 · Bugs conocidos | **Aceptado** | Commits `ab141be8ea425f8dc2f16139e929da6405d3402f` + correcciones; CI #174: 228/228 Node y 41/41 Chromium, success |
| A · Escenario | **Aceptado** | Commit `01bd31191199abbaddbe4936f32cb9829484967a` + correcciones; CI #177: 232/232 Node y 46/46 Chromium, success; capturas desktop/tablet/mobile |
| B · Selector, teclado y velocidad | **Aceptado** | Commit `9c6cb7b4122b4a20b07c68eb7b3bf581ced4a4de`; CI #188: 235/235 Node y 51/51 Chromium, success; capturas desktop/tablet/mobile |
| C · Animación por eventos | **Aceptado** | Commit `1fc3872f4e381b4d6cc5b1740113fee31abcfd7e` + ajustes de pruebas; CI #191: 240/240 Node y 54/54 Chromium, success; capturas guardadas |
| D · En escena visual | **Aceptado** | Commit `30a67f23f6cfa3f9a6f65c12ac27273a613383d3` + corrección; CI #194: 245/245 Node y 57/57 Chromium, success; capturas guardadas |
| E · Cámara y fullscreen | **Aceptado** | Commits `c2628180da5166ce12a8cfbb951e59f4f48d0fd5`, `e32051cb7870fc79c726502b8d5b5d5ab4695adc` y correcciones; CI #198: 250/250 Node y 61/61 Chromium, success; capturas guardadas |
| F · Aprende vivo | **Aceptado** | Commit `280bd48cba4e056cb7282f6d6f9dfb06007948ff`; CI #199: 255/255 Node y 64/64 Chromium, success; capturas guardadas |
| G · Guía de figuras y ciclos | **Aceptado** | Commits `43cc57c934561de82b63cd28c60cec6c1c97f3a1` + corrección; CI #? (`43643271857`): 260/260 Node y 67/67 Chromium, success; capturas guardadas |
| H · Laboratorio sin bloqueo | **Aceptado** | Commit `171fd66ff9c1526e16c08223dc6e615e7673a8fa`; CI (`43643879643`): 263/263 Node y 70/70 Chromium, success; capturas guardadas |
| I · Razonamiento, pistas y métodos | **Aceptado** | Commit `6f40140e6ee1a6e79ea7bbd11d02cd59848000c7`; CI (`43644547610`): 267/267 Node y 73/73 Chromium, success; capturas guardadas |
| J · Aprendizaje activo | Pendiente | Prueba de solución, predicción diagnóstica, progreso, compartir y proyector |
| K · Pulido visual global | Pendiente | Tipografía mínima y contraste AA en ambos temas |
| L · Auditoría y piloto | Pendiente | Paridad, capturas de cinco espacios y prueba con estudiantes |

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
