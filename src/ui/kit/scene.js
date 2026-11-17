export function createScene({ id, momentos, estatica }) {
  if (!id || !Array.isArray(momentos) || momentos.length < 1) throw new TypeError("La escena necesita id y momentos");
  const ordered = momentos.map((item, index) => {
    if (!Number.isFinite(item.en) || item.en < 0 || typeof item.etiqueta !== "string" || typeof item.hacer !== "function") {
      throw new TypeError(`Momento inválido en la posición ${index}`);
    }
    return item;
  }).sort((a, b) => a.en - b.en);
  if (typeof estatica !== "function") throw new TypeError("La escena necesita una versión estática");
  return Object.freeze({ id, momentos: Object.freeze(ordered), estatica });
}

export function frameAt(scene, time) {
  const elapsed = Math.max(0, Number.isFinite(time) ? time : 0);
  const index = scene.momentos.reduce((found, item, position) => item.en <= elapsed ? position : found, -1);
  return { index, activos: scene.momentos.slice(0, index + 1).map(item => item.hacer()), etiqueta: index < 0 ? "" : scene.momentos[index].etiqueta };
}

export function staticSequence(scene) {
  return scene.momentos.map((item, index) => ({ orden: index + 1, etiqueta: item.etiqueta, contenido: item.hacer() }));
}

export function staticFrame(scene) {
  return scene.estatica();
}
