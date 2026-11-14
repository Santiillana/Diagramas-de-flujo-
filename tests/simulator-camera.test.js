import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read=path=>readFile(new URL(path,import.meta.url),"utf8");

test("la cámara automática interpola su desplazamiento con amortiguación exponencial",async()=>{
 const simulator=await read("../src/ui/simulator.js");
 assert.match(simulator,/function cameraAnimationTick/);
 assert.match(simulator,/1-Math\.exp\(-elapsed\/105\)/);
 assert.match(simulator,/requestAnimationFrame\(cameraAnimationTick\)/);
 assert.match(simulator,/function moveCameraTo/);
 assert.match(simulator,/cameraTarget/);
});
test("la cámara deja de seguir al usuario durante zoom manual o pan",async()=>{
 const simulator=await read("../src/ui/simulator.js");
 assert.match(simulator,/cameraAuto=false;updateCameraButton\(\);stopCameraAnimation\(\)/);
 assert.match(simulator,/originX:panOffset\.x,originY:panOffset\.y/);
 assert.match(simulator,/applyCanvasOffset\(\)/);
});
test("zoom conserva el punto bajo el cursor y limita la escala",async()=>{
 const simulator=await read("../src/ui/simulator.js");
 assert.match(simulator,/function setDiagramZoomAt/);
 assert.match(simulator,/Math\.max\(\.45,Math\.min\(3\.5,nextZoom\)\)/);
 assert.match(simulator,/focus\.x-projectedX/);
 assert.match(simulator,/focus\.y-projectedY/);
});
test("gesto de pellizco usa dos punteros y ajusta zoom respecto a su centro",async()=>{
 const simulator=await read("../src/ui/simulator.js");
 assert.match(simulator,/const activePointers=new Map\(\)/);
 assert.match(simulator,/startDistance/);
 assert.match(simulator,/startZoom\*factor/);
 assert.match(simulator,/stage\.classList\.add\("is-pinching"\)/);
});
test("pantalla completa usa el rectángulo de viewport y restablece el ajuste",async()=>{
 const [simulator,css]=await Promise.all([
  read("../src/ui/simulator.js"),read("../src/styles/simulator.css")
 ]);
 assert.match(simulator,/document\.fullscreenElement===stage/);
 assert.match(simulator,/stage\.dataset\.fullscreen=String\(active\)/);
 assert.match(simulator,/requestFullscreen\(\{navigationUI:"hide"\}\)/);
 assert.match(css,/:fullscreen \.flow-diagram-container/);
});
