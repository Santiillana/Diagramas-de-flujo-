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
| C · Animación por eventos | Pendiente | Movimiento escalado y tres niveles de movimiento |
| D · En escena visual | Pendiente | Visualizaciones por tipo de evento |
| E · Cámara y fullscreen | Parcial en V5; falta auditoría frente a la nueva especificación |
| F · Aprende vivo | Pendiente | Mini-programas interpretados por el motor único |
| G · Guía de figuras y ciclos | Pendiente | Catálogo de conceptos y ayuda contextual |
| H · Laboratorio sin bloqueo | Pendiente | Verificar las seis actividades sin ejecución previa |
| I · Razonamiento, pistas y métodos | Pendiente | Campo `razonamiento` en 40 fichas y pistas progresivas |
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
