import test from "node:test";
import assert from "node:assert/strict";
import { executePseudocode } from "../src/core/interpreter.js";
import { renderScene } from "../src/ui/scenes/index.js";

test("las escenas de secuencia representan inicio, entrada, proceso, decisión, salida y fin",()=>{
  const execution=executePseudocode(
    'leer a,b|s=a+b|si a<b|imp s|sino|imp 0|fin',
    [2,3]
  );
  assert.equal(execution.ok,true);
  const context={execution,events:execution.events,inputValues:[2,3]};
  const kinds=new Map(execution.events.map(event=>[event.type,renderScene(event,context).model.kind]));
  assert.equal(kinds.get("program-start"),"start");
  assert.equal(kinds.get("input"),"input");
  assert.equal(kinds.get("assignment"),"process");
  assert.equal(kinds.get("decision"),"decision");
  assert.equal(kinds.get("branch"),"decision");
  assert.equal(kinds.get("output"),"output");
  assert.equal(kinds.get("program-end"),"end");
});

test("las tres estructuras de repetición conservan su escena y los eventos de vuelta/salida",()=>{
  const samples=[
    ["para i=1;i<=2;i++|imp i|fin","for-cond"],
    ["i=1|mientras i<=2|imp i|i=i+1|fin","while-cond"],
    ["i=3|hacer|imp i|i=i+1|hm i<=2","dowhile-cond"]
  ];
  for(const [source,expectedKind] of samples){
    const execution=executePseudocode(source,[]);
    assert.equal(execution.ok,true,source);
    const context={execution,events:execution.events};
    const condition=execution.events.find(event=>event.type==="loop-condition");
    assert.ok(condition,source);
    assert.equal(renderScene(condition,context).model.kind,expectedKind);
    const entering=execution.events.find(event=>event.type==="loop-enter");
    const exiting=execution.events.find(event=>event.type==="loop-exit");
    assert.equal(renderScene(entering,context).model.kind,"loop-iteration");
    assert.equal(renderScene(exiting,context).model.kind,"loop-exit");
  }
});

test("una entrada nueva produce valores y textos distintos en la escena",()=>{
  const first=executePseudocode("leer n|n=n+1|imp n",[4]);
  const second=executePseudocode("leer n|n=n+1|imp n",[9]);
  const renderFinal=execution=>{
    const event=execution.events.find(item=>item.type==="assignment");
    return renderScene(event,{execution,events:execution.events,inputValues:[execution.events.find(x=>x.type==="input").value]}).markup;
  };
  assert.notEqual(renderFinal(first),renderFinal(second));
  assert.match(renderFinal(first),/5/);
  assert.match(renderFinal(second),/10/);
});

test("el marcado dinámico escapa texto y proporciona texto alternativo",()=>{
  const scene=renderScene({
    kind:"process",expression:"<script>&",substituted:"<script>&",partials:[],
    previousVariables:{},variable:"x",next:"<img>",
    scene:{title:"<b>título</b>",body:"texto & detalle"}
  });
  assert.doesNotMatch(scene.markup,/<script>|<img>/i);
  assert.match(scene.markup,/&lt;script&gt;&amp;/);
  assert.match(scene.alt,/&lt;b&gt;/);
  assert.ok(scene.alt.length>0);
});

test("cada escena devuelve una descripción accesible no vacía",()=>{
  const execution=executePseudocode("leer n|n=n*2|si n>3|imp n|fin",[2]);
  for(const event of execution.events){
    const scene=renderScene(event,{execution,events:execution.events,inputValues:[2]});
    assert.ok(scene.alt.length>0,event.type);
    assert.ok(scene.markup.length>0,event.type);
  }
});
