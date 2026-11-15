import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { exercises } from "../src/content/exercises.js";

const read=path=>readFile(new URL(path,import.meta.url),"utf8");

test("el selector del simulador usa los 40 ejercicios y filtra número, título y concepto",async()=>{
 const simulator=await read("../src/ui/simulator.js");
 assert.equal(exercises.length,40);
 assert.match(simulator,/function renderExercisePicker/);
 assert.match(simulator,/exerciseSearch/);
 assert.match(simulator,/item\.concepts\.join/);
 assert.match(simulator,/function chooseExercise/);
});

test("los atajos principales recorren el estado compartido del intérprete",async()=>{
 const simulator=await read("../src/ui/simulator.js");
 for(const key of ["ArrowRight","ArrowLeft","Home","End","ArrowUp","ArrowDown","[","]","+","-","0","c","p","f","l"]){
  assert.ok(simulator.includes('"'+key+'"')||simulator.includes('"'+key.toUpperCase()+'"'),"Falta atajo "+key);
 }
 assert.match(simulator,/function bindKeyboard/);
 assert.match(simulator,/INPUT\|SELECT\|TEXTAREA/);
});

test("las seis velocidades discretas incluyen ajuste fino y escalan el intervalo",async()=>{
 const [simulator,html]=await Promise.all([read("../src/ui/simulator.js"),read("../index.html")]);
 assert.match(simulator,/SPEEDS=\[0\.25,0\.5,1,2,4,8\]/);
 assert.match(simulator,/Math\.max\(150,lastAnimationDuration\|\|150\)/);
 assert.match(simulator,/setTimeout\(advance/);
 for(const value of ["0.25","0.5","1","2","4","8"])assert.match(html,new RegExp('option value="'+value+'"'));
 assert.match(html,/id="simulator-speed-fine"/);
});
