# Horario oficial de clases · Mi ficha

**Fuente editable:** `src/content/ficha.js`  
**Zona horaria:** `America/Bogota`  
**Vigencias:** fechas civiles inclusivas, formato `YYYY-MM-DD`.

## Horario recurrente vigente desde el 2 de noviembre de 2026

| Día | Hora | Materia | Instructor/a |
|---|---|---|---|
| Lunes | 6:00 p. m. – 10:00 p. m. | Matemáticas | Yilliam Romero |
| Martes | 6:00 p. m. – 10:00 p. m. | Comunicación | Sandra Lizcano |
| Miércoles | 6:00 p. m. – 10:00 p. m. | Evaluar requisitos | Jair Castañeda |
| Jueves | 6:00 p. m. – 10:00 p. m. | TICS | Yonel Torres |
| Viernes | 6:00 p. m. – 10:00 p. m. | Establecer requisitos | Gloria Romero |
| Sábado | 12:00 p. m. – 4:00 p. m. | Materia por confirmar | Gloria Romero |
| Sábado | 4:00 p. m. – 10:00 p. m. | Materia por confirmar | Jair Castañeda |
| Domingo | — | Sin clases | — |

## Historial del lunes

- Hasta el 1 de noviembre de 2026: Evaluar requisitos, 6:00 p. m. – 10:00 p. m., Jair Castañeda.
- Desde el 2 de noviembre de 2026: Matemáticas, 6:00 p. m. – 10:00 p. m., Yilliam Romero.

La imagen indica «A partir del 2 de noviembre» sin año. Se interpreta como 2026 por corresponder al calendario de esta entrega. Si el cambio pertenece a otro año, debe corregirse la fecha de vigencia en el archivo fuente.

## Cómo actualizarlo como moderador

1. Editar el registro correspondiente en `src/content/ficha.js`.
2. Para reemplazar un bloque, fijar `vigenteHasta` del anterior al día previo y añadir el nuevo con `vigenteDesde` igual a la fecha efectiva.
3. Mantener horas en formato 24 h; la interfaz las presenta en formato local de 12 horas.
4. No inventar las materias del sábado mientras no estén confirmadas.
5. Ejecutar `npm test` y `npm run test:browser`, revisar Hoy, Semana y Calendario y publicar mediante PR.

Las vistas Hoy, Semana y Calendario aplican la vigencia del bloque según la fecha consultada. Las fechas pasadas conservan el horario que estaba vigente entonces.
