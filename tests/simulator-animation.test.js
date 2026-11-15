import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read=path=>readFile(new URL(path,import.meta.url),"utf8");

test("la ficha recorre el conector SVG real con duración ligada a su longitud",async()=>{
 const renderer=await read("../src/diagram/renderer.js");
 assert.match(renderer,/export function animateDiagramTransition/);
 assert.match(renderer,/getTotalLength/);
 assert.match(renderer,/getPointAtLength/);
 assert.match(renderer,/requestAnimationFrame/);
 assert.match(renderer,/Math\.min\(500\+total\*1\.6,1500\)/);
 assert.match(renderer,/cubicBezierProgress/);
 assert.match(renderer,/flow-trail/);
});
test("preparación, condición y avance del Para animan el mismo nodo con un salto corto",async()=>{
 const renderer=await read("../src/diagram/renderer.js");
 assert.match(renderer,/if\(activeId===previousId\)/);
 assert.match(renderer,/220\/speed/);
 assert.match(renderer,/Math\.sin\(progress\*Math\.PI\)\*6/);
});
test("la cámara sigue a la ficha y las ramas V/F tienen estado semántico",async()=>{
 const [simulator,renderer]=await Promise.all([read("../src/ui/simulator.js"),read("../src/diagram/renderer.js")]);
 assert.match(simulator,/onFrame:point=>centerDiagramPoint\(point\)/);
 assert.match(renderer,/is-active-true/);
 assert.match(renderer,/is-active-false/);
 assert.match(renderer,/is-route-unchosen/);
});
test("el movimiento reducido muestra el estado sin animar la ficha",async()=>{
 const renderer=await read("../src/diagram/renderer.js");
 assert.match(renderer,/reduced\|\|!activeId\|\|!previousId/);
});
