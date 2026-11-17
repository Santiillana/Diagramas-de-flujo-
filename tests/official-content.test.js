import test from "node:test";
import assert from "node:assert/strict";
import { HORARIO_CLASES } from "../src/content/ficha.js";
import {
  ACTIVIDADES_OFICIALES, validateOfficialActivities
} from "../src/content/ficha-activities.js";
import {
  RECURSOS_OFICIALES, validateOfficialResources
} from "../src/content/ficha-resources.js";

test("los catálogos oficiales comienzan vacíos y son válidos", () => {
  assert.deepEqual(ACTIVIDADES_OFICIALES, []);
  assert.deepEqual(RECURSOS_OFICIALES, []);
  assert.equal(validateOfficialActivities().ok, true);
  assert.equal(validateOfficialResources().ok, true);
});

test("las actividades oficiales exigen IDs únicos, fechas civiles y clases reales", () => {
  const valid = [{
    id: "tics-actividad-01",
    title: "Actividad TICS",
    description: "Instrucciones oficiales.",
    classId: "jueves-tics",
    assignedOn: "2026-11-17",
    dueOn: "2026-11-24",
    instructionsUrl: "https://example.org/instrucciones"
  }];
  assert.equal(validateOfficialActivities(valid).ok, true);
  assert.equal(validateOfficialActivities([
    ...valid, { ...valid[0] }
  ]).reason, "duplicate_id");
  assert.equal(validateOfficialActivities([{
    ...valid[0], classId: "clase-inventada"
  }]).reason, "invalid_entry");
  assert.equal(validateOfficialActivities([{
    ...valid[0], dueOn: "2026-02-30"
  }]).reason, "invalid_entry");
  assert.equal(validateOfficialActivities([{
    ...valid[0], assignedOn: "2026-11-25"
  }]).reason, "invalid_date_order");
  assert.equal(validateOfficialActivities([{
    ...valid[0], instructionsUrl: "javascript:alert(1)"
  }]).reason, "invalid_entry");
  assert.equal(validateOfficialActivities([{
    ...valid[0], classId: null, assignedOn: null, dueOn: null,
    instructionsUrl: null
  }]).ok, true);
});

test("los recursos oficiales exigen tipo, clase, enlace seguro o descripción y etiquetas", () => {
  const valid = [{
    id: "guia-tics-01",
    title: "Guía de TICS",
    kind: "document",
    url: "https://example.org/guia.pdf",
    description: "Material oficial de consulta.",
    classId: "jueves-tics",
    tags: ["tics", "guía"]
  }];
  assert.equal(validateOfficialResources(valid).ok, true);
  assert.equal(validateOfficialResources([
    ...valid, { ...valid[0] }
  ]).reason, "duplicate_id");
  assert.equal(validateOfficialResources([{
    ...valid[0], kind: "invented"
  }]).reason, "invalid_entry");
  assert.equal(validateOfficialResources([{
    ...valid[0], classId: "clase-inventada"
  }]).reason, "invalid_entry");
  assert.equal(validateOfficialResources([{
    ...valid[0], url: "javascript:alert(1)"
  }]).reason, "invalid_entry");
  assert.equal(validateOfficialResources([{
    ...valid[0], url: "", description: ""
  }]).reason, "invalid_entry");
  assert.equal(validateOfficialResources([{
    ...valid[0], tags: ["TICS", "tics"]
  }]).reason, "invalid_entry");
  assert.equal(validateOfficialResources([{
    ...valid[0], kind: "book", url: "", classId: null, tags: ["bibliografía"]
  }]).ok, true);
});

test("las validaciones reconocen los identificadores actuales del horario", () => {
  const validClasses = new Set(HORARIO_CLASES.map(item => item.id));
  assert.ok(validClasses.has("jueves-tics"));
  assert.ok(validClasses.has("sabado-bloque-1"));
  assert.ok(validClasses.has("sabado-bloque-2"));
});
