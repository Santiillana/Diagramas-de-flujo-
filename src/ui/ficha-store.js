import { HORARIO_CLASES } from "../content/ficha.js";

export const FICHA_STORAGE_KEY = "traza:v4:ficha";
export const FICHA_BACKUP_FORMAT = "traza-ficha-backup";
export const FICHA_SCHEMA_VERSION = 1;
export const ACTIVITY_STATUSES = Object.freeze([
  "pending", "in_progress", "submitted", "needs_correction", "approved"
]);

const CLASS_IDS = new Set(HORARIO_CLASES.map(item => item.id));
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T/;
const MAX_TEXT = 12000;
const EVENT_TYPES = new Set([
  "created", "edited", "status_changed", "submission", "feedback",
  "note", "archived", "imported"
]);

export function isCivilDate(value) {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day;
}

function cleanText(value, max = MAX_TEXT) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validTimestamp(value) {
  return typeof value === "string" && ISO_RE.test(value) &&
    Number.isFinite(Date.parse(value));
}

function makeId(prefix) {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return prefix + "_" + uuid;
  return prefix + "_" + Date.now().toString(36) + "_" +
    Math.random().toString(36).slice(2, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function validNullableDate(value) {
  return value === null || value === undefined || isCivilDate(value);
}

function normalizeAttempt(item, activityId, index) {
  if (!item || typeof item !== "object") return null;
  const submittedAt = validTimestamp(item.submittedAt) ? item.submittedAt : null;
  if (!submittedAt) return null;
  return {
    id: cleanText(item.id, 100) || makeId("attempt"),
    activityId,
    submittedAt,
    summary: cleanText(item.summary),
    evidenceUrl: cleanText(item.evidenceUrl, 2048),
    studentNote: cleanText(item.studentNote),
    attemptNumber: Number.isInteger(item.attemptNumber) && item.attemptNumber > 0
      ? item.attemptNumber : index + 1
  };
}

function normalizeFeedback(item, activityId) {
  if (!item || typeof item !== "object" ||
      !["favorable", "correction_requested", "informational"].includes(item.result)) return null;
  const recordedAt = validTimestamp(item.recordedAt) ? item.recordedAt : null;
  if (!recordedAt) return null;
  const score = item.score === null || item.score === undefined || item.score === ""
    ? null : Number(item.score);
  return {
    id: cleanText(item.id, 100) || makeId("feedback"),
    activityId,
    submissionId: cleanText(item.submissionId, 100) || null,
    recordedAt,
    source: "student_transcription",
    result: item.result,
    comment: cleanText(item.comment),
    score: Number.isFinite(score) ? score : null,
    scoreScale: cleanText(item.scoreScale, 80) || null
  };
}

function normalizeEvent(item, activityId) {
  if (!item || typeof item !== "object" || !EVENT_TYPES.has(item.type)) return null;
  const occurredAt = validTimestamp(item.occurredAt) ? item.occurredAt : null;
  if (!occurredAt) return null;
  return {
    id: cleanText(item.id, 100) || makeId("event"),
    activityId,
    type: item.type,
    occurredAt,
    from: item.from ?? null,
    to: item.to ?? null,
    description: cleanText(item.description, 1000),
    source: item.source === "backup_import" ? "backup_import" : "student"
  };
}

function normalizeActivity(item) {
  if (!item || typeof item !== "object") return null;
  const id = cleanText(item.id, 100);
  const title = cleanText(item.title, 240);
  if (!id || !title) return null;

  const createdAt = validTimestamp(item.createdAt) ? item.createdAt : nowIso();
  const updatedAt = validTimestamp(item.updatedAt) ? item.updatedAt : createdAt;
  const classId = CLASS_IDS.has(item.classId) ? item.classId : null;
  const assignedOn = validNullableDate(item.assignedOn) ? item.assignedOn ?? null : null;
  const dueOn = validNullableDate(item.dueOn) ? item.dueOn ?? null : null;
  const status = ACTIVITY_STATUSES.includes(item.status) ? item.status : "pending";
  const attempts = (Array.isArray(item.attempts) ? item.attempts : [])
    .map((attempt, index) => normalizeAttempt(attempt, id, index)).filter(Boolean);
  const feedbackEntries = (Array.isArray(item.feedbackEntries) ? item.feedbackEntries : [])
    .map(feedback => normalizeFeedback(feedback, id)).filter(Boolean);
  const events = (Array.isArray(item.events) ? item.events : [])
    .map(event => normalizeEvent(event, id)).filter(Boolean);

  return {
    id, title,
    description: cleanText(item.description),
    classId,
    competencyId: cleanText(item.competencyId, 160) || null,
    assignedOn, dueOn, status,
    createdAt, updatedAt,
    attempts, feedbackEntries,
    notes: cleanText(item.notes),
    archivedAt: validTimestamp(item.archivedAt) ? item.archivedAt : null,
    events
  };
}

export function createEmptyFichaData() {
  return { version: FICHA_SCHEMA_VERSION, activities: [] };
}

export function normalizeFichaData(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return createEmptyFichaData();
  }
  const source = value.version === FICHA_SCHEMA_VERSION && Array.isArray(value.activities)
    ? value.activities : [];
  const activities = source.map(normalizeActivity).filter(Boolean);
  const ids = new Set();
  return {
    version: FICHA_SCHEMA_VERSION,
    activities: activities.filter(activity => {
      if (ids.has(activity.id)) return false;
      ids.add(activity.id);
      return true;
    })
  };
}

function storageFrom(target) {
  if (target) return target;
  try { return globalThis.window?.localStorage ?? null; }
  catch { return null; }
}

export function readFichaData(targetStorage) {
  const storage = storageFrom(targetStorage);
  if (!storage) return createEmptyFichaData();
  try {
    const raw = storage.getItem(FICHA_STORAGE_KEY);
    if (!raw) return createEmptyFichaData();
    return normalizeFichaData(JSON.parse(raw));
  } catch {
    return createEmptyFichaData();
  }
}

function emitChange(detail) {
  if (typeof globalThis.window === "undefined" ||
      typeof globalThis.CustomEvent === "undefined") return;
  globalThis.window.dispatchEvent(new CustomEvent("traza:ficha-change", { detail }));
}

export function writeFichaData(value, targetStorage) {
  const storage = storageFrom(targetStorage);
  if (!storage) return { ok: false, reason: "unavailable", data: createEmptyFichaData() };
  const data = normalizeFichaData(value);
  try {
    storage.setItem(FICHA_STORAGE_KEY, JSON.stringify(data));
    emitChange({ type: "updated", data });
    return { ok: true, data };
  } catch {
    return { ok: false, reason: "write_failed", data: readFichaData(storage) };
  }
}

function appendEvent(activity, type, description, from = null, to = null, source = "student") {
  activity.events.push({
    id: makeId("event"),
    activityId: activity.id,
    type,
    occurredAt: nowIso(),
    from, to,
    description: cleanText(description, 1000),
    source
  });
  activity.updatedAt = nowIso();
}

export function createActivity(input, current = readFichaData()) {
  const title = cleanText(input?.title, 240);
  if (!title) return { ok: false, reason: "title_required" };
  if (!validNullableDate(input?.assignedOn) || !validNullableDate(input?.dueOn) ||
      (input?.assignedOn && input?.dueOn && input.assignedOn > input.dueOn)) {
    return { ok: false, reason: "invalid_date" };
  }
  if (input?.classId && !CLASS_IDS.has(input.classId)) {
    return { ok: false, reason: "invalid_class" };
  }
  const data = normalizeFichaData(current);
  const timestamp = nowIso();
  const activity = {
    id: makeId("activity"),
    title,
    description: cleanText(input.description),
    classId: input.classId || null,
    competencyId: cleanText(input.competencyId, 160) || null,
    assignedOn: input.assignedOn || null,
    dueOn: input.dueOn || null,
    status: "pending",
    createdAt: timestamp,
    updatedAt: timestamp,
    attempts: [],
    feedbackEntries: [],
    notes: cleanText(input.notes),
    archivedAt: null,
    events: []
  };
  appendEvent(activity, "created", "Actividad creada por el estudiante.");
  data.activities.push(activity);
  return { ok: true, data, activity };
}

export function updateActivity(id, changes, current = readFichaData()) {
  const data = normalizeFichaData(current);
  const activity = data.activities.find(item => item.id === id);
  if (!activity || activity.archivedAt) return { ok: false, reason: "not_found" };
  if (Object.hasOwn(changes, "title") && !cleanText(changes.title, 240)) {
    return { ok: false, reason: "title_required" };
  }
  if (Object.hasOwn(changes, "assignedOn") && !validNullableDate(changes.assignedOn)) {
    return { ok: false, reason: "invalid_date" };
  }
  if (Object.hasOwn(changes, "dueOn") && !validNullableDate(changes.dueOn)) {
    return { ok: false, reason: "invalid_date" };
  }
  const nextAssigned = Object.hasOwn(changes, "assignedOn") ? changes.assignedOn : activity.assignedOn;
  const nextDue = Object.hasOwn(changes, "dueOn") ? changes.dueOn : activity.dueOn;
  if (nextAssigned && nextDue && nextAssigned > nextDue) {
    return { ok: false, reason: "invalid_date_order" };
  }
  if (Object.hasOwn(changes, "classId") && changes.classId && !CLASS_IDS.has(changes.classId)) {
    return { ok: false, reason: "invalid_class" };
  }
  const before = {
    title: activity.title, description: activity.description,
    classId: activity.classId, assignedOn: activity.assignedOn,
    dueOn: activity.dueOn, notes: activity.notes
  };
  for (const field of ["title", "description", "classId", "competencyId", "assignedOn", "dueOn", "notes"]) {
    if (Object.hasOwn(changes, field)) {
      if (field === "title") activity[field] = cleanText(changes[field], 240);
      else if (field === "classId") activity[field] = changes[field] || null;
      else if (field === "assignedOn" || field === "dueOn") activity[field] = changes[field] || null;
      else activity[field] = cleanText(changes[field], field === "competencyId" ? 160 : MAX_TEXT) || null;
    }
  }
  const after = {
    title: activity.title, description: activity.description,
    classId: activity.classId, assignedOn: activity.assignedOn,
    dueOn: activity.dueOn, notes: activity.notes
  };
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    const noteOnly = before.notes !== after.notes &&
      before.title === after.title && before.description === after.description &&
      before.classId === after.classId && before.assignedOn === after.assignedOn &&
      before.dueOn === after.dueOn;
    appendEvent(activity, noteOnly ? "note" : "edited",
      noteOnly ? "Se actualizaron las notas personales." : "Se actualizaron datos de la actividad.",
      before, after);
  }
  return { ok: true, data, activity };
}

