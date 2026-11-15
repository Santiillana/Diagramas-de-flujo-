# Checklist de paridad con el prototipo original

**Fuente inmutable:** `reference/diagramas_de_flujo_original.html`  
**Auditoría base:** `docs/ORIGINAL_FEATURE_AUDIT.md`  
**Regla:** una capacidad solo se marca como migrada si tiene prueba o evidencia identificable. La conservación del HTML original no cuenta como migración.

## Matriz de funciones del original

| Función | Referencia del original | Implementación en Traza | Estado documentado |
|---|---|---|---|
| Selector numerado de 40 ejercicios | `#ch` | Catálogo filtrable de 40 fichas 20/10/10 | Migrada |
| Puerta de reto antes de revelar | `#gt`, `#rv` | Modo reto en ficha: análisis, proceso, pistas y revelado voluntario | Migrada |
| Enunciado/contexto | `#info` | Panel Problema; entradas, salidas, restricciones y método | Migrada |
| Métodos alternativos | `#tabs`, `load` | Selector de método en ficha y simulador | Migrada |
| Diagrama SVG | `#sv`, `draw`, `buildG` | SVG generado desde AST del parser | Migrada |
| Símbolos terminal/entrada/proceso/salida/decisión | SVG original | Símbolos SVG con estilos semánticos | Migrada |
| Flechas, rutas y etiquetas V/F | `route`, conectores y rótulos | Rutas derivadas del AST; ruta elegida resaltada desde el evento real | Migrada |
| Token animado | `#tk`, `setTk` | Token SVG ligado al nodo activo; transición desactivable por reduced motion | Migrada |
| Cámara automática | `camT`, `camKick` | Seguimiento del nodo activo mediante transformación de canvas | Migrada |
| Cámara manual / pan | control en canvas | Arrastre desplaza el mismo canvas y desactiva auto-cámara | Migrada |
| Zoom y ajuste | `fit`, controles | Zoom por escala SVG y fit calculado desde viewBox | Migrada |
| Avance/retroceso/inicio/final | `#ctl` | Dock del simulador y navegación determinista por snapshots | Migrada |
| Play/pause y velocidad | `#pl`, `#sp` | Reproducción, pausa y cuatro velocidades | Migrada |
| Timeline y salto de paso | `#sl`, `#vu` | Range y tarjetas de historial navegables | Migrada |
| Pseudocódigo resaltado | `#code` | Línea activa/recorrida ligada al sourceLine del evento | Migrada |
| Datos editables y restauración | `#tx`, `#rs` | Input editable y botón de restauración del sample del método | Migrada |
| Escena gráfica/explicativa | `#sc`, `scene` | Panel En escena con símbolo, texto, condición, operación y contexto de ciclos | Migrada con nueva composición |
| Ventana flotante de escena | `#vf`, `showVF`, `hideVF` | Panel persistente junto al diagrama; puede minimizarse, no flota sobre el lienzo | Sustitución intencional de UI |
| Variables actuales | `#vars` | Tabla de variables desde el evento actual | Migrada |
| Valor anterior/nuevo y causa | estado original / `#hist` | Transición, instrucción fuente e historial por variable | Migrada |
| Historial variable por iteración | `#hist` | Eventos filtrados por variable con número de paso y vuelta | Migrada |
| Salida | `#out` | Salida acumulada del snapshot | Migrada |
| Explicaciones y desglose de operaciones | `#ex`, `show` | traceExpression con operandos y resultados desde el evaluador común | Migrada |
| Vueltas de ciclos anidados | estado de escena | Stack de loops con nivel externo/interno y vuelta | Migrada |
| Predice | `ask`, `#qz` | Actividad compara predicción con el próximo evento verdadero | Migrada |
| Tabla de seguimiento | `tTab` | Tabla de snapshots, cambios, salida y contexto de iteración | Migrada |
| Ordena instrucciones | `oTab` | Reordena las líneas del método y comprueba el orden | Migrada |
| Identifica símbolo | `cTab` | Reconoce el símbolo asociado al nodo de ejecución actual | Migrada |
| Encuentra el error | `eTab` | Contraejemplos ejecutados por el motor; incluye un algoritmo correcto | Migrada |
| ¿Y si…? | `mTab` | Ejecuta código/datos cambiados en una copia aislada y compara estado final | Migrada |
| Revelar solución | `#rv` | Revelado voluntario en la puerta de reto | Migrada |
| Tamaño del pseudocódigo | `#fm`, `#fp` | A− / A / A+ persistente entre recargas | Migrada |
| Pantalla completa | `#fs` | Fullscreen del lienzo y botón de salida dentro del fullscreen | Migrada |
| Tema claro/oscuro | variables CSS / preferencia | Tema explícito persistente | Migrada y ampliada |
| Diseño responsive | media queries | Layout adaptativo; tabs móviles para seis paneles del simulador | Migrada y ampliada |
| Movimiento reducido | `prefers-reduced-motion` | Respeta media query y control de motion; anima token/rutas solo cuando corresponde | Migrada y ampliada |
| Laboratorio visible junto al diagrama | `#lab` | Contexto persistente con SVG, escena y variables; la actividad queda al costado/abajo | Migrada |
| Constructor completo con conectar flechas arbitrariamente | No está en el prototipo original; requisito nuevo V5 | Constructor estructurado: secuencia, ramas V/F y cuerpos de ciclos; flechas inferidas por orden/anidación | **Parcial / limitación declarada** |

