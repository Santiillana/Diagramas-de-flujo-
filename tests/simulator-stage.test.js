import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read=path=>readFile(new URL(path,import.meta.url),"utf8");
test("el escenario declara paneles flotantes y acciones accesibles",async()=>{
 const html=await read("../index.html");
 assert.match(html,/id="simulator-grid"/);
 for(const name of ["problem","scene","variables","output","history"]){
  assert.match(html,new RegExp('data-floating-panel="'+name+'"'));
  assert.match(html,new RegExp('data-panel-collapse="'+name+'"'));
  assert.match(html,new RegExp('data-panel-hide="'+name+'"'));
 }
 assert.match(html,/id="simulator-panels-toggle"/);
});
test("el gestor persiste paneles, responde a H y permite arrastre con puntero",async()=>{
 const manager=await read("../src/ui/simulator-panels.js");
 for(const pattern of [/localStorage\.setItem/,/catch\s*\{\s*\}/,/event\.key\.toLowerCase\(\)==="h"/,/setPointerCapture/,/data-userExpanded/])assert.match(manager,pattern);
});
test("la cámara calcula área libre entre paneles y dock",async()=>{
 const simulator=await read("../src/ui/simulator.js");
 for(const pattern of [/function getAvailableDiagramRect/,/problem\.getBoundingClientRect\(\)\.right/,/inspector\.getBoundingClientRect\(\)\.left/,/dock\.getBoundingClientRect\(\)\.top/,/available\.width/,/available\.height/])assert.match(simulator,pattern);
});
test("el escenario libera el simulador del contenedor y adapta móvil",async()=>{
 const css=await read("../src/styles/simulator-stage.css");
 for(const pattern of [/position:fixed/,/backdrop-filter:blur/,/@media\(max-width:760px\)/,/simulator-mobile-tabs/])assert.match(css,pattern);
});
