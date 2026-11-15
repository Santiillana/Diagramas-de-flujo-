# Auditoría inicial — Traza v2

Fecha: 15 de noviembre de 2026
Repositorio: Santiillana/Diagramas-de-flujo-
Rama de trabajo: mejoras/traza-v2
Base verificada: main en d63acf146860209b2866460fbe34294b7c2d28ae

## 1. Estado real de la base

- El árbol de main contiene 64 rutas; la aplicación ya tiene cinco espacios, 40 ejercicios, 14 lecciones, parser/intérprete, SVG, simulador, seis actividades de laboratorio y constructor estructurado.
- package.json declara solo @playwright/test 1.56.1 como dependencia de desarrollo. Scripts disponibles: npm test y npm run test:browser. No existe script lint ni formatter.
- README y docs/IMPLEMENTATION_STATUS.md registran la integración de los cinco módulos y la aceptación histórica de 222 pruebas Node y 38 pruebas Chromium. La última confirmación principal consultada es d63acf; no hay ejecución de CI asociada a ese commit en la consulta de workflow runs. Por tanto, esos números son evidencia histórica del cierre anterior, no una repetición de la línea base en esta sesión.
- La rama mejoras/traza-v2 fue creada desde main. main no se ha modificado.

## 2. Matriz de equivalencia del prototipo

La auditoría funcional existente en docs/ORIGINAL_FEATURE_AUDIT.md declara migrados el diagrama SVG, rutas V/F, token, cámara automática y manual, zoom/fit, controles de traza, pseudocódigo sincronizado, variables e historial, salida, explicación de operaciones, vueltas anidadas, Predice, Tabla, Ordena, Identifica símbolo, Encuentra el error y ¿Y si…?. El constructor sigue siendo estructurado, no un editor de conexiones libres por puerto.

Comprobación de implementación actual:
- Simulador: src/ui/simulator.js, prepare en línea 50, desglose en 154, render en 189, ejecución en 249 y enlaces en 413. Usa layoutFlow y renderDiagram; la UI consume snapshots del intérprete.
- Laboratorio: src/ui/lab.js, seis modos declarados en index.html líneas 178–183; renderizadores en líneas 98, 148, 177, 206, 230 y 254.
- Constructor: src/ui/builder.js; se apoya en makeNode, validateFlow y compileFlow del módulo central, y luego executePseudocode. Mantiene secuencias y bloques anidados.
- Aprende: src/ui/content-view.js, visualMarkup en línea 36 y renderLesson en 67. Hay una plantilla común de tres etapas cuyo rótulo depende de visual.kind; no son ocho escenas reutilizables por figura.
- Lecciones: src/content/lessons.js tiene 14 entradas. tests/content.test.js exige 14.
- Ejercicios: src/content/exercises.js contiene 40 entradas, distribución 20/10/10. No se modifica.

## 3. Contrato de eventos y límites del intérprete

src/core/interpreter.js es zona protegida.
- Límites: DEFAULT_MAX_EVENTS = 2500 (línea 15) y DEFAULT_MAX_ITERATIONS = 500 (línea 16).
- executePseudocode comienza en línea 65. Emite eventos con step, type, nodeId, sourceLine, sourceText, variables, outputs, loopStack, route, condition, result, change, value, expression, message e iteration; después agrega scene.
- Tipos usados por la UI: program-start, input, assignment, output, decision, branch, loop-init, loop-condition, loop-enter, loop-update, loop-exit, program-end y error.
- Errores de seguridad: step-limit y iteration-limit. No hace falta tocar el motor para proteger la interfaz ante el límite.
- sceneFor vive dentro de src/core/interpreter.js (línea 31). Por la zona protegida, la nueva capa visual debe adaptar el evento sin modificar el intérprete.

## 4. Pruebas existentes y protección

