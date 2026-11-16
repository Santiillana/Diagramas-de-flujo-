# Traza · laboratorio visual de diagramas de flujo

Traza es una plataforma educativa interactiva para analizar problemas, construir algoritmos y comprender su ejecución mediante diagramas de flujo, pseudocódigo y seguimiento de variables.

## Estado de la versión

- Repositorio: [Santiillana/Traza](https://github.com/Santiillana/Traza)
- Rama principal: `main`
- Módulos funcionales M1–M5 y las mejoras v4 del catálogo integrados en `main`.
- **Módulo 6 · Inicio y pulido del Constructor:** integrado en `main` mediante PR #21 el 16 de noviembre de 2026.
- Publicación: no se considera activa hasta comprobar el origen HTTPS real con el flujo de verificación posterior al despliegue.

## Continuidad v4 · Mi ficha

La rama `v4/module-7-activities` contiene la primera integración del horario oficial `America/Bogota` en Hoy, Semana y Calendario, además del repositorio local común para actividades y el respaldo versionado. Estos cambios siguen en revisión en la PR #22; no forman parte de `main` hasta su integración.

## Espacios

### Inicio
Acceso a Mi ficha y Aprende, continuidad del último espacio visitado y, en la entrega del Módulo 6, progreso de las 17 lecciones con porcentaje y barra accesible. Añade accesos directos a Ejercicios, Simulador y Laboratorio.

### Mi ficha
Cinco espacios para organizar el trabajo académico: **Hoy, Semana, Calendario, Actividades y Biblioteca**. La sección tiene identidad visual y preferencia de tema propias.

### Aprende
Cuatro espacios: **Aprende, Ejercicios, Simulador y Laboratorio**.

- **Aprende:** 17 lecciones progresivas organizadas en cuatro bloques, con explicación intuitiva y técnica, escenas, ejemplos, errores frecuentes y comprobación. El progreso se conserva localmente.
- **Ejercicios:** catálogo de 45 retos: 20 básicos, 10 intermedios, 10 avanzados y 5 expertos. Incluye búsqueda, accesos rápidos por dificultad, filtros por conceptos, filtro de ejercicios de clase, paginación y ficha protegida antes de revelar la solución.
- **Simulador:** parser e intérprete restringidos para pseudocódigo educativo. Una traza determinista alimenta el diagrama SVG, el pseudocódigo activo, En escena, Variables, Pantalla, Historial y la línea de tiempo. Incluye avance, retroceso, reproducción, predicción, zoom, ajuste, cámara, pantalla completa, tema, tamaño de texto y movimiento reducido.
- **Laboratorio:** ocho actividades en tres modalidades de práctica, más un constructor gráfico estructurado. El constructor compila al mismo motor del Simulador; no mantiene un intérprete paralelo.

## Constructor · historial de cambios

El Constructor conserva hasta 60 estados del modelo. Incluye Deshacer/Rehacer, atajos de teclado y controles accesibles. El historial está limitado a los últimos 60 snapshots; una edición posterior a deshacer descarta la rama futura. La entrega M6 añade regresiones específicas para comprobar estos límites.

## Arquitectura

HTML, CSS y JavaScript ES nativo, sin dependencias de runtime. El único paquete de desarrollo es Playwright para pruebas de navegador. El pseudocódigo educativo no se ejecuta como JavaScript: el motor no utiliza `eval` ni `new Function`.

La referencia original se conserva sin modificar en `reference/diagramas_de_flujo_original.html`.

## Ejecutar en local

Requiere Node.js 22 o superior y Python 3 para servir los módulos ES.

```bash
npm install
python3 -m http.server 8000
```

Abre http://localhost:8000.

## Pruebas

```bash
npm test
npx playwright install chromium
npm run test:browser
```

La suite incluye pruebas del parser, intérprete, compilador del constructor, ejecución de todos los métodos y escenarios de los ejercicios, un oráculo matemático independiente, rendimiento de ciclos, accesibilidad de contraste, navegación y aceptación visual con Chromium.

## CI y capturas

El workflow `.github/workflows/quality.yml` ejecuta las pruebas Node y Playwright en cada push a `main` y en cada pull request hacia `main`. Sube las capturas automatizadas como artefacto de GitHub Actions.

## Publicación

La aplicación es estática. El workflow `.github/workflows/pages.yml` permite una publicación manual de respaldo en GitHub Pages. La verificación de producción está separada en `.github/workflows/post-deploy.yml`: requiere el origen HTTPS real y comprueba que la versión publicada coincida con la marca de release antes de ejecutar el smoke test.

**No se afirma que el sitio esté publicado** mientras no se complete ese flujo contra una URL real. La configuración del proveedor de hosting y cualquier prueba en dispositivos físicos son verificaciones externas a la CI de Chromium.

## Documentación

- Especificación V5: `docs/MASTER_SPEC.md`
- Estado del proyecto: `docs/IMPLEMENTATION_STATUS.md`
- Informe de mejoras v2: `docs/INFORME_MEJORAS.md`
- Informe M5: `docs/MODULE_5_RELEASE_AUDIT.md`
- Informe M6: `docs/MODULE_6_HOME_BUILDER.md`
- Decisiones técnicas: `docs/DECISIONS.md`
- Auditoría de equivalencia original: `docs/ORIGINAL_FEATURE_AUDIT.md`
- Aceptación y limitaciones: `docs/FINAL_ACCEPTANCE.md`
