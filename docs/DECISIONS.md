# Registro de decisiones técnicas

## D-001 · Aplicación estática con módulos nativos
HTML semántico, CSS modular y JavaScript ES. GitHub Pages sirve el proyecto directamente.

## D-002 · Separación de capas CSS
Tokens, layout, componentes, movimiento, responsive y estilos de contenido separados por responsabilidad.

## D-003 · El motor es la única fuente de verdad
M1 y M2 no simulan ejecución. M3 implementa un único parser e intérprete deterministas. Diagrama, pseudocódigo, En escena, Variables, historial y salida consumen snapshots del mismo registro de eventos.

## D-004 · Referencia original inmutable
El HTML original se conserva byte por byte en `reference/diagramas_de_flujo_original.html`. Una función se considera migrada solo tras comprobar su equivalencia funcional.

## D-005 · Dock en el flujo de layout
El dock ocupa una fila propia del grid y nunca se superpone al lienzo.

## D-006 · No fingir controles incompletos
Los controles se habilitan solo cuando la acción correspondiente existe.

## D-007 · Accesibilidad desde la arquitectura
Navegación por teclado, estados ARIA, foco visible, tema claro/oscuro, movimiento reducido y respeto a `prefers-reduced-motion`.

## D-008 · CI reproducible en Ubuntu 24.04
Playwright 1.56.1 y Chromium se ejecutan sobre Ubuntu 24.04 porque el runner ubuntu-latest cambió a Ubuntu 26.04 y esa versión no tenía soporte de instalación de navegador compatible.

## D-009 · Contenido V5 independiente de la UI
14 lecciones y 40 ejercicios (20/10/10) residen en `src/content/`. Los conceptos de arreglos, matrices, funciones, procedimientos, recursividad y otros temas excluidos no se presentan como objetivos de aprendizaje.

## D-010 · Gramática restringida, sin evaluación dinámica
El parser de expresiones y el intérprete manejan solo operadores y estructuras explícitos del pseudocódigo educativo. Nunca ejecutar pseudocódigo como JavaScript; no usar `eval` ni `new Function`.

## D-011 · Snapshots como contrato de sincronización
Cada evento guarda variables, salida, nodo y línea, ruta lógica, cambios y contexto de iteración. La línea de tiempo navega esos snapshots sin volver a ejecutar estados previos; diagramas y paneles derivan del evento seleccionado.

## D-012 · Constructor compila al motor común
El M4 debe traducir los diagramas creados al pseudocódigo restringido de M3 y usar `executePseudocode`. No implementar un intérprete paralelo.

## D-013 · Constructor mediante flujo estructurado
El constructor utiliza una secuencia ordenada con ramas V/F y cuerpos de ciclo anidados. Las conexiones secuenciales se derivan del orden y la anidación; el compilador genera una sola gramática que consume el parser/intérprete de M3. No se crea un segundo motor. Este modelo impide aristas huérfanas por diseño, aunque no ofrece aún cableado libre entre puertos.

## D-014 · Laboratorio consume snapshots del simulador
La predicción, tabla, reconocimiento de símbolo y contexto visual leen la traza compartida. La actividad ¿Y si...? ejecuta una copia independiente y compara los resultados finales, sin mutar el recorrido base.

## D-015 · Oráculo independiente para validar el catálogo
Los resultados esperados se contrastan con cálculos de referencia por ejercicio, independientes del pseudocódigo y del intérprete. La batería se ejecuta dentro de CI junto con las pruebas de parser, UI y constructor.
