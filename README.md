# Traza · laboratorio visual de diagramas de flujo

Traza es una plataforma educativa interactiva para aprender a analizar problemas, construir algoritmos y comprender su ejecución mediante diagramas de flujo, pseudocódigo y seguimiento de variables.

## Estado de la versión

La rama principal integra los módulos funcionales y las mejoras v4 del catálogo de Ejercicios. El **Módulo 5** está dedicado a la auditoría integral, rendimiento, accesibilidad y preparación de publicación.

- Repositorio: [Santiillana/Traza](https://github.com/Santiillana/Traza)
- Rama de producción de código: `main`
- Último corte integrado antes de M5: `e80d5773eed6ab0c193ad351e618ce744b0c8441`
- Última CI de `main`: [GitHub Actions #43951436564](https://github.com/Santiillana/Traza/actions/runs/43951436564)
- Estado de publicación: no se considera desplegada hasta comprobar la URL real con el flujo de verificación posterior al despliegue.

## Espacios

### Inicio
Acceso a Mi ficha y Aprende, con resumen y continuidad del último espacio visitado.

### Mi ficha
Cinco espacios para organizar el trabajo académico: **Hoy, Semana, Calendario, Actividades y Biblioteca**. La sección tiene identidad visual y preferencia de tema propias.

### Aprende
Cuatro espacios de aprendizaje: **Aprende, Ejercicios, Simulador y Laboratorio**.

- **Aprende:** 17 lecciones progresivas organizadas en cuatro bloques, con explicación intuitiva y técnica, escenas, ejemplos resueltos, errores frecuentes y comprobación.
- **Ejercicios:** catálogo de 45 retos: 20 básicos, 10 intermedios, 10 avanzados y 5 expertos. Incluye búsqueda, accesos rápidos por dificultad, filtros por conceptos, filtro de ejercicios de clase, paginación y ficha protegida antes de revelar la solución.
- **Simulador:** parser e intérprete restringidos para pseudocódigo educativo. Una traza determinista alimenta el diagrama SVG, el pseudocódigo activo, En escena, Variables, Pantalla, Historial y la línea de tiempo. Incluye avance, retroceso, reproducción, predicción, zoom, ajuste, cámara, pantalla completa, tema, tamaño de texto y movimiento reducido.
- **Laboratorio:** ocho actividades en tres modalidades de práctica, más un constructor gráfico estructurado. El constructor compila al mismo motor del Simulador; no mantiene un intérprete paralelo.

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

- Especificación: `docs/MASTER_SPEC.md`
- Estado del proyecto: `docs/IMPLEMENTATION_STATUS.md`
- Decisiones técnicas: `docs/DECISIONS.md`
- Auditoría de equivalencia original: `docs/ORIGINAL_FEATURE_AUDIT.md`
- Aceptación y limitaciones: `docs/FINAL_ACCEPTANCE.md`
- Informe M5: `docs/MODULE_5_RELEASE_AUDIT.md`
