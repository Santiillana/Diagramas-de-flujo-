import test from "node:test";
import assert from "node:assert/strict";
import { exercises } from "../src/content/exercises.js";
import { referenceOutput } from "../src/content/reference-oracle.js";


function assertOutput(actual, expected, context) {
  assert.equal(actual.length, expected.length, context + ": cantidad de salidas");
  for (let i = 0; i < expected.length; i++) {
    if (typeof expected[i] === "number") {
      assert.equal(typeof actual[i], "number", context + ": tipo de salida " + i);
      assert.ok(Math.abs(actual[i] - expected[i]) < 1e-9,
        context + ": salida " + i + " (esperada " + expected[i] + ", calculada " + actual[i] + ")");
    } else {
      assert.equal(actual[i], expected[i], context + ": salida " + i);
    }
  }
}

test("cada resultado esperado de los 40 ejercicios coincide con un cálculo independiente", async t => {
  let scenarios = 0;
  for (const item of exercises) {
    for (const method of item.methods) {
      for (const scenario of method.tests) {
        await t.test("E" + item.id + " · " + method.name + " · " + scenario.name, () => {
          const actual = referenceOutput(item.id, scenario.input);
          assertOutput(actual, scenario.expected, "E" + item.id + " / " + scenario.name);
        });
        scenarios++;
      }
    }
  }
  assert.ok(scenarios >= 170, "Se deben comprobar al menos 170 escenarios por método.");
});
