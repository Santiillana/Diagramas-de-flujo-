# Estado de implementación · Traza

**Actualizado:** 16 de noviembre de 2026  
**Repositorio:** `Santiillana/Traza`  
**Rama predeterminada:** `main`  
**Base integrada antes de M5:** `e80d5773eed6ab0c193ad351e618ce744b0c8441`  
**Rama M5:** `v4/module-5-integration-audit`  
**PR M5:** [#20](https://github.com/Santiillana/Traza/pull/20), abierta y no fusionada.

## Estado ejecutivo

La base funcional y las mejoras v4 del catálogo están integradas en `main`. La auditoría técnica del Módulo 5 ya pasó en GitHub Actions para el SHA `ee804803354a8ea5cf60d17c37405ac90792faa0`. El único cierre que sigue pendiente es la verificación del deployment público contra su origen HTTPS real.

| Área | Estado | Evidencia |
|---|---|---|
| Base visual y navegación | Integrada y auditada | 10 vistas visitadas en Chromium; teclado; responsive |
| Aprende | Integrado | 17 lecciones, cuatro bloques, pruebas de escenas y progreso |
| Ejercicios | Integrado y actualizado en PR #19 | 45 retos, distribución 20/10/10/5; búsqueda, accesos rápidos y filtros |
| Simulador y motor | Integrados y revalidados | Parser/intérprete determinista, traza común, regresiones y E2E |
| Laboratorio y constructor | Integrados y revalidados | Ocho actividades y constructor estructurado sobre el mismo motor |
| M5 · auditoría del código | **CI aprobada** | 267/267 Node y 99/99 Playwright en PR #20 |
| M5 · publicación | **Pendiente externo** | Falta conocer/verificar el origen HTTPS real y ejecutar el smoke test posterior al despliegue |

## Secuencia y alcance

### Módulos funcionales
- **M1:** arquitectura visual, sistema de estilos, navegación y responsive.
- **M2:** lecciones y catálogo didáctico.
- **M3:** parser, intérprete determinista, SVG y sincronización del Simulador.
- **M4 funcional V5:** Laboratorio y constructor estructurado, que consumen la traza y el motor común.

### Continuidad v4
La iteración v4 reorganiza la plataforma en Inicio, Mi ficha y Aprende. El módulo 4 de esa iteración rediseñó el catálogo de Ejercicios y preservó sus 45 identificadores. Se integró mediante [PR #19](https://github.com/Santiillana/Traza/pull/19), merge commit `e80d5773eed6ab0c193ad351e618ce744b0c8441`.

La etiqueta M4 de la iteración v4 no debe confundirse con el alcance histórico M4 de V5 (Laboratorio y constructor), que ya forma parte de la base integrada.

### M5 · Integración, auditoría, rendimiento y publicación
La fase M5 audita contenido, ejecución, navegación, responsive, sincronización visual, accesibilidad, rendimiento funcional y preparación de publicación.

#### Resultado de CI de M5
- PR: [#20](https://github.com/Santiillana/Traza/pull/20).
- Workflow: [GitHub Actions 43954434334](https://github.com/Santiillana/Traza/actions/runs/43954434334).
- SHA probado: `ee804803354a8ea5cf60d17c37405ac90792faa0`.
- Node: **267/267**, cero fallos.
- Playwright/Chromium: **99/99**, cero fallos.
- Artefacto visual: `ui-audit-29b2188dc0b27d9a41da525ea8b589d40b83d1df`, 18 capturas PNG, ID `14271616094`.

La suite cubre los 45 retos y todos los métodos/escenarios disponibles, el oráculo independiente, cinco retos expertos, parser/intérprete, constructor, bucles largos y anidados, snapshots, contraste WCAG AA y los espacios del producto. Los nuevos cuatro E2E M5 comprueban las diez vistas, fallos de consola/recursos, responsive a 390/768/1024/1440 px, teclado y almacenamiento bloqueado.

#### Corrección surgida de la auditoría
El primer recorrido móvil detectó que el `backdrop-filter` de la cabecera atrapaba la navegación inferior fija e impedía tocar el selector de sección. Se eliminó el filtro del contenedor superior en móvil, manteniendo un fondo opaco; la segunda CI pasó el recorrido completo. Cambio aislado en `src/styles/shell.css`.

#### Evidencia previa
Antes de añadir M5, el commit de `main` `e80d5773eed6ab0c193ad351e618ce744b0c8441` ya había pasado 267 pruebas Node y 95 pruebas Chromium: [run 43951436564](https://github.com/Santiillana/Traza/actions/runs/43951436564).

## Arquitectura y comandos

- Runtime: HTML/CSS/JavaScript ES nativo; sin bundler ni dependencias de runtime.
- Instalar: `npm install`
- Desarrollo local: `python3 -m http.server 8000`
- Node: `npm test`
- Chromium: `npx playwright install chromium` y `npm run test:browser`

## Publicación y limitaciones

- `.github/workflows/pages.yml` permite una ejecución manual de respaldo en GitHub Pages. El comentario del workflow indica Cloudflare Workers como hosting primario, pero el repositorio no contiene una URL pública ni evidencia automatizada del estado actual de ese hosting.
- `.github/workflows/post-deploy.yml` requiere el origen HTTPS real, espera la marca exacta `traza-release` y ejecuta `e2e/production-smoke.spec.js`. No se ejecutó porque no se ha podido verificar el origen de producción.
- No afirmar que la aplicación está publicada ni que la aceptación end-to-end de release está completa hasta pasar ese smoke test.
- Responsive se ha probado en Chromium emulado, no en un teléfono o tableta física.
- El constructor es estructurado (secuencia, ramas V/F y ciclos anidados); no es un editor libre de conexiones manuales arbitrarias entre puertos SVG.
- Las pruebas de rendimiento miden límites funcionales de iteración y traza; no equivalen a benchmarks en equipos físicos ni a pruebas de carga multiusuario.

## Referencias

- Especificación: `docs/MASTER_SPEC.md`.
- Informe M5: `docs/MODULE_5_RELEASE_AUDIT.md`.
- Aceptación: `docs/FINAL_ACCEPTANCE.md`.
- Auditoría del prototipo: `docs/ORIGINAL_FEATURE_AUDIT.md`.
