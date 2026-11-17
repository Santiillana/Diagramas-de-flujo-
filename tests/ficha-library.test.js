import test from "node:test";
import assert from "node:assert/strict";
import {
  LIBRARY_STORAGE_KEY, archiveLibraryResource, createEmptyLibraryData,
  createLibraryBackup, createLibraryResource, importLibraryBackup,
  readLibraryData, readLibraryDataStrict, updateLibraryResource,
  validateLibraryBackup, validateLibraryData, writeLibraryData
} from "../src/ui/ficha-library-store.js";

function memoryStorage(initial = null) {
  let value = initial;
  return {
    getItem(key) { return key === LIBRARY_STORAGE_KEY ? value : null; },
    setItem(key, next) { if (key === LIBRARY_STORAGE_KEY) value = next; },
    get value() { return value; }
  };
}

function resource(data = createEmptyLibraryData(), extra = {}) {
  const result = createLibraryResource({
    title: "Guía de algoritmos",
    kind: "document",
    url: "https://example.org/guia.pdf",
    tags: "algoritmos, lógica, ALGORITMOS",
    ...extra
  }, data);
  assert.equal(result.ok, true);
  return result;
}

test("la biblioteca crea registros limpios y conserva una clase oficial opcional", () => {
  const created = resource(createEmptyLibraryData(), { classId: "jueves-tics" });
  assert.equal(created.resource.title, "Guía de algoritmos");
  assert.equal(created.resource.classId, "jueves-tics");
  assert.deepEqual(created.resource.tags, ["algoritmos", "lógica"]);
  assert.equal(validateLibraryData(created.data).ok, true);
  assert.equal(createLibraryResource({ title: " ", kind: "note" }).reason, "title_required");
  assert.equal(createLibraryResource({ title: "X", kind: "invented" }).reason, "invalid_kind");
  assert.equal(createLibraryResource({ title: "X", kind: "link", url: "javascript:alert(1)" }).reason, "invalid_url");
  assert.equal(createLibraryResource({ title: "X", kind: "note" }).reason, "resource_content_required");
  assert.equal(createLibraryResource({
    title: "X", kind: "note", description: "Apunte", classId: "missing"
  }).reason, "invalid_class");
});

test("la biblioteca edita y archiva sin destruir registros", () => {
  const created = resource();
  const edited = updateLibraryResource(created.resource.id, {
    title: "Guía actualizada", description: "Notas de repaso", tags: "repaso, lógica"
  }, created.data);
  assert.equal(edited.ok, true);
  assert.equal(edited.resource.title, "Guía actualizada");
  assert.deepEqual(edited.resource.tags, ["repaso", "lógica"]);
  const archived = archiveLibraryResource(edited.resource.id, edited.data);
  assert.equal(archived.ok, true);
  assert.ok(archived.resource.archivedAt);
  assert.equal(archiveLibraryResource(edited.resource.id, archived.data).reason, "not_found");
  assert.equal(archived.data.resources.length, 1);
});

test("la biblioteca rechaza modificaciones sobre almacenamiento dañado", () => {
  const corrupt = memoryStorage("{");
  const created = resource();
  assert.equal(readLibraryDataStrict(corrupt).reason, "corrupt_storage");
  assert.equal(writeLibraryData(created.data, corrupt).reason, "existing_corrupt_storage");
  assert.equal(corrupt.value, "{");
  const future = memoryStorage(JSON.stringify({ version: 8, resources: [] }));
  assert.equal(readLibraryDataStrict(future).reason, "unsupported_schema");
  assert.equal(writeLibraryData(created.data, future).reason, "existing_unsupported_schema");
  assert.deepEqual(readLibraryData(memoryStorage("{")), createEmptyLibraryData());
});

test("el respaldo es estricto, versionado y permite restauración explícita", () => {
  const created = resource();
  const backup = createLibraryBackup(created.data);
  assert.equal(validateLibraryBackup(backup).ok, true);
  const invalidUrl = structuredClone(backup);
  invalidUrl.data.resources[0].url = "javascript:alert(1)";
  assert.equal(validateLibraryBackup(invalidUrl).ok, false);
  const extra = { ...backup, extra: true };
  assert.equal(validateLibraryBackup(extra).reason, "invalid_backup");
  const corrupt = memoryStorage("{");
  const restored = importLibraryBackup(backup, corrupt);
  assert.equal(restored.ok, true);
  assert.equal(readLibraryDataStrict(corrupt).ok, true);
  assert.equal(readLibraryData(corrupt).resources[0].title, "Guía de algoritmos");
});

test("un respaldo no puede incluir recursos sin enlace ni descripción", () => {
  const created = resource();
  const backup = createLibraryBackup(created.data);
  backup.data.resources[0].url = "";
  backup.data.resources[0].description = "";
  assert.equal(validateLibraryBackup(backup).reason, "invalid_records");
});

test("un recurso sin URL puede guardarse como apunte", () => {
  const note = createLibraryResource({
    title: "Resumen de clase",
    kind: "note",
    description: "Repasar secuencia, selección y repetición."
  });
  assert.equal(note.ok, true);
  assert.equal(note.resource.url, "");
});
