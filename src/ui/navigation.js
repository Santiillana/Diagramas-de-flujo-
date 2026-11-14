const SPACE_META = {
  learn: { kicker: "ESPACIO 01 / 05 · CONOCIMIENTO", title: "Entiende la lógica que sostiene cada diagrama.", description: "Lecciones breves y visuales, organizadas para avanzar desde los fundamentos hasta las estructuras de repetición." },
  exercises: { kicker: "ESPACIO 02 / 05 · PRÁCTICA GUIADA", title: "Piensa el problema. Después, dibuja el camino.", description: "Un entorno para entender cómo se transforma una idea en instrucciones claras y verificables." },
  simulator: { kicker: "ESPACIO 03 / 05 · EJECUCIÓN VISUAL", title: "Observa cómo avanza cada instrucción.", description: "Diagrama, explicación y variables compartirán el mismo estado de ejecución." },
  lab: { kicker: "ESPACIO 04 / 05 · EXPERIMENTACIÓN", title: "Pon a prueba tu razonamiento.", description: "Predice, compara, ordena y encuentra errores con el contexto del algoritmo siempre a la vista." },
  builder: { kicker: "ESPACIO 05 / 05 · CONSTRUCCIÓN", title: "Representa una solución con tus propias conexiones.", description: "Un lienzo para crear diagramas completos con símbolos, rutas y validación estructural." }
};

export function initNavigation() {
  const nav = document.querySelector("#primary-nav");
  const heading = document.querySelector("#space-heading");
  const kicker = document.querySelector("#space-kicker");
  const description = document.querySelector("#space-description");
  const views = [...document.querySelectorAll("[data-view]")];
  const buttons = [...document.querySelectorAll("[data-space]")];
  if (!nav || !heading || !kicker || !description || !views.length || !buttons.length) return;

  function activate(space, options = {}) {
    const meta = SPACE_META[space];
    const target = views.find((view) => view.dataset.view === space);
    if (!meta || !target) return;
    for (const view of views) view.hidden = view !== target;
    for (const button of buttons) {
      const active = button.dataset.space === space;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    }
    kicker.textContent = meta.kicker;
    heading.textContent = meta.title;
    description.textContent = meta.description;
    document.body.dataset.activeSpace = space;
    document.title = meta.title + " · Traza";
    if (options.focus) {
      const targetHeading = target.querySelector("h2");
      if (targetHeading) {
        targetHeading.setAttribute("tabindex", "-1");
        targetHeading.focus({ preventScroll: true });
      }
    }
  }

  nav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-space]");
    if (button && nav.contains(button)) activate(button.dataset.space);
  });
  nav.addEventListener("keydown", (event) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    const current = buttons.indexOf(document.activeElement);
    if (current < 0) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 :
      event.key === "ArrowRight" ? (current + 1) % buttons.length : (current - 1 + buttons.length) % buttons.length;
    buttons[next].focus();
    activate(buttons[next].dataset.space);
  });
  document.addEventListener("click", (event) => {
    const shortcut = event.target.closest("[data-go]");
    if (!shortcut || !SPACE_META[shortcut.dataset.go]) return;
    activate(shortcut.dataset.go, { focus: true });
    buttons.find((button) => button.dataset.space === shortcut.dataset.go)?.focus({ preventScroll: true });
  });
  activate("exercises");
}