const ALLOWED_TRANSITIONS = {
  pending: new Set(["in_progress", "submitted"]),
  in_progress: new Set(["submitted"]),
  submitted: new Set(),
  needs_correction: new Set(["submitted"]),
  approved: new Set()
};

export function transitionActivity(id, nextStatus, current = readFichaData()) {
  const data = normalizeFichaData(current);
  const activity = data.activities.find(item => item.id === id);
  if (!activity || activity.archivedAt) return { ok: false, reason: "not_found" };
  if (!ACTIVITY_STATUSES.includes(nextStatus) || !ALLOWED_TRANSITIONS[activity.status]?.has(nextStatus)) {
    return { ok: false, reason: "invalid_transition" };
  }
  const previous = activity.status;
  activity.status = nextStatus;
  appendEvent(activity, "status_changed", "Estado actualizado por el estudiante.", previous, nextStatus);
  return { ok: true, data, activity };
}

export function addSubmission(id, input, current = readFichaData()) {
  const data = normalizeFichaData(current);
  const activity = data.activities.find(item => item.id === id);
  if (!activity || activity.archivedAt) return { ok: false, reason: "not_found" };
  if (!["pending", "in_progress", "needs_correction"].includes(activity.status)) {
    return { ok: false, reason: "invalid_transition" };
  }
  const attempt = {
    id: makeId("attempt"),
    activityId: id,
    submittedAt: nowIso(),
    summary: cleanText(input?.summary),
    evidenceUrl: cleanText(input?.evidenceUrl, 2048),
    studentNote: cleanText(input?.studentNote),
    attemptNumber: activity.attempts.length + 1
  };
  if (!attempt.summary && !attempt.evidenceUrl && !attempt.studentNote) {
    return { ok: false, reason: "submission_empty" };
  }
  activity.attempts.push(attempt);
  const previous = activity.status;
  activity.status = "submitted";
  appendEvent(activity, "submission", "Se registró la entrega " + attempt.attemptNumber + ".", previous, "submitted");
  return { ok: true, data, activity, attempt };
}

