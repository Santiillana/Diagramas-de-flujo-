# Traza — laboratorio visual de diagramas de flujo

Plataforma educativa estática, modular y compatible con GitHub Pages, construida sobre el documento maestro V5 y preservando el prototipo original.

## Estado de los cinco módulos

| Módulo | Estado |
|---|---|
| 1. Auditoría, arquitectura y experiencia visual | Aceptado e integrado en `main` |
| 2. Aprende y catálogo de 40 ejercicios | Contenido integrado; el modo reto y el oráculo independiente quedan incluidos en esta línea de trabajo |
| 3. Parser, intérprete, diagramas y simulador | Aceptado e integrado en `main` |
| 4. Laboratorio y constructor gráfico | Implementado y validado en rama; PR de integración pendiente |
| 5. Integración, auditoría y publicación | En curso |

## Ejecutar en local

Requiere Python 3:
```bash
python3 -m http.server 8000
```
Abre http://localhost:8000. El proyecto utiliza módulos ES y debe ejecutarse desde un servidor HTTP.

## Pruebas

Requiere Node.js 22 o superior:
```bash
npm install
npm test
npx playwright install chromium
npm run test:browser
```
La CI utiliza Ubuntu 24.04, Node 22 y Chromium. El workflow ejecuta pruebas estructurales, de contenido, motor, oráculo matemático independiente y aceptación de navegador.

## Espacios

### Aprende
14 lecciones cortas y progresivas. Cada una incluye objetivo, explicación intuitiva, definición técnica, visualización controlada por pasos, ejemplo, manipulación de datos y comprobación.

### Ejercicios
40 ejercicios oficiales, distribuidos exactamente en 20 básicos, 10 intermedios y 10 avanzados. Las fichas incluyen enunciado, objetivo, conceptos, entradas, salidas, restricciones, análisis, método(s), pseudocódigo, ejemplos, casos de prueba y errores frecuentes. El modo reto permite escribir el análisis, pedir pistas y revelar voluntariamente la solución.

### Simulador
Parser restringido e intérprete seguro para la gramática del prototipo: `leer`, `imp`, asignación, `si/sino/fin`, `para`, `mientras` y `hacer/hm`. No usa `eval` ni `new Function`.

Cada evento conserva una instantánea del estado. El pseudocódigo, SVG, ruta V/F, escena, variables, salida e historial se actualizan desde el mismo evento. El dock permite avanzar, retroceder, buscar un paso, reproducir y cambiar velocidad. Los datos inválidos, faltantes o los ciclos sin terminar generan errores didácticos.

### Laboratorio
Seis actividades utilizan los eventos reales del simulador:
- Predice el siguiente paso y contrasta la respuesta con el evento verdadero.
- Tabla de seguimiento con iteración, primera asignación y valor anterior → actual.
- Ordena instrucciones.
- Identifica el símbolo de la instrucción activa.
- Encuentra el error mediante contraejemplos; el conjunto también incluye un algoritmo correcto.
- ¿Y si…? ejecuta una copia independiente y compara salida, variables y rutas sin alterar la ejecución original.

El diagrama, escena y variables permanecen visibles junto a la actividad.

### Constructor
Editor de flujo estructurado con terminales fijos y paleta de entrada, proceso, salida, decisión y tres ciclos. Permite insertar, editar, mover y eliminar nodos; entrar a bloques anidados V/F y cuerpos de ciclos; validar estructura; compilar a la gramática de M3; generar SVG y ejecutar con el mismo intérprete. Las conexiones secuenciales y los retornos se derivan del orden y anidación del modelo; no existe un segundo motor de ejecución.

## Publicación con GitHub Pages

Después de integrar el trabajo final en `main`:
1. Abre **Settings → Pages**.
2. Selecciona **Deploy from a branch**.
3. Selecciona `main` y `/(root)`.
4. Guarda. La entrada del sitio es `index.html`.

La disponibilidad pública de Pages debe comprobarse en el último módulo; no se afirma un despliegue en producción hasta verificar la URL resultante.

## Arquitectura

```text
.
├── index.html
├── src/
│   ├── content/      # 14 lecciones y 40 ejercicios
│   ├── core/         # parser, intérprete, traza y compilador del constructor
│   ├── diagram/      # layout y render SVG
│   ├── ui/            # navegación, contenidos, simulador, laboratorio y builder
│   └── styles/        # tokens, componentes y vistas responsivas
├── tests/             # unitarias, de regresión y oráculo independiente
├── e2e/               # aceptación Chromium por módulo
├── docs/
└── reference/         # especificación y HTML original inmutable
```

## Continuidad
- Especificación: `docs/MASTER_SPEC.md`
- Estado y evidencia: `docs/IMPLEMENTATION_STATUS.md`
- Decisiones: `docs/DECISIONS.md`
- Auditoría del prototipo: `docs/ORIGINAL_FEATURE_AUDIT.md`
- Prototipo original inmutable: `reference/diagramas_de_flujo_original.html`
