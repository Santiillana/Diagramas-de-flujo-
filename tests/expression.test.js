import test from "node:test";
import assert from "node:assert/strict";
import { parseExpression, evaluateExpression } from "../src/core/expression.js";

const run = (source,variables={}) => evaluateExpression(parseExpression(source),variables);

test("respeta paréntesis y precedencia aritmética",()=>{
  assert.equal(run("(3+4)*2-5"),9);
  assert.equal(run("10-6/2"),7);
  assert.equal(run("-2*3+10"),4);
  assert.equal(run("8/2/2"),2);
});

test("resuelve comparaciones y operadores lógicos",()=>{
  assert.equal(run("n>=3 Y n<=5",{n:4}),true);
  assert.equal(run("n<0 O n>5",{n:7}),true);
  assert.equal(run("NO (n=3)",{n:4}),true);
  assert.equal(run("n<>0",{n:0}),false);
  assert.equal(run("a= b",{a:4,b:4}),true);
});

test("resuelve valores literales de texto y variables",()=>{
  assert.equal(run('"positivo"'),"positivo");
  assert.equal(run("x+2",{x:3}),5);
});

test("rechaza sintaxis, variables y operaciones no válidas",()=>{
  assert.throws(()=>parseExpression("2 ** 3"));
  assert.throws(()=>run("x+1"));
  assert.throws(()=>run("8/0"));
  assert.throws(()=>run("2 Y 3"));
  assert.throws(()=>run("NO 2"));
});


test("traza el desglose aritmético en el orden real de evaluación",async()=>{
  const {traceExpression}=await import("../src/core/expression.js");
  const trace=traceExpression("a+b*c",{a:2,b:3,c:4});
  assert.equal(trace.value,14);
  assert.deepEqual(trace.steps.map(step=>[step.left,step.operator,step.right,step.result]),[
    [3,"*",4,12],[2,"+",12,14]
  ]);
});

test("el desglose respeta cortocircuito lógico y no evalúa la rama omitida",async()=>{
  const {traceExpression}=await import("../src/core/expression.js");
  const trace=traceExpression("f Y 1/0=0",{f:false});
  assert.equal(trace.value,false);
  assert.equal(trace.steps.length,1);
  assert.equal(trace.steps[0].shortCircuited,true);
});
