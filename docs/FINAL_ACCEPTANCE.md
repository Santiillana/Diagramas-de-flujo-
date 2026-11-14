# Informe de aceptación final — Traza

Fecha: 14 de noviembre de 2026  
Repositorio: `Santiillana/Diagramas-de-flujo-`  
Rama de aceptación: `module-5/final-audit-release`  
Commit validado: `045f5be0b2f5dc7fe39eb34797a69cba26448612`

## Resultado ejecutivo

Los cinco módulos se han implementado. M1–M4 están integrados en `main`. M5 está implementado y su CI push está verde. El PR #6 está abierto y su CI de PR está en ejecución; por tanto no se afirma que la versión final ya esté en `main`.

### Estado por módulo

| Módulo | Resultado | Evidencia |
|---|---|---|
| 1. Arquitectura y diseño | Aceptado e integrado | 7/7 Node + 7/7 Chromium iniciales |
| 2. Lecciones y ejercicios | Aceptado e integrado | 14 lecciones, 40 ejercicios (20/10/10), oráculo de 170 escenarios |
| 3. Parser, motor y simulador | Aceptado e integrado | 31/31 Node + 16/16 Chromium |
| 4. Laboratorio y constructor | Aceptado e integrado con límite de alcance documentado | 216/216 Node + 28/28 Chromium |
| 5. Integración y auditoría | Implementado y CI validada; PR pendiente | 222/222 Node + 38/38 Chromium |

## Evidencia M5

CI: https://github.com/Santiillana/Diagramas-de-flujo-/actions/runs/43614738106

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

El repositorio incluye `.github/workflows/pages.yml`, que usa GitHub Actions para publicar el contenido estático cuando hay un push a `main`. La automatización está en el PR M5; falta comprobar su ejecución real después de la fusión, la URL publicada y que responda correctamente.

## Integración final pendiente

1. Esperar los checks del PR #6 y fusionarlo si todos terminan en verde.
2. Comprobar el workflow **Deploy GitHub Pages** disparado por el push a `main`.
3. Abrir la URL de Pages publicada y verificar que cargan los cinco espacios y los módulos JS.

No debe declararse M5 integrado ni Pages publicado antes de completar esas acciones.
