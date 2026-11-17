import test from "node:test";
import assert from "node:assert/strict";
import {buildSourceLabChallenge,sourceLabMechanics} from "../src/content/source-lab.js";
import {temaPorId} from "../src/content/temas.js";

test("el tema de fuentes publica las seis mecánicas de Laboratorio",()=>{
  assert.deepEqual(temaPorId("fuentes-informacion").laboratorio.mecanicas,sourceLabMechanics);
  assert.deepEqual(sourceLabMechanics,["classify","match","order","error","whatif","fill-gap"]);
});

test("los seis retos se generan de forma determinista y con solución explicada",()=>{
  for(const mechanic of sourceLabMechanics){
    for(let round=0;round<8;round++){
      const challenge=buildSourceLabChallenge(mechanic,"semilla-regresion",round);
      assert.deepEqual(challenge,buildSourceLabChallenge(mechanic,"semilla-regresion",round));
      assert.ok(challenge.question.length>20,mechanic);
      assert.ok(challenge.explanation.length>20,mechanic);
      assert.ok(challenge.hint.length>10,mechanic);
      if(challenge.kind==="choice")assert.equal(challenge.options.filter(option=>option.correct).length,1,mechanic);
      if(challenge.kind==="order")assert.equal(new Set(challenge.answer).size,challenge.items.length,mechanic);
    }
  }
});

test("las respuestas generadas respetan el tipo de fuente y el orden didáctico",()=>{
  for(let round=0;round<20;round++){
    const classify=buildSourceLabChallenge("classify","clasificacion",round);
    assert.ok(classify.options.some(option=>option.correct&&["Primaria","Secundaria","Terciaria"].includes(option.label)));
    const order=buildSourceLabChallenge("order","orden",round);
    assert.deepEqual(order.answer,["question","source","collect","verify"]);
    assert.deepEqual(new Set(order.items.map(item=>item.id)),new Set(order.answer));
  }
});

test("el escenario alternativo explica el cambio de cobertura al sustituir evidencia primaria",()=>{
  for(let round=0;round<12;round++){
    const challenge=buildSourceLabChallenge("whatif","cobertura",round);
    assert.match(challenge.question,/no está disponible/i);
    assert.match(challenge.explanation,/cobertura de requisitos se mantiene en \d+\/\d+ áreas/i);
    assert.match(challenge.explanation,/evidencia primaria verificada cambia de \d+ a \d+ áreas/i);
    assert.ok(challenge.options.find(option=>option.correct).label.startsWith("Usar "));
  }
});

test("rechaza mecánicas desconocidas",()=>assert.throws(()=>buildSourceLabChallenge("drag-and-drop"),RangeError));
