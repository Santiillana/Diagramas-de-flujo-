import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("la navegación declara portada y espacios de Mi ficha y Aprende", async () => {
  const html = await read("../index.html");
  const spaces = [...html.matchAll(/data-space="([^"]+)"/g)].map(([,space]) => space);
  const views = [...html.matchAll(/data-view="([^"]+)"/g)].map(([,space]) => space);
  assert.deepEqual(spaces, ["home", "hoy", "clases", "biblioteca", "learn", "exercises", "simulator", "lab"]);
  assert.deepEqual(new Set(views), new Set(["home", "hoy", "clases", "actividades", "biblioteca", "learn", "exercises", "simulator", "lab"]));
  assert.doesNotMatch(html, /data-space="builder"/);
  assert.doesNotMatch(html, /data-view="builder"/);
  assert.match(html, /data-subnav-section="ficha"/);
  assert.match(html, /data-subnav-section="aprende"/);
});

test("Inicio ofrece dos enlaces completos y accesibles sin accesos secundarios", async () => {
  const html = await read("../index.html");
  const home = html.match(/<section class="space-view home-view"[\s\S]*?<\/section>/)?.[0] || "";
  const navigation = await read("../src/ui/navigation.js");
  const shell = await read("../src/styles/shell.css");
  assert.equal([...home.matchAll(/<a class="home-card"/g)].length, 2);
  assert.match(home, /data-go="hoy"/);
  assert.match(home, /data-go="learn"/);
  assert.doesNotMatch(home, /home-continue|home-shortcut|home-learning-progress/);
  assert.match(navigation, /event\.key !== " "[\s\S]*card\.click\(\)/);
  assert.match(shell, /\.home-card-enter/);
  assert.match(shell, /\.home-flow \.flow-ball/);
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

test("Ejercicios conserva 45 retos y expone filtros, accesos rápidos y ficha protegida",async()=>{
  const html=await read("../index.html");
  const source=await read("../src/ui/content-view.js");
  for(const id of ["exercise-count","exercise-level-shortcuts","exercise-search","exercise-level","exercise-class-only","exercise-concepts","exercise-concepts-summary","exercise-filter-summary","exercise-active-filters","exercise-filters-clear","exercise-grid","exercise-detail","exercise-try-modal"]){
    assert.match(html,new RegExp('id="'+id+'"'),"Falta el control "+id);
  }
  assert.match(source,/const quickLevels=\[/,"Falta el conjunto de accesos rápidos por dificultad.");
  for(const level of ["all","basic","intermediate","advanced","expert"]){
    assert.match(source,new RegExp('\\["'+level+'"'),"Falta el nivel "+level);
  }
  assert.ok(source.includes("const CLASS_EXERCISES = new Set([22,23,24,28]);"),"Los cuatro retos de clase no deben cambiar.");
  assert.match(source,/function renderExerciseCards\(\)/);
  assert.match(source,/function renderExerciseDetail\(\)/);
  assert.match(source,/data-start-exercise/);
  assert.match(source,/data-exercise-level-shortcut/);
  assert.match(source,/exercise-level-shortcut/);
});


test("Mi ficha consolida Clases en vistas diaria, semanal y mensual", async () => {
  const html = await read("../index.html");
  const app = await read("../src/app.js");
  const classes = await read("../src/ficha/view-clases.js");
  assert.match(html, /data-space="clases"/);
  assert.match(html, /id="view-clases" data-view="clases"/);
  assert.match(app, /initFicha/);
  for (const marker of ["data-class-view", "data-class-week", "data-class-month", "data-class-date", "aria-activedescendant", "Sin registro de este día"]) {
    assert.ok(classes.includes(marker), "Falta el comportamiento de Clases: " + marker);
  }
  assert.doesNotMatch(html, /data-space="semana"|data-space="calendario"/);
});
