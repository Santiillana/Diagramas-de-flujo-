import test from "node:test";
import assert from "node:assert/strict";
import { freeRect, targetFor, step } from "../src/ui/simulator/camera.js";

test("freeRect reserva espacio de los paneles flotantes y el dock", () => {
 const stage={left:0,top:0,right:1200,bottom:800,width:1200,height:800};
 const result=freeRect(stage,[
  {left:0,top:80,right:300,bottom:650},
  {left:850,top:80,right:1200,bottom:650},
  {left:180,top:700,right:1020,bottom:730}
 ]);
 assert.deepEqual(result,{left:300,top:0,right:850,bottom:700,width:550,height:700});
});

test("targetFor centra un nodo en el rectángulo libre teniendo en cuenta el zoom", () => {
 assert.deepEqual(targetFor({x:200,y:100},{left:100,top:50,width:600,height:400},2),{x:0,y:50});
});

test("step aplica interpolación exponencial con constante de 110 ms y velocidad", () => {
 const current={x:0,y:0},target={x:100,y:-50},next=step(current,target,110,1);
 const factor=1-Math.exp(-1);
 assert.ok(Math.abs(next.x-100*factor)<1e-10);
 assert.ok(Math.abs(next.y+50*factor)<1e-10);
 assert.deepEqual(step(current,target,0,1),current);
 assert.ok(step(current,target,16,.25).x>0);
});
