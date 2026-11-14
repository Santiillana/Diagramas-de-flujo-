# Estado de implementación

Última actualización: 2026-11-14

## Repositorio y ramas
- Repositorio: `Santiillana/Diagramas-de-flujo-`
- Rama predeterminada: `main`
- Rama de trabajo de M1: `module-1/architecture-visual-system`
- Estado inicial auditado: repositorio vacío, sin ramas ni commits.
- Commit semilla de `main`: `c6b931c98aa27627adf10fe80ec8457ea7826ef4`
- Entrega inicial de M1: `623f654d4daa4f324a87b690d217edb383623df1`
- M1 se cierra con pruebas automatizadas de navegador además de la suite de arquitectura.

## Estado de los cinco módulos
| Módulo | Estado | Commit de cierre | Pruebas | Bloqueos / pendientes |
|---|---|---|---|---|
| 1. Auditoría, arquitectura y experiencia visual | En validación final | Pendiente del workflow Playwright | 7 pruebas Node + aceptación real en Chromium para navegación, tres tamaños, dock, tema, movimiento y referencia | Aceptar solo cuando CI esté verde |
| 2. Aprende y 40 ejercicios | Pendiente | — | No ejecutadas | Depende del cierre de M1 |
| 3. Parser, intérprete y simulación sincronizada | Pendiente | — | No ejecutadas | Depende de M1 y M2 |
| 4. Laboratorio y constructor | Pendiente | — | No ejecutadas | Depende de M1, M2 y M3 |
| 5. Integración, auditoría y publicación | Pendiente | — | No ejecutadas | Depende de M1 a M4 |

## Arquitectura actual
- Aplicación estática con HTML semántico, CSS separado por responsabilidad y módulos ES nativos.
- Sin dependencias de ejecución; Playwright es dependencia solo de desarrollo/validación.
- Entrada: `index.html`.
- Navegación: `src/ui/navigation.js`.
- Preferencias de tema y movimiento: `src/ui/preferences.js`.
- Sistema visual: `src/styles/`.
- Pruebas unitarias/estructurales: `tests/architecture.test.js`.
- Pruebas de navegador: `e2e/module-1.spec.js`.
- Workflow de calidad: `.github/workflows/quality.yml`.
- Referencia funcional inmutable: `reference/diagramas_de_flujo_original.html`.

## Comandos
- Desarrollo: `python3 -m http.server 8000`
- Pruebas estructurales: `npm test`
- Pruebas de navegador: `npm run test:browser` (requiere Chromium de Playwright)
- Build: no aplica; los archivos se sirven directamente.

## Funciones originales preservadas
El HTML adjunto se conserva byte por byte como referencia inmutable y se enlaza desde la nueva interfaz. La auditoría de funciones está en `docs/ORIGINAL_FEATURE_AUDIT.md`; un panel visual no equivale a una migración funcional.

Integridad verificada anteriormente:
- HTML original: blob `9f7f5a3d68d10b004e2ea306df1109906f13bc33`.
- Documento V5: blob `c74422272ba8b89757af1be74bca2722337ec902`.
Ambos blobs coinciden con los adjuntos originales.

## Pruebas y resultados
- Suite Node: 7 pruebas estructurales aprobadas en GitHub Actions en la entrega anterior.
- Añadida suite Playwright Chromium: navegación de cinco espacios, ausencia de overflow horizontal en escritorio (1440 px), tableta horizontal (1024 px) y móvil (390 px), dock separado del área de diagrama, preferencia de tema, movimiento reducido y acceso HTTP al prototipo original.
- El resultado del workflow de cierre se registrará tras ejecutarse en el commit de esta actualización.
- No se marca M1 como aceptado hasta que el job de navegador termine correctamente.

## Problemas conocidos
- Simulador, motor, lecciones, ejercicios interactivos, actividades y constructor todavía no se consideran migrados. El Módulo 2 incorpora contenido; el motor y la ejecución pertenecen al Módulo 3; el laboratorio y constructor funcional al Módulo 4.
