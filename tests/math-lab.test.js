import test from "node:test";
import assert from "node:assert/strict";
import { buildMathLabChallenge, MATH_LAB, mathLabCatalog } from "../src/math/lab-engine.js";
import { evaluateMathExpression, formatDecimalOrRational, solveDirectRule, solveInverseRule } from "../src/math/exact.js";

test("cada tema ofrece al menos cuatro mecánicas y todos los retos son deterministas",()=>{
  for(const [topic,mechanics] of Object.entries(MATH_LAB)){
    assert.ok(mechanics.length>=4);
    for(const mechanic of mechanics){
      const first=buildMathLabChallenge(topic,mechanic,3,"seed-17",2);
      assert.deepEqual(first,buildMathLabChallenge(topic,mechanic,3,"seed-17",2));
      assert.ok(first.id.startsWith(`ML-${topic}-${mechanic}-`));
    }
  }
});

test("los retos generados conservan una solución válida en las cuatro dificultades y varias semillas",()=>{
  for(const [topic,mechanics] of Object.entries(MATH_LAB))for(const mechanic of mechanics)for(let difficulty=1;difficulty<=4;difficulty++)for(let seed=0;seed<6;seed++){
    const challenge=buildMathLabChallenge(topic,mechanic,difficulty,`coverage-${seed}`,seed);
    if(challenge.kind==="choice")assert.equal(challenge.options.filter(option=>option.correct).length,1,`${topic}/${mechanic}/${difficulty}/${seed}`);
    if(challenge.kind==="input")assert.equal(challenge.answer,challenge.exercise.expectedText);
    if(challenge.kind==="number-line")assert.ok(challenge.positions.includes(challenge.answer)&&Number.isInteger(challenge.answer));
    if(challenge.kind==="order")assert.deepEqual([...challenge.answer].sort(),challenge.items.map(item=>item.id).sort());
    if(challenge.kind==="fraction-bar")assert.ok(challenge.numerator>0&&challenge.numerator<challenge.denominator);
  }
});

test("las opciones de respuesta tienen una sola solución verificada por el motor exacto",()=>{
  for(const [topic,mechanics] of Object.entries(MATH_LAB))for(const mechanic of mechanics){
    if(["order","number-line","fraction-bar","fill-gap"].includes(mechanic))continue;
    const challenge=buildMathLabChallenge(topic,mechanic,2,"oracle",0);
    assert.equal(challenge.options.filter(item=>item.correct).length,1,`${topic}/${mechanic}`);
    if(mechanic==="whatif"&&topic!=="regla-de-tres"){
      const changed=challenge.question.match(/¿Qué resultado da (.+) al cambiar/)[1];
      const actual=evaluateMathExpression(changed).value;
      assert.equal(formatDecimalOrRational(actual),formatDecimalOrRational(challenge.answer));
    }
    if(mechanic==="whatif"&&topic==="regla-de-tres"){
      const {a,b,c}=challenge.exercise.rule;
      const wrong=challenge.exercise.type==="directa"?solveInverseRule(a,c,b):solveDirectRule(a,b,c);
      assert.equal(formatDecimalOrRational(wrong),formatDecimalOrRational(challenge.answer));
    }
  }
});

test("orden, recta y barra tienen respuesta trazable",()=>{
  const order=buildMathLabChallenge("enteros","order",4,"order",0);
  assert.ok(order.answer.length>=2);
  assert.deepEqual([...order.answer].sort(),order.items.map(item=>item.id).sort());
  const line=buildMathLabChallenge("enteros","number-line",4,"line",0);
  assert.equal(line.positions.filter(value=>value===line.answer).length,1);
  const bar=buildMathLabChallenge("racionales","fraction-bar",3,"bar",0);
  assert.equal(bar.answer,`${bar.numerator}/${bar.denominator}`);
  assert.ok(bar.numerator>0&&bar.numerator<bar.denominator);
  for(const [topic,mechanics] of Object.entries(MATH_LAB))if(mechanics.includes("fill-gap")){
    const gap=buildMathLabChallenge(topic,"fill-gap",2,"gap",0);
    assert.equal(gap.kind,"input");assert.equal(gap.answer,gap.exercise.expectedText);
  }
});

test("el catálogo expone solo las mecánicas registradas y progreso por tema",()=>{
  const catalog=mathLabCatalog("enteros",{topics:{enteros:{concepts:{enteros:{predict:{stars:2}}}}}});
  assert.deepEqual(catalog.map(item=>item.id),MATH_LAB.enteros);
  assert.equal(catalog.find(item=>item.id==="predict").stars,2);
  assert.equal(mathLabCatalog("inexistente").length,0);
});
