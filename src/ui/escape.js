/**
 * Escape text before inserting it into HTML templates.
 * Single implementation shared by the UI and SVG renderer.
 */
export function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}