export function addFeedback(id, input, current = readFichaData()) {
  const data = normalizeFichaData(current);
  const activity = data.activities.find(item => item.id === id);
  if (!activity || activity.archivedAt) return { ok: false, reason: "not_found" };
  if (!["favorable", "correction_requested", "informational"].includes(input?.result)) {
    return { ok: false, reason: "invalid_feedback" };
  }
  const comment = cleanText(input.comment);
  if (!comment) return { ok: false, reason: "feedback_required" };
  const submissionId = input.submissionId || null;
  if (submissionId && !activity.attempts.some(item => item.id === submissionId)) {
    return { ok: false, reason: "invalid_submission" };
  }
  const entry = {
    id: makeId("feedback"),
    activityId: id,
    submissionId,
    recordedAt: nowIso(),
    source: "student_transcription",
    result: input.result,
    comment,
    score: input.score === null || input.score === undefined || input.score === ""
      ? null : Number(input.score),
    scoreScale: cleanText(input.scoreScale, 80) || null
  };
  if (entry.score !== null && !Number.isFinite(entry.score)) {
    return { ok: false, reason: "invalid_score" };
  }
  activity.feedbackEntries.push(entry);
  const previous = activity.status;
  if (entry.result === "favorable") activity.status = "approved";
  if (entry.result === "correction_requested") activity.status = "needs_correction";
  appendEvent(activity, "feedback", "Se transcribió una devolución. No está verificada por el sistema.", previous, activity.status);
  return { ok: true, data, activity, feedback: entry };
}

