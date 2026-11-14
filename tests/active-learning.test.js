import test from "node:test";
import assert from "node:assert/strict";
import { exercises } from "../src/content/exercises.js";
import { executePseudocode } from "../src/core/interpreter.js";

const same=(actual,expected)=>actual.length===expected.length&&actual.every((value,index)=>
 typeof value==="number"&&typeof expected[index]==="number"
  ?Math.abs(value-expected[index])<=1e-9
  :Object.is(value,expected[index]));

test("cada ficha ofrece metadatos suficientes para progreso y diagnóstico",()=>{
 assert.equal(exercises.length,40);
 for(const item of exercises){
  assert.ok(item.title);
  assert.ok(item.methods.length>=1);
  assert.ok(item.methods.every(method=>method.tests.length>=1));
 }
});

test("las muestras de los métodos se pueden ejecutar con el intérprete único",()=>{
 for(const item of exercises){
  for(const method of item.methods){
   const execution=executePseudocode(method.pseudocode,method.sample);
   assert.equal(execution.ok,true,item.id+" · "+method.name+" debe ejecutarse");
   assert.ok(Array.isArray(execution.outputs),item.id+" · "+method.name+" debe devolver una salida trazable");
  }
 }
});

test("el conjunto independiente de todos los métodos tiene casos verificables",()=>{
 let total=0,passed=0;
 for(const item of exercises){
  for(const method of item.methods){
   for(const scenario of method.tests){
    total++;
    const execution=executePseudocode(method.pseudocode,scenario.input);
    const correct=execution.ok&&same(execution.outputs,scenario.expected);
    assert.ok(correct,item.id+" · "+method.name+" · "+scenario.name+
      " · esperado "+JSON.stringify(scenario.expected)+", obtenido "+JSON.stringify(execution.outputs));
    if(correct)passed++;
   }
  }
 }
 assert.equal(passed,total);
});
