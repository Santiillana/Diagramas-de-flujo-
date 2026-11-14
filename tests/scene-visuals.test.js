import test from "node:test";
import assert from "node:assert/strict";
import { executePseudocode } from "../src/core/interpreter.js";
import { renderSceneVisual } from "../src/ui/scene-visuals.js";

const sequence=executePseudocode("leer n|s=n+1|imp s",[4]);
const decision=executePseudocode("leer n|si n>=3|imp \"aprueba\"|sino|imp \"reprueba\"|fin",[2.5]);
const loop=executePseudocode("para i=1;i<=2;i++|imp i|fin",[]);
const missing=executePseudocode("leer n",[]);

test("cada evento de entrada, asignación, salida, inicio y fin tiene una visualización propia",()=>{
 const events=sequence.events;
 for(const type of ["program-start","input","assignment","output","program-end"]){
  const event=events.find(item=>item.type===type);
  assert.ok(event,"Falta evento "+type);
  assert.match(renderSceneVisual(event),new RegExp('data-scene-visual="'+type+'"'));
 }
});

test("las decisiones y ramas muestran la condición y la ruta V/F del snapshot",()=>{
 const decisionEvent=decision.events.find(item=>item.type==="decision");
 const branchEvent=decision.events.find(item=>item.type==="branch");
 assert.match(renderSceneVisual(decisionEvent),/data-scene-visual="decision"/);
 assert.match(renderSceneVisual(decisionEvent),/>F</);
 assert.match(renderSceneVisual(branchEvent),/data-scene-visual="decision"/);
 assert.match(renderSceneVisual(branchEvent),/n&gt;=3/);
});

test("Para visualiza preparación, condición, vuelta, avance y salida con valores reales",()=>{
 for(const type of ["loop-init","loop-condition","loop-enter","loop-update","loop-exit"]){
  const event=loop.events.find(item=>item.type===type);
  assert.ok(event,"Falta evento "+type);
  const html=renderSceneVisual(event);
  assert.ok(html.includes("data-scene-visual"),"Visual vacía para "+type);
 }
 assert.match(renderSceneVisual(loop.events.find(item=>item.type==="loop-enter")),/VUELTA/);
 assert.match(renderSceneVisual(loop.events.find(item=>item.type==="loop-update")),/→/);
});

test("el error muestra la detención sin inventar resultados",()=>{
 const event=missing.events.find(item=>item.type==="error");
 const html=renderSceneVisual(event);
 assert.match(html,/data-scene-visual="error"/);
 assert.match(html,/Falta un dato/);
});

test("los valores de la visualización proceden del evento y se escapan",()=>{
 const event=sequence.events.find(item=>item.type==="input");
 const html=renderSceneVisual(event);
 assert.match(html,/DATO RECIBIDO/);
 assert.match(html,/4/);
 assert.match(html,/SE GUARDA EN/);
 assert.doesNotMatch(html,/<script/i);
});
