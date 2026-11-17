import {
  FICHA_BACKUP_FORMAT, createFichaBackup, importFichaBackup,
  readFichaDataStrict, validateFichaBackup
} from "./ficha-store.js";
import {
  LIBRARY_BACKUP_FORMAT, createLibraryBackup, importLibraryBackup,
  readLibraryDataStrict, validateLibraryBackup
} from "./ficha-library-store.js";

export const FULL_FICHA_BACKUP_FORMAT = "traza-full-ficha-backup";
export const FULL_FICHA_BACKUP_VERSION = 1;
const FICHA_KEY = "traza:v4:ficha";
const LIBRARY_KEY = "traza:v4:library";
const ISO_RE = /^\d{4}-\d{2}-\d{2}T/;

function validTimestamp(value) {
  return typeof value === "string" && ISO_RE.test(value) &&
    Number.isFinite(Date.parse(value));
}

function getStorage(target) {
  if (target) return target;
  try { return globalThis.window?.localStorage ?? null; }
  catch { return null; }
}

function snapshot(storage, key) {
  try {
    return { ok: true, value: storage.getItem(key) };
  } catch {
    return { ok: false };
  }
}

function restore(storage, key, previous) {
  if (previous === null) storage.removeItem(key);
  else storage.setItem(key, previous);
}

export function createFullFichaBackup(targetStorage) {
  const storage = getStorage(targetStorage);
  if (!storage) throw new Error("storage_unavailable");
  const fichaRaw = snapshot(storage, FICHA_KEY);
  const libraryRaw = snapshot(storage, LIBRARY_KEY);
  if (!fichaRaw.ok || !libraryRaw.ok) throw new Error("storage_unavailable");

  const fichaData = readFichaDataStrict(storage);
  if (!fichaData.ok) throw new Error("activities_" + fichaData.reason);
  const libraryData = readLibraryDataStrict(storage);
  if (!libraryData.ok) throw new Error("library_" + libraryData.reason);
  const ficha = createFichaBackup(fichaData.data);
  const library = createLibraryBackup(libraryData.data);
  if (ficha.format !== FICHA_BACKUP_FORMAT ||
      library.format !== LIBRARY_BACKUP_FORMAT) throw new Error("backup_format_error");

  return {
    format: FULL_FICHA_BACKUP_FORMAT,
    version: FULL_FICHA_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    personalData: {
      activities: ficha,
      library
    }
  };
}

export function validateFullFichaBackup(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).sort().join("|") !==
        ["exportedAt", "format", "personalData", "version"].join("|") ||
      value.format !== FULL_FICHA_BACKUP_FORMAT ||
      value.version !== FULL_FICHA_BACKUP_VERSION ||
      !validTimestamp(value.exportedAt) ||
      !value.personalData || typeof value.personalData !== "object" ||
      Array.isArray(value.personalData) ||
      Object.keys(value.personalData).sort().join("|") !== "activities|library") {
    return { ok: false, reason: "invalid_backup" };
  }

  const activities = validateFichaBackup(value.personalData.activities);
  if (!activities.ok) return { ok: false, reason: "invalid_activities_backup" };
  const library = validateLibraryBackup(value.personalData.library);
  if (!library.ok) return { ok: false, reason: "invalid_library_backup" };

  return {
    ok: true,
    data: {
      activities: activities.data,
      library: library.data
    }
  };
}

/**
 * localStorage has no multi-key transaction. The restore validates both payloads
 * first, snapshots both old values, and rolls back the first key if the second
 * write fails. A rollback failure is reported rather than hidden.
 */
export function importFullFichaBackup(value, targetStorage) {
  const validation = validateFullFichaBackup(value);
  if (!validation.ok) return validation;
  const storage = getStorage(targetStorage);
  if (!storage) return { ok: false, reason: "unavailable" };

  const oldFicha = snapshot(storage, FICHA_KEY);
  const oldLibrary = snapshot(storage, LIBRARY_KEY);
  if (!oldFicha.ok || !oldLibrary.ok) return { ok: false, reason: "unavailable" };

  const activitiesBackup = value.personalData.activities;
  const libraryBackup = value.personalData.library;
  const activities = importFichaBackup(activitiesBackup, storage);
  if (!activities.ok) return activities;

  const library = importLibraryBackup(libraryBackup, storage);
  if (!library.ok) {
    try {
      restore(storage, FICHA_KEY, oldFicha.value);
      restore(storage, LIBRARY_KEY, oldLibrary.value);
    } catch {
      return { ok: false, reason: "rollback_failed", cause: library.reason };
    }
    return { ok: false, reason: library.reason, rolledBack: true };
  }

  return {
    ok: true,
    data: {
      activities: activities.data,
      library: library.data
    }
  };
}
