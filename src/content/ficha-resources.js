/**
 * Biblioteca oficial compartida por Traza.
 *
 * El contenido se publica como parte del sitio y queda disponible en modo
 * solo lectura para todos los estudiantes. Se modifica mediante PR revisada.
 *
 * Campos:
 * - id: identificador único y estable.
 * - title: nombre del recurso.
 * - kind: link | video | document | book | note.
 * - url: URL HTTP/HTTPS o cadena vacía para recursos bibliográficos sin enlace.
 * - description: resumen breve y utilidad pedagógica.
 * - classId: ID existente en src/content/ficha.js, o null si es transversal.
 * - tags: arreglo de etiquetas.
 *
 * Publicar solo enlaces y materiales revisados. No añadir enlaces ficticios.
 */
export const RECURSOS_OFICIALES = Object.freeze([]);
