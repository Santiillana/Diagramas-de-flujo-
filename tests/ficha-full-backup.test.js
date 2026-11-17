import test from "node:test";
import assert from "node:assert/strict";
import { createActivity } from "../src/ui/ficha-store.js";
import { createLibraryResource } from "../src/ui/ficha-library-store.js";
import {
  createFullFichaBackup, importFullFichaBackup, validateFullFichaBackup
} from "../src/ui/ficha-full-backup.js";

function memoryStorage(initial = {}, failOnceKey = null) {
  const values = new Map(Object.entries(initial));
  let failure = failOnceKey;
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) {
      if (failure === key) {
        failure = null;
        throw new Error("one-time storage failure");
      }
      values.set(key, String(value));
    },
    removeItem(key) { values.delete(key); },
    raw(key) { return values.has(key) ? values.get(key) : null; }
  };
}

function personalStorage(activityTitle, resourceTitle) {
  const activity = createActivity({ title: activityTitle }).data;
  const library = createLibraryResource({
    title: resourceTitle,
    kind: "note",
    description: "Contenido personal"
  }).data;
  return memoryStorage({
    "traza:v4:ficha": JSON.stringify(activity),
    "traza:v4:library": JSON.stringify(library)
  });
}

test("respaldo completo reúne las dos áreas personales y valida ambos formatos", () => {
  const source = personalStorage("Actividad de origen", "Recurso de origen");
  const backup = createFullFichaBackup(source);
  const validation = validateFullFichaBackup(backup);
  assert.equal(validation.ok, true);
  assert.equal(validation.data.activities.activities[0].title, "Actividad de origen");
  assert.equal(validation.data.library.resources[0].title, "Recurso de origen");
});

test("restauración completa sustituye ambas áreas después de validar", () => {
  const source = personalStorage("Actividad guardada", "Recurso guardado");
  const backup = createFullFichaBackup(source);
  const target = personalStorage("Actividad anterior", "Recurso anterior");
  const restored = importFullFichaBackup(backup, target);
  assert.equal(restored.ok, true);
  assert.equal(JSON.parse(target.raw("traza:v4:ficha")).activities[0].title, "Actividad guardada");
  assert.equal(JSON.parse(target.raw("traza:v4:library")).resources[0].title, "Recurso guardado");
});

test("si falla la segunda escritura se revierten ambos almacenes", () => {
  const source = personalStorage("Actividad de respaldo", "Recurso de respaldo");
  const backup = createFullFichaBackup(source);
  const target = personalStorage("Actividad que debe conservarse", "Recurso que debe conservarse");
  const beforeActivities = target.raw("traza:v4:ficha");
  const beforeLibrary = target.raw("traza:v4:library");
  const failing = memoryStorage({
    "traza:v4:ficha": beforeActivities,
    "traza:v4:library": beforeLibrary
  }, "traza:v4:library");

  const result = importFullFichaBackup(backup, failing);
  assert.equal(result.ok, false);
  assert.equal(result.rolledBack, true);
  assert.equal(failing.raw("traza:v4:ficha"), beforeActivities);
  assert.equal(failing.raw("traza:v4:library"), beforeLibrary);
});

test("un respaldo completo malformado no cambia ninguna de las dos áreas", () => {
  const source = personalStorage("Actividad de respaldo", "Recurso de respaldo");
  const backup = createFullFichaBackup(source);
  const target = personalStorage("Actividad local", "Recurso local");
  const beforeActivities = target.raw("traza:v4:ficha");
  const beforeLibrary = target.raw("traza:v4:library");

  const invalid = structuredClone(backup);
  invalid.personalData.library.data.resources[0].url = "javascript:alert(1)";
  assert.equal(validateFullFichaBackup(invalid).ok, false);
  assert.equal(importFullFichaBackup(invalid, target).ok, false);
  assert.equal(target.raw("traza:v4:ficha"), beforeActivities);
  assert.equal(target.raw("traza:v4:library"), beforeLibrary);
});

test("crear respaldo completo se niega si una de las áreas está dañada", () => {
  const storage = memoryStorage({
    "traza:v4:ficha": JSON.stringify({ version: 1, activities: [] }),
    "traza:v4:library": "{"
  });
  assert.throws(() => createFullFichaBackup(storage), /library_corrupt_storage/);
});
