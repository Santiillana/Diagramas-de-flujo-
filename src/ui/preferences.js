const STORAGE_KEYS = { theme: "traza-theme", motion: "traza-motion" };

function readPreference(key, fallback) {
  try { return window.localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function savePreference(key, value) {
  try { window.localStorage.setItem(key, value); } catch { /* Storage puede estar bloqueado. */ }
}

const MOTION_MODES = ["full", "reduced", "off"];
const MOTION_LABELS = { full: "Completo", reduced: "Reducido", off: "Apagado" };

export function initPreferences() {
  const root = document.documentElement;
  const themeButton = document.querySelector('[data-action="toggle-theme"]');
  const motionButton = document.querySelector('[data-action="toggle-motion"]');
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  function applyTheme(theme) {
    root.dataset.theme = theme;
    if (themeButton) {
      const dark = theme === "dark";
      themeButton.setAttribute("aria-pressed", String(dark));
      themeButton.setAttribute("aria-label", dark ? "Activar tema claro" : "Activar tema oscuro");
      themeButton.title = dark ? "Activar tema claro" : "Activar tema oscuro";
    }
    savePreference(STORAGE_KEYS.theme, theme);
  }
  function applyMotion(motion) {
    const mode = MOTION_MODES.includes(motion) ? motion : "full";
    root.dataset.motion = mode;
    if (motionButton) {
      const next = MOTION_MODES[(MOTION_MODES.indexOf(mode) + 1) % MOTION_MODES.length];
      motionButton.setAttribute("aria-pressed", String(mode !== "full"));
      motionButton.setAttribute("aria-label", "Movimiento " + MOTION_LABELS[mode] + ". Siguiente: " + MOTION_LABELS[next]);
      motionButton.title = "Movimiento: " + MOTION_LABELS[mode] + " · Cambiar a " + MOTION_LABELS[next];
      motionButton.dataset.motionMode = mode;
    }
    savePreference(STORAGE_KEYS.motion, mode);
  }
  themeButton?.addEventListener("click", () => applyTheme(root.dataset.theme === "dark" ? "light" : "dark"));
  motionButton?.addEventListener("click", () => {
    const current = MOTION_MODES.includes(root.dataset.motion) ? root.dataset.motion : "full";
    applyMotion(MOTION_MODES[(MOTION_MODES.indexOf(current) + 1) % MOTION_MODES.length]);
  });
  applyTheme(readPreference(STORAGE_KEYS.theme, "light") === "dark" ? "dark" : "light");
  const storedMotion = readPreference(STORAGE_KEYS.motion, prefersReduced ? "reduced" : "full");
  applyMotion(MOTION_MODES.includes(storedMotion) ? storedMotion : (prefersReduced ? "reduced" : "full"));
}
