# Registro de decisiones técnicas

## D-001 · Aplicación estática con módulos nativos
**Decisión:** HTML semántico, CSS modular y JavaScript nativo con módulos ES.  
**Motivo:** GitHub Pages puede servir el proyecto directamente; no se necesita un framework ni un paso de compilación en esta etapa.

## D-002 · Separación de capas CSS
**Decisión:** tokens, layout, componentes, movimiento y responsive en archivos separados.  
**Motivo:** valores visuales, composición, piezas reutilizables, animaciones y reglas de pantalla evolucionan sin concentrarse en una hoja monolítica.

## D-003 · El motor será la única fuente de verdad
**Decisión:** M1 y M2 no crean un intérprete ficticio ni muestran pasos, resultados o variables como si fueran una ejecución real.  
**Motivo:** la especificación exige sincronización determinista entre diagrama, pseudocódigo, escena, variables, historial y salida. El motor compartido es el alcance del M3.

## D-004 · Referencia original inmutable
**Decisión:** conservar el HTML original byte por byte en `reference/diagramas_de_flujo_original.html`.  
**Motivo:** evitar perder capacidades antes de implementar y comprobar equivalencias. Su inventario está en `docs/ORIGINAL_FEATURE_AUDIT.md`.

## D-005 · Dock dentro del flujo de layout
**Decisión:** el dock ocupa una fila propia del grid; no usa posición fija ni se superpone al lienzo.  
**Motivo:** el diagrama mantiene su espacio y no queda tapado por los controles.

## D-006 · Controles incompletos se muestran como no disponibles
**Decisión:** controles del simulador, actividades del laboratorio y elementos del constructor que aún no existen se muestran como preparados/deshabilitados, sin fingir acciones.  
**Motivo:** la interfaz no debe dar resultados falsos.

## D-007 · Accesibilidad desde la arquitectura
**Decisión:** navegación por botones, estados `aria-current` / `aria-pressed`, foco visible, enlace para saltar al contenido, movimiento reducido explícito y respeto a `prefers-reduced-motion`.  
**Motivo:** teclado, contraste y movimiento forman parte de la base.

## D-008 · Pruebas visuales de aceptación automatizadas
**Decisión:** Playwright con Chromium y Ubuntu 24.04 en GitHub Actions.  
**Motivo:** el runner `ubuntu-latest` cambió a Ubuntu 26.04 y Playwright 1.56.1 no instalaba Chromium; fijar 24.04 hizo reproducibles las pruebas de escritorio, tableta y móvil. El workflow valida navegación, overflow, dock, preferencias y referencia antes de aceptar M1.
