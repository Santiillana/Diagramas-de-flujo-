const SPACE_META = {
  home: { title: "Traza", description: "Tu ficha y tu aprendizaje, en un solo lugar." },
  hoy: { title: "Hoy", description: "Tu agenda académica y lo que requiere tu atención." },
  semana: { title: "Semana", description: "Tu horario de clases y fechas de entrega." },
  calendario: { title: "Calendario", description: "Tus fechas académicas y actividades." },
  clases: { title: "Clases", description: "Tus materias, horarios y publicaciones oficiales." },
  actividades: { title: "Actividades", description: "Tus entregas, estados y retroalimentación." },
  biblioteca: { title: "Biblioteca", description: "Tus materiales y recursos de estudio." },
  learn: { title: "Aprende", description: "Comprende cada figura, decisión y ciclo con ejemplos y escenas propias." },
  exercises: { title: "Ejercicios", description: "Elige un problema y revisa qué necesitas para resolverlo." },
  simulator: { title: "Simulador", description: "Observa el algoritmo paso a paso y entiende cada cambio." },
  lab: { title: "Laboratorio", description: "Sigue la ficha, arma diagramas y encuentra errores." }
};

const FICHA_SPACES = new Set(["hoy", "semana", "calendario", "clases", "actividades", "biblioteca"]);
const APRENDE_SPACES = new Set(["learn", "exercises", "simulator", "lab"]);
const DEFAULT_LAST = { ficha: "hoy", aprende: "learn", section: "aprende" };
const LAST_KEY = "traza:v4:last";
const SPACE_LABELS = {
  hoy: "Hoy", semana: "Semana", calendario: "Calendario",
  clases: "Clases", actividades: "Actividades", biblioteca: "Biblioteca",
  learn: "Aprende", exercises: "Ejercicios", simulator: "Simulador", lab: "Laboratorio"
};

function readLastViews() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(LAST_KEY) || "null");
    return {
      ficha: FICHA_SPACES.has(saved?.ficha) ? saved.ficha : DEFAULT_LAST.ficha,
      aprende: APRENDE_SPACES.has(saved?.aprende) ? saved.aprende : DEFAULT_LAST.aprende,
      section: saved?.section === "ficha" ? "ficha" : "aprende"
    };
  } catch {
    return { ...DEFAULT_LAST };
  }
}

function saveLastViews(value) {
  try { window.localStorage.setItem(LAST_KEY, JSON.stringify(value)); }
  catch { /* El almacenamiento puede estar bloqueado. */ }
}

function sectionForSpace(space) {
  if (space === "home") return "home";
  return FICHA_SPACES.has(space) ? "ficha" : "aprende";
}

export function initNavigation() {
  const root = document.documentElement;
  const nav = document.querySelector("#primary-nav");
  const header = document.querySelector("#hd");
  const views = [...document.querySelectorAll("[data-view]")];
  const buttons = [...document.querySelectorAll("#primary-nav [data-space]")];
  const sectionSwitches = [...document.querySelectorAll("[data-section-switch]")];
  const groups = [...document.querySelectorAll("[data-subnav-section]")];
  if (!nav || !views.length || !buttons.length || !sectionSwitches.length) return;

  const lastViews = readLastViews();

  function updateHomeResume() {
    const resumeSpace = lastViews[lastViews.section] || DEFAULT_LAST[lastViews.section];
    const resumeButton = document.querySelector("#home-continue-button");
    const resumeDescription = document.querySelector("#home-continue-description");
    const learnButton = document.querySelector("#home-learn-continue");
    const fichaButton = document.querySelector("#home-open-ficha");
    if (resumeButton) {
      resumeButton.dataset.go = resumeSpace;
      const label = resumeButton.querySelector("span");
      if (label) label.textContent = "Continuar en " + SPACE_LABELS[resumeSpace];
    }
    if (resumeDescription) {
      resumeDescription.textContent = "Último espacio: " +
        (lastViews.section === "ficha" ? "Mi ficha · " : "Aprende · ") +
        SPACE_LABELS[resumeSpace] + ".";
    }
    if (learnButton) {
      learnButton.dataset.go = lastViews.aprende;
      const label = learnButton.querySelector("span");
      if (label) label.textContent = "Continuar en " + SPACE_LABELS[lastViews.aprende];
    }
    if (fichaButton) {
      fichaButton.dataset.go = lastViews.ficha;
      const label = fichaButton.querySelector("span");
      if (label) label.textContent = "Abrir " + SPACE_LABELS[lastViews.ficha].toLocaleLowerCase("es");
    }
  }

  function activate(space, options = {}) {
    if (space === "builder") space = "lab";
    const meta = SPACE_META[space];
    const target = views.find(view => view.dataset.view === space);
    if (!meta || !target) return;

    const section = sectionForSpace(space);
    for (const view of views) view.hidden = view !== target;
    for (const button of buttons) {
      const active = button.dataset.space === space;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    }
    for (const group of groups) {
      group.hidden = group.dataset.subnavSection !== section;
    }
    for (const button of sectionSwitches) {
      const active = button.dataset.sectionSwitch === section;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }

    root.dataset.section = section;
    document.body.dataset.activeSpace = space;
    document.body.dataset.activeSection = section;
    if (header) header.dataset.sectionSwitcherHidden = String(space === "simulator");
    document.title = meta.title + " · Traza";

    if (space !== "home") {
      lastViews[section] = space;
      lastViews.section = section;
      saveLastViews(lastViews);
    } else {
      updateHomeResume();
    }

    if (options.focus) {
      const heading = target.querySelector("h1,h2,h3");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({ preventScroll: true });
    }
    document.dispatchEvent(new CustomEvent("traza:space-change", {
      detail: { space, section }
    }));
  }

  for (const button of buttons) {
    button.addEventListener("click", () => activate(button.dataset.space));
  }
  for (const button of sectionSwitches) {
    button.addEventListener("click", () => {
      const section = button.dataset.sectionSwitch;
      activate(lastViews[section] || DEFAULT_LAST[section]);
    });
  }

  document.addEventListener("traza:navigate", event => {
    const space = event.detail?.space;
    if (SPACE_META[space]) activate(space, { focus: true });
  });

  nav.addEventListener("keydown", event => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    const visibleButtons = buttons.filter(button => !button.closest("[data-subnav-section]")?.hidden);
    const current = visibleButtons.indexOf(document.activeElement);
    if (current < 0 || !visibleButtons.length) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? visibleButtons.length - 1 :
      event.key === "ArrowRight" ? (current + 1) % visibleButtons.length :
      (current - 1 + visibleButtons.length) % visibleButtons.length;
    visibleButtons[next].focus();
    activate(visibleButtons[next].dataset.space);
  });

  document.addEventListener("click", event => {
    const shortcut = event.target.closest("[data-go]");
    if (!shortcut) return;
    const space = shortcut.dataset.go === "builder" ? "lab" : shortcut.dataset.go;
    if (!SPACE_META[space]) return;
    if (shortcut instanceof HTMLAnchorElement) event.preventDefault();
    activate(space, { focus: true });
  });

  updateHomeResume();
  activate("home");
}
