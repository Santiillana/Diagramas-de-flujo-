import test from "node:test";
import assert from "node:assert/strict";
import { executePseudocode, createTimeline } from "../src/core/interpreter.js";

test("ejecuta una secuencia y captura cada cambio",()=>{
  const result=executePseudocode("leer a,b|s=a+b|imp s",[8,5]);
  assert.equal(result.ok,true);
  assert.deepEqual(result.outputs,[13]);
  assert.deepEqual(result.variables,{a:8,b:5,s:13});
  assert.ok(result.events.some(event=>event.type==="input"));
  assert.ok(result.events.some(event=>event.type==="assignment"));
  assert.ok(result.events.some(event=>event.type==="output"));
});

test("las decisiones guardan la ruta V/F tomada",()=>{
  const yes=executePseudocode("leer n|si n>=3|imp 1|sino|imp 0|fin",[3]);
  const no=executePseudocode("leer n|si n>=3|imp 1|sino|imp 0|fin",[2]);
  assert.deepEqual(yes.outputs,[1]);
  assert.deepEqual(no.outputs,[0]);
  assert.equal(yes.events.find(event=>event.type==="decision").route,"V");
  assert.equal(no.events.find(event=>event.type==="decision").route,"F");
});

test("Mientras puede ejecutar cero iteraciones y Hacer–Mientras ejecuta una",()=>{
  const whileResult=executePseudocode("i=1|mientras i<1|i=i+1|fin|imp i",[]);
  const doResult=executePseudocode("i=0|hacer|i=i+1|hm i<1|imp i",[]);
  assert.equal(whileResult.events.filter(event=>event.type==="loop-enter").length,0);
  assert.equal(doResult.events.filter(event=>event.type==="loop-enter").length,1);
  assert.deepEqual(whileResult.outputs,[1]);
  assert.deepEqual(doResult.outputs,[1]);
});

test("Para respeta preparación, condición y avance",()=>{
  const result=executePseudocode("S=0|para i=1;i<=3;i++|S=S+i|fin|imp S",[]);
  assert.equal(result.ok,true);
  assert.deepEqual(result.outputs,[6]);
  assert.equal(result.events.filter(event=>event.type==="loop-enter").length,3);
  assert.equal(result.events.filter(event=>event.type==="loop-update").length,3);
});

test("un ciclo no terminante se detiene con error pedagógico",()=>{
  const result=executePseudocode("i=1|mientras i>0|i=i+1|fin",[],{maxIterations:5});
  assert.equal(result.ok,false);
  assert.equal(result.error.code,"iteration-limit");
  assert.match(result.error.message,/condición de salida/);
  assert.ok(result.events.some(event=>event.type==="error"));
});

test("faltan o son inválidos los datos generan mensajes precisos",()=>{
  const missing=executePseudocode("leer a,b|imp a+b",[5]);
  const invalid=executePseudocode("leer edad|imp edad",["no es número"]);
  assert.equal(missing.error.code,"missing-input");
  assert.equal(invalid.error.code,"invalid-input");
});

test("retroceso, avance y salto reconstruyen el estado exacto",()=>{
  const execution=executePseudocode("x=2|x=x+3|imp x",[]);
  const timeline=createTimeline(execution);
  const initial=timeline.current;
  const first=timeline.next();
  const second=timeline.next();
  assert.notDeepEqual(first.variables,second.variables);
  timeline.previous();
  assert.deepEqual(timeline.current,first);
  timeline.last();
  assert.deepEqual(timeline.current,execution.events.at(-1));
  timeline.seek(0);
  assert.deepEqual(timeline.current,initial);
});
