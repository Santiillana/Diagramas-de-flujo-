import { HORARIO_CLASES } from "./ficha.js";
import { lessons } from "./lessons.js";
import { exercises } from "./exercises.js";

/**
 * Explicit curriculum links between a real timetable block and Aprende.
 *
 * The arrays intentionally remain empty until a verified curriculum map is
 * supplied. Do not infer associations from matching words in class/lesson titles.
 */
export const CLASS_LEARNING_MAP = Object.freeze([]);

const classIds = new Set(HORARIO_CLASES.map(item => item.id));
const lessonIds = new Set(lessons.map(item => item.id));
const exerciseIds = new Set(exercises.map(item => item.id));

export function validateClassLearningMap(mapping = CLASS_LEARNING_MAP) {
  if (!Array.isArray(mapping)) return { ok: false, reason: "invalid_map" };
  const seenClasses = new Set();

  for (const entry of mapping) {
    if (!entry || typeof entry !== "object" ||
        !classIds.has(entry.classId) ||
        !Array.isArray(entry.lessonIds) ||
        !Array.isArray(entry.exerciseIds)) {
      return { ok: false, reason: "invalid_entry" };
    }
    if (seenClasses.has(entry.classId)) {
      return { ok: false, reason: "duplicate_class" };
    }
    seenClasses.add(entry.classId);

    if (new Set(entry.lessonIds).size !== entry.lessonIds.length ||
        entry.lessonIds.some(id => !lessonIds.has(id))) {
      return { ok: false, reason: "unknown_lesson" };
    }
    if (new Set(entry.exerciseIds).size !== entry.exerciseIds.length ||
        entry.exerciseIds.some(id => !exerciseIds.has(id))) {
      return { ok: false, reason: "unknown_exercise" };
    }
  }

  return { ok: true, data: mapping };
}

export function learningForClass(classId) {
  const validation = validateClassLearningMap();
  if (!validation.ok || !classIds.has(classId)) return null;
  return CLASS_LEARNING_MAP.find(entry => entry.classId === classId) || null;
}
