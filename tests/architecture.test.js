import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("la navegación declara los cinco espacios de la plataforma", async () => {
  const html = await read("../index.html");
  for (const space of ["learn", "exercises", "simulator", "lab", "builder"]) {
    assert.match(html, new RegExp('data-space="' + space + '"'));
    assert.match(html, new RegExp('data-view="' + space + '"'));
  }
});

test("el simulador reserva las vistas pedagógicas y el dock", async () => {
  const html = await read("../index.html");
  for (const marker of ["problem-panel", "diagram-panel", "scene-panel", "variables-panel", "execution-dock"]) {
    assert.ok(html.includes(marker), "Falta la zona " + marker);
  }
});

test("el laboratorio registra las ocho actividades", async () => {
  const html = await read("../index.html");
  const lab = await read("../src/ui/lab.js");
  for (const activity of ["Predice", "Tabla de seguimiento", "Ordena instrucciones", "Identifica símbolo", "Encuentra el error", "¿Y si…?"]) {
    assert.ok(html.includes(activity), "Falta la actividad " + activity);
  }
  for (const id of ["fill-gap", "follow-arrow"]) {
    assert.ok(lab.includes('addLabActivity("' + id + '"'), "Falta registrar la actividad " + id);
  }
});

test("la interfaz contempla tabletas y móviles", async () => {
  const css = await read("../src/styles/responsive.css");
  assert.match(css, /max-width:\s*1080px/);
  assert.match(css, /max-width:\s*760px/);
  assert.match(css, /max-width:\s*440px/);
});

test("el movimiento reducido se puede activar y respeta la preferencia del sistema", async () => {
  const css = await read("../src/styles/motion.css");
  const preferences = await read("../src/ui/preferences.js");
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /data-motion="reduced"/);
  assert.match(preferences, /prefers-reduced-motion:\s*reduce/);
  assert.match(preferences, /toggle-motion/);
});

test("el prototipo original permanece accesible durante la transición", async () => {
  const html = await read("../index.html");
  assert.match(html, /reference\/diagramas_de_flujo_original\.html/);
});

test("la nueva capa de interfaz no ejecuta pseudocódigo como JavaScript", async () => {
  const app = await read("../src/app.js");
  const navigation = await read("../src/ui/navigation.js");
  const preferences = await read("../src/ui/preferences.js");
  const source = [app, navigation, preferences].join("\n");
  assert.doesNotMatch(source, /\beval\s*\(/);
  assert.doesNotMatch(source, /new\s+Function\s*\(/);
});
