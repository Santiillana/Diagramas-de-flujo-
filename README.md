# Traza — laboratorio visual de diagramas de flujo

Plataforma educativa modular basada en la especificación maestra V5 y en el prototipo original preservado en `reference/`.

## Estado de los cinco módulos

| Módulo | Estado | Evidencia |
|---|---|---|
| 1. Arquitectura y experiencia visual | Aceptado e integrado en `main` | 7/7 Node + 7/7 Chromium en aceptación inicial |
| 2. Aprende y 40 ejercicios | Aceptado e integrado; correcciones del contenido consolidadas | 14 lecciones, 40 ejercicios (20/10/10), oráculo de 170 escenarios |
| 3. Parser, intérprete, diagramas y simulador | Aceptado e integrado en `main` | 31/31 Node + 16/16 Chromium |
| 4. Laboratorio y constructor | Aceptado e integrado en `main` | 216/216 Node + 28/28 Chromium |
| 5. Integración y auditoría final | Implementado y validado; PR #6 abierto y en validación | 222/222 Node + 38/38 Chromium en push; checks PR en ejecución |

La rama actual es `module-5/final-audit-release`. No se debe afirmar que M5 está integrado en `main` hasta que se fusione su PR.

## Ejecutar en local

Requiere Python 3:
```bash
python3 -m http.server 8000
```
Abre http://localhost:8000. Los módulos ES se sirven por HTTP.

## Pruebas

Requiere Node.js 22 o superior:
```bash
npm install
npm test
npx playwright install chromium
npm run test:browser
```

La CI utiliza Ubuntu 24.04, Node 22 y Chromium. El pipeline ejecuta pruebas de arquitectura, contenido, parser/intérprete, constructor, oráculo independiente y aceptación real de navegador.

## Los cinco espacios

### 1. Aprende
14 lecciones progresivas. Cada lección incluye objetivo, explicación intuitiva y técnica, ejemplo visual por pasos, manipulación de datos y comprobación de comprensión.

### 2. Ejercicios
40 ejercicios: 20 básicos, 10 intermedios y 10 avanzados. Las fichas incluyen enunciado, objetivos, conceptos, entradas, salidas, restricciones, análisis, métodos, pseudocódigo, casos de prueba y errores frecuentes. El modo reto permite registrar análisis y proceso, pedir pistas y revelar voluntariamente la solución.

### 3. Simulador
Parser e intérprete seguros para la gramática del prototipo: `leer`, `imp`, asignación, `si/sino/fin`, `para`, `mientras` y `hacer/hm`. No ejecuta texto como JavaScript: no usa `eval` ni `new Function`.

Una única traza determinista alimenta pseudocódigo resaltado, SVG, ruta V/F, token, escena, desglose de operaciones, variables, historial, salida y timeline. El simulador incluye avance, retroceso, reproducción, velocidad, cámara automática/manual, pan, zoom, ajustar, fullscreen, restauración de datos de ejemplo, tamaño de pseudocódigo persistente e historial por variable. En móvil dispone de pestañas para Problema, Diagrama, En escena, Variables, Salida e Historial; la traza no se reinicia al cambiar de vista.

### 4. Laboratorio
Seis actividades conectadas a la ejecución real: Predice, Tabla, Ordena, Identifica símbolo, Encuentra el error y ¿Y si…?. Las actividades usan la traza compartida, mantienen visible el contexto y ejecutan los experimentos en una copia independiente para no alterar la ejecución base.

### 5. Constructor
Constructor de diagramas estructurado con Inicio/Fin, Entrada, Proceso, Salida, Decisión V/F y ciclos Para, Mientras y Hacer–Mientras. Permite insertar, editar, mover, eliminar y anidar instrucciones; validar; compilar a la gramática M3; generar SVG y ejecutar en el mismo intérprete.

**Límite conocido del constructor:** es un editor estructurado por secuencia y bloques anidados. Las flechas secuenciales, ramas y retornos se derivan de la estructura. No es todavía un editor libre en el que el alumno arrastre cualquier puerto y conecte manualmente cualquier nodo. Esa diferencia está documentada; no se presenta como una capacidad terminada.

## Publicación en GitHub Pages

El proyecto es estático y compatible con Pages, sin proceso de build. Para publicar: **Settings → Pages → Deploy from a branch → main → /(root)**. El endpoint público no pudo verificarse desde esta ejecución; por eso no se afirma que Pages esté activo ni se inventa una URL publicada.

## Arquitectura

```text
.
├── index.html
├── src/
│   ├── content/      # lecciones y catálogo de ejercicios
│   ├── core/         # expresiones, parser, intérprete y compilador
│   ├── diagram/      # layout y render SVG
│   ├── ui/            # navegación, contenido, simulador, laboratorio y builder
│   └── styles/        # tokens, componentes y vistas responsive
├── tests/             # unitarias, regresiones y oráculo independiente
├── e2e/               # aceptación Chromium por módulo
├── docs/
└── reference/         # especificación y HTML original inmutable
```

## Documentación del proyecto
- Especificación: `docs/MASTER_SPEC.md`
- Estado y evidencia: `docs/IMPLEMENTATION_STATUS.md`
- Decisiones: `docs/DECISIONS.md`
- Equivalencia funcional: `docs/ORIGINAL_FEATURE_AUDIT.md`
- Aceptación final: `docs/FINAL_ACCEPTANCE.md`
- HTML original inmutable: `reference/diagramas_de_flujo_original.html`
