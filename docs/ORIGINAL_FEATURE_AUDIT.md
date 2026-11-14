# Auditoría funcional del prototipo original

Fuente: archivo adjunto \`diagramas_de_flujo.html\`, conservado sin edición en \`reference/diagramas_de_flujo_original.html\`.

## Evidencia estructural observada

El prototipo es una aplicación autocontenida HTML/CSS/JavaScript. Su interfaz incluye selector de ejercicios, contexto y pseudocódigo, lienzo SVG, panel de escena, variables e historial, salida, barra de ejecución, pantalla inicial y laboratorio. El script contiene funciones de parsing/ejecución, construcción del diagrama, seguimiento de pasos, cámara, animación y actividades.

IDs relevantes: \`#ch\`, \`#gt\`, \`#info\`, \`#tabs\`, \`#code\`, \`#tx\`, \`#rs\`, \`#sv\`, \`#sc\`, \`#vars\`, \`#hist\`, \`#out\`, \`#dock\`, \`#ctl\`, \`#sl\`, \`#vf\`, \`#qz\` y \`#lab\`.

Funciones relevantes detectadas: \`parse\`, \`exec\`, \`run\`, \`draw\`, \`load\`, \`buildG\`, \`route\`, \`setTk\`, \`camT\`, \`fit\`, \`scene\`, \`showVF\`, \`ask\`, \`tTab\`, \`oTab\`, \`cTab\`, \`eTab\`, \`mTab\` y \`lab\`.

## Correspondencia con el inventario

| Capacidad | Evidencia HTML | Estado durante Módulo 1 |
|---|---|---|
| Selector numerado de ejercicios | \`#ch\` | Preservado en el prototipo original; migración pendiente |
| Reto antes de revelar | \`#gt\`, \`#rv\` | Preservado en el prototipo original; migración pendiente |
| Enunciado y contexto | \`#info\` | Preservado en el prototipo original; migración pendiente |
| Métodos alternativos | \`#tabs\`, \`load\` | Preservado en el prototipo original; migración pendiente |
| Diagrama SVG dinámico | \`#sv\`, \`draw\`, \`buildG\` | Preservado en el prototipo original; migración pendiente |
| Flechas, rutas y recorrido | \`route\`, \`setTk\`, \`#tk\` | Preservado en el prototipo original; migración pendiente |
| Cámara y ajuste de lienzo | \`camT\`, \`fit\` | Preservado en el prototipo original; migración pendiente |
| Ejecución, pausa y pasos | \`#ctl\`, \`#b0\`, \`#bp\`, \`#pl\`, \`#bn\`, \`#b9\` | Preservado en el prototipo original; migración pendiente |
| Velocidad y línea de tiempo | \`#sp\`, \`#sl\`, \`#vu\` | Preservado en el prototipo original; migración pendiente |
| Pseudocódigo resaltado | \`#code\` | Preservado en el prototipo original; migración pendiente |
| Datos editables y restauración | \`#tx\`, \`#rs\` | Preservado en el prototipo original; migración pendiente |
| Escena explicativa | \`#sc\`, \`scene\` | Preservado en el prototipo original; migración pendiente |
| Variables e historial | \`#vars\`, \`#hist\` | Preservado en el prototipo original; migración pendiente |
| Resultados de salida | \`#out\` | Preservado en el prototipo original; migración pendiente |
| Explicaciones y operaciones | \`#ex\`, \`show\` | Preservado en el prototipo original; migración pendiente |
| Predicción de pasos | \`#qz\`, \`ask\` | Preservado en el prototipo original; migración pendiente |
| Tabla de seguimiento y actividades | \`#lab\`, \`tTab\`, \`oTab\`, \`cTab\`, \`eTab\`, \`mTab\`, \`lab\` | Preservado en el prototipo original; migración pendiente |
| Ordenar, identificar, detectar error y “¿Y si…?” | paneles del laboratorio | Preservado en el prototipo original; migración pendiente |
| Revelar solución | \`#rv\` | Preservado en el prototipo original; migración pendiente |
| Tamaño de texto | \`#fm\`, \`#fp\` | Preservado en el prototipo original; migración pendiente |
| Pantalla completa | \`#fs\` | Preservado en el prototipo original; migración pendiente |
| Tema claro/oscuro | variables CSS y \`prefers-color-scheme\` | El original permanece accesible; la nueva shell añade control explícito |
| Diseño adaptable | media queries | El original permanece accesible; responsive nuevo diseñado |
| Movimiento reducido | \`prefers-reduced-motion\` | Preservado en el original; la nueva shell añade control explícito |

## Criterio de continuidad

- El HTML original se conserva íntegro y separado del nuevo punto de entrada.
- La nueva aplicación enlaza el prototipo original para no dejar inaccesible su experiencia mientras se construyen equivalentes.
- La nueva interfaz no afirma que los controles preparados ya ejecuten algoritmos.
- Una capacidad solo pasará a “migrada” cuando exista una implementación nueva y una prueba de equivalencia documentada.
- El número, contenido y validez de los ejercicios se auditarán en el Módulo 2; esta tabla no certifica el catálogo.
