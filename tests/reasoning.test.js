import test from "node:test";
import assert from "node:assert/strict";
import { exercises, validateCatalog } from "../src/content/exercises.js";

test("las 40 fichas incluyen un razonamiento estructurado y específico",()=>{
 assert.equal(exercises.length,40);
 for(const item of exercises){
  assert.ok(item.razonamiento, "Falta razonamiento en ejercicio "+item.id);
  for(const key of ["comprender","datos","estrategia","comprobar"]){
   assert.equal(typeof item.razonamiento[key],"string",item.id+"."+key);
   assert.ok(item.razonamiento[key].length>20,item.id+"."+key+" debe explicar algo útil");
  }
 }
});
test("cada ejercicio tiene tres pistas progresivas y diferenciadas",()=>{
 for(const item of exercises){
  assert.equal(item.pistas.length,3,"Tres niveles en ejercicio "+item.id);
  assert.ok(item.pistas[0].startsWith("Orientación:"),item.id);
  assert.ok(item.pistas[1].startsWith("Estrategia:"),item.id);
  assert.ok(item.pistas[2].startsWith("Verificación:"),item.id);
  assert.equal(new Set(item.pistas).size,3,item.id+" no debe repetir pistas");
 }
});
test("los métodos de cada ejercicio describen su enfoque real",()=>{
 for(const item of exercises){
  for(const alternative of item.methods){
   assert.ok(alternative.approach?.length>25,item.id+" · "+alternative.name);
  }
  assert.equal(item.comparacionMetodos.length,Math.max(0,item.methods.length-1)+Math.min(1,item.methods.length-1));
  if(item.methods.length>1){
   assert.equal(item.comparacionMetodos.length,item.methods.length);
   assert.deepEqual(item.comparacionMetodos.map(x=>x.nombre),item.methods.map(x=>x.name));
  }else{
   assert.deepEqual(item.comparacionMetodos,[]);
  }
 }
});
test("las mejoras de razonamiento mantienen los límites y validaciones del catálogo",()=>{
 assert.deepEqual(validateCatalog(),[]);
 const source=JSON.stringify(exercises).toLowerCase();
 for(const forbidden of ["matrices","recursividad","búsqueda binaria","ordenamiento","programación orientada a objetos"]){
  assert.equal(source.includes(forbidden),false,forbidden);
 }
});
