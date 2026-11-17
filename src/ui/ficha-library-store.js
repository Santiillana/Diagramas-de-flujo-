import { HORARIO_CLASES } from "../content/ficha.js";

export const LIBRARY_STORAGE_KEY = "traza:v4:library";
export const LIBRARY_BACKUP_FORMAT = "traza-library-backup";
export const LIBRARY_SCHEMA_VERSION = 1;
const RESTORE_CORRUPT_LIBRARY = Symbol("restore-corrupt-library-from-validated-backup");
export const LIBRARY_KINDS = Object.freeze(["link", "video", "document", "book", "note"]);

const CLASS_IDS = new Set(HORARIO_CLASES.map(item => item.id));
const ISO_RE = /^\d{4}-\d{2}-\d{2}T/;
const MAX_TEXT = 12000;

function cleanText(value, max = MAX_TEXT) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validTimestamp(value) {
  return typeof value === "string" && ISO_RE.test(value) &&
    Number.isFinite(Date.parse(value));
}

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  return "resource_" + (globalThis.crypto?.randomUUID?.() ||
    Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10));
}

function normalizeUrl(value) {
  const candidate = cleanText(value, 2048);
  if (!candidate) return "";
  try {
    const parsed = new URL(candidate);
    if (!["http:", "https:"].includes(parsed.protocol) ||
        parsed.username || parsed.password) return null;
    return candidate;
  } catch {
    return null;
  }
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return [];
  const tags = [];
  for (const item of value) {
    const tag = cleanText(item, 32).toLocaleLowerCase("es");
    if (tag && !tags.includes(tag)) tags.push(tag);
    if (tags.length === 20) break;
  }
  return tags;
}

function normalizeResource(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;
  const id = cleanText(item.id, 100);
  const title = cleanText(item.title, 240);
  const kind = LIBRARY_KINDS.includes(item.kind) ? item.kind : null;
  const url = normalizeUrl(item.url);
  const createdAt = validTimestamp(item.createdAt) ? item.createdAt : null;
  const updatedAt = validTimestamp(item.updatedAt) ? item.updatedAt : null;
  if (!id || !title || !kind || url === null || !createdAt || !updatedAt) return null;
  const classId = item.classId == null || item.classId === ""
    ? null : CLASS_IDS.has(item.classId) ? item.classId : undefined;
  if (classId === undefined) return null;
  const archivedAt = item.archivedAt == null ? null :
    validTimestamp(item.archivedAt) ? item.archivedAt : undefined;
  if (archivedAt === undefined) return null;
  return {
    id, title, kind, url,
    classId,
    description: cleanText(item.description),
    tags: normalizeTags(item.tags),
    createdAt, updatedAt, archivedAt
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

export function createEmptyLibraryData() {
  return { version: LIBRARY_SCHEMA_VERSION, resources: [] };
}

export function validateLibraryData(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      value.version !== LIBRARY_SCHEMA_VERSION || !Array.isArray(value.resources)) {
    return { ok: false, reason: "invalid_data" };
  }
  const resources = value.resources.map(normalizeResource);
  if (resources.some(item => !item || (!item.url && !item.description)) ||
      resources.length !== value.resources.length) {
    return { ok: false, reason: "invalid_records" };
  }
  const ids = resources.map(item => item.id);
  if (new Set(ids).size !== ids.length) return { ok: false, reason: "duplicate_ids" };
  const normalized = { version: LIBRARY_SCHEMA_VERSION, resources };
  if (stableStringify(normalized) !== stableStringify(value)) {
    return { ok: false, reason: "invalid_records" };
  }
  return { ok: true, data: normalized };
}

function storageFrom(target) {
  if (target) return target;
  try { return globalThis.window?.localStorage ?? null; }
  catch { return null; }
}

export function readLibraryDataStrict(targetStorage) {
  const storage = storageFrom(targetStorage);
  if (!storage) return { ok: false, reason: "unavailable" };
  let raw;
  try { raw = storage.getItem(LIBRARY_STORAGE_KEY); }
  catch { return { ok: false, reason: "unavailable" }; }
  if (raw === null || raw === "") return { ok: true, data: createEmptyLibraryData() };
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch { return { ok: false, reason: "corrupt_storage" }; }
  if (parsed?.version !== LIBRARY_SCHEMA_VERSION) {
    return { ok: false, reason: "unsupported_schema" };
  }
  return validateLibraryData(parsed);
}

export function readLibraryData(targetStorage) {
  const result = readLibraryDataStrict(targetStorage);
  return result.ok ? result.data : createEmptyLibraryData();
}

export function writeLibraryData(value, targetStorage, restoreToken = null) {
  const storage = storageFrom(targetStorage);
  if (!storage) return { ok: false, reason: "unavailable" };
  const incoming = validateLibraryData(value);
  if (!incoming.ok) return incoming;
  const existing = readLibraryDataStrict(storage);
  if (!existing.ok && restoreToken !== RESTORE_CORRUPT_LIBRARY) {
    return { ok: false, reason: "existing_" + existing.reason };
  }
  try {
    storage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(incoming.data));
    if (typeof globalThis.window !== "undefined" &&
        typeof globalThis.CustomEvent !== "undefined") {
      window.dispatchEvent(new CustomEvent("traza:library-change", {
        detail: { type: "updated", data: incoming.data }
      }));
    }
    return { ok: true, data: incoming.data };
  } catch {
    return { ok: false, reason: "write_failed" };
  }
}

