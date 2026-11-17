# Módulo 9 · Biblioteca

**Rama:** `v4/module-7-activities`  
**Estado:** interfaz personal y almacenamiento local implementados; fuente editorial oficial preparada, todavía sin recursos publicados. Validación en SHA `856df59`: 300 pruebas Node y 116 pruebas Playwright aprobadas en la suite conjunta de la rama. El check externo de Cloudflare Workers falló para ese SHA.

## Separación de catálogos

- `src/content/ficha-resources.js`: catálogo oficial, compartido y de solo lectura. Se actualiza mediante commits y PR revisadas. Inicialmente vacío para no publicar enlaces o materiales no comprobados.
- `src/ui/ficha-library-store.js`: almacén personal independiente bajo `traza:v4:library`, con esquema versión 1.
- `src/ui/ficha-library.js`: interfaz para administrar recursos propios.
- `src/styles/ficha-library.css`: estilos responsive.

## Funciones personales

- Añadir enlaces, videos, documentos, libros o apuntes.
- Asociar opcionalmente el recurso con uno de los bloques reales del horario.
- Añadir descripción y etiquetas.
- Buscar por nombre, descripción y etiquetas; filtrar por tipo.
- Consultar, editar y archivar recursos.
- Abrir enlaces externos solo si usan HTTP/HTTPS y no incluyen credenciales.
- Exportar e importar respaldos independientes de la biblioteca, versión 1, con validación estricta y límite de 2 MB.
- Incluir la biblioteca en el respaldo integral `traza-full-ficha-backup`, junto con las actividades personales, con restauración validada y rollback compensatorio.
- Bloquear las escrituras normales si el almacenamiento está corrupto o tiene un esquema desconocido; solo un respaldo válido puede restaurarlo tras confirmación.

## Funciones del catálogo oficial

Los recursos publicados por Traza se muestran en un bloque separado y en solo lectura. El catálogo no se mezcla con los recursos privados del estudiante, no se copia a `localStorage` y no se sincroniza con la biblioteca personal.

Para publicar un recurso oficial, añadir una entrada a `RECURSOS_OFICIALES` en `src/content/ficha-resources.js`. Campos: `id`, `title`, `kind`, `url`, `description`, `classId` y `tags`. `classId` debe existir en `src/content/ficha.js` o ser `null`. Usar solo enlaces verificados.

## Límites

- No hay inicio de sesión ni sincronización entre dispositivos.
- No existe todavía un panel de moderador. El catálogo oficial se mantiene en GitHub mediante PR y despliegue.
- No se crean relaciones con lecciones o ejercicios de Aprende sin comprobar una correspondencia real.
- Los archivos de respaldo de la biblioteca y de Actividades son independientes; deben guardarse ambos si se necesita una copia completa de Mi ficha.

## Pruebas

- `tests/ficha-library.test.js`: esquema, creación, URL segura, edición, archivo, corrupción, respaldo y restauración.
- `e2e/module-7-library.spec.js`: flujo de usuario, filtros, exportación e importación de biblioteca.
- `tests/ficha-full-backup.test.js` y `e2e/module-7-schedule.spec.js`: respaldo integral y refresco de las vistas tras restaurar ambas áreas.