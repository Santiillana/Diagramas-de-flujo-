# Traza — laboratorio visual de diagramas de flujo

Plataforma educativa modular basada en la especificación maestra V5 y en el prototipo original preservado en `reference/`.

## Estado de los cinco módulos

| Módulo | Estado | Evidencia |
|---|---|---|
| 1. Arquitectura y experiencia visual | Aceptado e integrado en `main` | 7/7 Node + 7/7 Chromium en aceptación inicial |
| 2. Aprende y 45 ejercicios | Aceptado e integrado; correcciones del contenido consolidadas | 17 lecciones, 45 ejercicios (20/10/10/5), oráculo de 170 escenarios |
| 3. Parser, intérprete, diagramas y simulador | Aceptado e integrado en `main` | 31/31 Node + 16/16 Chromium |
| 4. Laboratorio y constructor | Aceptado e integrado en `main` | 216/216 Node + 28/28 Chromium |
| 5. Integración y auditoría final | Aceptado e integrado en `main` (PR #6) | 222/222 Node + 38/38 Chromium en CI de `main` |

La base estable conserva los cinco módulos integrados en `main`. La rama `mejoras/traza-v2` contiene una ampliación pendiente de validación y no está fusionada. GitHub Pages requiere activar su Source en Settings antes de publicar.

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
17 lecciones progresivas. Cada lección incluye objetivo, explicación intuitiva y técnica, ejemplo visual por pasos, manipulación de datos y comprobación de comprensión.

### 2. Ejercicios
45 ejercicios: 20 básicos, 10 intermedios, 10 avanzados y 5 expertos. Incluye cinco retos de matemáticas y algoritmos numéricos de dificultad alta. Las fichas incluyen enunciado, objetivos, conceptos, entradas, salidas, restricciones, análisis, métodos, pseudocódigo, casos de prueba y errores frecuentes. El modo reto permite registrar análisis y proceso, pedir pistas y revelar voluntariamente la solución.

### 3. Simulador
Parser e intérprete seguros para la gramática del prototipo: `leer`, `imp`, asignación, `si/sino/fin`, `para`, `mientras` y `hacer/hm`. No ejecuta texto como JavaScript: no usa `eval` ni `new Function`.

Una única traza determinista alimenta pseudocódigo resaltado, SVG, ruta V/F, token, escena, desglose de operaciones, variables, historial, salida y timeline. El simulador incluye avance, retroceso, reproducción, velocidad, cámara automática/manual, pan, zoom, ajustar, fullscreen, restauración de datos de ejemplo, tamaño de pseudocódigo persistente e historial por variable. En móvil dispone de pestañas para Problema, Diagrama, En escena, Variables, Salida e Historial; la traza no se reinicia al cambiar de vista.

### 4. Laboratorio
Ocho actividades conectadas a la ejecución real: Predice, Tabla, Ordena, Identifica símbolo, Encuentra el error y ¿Y si…?, Completa el pseudocódigo y Sigue la flecha. Las actividades usan la traza compartida, mantienen visible el contexto y ejecutan los experimentos en una copia independiente para no alterar la ejecución base.

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


## Ampliaciones en la rama mejoras/traza-v2 (pendientes de CI)
- Aprende: 17 lecciones organizadas en cinco bloques y una ruta de cinco pantallas con progreso local.
- Ejercicios: se conservan los 40 originales y se agregan cinco retos expertos (Euclides, primalidad/divisores, Cramer 3×3, Newton–Raphson y Simpson 1/3).
- Laboratorio: ocho actividades conectadas a la traza real.
- El catálogo incorpora filtros por nivel, concepto y «De clase», además de paginación.
- Esta rama no se considera aceptada hasta que Node y Playwright terminen correctamente. No se ha fusionado en main.


## Validación final de mejoras/traza-v2

La rama mejoras/traza-v2 quedó validada en GitHub Actions: [run 43718173332](https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43718173332), commit af28e95bb648c126ee445797d9ef9b1da236af22. Resultado: **259/259 pruebas Node y 58/58 pruebas Playwright/Chromium**, sin fallos. La CI cargó 17 capturas PNG en el artefacto ui-audit-4bb58882c1233f6dce3892f7fa2f7e5cfad82f57.

La PR [#7](https://github.com/Santiillana/Diagramas-de-flujo-/pull/7) permanece abierta contra main y no se ha fusionado. Por tanto, esta ampliación está terminada y validada en su rama, pero todavía no forma parte de main. GitHub Pages no se declara publicado: requiere configuración y verificación independiente.
