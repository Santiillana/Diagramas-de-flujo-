# Registro de decisiones técnicas

## D-001 · Aplicación estática con módulos nativos
**Decisión:** HTML semántico, CSS modular y JavaScript nativo con módulos ES.  
**Motivo:** GitHub Pages puede servir el proyecto directamente. No hay necesidad actual de framework, empaquetador o dependencias externas.

## D-002 · Separación de capas CSS
**Decisión:** tokens, layout, componentes, movimiento y responsive en archivos separados.  
**Motivo:** valores visuales, composición, piezas reutilizables, animaciones y reglas de pantalla pueden evolucionar sin concentrarse en una hoja monolítica.

## D-003 · El motor será la única fuente de verdad
**Decisión:** el Módulo 1 no crea un intérprete ficticio ni muestra pasos, resultados o variables simulados.  
**Motivo:** la especificación exige sincronización determinista entre diagrama, pseudocódigo, escena, variables, historial y salida. Los controles de ejecución quedan deshabilitados hasta que exista el motor común.

## D-004 · Referencia original inmutable
**Decisión:** conservar el HTML original byte por byte en \`reference/diagramas_de_flujo_original.html\` y enlazarlo desde la interfaz.  
**Motivo:** evitar perder capacidades del prototipo antes de implementar y comprobar equivalencias. Su inventario está en \`docs/ORIGINAL_FEATURE_AUDIT.md\`.

## D-005 · Dock dentro del flujo de layout
**Decisión:** el dock ocupa una fila propia del grid; no usa posición fija ni se superpone al lienzo.  
**Motivo:** el diagrama mantiene su espacio y no queda tapado por los controles.

## D-006 · Controles incompletos se muestran como no disponibles
**Decisión:** controles de ejecución, actividades del laboratorio y elementos del constructor se presentan como estructura visual, pero no responden a acciones aún no implementadas.  
**Motivo:** mostrar estados preparados es preferible a fingir funcionalidad.

## D-007 · Accesibilidad desde la arquitectura
**Decisión:** navegación por botones, estados \`aria-current\` / \`aria-pressed\`, foco visible, enlace para saltar al contenido, movimiento reducido explícito y respeto a \`prefers-reduced-motion\`.  
**Motivo:** teclado, contraste y movimiento forman parte de la base.
