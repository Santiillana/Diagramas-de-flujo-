import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read=path=>readFile(new URL(path,import.meta.url),"utf8");

test("la ficha animada usa la geometría de una arista SVG real",async()=>{
 const renderer=await read("../src/diagram/renderer.js");
 assert.match(renderer,/export function animateDiagramTransition/);
 assert.match(renderer,/getTotalLength/);
 assert.match(renderer,/getPointAtLength/);
 assert.match(renderer,/requestAnimationFrame/);
 assert.match(renderer,/is-token-path/);
 assert.match(renderer,/previousId/);
 assert.match(renderer,/activeId/);
});
test("la ficha puede recorrer una conexión en sentido inverso y respeta movimiento reducido",async()=>{
 const renderer=await read("../src/diagram/renderer.js");
 assert.match(renderer,/const reverse = direct \? null/);
 assert.match(renderer,/const backwards = Boolean\(reverse\)/);
 assert.match(renderer,/mode === "off" \|\| mode === "reduced" \|\| systemReduced/);
});
test("el simulador anima pasos adyacentes y escala con la velocidad",async()=>{
 const simulator=await read("../src/ui/simulator.js");
 assert.match(simulator,/lastRenderedStep/);
 assert.match(simulator,/Math\.abs\(timeline\.index-priorIndex\)===1/);
 assert.match(simulator,/animateDiagramTransition/);
 assert.match(simulator,/Math\.round\(850\/speedFactor\(\)\)/);
 assert.match(simulator,/--simulator-speed-factor/);
});
test("las decisiones distinguen rutas V y F",async()=>{
 const renderer=await read("../src/diagram/renderer.js");
 assert.match(renderer,/is-route-true/);
 assert.match(renderer,/is-route-false/);
 assert.match(renderer,/edge\.label==="V"/);
 assert.match(renderer,/edge\.label==="F"/);
});
test("el control de movimiento presenta tres modos y los persiste",async()=>{
 const [preferences,motion,css]=await Promise.all([
  read("../src/ui/preferences.js"),read("../src/styles/motion.css"),read("../src/styles/simulator.css")
 ]);
 for(const mode of ["full","reduced","off"])assert.ok(preferences.includes('"'+mode+'"'),"Falta modo "+mode);
 assert.match(preferences,/MOTION_MODES\s*=\s*\[\s*"full",\s*"reduced",\s*"off"\s*\]/);
 assert.match(preferences,/localStorage/);
 assert.match(motion,/:root\[data-motion="reduced"\]/);
 assert.match(motion,/:root\[data-motion="off"\]/);
 assert.match(css,/diagram-edge\.is-route-true/);
 assert.match(css,/diagram-edge\.is-route-false/);
});
