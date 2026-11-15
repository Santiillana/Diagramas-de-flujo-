import test from "node:test";
import assert from "node:assert/strict";
import { lessons } from "../src/content/lessons.js";
import { executePseudocode } from "../src/core/interpreter.js";

test("cada una de las 17 lecciones tiene un mini-programa ejecutable", () => {
  assert.equal(lessons.length, 17);
  for (const lesson of lessons) {
    assert.ok(lesson.miniProgram?.code, lesson.id + " necesita código de práctica");
    assert.ok(Array.isArray(lesson.miniProgram.sample), lesson.id + " necesita datos de ejemplo");
    assert.ok(lesson.commonError && lesson.tryIt?.prompt && lesson.summary, lesson.id + " necesita guía didáctica");
    const result = executePseudocode(lesson.miniProgram.code, lesson.miniProgram.sample);
    assert.equal(result.ok, true, lesson.id + ": " + result.error?.message);
  }
});
