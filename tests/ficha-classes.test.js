import test from "node:test";
import assert from "node:assert/strict";
import { classVigencyState } from "../src/ui/ficha-classes.js";

test("los bloques se clasifican como futuros, vigentes o históricos sin confundir fechas futuras con pasado", () => {
  const today = "2026-11-17";
  assert.equal(classVigencyState({
    vigenteDesde: "2026-11-20",
    vigenteHasta: null
  }, today), "upcoming");
  assert.equal(classVigencyState({
    vigenteDesde: null,
    vigenteHasta: "2026-11-16"
  }, today), "historical");
  assert.equal(classVigencyState({
    vigenteDesde: "2026-11-17",
    vigenteHasta: "2026-11-30"
  }, today), "active");
  assert.equal(classVigencyState({
    vigenteDesde: null,
    vigenteHasta: null
  }, today), "active");
});
