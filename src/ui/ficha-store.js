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

function stableStringify(value) {
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(key =>
      JSON.stringify(key) + ":" + stableStringify(value[key])
    ).join(",") + "}";
  }
  return JSON.stringify(value);
}

/**
 * Strictly validates the complete persisted schema before it is read, exported,
 * or written. Normalization is not allowed to silently discard nested records.
 */
export function validateFichaData(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, reason: "invalid_data" };
  }
  if (value.version !== FICHA_SCHEMA_VERSION) {
    return { ok: false, reason: "unsupported_schema" };
  }
  if (!Array.isArray(value.activities)) {
    return { ok: false, reason: "invalid_data" };
  }
  const normalized = normalizeFichaData(value);
  if (normalized.activities.length !== value.activities.length ||
      stableStringify(normalized) !== stableStringify(value)) {
    return { ok: false, reason: "invalid_records" };
  }
  const activityIds = new Set();
  for (const activity of value.activities) {
    if (activityIds.has(activity.id)) return { ok: false, reason: "duplicate_ids" };
    activityIds.add(activity.id);

    const attemptIds = new Set();
    for (const attempt of activity.attempts) {
      if (attemptIds.has(attempt.id) || attempt.activityId !== activity.id ||
          !validTimestamp(attempt.submittedAt) ||
          attempt.attemptNumber < 1 ||
          ![attempt.summary, attempt.evidenceUrl, attempt.studentNote].every(item => typeof item === "string")) {
        return { ok: false, reason: "invalid_records" };
      }
      attemptIds.add(attempt.id);
    }

    const feedbackIds = new Set();
    for (const feedback of activity.feedbackEntries) {
      if (feedbackIds.has(feedback.id) || feedback.activityId !== activity.id ||
          (feedback.submissionId && !attemptIds.has(feedback.submissionId)) ||
          !validTimestamp(feedback.recordedAt) ||
          feedback.source !== "student_transcription" ||
          (feedback.score !== null && !Number.isFinite(feedback.score))) {
        return { ok: false, reason: "invalid_records" };
      }
      feedbackIds.add(feedback.id);
    }

    const eventIds = new Set();
    for (const event of activity.events) {
      if (eventIds.has(event.id) || event.activityId !== activity.id ||
          !validTimestamp(event.occurredAt) ||
          !EVENT_TYPES.has(event.type) ||
          !["student", "backup_import"].includes(event.source)) {
        return { ok: false, reason: "invalid_records" };
      }
      eventIds.add(event.id);
    }
  }
  return { ok: true, data: normalized };
}

function storageFrom(target) {
  if (target) return target;
  try { return globalThis.window?.localStorage ?? null; }
  catch { return null; }
}

export function readFichaDataStrict(targetStorage) {
  const storage = storageFrom(targetStorage);
  if (!storage) return { ok: false, reason: "unavailable" };
  let raw;
  try {
    raw = storage.getItem(FICHA_STORAGE_KEY);
  } catch {
    return { ok: false, reason: "unavailable" };
  }
  if (raw === null || raw === "") {
    return { ok: true, data: createEmptyFichaData(), empty: true };
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "corrupt_storage" };
  }
  const validation = validateFichaData(parsed);
  return validation.ok
    ? { ok: true, data: validation.data, empty: false }
    : { ok: false, reason: validation.reason, rawVersion: parsed?.version };
}

export function readFichaData(targetStorage) {
  const result = readFichaDataStrict(targetStorage);
  return result.ok ? result.data : createEmptyFichaData();
}

function emitChange(detail) {
  if (typeof globalThis.window === "undefined" ||
      typeof globalThis.CustomEvent === "undefined") return;
  globalThis.window.dispatchEvent(new CustomEvent("traza:ficha-change", { detail }));
}

