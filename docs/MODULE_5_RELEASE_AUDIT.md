# Módulo 5 · Informe de integración, auditoría y publicación

**Especificación aplicada:** Documento maestro V5, Módulo 5.  
**Repositorio:** `Santiillana/Traza`.  
**Commit de partida:** `e80d5773eed6ab0c193ad351e618ce744b0c8441`.  
**Rama de trabajo:** `v4/module-5-integration-audit`.

## Objetivo

Comprobar que la experiencia completa se mantiene consistente, comprensible, accesible y publicable. El trabajo de esta fase se limita a pruebas de aceptación, actualización de documentación y correcciones de release justificadas por fallos reproducibles.

## Auditoría técnica ya existente en main

- **Catálogo:** 45 IDs consecutivos y validación estructural de contenido.
- **Ejecución real:** `tests/exercise-execution.test.js` ejecuta cada método y cada escenario del catálogo con el intérprete.
- **Oráculo independiente:** `tests/reference-results.test.js` compara resultados esperados con cálculos de referencia independientes.
- **Retos expertos:** casos específicos de Euclides, primalidad, Cramer, Newton–Raphson y Simpson.
- **Motor y seguridad:** pruebas de parser, expresiones, decisiones, Para/Mientras/Hacer–Mientras, entradas inválidas y ausencia de `eval`/`new Function`.
- **Rendimiento funcional:** un ciclo de 200 vueltas mantiene la salida y un número acotado de eventos; ciclos anidados conservan el stack de iteraciones; timeline puede saltar y restaurar snapshots.
- **Accesibilidad:** contraste WCAG AA para temas y secciones, colores de estados, movimiento reducido y navegación por teclado.
- **Navegador:** Playwright comprueba Simulador, Laboratorio, constructor, navegación móvil, cámara, zoom, fullscreen, historial, restauración y escenas.

## Auditoría añadida en M5

El archivo `e2e/module-5-release-audit.spec.js` añade cuatro escenarios:
1. Navegar por las diez vistas y detectar excepciones JavaScript, errores de consola y fallos al cargar scripts/estilos.
2. Revisar ausencia de desbordamiento horizontal en 390, 768, 1024 y 1440 píxeles.
3. Verificar navegación por teclado entre espacios visibles.
4. Comprobar que la app sigue navegable y conserva el contenido cuando el navegador bloquea localStorage.

La aprobación de estos casos solo se registrará cuando GitHub Actions complete la ejecución del SHA final.

## Publicación

El workflow de Pages es manual y el repositorio incluye un flujo separado de smoke test que recibe un origen HTTPS. No se dispone de evidencia suficiente para afirmar que una URL pública esté activa o configurada. Por tanto:
- El despliegue queda como una comprobación externa obligatoria.
- Una vez conocida la URL real, se ejecuta `Post-deploy production verification` con ese origen.
- Se exige que la respuesta contenga la marca exacta `traza-release` del commit probado y que pase `e2e/production-smoke.spec.js`.

## Limitaciones abiertas

- No se ejecutó prueba táctil en hardware físico.
- El constructor es estructurado, no un editor libre de conexiones arbitrarias.
- Las pruebas de rendimiento cubren límites de iteración y tamaño de traza; no equivalen a benchmark de hardware ni a carga multiusuario.
- El estado de Pages/hosting y el smoke test público no se presumen.

## Estado

**Pendiente de cierre:** resultado de CI del branch M5, revisión de sus capturas y verificación del origen público. La fase no se marcará como aceptación final completa mientras falte cualquiera de esos requisitos.
