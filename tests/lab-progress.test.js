import test from "node:test";
import assert from "node:assert/strict";
import { modeStars, normalizeProgress, recordLabResult } from "../src/ui/lab/progress.js";

test("el progreso de laboratorio tiene versión y tolera datos inválidos",()=>{
  assert.equal(normalizeProgress(null).version,2);
  assert.deepEqual(normalizeProgress({version:1,exercises:{}}).exercises,{});
});

test("un acierto registra hasta tres estrellas y el intento",()=>{
  const first=recordLabResult(null,{exerciseId:22,mode:"fill-gap",correct:true,hints:0});
  assert.equal(modeStars(first,22,"fill-gap"),3);
  const second=recordLabResult(first,{exerciseId:22,mode:"fill-gap",correct:true,hints:2});
  assert.equal(modeStars(second,22,"fill-gap"),3);
  assert.equal(second.exercises["22"]["fill-gap"].attempts,2);
});

test("un fallo entra en repaso y se retira al acertar",()=>{
  const failed=recordLabResult(null,{exerciseId:23,mode:"follow-arrow",correct:false});
  assert.deepEqual(failed.failed,[{exerciseId:23,mode:"follow-arrow"}]);
  const recovered=recordLabResult(failed,{exerciseId:23,mode:"follow-arrow",correct:true});
  assert.deepEqual(recovered.failed,[]);
});
