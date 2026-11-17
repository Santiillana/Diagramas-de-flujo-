# Módulo 10 · Respaldo, auditoría y publicación

**Estado:** controles de respaldo locales y documentación implementados parcialmente en la rama `v4/module-7-activities`. Cierre de auditoría, migraciones, respaldo integral unificado y validación de publicación pendientes.

## Datos y límites actuales

| Área | Fuente | Alcance |
|---|---|---|
| Horario oficial | `src/content/ficha.js` | Contenido versionado en Git; cambio por PR |
| Actividades oficiales | `src/content/ficha-activities.js` | Contenido versionado en Git; catálogo actual vacío |
| Recursos oficiales | `src/content/ficha-resources.js` | Contenido versionado en Git; catálogo actual vacío |
| Actividades personales | `traza:v4:ficha` | Almacenamiento local de cada navegador |
| Biblioteca personal | `traza:v4:library` | Almacenamiento local separado |

No existe backend, sincronización entre dispositivos ni almacenamiento central de entregas y notas. Perder los datos locales del navegador puede perder la copia personal si no se descargaron respaldos.

## Controles implementados

- Lectura estricta que distingue almacenamiento inaccesible, JSON corrupto, esquema desconocido y registros inválidos.
- Escritura normal bloqueada cuando el contenido anterior está corrupto o usa un esquema no compatible.
- Validación estricta de campos anidados para evitar que la normalización descarte silenciosamente información.
- Respaldo JSON de Actividades y restauración validada con confirmación.
- Respaldo JSON independiente de Biblioteca, validado, limitado a 2 MB y restaurable con confirmación.
- Respaldo integral `traza-full-ficha-backup` que reúne ambas áreas personales en un solo archivo y valida ambos formatos antes de importar.
- Restauración integral con snapshot de las dos claves y rollback compensatorio si falla la segunda escritura; se notifica el rollback a las vistas abiertas.
- Los enlaces guardados o importados solo admiten HTTP/HTTPS sin credenciales.
- La actividad oficial y los recursos oficiales se auditan mediante historial de commits y revisión de PR.

## Limitación de respaldo

Se conservan los respaldos granulares de Actividades y Biblioteca para restauración selectiva. Además, la vista Hoy ofrece un respaldo integral en un único archivo para las dos áreas personales. El almacenamiento local no admite transacciones multi-clave: la restauración integral valida ambos datos y usa rollback compensatorio si falla la segunda escritura. No es una garantía transaccional del navegador ante cierre abrupto durante la operación. El horario, actividades oficiales y recursos oficiales no se incluyen, porque son contenido versionado en Git y se recuperan desde el repositorio.

## Pendiente para cerrar M10

1. Diseñar y probar migraciones explícitas entre versiones de esquema antes de publicar una versión incompatible.
2. Probar límites/cuota de almacenamiento, fallos de escritura persistentes, importaciones truncadas, JSON malformado, duplicados, referencias inexistentes y rollback fallido.
3. Verificar recuperación de cada clave de almacenamiento desde un respaldo integral y granular.
4. Añadir auditoría editorial con autor, fecha, motivo y diff para cambios en horario y catálogos (por ahora lo proporciona GitHub).
5. Verificar Cloudflare Workers, URL de previsualización y smoke test antes de aceptar la publicación.
6. Ejecutar una pasada de accesibilidad, responsive y regresión en los diez pasos.
7. Si se implementa una base de datos, definir permisos y política de retención para datos personales antes de sincronizarlos.

## Criterio de cierre

No declarar M10 terminado únicamente porque existen botones de descarga. Deben estar probados los recorridos granular e integral de exportación, corrupción, rollback, restauración, compatibilidad de esquema y publicación. No se debe desplegar con un build externo fallido o sin un smoke test real.
