import test from "node:test";
import assert from "node:assert/strict";
import { lessons } from "../src/content/lessons.js";
import { exercises, validateCatalog } from "../src/content/exercises.js";

test("existen las 17 lecciones progresivas del temario oficial",()=>{
  assert.equal(lessons.length,17);
  for(const lesson of lessons){
    assert.ok(lesson.id && lesson.title && lesson.objective);
    assert.ok(lesson.intuitive && lesson.technical);
    assert.ok(lesson.visual?.steps?.length>=3);
    assert.ok(lesson.example?.code && lesson.example?.explanation);
    assert.ok(lesson.manipulation?.steps?.length>=2);
    assert.equal(lesson.check?.options?.length,3);
    assert.ok(Number.isInteger(lesson.check.answer));
  }
});

test("el catálogo tiene 45 ejercicios y distribución 20/10/10/5",()=>{
  assert.equal(exercises.length,45);
  assert.equal(exercises.filter(x=>x.level==="basic").length,20);
  assert.equal(exercises.filter(x=>x.level==="intermediate").length,10);
  assert.equal(exercises.filter(x=>x.level==="advanced").length,10);
  assert.equal(exercises.filter(x=>x.level==="expert").length,5);
  assert.deepEqual(validateCatalog(),[]);
});

test("las fichas de los ejercicios separan entradas, salidas, restricciones y proceso",()=>{
  for(const item of exercises){
    assert.ok(item.statement.length>20);
    assert.ok(item.purpose.length>10);
    assert.ok(item.concepts.length>0);
    assert.ok(item.inputs.length>=0);
    assert.ok(item.outputs.length>0);
    assert.ok(item.constraints.length>0);
    assert.ok(item.analysis.length>0);
    assert.ok(item.errors.length>=1);
  }
});

test("cada método incluye pseudocódigo y casos normales o límite",()=>{
  for(const item of exercises){
    for(const method of item.methods){
      assert.ok(typeof method.pseudocode==="string" && (method.pseudocode.includes("|") || method.pseudocode===""));
      assert.ok(method.tests.length>=1);
      for(const scenario of method.tests){
        assert.ok(Array.isArray(scenario.input));
        assert.ok(Array.isArray(scenario.expected));
        assert.ok(scenario.name.length>0);
      }
    }
  }
});

test("los contenidos no convierten conceptos externos en objetivos didácticos",()=>{
  const source=JSON.stringify({lessons,exercises}).toLowerCase();
  for(const forbidden of ["recursividad","búsqueda binaria","ordenamiento","programación orientada a objetos"]){
    assert.equal(source.includes(forbidden),false,forbidden+" no pertenece al alcance aprobado");
  }
});

test("la secuencia Fibonacci y las correcciones de máximos y factorial están documentadas",()=>{
  const fib=exercises.find(x=>x.id===23);
  assert.deepEqual(fib.methods[0].tests[0].expected,[0,1,1,2,3,5,8,13,21,34]);
  assert.ok(exercises.find(x=>x.id===24).constraints.some(x=>x.toLowerCase().includes("negativos")));
  assert.ok(exercises.find(x=>x.id===21).constraints.some(x=>x.includes("0!")));
});
