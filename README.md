# Traza — laboratorio visual de diagramas de flujo

Rediseño modular de la aplicación educativa definida en el documento maestro V5.

## Estado
- **Módulo activo:** 1 — Auditoría, arquitectura y experiencia visual.
- **Rama de trabajo:** \`module-1/architecture-visual-system\`.
- **Tecnología:** HTML semántico, CSS modular y JavaScript nativo con módulos ES.
- **Publicación prevista:** GitHub Pages como sitio estático, sin paso de compilación.

El catálogo de ejercicios, las lecciones completas y el motor de ejecución no se simulan en esta etapa. Se integrarán en sus módulos correspondientes.

## Ejecutar en local

Con Python 3 o cualquier servidor HTTP estático:

\`\`\`bash
python3 -m http.server 8000
\`\`\`

Abre [http://localhost:8000](http://localhost:8000). No abras \`index.html\` directamente desde el sistema de archivos: los módulos ES requieren un servidor HTTP.

## Pruebas automatizadas

Con Node.js 18 o superior:

\`\`\`bash
npm test
\`\`\`

No hay dependencias de terceros ni proceso de build.

## Publicar con GitHub Pages

Después de integrar la rama de trabajo en \`main\`:

1. Abre **Settings → Pages**.
2. Selecciona **Deploy from a branch**.
3. Selecciona \`main\` y la carpeta \`/(root)\`.
4. Guarda la configuración. El punto de entrada es \`index.html\`.

## Estructura

\`\`\`text
.
├── index.html
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
\`\`\`

## Prototipo de referencia

[reference/diagramas_de_flujo_original.html](reference/diagramas_de_flujo_original.html) se conserva sin modificaciones y permanece accesible mientras se implementan equivalencias verificables. Consulta [reference/README.md](reference/README.md) y [docs/ORIGINAL_FEATURE_AUDIT.md](docs/ORIGINAL_FEATURE_AUDIT.md).

## Continuidad

- [Especificación maestra](docs/MASTER_SPEC.md)
- [Estado de implementación](docs/IMPLEMENTATION_STATUS.md)
- [Registro de decisiones](docs/DECISIONS.md)
- [Auditoría del prototipo](docs/ORIGINAL_FEATURE_AUDIT.md)

No iniciar el siguiente módulo hasta revisar y aceptar el actual.
