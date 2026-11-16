import test from "node:test";
import assert from "node:assert/strict";
import {variableTone} from "../src/ui/variable-tone.js";

test("variableTone produce solo seis clases válidas y mantiene el color de cada variable",()=>{
  const names=["a","b","s","contador","acumulador","promedio","maximo","minimo","i","j","dato","resultado","total","producto","edad","nota"];
  for(const name of names)assert.match(variableTone(name),/^variable-tone-[1-6]$/);
  assert.equal(variableTone("suma"),variableTone("suma"));
  assert.equal(variableTone("Suma"),variableTone("Suma"));
  assert.notEqual(variableTone("suma"),variableTone("Suma"));
  assert.ok(new Set(names.map(variableTone)).size>=4,"La paleta debe distinguir varios nombres de variable.");
  assert.equal(variableTone(null),variableTone(""));
});
