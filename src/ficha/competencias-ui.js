const VISUALES = {
  "logica-programacion": ["logica", '<path d="M5 5h5v5H5zM14 14h5v5h-5zM10 7.5h4v9h-4"/>'],
  "evaluar-requisitos": ["evaluar", '<path d="M8 4H5v16h14V8l-4-4h-3M15 4v4h4M8 13l2.5 2.5L16 10"/>'],
  "establecer-requisitos": ["establecer", '<path d="M5 4h10l4 4v12H5zM15 4v4h4M8 12h5M8 16h5M16 13v5M13.5 15.5h5"/>'],
  comunicacion: ["comunicacion", '<path d="M4 5h16v12h-9l-5 3v-3H4zM8 9h8M8 13h5"/>'],
  tics: ["tics", '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 7l3 9M16 7l-3 9M8 6h8"/>'],
  matematicas: ["matematicas", '<path d="M5 8h13M7 8l-2 9M11 17l3-9 3 9M9 13h6"/>'],
  "clase-sabado-por-confirmar": ["pendiente", '<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/>']
};

export function competenceKey(id) {
  return VISUALES[id]?.[0] ?? "pendiente";
}

export function competenceLogo(id) {
  const [key, dibujo] = VISUALES[id] ?? VISUALES["clase-sabado-por-confirmar"];
  return '<span class="competence-emblem competence-emblem--' + key + '" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">' + dibujo + '</svg></span>';
}
