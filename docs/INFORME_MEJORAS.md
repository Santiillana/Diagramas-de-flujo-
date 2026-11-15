# Informe acumulado — Traza v2

Rama: mejoras/traza-v2
Base: main / d63acf146860209b2866460fbe34294b7c2d28ae

## Fase 0 — Auditoría

Estado: COMPLETADA (auditoría de fuente; pruebas locales no ejecutadas).

Hecho:
- Revisado el árbol del repositorio (64 rutas), README, especificación maestra, estado de implementación, decisiones y auditoría funcional.
- Revisados el contrato del intérprete, simulador, laboratorio, constructor, contenido, pruebas y estilos.
- Documentadas rutas, líneas clave, inventario de pruebas, eventos, límites del motor, ejercicios candidatos, jerga y tipografía menor a 13 px.
- Creada la rama desde main. No se tocó main ni ningún archivo protegido.

Evidencia:
- Base main: d63acf146860209b2866460fbe34294b7c2d28ae.
- reference/diagramas_de_flujo_original.html: SHA 9f7f5a3d68d10b004e2ea306df1109906f13bc33.
- Histórico documentado: 222 Node + 38 Chromium; no repetido sobre el commit base en esta sesión.
- Faltan pruebas locales y capturas de Playwright. CI asociada a la rama ajena instruction-2/live-lab-phase: run 43669616951, Node OK, 18 fallos Chromium.

Omisiones / NO VERIFICADO:
- No se pudo ejecutar npm test ni npm run test:browser desde la conexión GitHub.
- No se generaron capturas ni se hizo inspección manual en navegador.
- No hay un segundo prototipo original subido en esta sesión para comparación byte a byte.
- La identidad exacta de la etiqueta «De clase» para el ejercicio de cinco materias queda pendiente entre los candidatos 28 y 39.

Desviaciones:
- Se corrigieron supuestos históricos: el intérprete sí tiene límites; la navegación y constructor ya existen; no se reemplazan desde cero.

Ideas fuera de alcance:
- Editor libre de conexiones por puertos, activación de GitHub Pages y pruebas en un dispositivo físico.

## Próximas fases

Fase 1: sistema visual, tipografía, cabecera y preferencias.
Fase 2: escenas compartidas y Simulador.
Fase 3: ocho modos del Laboratorio.
Fase 4: 17 lecciones y progreso.
Fase 5: fichas y etiquetas de Ejercicios sin modificar el catálogo.
Fase 6: Inicio y pulido del Constructor.
Fase 7: accesibilidad, seguridad, rendimiento, documentación y pull request.
