import test from "node:test";
import assert from "node:assert/strict";
import { exercises } from "../src/content/exercises.js";
import { executePseudocode } from "../src/core/interpreter.js";

const expert = exercises.filter(item => item.level === "expert");

test("hay cinco retos expertos de matemáticas y algoritmos", () => {
  assert.equal(expert.length, 5);
  assert.deepEqual(expert.map(item => item.id), [41,42,43,44,45]);
});

test("los cinco programas expertos se pueden ejecutar con sus datos de ejemplo", () => {
  for (const item of expert) {
    const result = executePseudocode(item.methods[0].pseudocode, item.methods[0].sample);
    assert.equal(result.ok, true, item.title + ": " + result.error?.message);
    assert.ok(result.events.length > 0);
  }
});

test("Euclides calcula MCD, MCM y número de iteraciones", () => {
  const item = expert.find(x => x.id === 41);
  const result = executePseudocode(item.methods[0].pseudocode, [48,18]);
  assert.deepEqual(result.outputs, [6,144,4]);
});

test("la búsqueda exhaustiva clasifica primos y compuestos", () => {
  const item = expert.find(x => x.id === 42);
  const prime = executePseudocode(item.methods[0].pseudocode, [13]);
  const composite = executePseudocode(item.methods[0].pseudocode, [12]);
  assert.deepEqual(prime.outputs, ["PRIMO",1,1]);
  assert.deepEqual(composite.outputs, ["COMPUESTO",5,16]);
});

test("Cramer resuelve el sistema identidad y detecta singularidad", () => {
  const item = expert.find(x => x.id === 43);
  const solved = executePseudocode(item.methods[0].pseudocode, [1,0,0,0,1,0,0,0,1,2,3,4]);
  assert.deepEqual(solved.outputs, [1,2,3,4]);
  const singular = executePseudocode(item.methods[0].pseudocode, [1,2,3,2,4,6,0,0,1,1,2,3]);
  assert.deepEqual(singular.outputs, ["SISTEMA SINGULAR"]);
});

test("Newton–Raphson converge a la raíz positiva del polinomio", () => {
  const item = expert.find(x => x.id === 44);
  const result = executePseudocode(item.methods[0].pseudocode, [2,0.000001,20]);
  assert.equal(result.ok, true);
  assert.ok(Math.abs(result.outputs[0]-2.09455148)<0.00001);
  assert.ok(Math.abs(result.outputs[1])<0.00001);
});

test("Simpson 1/3 aproxima pi sobre cuatro y rechaza intervalos impares", () => {
  const item = expert.find(x => x.id === 45);
  const result = executePseudocode(item.methods[0].pseudocode, [0,1,10]);
  assert.ok(Math.abs(result.outputs[0]-Math.PI/4)<0.000001);
  const odd = executePseudocode(item.methods[0].pseudocode, [0,1,3]);
  assert.deepEqual(odd.outputs, ["N DEBE SER PAR"]);
});
