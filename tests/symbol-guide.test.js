import test from "node:test";
import assert from "node:assert/strict";
import { symbolGuideEntries, lessonGuideTopics } from "../src/content/symbol-guide.js";
import { lessons } from "../src/content/lessons.js";

test("la guía incluye las figuras y conexiones de la convención de Traza",()=>{
 const ids=symbolGuideEntries.filter(x=>x.category==="figures").map(x=>x.id);
 for(const id of ["terminal","input-output","process","decision","document-output","connector","arrow"])assert.ok(ids.includes(id));
});
test("la guía explica por separado Para, Mientras, Hacer–Mientras y ciclos anidados",()=>{
 const cycles=symbolGuideEntries.filter(x=>x.category==="cycles");
 assert.deepEqual(cycles.map(x=>x.id),["for","while","do-while","nested-loops"]);
 const whileItem=cycles.find(x=>x.id==="while"),doItem=cycles.find(x=>x.id==="do-while");
 assert.match(whileItem.technical,/cero iteraciones/);
 assert.match(doItem.technical,/al menos una vez/);
 assert.match(whileItem.technical,/inicio/);
 assert.match(doItem.technical,/final/);
});
test("cada lección tiene un tema de guía contextual existente",()=>{
 for(const lesson of lessons){
  const topic=lessonGuideTopics[lesson.id];
  assert.ok(topic,"Falta tema contextual para "+lesson.id);
  assert.ok(symbolGuideEntries.some(entry=>entry.id===topic),"Tema desconocido "+topic);
 }
});
test("la guía distingue la convención compacta de Para de símbolos normativos",()=>{
 const source=JSON.stringify(symbolGuideEntries).toLowerCase();
 assert.ok(source.includes("convención didáctica"));
 assert.ok(source.includes("normativo"));
 assert.ok(source.includes("preparación"));
 assert.ok(source.includes("avance"));
});
test("la guía no amplía el alcance pedagógico",()=>{
 const source=JSON.stringify(symbolGuideEntries).toLowerCase();
 for(const forbidden of ["matrices","recursividad","búsqueda binaria","ordenamiento","programación orientada a objetos"])assert.equal(source.includes(forbidden),false);
});