export function createLibraryResource(input, current = readLibraryData()) {
  const title = cleanText(input?.title, 240);
  if (!title) return { ok: false, reason: "title_required" };
  if (!LIBRARY_KINDS.includes(input?.kind)) return { ok: false, reason: "invalid_kind" };
  const url = normalizeUrl(input?.url);
  if (url === null) return { ok: false, reason: "invalid_url" };
  if (input?.classId && !CLASS_IDS.has(input.classId)) {
    return { ok: false, reason: "invalid_class" };
  }
  const data = validateLibraryData(current);
  if (!data.ok) return data;
  const timestamp = nowIso();
  const resource = {
    id: makeId(), title, kind: input.kind, url,
    classId: input.classId || null,
    description: cleanText(input.description),
    tags: normalizeTags(typeof input.tags === "string"
      ? input.tags.split(",") : input.tags),
    createdAt: timestamp, updatedAt: timestamp, archivedAt: null
  };
  if (!resource.url && !resource.description) {
    return { ok: false, reason: "resource_content_required" };
  }
  data.data.resources.push(resource);
  return { ok: true, data: data.data, resource };
}

export function updateLibraryResource(id, changes, current = readLibraryData()) {
  const validation = validateLibraryData(current);
  if (!validation.ok) return validation;
  const data = validation.data;
  const resource = data.resources.find(item => item.id === id && !item.archivedAt);
  if (!resource) return { ok: false, reason: "not_found" };
  if (Object.hasOwn(changes, "title") && !cleanText(changes.title, 240)) {
    return { ok: false, reason: "title_required" };
  }
  if (Object.hasOwn(changes, "kind") && !LIBRARY_KINDS.includes(changes.kind)) {
    return { ok: false, reason: "invalid_kind" };
  }
  if (Object.hasOwn(changes, "classId") && changes.classId &&
      !CLASS_IDS.has(changes.classId)) return { ok: false, reason: "invalid_class" };
  const url = Object.hasOwn(changes, "url") ? normalizeUrl(changes.url) : resource.url;
  if (url === null) return { ok: false, reason: "invalid_url" };

  if (Object.hasOwn(changes, "title")) resource.title = cleanText(changes.title, 240);
  if (Object.hasOwn(changes, "kind")) resource.kind = changes.kind;
  if (Object.hasOwn(changes, "url")) resource.url = url;
  if (Object.hasOwn(changes, "classId")) resource.classId = changes.classId || null;
  if (Object.hasOwn(changes, "description")) resource.description = cleanText(changes.description);
  if (Object.hasOwn(changes, "tags")) {
    resource.tags = normalizeTags(typeof changes.tags === "string"
      ? changes.tags.split(",") : changes.tags);
  }
  if (!resource.url && !resource.description) {
    return { ok: false, reason: "resource_content_required" };
  }
  resource.updatedAt = nowIso();
  return { ok: true, data, resource };
}

export function archiveLibraryResource(id, current = readLibraryData()) {
  const validation = validateLibraryData(current);
  if (!validation.ok) return validation;
  const data = validation.data;
  const resource = data.resources.find(item => item.id === id && !item.archivedAt);
  if (!resource) return { ok: false, reason: "not_found" };
  resource.archivedAt = nowIso();
  resource.updatedAt = resource.archivedAt;
  return { ok: true, data, resource };
}

export function createLibraryBackup(current) {
  const source = arguments.length === 0 ? readLibraryDataStrict() :
    validateLibraryData(current);
  if (!source.ok) throw new Error("No se puede crear el respaldo: " + source.reason);
  return {
    format: LIBRARY_BACKUP_FORMAT,
    version: LIBRARY_SCHEMA_VERSION,
    exportedAt: nowIso(),
    data: source.data
  };
}

export function validateLibraryBackup(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      stableStringify(Object.keys(value).sort()) !==
        stableStringify(["data", "exportedAt", "format", "version"]) ||
      value.format !== LIBRARY_BACKUP_FORMAT ||
      value.version !== LIBRARY_SCHEMA_VERSION ||
      !validTimestamp(value.exportedAt)) {
    return { ok: false, reason: "invalid_backup" };
  }
  const data = validateLibraryData(value.data);
  return data.ok ? data : { ok: false, reason: "invalid_records" };
}

export function importLibraryBackup(value, targetStorage) {
  const validation = validateLibraryBackup(value);
  if (!validation.ok) return validation;
  const saved = writeLibraryData(validation.data, targetStorage, RESTORE_CORRUPT_LIBRARY);
  return saved.ok ? { ok: true, data: saved.data } : saved;
}
