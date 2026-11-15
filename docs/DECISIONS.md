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


## D-021 · La referencia original es la autoridad visual del Simulador
Para la vista Simulador, la composición de tarjetas y el dock en una fila del grid quedan sustituidos por la composición inmersiva de la referencia original: barra de 54 px, lienzo de viewport, paneles de vidrio laterales y dock flotante. La navegación global 01–05 y el resto de espacios se conservan. Esta decisión prevalece sobre D-005 para el Simulador porque la solicitud de rediseño especifica esa paridad visual; el dock debe permanecer por encima del escenario y no consumir una fila del layout.

## D-022 · Motor y SVG de una sola construcción
El intérprete y `src/core/*` no se modifican. El SVG sigue construyéndose al preparar un ejercicio; el avance actualiza clases y snapshots mediante `highlightDiagram()`. Las nuevas capas de cámara, rutas, paneles y animación consumen los mismos eventos y no vuelven a ejecutar el pseudocódigo.

## D-023 · Tokens del Simulador aislados y alineados con la referencia
El Simulador utiliza los valores cromáticos de la referencia y el tamaño base de 17 px en escritorio / 15 px en móvil, con rango de 13–26 px. Los nuevos alias quedan limitados al contexto del Simulador para no cambiar Aprende, Ejercicios, Laboratorio ni Constructor. Tema oscuro como valor inicial; el interruptor existente sigue controlando el tema.

## D-024 · La geometría de referencia se mide, no se codifica en la prueba
La aceptación compara bounding boxes del HTML original y del Simulador a 1920×1080. Las medidas de referencia se leen durante la ejecución de Playwright; no se duplican como fixtures fijos. Criterio máximo de diferencia: 6 px por elemento.

## D-025 · Despliegue separado de revisión
Los cambios se publican únicamente en `mejoras/traza-v2` y se mantienen en la PR #7. No se actualiza `main` ni se fusiona la PR. La disponibilidad del preview de Cloudflare se configura externamente y no se presume desde GitHub.

## D-026 · Cámara como transformación única del mundo
El SVG mantiene sus dimensiones base tras prepararse el ejercicio. Desplazamiento y zoom se aplican juntos en una única transformación de #flow-diagram-container; no se utiliza scroll para navegar el diagrama. El zoom conserva el punto bajo el cursor y los gestos de puntero usan captura para evitar saltos al salir del área.
## D-027 · Encuadre según el espacio disponible
La cámara automática calcula el rectángulo libre entre barra superior, paneles visibles y dock. El minimapa refleja la zona visible y permite desplazar la cámara con clic o arrastre. Una manipulación manual pausa el seguimiento y muestra el control «Seguir el proceso».

## D-028 · Ventanas satélite con estado independiente
Problema, Tus datos, Pseudocódigo, En escena, Variables, Pantalla e Historial son ventanas separadas con identidad cromática, controles para minimizar y fijar, y un rail para restaurarlas. El estado minimizado/fijado se guarda de forma tolerante a fallos en localStorage; en tablet se minimizan automáticamente las ventanas izquierdas que no estén fijadas.
## D-029 · Ventana contextual ligada a la figura
La explicación breve de cada evento se ancla al nodo activo y prueba cuatro posiciones (derecha, izquierda, arriba y abajo). Se rechazan ubicaciones que se crucen con la figura, flechas, etiquetas de rama, paneles o dock; cuando no existe una posición limpia se usa una conexión de apoyo.

## D-030 · Rutas y rastro derivados de conectores del SVG
El grafo de navegación se construye a partir de las aristas generadas por layoutFlow y sus paths SVG. Dijkstra selecciona la ruta de coste geométrico mínimo; los vértices del rastro se muestrean desde el atributo d real del conector. Si el navegador no ofrece métricas SVG, el fallback reproduce la misma geometría del renderer (secuencia, rama V/F o retorno), sin inventar una trayectoria ni modificar el intérprete.
## D-031 · Coreografía cancelable sobre snapshots
Los pasos manuales y la reproducción automática adaptan el evento de snapshot ya existente. Leer y las asignaciones vuelan hacia la variable afectada; Imprimir vuela hacia la nueva salida. Cada movimiento cancela RAF y temporizadores anteriores antes de iniciar otro. La preferencia de movimiento reducido elimina vuelos y pulsos animados, manteniendo el resaltado del destino.

## D-032 · No cubrir la decisión ni las ramas V/F
En los eventos de decisión, rama y condición de ciclo, la explicación permanece en el panel persistente En escena. La ventana flotante se oculta y el cable guía conecta el rombo con ese panel; las burbujas flotantes se reservan a los eventos secuenciales cuando existe un rectángulo libre. Esto prioriza la visibilidad de las ramas y sus etiquetas en los momentos de mayor densidad gráfica.
