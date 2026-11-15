# Mapa del repositorio — Traza

Base: main en d63acf146860209b2866460fbe34294b7c2d28ae. Mapa compacto; consultar este archivo antes de releer módulos.

| Ruta | Responsabilidad | Entradas / exports | Pruebas relacionadas |
|---|---|---|---|
| index.html | Shell, cinco vistas, paneles y controles | DOM semántico y data-view | architecture, e2e/module-* |
| src/app.js | Arranque | initNavigation, initPreferences, initContentViews, initSimulator, initLab, initBuilder | architecture, ui-modules |
| src/content/lessons.js | 14 lecciones | lessons | content, e2e/module-2 |
| src/content/exercises.js | Catálogo inmutable de 40 ejercicios | exercises, getExercise, validateCatalog | content, exercise-execution, reference-results |
| src/core/parser.js | Parser del pseudocódigo | parsePseudocode, flattenPseudocode | parser, execution, performance |
| src/core/expression.js | Evaluación segura de expresiones | evaluateExpression, traceExpression | expression, performance |
| src/core/interpreter.js | Ejecución determinista y snapshots | executePseudocode, createTimeline, ExecutionError | interpreter, performance, reference-results |
| src/core/flow-compiler.js | Modelo del constructor y compilación | makeNode, createFlowPreset, validateFlow, compileFlow | flow-compiler |
| src/diagram/layout.js | Layout derivado del AST | layoutFlow | renderer, simulator browser |
| src/diagram/renderer.js | SVG y resaltado | renderDiagram, highlightDiagram | ui-modules, e2e/module-3 |
| src/ui/navigation.js | Cambio entre espacios | initNavigation | architecture, e2e/module-1 |
| src/ui/preferences.js | Tema y movimiento reducido | initPreferences | architecture, e2e/module-1 |
| src/ui/content-view.js | Aprende y Ejercicios | initContentViews | content, ui-modules, e2e/module-2 |
| src/ui/simulator.js | Simulador, timeline, cámara, variables | initSimulator; eventos traza:* | e2e/module-3, performance |
| src/ui/lab.js | Seis actividades conectadas a la traza | initLab; evento traza:execution-updated | e2e/module-4 |
| src/ui/builder.js | Constructor estructurado | initBuilder; compileFlow y executePseudocode | flow-compiler, e2e/module-4 |
| src/styles/tokens.css | Tokens y temas | variables CSS | e2e/module-1, visual |
| src/styles/layout.css | Shell y disposición general | selectores de layout | e2e/module-1 |
| src/styles/components.css | Componentes compartidos | componentes visuales | e2e/module-1 |
| src/styles/motion.css | Animaciones y reduced motion | transiciones CSS | architecture |
| src/styles/responsive.css | Breakpoints | 1080, 760 y 440 px | architecture, e2e |
| src/styles/content.css | Aprende y catálogo | vistas de contenido | e2e/module-2 |
| src/styles/simulator.css | Simulador | paneles, SVG y dock | e2e/module-3 |
| src/styles/lab-builder.css | Laboratorio y constructor | actividades, canvas e inspector | e2e/module-4 |
| tests/architecture.test.js | Contratos de arquitectura y UI | node:test | npm test |
| tests/content.test.js | Conteo y estructura didáctica | node:test | npm test |
| tests/reference-results.test.js | Oráculo matemático independiente | 40 ejercicios, todos los métodos/casos | npm test |
| tests/parser.test.js, expression.test.js, interpreter.test.js | Comportamiento del motor | node:test | npm test |
| tests/performance.test.js | Límites de rendimiento | node:test | npm test |
| tests/flow-compiler.test.js, exercise-execution.test.js, ui-modules.test.js | Constructor, ejecución y módulos UI | node:test | npm test |
| e2e/module-1.spec.js … module-5.spec.js | Aceptación Chromium por módulo | Playwright | npm run test:browser |
| e2e/diagnostics.spec.js | Diagnóstico transversal | Playwright | npm run test:browser |
| reference/diagramas_de_flujo_original.html | Prototipo preservado; solo lectura | blob SHA verificado | architecture |
| .github/workflows/quality.yml | CI Node + Chromium | push filtrado y pull_request a main | GitHub Actions |
