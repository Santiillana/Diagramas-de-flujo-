const SPACE_META = {
  learn: { kicker: "APRENDER", title: "Aprende a leer y construir diagramas de flujo.", description: "Avanza desde las primeras figuras hasta las decisiones y los ciclos, con ejemplos guiados." },
  exercises: { kicker: "RESOLVER", title: "Piensa el problema y encuentra una solución.", description: "Analiza los datos, organiza las instrucciones y comprueba el resultado." },
  simulator: { kicker: "OBSERVAR", title: "Mira cómo se ejecuta cada instrucción.", description: "Sigue el recorrido, observa los valores y entiende por qué cambia cada variable." },
  lab: { kicker: "PRACTICAR", title: "Practica, prueba y corrige tus ideas.", description: "Resuelve retos breves y compara tus respuestas con la ejecución real." },
  builder: { kicker: "CONSTRUIR", title: "Construye un diagrama paso a paso.", description: "Elige figuras, organiza el flujo y comprueba que tu algoritmo pueda ejecutarse." }
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
      const targetHeading = document.querySelector("#space-heading");
      if (targetHeading) {
        targetHeading.setAttribute("tabindex", "-1");
        targetHeading.focus({ preventScroll: true });
      }
    }
  }

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest("[data-space]");
    if (button) console.log("TRAZA_NAV_CLICK", button.dataset.space, nav.contains(button));
    if (button && nav.contains(button)) {
      activate(button.dataset.space);
      console.log("TRAZA_NAV_ACTIVE", document.body.dataset.activeSpace, views.map(view => [view.dataset.view, view.hidden]));
    }
  }, true);
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
