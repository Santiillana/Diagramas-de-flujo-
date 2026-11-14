# Informe de aceptación final — Traza

Fecha: 14 de noviembre de 2026  
Repositorio: `Santiillana/Diagramas-de-flujo-`  
Rama de aceptación: `module-5/final-audit-release`  
Commit validado: `045f5be0b2f5dc7fe39eb34797a69cba26448612`

## Resultado ejecutivo

Los cinco módulos están integrados en `main`. El PR #6 de M5 se fusionó con el commit `e510f534049c0a990ee03fde38d6b21ec40e8505`; la CI de la rama principal pasó después de integrar.

### Estado por módulo

| Módulo | Resultado | Evidencia |
|---|---|---|
| 1. Arquitectura y diseño | Aceptado e integrado | 7/7 Node + 7/7 Chromium iniciales |
| 2. Lecciones y ejercicios | Aceptado e integrado | 14 lecciones, 40 ejercicios (20/10/10), oráculo de 170 escenarios |
| 3. Parser, motor y simulador | Aceptado e integrado | 31/31 Node + 16/16 Chromium |
| 4. Laboratorio y constructor | Aceptado e integrado con límite de alcance documentado | 216/216 Node + 28/28 Chromium |
| 5. Integración y auditoría | Implementado y CI validada; PR pendiente | 222/222 Node + 38/38 Chromium |

## Evidencia M5

CI aceptación de M5: https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43614738106
CI main final: https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43615474220

- **Node:** 222 pruebas pasaron, 0 fallaron.
- **Chromium:** 38 pruebas pasaron, 0 fallaron.
- Se ejecutaron 170 escenarios de referencia matemática independientes para el catálogo.
- Se comprobaron cinco espacios, responsive a 1440 px, 1024 px y 390 px, arranque sin excepciones JS, modo reto, simulador, movimiento de cámara, zoom, fit, fullscreen, historial, restauración de entradas, pestañas móviles y reducción de movimiento.
- Se capturaron las vistas del simulador, laboratorio y constructor en escritorio/tableta/móvil; artefacto CI: `ui-audit-045f5be0b2f5dc7fe39eb34797a69cba26448612`.

## Revisión visual de las capturas

Se revisaron las capturas producidas por Chromium:
- Simulador desktop: problema/pseudocódigo a la izquierda, diagrama central, escena/variables/salida a la derecha, historial y dock inferior.
- Simulador mobile: barra de espacios navegable, pestañas táctiles para los seis paneles y dock conservado; no hay desbordamiento horizontal del documento.
- Laboratorio desktop: diagrama, escena y variables persistentes junto a las seis actividades.
- Constructor desktop/mobile: paleta, secuencia y terminales, propiedades, compilación/ejecución y vista previa; el layout se adapta sin scroll horizontal de página.

La comprobación de interacción móvil se ejecutó con Chromium emulado; no equivale a probar un dispositivo físico real.

## Diferencias o limitaciones que se declaran

1. **Constructor estructurado, no cableado libre:** se crean secuencias, ramas V/F y cuerpos de ciclo anidados. Las flechas se infieren por orden/estructura. No se implementó todavía el editor libre de conexiones manuales por puerto que describe V5. La implementación no se etiqueta como ese editor completo.
2. **GitHub Pages:** el proyecto es estático y compatible, pero no se pudo verificar la configuración ni una URL pública de Pages desde esta ejecución. Para publicar, habilitar Settings → Pages → Deploy from a branch → main → /(root), y luego comprobar la URL.
3. **Prueba física:** responsive y gestos se probaron con Chromium a tamaños de viewport configurados, no en un teléfono/tableta físico.

## Correcciones de contenido detectadas por la ejecución

- Ejercicio 34: en caso de todos los valores iguales, mantener la primera posición de máximo/mínimo.
- Ejercicio 36: corregir el promedio y los aprobados para el caso declarado.
- Se mantienen verificaciones de Fibonacci hasta 34 (sin imprimir 55), máximos con valores negativos, factorial 0! = 1, centinela no contado y promedio sin división entre cero.

## Publicación

El repositorio incluye `.github/workflows/pages.yml`, que publica el contenido estático en cada push a `main`. El intento posterior a la fusión terminó con HTTP 404 en “Configure GitHub Pages” (https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43615398257): el sitio aún no está habilitado. El propietario debe ir a Settings → Pages → Build and deployment → Source y seleccionar GitHub Actions. Después, re-ejecutar Deploy GitHub Pages y comprobar la URL del entorno.

## Estado final de integración

- PR #6 se fusionó en `main`.
- CI `main`: 222/222 Node y 38/38 Chromium.
- El único bloqueo externo restante es activar GitHub Pages en Settings → Pages → Build and deployment → Source → GitHub Actions. Tras hacerlo, re-ejecutar el workflow y abrir la URL para comprobar los cinco espacios y los módulos JS.
- No se afirma que Pages esté publicado mientras esa activación no se realice y el deployment no termine correctamente.
