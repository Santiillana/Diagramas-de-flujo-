import test from "node:test";
import assert from "node:assert/strict";
import { add, compare, divide, formatRational, multiply, rational, solveDirectRule, solveInverseRule, subtract } from "../src/math/exact.js";
import { mathLessons, mathLessonsByTopic } from "../src/content/math-lessons.js";
import { temas } from "../src/content/temas.js";

test("los tres temas matemáticos tienen cinco lecciones completas cada uno",()=>{
  assert.equal(mathLessons.length,15);
  for(const id of ["enteros","racionales","regla-de-tres"]){
    const items=mathLessons.filter(lesson=>lesson.topic===id);
    assert.equal(items.length,5);
    assert.equal(new Set(items.map(lesson=>lesson.id)).size,5);
    assert.deepEqual(mathLessonsByTopic[id],items.map(lesson=>lesson.id));
    for(const lesson of items){
      assert.equal(lesson.visual.steps.length,3);
      assert.equal(lesson.check.options.length,3);
      assert.ok(lesson.technical&&lesson.summary&&lesson.example.steps.length>=3);
      assert.ok(temas.find(theme=>theme.id===id).lecciones.includes(lesson.id));
    }
  }
});

test("las operaciones enteras y racionales se calculan exactamente",()=>{
  assert.equal(compare(rational(-2),rational(3)),-1);
  assert.equal(formatRational(add(rational(3),rational(-5))),"−2");
  assert.equal(formatRational(multiply(rational(-3),rational(-2))),"6");
  assert.equal(formatRational(add(rational(2,5),rational(1,5))),"3/5");
  assert.equal(formatRational(add(rational(1,2),rational(1,3))),"5/6");
  assert.equal(formatRational(add(rational(-2,5),rational(1,5))),"−1/5");
  assert.equal(formatRational(subtract(rational(3,4),rational(1,4))),"1/2");
  assert.equal(formatRational(divide(rational(24),rational(6))),"4");
  assert.equal(formatRational(rational(-1234)),"−1.234");
});

test("las reglas de tres directa e inversa conservan proporciones exactas",()=>{
  assert.equal(formatRational(solveDirectRule(3,5,12)),"20");
  assert.equal(formatRational(solveInverseRule(4,6,8)),"3");
  assert.throws(()=>divide(rational(1),rational(0)),RangeError);
  assert.throws(()=>rational(1,0),RangeError);
});
