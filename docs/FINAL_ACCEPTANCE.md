# Informe de aceptación final · Traza

**Fecha de corte:** 16 de noviembre de 2026  
**Repositorio:** `Santiillana/Traza`  
**Rama predeterminada:** `main`  
**Commit integrado antes de M5:** `e80d5773eed6ab0c193ad351e618ce744b0c8441`

## Resultado actual

La base funcional y las mejoras v4 están integradas en `main`. El Módulo 5 es la auditoría final y la preparación de publicación. Este informe distingue la evidencia ya observada de las verificaciones que todavía requieren un deployment real.

| Área | Resultado al iniciar M5 |
|---|---|
| Inicio y navegación | Integrados; la app declara Inicio, cinco espacios de Mi ficha y cuatro espacios de Aprende |
| Aprende | 17 lecciones; progreso, escenas, ejemplos y comprobación |
| Ejercicios | 45 retos, distribución 20/10/10/5; CI de M4 integrada |
| Simulador | Parser e intérprete sin ejecución dinámica de JavaScript; UI conectada a traza determinista |
| Laboratorio | Ocho actividades y constructor estructurado con compilador y motor compartidos |
| Rendimiento | Pruebas automatizadas de ciclos de 200 vueltas, ciclos anidados y snapshots |
| Accesibilidad | Pruebas de contraste WCAG AA, navegación por teclado y movimiento reducido |
| Publicación | No aceptada como deployment público hasta completar smoke test sobre URL real |

## Evidencia CI de main previa a los nuevos tests M5

[GitHub Actions run 43951436564](https://github.com/Santiillana/Traza/actions/runs/43951436564)

- Node: **267/267**.
- Playwright/Chromium: **95/95**.
- Instalación de dependencias: sin vulnerabilidades reportadas por npm.
- Capturas visuales: 18 PNG subidos correctamente en el artefacto `ui-audit-e80d5773eed6ab0c193ad351e618ce744b0c8441` (ID `14266019722`).

La suite Node ejecuta todos los métodos y escenarios existentes del catálogo y contrasta resultados con un oráculo independiente. Los tests de rendimiento cubren 200 iteraciones, ciclos anidados y navegación por snapshots. La suite de navegador cubre el Simulador, Laboratorio, Constructor, responsive y la nueva navegación del catálogo.

## Criterios de auditoría M5

Los nuevos tests de M5 deben verificar:
- Entrada y navegación por las diez vistas declaradas.
- Ausencia de excepciones JS y fallos al cargar scripts/hojas de estilo.
- Ausencia de desbordamiento horizontal a 390, 768, 1024 y 1440 px.
- Navegación por teclado en los controles visibles.
- Comportamiento tolerante cuando el navegador bloquea localStorage.
- Revalidación del suite de Node y Playwright en el commit de M5.

El resultado final, SHA y artefacto se añadirán tras completar Actions. No se anticipa su aprobación antes de verla.

## Limitaciones que permanecen declaradas

1. **Constructor:** el modelo es estructurado por secuencia, ramas V/F y bloques anidados. No es un editor de conexiones manuales arbitrarias entre puertos SVG.
2. **Dispositivos físicos:** las pruebas responsive se ejecutan en Chromium emulado. No equivalen a una prueba táctil en teléfonos o tabletas reales.
3. **Publicación:** `.github/workflows/pages.yml` permite despliegue manual de respaldo en GitHub Pages. `.github/workflows/post-deploy.yml` requiere introducir el origen HTTPS real. Hasta que esa ejecución finalice y confirme la marca `traza-release` y pase el smoke test, no debe decirse que el sitio está publicado ni que M5 está completamente aceptado.
4. **Rendimiento:** las pruebas de traza acotada garantizan límites funcionales definidos, pero no son una medición de rendimiento en hardware de usuario ni una prueba de carga multiusuario.

## Regla de aceptación

M5 podrá declararse aceptado cuando:
- La CI del SHA final esté verde en Node y Chromium.
- Las capturas de auditoría visual se hayan generado y revisado.
- No queden fallos funcionales reproducibles sin documentar.
- El smoke test del sitio desplegado pase contra el origen HTTPS real.

Si el deployment o la prueba física no están disponibles, se conservarán como limitaciones explícitas; no se sustituirán por inferencias basadas en un merge o en pruebas locales.
