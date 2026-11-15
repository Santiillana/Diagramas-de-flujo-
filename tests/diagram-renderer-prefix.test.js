import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read=path=>readFile(new URL(path,import.meta.url),"utf8");

test("el renderer admite prefijos de IDs para que varias vistas compartan el mismo documento",async()=>{
 const renderer=await read("../src/diagram/renderer.js");
 assert.match(renderer,/idPrefix=String\(options\.idPrefix\?\?""\)/);
 assert.match(renderer,/data-diagram-node-id/);
 assert.match(renderer,/escape\(idPrefix\)[\\s\\S]*flow-svg/);
 assert.match(renderer,/escape\(idPrefix\)[\\s\\S]*flow-arrow/);
 assert.match(renderer,/dataset\.diagramNodeId/);
});
