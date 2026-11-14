import test from "node:test";
import assert from "node:assert/strict";
import { createFlowPreset, compileFlow, validateFlow, makeNode } from "../src/core/flow-compiler.js";
import { executePseudocode } from "../src/core/interpreter.js";

test("compila y ejecuta una secuencia creada por el constructor",()=>{
  const flow=createFlowPreset("sequence");
  const compiled=compileFlow(flow);
  const result=executePseudocode(compiled.source,[8]);
  assert.equal(result.ok,true);
  assert.deepEqual(result.outputs,[16]);
});

test("compila una decisión con rutas V/F explícitas",()=>{
  const flow=createFlowPreset("decision");
  const compiled=compileFlow(flow);
  assert.match(compiled.source,/si n>0\|imp 1\|sino\|imp 0\|fin/);
  assert.deepEqual(executePseudocode(compiled.source,[5]).outputs,[1]);
  assert.deepEqual(executePseudocode(compiled.source,[-1]).outputs,[0]);
});

test("compila y ejecuta los tres tipos de ciclo",()=>{
  const forFlow=createFlowPreset("for");
  const whileFlow=createFlowPreset("while");
  const doFlow=createFlowPreset("doWhile");
  assert.equal(executePseudocode(compileFlow(forFlow).source,[]).outputs[0],10);
  assert.deepEqual(executePseudocode(compileFlow(whileFlow).source,[]).outputs,[1,2,3]);
  assert.deepEqual(executePseudocode(compileFlow(doFlow).source,[]).outputs,[1,2,3]);
});

test("rechaza diagramas sin inicio, sin fin o sin instrucciones",()=>{
  const base=createFlowPreset("sequence");
  const missingStart={...base,nodes:base.nodes.slice(1)};
  const missingEnd={...base,nodes:base.nodes.slice(0,-1)};
  const empty={version:1,nodes:[makeNode("start",{id:"s"}),makeNode("end",{id:"e"})]};
  assert.equal(validateFlow(missingStart).valid,false);
  assert.equal(validateFlow(missingEnd).valid,false);
  assert.equal(validateFlow(empty).valid,false);
  assert.throws(()=>compileFlow(empty),error=>error.name==="FlowValidationError");
});

test("rechaza decisiones sin dos salidas y ciclos sin cuerpo",()=>{
  const decision=createFlowPreset("decision");
  decision.nodes[2].trueBranch=[];
  const loop=createFlowPreset("while");
  loop.nodes[2].body=[];
  assert.ok(validateFlow(decision).errors.some(error=>error.field==="trueBranch"));
  assert.ok(validateFlow(loop).errors.some(error=>error.field==="body"));
});

test("admite bloques anidados y compila su retorno",()=>{
  const flow=createFlowPreset("decision");
  flow.nodes[2].trueBranch=[makeNode("while",{condition:"n<2",body:[
    makeNode("process",{variable:"n",expression:"n+1"}),
    makeNode("output",{expression:"n"})
  ]})];
  const compiled=compileFlow(flow);
  assert.match(compiled.source,/mientras x<2/);
  assert.deepEqual(executePseudocode(compiled.source,[1]).outputs,[2]);
});

test("cada nodo tiene ID único y los nodos se conservan en orden",()=>{
  const flow=createFlowPreset("sequence");
  flow.nodes.splice(2,0,makeNode("output",{expression:"x"}));
  assert.equal(validateFlow(flow).valid,true);
  flow.nodes[2].id=flow.nodes[1].id;
  assert.ok(validateFlow(flow).errors.some(error=>error.field==="id"));
});