export function writeFichaData(value, targetStorage, options = {}) {
  const storage = storageFrom(targetStorage);
  if (!storage) return { ok: false, reason: "unavailable", data: createEmptyFichaData() };

  const incoming = validateFichaData(value);
  if (!incoming.ok) return { ok: false, reason: incoming.reason, data: createEmptyFichaData() };

  const existing = readFichaDataStrict(storage);
  if (!existing.ok && options.replaceInvalid !== true) {
    return { ok: false, reason: "existing_" + existing.reason, data: createEmptyFichaData() };
  }

  try {
    storage.setItem(FICHA_STORAGE_KEY, JSON.stringify(incoming.data));
    emitChange({ type: "updated", data: incoming.data });
    return { ok: true, data: incoming.data };
  } catch {
    return { ok: false, reason: "write_failed", data: existing.ok ? existing.data : createEmptyFichaData() };
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

export function createFichaBackup(current) {
  let data;
  if (arguments.length === 0) {
    const stored = readFichaDataStrict();
    if (!stored.ok) throw new Error("No se puede crear el respaldo: " + stored.reason);
    data = stored.data;
  } else {
    const validated = validateFichaData(current);
    if (!validated.ok) throw new Error("Los datos no son válidos para respaldar: " + validated.reason);
    data = validated.data;
  }
  return {
    format: FICHA_BACKUP_FORMAT,
    version: FICHA_SCHEMA_VERSION,
    exportedAt: nowIso(),
    data
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
  const dataValidation = validateFichaData(value.data);
  if (!dataValidation.ok) return dataValidation;
  const normalized = dataValidation.data;
  const ids = source.map(item => item?.id);
  if (new Set(ids).size !== ids.length) return { ok: false, reason: "duplicate_ids" };
  for (const item of source) {
    if (!item || !cleanText(item.id, 100) || !cleanText(item.title, 240) ||
        (!CLASS_IDS.has(item.classId) && item.classId != null) ||
        !validNullableDate(item.assignedOn) || !validNullableDate(item.dueOn) ||
        (item.assignedOn && item.dueOn && item.assignedOn > item.dueOn) ||
        !ACTIVITY_STATUSES.includes(item.status) ||
        !validTimestamp(item.createdAt) || !validTimestamp(item.updatedAt) ||
        !Array.isArray(item.attempts) || !Array.isArray(item.feedbackEntries) ||
        !Array.isArray(item.events)) {
      return { ok: false, reason: "invalid_records" };
    }
    const attemptIds = item.attempts.map(attempt => attempt?.id);
    if (new Set(attemptIds).size !== attemptIds.length ||
        item.attempts.some((attempt, index) =>
          !attempt || !cleanText(attempt.id, 100) ||
          !validTimestamp(attempt.submittedAt) ||
          (attempt.activityId && attempt.activityId !== item.id) ||
          (attempt.attemptNumber !== undefined && attempt.attemptNumber !== index + 1))) {
      return { ok: false, reason: "invalid_records" };
    }
    const feedbackIds = item.feedbackEntries.map(entry => entry?.id);
    if (new Set(feedbackIds).size !== feedbackIds.length ||
        item.feedbackEntries.some(entry =>
          !entry || !cleanText(entry.id, 100) ||
          !validTimestamp(entry.recordedAt) ||
          !["favorable", "correction_requested", "informational"].includes(entry.result) ||
          !cleanText(entry.comment) ||
          (entry.activityId && entry.activityId !== item.id) ||
          (entry.submissionId && !item.attempts.some(attempt => attempt.id === entry.submissionId)))) {
      return { ok: false, reason: "invalid_records" };
    }
    const eventIds = item.events.map(event => event?.id);
    if (new Set(eventIds).size !== eventIds.length ||
        item.events.some(event =>
          !event || !cleanText(event.id, 100) ||
          !EVENT_TYPES.has(event.type) ||
          !validTimestamp(event.occurredAt) ||
          (event.activityId && event.activityId !== item.id))) {
      return { ok: false, reason: "invalid_records" };
    }
  }
  return { ok: true, data: normalized };
}

export function importFichaBackup(value, targetStorage) {
  const validated = validateFichaBackup(value);
  if (!validated.ok) return validated;
  const result = writeFichaData(validated.data, targetStorage, { replaceInvalid: true });
  return result.ok ? { ok: true, data: result.data } : result;
}
