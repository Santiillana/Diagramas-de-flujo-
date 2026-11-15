# Checklist de paridad con el prototipo original

**Fuente inmutable:** `reference/diagramas_de_flujo_original.html`  
**Auditoría base:** `docs/ORIGINAL_FEATURE_AUDIT.md`  
**Regla:** una capacidad solo se marca como migrada si tiene prueba o evidencia identificable. La conservación del HTML original no cuenta como migración.

## Matriz de funciones del original

| Función | Referencia del original | Implementación en Traza | Estado documentado |
|---|---|---|---|
| Selector numerado de 40 ejercicios | `#ch` | Catálogo filtrable de 40 fichas 20/10/10 | Migrada |
| Puerta de reto antes de revelar | `#gt`, `#rv` | Modo reto con análisis, pistas y revelado voluntario | Migrada |
| Enunciado/contexto | `#info` | Panel Problema con entradas, salidas, restricciones y método | Migrada |
| Métodos alternativos | `#tabs`, `load` | Selector de método en ficha y simulador | Migrada |
| Diagrama SVG | `#sv`, `draw`, `buildG` | SVG generado desde AST del parser | Migrada |
| Símbolos terminal/entrada/proceso/salida/decisión | SVG original | Símbolos SVG con estilos semánticos | Migrada |
| Flechas, rutas y etiquetas V/F | `route`, conectores y rótulos | Rutas derivadas del AST y ruta elegida resaltada desde el evento real | Migrada |
| Token animado | `#tk`, `setTk` | Token SVG ligado al nodo activo | Migrada |
| Cámara automática | `camT`, `camKick` | Seguimiento del nodo activo | Migrada |
| Cámara manual / pan | Control en canvas | Arrastre y pausa de auto-cámara | Migrada |
| Zoom y ajuste | `fit`, controles | Zoom SVG, fit y centrado | Migrada |
| Avance/retroceso/inicio/final | `#ctl` | Dock y navegación determinista por snapshots | Migrada |
| Play/pause y velocidad | `#pl`, `#sp` | Reproducción, pausa, seis velocidades de 0,25× a 8× | Migrada |
| Timeline y salto de paso | `#sl`, `#vu` | Range y tarjetas de historial navegables | Migrada |
| Pseudocódigo resaltado | `#code` | Línea activa/recorrida ligada al evento | Migrada |
| Datos editables y restauración | `#tx`, `#rs` | Input editable y restauración del sample | Migrada |
| Escena gráfica/explicativa | `#sc`, `scene` | Panel En escena con símbolo, texto, condición, operación y ciclos | Migrada con nueva composición |
| Ventana flotante de escena | `#vf`, `showVF`, `hideVF` | Panel persistente y minimizable junto al diagrama | Sustitución intencional de UI |
| Variables actuales | `#vars` | Tabla desde el evento actual | Migrada |
| Valor anterior/nuevo y causa | Estado original / `#hist` | Transición, instrucción fuente e historial por variable | Migrada |
| Historial variable por iteración | `#hist` | Eventos filtrados por variable, paso y vuelta | Migrada |
| Salida | `#out` | Salida acumulada del snapshot | Migrada |
| Explicaciones y desglose de operaciones | `#ex`, `show` | Operandos y resultados desde el evaluador común | Migrada |
| Vueltas de ciclos anidados | Estado de escena | Stack de ciclos con nivel externo/interno y vuelta | Migrada |
| Predice | `ask`, `#qz` | Actividad compara predicción con el próximo evento real | Migrada |
| Tabla de seguimiento | `tTab` | Tabla editable; corrige contra snapshots reales y señala primera celda errónea | Migrada; prueba e2e |
| Ordena instrucciones | `oTab` | Reordena líneas y comprueba orden | Migrada |
| Identifica símbolo | `cTab` | Reconoce el símbolo asociado al nodo | Migrada |
| Encuentra el error | `eTab` | Contraejemplos ejecutados por el motor, incluido un algoritmo correcto | Migrada |
| ¿Y si…? | `mTab` | Ejecuta cambios en copia aislada y compara variables, rutas y salida | Migrada |
| Revelar solución | `#rv` | Revelado voluntario en la puerta de reto | Migrada |
| Tamaño del pseudocódigo | `#fm`, `#fp` | A− / A / A+ persistente | Migrada |
| Pantalla completa | `#fs` | Fullscreen del diagrama y control de salida | Migrada |
| Tema claro/oscuro | Variables CSS / preferencia | Tema explícito persistente | Migrada y ampliada |
| Diseño responsive | Media queries | Layout adaptativo y pestañas móviles | Migrada y ampliada |
| Movimiento reducido | `prefers-reduced-motion` | Respeta preferencia y control explícito | Migrada y ampliada |
| Laboratorio visible junto al diagrama | `#lab` | Contexto persistente con SVG, escena y variables | Migrada |
| Constructor con conexiones libres arbitrarias | Requisito adicional V5 | Constructor estructurado: secuencia, ramas V/F y cuerpos de ciclos; conectores inferidos | **Parcial / límite declarado** |

