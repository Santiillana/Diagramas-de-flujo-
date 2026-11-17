import test from "node:test";
import assert from "node:assert/strict";
import { HORARIO_CLASES } from "../src/content/ficha.js";
import { lessons } from "../src/content/lessons.js";
import { exercises } from "../src/content/exercises.js";
import {
  CLASS_LEARNING_MAP, learningForClass, validateClassLearningMap
} from "../src/content/class-learning-map.js";

test("el mapa oficial permanece vacío mientras no exista evidencia curricular", () => {
  assert.deepEqual(CLASS_LEARNING_MAP, []);
  assert.equal(validateClassLearningMap().ok, true);
  assert.equal(learningForClass("jueves-tics"), null);
});

test("un mapa explícito acepta solo IDs reales de horario, lecciones y ejercicios", () => {
  const valid = [{
    classId: HORARIO_CLASES[0].id,
    lessonIds: [lessons[0].id],
    exerciseIds: [exercises[0].id]
  }];
  assert.equal(validateClassLearningMap(valid).ok, true);
});

test("el mapa rechaza materias inventadas, IDs desconocidos y duplicados", () => {
  assert.equal(validateClassLearningMap([{
    classId: "clase-inventada", lessonIds: [], exerciseIds: []
  }]).reason, "invalid_entry");

  assert.equal(validateClassLearningMap([{
    classId: HORARIO_CLASES[0].id, lessonIds: ["leccion-inexistente"], exerciseIds: []
  }]).reason, "unknown_lesson");

  assert.equal(validateClassLearningMap([{
    classId: HORARIO_CLASES[0].id, lessonIds: [], exerciseIds: [999999]
  }]).reason, "unknown_exercise");

  assert.equal(validateClassLearningMap([
    { classId: HORARIO_CLASES[0].id, lessonIds: [], exerciseIds: [] },
    { classId: HORARIO_CLASES[0].id, lessonIds: [], exerciseIds: [] }
  ]).reason, "duplicate_class");
});
