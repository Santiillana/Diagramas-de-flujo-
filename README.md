# Traza — laboratorio visual de diagramas de flujo

Rediseño modular del laboratorio educativo definido por el documento maestro V5.

## Estado
- **Módulo 1:** aceptado e integrado en `main`.
- **Módulo 2:** contenido y catálogo implementados; CI aprobada en la rama `module-2/lessons-exercise-catalog`.
- **Módulo 3:** parser, intérprete y simulación sincronizada, siguiente etapa.
- **Módulo 4:** laboratorio y constructor, depende del motor del M3.
- **Módulo 5:** integración y publicación final.

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
El workflow ejecuta ambas suites en Ubuntu 24.04. La validación de M2 incluye las 14 lecciones, la distribución exacta 20/10/10, los datos de fichas, casos y métodos, búsqueda/filtros y navegación real con Chromium.

## Contenido

**Aprende:** 14 lecciones progresivas, cada una con explicación intuitiva, definición técnica, visualización por pasos, ejemplo guiado, manipulación y comprobación de comprensión.

**Ejercicios:** catálogo de 40 fichas oficiales (20 básicas, 10 intermedias, 10 avanzadas), con enunciado, objetivo, conceptos, entradas, salidas, restricciones, análisis, pseudocódigo por método, datos de ejemplo, pruebas y errores frecuentes.

No se adelanta el motor: el pseudocódigo y sus resultados se ejecutarán en el Módulo 3 mediante un único intérprete seguro, sin `eval` ni `new Function`.

## Publicación en GitHub Pages

Después de integrar la rama de trabajo en `main`:
1. Abre **Settings → Pages**.
2. Selecciona **Deploy from a branch**.
3. Selecciona `main` y la carpeta `/(root)`.
4. Guarda la configuración. El punto de entrada es `index.html`.

## Estructura

```text
.
├── index.html
├── src/content/   # lecciones y catálogo
├── src/ui/        # navegación y vistas
├── src/styles/    # sistema visual
├── tests/
├── e2e/
├── docs/
└── reference/
```

## Continuidad
- Especificación maestra: `docs/MASTER_SPEC.md`
- Estado: `docs/IMPLEMENTATION_STATUS.md`
- Decisiones: `docs/DECISIONS.md`
- Auditoría del prototipo: `docs/ORIGINAL_FEATURE_AUDIT.md`
- HTML original inmutable: `reference/diagramas_de_flujo_original.html`
