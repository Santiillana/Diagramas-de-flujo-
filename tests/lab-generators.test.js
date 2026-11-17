import test from "node:test";
import assert from "node:assert/strict";
import { buildArrowChallenge, buildGapChallenge, buildMatchChallenge, mixedModeOrder } from "../src/ui/lab/generators.js";

test("el mismo ejercicio, método e intento generan el mismo hueco",()=>{
  const source="S=0|para i=1;i<=3;i++|S=S+i|fin|imp S";
  const first=buildGapChallenge(22,0,source,4);
  const second=buildGapChallenge(22,0,source,4);
  assert.deepEqual(first,second);
  assert.ok(first.maskedLines[first.index].includes("__HUECO__"));
  assert.equal(source.split("|")[first.index],first.line);
});

test("cada hueco se toma de una asignación real del programa",()=>{
  const source="leer a,b|s=a+b|p=a*b|imp s|imp p";
  for(let attempt=0;attempt<8;attempt++){
    const challenge=buildGapChallenge(1,0,source,attempt);
    assert.ok(challenge);
    assert.match(challenge.line,/^[A-Za-z_]\w*\s*=/);
    assert.ok(challenge.answer.length>0);
  }
});

test("la actividad Sigue la flecha devuelve el siguiente nodo ejecutado",()=>{
  const events=[
    {step:0,nodeId:null},
    {step:1,nodeId:10,sourceText:"leer a"},
    {step:2,nodeId:11,sourceText:"a=a+1"},
    {step:3,nodeId:12,sourceText:"imp a"}
  ];
  const challenge=buildArrowChallenge(events,1,3,0);
  assert.equal(challenge.next.nodeId,11);
  assert.ok(challenge.options.some(option=>option.correct&&option.nodeId===11));
  assert.deepEqual(challenge,buildArrowChallenge(events,1,3,0));
});

test("la práctica mixta no repite el mismo modo en pasos consecutivos",()=>{
  for(let attempt=0;attempt<10;attempt++){
    const modes=mixedModeOrder(22,attempt).slice(0,5);
    for(let index=1;index<modes.length;index++)assert.notEqual(modes[index],modes[index-1]);
  }
});

test("Empareja genera seis parejas completas y deterministas",()=>{
  const first=buildMatchChallenge(22,1,4),second=buildMatchChallenge(22,1,4);
  assert.deepEqual(first,second);
  assert.equal(first.left.length,6);
  assert.equal(first.right.length,6);
  assert.deepEqual(new Set(first.left.map(item=>item.id)),new Set(first.right.map(item=>item.id)));
  assert.equal(new Set(first.left.map(item=>item.label)).size,6);
  assert.equal(new Set(first.right.map(item=>item.label)).size,6);
});
