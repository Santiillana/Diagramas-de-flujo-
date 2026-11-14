import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { escapeHTML } from "../src/ui/escape.js";

test("escapeHTML codifica los cinco caracteres con significado en HTML", () => {
  assert.equal(escapeHTML(`&<>"'`), "&amp;&lt;&gt;&quot;&#39;");
  assert.equal(escapeHTML(null), "");
  assert.equal(escapeHTML(42), "42");
});

test("las vistas y el renderizador comparten una única implementación", async () => {
  const paths = [
    "../src/ui/content-view.js",
    "../src/ui/simulator.js",
    "../src/ui/lab.js",
    "../src/ui/builder.js",
    "../src/diagram/renderer.js"
  ];
  const sources = await Promise.all(paths.map(path =>
    readFile(new URL(path, import.meta.url), "utf8")
  ));
  for (const [index, source] of sources.entries()) {
    assert.match(source, /escapeHTML/, "Falta la utilidad compartida en " + paths[index]);
    assert.doesNotMatch(source, /replace\(\/\[&<>/, "Hay otro escape HTML local en " + paths[index]);
  }
});
