import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("la navegación declara portada y espacios de Mi ficha y Aprende", async () => {
  const html = await read("../index.html");
  const spaces = [...html.matchAll(/data-space="([^"]+)"/g)].map(([,space]) => space);
  const views = [...html.matchAll(/data-view="([^"]+)"/g)].map(([,space]) => space);
  assert.deepEqual(spaces, ["home", "hoy", "semana", "calendario", "actividades", "biblioteca", "learn", "exercises", "simulator", "lab"]);
  assert.deepEqual(new Set(views), new Set(["home", "hoy", "semana", "calendario", "actividades", "biblioteca", "learn", "exercises", "simulator", "lab"]));
  assert.doesNotMatch(html, /data-space="builder"/);
  assert.doesNotMatch(html, /data-view="builder"/);
  assert.match(html, /data-subnav-section="ficha"/);
  assert.match(html, /data-subnav-section="aprende"/);
});

test("el simulador reserva las cuatro ventanas pedagógicas y el dock", async () => {
  const html = await read("../index.html");
  for (const marker of ["problem-panel", "diagram-panel", "scene-panel", "variables-panel", "execution-dock"]) {
    assert.ok(html.includes(marker), "Falta la zona " + marker);
  }
  for (const id of ["sim-window-context", "sim-window-code", "PV", "PR", "dock"]) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
});

test("el laboratorio organiza ocho actividades en tres formas de práctica", async () => {
  const html = await read("../index.html");
  const lab = await read("../src/ui/lab.js");
  for (const mode of ["read", "build", "debug"]) {
    assert.match(html, new RegExp('data-lab-mode="' + mode + '"'), "Falta el modo " + mode);
  }
  assert.match(html, /id="lab-activity-list"/);
  const activities = [
    ["predict", "Predice el paso"],
    ["table", "Tabla de seguimiento"],
    ["follow-arrow", "Sigue la flecha"],
    ["order", "Ordena instrucciones"],
    ["symbol", "Elige la figura"],
    ["fill-gap", "Completa el hueco"],
    ["error", "Encuentra el error"],
    ["whatif", "Compara dos recorridos"]
  ];
  for (const [id, title] of activities) {
    assert.ok(lab.includes('"'+id+'"'), "Falta registrar la actividad " + id);
    assert.ok(lab.includes('"'+title+'"'), "Falta el título de la actividad " + title);
  }
  assert.match(html, /id="lab-builder-stage"/, "El constructor debe estar dentro del Laboratorio");
  assert.match(html, /id="builder-canvas-list"/, "Falta el lienzo libre del constructor");
  assert.doesNotMatch(html, /data-view="builder"/);
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
