import test from "node:test";
import assert from "node:assert/strict";
import { DIAS_SIN_CLASES, FICHA_TIME_ZONE, HORARIO_CLASES } from "../src/content/ficha.js";

test("el horario oficial usa America/Bogota y contiene ocho bloques", () => {
  assert.equal(FICHA_TIME_ZONE, "America/Bogota");
  assert.equal(HORARIO_CLASES.length, 8);
  assert.deepEqual(DIAS_SIN_CLASES, [0]);
});

test("el cambio de materia del lunes respeta la fecha de corte", () => {
  const anterior = HORARIO_CLASES.find(item => item.id === "lunes-evaluar-requisitos");
  const vigente = HORARIO_CLASES.find(item => item.id === "lunes-matematicas");
  assert.equal(anterior.vigenteHasta, "2026-11-01");
  assert.equal(anterior.materia, "Evaluar requisitos");
  assert.equal(vigente.vigenteDesde, "2026-11-02");
  assert.equal(vigente.materia, "Matemáticas");
  assert.equal(vigente.instructor, "Yilliam Romero");
});

test("los dos bloques del sábado conservan instructor y materia sin inventar", () => {
  const sabado = HORARIO_CLASES.filter(item => item.diaSemana === 6);
  assert.equal(sabado.length, 2);
  assert.deepEqual(sabado.map(item => [item.horaInicio, item.horaFin, item.instructor, item.materia]), [
    ["12:00", "16:00", "Gloria Romero", null],
    ["16:00", "22:00", "Jair Castañeda", null]
  ]);
});

test("los días lectivos y horarios usan formato 24 horas", () => {
  for (const item of HORARIO_CLASES) {
    assert.match(item.horaInicio, /^(?:[01]\d|2[0-3]):[0-5]\d$/);
    assert.match(item.horaFin, /^(?:[01]\d|2[0-3]):[0-5]\d$/);
    assert.ok(item.diaSemana >= 1 && item.diaSemana <= 6);
  }
});
