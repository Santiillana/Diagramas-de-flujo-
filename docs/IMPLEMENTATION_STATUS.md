# Estado de implementación

Última actualización: 2026-11-14

## Repositorio y ramas
- Repositorio: \`Santiillana/Diagramas-de-flujo-\`
- Rama predeterminada: \`main\`
- Rama de trabajo: \`module-1/architecture-visual-system\`
- Estado inicial auditado: repositorio vacío, sin ramas ni commits.
- Commit semilla de \`main\`: \`c6b931c98aa27627adf10fe80ec8457ea7826ef4\`
- Commit principal de la arquitectura M1: [\`8a5ff2f8058ea5ab0ed1a7aa485f150adebc6a25\`](https://github.com/Santiillana/Diagramas-de-flujo-/commit/8a5ff2f8058ea5ab0ed1a7aa485f150adebc6a25)
- No hay módulos previamente aceptados.

## Estado de los cinco módulos

| Módulo | Estado | Commit de cierre | Pruebas | Bloqueos / pendientes |
|---|---|---|---|---|
| 1. Auditoría, arquitectura y experiencia visual | En curso; entrega inicial implementada, no aceptada todavía | Commit principal enlazado arriba | 11 comprobaciones estáticas sobre archivos recuperados desde GitHub; test suite Node pendiente de CI | Revisión en navegador y tamaños reales; revisar resultado de CI; cerrar checklist de equivalencia |
| 2. Aprende y 40 ejercicios | Pendiente | — | No ejecutadas | Depende de la aceptación del Módulo 1 |
| 3. Parser, intérprete y simulación sincronizada | Pendiente | — | No ejecutadas | Depende de los Módulos 1 y 2 |
| 4. Laboratorio y constructor | Pendiente | — | No ejecutadas | Depende de los Módulos 1, 2 y 3 |
| 5. Integración, auditoría y publicación | Pendiente | — | No ejecutadas | Depende de los Módulos 1 a 4 |

## Arquitectura actual
- Aplicación estática con HTML semántico, CSS separado por responsabilidad y módulos ES nativos.
- Sin framework ni dependencias de ejecución.
- Entrada: \`index.html\`.
- Navegación: \`src/ui/navigation.js\`.
- Preferencias de tema y movimiento: \`src/ui/preferences.js\`.
- Sistema visual: \`src/styles/\`.
- Pruebas: \`tests/architecture.test.js\`.
- Workflow de calidad: \`.github/workflows/quality.yml\`.
- Referencia funcional inmutable: \`reference/diagramas_de_flujo_original.html\`.

## Comandos
- Desarrollo: \`python3 -m http.server 8000\`
- Pruebas: \`npm test\` (Node.js 18+)
- Build: no aplica; los archivos se sirven directamente.

## Funciones originales preservadas
El HTML adjunto se incorpora como referencia inmutable y se enlaza desde la nueva interfaz. El prototipo sigue disponible durante la transición. La correspondencia del inventario está en \`docs/ORIGINAL_FEATURE_AUDIT.md\`; una función no se considera migrada solo por existir un panel visual equivalente.

Verificación de integridad de referencias:
- HTML original: Git blob \`9f7f5a3d68d10b004e2ea306df1109906f13bc33\`, coincide con \`git hash-object\` del adjunto.
- Documento V5: Git blob \`c74422272ba8b89757af1be74bca2722337ec902\`, coincide con \`git hash-object\` del adjunto.

## Pruebas y resultados
- 11/11 comprobaciones estáticas sobre los archivos recuperados desde la rama de trabajo: nombres de vistas, paneles del simulador, actividades del laboratorio, navegación por teclado, controles de tema/movimiento, breakpoints responsive, movimiento reducido, ausencia de \`eval\` / \`new Function\`, existencia del test suite y hashes de referencia.
- Suite \`npm test\`: aprobada en ambos workflows GitHub Actions (push y pull request), job `Architecture checks`, 7/7 tests exitosos. [Push run](https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43572798285) · [Pull request run](https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43572803428).
- No se realizó una inspección visual manual en navegador; escritorio, tableta y móvil siguen pendientes de comprobación.
- Por estas limitaciones, el Módulo 1 permanece “En curso” y no se marca como aceptado.

## Problemas conocidos y siguiente acción
- Los cinco espacios tienen estructura visual y navegación; el contenido aprobado y las acciones de ejecución se mantienen como estados preparados.
- Los controles cuyo motor todavía no existe permanecen deshabilitados.
- Siguiente acción: revisar los resultados del workflow y abrir la aplicación en escritorio, tableta horizontal y móvil; resolver cualquier fallo antes de aceptar M1.
