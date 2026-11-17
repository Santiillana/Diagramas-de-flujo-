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
- Respaldo JSON separado de Biblioteca, validado, limitado a 2 MB y restaurable con confirmación.
- Los enlaces guardados o importados solo admiten HTTP/HTTPS sin credenciales.
- La actividad oficial y los recursos oficiales se auditan mediante historial de commits y revisión de PR.

## Limitación de respaldo

Los respaldos de Actividades y Biblioteca son independientes. El usuario debe descargar los dos archivos para tener una copia completa de sus datos personales de Mi ficha. Los archivos oficiales están en el repositorio y se recuperan con el historial Git.

## Pendiente para cerrar M10

1. Diseñar una exportación integral de datos personales de Mi ficha o documentar claramente por qué se mantienen respaldos separados.
2. Diseñar y probar migraciones explícitas entre versiones de esquema antes de publicar una versión incompatible.
3. Probar límites/cuota de almacenamiento, fallos de escritura, importaciones truncadas, JSON malformado, duplicados y referencias inexistentes.
4. Verificar recuperación de cada clave de almacenamiento desde un respaldo íntegro.
5. Añadir auditoría editorial con autor, fecha, motivo y diff para cambios en horario y catálogos (por ahora lo proporciona GitHub).
6. Verificar Cloudflare Workers, URL de previsualización y smoke test antes de aceptar la publicación.
7. Ejecutar una pasada de accesibilidad, responsive y regresión en los diez pasos.
8. Si se implementa una base de datos, definir permisos y política de retención para datos personales antes de sincronizarlos.

## Criterio de cierre

No declarar M10 terminado únicamente porque existen botones de descarga. Deben estar probados los recorridos de exportación, corrupción, restauración, compatibilidad de esquema y publicación. No se debe desplegar con un build externo fallido o sin un smoke test real.
