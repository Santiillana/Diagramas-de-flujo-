import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL(path, import.meta.url), "utf8");

test("la salida tiene una sola numeración visible", async () => {
  const [simulator, css] = await Promise.all([
    read("../src/ui/simulator.js"),
    read("../src/styles/simulator.css")
  ]);
  assert.match(simulator, /output-index/);
  assert.match(css, /\.simulator-output\s*\{[^}]*list-style:\s*none/s);
});

test("hidden es una regla global y cubre placeholders con display explícito", async () => {
  const css = await read("../src/styles/components.css");
  assert.match(css, /\[hidden\]\s*\{\s*display:\s*none\s*!important/s);
});

test("el andamio ya no presenta la interfaz como una base técnica", async () => {
  const html = await read("../index.html");
  assert.doesNotMatch(html, /BASE 01|REGISTRO DETERMINISTA|VISTA CENTRAL|SVG SINCRONIZADO/);
  assert.match(html, /RECORRIDO DEL ALGORITMO/);
});

test("el constructor conserva el SVG válido y genera vista previa tras los cambios", async () => {
  const builder = await read("../src/ui/builder.js");
  const dirty = builder.slice(builder.indexOf("function markDirty("), builder.indexOf("function scopeTitle("));
  assert.match(dirty, /compileFlow\(model\)/);
  assert.match(dirty, /renderDiagram\(\$\("#builder-diagram"\),diagramModel\)/);
  assert.doesNotMatch(dirty, /\$\("#builder-diagram"\)\.innerHTML\s*=/);
  assert.match(dirty, /Se conserva el último diagrama válido/);
  assert.match(builder, /builder-node-error/);
});