- tests/architecture.test.js: navegación de cinco espacios, paneles del simulador, seis actividades de laboratorio, breakpoints responsive, movimiento reducido, referencia original y ausencia de eval/new Function en la capa inicial.
- tests/content.test.js: 14 lecciones, 40 ejercicios 20/10/10, estructura de fichas, métodos y casos de prueba, alcance conceptual y casos de Fibonacci/máximos/factorial.
- tests/reference-results.test.js: oráculo matemático independiente; calcula salidas de los 40 ejercicios y comprueba todos los casos de cada método. La batería exige al menos 170 escenarios.
- tests/interpreter.js, tests/parser.js, tests/exercise-execution.test.js, tests/performance.test.js y tests/ui-modules.test.js protegen el comportamiento central y la interfaz.
- Zona protegida: src/core/*, src/content/exercises.js, reference/*, .github/* y las pruebas existentes, salvo las dos excepciones expresas del documento de mejoras (conteo de lecciones y texto e2e eliminado).
- reference/diagramas_de_flujo_original.html tiene blob SHA 9f7f5a3d68d10b004e2ea306df1109906f13bc33, coincidente con el SHA consignado en docs/IMPLEMENTATION_STATUS.md. No hay un segundo archivo del prototipo original en esta sesión para hacer una comparación byte a byte independiente.

## 5. Ejercicios «De clase»

La búsqueda por título localizó:
- 22: Potencia con exponente entero no negativo.
- 23: Fibonacci: términos que no superen 40.
- 24: Encontrar el mayor de diez números.
- 28: Promedio de cinco materias, seis notas cada una.
- 39: Analizar cinco materias con seis notas: promedios, promedio general y conteo de aprobadas/reprobadas.

Los cuatro elementos pedidos parecen corresponder a 22, 23, 24 y 28; el ejercicio 39 también trata las cinco materias y las seis notas. La selección exacta entre 28 y 39 queda NO VERIFICADA hasta derivarla de los comentarios de clase originales, sin crear ni alterar ejercicios.

## 6. Auditoría tipográfica

Se examinaron las ocho hojas de src/styles/*.css. Hay 196 declaraciones con tamaño numérico px/rem/em; 156 están por debajo de 13 px:
- layout.css: 5 de 9; líneas 8, 9, 17, 23 y 24.
- components.css: 37 de 49; desde 7 px hasta 12 px en múltiples componentes.
- responsive.css: 3 de 8; líneas 23, 44 y 45.
- content.css: 40 de 49; desde 7 px hasta 12 px en listas, etiquetas, tarjetas y controles.
- simulator.css: 28 de 32; desde 7 px hasta 12 px en narración, historial, variables y controles.
- lab-builder.css: 43 de 48; desde 7 px hasta 12 px en actividades, constructor y estados.
- tokens.css: 0 de 1 bajo el umbral.
- motion.css: 0 declaraciones de font-size.

El conteo corresponde a valores numéricos explícitos; no incluye tamaños heredados ni atributos SVG. Las figuras deben auditarse también por su marcado y cajas delimitadoras durante la fase del Simulador.

## 7. Jerga localizada en la interfaz

- index.html: línea 19 contiene «ENTORNO DE APRENDIZAJE» y «BASE 01 · ARQUITECTURA».
- index.html: línea 38 contiene «V5».
- index.html: línea 111 contiene «SVG SINCRONIZADO».
- index.html: línea 144 contiene «REGISTRO DETERMINISTA».
- index.html: línea 86 contiene «CONTEXTO DEL RETO».
- index.html: línea 253 contiene «REDISEÑO V5» y una nota de transición.
- navigation.js: SPACE_META contiene encabezados «ESPACIO 01 / 05» a «ESPACIO 05 / 05».
- content-view.js añade etiquetas internas de visualización y marca «TRAZA · APRENDE».
- index.html tiene seis actividades de laboratorio, en líneas 178–183.

## 8. Discrepancias del documento de mejoras frente al repo

- Confirmado: 14 lecciones, no 17.
- Confirmado: seis modos del Laboratorio, no ocho.
- Confirmado: existe una plantilla de visualización reutilizada, no escenas independientes por figura.
- Confirmado: hay tipografía inferior a 13 px, incluidas etiquetas de 7–9 px.
- Confirmado: hay jerga de desarrollo que debe retirarse.
- Corregido: el intérprete ya tiene límites de eventos e iteraciones; no se necesita run-guard dentro del motor.
- Confirmado: el Constructor actual usa bloques estructurados y no conexiones libres por puerto; el documento no debe presentar esto como una regresión del prototipo, sino como una limitación de alcance heredada.
- La cabecera y navegación ya incluyen cinco espacios, tema y movimiento reducido; deben pulirse, no reconstruirse.

## 9. CI y antecedentes de trabajo

- .github/workflows/quality.yml ejecuta npm test y npm run test:browser en push a main y module-1/** … module-5/**; pull_request contra main también ejecuta CI. La rama mejoras/traza-v2 no está incluida en el filtro push. La comprobación de CI se hará mediante el pull request final.
- Se encontró la rama independiente instruction-2/live-lab-phase, 90 commits por delante de main. No se reutiliza: su diff modifica src/content/exercises.js, altera tests/reference-results.test.js, toca .github y agrega dependencias/archivos, contradiciendo la zona protegida.
- Su ejecución más reciente consultada fue Actions run 43669616951. La suite Node pasó, pero falló la suite de navegador con 18 pruebas fallidas. Los fallos incluyen errores de análisis del simulador, controles que no se estabilizan, expectativas de salida y zoom, y contraste positivo de 3,16:1 en tema claro.
- No se ejecutó un entorno local de Node/Playwright desde esta conexión de GitHub; no se generan capturas ficticias. Las capturas quedan pendientes de la CI del pull request.

## 10. Resultado de Fase 0

Auditoría de archivos y estructura completada con fuentes del repositorio. No se modificó código, pruebas, contenido protegido, referencia ni main. No verificado: reproducción local de las pruebas, inspección visual manual y comparación byte a byte contra un prototipo separado.
