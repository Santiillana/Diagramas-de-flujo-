import test from "node:test";
import assert from "node:assert/strict";
import {
  FICHA_STORAGE_KEY, addFeedback, addSubmission, archiveActivity,
  createActivity, createEmptyFichaData, createFichaBackup, importFichaBackup,
  isActivityOverdue, isCivilDate, normalizeFichaData, readFichaData, readFichaDataStrict,
  transitionActivity, updateActivity, validateFichaBackup, writeFichaData
} from "../src/ui/ficha-store.js";

function memoryStorage(initial = null) {
  let value = initial;
  return {
    getItem(key) { return key === FICHA_STORAGE_KEY ? value : null; },
    setItem(key, next) { if (key === FICHA_STORAGE_KEY) value = next; },
    get value() { return value; }
  };
}

function activity(data = createEmptyFichaData(), extra = {}) {
  const result = createActivity({ title: "Resolver guía", ...extra }, data);
  assert.equal(result.ok, true);
  return result;
}

test("las fechas civiles se validan sin convertirlas en instantes", () => {
  assert.equal(isCivilDate("2026-11-16"), true);
  assert.equal(isCivilDate("2026-02-29"), false);
  assert.equal(isCivilDate("2026-13-01"), false);
  assert.equal(isCivilDate("2026-1-01"), false);
});

test("crear actividad aplica valores iniciales y conserva referencia de clase válida", () => {
  const created = activity(createEmptyFichaData(), {
    classId: "jueves-tics", assignedOn: "2026-11-16", dueOn: "2026-11-20"
  });
  assert.equal(created.activity.status, "pending");
  assert.equal(created.activity.classId, "jueves-tics");
  assert.equal(created.activity.attempts.length, 0);
  assert.equal(created.activity.events[0].type, "created");
  assert.equal(createActivity({ title: " " }).reason, "title_required");
  assert.equal(createActivity({ title: "X", dueOn: "2026-02-30" }).reason, "invalid_date");
  assert.equal(createActivity({ title: "X", assignedOn: "2026-11-21", dueOn: "2026-11-20" }).reason, "invalid_date");
  assert.equal(createActivity({ title: "X", classId: "clase-inventada" }).reason, "invalid_class");
});

test("editar actividad registra una nueva entrada de bitácora", () => {
  const created = activity();
  const edited = updateActivity(created.activity.id, { title: "Guía corregida" }, created.data);
  assert.equal(edited.ok, true);
  assert.equal(edited.activity.title, "Guía corregida");
  assert.equal(edited.activity.events.at(-1).type, "edited");
  assert.equal(updateActivity(created.activity.id, { title: "" }, created.data).reason, "title_required");
  const notesCleared = updateActivity(created.activity.id, { notes: "" }, edited.data);
  assert.equal(notesCleared.ok, true);
  assert.equal(writeFichaData(notesCleared.data, memoryStorage()).ok, true);
});

test("las transiciones no permiten que el estudiante se autoapruebe", () => {
  const created = activity();
  assert.equal(transitionActivity(created.activity.id, "approved", created.data).reason, "invalid_transition");
  const started = transitionActivity(created.activity.id, "in_progress", created.data);
  assert.equal(started.activity.status, "in_progress");
  assert.equal(transitionActivity(created.activity.id, "pending", started.data).reason, "invalid_transition");
});

test("cada entrega crea un intento independiente y conserva el anterior", () => {
  const created = activity();
  const first = addSubmission(created.activity.id, { summary: "Primera versión" }, created.data);
  assert.equal(first.ok, true);
  assert.equal(first.activity.status, "submitted");
  assert.equal(first.attempt.attemptNumber, 1);
  assert.equal(addSubmission(created.activity.id, { summary: "No permitido" }, first.data).reason, "invalid_transition");
  const correction = addFeedback(created.activity.id, {
    result: "correction_requested", comment: "Revisar el punto 2"
  }, first.data);
  assert.equal(correction.activity.status, "needs_correction");
  const second = addSubmission(created.activity.id, { summary: "Versión corregida" }, correction.data);
  assert.equal(second.attempt.attemptNumber, 2);
  assert.equal(second.activity.attempts.length, 2);
  assert.equal(second.activity.attempts[0].summary, "Primera versión");
});

test("la devolución se identifica como transcripción y solo ella puede aprobar", () => {
  const created = activity();
  const submitted = addSubmission(created.activity.id, { summary: "Entrega" }, created.data);
  const feedback = addFeedback(created.activity.id, {
    result: "favorable", comment: "Cumple los criterios", score: 4.5, scoreScale: "0 a 5"
  }, submitted.data);
  assert.equal(feedback.activity.status, "approved");
  assert.equal(feedback.feedback.source, "student_transcription");
  assert.equal(feedback.activity.events.at(-1).type, "feedback");
  assert.equal(addFeedback(created.activity.id, {
    result: "informational", comment: "Nota adicional"
  }, feedback.data).ok, true);
});