## Comprobaciones de aceptación de la Instrucción maestra 2

| Comprobación | Evidencia | Estado |
|---|---|---|
| Los 30 ejercicios del original conservan sus resultados dentro del catálogo de 40 | `tests/reference-results.test.js` | Cubierto por pruebas |
| Oráculo independiente con al menos 170 escenarios | `tests/reference-results.test.js` | Cubierto por pruebas |
| Flechas, Espacio, inicio/fin y velocidades | `e2e/simulator-controls.spec.js`, `e2e/simulator-stage.spec.js` | Cubierto por pruebas de aceptación |
| Diagrama con área libre y paneles | `e2e/simulator-stage.spec.js` | Cubierto por pruebas |
| Animaciones y visualizaciones por evento | `e2e/scene-visuals.spec.js`, `e2e/simulator-animation.spec.js` | Cubierto por pruebas |
| Aprende ejecuta los programas de las 14 lecciones en el intérprete | `tests/lesson-live.test.js`, `e2e/lesson-live.spec.js` | Cubierto por pruebas |
| Guía de figuras y conceptos | `tests/symbol-guide.test.js`, `e2e/symbol-guide.spec.js` | Cubierto por pruebas |
| Seis actividades del Laboratorio sin ejecución previa | `e2e/lab-independent.spec.js`, `tests/lab-independent.test.js` | Cubierto por pruebas |
| Razonamiento y pistas progresivas en 40 ejercicios | `tests/reasoning.test.js`, `e2e/reasoning.spec.js` | Cubierto por pruebas |
| Prueba del Constructor contra el oráculo | `src/ui/builder.js`, `src/content/reference-oracle.js`, `e2e/active-learning.spec.js` | Implementado; e2e cubre un caso de éxito y otro fallido con el primer contraejemplo y su traza. El test nuevo espera CI |
| Predicción con diagnóstico basado en errores frecuentes | `src/ui/content-view.js` | Parcial: el flujo usa el primer error frecuente de la ficha, no selecciona un diagnóstico contextual |
| Avanzar a la siguiente vuelta y salir del ciclo | `src/ui/simulator.js`, `e2e/active-learning.spec.js` | Implementado y probado |
| Tabla de seguimiento rellenable | `src/ui/lab.js`, `e2e/active-learning.spec.js` | Implementada y probada; la corrección identifica la primera diferencia |
| Progreso guardado: retos, intentos, pistas y errores repetidos | `src/ui/content-view.js`, `e2e/active-learning.spec.js` | Implementado y probado |
| Enlace compartible con ejercicio, método, datos y predicción | `src/ui/content-view.js`, `e2e/active-learning.spec.js` | Implementado y probado |
| Modo proyector | `src/ui/content-view.js`, `e2e/active-learning.spec.js` | Implementado y probado |
| Recorrido guiado de primer uso | `src/ui/content-view.js`, `e2e/active-learning.spec.js` | Parcial: hay onboarding de cuatro pasos y persistencia; falta demostrar el avance guiado real `→` en el simulador |
| Tipografía mínima 13 px, cuerpo 14 px y dock 16 px | `src/styles/polish.css`, `e2e/visual-polish.spec.js` | Cubierto por test de tamaños |
| Contraste WCAG AA en tema claro y oscuro | `e2e/visual-polish.spec.js` | Parcial: verifica contraste 4.5:1 de cuatro tokens semánticos, no todos los componentes/estados |
| Capturas de las cinco secciones en tres tamaños | `e2e/final-audit.spec.js` | Implementado; requiere revisar artefacto de la última CI |
| Consola limpia y ciclo largo de 499 vueltas | `e2e/final-audit.spec.js` | Pruebas automatizadas presentes; confirmar en CI final |
| Piloto con 3–5 personas y segunda ronda con 2 | `docs/PILOT_NOTES.md` | **Pendiente: requiere participantes humanos reales** |
| Publicación pública comprobada | URL final de GitHub Pages o Netlify | **Pendiente: abrir y verificar la URL** |

## Limitaciones que no se deben ocultar

- El Constructor sigue siendo estructurado; no es un editor de conexiones libres entre puertos.
- El diagnóstico de predicción necesita elegir el error frecuente pertinente, no repetir siempre el primero.
- El onboarding actual guía el catálogo, pero falta cerrar su integración literal con el primer paso del simulador.
- La prueba de contraste cubre tokens semánticos, no una auditoría integral axe/WCAG de la interfaz.
- El piloto humano y la verificación del despliegue no pueden darse por hechos desde CI.

## Estado de cierre

**L no está aceptada.** El checklist separa las funciones migradas de los pendientes reales. El cierre exige CI verde en esta rama y en `main`, auditoría de accesibilidad integral, revisión de capturas, ciclo largo, piloto humano y apertura de la URL pública.
