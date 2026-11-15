export const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[ch]));

export const displayValue = value => escapeHTML(typeof value === "number" ? String(Number(value.toFixed(6))) : String(value ?? "—"));

export function variableCards(variables) {
  const entries = Object.entries(variables ?? {});
  if (!entries.length) return '<span class="scene-empty-memory">Memoria vacía</span>';
  return entries.map(([name,value]) =>
    '<span class="scene-memory-value"><b>'+escapeHTML(name)+'</b><strong>'+displayValue(value)+'</strong></span>'
  ).join("");
}

export function routeLabel(route) {
  return route === "V" ? "V · Verdadero" : route === "F" ? "F · Falso" : "Sin ruta";
}