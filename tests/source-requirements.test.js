import test from "node:test";
import assert from "node:assert/strict";
import {sourceExercises,validateSourceExercises} from "../src/content/source-exercises.js";
import {sourceScenarios,sourceCoverage,validateSourceScenarios,sourceTypes} from "../src/content/source-scenarios.js";
import {temaPorId} from "../src/content/temas.js";

test("el banco de recolección contiene 24 ejercicios con una respuesta y justificación",()=>{
  assert.deepEqual(validateSourceExercises(),[]);
  assert.equal(new Set(sourceExercises.map(item=>item.id)).size,24);
  for(const item of sourceExercises){
    assert.equal(item.options.length,4,item.id);
    assert.equal(new Set(item.options).size,4,item.id);
    assert.ok(item.why.length>20,item.id);
    assert.ok(sourceScenarios.some(scenario=>scenario.id===item.scenario),item.id+" references a scenario");
  }
});

test("cada nivel tiene seis preguntas y cubre la progresión didáctica",()=>{
  assert.deepEqual([1,2,3,4].map(level=>sourceExercises.filter(item=>item.level===level).length),[6,6,6,6]);
  assert.ok(sourceExercises.filter(item=>item.level===1).every(item=>item.prompt&&item.why));
  assert.ok(sourceExercises.some(item=>item.level===4&&/frontera depende|depende de cómo/i.test(item.why+" "+item.options.join(" "))));
});

test("los tres escenarios tienen fuentes coherentes y una cobertura calculable",()=>{
  assert.deepEqual(validateSourceScenarios(),[]);
  assert.equal(sourceScenarios.length,3);
  for(const scenario of sourceScenarios){
    assert.ok(scenario.sources.filter(source=>source.type==="P").length>=2,scenario.id);
    assert.ok(scenario.sources.filter(source=>source.type==="S").length>=2,scenario.id);
    assert.ok(scenario.sources.some(source=>source.type==="T"),scenario.id);
    assert.ok(scenario.sources.some(source=>source.requirementIds.length===0),scenario.id);
    for(const source of scenario.sources)assert.equal(source.hops,sourceTypes[source.type].hops,source.id);
    const coverage=sourceCoverage(scenario);
    assert.equal(coverage.coveredAreas,coverage.totalAreas,scenario.id);
    assert.ok(coverage.primaryVerified>0,scenario.id);
    assert.ok(coverage.needsPrimary>0,scenario.id);
  }
});

test("la tienda de Marta cubre cuatro áreas y deja dos por verificar con una fuente primaria",()=>{
  const coverage=sourceCoverage(sourceScenarios[0]);
  assert.deepEqual([coverage.coveredAreas,coverage.totalAreas,coverage.primaryVerified,coverage.needsPrimary],[4,4,2,2]);
  assert.equal(temaPorId("fuentes-informacion").ejercicios.length,24);
  assert.equal(temaPorId("fuentes-informacion").simulador.escenarios,3);
});
