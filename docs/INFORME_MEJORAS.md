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


## Avance de implementación — rama mejoras/traza-v2

### Fase 1 — Sistema visual
- Tokens de diseño y tema oscuro inicial; tipografía base de 17 px y texto de interfaz con mínimo 13 px.
- Navegación, preferencias y jerarquía visual simplificadas.
- Revisión automatizada de tamaños tipográficos en ocho hojas de estilo: cero valores numéricos por debajo de 13 px en el corte documentado.

### Fase 2 — Simulador y escenas
- Adaptador de eventos del intérprete a escenas visuales reutilizables.
- Escenas diferenciadas para entrada, proceso, salida, decisión, ciclos y errores.
- Narración de pasos, estado de vueltas y tamaño de pseudocódigo ajustable.
- No se modificó el intérprete protegido ni sus límites de seguridad.

### Fase 3 — Laboratorio
- Ocho actividades: seis originales y dos nuevas (Completa el pseudocódigo y Sigue la flecha).
- Progreso local por actividad, estrellas y práctica mixta.
- Las nuevas actividades consultan la traza y los resultados reales del motor.

### Fase 4 — Aprende
- 17 lecciones en cinco bloques temáticos.
- Cinco pantallas por lección: idea, escena, ejemplo ejecutable, práctica y resumen.
- Ejecución real de mini-programas, comprobación y progreso persistente.

### Fase 5 — Ejercicios
- Se preservaron los 40 ejercicios originales y se añadieron cinco retos expertos (IDs 41–45).
- Distribución actual: 20 básicos, 10 intermedios, 10 avanzados y 5 expertos.
- Retos expertos: MCD/MCM con Euclides; primalidad y divisores; sistema 3×3 por Cramer; Newton–Raphson; integración de Simpson 1/3.
- Catálogo con filtro por concepto derivado del pseudocódigo, filtro «De clase», nivel Experto y paginación.
- Pruebas nuevas para los cinco algoritmos. Los resultados deberán confirmarse en CI.

### Fases 6 y 7 — Pendientes de cierre
- Pulido final del Constructor y revisión de la experiencia de inicio.
- Validación completa Node/Playwright, capturas, revisión responsive, accesibilidad y seguridad.
- Actualizar este informe con los resultados reales de CI y abrir PR contra main. No fusionar sin autorización explícita.

### Estado honesto
El trabajo está implementado en la rama de mejoras, pero todavía no se declara aceptado: falta ejecutar CI sobre el estado final, corregir cualquier regresión y completar la revisión de las fases 6 y 7. La rama main permanece intacta.
