# Traza — laboratorio visual de diagramas de flujo

Rediseño modular del laboratorio educativo definido por la especificación maestra V5.

## Estado de construcción
- **Módulo 1 — Arquitectura y experiencia visual:** aceptado e integrado en `main`.
- **Módulo 2 — Aprende y 40 ejercicios:** aceptado e integrado en `main`.
- **Módulo 3 — Parser, intérprete, diagramas y simulación:** implementado y validado en la rama `module-3/deterministic-pseudocode-engine`; PR de integración pendiente.
- **Módulo 4 — Laboratorio y constructor gráfico:** siguiente etapa.
- **Módulo 5 — Auditoría final, integración y publicación:** pendiente.

## Ejecutar en local

Requiere Python 3:
```bash
python3 -m http.server 8000
```
Abre http://localhost:8000. Los módulos ES requieren un servidor HTTP.

## Pruebas

Requiere Node.js 22 o superior:
```bash
npm install
npm test
npx playwright install chromium
npm run test:browser
```
El workflow instala Chromium y ejecuta ambas suites en Ubuntu 24.04.

## Contenido

**Aprende:** 14 lecciones secuenciales con explicación intuitiva y técnica, visualización por pasos, ejemplo guiado, manipulación de datos y comprobación.

**Ejercicios:** catálogo de 40 retos oficiales (20 básicos, 10 intermedios y 10 avanzados). Cada ficha contiene enunciado, objetivo, conceptos, entradas, salidas, restricciones, análisis, métodos, pseudocódigo, ejemplos, pruebas y errores frecuentes.

## Simulador (Módulo 3)

El motor comprende la sintaxis del prototipo: `leer`, `imp`, asignación, `si/sino/fin`, `para`, `mientras` y `hacer/hm`. Las expresiones se tokenizan y analizan con gramática restringida; no se usan `eval` ni `new Function`.

Cada paso genera un evento con snapshot de variables, salidas, línea fuente, nodo activo, ruta V/F y contexto de iteración. El mismo registro alimenta:
- Pseudocódigo resaltado y diagrama SVG con símbolos y rutas.
- Panel En escena, cambios de variables e historial.
- Salida acumulada, línea de tiempo, avance, retroceso, salto y reproducción.
- Mensajes didácticos para datos faltantes, entradas inválidas y ciclos protegidos.

La ejecución es determinista: volver a un evento anterior restaura el snapshot exacto. Los límites de seguridad producen un error identificable, nunca un resultado válido inventado.

## Publicar con GitHub Pages

Después de integrar la rama de trabajo en `main`:
1. Abre **Settings → Pages**.
2. Selecciona **Deploy from a branch**.
3. Selecciona `main` y `/(root)`.
4. Guarda. El punto de entrada es `index.html`.

## Estructura

```text
.
├── index.html
├── src/
│   ├── content/
│   ├── core/        # parser, expresiones, intérprete, traza
│   ├── diagram/     # layout y render SVG
│   ├── ui/          # navegación, contenido, simulador
│   └── styles/
├── tests/
├── e2e/
├── docs/
└── reference/
```

## Continuidad
- Especificación: `docs/MASTER_SPEC.md`
- Estado: `docs/IMPLEMENTATION_STATUS.md`
- Decisiones: `docs/DECISIONS.md`
- Auditoría funcional: `docs/ORIGINAL_FEATURE_AUDIT.md`
- Prototipo original inmutable: `reference/diagramas_de_flujo_original.html`
