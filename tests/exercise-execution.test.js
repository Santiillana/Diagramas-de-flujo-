import test from "node:test";
import assert from "node:assert/strict";
import { exercises } from "../src/content/exercises.js";
import { executePseudocode } from "../src/core/interpreter.js";

function equivalent(actual,expected,path="salida"){
  assert.equal(actual.length,expected.length,path+" · cantidad de elementos");
  for(let i=0;i<expected.length;i++){
    if(typeof expected[i]==="number"){
      assert.equal(typeof actual[i],"number",path+" · tipo del elemento "+i);
      assert.ok(Math.abs(actual[i]-expected[i])<1e-8,path+" · "+actual[i]+" no coincide con "+expected[i]);
    }else{
      assert.equal(actual[i],expected[i],path+" · elemento "+i);
    }
  }
}

test("todos los métodos de los cuarenta ejercicios cumplen sus resultados esperados",()=>{
  const failures=[];
  let scenarios=0,methods=0;
  for(const exercise of exercises){
    for(const method of exercise.methods){
      methods++;
      for(const scenario of method.tests){
        scenarios++;
        const result=executePseudocode(method.pseudocode,scenario.input);
        if(!result.ok){
          failures.push("#"+exercise.id+" "+exercise.title+" / "+method.name+" / "+scenario.name+
            ": error "+result.error.code+" línea "+result.error.line+" — "+result.error.message);
          continue;
        }
        try{ equivalent(result.outputs,scenario.expected,"#"+exercise.id+" "+scenario.name); }
        catch(error){ failures.push("#"+exercise.id+" "+exercise.title+" / "+method.name+" / "+scenario.name+
          ": "+error.message+"; obtenido "+JSON.stringify(result.outputs)); }
      }
    }
  }
  assert.equal(failures.length,0,failures.slice(0,30).join("\n"));
  assert.ok(methods>=40,"Se han probado todos los métodos disponibles.");
  assert.ok(scenarios>=100,"Se han probado los escenarios del catálogo.");
});
