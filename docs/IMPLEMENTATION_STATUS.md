# Estado de implementación · Traza

**Actualizado:** 16 de noviembre de 2026  
**Repositorio:** `Santiillana/Traza`  
**Rama predeterminada:** `main`  
**Corte de código integrado antes de M5:** `e80d5773eed6ab0c193ad351e618ce744b0c8441`  
**Rama de auditoría M5:** `v4/module-5-integration-audit`

## Estado ejecutivo

Los módulos funcionales y la ampliación v4 del catálogo están integrados en `main`. La fase actual es M5: auditoría de integración, rendimiento, accesibilidad y preparación de release.

| Área | Estado actual | Evidencia | Pendientes reales |
|---|---|---|---|
| Base visual y navegación | Integrada | CI principal y pruebas de arquitectura; 10 vistas declaradas | Auditoría M5 de navegación en todos los espacios y tamaños |
| Aprende | Integrado | 17 lecciones, cuatro bloques y suite Playwright | Auditoría integral de consola y responsive |
| Ejercicios | Integrado y actualizado en PR #19 | 45 IDs consecutivos; niveles 20/10/10/5; búsqueda y filtros | Ninguno conocido en catálogo; revalidación M5 |
| Simulador y motor | Integrados | Parser/intérprete determinista, escenarios ejecutables y snapshots | No se ha hecho prueba física en móvil/tableta |
| Laboratorio y constructor | Integrados | Ocho actividades y constructor estructurado sobre el motor común | No implementa conexiones SVG libres entre puertos arbitrarios; limitación documentada |
| M5 · auditoría y release | En curso | CI de `main` previa a M5: 267 Node + 95 Chromium, exitosa | Ejecutar nuevos E2E M5, documentar su resultado y verificar una publicación real |

## Secuencia y alcance actual

### Módulos funcionales
- **M1:** arquitectura visual, sistema de estilos, navegación y responsive.
- **M2:** lecciones y catálogo inicial, junto al contenido didáctico.
- **M3:** parser, intérprete determinista, SVG y sincronización del Simulador.
- **M4 funcional:** Laboratorio y constructor estructurado, que consumen la traza y el motor común.

### Continuidad v4
El rediseño v4 amplía la experiencia y reorganiza la plataforma en Inicio, Mi ficha y Aprende. La iteración reciente del Módulo 4 rediseñó el catálogo de Ejercicios y preservó sus 45 identificadores. Se integró mediante [PR #19](https://github.com/Santiillana/Traza/pull/19), merge commit `e80d5773eed6ab0c193ad351e618ce744b0c8441`.

Esta etiqueta M4 de la iteración v4 no debe confundirse con el alcance histórico M4 de V5 (Laboratorio y constructor), que ya forma parte de la base integrada.

### M5 · Integración, auditoría, rendimiento y publicación
El cierre cubre:
1. Auditoría de contenido didáctico y alcance.
2. Ejecución real de todos los métodos y escenarios disponibles.
3. Revisión de navegación, ventanas, diagramas y responsive.
4. Sincronización de movimientos, ruta, variables, escena y timeline.
5. Pausa, movimiento reducido, teclado, contraste y errores de consola.
6. Pruebas de ciclos largos, anidados y memoria/traza acotada.
7. README, referencia original, flujo de publicación y verificación del release.

M5 no debe marcarse como aceptación completa hasta ejecutar sus pruebas nuevas y verificar el sitio publicado mediante `post-deploy.yml`. Una CI verde no equivale a un despliegue público.

## Evidencia de CI antes de M5

- Run: [43951436564](https://github.com/Santiillana/Traza/actions/runs/43951436564)
- Commit probado: `e80d5773eed6ab0c193ad351e618ce744b0c8441`
- Node: **267 pruebas** aprobadas.
- Playwright/Chromium: **95 pruebas** aprobadas.
- Capturas: artefacto `ui-audit-e80d5773eed6ab0c193ad351e618ce744b0c8441`, 18 archivos, ID `14266019722`.
- Instalación CI: Node 22; npm instaló y auditó 4 paquetes, 0 vulnerabilidades reportadas.

Estos valores describen el commit de `main` previo a los nuevos E2E M5, no deben atribuirse a un commit posterior hasta que su Actions termine.

## Arquitectura y comandos

- Runtime: HTML/CSS/JavaScript ES nativo; sin bundler ni dependencias de runtime.
- Instalar: `npm install`
- Desarrollo local: `python3 -m http.server 8000`
- Pruebas Node: `npm test`
- Pruebas Chromium: `npx playwright install chromium` y `npm run test:browser`
- Publicación de respaldo: workflow manual `.github/workflows/pages.yml`.
- Smoke test de producción: workflow manual `.github/workflows/post-deploy.yml`, requiere `base_url` HTTPS real.

## Referencias y protecciones

- Especificación V5: `docs/MASTER_SPEC.md`.
- Referencia original inmutable: `reference/diagramas_de_flujo_original.html`.
- El constructor sigue siendo estructurado: secuencia, ramas y cuerpos anidados. No se declara editor libre de puertos/aristas arbitrarias.
- Responsive validado mediante Chromium emulado; no equivale a prueba táctil en hardware físico.
- No alterar parser, intérprete, diagrama ni simulador por cambios de documentación/auditoría que no lo requieran. Cualquier corrección funcional posterior debe tener prueba reproducible.

## Próximo paso de cierre

Terminar la suite M5 en la rama `v4/module-5-integration-audit`, revisar las capturas, registrar SHA y resultados en este documento y en `docs/FINAL_ACCEPTANCE.md`. Mantener como pendiente externo el deployment hasta comprobar el origen HTTPS real.
