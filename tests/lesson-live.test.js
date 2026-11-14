import test from "node:test";
import assert from "node:assert/strict";
import { lessons } from "../src/content/lessons.js";
import { lessonPrograms } from "../src/content/lesson-programs.js";
import { executePseudocode, createTimeline } from "../src/core/interpreter.js";
import { parsePseudocode } from "../src/core/parser.js";
import { renderLessonLiveMarkup } from "../src/ui/lesson-live.js";

test("cada una de las 14 lecciones tiene un mini-programa dentro de la gramática soportada",()=>{
 assert.equal(lessons.length,14);
 assert.deepEqual(Object.keys(lessonPrograms).sort(),lessons.map(item=>item.id).sort());
 for(const lesson of lessons){
  const program=lessonPrograms[lesson.id];
  assert.ok(program, "Falta mini-programa: "+lesson.id);
  assert.ok(program.pseudocode.length>0);
  assert.doesNotThrow(()=>parsePseudocode(program.pseudocode),lesson.id);
  assert.ok(Array.isArray(program.sampleInputs));
  assert.ok(Array.isArray(program.expectedOutputs));
 }
});

test("los mini-programas producen sus salidas de referencia con el intérprete único",()=>{
 for(const lesson of lessons){
  const program=lessonPrograms[lesson.id];
  const execution=executePseudocode(program.pseudocode,program.sampleInputs);
  assert.equal(execution.ok,true,lesson.id+" debe terminar sin errores: "+execution.error?.message);
  assert.deepEqual(execution.outputs,program.expectedOutputs,lesson.id);
  const timeline=createTimeline(execution);
  timeline.last();
  assert.equal(timeline.current.type,"program-end",lesson.id);
  assert.equal(timeline.current.outputs.length,program.expectedOutputs.length,lesson.id);
 }
});

test("las lecciones publican una interfaz viva que comparte código, diagrama y escena",()=>{
 for(const lesson of lessons){
  const markup=renderLessonLiveMarkup(lesson);
  assert.match(markup,/data-lesson-live/);
  assert.match(markup,/data-lesson-live-action="run"/);
  assert.match(markup,/data-lesson-live-code/);
  assert.match(markup,/data-lesson-live-diagram/);
  assert.match(markup,/data-lesson-live-scene/);
  assert.match(markup,/data-lesson-live-variables/);
  assert.match(markup,/data-lesson-live-output/);
 }
});

test("el catálogo de mini-programas no amplía los temas de aprendizaje aprobados",()=>{
 const source=JSON.stringify(lessonPrograms).toLowerCase();
 for(const forbidden of ["matrices","arreglos","recursividad","búsqueda binaria","ordenamiento","función","procedimiento"]){
  assert.equal(source.includes(forbidden),false,forbidden);
 }
});
