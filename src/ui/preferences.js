const STORAGE_KEYS = { theme: "traza-theme", motion: "traza-motion" };

function readPreference(key, fallback) {
  try { return window.localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function savePreference(key, value) {
  try { window.localStorage.setItem(key, value); } catch { /* Storage puede estar bloqueado. */ }
}

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
    root.dataset.motion = motion;
    if (motionButton) {
      const reduced = motion === "reduced";
      motionButton.setAttribute("aria-pressed", String(reduced));
      motionButton.setAttribute("aria-label", reduced ? "Activar movimiento" : "Reducir movimiento");
      motionButton.title = reduced ? "Activar movimiento" : "Reducir movimiento";
    }
    savePreference(STORAGE_KEYS.motion, motion);
  }
  themeButton?.addEventListener("click", () => applyTheme(root.dataset.theme === "dark" ? "light" : "dark"));
  motionButton?.addEventListener("click", () => applyMotion(root.dataset.motion === "reduced" ? "full" : "reduced"));
  applyTheme(readPreference(STORAGE_KEYS.theme, "light") === "dark" ? "dark" : "light");
  applyMotion(readPreference(STORAGE_KEYS.motion, prefersReduced ? "reduced" : "full") === "reduced" ? "reduced" : "full");
}
