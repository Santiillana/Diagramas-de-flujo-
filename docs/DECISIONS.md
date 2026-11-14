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

## D-016 · Pan y cámara comparten un único desplazamiento
El auto-seguimiento centra el nodo activo y el gesto manual desplaza el lienzo mediante una transformación del mismo contenedor. Al tocar/arrastrar o hacer zoom manual se desactiva el seguimiento automático; la vista fit restablece el desplazamiento.

## D-017 · Vistas de simulador móviles
En pantallas pequeñas se navega con pestañas Problema, Diagrama, En escena, Variables, Salida e Historial. La pestaña cambia solo la superficie visible; no vuelve a ejecutar ni reinicia la traza.

## D-018 · Estado de escena colapsable
La explicación “En escena” puede minimizarse y expandirse sin afectar el estado del simulador. El estado de loop muestra el nivel exterior y el interno, cuando corresponda.

## D-019 · Desglose de expresiones desde AST
El desglose de cada operación utiliza el mismo evaluador de expresiones y el snapshot anterior/actual del intérprete. No se mantiene un cálculo visual independiente.

## D-020 · El límite de Pages se declara, no se presume
El proyecto estático es compatible con GitHub Pages, pero un merge no demuestra por sí mismo que Pages esté activado. La URL pública y la configuración de despliegue deben comprobarse tras configurar Settings → Pages.


## D-021 · Las animaciones siguen eventos y conectores reales
La ficha de recorrido se anima únicamente entre el nodo anterior y el actual de la traza del intérprete. La ruta se resuelve desde la arista SVG existente; los datos de variable, condición, rama y vuelta provienen del evento. La velocidad solo escala la duración visual, no modifica la ejecución. En movimiento reducido se conserva el estado semántico sin desplazamiento; apagado elimina las animaciones no esenciales.


## D-022 · Cámara amortiguada y zoom focal
El seguimiento automático interpola el desplazamiento del mismo canvas mediante amortiguación exponencial por fotograma. Los gestos manuales (arrastre, rueda y pellizco) detienen el auto-seguimiento hasta reactivarlo. El zoom anclado conserva el punto bajo el cursor o el centro entre punteros. En fullscreen, el ajuste se calcula sobre el rectángulo de viewport y el control de salida permanece dentro del escenario.
