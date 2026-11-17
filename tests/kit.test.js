import test from "node:test";
import assert from "node:assert/strict";
import { createClock } from "../src/ui/kit/clock.js";
import { createScene, frameAt, staticFrame, staticSequence } from "../src/ui/kit/scene.js";
import { orthogonalPath, pathAvoidsRects } from "../src/ui/kit/geometry.js";

test("el reloj avanza de forma manual, respeta velocidad, pausa y límites",()=>{
  const frames=[];const clock=createClock({duration:100,onChange:frame=>frames.push(frame)});
  clock.play();clock.advance(20);assert.equal(clock.time,20);
  clock.setSpeed(2);clock.advance(30);assert.equal(clock.time,80);
  clock.pause();clock.advance(10);assert.equal(clock.time,80);
  clock.step(50);assert.equal(clock.time,100);assert.equal(clock.playing,false);
  clock.restart();assert.equal(clock.time,0);assert.ok(frames.length>=5);
});

test("la escena resuelve siempre el mismo fotograma y ofrece secuencia estática",()=>{
  const scene=createScene({id:"demo",momentos:[
    {en:700,etiqueta:"Guarda",hacer:()=>({valor:2})},
    {en:0,etiqueta:"Inicio",hacer:()=>({valor:1})}
  ],estatica:()=>({valor:2})});
  assert.deepEqual(frameAt(scene,800),frameAt(scene,800));
  assert.equal(frameAt(scene,800).index,1);
  assert.deepEqual(staticSequence(scene).map(item=>item.orden),[1,2]);
  assert.deepEqual(staticFrame(scene),{valor:2});
  assert.throws(()=>createScene({id:"invalida",momentos:[],estatica:()=>null}),TypeError);
});

test("las rutas ortogonales pasan junto a figuras sin atravesarlas",()=>{
  const figure={x:40,y:20,width:20,height:30};
  assert.equal(orthogonalPath([{x:0,y:0},{x:0,y:70},{x:100,y:70}]),true);
  assert.equal(pathAvoidsRects([{x:0,y:0},{x:0,y:70},{x:100,y:70}],[figure],12),true);
  assert.equal(pathAvoidsRects([{x:0,y:30},{x:100,y:30}],[figure]),false);
  assert.equal(orthogonalPath([{x:0,y:0},{x:10,y:10}]),false);
});