export function archiveActivity(id, current = readFichaData()) {
  const data = normalizeFichaData(current);
  const activity = data.activities.find(item => item.id === id);
  if (!activity || activity.archivedAt) return { ok: false, reason: "not_found" };
  activity.archivedAt = nowIso();
  appendEvent(activity, "archived", "Actividad archivada por el estudiante.");
  return { ok: true, data, activity };
}

export function isActivityOverdue(activity, today) {
  return Boolean(activity?.dueOn && isCivilDate(today) && today > activity.dueOn &&
    activity.status !== "approved" && !activity.archivedAt);
}

export function createFichaBackup(current = readFichaData()) {
  return {
    format: FICHA_BACKUP_FORMAT,
    version: FICHA_SCHEMA_VERSION,
    exportedAt: nowIso(),
    data: normalizeFichaData(current)
  };
}

export function validateFichaBackup(value) {
  if (!value || typeof value !== "object" ||
      value.format !== FICHA_BACKUP_FORMAT ||
      value.version !== FICHA_SCHEMA_VERSION ||
      !value.data || value.data.version !== FICHA_SCHEMA_VERSION ||
      !Array.isArray(value.data.activities)) {
    return { ok: false, reason: "invalid_backup" };
  }
  const source = value.data.activities;
  const normalized = normalizeFichaData(value.data);
  if (normalized.activities.length !== source.length) {
    return { ok: false, reason: "invalid_records" };
  }
  const ids = source.map(item => item?.id);
  if (new Set(ids).size !== ids.length) return { ok: false, reason: "duplicate_ids" };
  for (const item of source) {
    if (!item || !CLASS_IDS.has(item.classId) && item.classId != null ||
        !validNullableDate(item.assignedOn) || !validNullableDate(item.dueOn) ||
        (item.assignedOn && item.dueOn && item.assignedOn > item.dueOn) ||
        !ACTIVITY_STATUSES.includes(item.status)) {
      return { ok: false, reason: "invalid_records" };
    }
    if (Array.isArray(item.attempts) && item.attempts.some(attempt =>
      !attempt || !validTimestamp(attempt.submittedAt) ||
      (attempt.activityId && attempt.activityId !== item.id))) {
      return { ok: false, reason: "invalid_records" };
    }
    if (Array.isArray(item.feedbackEntries) && item.feedbackEntries.some(entry =>
      !entry || !validTimestamp(entry.recordedAt) ||
      (entry.activityId && entry.activityId !== item.id) ||
      (entry.submissionId && !(item.attempts || []).some(attempt => attempt.id === entry.submissionId)))) {
      return { ok: false, reason: "invalid_records" };
    }
  }
  return { ok: true, data: normalized };
}

export function importFichaBackup(value, targetStorage) {
  const validated = validateFichaBackup(value);
  if (!validated.ok) return validated;
  const result = writeFichaData(validated.data, targetStorage);
  return result.ok ? { ok: true, data: result.data } : result;
}
