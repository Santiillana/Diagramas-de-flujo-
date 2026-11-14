# Traza — laboratorio visual de diagramas de flujo

Rediseño modular del laboratorio educativo definido en el documento maestro V5.

## Estado
- **Módulo 1:** aceptado tras validación en Chromium y GitHub Actions.
- **Rama de trabajo:** `module-1/architecture-visual-system`.
- **Tecnología:** HTML semántico, CSS modular y JavaScript nativo con módulos ES.
- **Publicación:** compatible con GitHub Pages como sitio estático.

Las lecciones y los 40 ejercicios se incorporan en el Módulo 2. El motor de ejecución sincronizado corresponde al Módulo 3; las actividades funcionales del laboratorio y el constructor corresponden al Módulo 4.

## Ejecutar en local

Requiere Python 3 para servir el sitio:
```bash
python3 -m http.server 8000
```
Abre [http://localhost:8000](http://localhost:8000). No abras `index.html` directamente desde el sistema de archivos: los módulos ES requieren un servidor HTTP.

## Pruebas automatizadas

Requiere Node.js 22 o superior:
```bash
npm install
npm test
npx playwright install chromium
npm run test:browser
```
El workflow de GitHub Actions instala Chromium y ejecuta ambas suites sobre Ubuntu 24.04. Las pruebas de M1 incluyen navegación, ausencia de errores de página, desbordamiento en escritorio/tableta/móvil, dock fuera del área del diagrama, tema, movimiento reducido y disponibilidad del prototipo original.

## Publicar con GitHub Pages

Después de integrar la rama de trabajo en `main`:
1. Abre **Settings → Pages**.
2. Selecciona **Deploy from a branch**.
3. Selecciona `main` y la carpeta `/(root)`.
4. Guarda la configuración. El punto de entrada es `index.html`.

## Estructura

```text
.
├── index.html
├── e2e/
├── playwright.config.js
├── src/
│   ├── app.js
│   ├── ui/
│   │   ├── navigation.js
│   │   └── preferences.js
│   └── styles/
│       ├── tokens.css
│       ├── layout.css
│       ├── components.css
│       ├── motion.css
│       └── responsive.css
├── tests/
├── docs/
└── reference/
```

## Prototipo de referencia

[reference/diagramas_de_flujo_original.html](reference/diagramas_de_flujo_original.html) se conserva sin modificaciones y permanece accesible mientras se implementan equivalencias verificables. Consulta [reference/README.md](reference/README.md) y [docs/ORIGINAL_FEATURE_AUDIT.md](docs/ORIGINAL_FEATURE_AUDIT.md).

## Continuidad

- [Especificación maestra](docs/MASTER_SPEC.md)
- [Estado de implementación](docs/IMPLEMENTATION_STATUS.md)
- [Registro de decisiones](docs/DECISIONS.md)
- [Auditoría del prototipo](docs/ORIGINAL_FEATURE_AUDIT.md)
