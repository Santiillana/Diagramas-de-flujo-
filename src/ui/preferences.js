const STORAGE_KEYS = {
  legacyTheme: "traza:v2:theme",
  themePrefix: "traza:v4:theme:",
  motion: "traza:v2:motion"
};
const DEFAULT_THEMES = { home: "dark", aprende: "dark", ficha: "light" };

function readPreference(key, fallback, legacyKey) {
  try {
    return window.localStorage.getItem(key) ||
      (legacyKey ? window.localStorage.getItem(legacyKey) : null) || fallback;
  } catch {
    return fallback;
  }
}

function savePreference(key, value) {
  try { window.localStorage.setItem(key, value); }
  catch { /* El almacenamiento puede estar bloqueado. */ }
}

function readSectionTheme(section) {
  const saved = readPreference(STORAGE_KEYS.themePrefix + section, null);
  if (saved === "dark" || saved === "light") return saved;

  if (section === "aprende") {
    const legacy = readPreference(STORAGE_KEYS.legacyTheme, DEFAULT_THEMES.aprende, "traza-theme");
    return legacy === "light" ? "light" : "dark";
  }
  return DEFAULT_THEMES[section] || "dark";
}

export function initPreferences() {
  const root = document.documentElement;
  const themeButton = document.querySelector('[data-action="toggle-theme"]');
  const motionButton = document.querySelector('[data-action="toggle-motion"]');
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  function applyTheme(theme, section = root.dataset.section || "home") {
    const normalized = theme === "light" ? "light" : "dark";
    root.dataset.theme = normalized;
    savePreference(STORAGE_KEYS.themePrefix + section, normalized);

    if (themeButton) {
      const dark = normalized === "dark";
      themeButton.setAttribute("aria-pressed", String(dark));
      themeButton.setAttribute("aria-label", dark ? "Activar tema claro" : "Activar tema oscuro");
      themeButton.title = dark ? "Activar tema claro" : "Activar tema oscuro";
    }
  }

  function applyMotion(motion) {
    root.dataset.motion = motion;
    if (motionButton) {
      const reduced = motion === "reduced";
      motionButton.setAttribute("aria-pressed", String(reduced));
      motionButton.setAttribute("aria-label", reduced ? "Activar movimiento" : "Reducir movimiento");
      motionButton.title = reduced ? "Activar movimiento" : "Reducir movimiento";
    }
    savePreference(STORAGE_KEYS.motion, motion);
  }

  themeButton?.addEventListener("click", () => {
    const section = root.dataset.section || "home";
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark", section);
  });
  motionButton?.addEventListener("click", () => {
    applyMotion(root.dataset.motion === "reduced" ? "full" : "reduced");
  });

  document.addEventListener("traza:space-change", event => {
    const section = event.detail?.section || root.dataset.section || "home";
    applyTheme(readSectionTheme(section), section);
  });

  const initialSection = root.dataset.section || "home";
  applyTheme(readSectionTheme(initialSection), initialSection);
  applyMotion(readPreference(
    STORAGE_KEYS.motion,
    prefersReduced ? "reduced" : "full",
    "traza-motion"
  ) === "reduced" ? "reduced" : "full");
}