test("los enlaces de evidencia solo aceptan HTTP y HTTPS", () => {
  const created = activity();
  assert.equal(addSubmission(created.activity.id, {
    evidenceUrl: "javascript:alert(1)"
  }, created.data).reason, "invalid_evidence_url");
  const safe = addSubmission(created.activity.id, {
    evidenceUrl: "https://example.org/evidencia"
  }, created.data);
  assert.equal(safe.ok, true);
  assert.equal(safe.attempt.evidenceUrl, "https://example.org/evidencia");
});

test("el sobre del respaldo también se valida sin descartar campos", () => {
  const created = activity();
  const backup = createFichaBackup(created.data);
  assert.equal(validateFichaBackup(backup).ok, true);
  const broken = { ...backup, metadata: { note: "extra" } };
  assert.equal(validateFichaBackup(broken).reason, "invalid_backup");
  const badTime = { ...backup, exportedAt: "not-a-date" };
  assert.equal(validateFichaBackup(badTime).reason, "invalid_backup");
});

test("el atraso se calcula y no se guarda como estado", () => {
  const created = activity(createEmptyFichaData(), { dueOn: "2026-11-15" });
  assert.equal(isActivityOverdue(created.activity, "2026-11-16"), true);
  assert.equal(isActivityOverdue(created.activity, "2026-11-15"), false);
  assert.equal(isActivityOverdue({ ...created.activity, status: "approved" }, "2026-11-16"), false);
  assert.equal(created.activity.status, "pending");
});

test("la persistencia tolera datos corruptos y almacenamiento bloqueado", () => {
  assert.deepEqual(readFichaData(memoryStorage("{")), createEmptyFichaData());
  const blocked = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); }
  };
  assert.deepEqual(readFichaData(blocked), createEmptyFichaData());
  assert.equal(writeFichaData(createEmptyFichaData(), blocked).ok, false);
});

test("los datos corruptos o de una versión futura no se silencian ni se sobrescriben", () => {
  const corrupt = memoryStorage("{");
  assert.equal(readFichaDataStrict(corrupt).reason, "corrupt_storage");
  const created = activity();
  const blockedWrite = writeFichaData(created.data, corrupt);
  assert.equal(blockedWrite.ok, false);
  assert.equal(blockedWrite.reason, "existing_corrupt_storage");
  assert.equal(corrupt.value, "{");

  const future = memoryStorage(JSON.stringify({ version: 99, activities: [] }));
  assert.equal(readFichaDataStrict(future).reason, "unsupported_schema");
  assert.equal(writeFichaData(created.data, future).reason, "existing_unsupported_schema");
});

test("un respaldo con campos anidados que perderían información se rechaza", () => {
  const created = activity();
  const backup = createFichaBackup(created.data);
  const brokenAttempt = structuredClone(backup);
  brokenAttempt.data.activities[0].attempts = [{
    id: "attempt-1",
    activityId: created.activity.id,
    submittedAt: new Date().toISOString(),
    summary: 12,
    evidenceUrl: "",
    studentNote: "",
    attemptNumber: 1
  }];
  assert.equal(validateFichaBackup(brokenAttempt).ok, false);

  const brokenEvent = structuredClone(backup);
  brokenEvent.data.activities[0].events[0].source = "unknown";
  assert.equal(validateFichaBackup(brokenEvent).ok, false);
});

test("un respaldo válido puede recuperar almacenamiento corrupto de forma explícita", () => {
  const created = activity();
  const backup = createFichaBackup(created.data);
  const corrupt = memoryStorage("{");
  const restored = importFichaBackup(backup, corrupt);
  assert.equal(restored.ok, true);
  assert.equal(readFichaDataStrict(corrupt).ok, true);
  assert.equal(readFichaData(corrupt).activities[0].title, "Resolver guía");
});

test("normalización elimina registros inválidos y duplicados", () => {
  const normalized = normalizeFichaData({
    version: 1,
    activities: [
      { id: "same", title: "Primera" },
      { id: "same", title: "Duplicada" },
      { id: "", title: "Inválida" }
    ]
  });
  assert.equal(normalized.activities.length, 1);
  assert.equal(normalized.activities[0].title, "Primera");
});

test("respaldo versionado se valida e importa sin destruir el estado ante error", () => {
  const storage = memoryStorage();
  const created = activity();
  assert.equal(writeFichaData(created.data, storage).ok, true);
  const backup = createFichaBackup(created.data);
  assert.equal(validateFichaBackup(backup).ok, true);
  const imported = importFichaBackup(backup, storage);
  assert.equal(imported.ok, true);
  assert.equal(readFichaData(storage).activities[0].title, "Resolver guía");
  const invalid = { ...backup, version: 99 };
  assert.equal(importFichaBackup(invalid, storage).reason, "invalid_backup");
  const brokenReference = structuredClone(backup);
  brokenReference.data.activities[0].classId = "clase-que-no-existe";
  assert.equal(validateFichaBackup(brokenReference).reason, "invalid_records");
  assert.equal(readFichaData(storage).activities[0].title, "Resolver guía");
});

test("archivar conserva el registro y añade un evento", () => {
  const created = activity();
  const archived = archiveActivity(created.activity.id, created.data);
  assert.equal(archived.ok, true);
  assert.ok(archived.activity.archivedAt);
  assert.equal(archived.activity.events.at(-1).type, "archived");
  assert.equal(archiveActivity(created.activity.id, archived.data).reason, "not_found");
});
