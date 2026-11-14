import test from "node:test";
import assert from "node:assert/strict";
import { parsePseudocode, flattenPseudocode } from "../src/core/parser.js";

test("parsea secuencias, entradas, asignaciones y salidas",()=>{
  const ast=parsePseudocode("leer a,b|s=a+b|imp s");
  assert.deepEqual(ast.body.map(node=>node.type),["input","assignment","output"]);
  assert.deepEqual(ast.body[0].variables,["a","b"]);
});

test("parsea decisiones, condiciones anidadas y ramas Sino",()=>{
  const ast=parsePseudocode("leer n|si n>0|imp 1|sino|si n<0|imp -1|sino|imp 0|fin|fin");
  assert.equal(ast.body[1].type,"if");
  assert.equal(ast.body[1].elseBody[0].type,"if");
  assert.equal(flattenPseudocode(ast).filter(row=>row.type==="output").length,3);
});

test("parsea los tres ciclos y conserva los pasos del Para",()=>{
  const ast=parsePseudocode("para i=1;i<=3;i++|imp i|fin|mientras i>0|i=i-1|fin|hacer|i=i+1|hm i<3");
  assert.deepEqual(ast.body.map(node=>node.type),["for","while","doWhile"]);
  assert.deepEqual(ast.body[0].update,{variable:"i",operator:"++",kind:"step"});
});

test("permite ciclos anidados y terminadores correctos",()=>{
  const ast=parsePseudocode("para i=1;i<=2;i++|para j=1;j<=2;j++|imp i*j|fin|fin|hacer|si n>0|imp n|fin|hm n>0");
  assert.equal(ast.body[0].body[0].type,"for");
  assert.equal(ast.body[1].body[0].type,"if");
});

test("los errores de estructura y expresiones identifican la línea",()=>{
  assert.throws(()=>parsePseudocode("si x>0|imp x"),error=>error.name==="PseudocodeSyntaxError"&&error.line===1);
  assert.throws(()=>parsePseudocode("x=1|fin"),error=>error.name==="PseudocodeSyntaxError"&&error.line===2);
  assert.throws(()=>parsePseudocode("x=1|imp @"),error=>error.name==="PseudocodeSyntaxError"&&error.line===2);
});

test("el parser no ejecuta pseudocódigo con eval ni new Function",async()=>{
  const {readFile}=await import("node:fs/promises");
  const source=(await readFile(new URL("../src/core/parser.js",import.meta.url),"utf8"))+
    (await readFile(new URL("../src/core/expression.js",import.meta.url),"utf8"));
  assert.doesNotMatch(source,/\beval\s*\(/);
  assert.doesNotMatch(source,/new\s+Function\s*\(/);
});