## Comprobaciones de aceptación de la Instrucción Maestra 2

| Comprobación | Evidencia automatizada o documental | Estado |
|---|---|---|
| Los 30 ejercicios del original están representados en el catálogo ampliado de 40 y conservan sus resultados esperados | `tests/reference-results.test.js` compara cálculos independientes | Documentado; requiere conservar CI verde |
| Oráculo independiente con al menos 170 escenarios | `tests/reference-results.test.js` exige 170 o más | Documentado |
| Flechas, Espacio, inicio/fin y velocidad del simulador | `e2e/module-5.spec.js`, `e2e/simulator-stage.spec.js` | Cubierto por pruebas existentes |
| Diagrama con área libre y paneles flotantes | `e2e/simulator-stage.spec.js` | Cubierto por pruebas existentes |
| Animaciones y visualizaciones por evento | `e2e/scene-visuals.spec.js`, `e2e/module-5.spec.js` | Cubierto por pruebas existentes |
| Aprende ejecuta los programas de las 14 lecciones en el intérprete | `tests/lesson-live.test.js`, `e2e/lesson-live.spec.js` | Cubierto por pruebas existentes |
| Guía de figuras y conceptos | `tests/symbol-guide.test.js`, `e2e/symbol-guide.spec.js` | Cubierto por pruebas existentes |
| Seis actividades del Laboratorio disponibles sin ejecución previa | `e2e/lab-independent.spec.js`, `tests/lab-independent.test.js` | Cubierto por pruebas existentes |
| Razonamiento y pistas progresivas en los 40 ejercicios | `tests/reasoning.test.js`, `e2e/reasoning.spec.js` | Cubierto por pruebas existentes |
| Prueba de solución contra el oráculo completo desde el Constructor | Debe existir flujo de validación de solución del alumno contra el oráculo de 170 escenarios | **Pendiente de implementación y prueba e2e** |
| Predicción con diagnóstico basado en errores frecuentes del ejercicio | `src/ui/content-view.js` compara predicción, intérprete y caso de referencia; debe comprobarse que use los errores frecuentes de cada ficha | **Parcial** |
| Avanzar a la siguiente vuelta y salir del ciclo | `src/ui/simulator.js`; `e2e/active-learning.spec.js` | Implementado; CI final de la rama pendiente |
| Tabla de seguimiento rellenable y corregida contra la traza | `src/ui/lab.js` muestra snapshots de solo lectura | **Pendiente de completar como actividad editable** |
| Progreso guardado: retos, intentos y estado | `src/ui/content-view.js`; `e2e/active-learning.spec.js` | Implementado para estado/intententos; errores repetidos y uso de pistas requieren ampliar |
| Enlace compartible con ejercicio y método | `src/ui/content-view.js`; `e2e/active-learning.spec.js` | Implementado; el enlace actual no serializa los datos editados |
| Modo proyector | `src/ui/content-view.js`; `e2e/active-learning.spec.js` | Implementado |
| Recorrido guiado de primer uso de 30 segundos | Debe existir onboarding interactivo que guíe el primer paso | **Pendiente de verificar/implementar** |
| Tipografía mínima 13 px, cuerpo 14 px y dock 16 px | `src/styles/polish.css`, `e2e/visual-polish.spec.js` | Implementación en validación; no aceptar hasta CI verde |
| Contraste WCAG AA en tema claro y oscuro | Tokens revisados en `src/styles/polish.css`; falta medición automatizada axe/contraste | **Pendiente de auditoría objetiva** |
| Capturas de Aprende, Ejercicios, Simulador, Laboratorio y Constructor en tres tamaños | `e2e/module-5.spec.js` y artefactos de CI | Capturas automatizadas existentes; falta revisar la nueva apariencia tras K |
| Consola limpia y ciclos largos cerca de 500 iteraciones | Debe quedar cubierto por una prueba de navegador/rendimiento y captura de consola | **Pendiente de verificación final** |
| Piloto con 3–5 personas y segunda ronda con 2 | `docs/PILOT_NOTES.md` | **Pendiente: requiere participantes humanos** |
| Publicación pública comprobada | Abrir y verificar la URL final de Netlify/GitHub Pages | **Pendiente: no afirmar despliegue hasta abrir la URL** |

## Limitaciones que no se deben ocultar

- El Constructor sigue siendo estructurado; no es un editor de conexiones libres entre puertos.
- La tabla del Laboratorio refleja la traza real, pero todavía no es una tabla de seguimiento rellenable por el estudiante.
- El enlace compartible identifica ejercicio y método, pero aún no incluye datos editados.
- El piloto con estudiantes y la verificación del despliegue no pueden darse por hechos desde CI.

## Estado de cierre

**L no está aceptada.** Este checklist deja separados los aspectos migrados, los parciales y los pendientes. El cierre exige CI verde en esta rama y en `main`, auditoría de accesibilidad, revisión de capturas, ciclos largos, piloto humano y apertura de la URL pública.
