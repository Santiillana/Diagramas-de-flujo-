import test from "node:test";
import assert from "node:assert/strict";
import { createLabDemoTrace } from "../src/ui/lab.js";
import { exercises } from "../src/content/exercises.js";

test("el Laboratorio puede crear su ejemplo inicial con el intérprete sin una traza del Simulador",()=>{
 const trace=createLabDemoTrace();
 assert.equal(trace.isDemo,true);
 assert.equal(trace.exercise.id,1);
 assert.equal(trace.method.name,exercises[0].methods[0].name);
 assert.equal(trace.event.type,"program-start");
 assert.ok(trace.execution.ok);
 assert.deepEqual(trace.execution.outputs,[13]);
 assert.ok(trace.diagram.nodes.length>0);
 assert.ok(trace.diagram.edges.length>0);
 assert.equal(trace.source,trace.method.pseudocode);
});
test("la traza de ejemplo contiene snapshots para las seis actividades",()=>{
 const trace=createLabDemoTrace();
 assert.ok(trace.execution.events.some(event=>event.type==="input"));
 assert.ok(trace.execution.events.some(event=>event.type==="assignment"));
 assert.ok(trace.execution.events.some(event=>event.type==="output"));
 assert.ok(trace.execution.events.at(-1).type==="program-end");
 assert.ok(trace.execution.events.every(event=>event.variables&&Array.isArray(event.outputs)));
});
test("la demostración inicial no sustituye el pseudocódigo ni la muestra de un ejercicio real",()=>{
 const trace=createLabDemoTrace();
 assert.equal(trace.source,"leer a,b|s=a+b|imp s");
 assert.deepEqual(trace.method.sample,[8,5]);
 assert.deepEqual(trace.execution.outputs,[13]);
});
