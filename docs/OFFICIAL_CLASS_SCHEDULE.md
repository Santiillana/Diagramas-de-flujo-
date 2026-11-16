# Horario oficial de clases · Mi ficha

**Fuente oficial editable:** `src/content/ficha.js`  
**Zona horaria:** `America/Bogota`  
**Tipo de dato:** contenido oficial del proyecto, no dato personal del navegador.

## Horario recurrente

| Día | Hora local | Materia | Instructor/a | Vigencia |
|---|---|---|---|---|
| Lunes | 6:00 p. m. – 10:00 p. m. | Evaluar requisitos | Jair Castañeda | Hasta 1-11-2026 |
| Lunes | 6:00 p. m. – 10:00 p. m. | Matemáticas | Yilliam Romero | Desde 2-11-2026 |
| Martes | 6:00 p. m. – 10:00 p. m. | Comunicación | Sandra Lizcano | Recurrente |
| Miércoles | 6:00 p. m. – 10:00 p. m. | Evaluar requisitos | Jair Castañeda | Recurrente |
| Jueves | 6:00 p. m. – 10:00 p. m. | TICS | Yonel Torres | Recurrente |
| Viernes | 6:00 p. m. – 10:00 p. m. | Establecer requisitos | Gloria Romero | Recurrente |
| Sábado | 12:00 p. m. – 4:00 p. m. | Clase del sábado (materia pendiente) | Gloria Romero | Recurrente |
| Sábado | 4:00 p. m. – 10:00 p. m. | Clase del sábado (materia pendiente) | Jair Castañeda | Recurrente |
| Domingo | — | Sin clases | — | Recurrente |

El código guarda horas en formato 24 h y la interfaz debe mostrarlas en formato de 12 h con la notación española «a. m.» / «p. m.».

## Supuestos explícitos que requieren confirmación

1. **Cambio del lunes:** se interpreta que Matemáticas reemplaza a Evaluar requisitos desde el lunes 2 de noviembre de 2026. Por eso el bloque anterior termina el 1 de noviembre y el nuevo comienza el 2 de noviembre. En la fecha de referencia de esta especificación, 16 de noviembre de 2026, el lunes vigente corresponde a Matemáticas.
2. **Materias del sábado:** la información suministrada no identifica las materias de los dos bloques. Se conserva el instructor y el horario, pero `materia: null`. La interfaz debe mostrar «Clase del sábado» y nunca inventar una materia. El campo queda editable en `ficha.js`.

## Reglas de implementación

- Hoy, Semana y Calendario consumen este archivo como única fuente oficial de clases.
- Semana y Calendario expanden las recurrencias para fechas pasadas y futuras, aplicando el intervalo de vigencia del lunes.
- Hoy determina día y hora en `America/Bogota`, no con la zona horaria arbitraria del dispositivo.
- El estado temporal se calcula con límites de hora local: «ahora» si inicio ≤ hora actual < fin; «próxima» si aún no inicia; «ya terminó» si hora actual ≥ fin.
- Las fechas civiles `YYYY-MM-DD` no se deben construir con `new Date('YYYY-MM-DD')`; se deben interpretar como componentes de calendario en la zona horaria indicada.
- Notas, entregas, devoluciones y estados académicos son datos personales y se guardan en el navegador. El horario no.
- No crear relaciones con lecciones o ejercicios de Aprende hasta verificar una correspondencia real en el contenido existente. Las relaciones ausentes permanecen vacías.
- Los horarios de clase no deben ser reemplazados por registros demostrativos. Si se conserva contenido demo en otras áreas, debe estar rotulado inequívocamente como «Demostración».

## Protección del Simulador

Esta incorporación no modifica ni debe modificar:
- `src/ui/simulator.js`
- `src/styles/simulator.css`
- `src/core/`
- `src/diagram/`

## Estado de integración

En esta rama, `src/ui/ficha-schedule.js` consume `src/content/ficha.js` y renderiza las vistas Hoy, Semana y Calendario; `src/styles/ficha-schedule.css` aporta su presentación responsive. La inicialización se conecta desde `src/app.js` y los tres placeholders correspondientes se sustituyen en `index.html`.

La integración visual del horario está implementada en esta rama, pero queda pendiente la validación de CI y navegador. Esto no significa que el paso 5 v4 (persistencia personal), la gestión de actividades ni la biblioteca estén implementados; esas vistas siguen siendo placeholders. No afirmar que toda Mi ficha esté terminada hasta completar esos módulos y sus pruebas.
