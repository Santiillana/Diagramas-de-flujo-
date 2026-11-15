import { exercises, getExercise } from "../content/exercises.js";
import { traceExpression } from "../core/expression.js";
import { executePseudocode, createTimeline } from "../core/interpreter.js";
import { parsePseudocode } from "../core/parser.js";
import { layoutFlow } from "../diagram/layout.js";
import { renderDiagram, highlightDiagram } from "../diagram/renderer.js";
import { renderScene } from "./scenes/index.js";

const $ = s => document.querySelector(s);
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt = value => typeof value==="number" ? String(Number(value.toFixed(6))) : String(value);
const labels = {basic:"Básico",intermediate:"Intermedio",advanced:"Avanzado"};
let exerciseId=1, methodIndex=0, exercise=null, execution=null, timeline=null, diagram=null, timer=null;
let cameraAuto=true, panState=null, pseudocodeSize=17, selectedVariable=null, defaultInputSample=[];
let diagramFitWidth=0, diagramFitHeight=0, fitScale=1, zoom=1, panOffset={x:0,y:0};
let cameraRaf=0, pointerState=new Map(), pinchState=null;
let routeGraph=new Map(), routeWeights=new Map(), routeCache=new Map(), tokenRaf=0;

function readPseudocodeSize(){
  try{
    const value=Number(window.localStorage.getItem("traza:v2:pseudocode-size")??window.localStorage.getItem("traza-pseudocode-size"));
    return Number.isFinite(value)&&value>=13&&value<=26?value:17;
  }catch{return 17;}
}


function stop(){
  if(timer!==null){clearInterval(timer);timer=null;}
  cancelChoreography();
  const b=$("#simulator-play");
  if(b){b.textContent="▶";b.title="Reproducir";b.setAttribute("aria-label","Reproducir");}
}
function method(){return exercise?.methods[methodIndex]??null;}


const WINDOW_META=[
  {id:"context",label:"Problema",icon:"P",selector:"#sim-window-context",side:"left"},
  {id:"data",label:"Tus datos",icon:"D",selector:"#sim-window-data",side:"left"},
  {id:"pseudocode",label:"Pseudocódigo",icon:"{}",selector:"#sim-window-code",side:"left"},
  {id:"scene",label:"En escena",icon:"E",selector:"#PV",side:"right"},
  {id:"variables",label:"Variables",icon:"V",selector:"#PR>.variables-panel",side:"right"},
  {id:"output",label:"Pantalla",icon:"▣",selector:"#PR>.output-panel",side:"right"},
  {id:"history",label:"Historial",icon:"H",selector:"#PR>.trace-panel",side:"right"}
];
const minimizedWindows=new Set(),pinnedWindows=new Set(),restoredOverrides=new Set();
let dismissedVfStep=-1,vfRaf=0;
function getWindowElement(id){
  const meta=WINDOW_META.find(item=>item.id===id);
  return meta?document.querySelector(meta.selector):null;
}
function persistWindowState(){
  try{window.localStorage.setItem("traza:v2:windows",JSON.stringify({minimized:[...minimizedWindows],pinned:[...pinnedWindows]}));}catch{}
}
function loadWindowState(){
  try{
    const saved=JSON.parse(window.localStorage.getItem("traza:v2:windows")??"{}");
    (saved.minimized??[]).forEach(id=>minimizedWindows.add(id));
    (saved.pinned??[]).forEach(id=>pinnedWindows.add(id));
  }catch{}
}
function windowCounter(id){
  if(id==="context")return exerciseId;
  if(id==="data")return parseInputs().length;
  if(id==="pseudocode")return $("#pseudocode-lines")?.children.length??0;
  if(id==="scene")return timeline?timeline.index+1:0;
  if(id==="variables")return Object.keys(timeline?.current?.variables??{}).length;
  if(id==="output")return timeline?.current?.outputs?.length??0;
  return execution?.events?.length??0;
}
function renderWindowRail(){
  const rail=$("#sim-window-rail");
  if(!rail)return;
  const compact=innerWidth<1100&&innerWidth>900;
  const hidden=WINDOW_META.filter(meta=>{
    const el=getWindowElement(meta.id);
    const auto=compact&&meta.side==="left"&&!pinnedWindows.has(meta.id)&&!restoredOverrides.has(meta.id);
    return Boolean(el?.hidden||auto);
  });
  rail.innerHTML=hidden.map(meta=>{
    const count=windowCounter(meta.id);
    return '<button type="button" class="sim-window-restore" data-window-restore="'+meta.id+'" aria-label="Restaurar '+meta.label+(count?" · "+count:"")+'" title="'+meta.label+(count?" · "+count:"")+'"><span>'+meta.icon+'</span><b>'+count+'</b></button>';
  }).join("");
  rail.hidden=hidden.length===0;
}
function applyWindowState(){
  const compact=innerWidth<1100&&innerWidth>900;
  for(const meta of WINDOW_META){
    const el=getWindowElement(meta.id);
    if(!el)continue;
    const auto=compact&&meta.side==="left"&&!pinnedWindows.has(meta.id)&&!restoredOverrides.has(meta.id);
    el.hidden=minimizedWindows.has(meta.id)||auto;
    const pin=document.querySelector('[data-window-pin="'+meta.id+'"]');
    if(pin){
      pin.setAttribute("aria-pressed",String(pinnedWindows.has(meta.id)));
      pin.classList.toggle("is-pinned",pinnedWindows.has(meta.id));
      pin.title=pinnedWindows.has(meta.id)?"Desfijar ventana":"Fijar ventana";
    }
  }
  renderWindowRail();
  requestAnimationFrame(()=>{if(diagramFitWidth){updateMinimap();if(cameraAuto&&timeline)centerActiveNode(timeline.current,"auto");}});
}
function minimizeWindow(id){
  if(!WINDOW_META.some(item=>item.id===id))return;
  minimizedWindows.add(id);restoredOverrides.delete(id);persistWindowState();applyWindowState();
}
function restoreWindow(id){
  minimizedWindows.delete(id);
  const meta=WINDOW_META.find(item=>item.id===id);
  if(meta?.side==="left"&&innerWidth<1100&&innerWidth>900)restoredOverrides.add(id);
  persistWindowState();applyWindowState();
}
function toggleWindowPin(id){
  if(pinnedWindows.has(id))pinnedWindows.delete(id);
  else pinnedWindows.add(id);
  persistWindowState();applyWindowState();
}
function bindWindows(){
  loadWindowState();
  applyWindowState();
  document.addEventListener("click",event=>{
    const minimize=event.target.closest("[data-window-minimize]");
    const pin=event.target.closest("[data-window-pin]");
    const restore=event.target.closest("[data-window-restore]");
    if(minimize){minimizeWindow(minimize.dataset.windowMinimize);return;}
    if(pin){toggleWindowPin(pin.dataset.windowPin);return;}
    if(restore){restoreWindow(restore.dataset.windowRestore);return;}
  });
  window.addEventListener("resize",()=>{restoredOverrides.clear();applyWindowState();});
}
function rectIntersects(a,b,gap=0){
  return a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
}
function contextWindowMarkup(event){
  const name=event.change?.name??"Variable";
  if(event.type==="input")return {
    title:"Entra un dato",
    body:'<div class="sim-vf-flow"><span class="sim-vf-chip">'+esc(fmt(event.value??event.change?.value))+'</span><span>↓</span><b>'+esc(name)+'</b></div><p>El siguiente valor de entrada se guarda en la variable '+esc(name)+'.</p>'
  };
  if(["assignment","loop-init","loop-update"].includes(event.type)&&event.change){
    return {
      title:"La variable cambia",
      body:'<div class="sim-vf-flow">'+(event.change.previous===undefined?"":'<s>'+esc(fmt(event.change.previous))+'</s><span>→</span>')+'<b>'+esc(name)+'</b><strong>'+esc(fmt(event.change.value))+'</strong></div><p>'+esc(brief(event))+'</p>'
    };
  }
  if(event.type==="decision"||event.type==="loop-condition"||event.type==="branch"){
    return {
      title:event.type==="decision"?"Decisión":"Condición del ciclo",
      body:'<p class="sim-vf-condition">'+esc(substituteValues(event.condition??event.sourceText,event.variables))+'</p><strong class="sim-vf-result '+(event.result?"is-true":"is-false")+'">'+(event.result?"V · VERDADERA":"F · FALSA")+'</strong><p>'+(event.result?"Se sigue la rama verdadera.":"Se sigue la rama falsa.")+'</p>'
    };
  }
  if(event.type==="output")return {title:"Sale en pantalla",body:'<div class="sim-vf-output">'+esc(fmt(event.value))+'</div><p>El resultado aparece en Pantalla.</p>'};
  if(event.type==="program-end")return {title:"Algoritmo finalizado",body:'<p>El recorrido terminó. Las variables y la pantalla conservan el estado final.</p>'};
  return {title:"Paso activo",body:'<p>'+esc(brief(event))+'</p>'};
}
function diagramNodeForEvent(event){
  if(!diagram||!event)return null;
  const sourceId=event.nodeId===null||event.nodeId===undefined?null:String(event.nodeId);
  return diagram.nodes.find(node=>sourceId!==null&&String(node.sourceId)===sourceId)
    ??diagram.nodes.find(node=>event.sourceLine!==null&&event.sourceLine!==undefined&&Number(node.line)===Number(event.sourceLine))
    ??null;
}
function drawContextWire(fromRect,toRect){
  const wire=$("#vf-wire"),path=$("#vf-wire-path");
  if(!wire||!path||!fromRect||!toRect){if(wire)wire.hidden=true;return;}
  const sx=fromRect.left+fromRect.width/2,sy=fromRect.top+fromRect.height/2;
  const tx=toRect.left>sx?toRect.left:toRect.right;
  const ty=Math.max(toRect.top+14,Math.min(toRect.bottom-14,sy));
  const bend=(tx-sx)*.45;
  path.setAttribute("d","M "+sx+" "+sy+" C "+(sx+bend)+" "+sy+" "+(tx-bend)+" "+ty+" "+tx+" "+ty);
  wire.hidden=false;
}
function hideContextWire(){
  const wire=$("#vf-wire");
  if(wire)wire.hidden=true;
}
function placeContextWindow(event){
  const box=$("#vf"),model=diagramNodeForEvent(event);
  const node=model?document.getElementById("flow-node-"+model.id):null;
  if(!box||box.hidden)return;
  document.querySelectorAll("#flow-svg .diagram-node.has-context-fallback").forEach(el=>el.classList.remove("has-context-fallback"));
  const nodeRect=node?.getBoundingClientRect();
  const width=box.offsetWidth||278,height=box.offsetHeight||132,margin=12;
  const free=freeCanvasRect();
  const workspace={left:Math.max(8,free.left+8),top:Math.max(54,free.top+8),right:Math.min(innerWidth-8,free.right-8),bottom:Math.min(innerHeight-8,free.bottom-8)};
  const figure=nodeRect??{left:innerWidth/2-30,top:innerHeight/2-20,right:innerWidth/2+30,bottom:innerHeight/2+20,width:60,height:40};
  const midY=figure.top+figure.height/2,midX=figure.left+figure.width/2;
  const candidates=[
    {left:figure.right+margin,top:midY-height/2},
    {left:figure.left-width-margin,top:midY-height/2},
    {left:midX-width/2,top:figure.top-height-margin},
    {left:midX-width/2,top:figure.bottom+margin},
    {left:workspace.left,top:workspace.top},
    {left:workspace.right-width,top:workspace.top},
    {left:workspace.left,top:workspace.bottom-height},
    {left:workspace.right-width,top:workspace.bottom-height}
  ];
  const activeId=String(model?.id??"");
  const inflated=element=>{
    const r=element.getBoundingClientRect(),pad=element.matches("path")?9:3;
    return {left:r.left-pad,top:r.top-pad,right:r.right+pad,bottom:r.bottom+pad};
  };
  const obstacles=[
    ...document.querySelectorAll("#flow-svg .flow-edges path,#flow-svg .diagram-edge-label,#flow-svg .diagram-node:not(#flow-node-"+activeId+")"),
    ...document.querySelectorAll("#PL .sim-window,#RC #PV,#PR>.panel,#dock,#hd")
  ].filter(el=>getComputedStyle(el).display!=="none").map(inflated);
  const valid=rect=>rect.left>=workspace.left&&rect.top>=workspace.top&&rect.left+width<=workspace.right&&rect.top+height<=workspace.bottom&&
    !rectIntersects(rect,figure,8)&&!obstacles.some(other=>rectIntersects(rect,other,2));
  const chosen=candidates.find(valid);
  box.dataset.anchorNode=String(model?.id??"");
  box.dataset.anchorSourceLine=String(event.sourceLine??"");
  if(!chosen){
    box.hidden=true;
    box.dataset.cable="fallback-scene";
    if(node)node.classList.add("has-context-fallback");
    const scene=$("#PV")?.getBoundingClientRect();
    drawContextWire(nodeRect,scene);
    return;
  }
  box.hidden=false;
  box.style.left=chosen.left+"px";box.style.top=chosen.top+"px";
  const distance=Math.hypot(Math.max(0,chosen.left-figure.right,figure.left-(chosen.left+width)),Math.max(0,chosen.top-figure.bottom,figure.top-(chosen.top+height)));
  const cable=distance>300;
  box.dataset.cable=String(cable);
  if(cable)drawContextWire(nodeRect,box.getBoundingClientRect());
  else hideContextWire();
}
function showContextWindow(event){
  const box=$("#vf");
  if(!box||!event||timeline?.index===dismissedVfStep)return;
  const view=contextWindowMarkup(event);
  $("#vf-title").textContent=view.title;
  $("#vf-content").innerHTML=view.body;
  box.hidden=false;
  if(vfRaf)cancelAnimationFrame(vfRaf);
  const started=performance.now();
  const track=now=>{
    placeContextWindow(event);
    if(now-started<620)vfRaf=requestAnimationFrame(track);
    else vfRaf=0;
  };
  vfRaf=requestAnimationFrame(track);
}
function closeContextWindow(){
  dismissedVfStep=timeline?.index??-1;
  const box=$("#vf");if(box)box.hidden=true;
  hideContextWire();
  if(vfRaf)cancelAnimationFrame(vfRaf);vfRaf=0;
}


let choreographyPlayback=false,flightRaf=0,flightTimeouts=[],pulseTimeouts=[];
function cancelChoreography(){
  if(flightRaf)cancelAnimationFrame(flightRaf);
  flightRaf=0;
  flightTimeouts.forEach(clearTimeout);flightTimeouts=[];
  pulseTimeouts.forEach(clearTimeout);pulseTimeouts=[];
  document.querySelectorAll(".sim-flight-chip").forEach(element=>element.remove());
  document.querySelectorAll("[data-pulse]").forEach(element=>{
    element.classList.remove("is-pulsing");
    delete element.dataset.pulse;
  });
  document.querySelectorAll(".sim-pulse-count").forEach(element=>element.remove());
}
function reducedMotion(){
  return document.documentElement.dataset.motion==="reduced"||
    matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function pulseWindow(id){
  const meta=WINDOW_META.find(item=>item.id===id);
  const panel=meta?getWindowElement(id):null;
  const target=panel?.hidden?document.querySelector('[data-window-restore="'+id+'"]'):panel;
  if(!target)return;
  target.classList.remove("is-pulsing");
  void target.offsetWidth;
  target.classList.add("is-pulsing");
  target.dataset.pulse=String((Number(target.dataset.pulse)||0)+1);
  let mark=target.querySelector(":scope > .sim-pulse-count");
  if(!mark){mark=document.createElement("span");mark.className="sim-pulse-count";target.append(mark);}
  mark.textContent="+1";
  const timeout=setTimeout(()=>{
    target.classList.remove("is-pulsing");delete target.dataset.pulse;mark.remove();
  },900);
  pulseTimeouts.push(timeout);
}
function flightTargetFor(event,targetId){
  if(targetId==="variables"&&event.change?.name){
    const button=[...document.querySelectorAll("[data-variable-history]")].find(el=>el.dataset.variableHistory===event.change.name);
    return button?.closest("tr")?.lastElementChild??getWindowElement("variables");
  }
  if(targetId==="output")return $("#simulator-output li:last-child")??getWindowElement("output");
  return getWindowElement(targetId);
}
function animateFlight(event,targetId){
  if(!event||reducedMotion()||currentSpeedFactor()>=4)return false;
  const source=event.type==="input"?$("#simulator-inputs"):(()=>{
    const model=diagramNodeForEvent(event);
    return model?document.getElementById("flow-node-"+model.id):null;
  })();
  const target=flightTargetFor(event,targetId);
  if(!source||!target||target.hidden)return false;
  const a=source.getBoundingClientRect(),b=target.getBoundingClientRect();
  const start={x:a.left+a.width/2,y:a.top+a.height/2},finish={x:b.left+b.width/2,y:b.top+b.height/2};
  if(![start.x,start.y,finish.x,finish.y].every(Number.isFinite))return false;
  const layer=$("#simulator-flight-layer")??(()=>{
    const node=document.createElement("div");node.id="simulator-flight-layer";node.setAttribute("aria-hidden","true");
    document.body.append(node);return node;
  })();
  const chip=document.createElement("span");
  chip.className="sim-flight-chip";
  chip.dataset.destination=targetId;
  chip.textContent=fmt(event.change?.value??event.value??event.variables?.[event.change?.name]??"");
  chip.style.transform="translate3d("+start.x+"px,"+start.y+"px,0)";
  layer.append(chip);
  const control={x:(start.x+finish.x)/2,y:Math.min(start.y,finish.y)-52};
  const duration=700/currentSpeedFactor();let began=0;
  const frame=now=>{
    if(!began)began=now;
    const t=Math.min(1,(now-began)/duration),u=1-t;
    const x=u*u*start.x+2*u*t*control.x+t*t*finish.x;
    const y=u*u*start.y+2*u*t*control.y+t*t*finish.y;
    chip.style.transform="translate3d("+x+"px,"+y+"px,0)";
    if(t<1)flightRaf=requestAnimationFrame(frame);
    else{
      chip.remove();flightRaf=0;pulseWindow(targetId);
    }
  };
  flightRaf=requestAnimationFrame(frame);
  return true;
}
function choreographEvent(event){
  if(!event)return;
  const speed=currentSpeedFactor();
  if(reducedMotion()||speed>=4){
    if(event.type==="input"||event.change)pulseWindow("variables");
    else if(event.type==="output")pulseWindow("output");
    else if(event.type==="decision"||event.type==="loop-condition")pulseWindow("scene");
    else if(event.type==="program-end"){pulseWindow("variables");pulseWindow("output");}
    return;
  }
  if(event.type==="input"){
    if(!animateFlight(event,"variables"))pulseWindow("variables");
  }else if(["assignment","loop-init","loop-update"].includes(event.type)&&event.change){
    if(!animateFlight(event,"variables"))pulseWindow("variables");
  }else if(event.type==="output"){
    if(!animateFlight(event,"output"))pulseWindow("output");
  }else if(event.type==="decision"||event.type==="loop-condition"){
    pulseWindow("scene");
  }else if(event.type==="program-end"){
    pulseWindow("variables");pulseWindow("output");
  }
}

function paintExerciseSelector(){
  const host=$("#sim-exercise-strip");
  if(!host)return;
  if(host.dataset.ready!=="true"){
    host.innerHTML=exercises.map(item=>{
      const level=item.level==="basic"?"basic":item.level==="advanced"?"advanced":"intermediate";
      return '<button class="sim-exercise-chip level-'+level+'" type="button" data-sim-exercise="'+item.id+'" aria-label="Ejercicio '+item.id+' - '+esc(item.title)+'" title="'+esc(item.title)+'">'+String(item.id).padStart(2,"0")+'</button>';
    }).join("");
    host.dataset.ready="true";
  }
  host.querySelectorAll("[data-sim-exercise]").forEach(button=>{
    const active=Number(button.dataset.simExercise)===exerciseId;
    button.classList.toggle("is-selected",active);
    button.setAttribute("aria-pressed",String(active));
  });
}
function openLabActivity(activity){
  document.querySelector('[data-space="lab"]')?.click();
  if(activity)requestAnimationFrame(()=>document.querySelector('[data-lab-activity="'+activity+'"]')?.click());
}
function syncDockHeight(){
  const dock=$("#dock");
  if(dock)document.body.style.setProperty("--dk",Math.ceil(dock.getBoundingClientRect().height)+"px");
}
function freeCanvasRect(){
  const stage=$("#diagram-stage"),header=$("#hd"),dock=$("#dock");
  if(!stage)return {left:0,top:0,right:innerWidth,bottom:innerHeight,width:innerWidth,height:innerHeight};
  const box=stage.getBoundingClientRect();
  const hidden=document.body.dataset.simulatorPanels==="hidden";
  const mobile=matchMedia("(max-width: 900px)").matches;
  const leftPanel=$("#PL"),rightPanel=$("#RC");
  let left=box.left+18,right=box.right-18,top=Math.max(box.top+12,(header?.getBoundingClientRect().bottom??box.top)+10);
  let bottom=Math.min(box.bottom-18,(dock?.getBoundingClientRect().top??box.bottom)-14);
  if(!hidden&&!mobile&&leftPanel&&getComputedStyle(leftPanel).display!=="none")left=Math.max(left,leftPanel.getBoundingClientRect().right+16);
  if(!hidden&&!mobile&&rightPanel&&getComputedStyle(rightPanel).display!=="none")right=Math.min(right,rightPanel.getBoundingClientRect().left-16);
  if(mobile){
    const tabs=$("#simulator-mobile-tabs");
    if(tabs&&getComputedStyle(tabs).display!=="none")bottom=Math.min(bottom,tabs.getBoundingClientRect().top-10);
    if(document.body.dataset.simulatorMobilePanel!=="diagram")bottom=Math.min(bottom,box.bottom-210);
  }
  if(right-left<120){left=box.left+16;right=box.right-16;}
  if(bottom-top<120){top=box.top+12;bottom=box.bottom-160;}
  return {left,top,right,bottom,width:right-left,height:bottom-top};
}
function setCameraFree(){
  cameraAuto=false;
  if(cameraRaf)cancelAnimationFrame(cameraRaf);
  cameraRaf=0;
  updateCameraButton();
  const follow=$("#sim-camera-follow");
  if(follow){follow.hidden=false;follow.textContent="Cámara libre · Seguir el proceso";}
}
function setCameraFollowing(){
  cameraAuto=true;
  updateCameraButton();
  const follow=$("#sim-camera-follow");
  if(follow){follow.hidden=true;follow.textContent="Cámara libre · Seguir el proceso";}
  if(timeline)centerActiveNode(timeline.current,"auto");
}

function publishTrace(){
  if(!execution||!timeline)return;
  document.dispatchEvent(new CustomEvent("traza:execution-updated",{detail:{
    exercise,exerciseId,methodIndex,method:method(),execution,
    event:timeline.current,index:timeline.index,length:timeline.length,
    diagram,source:method()?.pseudocode??""
  }}));
}
function parseInputs(){
  const raw=$("#simulator-inputs").value.trim();
  return raw?raw.split(/[;,]/).map(v=>v.trim()):[];
}
function pseudocode(source,active=null,visited=[]){
  const host=$("#pseudocode-lines");
  const rows=source.split("|").map((text,i)=>({line:i+1,text:text.trim()})).filter(x=>x.text);
  const seen=new Set(visited);
  $("#pseudocode-line-count").textContent=rows.length+" líneas";
  host.innerHTML=rows.map(row=>'<li class="'+(row.line===active?"is-active":seen.has(row.line)?"is-visited":"")+'" data-line="'+row.line+'"><span>'+String(row.line).padStart(2,"0")+'</span><code>'+esc(row.text)+'</code></li>').join("");
  if(active)host.querySelector('[data-line="'+active+'"]')?.scrollIntoView({block:"nearest"});
}
function prepare(){
  exercise=getExercise(exerciseId)??exercises[0];
  exerciseId=exercise.id;
  methodIndex=Math.max(0,Math.min(methodIndex,exercise.methods.length-1));
  paintExerciseSelector();
  $("#simulator-exercise-number").textContent=String(exercise.id).padStart(2,"0");
  $("#simulator-exercise-level").textContent=labels[exercise.level]??exercise.level;
  $("#simulator-exercise-level").className="exercise-level "+(exercise.level==="basic"?"level-basic":exercise.level==="intermediate"?"level-intermediate":"level-advanced");
  $("#simulator-exercise-title").textContent=exercise.title;
  $("#simulator-exercise-statement").textContent=exercise.statement;
  $("#simulator-purpose").textContent=exercise.purpose??exercise.objective??"Comprender qué resuelve el algoritmo.";
  $("#simulator-idea").textContent=exercise.analysis??(exercise.concepts??[]).join(" · ");
  const sourceForCycle=method().pseudocode.toLowerCase();
  const cycles=[];
  if(sourceForCycle.includes("para "))cycles.push("Para");
  if(sourceForCycle.includes("mientras "))cycles.push("Mientras");
  if(sourceForCycle.includes("hacer"))cycles.push("Hacer–Mientras");
  $("#simulator-cycle").textContent=cycles.length?[...new Set(cycles)].join(" · "):"Este algoritmo no necesita ciclos.";
  $("#simulator-exercise-spec").innerHTML=[
    ["Entradas",exercise.inputs],["Salidas",exercise.outputs],["Restricciones",exercise.constraints]
  ].map(([name,items])=>'<p class="eyebrow">'+name.toUpperCase()+'</p><ul>'+items.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>').join("");
  $("#simulator-method").innerHTML=exercise.methods.map((m,i)=>'<option value="'+i+'">'+esc(m.name)+'</option>').join("");
  $("#simulator-method").value=String(methodIndex);
  defaultInputSample=[...(method().sample??[])];
  $("#simulator-inputs").value=defaultInputSample.join(", ");
  pseudocode(method().pseudocode);
  try{
    const ast=parsePseudocode(method().pseudocode);
    diagram=layoutFlow(ast);
    renderDiagram($("#flow-diagram-container"),diagram);
    buildRouteGraph();
    clearDiagramTrail();
    $("#diagram-empty").hidden=true;
    requestAnimationFrame(()=>fitDiagram());
    $("#diagram-dimensions").textContent=diagram.width+" × "+diagram.height;
    const svg=$("#flow-svg");if(svg){svg.style.width="100%";svg.style.maxWidth="none";}
  }catch(error){
    diagram=null;routeGraph.clear();routeWeights.clear();routeCache.clear();clearDiagramTrail();
    $("#flow-diagram-container").innerHTML="";
    $("#diagram-empty").hidden=false;$("#diagram-empty h4").textContent="No se pudo construir el diagrama";
    $("#diagram-empty p").textContent=error.message;
  }
  run();
}
function typeName(type){
  return ({ "program-start":"INICIO",input:"ENTRADA",assignment:"ASIGNACIÓN",output:"SALIDA",
    decision:"DECISIÓN",branch:"RUTA","loop-init":"INICIALIZACIÓN","loop-condition":"CONDICIÓN DE CICLO",
    "loop-enter":"ITERACIÓN","loop-update":"AVANCE","loop-exit":"SALIDA DE CICLO",
    "program-end":"FIN",error:"ERROR"})[type]??String(type).toUpperCase();
}
function substituteValues(expression,values){
  let result=String(expression??"");
  for(const [name,value] of Object.entries(values??{}).sort((a,b)=>b[0].length-a[0].length)){
    result=result.replace(new RegExp("\\b"+name+"\\b","g"),fmt(value));
  }
  return result;
}
function loopNodeType(event){
  return diagram?.byId.get(String(event?.nodeId))?.type??null;
}
function loopCountBefore(event){
  return execution?.events.slice(0,event.step).filter(item=>
    item.type==="loop-enter"&&String(item.nodeId)===String(event.nodeId)
  ).length??0;
}
function brief(e){
  if(e.type==="input")return "Leer "+e.change?.name+" = "+fmt(e.value);
  if(e.type==="loop-init")return (e.change?.name??"El contador")+" nace valiendo "+fmt(e.change?.value)+".";
  if(e.type==="loop-update")return "Avanza "+e.change?.name+" de "+fmt(e.change?.previous)+" a "+fmt(e.change?.value)+".";
  if(e.type==="assignment"){
    const match=/^([A-Za-z_][A-Za-z0-9_]*)\s*=(?!=)\s*(.+)$/.exec(e.expression??e.sourceText??"");
    const before=execution?.events[e.step-1]?.variables??{};
    const calculation=match?substituteValues(match[2],before):fmt(e.change?.value);
    const previous=e.change?.previous===undefined?"nace":"pasa de "+fmt(e.change.previous);
    const self=match&&new RegExp("\\b"+match[1]+"\\b").test(match[2]);
    const role=self&&/[+-]\s*1\s*$/.test(match[2])?"contador":
      self&&match[2].includes("*")?"acumulador de producto":
      self&&match[2].includes("+")?"acumulador":
      e.change?.previous===undefined?"valor inicial":
      /^[A-Za-z_][A-Za-z0-9_]*$/.test(match?.[2]?.trim()??"")?"copia":"cálculo";
    return e.change?.name+" "+previous+"; "+calculation+" = "+fmt(e.change?.value)+". "+role+".";
  }
  if(e.type==="output")return "Imprimir "+fmt(e.value);
  if(e.type==="decision"||e.type==="branch"){
    const substituted=substituteValues(e.condition,e.variables);
    return "¿"+e.condition+"? Con los valores: "+substituted+" → "+(e.result?"V (verdadero). Sigue el camino V.":"F (falso). Sigue el camino F.");
  }
  if(e.type==="loop-condition"){
    const substituted=substituteValues(e.condition,e.variables);
    const type=loopNodeType(e);
    const completed=loopCountBefore(e);
    const round=type==="doWhile"?completed:(e.result?completed+1:completed);
    const outcome=e.result
      ? (type==="doWhile"?"V. Se repite el cuerpo.":"V. Entra al cuerpo.")
      : (type==="doWhile"?"F. Sale; el cuerpo ya se ejecutó.":"F. Sale del ciclo.");
    return "¿"+e.condition+"? Con los valores: "+substituted+" → "+outcome+(round>0?" Vuelta "+round+".":"");
  }
  if(e.type==="loop-enter")return "Vuelta "+e.iteration+". Entra al cuerpo del ciclo.";
  if(e.type==="loop-exit")return "Ciclo terminado después de "+(e.iteration??0)+" vueltas.";
  if(e.type==="program-start")return "Comienza el algoritmo. La memoria está vacía.";
  if(e.type==="program-end")return "El algoritmo finalizó.";
  return e.message||typeName(e.type);
}
function updateLoopBadge(event){
  let badge=$("#simulator-loop-round");
  if(!badge){
    badge=document.createElement("span");
    badge.id="simulator-loop-round";
    badge.className="dock-loop-round";
    badge.hidden=true;
    $("#dock-step-title")?.insertAdjacentElement("afterend",badge);
  }
  const type=loopNodeType(event);
  let round=null;
  if(event.type==="loop-enter")round=event.iteration;
  else if(event.type==="loop-exit")round=event.iteration;
  else if(event.type==="loop-condition"&&type){
    const completed=loopCountBefore(event);
    round=type==="doWhile"?completed:(event.result?completed+1:completed);
  }else if(event.loopStack?.length)round=event.loopStack.at(-1).iteration;
  badge.hidden=!(Number(round)>0);
  badge.textContent=Number(round)>0?"Vuelta "+round:"";
}
function history(){
  $("#trace-history").innerHTML=execution.events.map(e=>'<li data-history-step="'+e.step+'" role="button" tabindex="0" class="'+(e.step===timeline.index?"is-active":"")+'"><span>PASO '+String(e.step+1).padStart(2,"0")+' · '+typeName(e.type)+'</span><strong>'+esc(brief(e))+'</strong></li>').join("");
  $("#trace-count").textContent=String(execution.events.length);
}
function sceneSymbol(type){
  return ({
    input:"↓",assignment:"↦",output:"▣",decision:"◇",branch:"↗",
    "loop-init":"◉","loop-condition":"◇","loop-enter":"↻",
    "loop-update":"↑","loop-exit":"↘","program-start":"▶",
    "program-end":"■",error:"!"
  })[type]??"·";
}
function renderVariableHistory(){
  const host=$("#variable-history");
  if(!host)return;
  if(!selectedVariable){
    host.innerHTML='<span class="empty-state-copy">Selecciona una variable para inspeccionar su historial.</span>';
    return;
  }
  if(!execution||!timeline){
    host.textContent="Ejecuta un algoritmo para consultar el historial.";
    return;
  }
  const changes=execution.events.filter(event=>
    event.step<=timeline.index&&event.change?.name===selectedVariable
  );
  host.innerHTML='<div class="variable-history-heading"><strong>Historial · '+esc(selectedVariable)+'</strong><button type="button" class="text-link" id="variable-history-clear">Cerrar</button></div>'+
    (changes.length?'<ol class="variable-history-list">'+changes.map(event=>{
      const before=event.change.previous===undefined?"(primera asignación)":fmt(event.change.previous);
      const after=fmt(event.change.value);
      const loop=(event.loopStack??[]).map(item=>"vuelta "+item.iteration).join(" · ");
      return '<li><button type="button" data-variable-step="'+event.step+'"><span>Paso '+(event.step+1)+(loop?" · "+esc(loop):"")+'</span><strong>'+esc(before)+" → "+esc(after)+'</strong><small>'+esc(event.sourceText||event.scene?.title||"")+'</small></button></li>';
    }).join("")+'</ol>':'<span class="empty-state-copy">Esta variable todavía no cambia en los pasos recorridos.</span>');
}
function updateCameraButton(){
  const button=$("#diagram-camera-toggle");
  if(!button)return;
  button.setAttribute("aria-pressed",String(cameraAuto));
  button.setAttribute("aria-label",cameraAuto?"Desactivar cámara automática":"Activar cámara automática");
  button.title=cameraAuto?"Cámara automática activa":"Cámara automática desactivada";
  button.classList.toggle("is-active",cameraAuto);
}
function applyCanvasTransform(){
  const canvas=$("#flow-diagram-container"),wrap=$("#wrap");
  if(!canvas)return;
  canvas.style.transformOrigin="0 0";
  canvas.style.transform="translate3d("+panOffset.x+"px,"+panOffset.y+"px,0) scale("+zoom+")";
  canvas.dataset.cameraX=String(panOffset.x);
  canvas.dataset.cameraY=String(panOffset.y);
  canvas.dataset.cameraZoom=String(zoom);
  if(wrap){
    const step=20*zoom,major=100*zoom;
    wrap.style.backgroundSize=step+"px "+step+"px,"+step+"px "+step+"px,"+major+"px "+major+"px,"+major+"px "+major+"px";
    wrap.style.backgroundPosition=(panOffset.x%step)+"px "+(panOffset.y%step)+"px,"+(panOffset.x%step)+"px "+(panOffset.y%step)+"px,"+(panOffset.x%major)+"px "+(panOffset.y%major)+"px,"+(panOffset.x%major)+"px "+(panOffset.y%major)+"px";
  }
  updateMinimap();
}
function updateMinimap(){
  const host=$("#sim-minimap"),viewport=$("#sim-minimap-viewport");
  if(!host||!viewport||!diagram||!diagramFitWidth)return;
  const rect=freeCanvasRect(),stage=$("#diagram-stage").getBoundingClientRect();
  const scale=fitScale*zoom,miniW=180,miniH=104,pad=7;
  const usableW=miniW-pad*2,usableH=miniH-pad*2;
  const ratio=Math.min(usableW/diagram.width,usableH/diagram.height);
  const ox=(miniW-diagram.width*ratio)/2,oy=(miniH-diagram.height*ratio)/2;
  const visible={x:(rect.left-stage.left-panOffset.x)/scale,y:(rect.top-stage.top-panOffset.y)/scale,width:rect.width/scale,height:rect.height/scale};
  const x=Math.max(ox,Math.min(ox+usableW,ox+visible.x*ratio));
  const y=Math.max(oy,Math.min(oy+usableH,oy+visible.y*ratio));
  const w=Math.max(3,Math.min(usableW,visible.width*ratio));
  const h=Math.max(3,Math.min(usableH,visible.height*ratio));
  viewport.setAttribute("x",String(x));viewport.setAttribute("y",String(y));
  viewport.setAttribute("width",String(Math.min(w,miniW-x)));viewport.setAttribute("height",String(Math.min(h,miniH-y)));
  viewport.setAttribute("rx","3");
}
function renderMinimap(){
  const svg=$("#sim-minimap-svg");
  if(!svg||!diagram)return;
  const w=180,h=104,pad=7,ratio=Math.min((w-pad*2)/diagram.width,(h-pad*2)/diagram.height);
  const ox=(w-diagram.width*ratio)/2,oy=(h-diagram.height*ratio)/2;
  const edgeMarkup=diagram.edges.map(edge=>{
    const path=$("#flow-diagram-container")?.querySelector('[data-edge-id="'+edge.id+'"] path');
    const d=path?.getAttribute("d");
    return d?'<path d="'+esc(d)+'"/>':"";
  }).join("");
  const nodeMarkup=diagram.nodes.map(node=>'<rect x="'+(node.x-node.width/2)+'" y="'+node.y+'" width="'+node.width+'" height="'+node.height+'" rx="2"/>').join("");
  svg.innerHTML='<g transform="translate('+ox+' '+oy+') scale('+ratio+')"><g class="minimap-edges">'+edgeMarkup+'</g><g class="minimap-nodes">'+nodeMarkup+'</g></g>'+
    '<rect id="sim-minimap-viewport" class="minimap-viewport" x="0" y="0" width="1" height="1" rx="3"/>';
  updateMinimap();
}
function buildRouteGraph(){
  routeGraph=new Map();routeWeights=new Map();routeCache.clear();
  if(!diagram)return;
  for(const id of diagram.byId.keys())routeGraph.set(String(id),[]);
  const container=$("#flow-diagram-container");
  for(const edge of diagram.edges){
    const from=diagram.byId.get(edge.from),to=diagram.byId.get(edge.to);
    const path=container?.querySelector('[data-edge-id="'+edge.id+'"] path');
    let weight=0;
    try{weight=path?.getTotalLength?.()??0;}catch{}
    if(!weight&&from&&to)weight=Math.hypot(to.x-from.x,to.y-from.y);
    routeWeights.set(edge.id,{path,weight});
    routeGraph.get(String(edge.from))?.push({to:String(edge.to),edgeId:edge.id,forward:true,weight});
    routeGraph.get(String(edge.to))?.push({to:String(edge.from),edgeId:edge.id,forward:false,weight});
  }
}
function shortestRoute(fromId,toId){
  const start=String(fromId),finish=String(toId);
  if(start===finish)return [];
  const key=start+":"+finish;
  if(routeCache.has(key))return routeCache.get(key);
  if(!routeGraph.has(start)||!routeGraph.has(finish))return [];
  const distance=new Map([[start,0]]),previous=new Map(),unvisited=new Set(routeGraph.keys());
  while(unvisited.size){
    let current=null,best=Infinity;
    for(const id of unvisited){const value=distance.get(id)??Infinity;if(value<best){best=value;current=id;}}
    if(current===null||best===Infinity)break;
    unvisited.delete(current);
    if(current===finish)break;
    for(const edge of routeGraph.get(current)??[]){
      if(!unvisited.has(edge.to))continue;
      const cost=best+edge.weight;
      if(cost<(distance.get(edge.to)??Infinity)){
        distance.set(edge.to,cost);
        previous.set(edge.to,{from:current,edgeId:edge.edgeId,forward:edge.forward});
      }
    }
  }
  const route=[];let cursor=finish;
  while(cursor!==start&&previous.has(cursor)){
    const step=previous.get(cursor);
    route.unshift({edgeId:step.edgeId,forward:step.forward});
    cursor=step.from;
  }
  const result=cursor===start?route:[];
  routeCache.set(key,result);return result;
}
function svgPathVertices(path){
  const d=path?.getAttribute("d")??"";
  const tokens=d.match(/[MLHV]|-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi)??[];
  const points=[];let command=null,x=0,y=0,index=0;
  while(index<tokens.length){
    if(/^[MLHV]$/i.test(tokens[index]))command=tokens[index++];
    if(!command)break;
    if(command==="M"||command==="L"){
      const nx=Number(tokens[index++]),ny=Number(tokens[index++]);
      if(!Number.isFinite(nx)||!Number.isFinite(ny))break;
      x=nx;y=ny;points.push({x,y});
      if(command==="M")command="L";
    }else if(command==="H"){
      const nx=Number(tokens[index++]);if(!Number.isFinite(nx))break;x=nx;points.push({x,y});
    }else if(command==="V"){
      const ny=Number(tokens[index++]);if(!Number.isFinite(ny))break;y=ny;points.push({x,y});
    }else break;
  }
  return points;
}
function routeBetweenNodes(fromId,toId){
  const route=shortestRoute(fromId,toId);
  if(route.length)return route;
  const from=String(fromId),to=String(toId);
  const direct=diagram?.edges.find(edge=>edge.from===from&&edge.to===to);
  if(direct)return [{edgeId:direct.id,forward:true}];
  const reverse=diagram?.edges.find(edge=>edge.from===to&&edge.to===from);
  return reverse?[{edgeId:reverse.id,forward:false}]:[];
}
function fallbackEdgeVertices(edge){
  if(!edge||!diagram)return [];
  const from=diagram.byId.get(edge.from),to=diagram.byId.get(edge.to);
  if(!from||!to)return [];
  const fx=from.x,fy=from.y+from.height/2,tx=to.x,ty=to.y+to.height/2;
  if(edge.kind==="false"){
    const y=from.y+from.height/2;
    return [{x:from.x+from.width/2,y},{x:tx,y},{x:tx,y:to.y}];
  }
  if(edge.kind==="back"){
    const bendX=Math.min(fx,tx)-95;
    return [{x:fx,y:fy},{x:bendX,y:fy},{x:bendX,y:ty},{x:tx,y:ty}];
  }
  if(Math.abs(fx-tx)<4)return [{x:fx,y:from.y+from.height},{x:tx,y:to.y}];
  const mid=(fy+ty)/2;
  return [{x:fx,y:from.y+from.height},{x:fx,y:mid},{x:tx,y:mid},{x:tx,y:to.y}];
}
function routeCoordinates(route){
  const points=[];
  for(const step of route){
    const info=routeWeights.get(step.edgeId),path=info?.path;
    const edge=diagram?.edges.find(item=>item.id===step.edgeId);
    let vertices=svgPathVertices(path);
    if(vertices.length<2)vertices=fallbackEdgeVertices(edge);
    if(!step.forward)vertices=vertices.reverse();
    if(vertices.length<2)continue;
    for(let segment=1;segment<vertices.length;segment++){
      const a=vertices[segment-1],b=vertices[segment];
      const length=Math.hypot(b.x-a.x,b.y-a.y),count=Math.max(2,Math.ceil(length/12));
      for(let index=0;index<=count;index++){
        if(points.length&&segment===1&&index===0)continue;
        const t=index/count;
        points.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
      }
    }
  }
  return points;
}
function clearDiagramTrail(){
  if(tokenRaf){cancelAnimationFrame(tokenRaf);tokenRaf=0;}
  $("#flow-trail")?.setAttribute("points","");
  $("#flow-diagram-container .flow-token")?.setAttribute("visibility","hidden");
}
function drawExecutionTrail(events){
  const points=[];let previous=null;
  for(const event of events){
    if(event.nodeId===null||event.nodeId===undefined)continue;
    if(previous!==null&&String(previous)!==String(event.nodeId)){
      const segment=routeCoordinates(routeBetweenNodes(previous,event.nodeId));
      if(points.length&&segment.length&&Math.hypot(points[points.length-1].x-segment[0].x,points[points.length-1].y-segment[0].y)<2)segment.shift();
      points.push(...segment);
    }
    previous=event.nodeId;
  }
  const polyline=points.slice(-1200).map(point=>point.x+","+point.y).join(" ");
  $("#flow-trail")?.setAttribute("points",polyline);
  const stage=$("#diagram-stage");
  if(stage){
    stage.dataset.trailPointCount=String(points.length);
    stage.dataset.trailNodeCount=String(events.filter(event=>event.nodeId!==null&&event.nodeId!==undefined).length);
  }
}
function animateTokenRoute(route,event){
  const token=$("#flow-diagram-container .flow-token");
  if(!token)return;
  if(tokenRaf){cancelAnimationFrame(tokenRaf);tokenRaf=0;}
  const points=routeCoordinates(route);
  const node=diagram?.nodes.find(item=>String(item.sourceId)===String(event?.nodeId));
  const target=points.length?points[points.length-1]:node?{x:node.x,y:Math.max(10,node.y-12)}:null;
  if(!target)return;
  const reduced=document.documentElement.dataset.motion==="reduced"||matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(points.length<2||reduced||currentSpeedFactor()>=4){
    token.setAttribute("cx",String(target.x));token.setAttribute("cy",String(target.y));token.setAttribute("visibility","visible");return;
  }
  const lengths=[0];let total=0;
  for(let index=1;index<points.length;index++){
    total+=Math.hypot(points[index].x-points[index-1].x,points[index].y-points[index-1].y);
    lengths.push(total);
  }
  token.setAttribute("cx",String(points[0].x));token.setAttribute("cy",String(points[0].y));token.setAttribute("visibility","visible");
  const duration=480/Math.sqrt(currentSpeedFactor());let started=0;
  const frame=now=>{
    if(!started)started=now;
    const progress=Math.min(1,(now-started)/duration),distance=progress*total;
    let index=1;while(index<lengths.length-1&&lengths[index]<distance)index++;
    const segment=lengths[index]-lengths[index-1]||1,ratio=(distance-lengths[index-1])/segment;
    const a=points[index-1],b=points[index];
    token.setAttribute("cx",String(a.x+(b.x-a.x)*ratio));
    token.setAttribute("cy",String(a.y+(b.y-a.y)*ratio));
    if(progress<1)tokenRaf=requestAnimationFrame(frame);
    else{token.setAttribute("cx",String(target.x));token.setAttribute("cy",String(target.y));tokenRaf=0;}
  };
  tokenRaf=requestAnimationFrame(frame);
}
function centerActiveNode(event,behavior){
  if(!cameraAuto||!event||event.nodeId===null||event.nodeId===undefined)return;
  const stage=$("#diagram-stage"),node=document.getElementById("flow-node-"+event.nodeId);
  if(!stage||!node)return;
  const free=freeCanvasRect(),target=node.getBoundingClientRect();
  const goal={
    x:panOffset.x+(free.left+free.width/2-(target.left+target.width/2)),
    y:panOffset.y+(free.top+free.height/2-(target.top+target.height/2))
  };
  if(cameraRaf)cancelAnimationFrame(cameraRaf);
  if(behavior==="auto"||document.documentElement.dataset.motion==="reduced"){
    panOffset=goal;cameraRaf=0;applyCanvasTransform();
  }else{
    const start={...panOffset},started=performance.now(),duration=130/Math.sqrt(currentSpeedFactor());
    const step=now=>{
      if(!cameraAuto)return;
      const elapsed=now-started,eased=1-Math.exp(-Math.max(0,elapsed)/duration);
      panOffset={x:start.x+(goal.x-start.x)*eased,y:start.y+(goal.y-start.y)*eased};
      applyCanvasTransform();
      if(elapsed<duration*4&&Math.hypot(goal.x-panOffset.x,goal.y-panOffset.y)>.7)cameraRaf=requestAnimationFrame(step);
      else{panOffset=goal;cameraRaf=0;applyCanvasTransform();}
    };
    cameraRaf=requestAnimationFrame(step);
  }
  stage.dataset.cameraTarget=String(event.nodeId);
}
function currentSpeedFactor(){
  const value=Number($("#simulator-speed")?.value??650);
  return value<=100?8:value<=180?4:value<=400?2:value<=800?1:.5;
}
function zoomAt(nextZoom,clientX,clientY){
  const stage=$("#diagram-stage");
  if(!stage)return;
  const box=stage.getBoundingClientRect(),oldZoom=zoom,target=Math.max(.25,Math.min(3,nextZoom));
  const anchorX=clientX-box.left,anchorY=clientY-box.top;
  const worldX=(anchorX-panOffset.x)/oldZoom,worldY=(anchorY-panOffset.y)/oldZoom;
  zoom=target;
  panOffset={x:anchorX-worldX*zoom,y:anchorY-worldY*zoom};
  setCameraFree();
  stage.dataset.zoomCount=String((Number(stage.dataset.zoomCount)||0)+1);
  applyCanvasTransform();
}
function zoomDiagram(direction){
  if(!diagramFitWidth)fitDiagram();
  const free=freeCanvasRect();
  zoomAt(zoom*(direction>0?1.18:1/1.18),free.left+free.width/2,free.top+free.height/2);
}
function jumpMinimap(event){
  if(!diagram||!diagramFitWidth)return;
  const svg=$("#sim-minimap-svg"),point=svg.createSVGPoint();
  point.x=event.clientX;point.y=event.clientY;
  const cursor=point.matrixTransform(svg.getScreenCTM().inverse());
  const w=180,h=104,pad=7,ratio=Math.min((w-pad*2)/diagram.width,(h-pad*2)/diagram.height);
  const ox=(w-diagram.width*ratio)/2,oy=(h-diagram.height*ratio)/2;
  const worldX=Math.max(0,Math.min(diagram.width,(cursor.x-ox)/ratio));
  const worldY=Math.max(0,Math.min(diagram.height,(cursor.y-oy)/ratio));
  const stage=$("#diagram-stage").getBoundingClientRect(),free=freeCanvasRect();
  const centerX=free.left+free.width/2-stage.left,centerY=free.top+free.height/2-stage.top;
  panOffset={x:centerX-worldX*fitScale*zoom,y:centerY-worldY*fitScale*zoom};
  setCameraFree();applyCanvasTransform();
}
function centerDiagram(){
  if(!diagram)return;
  fitDiagram();setCameraFollowing();
}
function renderOperationBreakdown(event){
  let expression=null;
  let values=event.variables??{};
  if(event.type==="assignment"||event.type==="loop-init"||event.type==="loop-update"){
    const source=event.expression??event.sourceText??"";
    const updateStep=/^([A-Za-z_][A-Za-z0-9_]*)(\+\+|--)$/.exec(source.trim());
    if(updateStep&&event.change){
      const amount=updateStep[2]==="++"?1:-1;
      return '<div class="scene-operation-breakdown"><span>AVANCE DEL CONTADOR</span><p><code>'+esc(fmt(event.change.previous))+' '+(amount>0?"+":"−")+' 1 = '+esc(fmt(event.change.value))+'</code></p></div>';
    }
    const assignment=/^[A-Za-z_][A-Za-z0-9_]*\s*=(?!=)\s*(.+)$/.exec(source.trim());
    if(assignment){
      expression=assignment[1];
      const previous=execution.events[timeline.index-1];
      values=previous?.variables??{};
    }
  }else if(event.type==="output"){
    expression=event.expression;
  }else if(event.type==="decision"||event.type==="loop-condition"){
    expression=event.condition;
  }
  if(!expression)return "";
  try{
    const trace=traceExpression(expression,values);
    if(!trace.steps.length)return "";
    return '<div class="scene-operation-breakdown"><span>DESGLOSE DE OPERACIÓN</span><ol>'+
      trace.steps.map(step=>{
        const right=step.right===null?"":' '+(step.shortCircuited?"":esc(fmt(step.right)));
        return '<li><code>'+esc(fmt(step.left))+' '+esc(step.operator)+(right?' '+right:'')+' = <b>'+esc(fmt(step.result))+'</b></code></li>';
      }).join("")+
      '</ol><small>Los valores se sustituyen desde el estado del mismo paso de ejecución.</small></div>';
  }catch(error){
    return '<div class="scene-operation-breakdown"><span>DETALLE TÉCNICO</span><p>'+esc(error.message)+'</p></div>';
  }
}
function render(){
  if(!execution||!timeline)return;
  const e=timeline.current;
  const seen=execution.events.slice(0,timeline.index+1);
  pseudocode(method().pseudocode,e.sourceLine,seen.map(x=>x.sourceLine).filter(Boolean));
  if(diagram){
    const routeEvent=[...seen].reverse().find(item=>item.route&&(item.type==="branch"||item.type==="decision"||item.type==="loop-condition"));
    const previousSource=[...seen.slice(0,-1)].reverse().find(item=>item.nodeId!==null&&item.nodeId!==undefined)?.nodeId;
    const walked=previousSource!==null&&e.nodeId!==null&&e.nodeId!==undefined?routeBetweenNodes(previousSource,e.nodeId):[];
    highlightDiagram($("#flow-diagram-container"),diagram,{
      activeNodeId:e.nodeId,visitedNodeIds:seen.map(x=>x.nodeId).filter(x=>x!==null&&x!==undefined),
      route:routeEvent?.route??null,routeNodeId:routeEvent?.nodeId??null,previousNodeId:previousSource??null,
      walkEdgeIds:walked.map(item=>item.edgeId)
    });
    drawExecutionTrail(seen);
    animateTokenRoute(walked,e);
  }
  centerActiveNode(e);
  if(choreographyPlayback){
    const contextTimer=setTimeout(()=>showContextWindow(e),100/currentSpeedFactor());
    flightTimeouts.push(contextTimer);
  }else showContextWindow(e);
  const scene=e.scene??{title:typeName(e.type),body:e.message,technical:""};
  const sceneView=renderScene(e,{events:execution.events,inputValues:parseInputs(),execution});
  $("#scene-content").dataset.eventType=e.type;
  const loopStack=e.loopStack??[];
  const loopExplanation=loopStack.length?'<div class="scene-loop-stack"><span>CONTEXTO DE REPETICIÓN</span>'+
    loopStack.map((loop,index)=>'<div><b>'+(index===0?"Ciclo exterior":index===loopStack.length-1?"Ciclo actual":"Ciclo anidado")+'</b><strong>Vuelta '+loop.iteration+'</strong></div>').join("")+'</div>':"";
  const transfer=e.change?
    '<div class="scene-value-transfer"><span class="scene-transfer-name">'+esc(e.change.name)+'</span>'+
    (e.change.previous===undefined?'':'<span class="scene-value-old">'+esc(fmt(e.change.previous))+'</span><span class="scene-transfer-arrow">→</span>')+
    '<strong class="scene-value-new">'+esc(fmt(e.change.value))+'</strong></div>':
    e.type==="output"?'<div class="scene-value-transfer"><span class="scene-transfer-name">SALIDA</span><strong class="scene-value-new">'+esc(fmt(e.value))+'</strong></div>':
    e.condition?'<div class="scene-value-transfer '+(e.result?"is-true":"is-false")+'"><span class="scene-transfer-name">RUTA ELEGIDA</span><strong class="scene-route-chip">'+(e.result?"V · VERDADERA":"F · FALSA")+'</strong></div>':"";
  const sceneNarration=["assignment","decision","branch","loop-init","loop-condition","loop-update"].includes(e.type)?brief(e):scene.body;
  $("#scene-content").innerHTML='<div class="scene-figure-host" role="img" aria-label="'+sceneView.alt+'">'+sceneView.markup+'</div>'+
    '<span class="scene-event-type">'+typeName(e.type)+'</span><h4 class="scene-event-title">'+esc(scene.title)+'</h4>'+
    '<p class="scene-event-body">'+esc(sceneNarration)+'</p>'+transfer+
    '<div class="scene-event-technical">'+esc(scene.technical)+'</div>'+
    loopExplanation+
    renderOperationBreakdown(e)+
    (e.condition?'<div class="scene-condition-result"><span>CONDICIÓN</span><code>'+esc(e.condition)+'</code><strong class="'+(e.result?"is-true":"is-false")+'">'+(e.result?"V · VERDADERA":"F · FALSA")+'</strong></div>':"");
  const vars=e.variables??{}, names=Object.keys(vars), change=e.change;
  $("#variables-content").innerHTML=names.length?'<table class="variables-table"><thead><tr><th>VARIABLE</th><th>VALOR ACTUAL</th></tr></thead><tbody>'+
    names.map(name=>'<tr class="'+(change?.name===name?"is-changed":"")+'"><td><button type="button" class="variable-history-trigger" data-variable-history="'+esc(name)+'" aria-pressed="'+String(selectedVariable===name)+'">'+esc(name)+'</button></td><td>'+esc(fmt(vars[name]))+'</td></tr>').join("")+'</tbody></table>':'<p class="empty-state-copy">Todavía no hay variables asignadas.</p>';
  $("#variable-change").textContent=change?change.name+": "+(change.previous===undefined?"(sin valor)":fmt(change.previous))+" → "+fmt(change.value):"Sin cambios en este paso.";
  renderVariableHistory();
  const out=e.outputs??[];
  $("#output-count").textContent=String(out.length);
  $("#simulator-output").innerHTML=out.length?out.map((v,i)=>'<li><span class="output-index">'+(i+1)+'.</span> '+esc(fmt(v))+'</li>').join(""):"<li>El algoritmo todavía no ha producido una salida.</li>";
  if(choreographyPlayback)choreographEvent(e);
  $("#trace-history").querySelectorAll("[data-history-step]").forEach(item=>item.classList.toggle("is-active",Number(item.dataset.historyStep)===timeline.index));
  $("#trace-history").querySelector('[data-history-step="'+timeline.index+'"]')?.scrollIntoView({block:"nearest",inline:"nearest"});
  $("#timeline-count").textContent=(timeline.index+1)+" / "+timeline.length;
  $("#simulator-timeline").max=String(timeline.length-1);
  $("#simulator-timeline").value=String(timeline.index);
  $("#dock-step-title").textContent=typeName(e.type)+" · "+(timeline.index+1);
  $("#dock-step-description").textContent=brief(e);
  updateLoopBadge(e);
  $("#simulator-first").disabled=timeline.index===0;
  $("#simulator-previous").disabled=timeline.index===0;
  $("#simulator-next").disabled=timeline.index>=timeline.length-1;
  $("#simulator-last").disabled=timeline.index>=timeline.length-1;
  $("#simulator-play").disabled=timeline.index>=timeline.length-1;
  if(e.type==="error"){
    $("#simulator-status").textContent="DETENIDO · "+e.message;
    $("#simulator-status").classList.add("simulator-status-error");
  }
  publishTrace();
}


function run(){
  stop();
  try{
    execution=executePseudocode(method().pseudocode,parseInputs());
    timeline=createTimeline(execution);
    selectedVariable=null;
    history();render();
    $("#simulator-status").textContent=execution.ok?"Simulación lista · "+execution.events.length+" pasos":"Ejecución detenida";
    $("#simulator-status").classList.toggle("simulator-status-error",!execution.ok);
  }catch(error){
    execution=null;timeline=null;
    $("#simulator-status").textContent="ERROR DE ANÁLISIS";
    $("#simulator-status").classList.add("simulator-status-error");
    $("#scene-content").innerHTML='<div class="simulator-error">'+esc(error.message)+'</div>';
    $("#trace-history").innerHTML="<li>Error de análisis</li>";
    $("#simulator-output").innerHTML="<li>Sin salida.</li>";
    $("#variables-content").innerHTML='<p class="empty-state-copy">No hay un estado de ejecución.</p>';
    $("#variable-history").innerHTML='<span class="empty-state-copy">No hay historial disponible.</span>';
    $("#timeline-count").textContent="— / —";
    $("#simulator-timeline").max="0";$("#simulator-timeline").value="0";
  }
}
function seek(index){
  if(!timeline)return;
  stop();timeline.seek(index);render();
}
function move(delta){
  if(!timeline)return;
  stop();
  timeline.seek(timeline.index+delta);
  choreographyPlayback=true;
  try{render();}finally{choreographyPlayback=false;}
}
function play(){
  if(!timeline)return;
  if(timer!==null){stop();return;}
  if(timeline.index>=timeline.length-1)timeline.first();
  const button=$("#simulator-play");button.textContent="Ⅱ";button.title="Pausar";button.setAttribute("aria-label","Pausar");
  timer=window.setInterval(()=>{
    cancelChoreography();
    timeline.next();
    choreographyPlayback=true;
    try{render();}finally{choreographyPlayback=false;}
    if(timeline.index>=timeline.length-1)stop();
  },2400/currentSpeedFactor());
}
function applyDiagramZoom(){
  const svg=$("#flow-svg");
  if(!svg||!diagramFitWidth||!diagramFitHeight)return;
  svg.style.minWidth="0";svg.style.maxWidth="none";
  svg.style.width=diagramFitWidth+"px";svg.style.height=diagramFitHeight+"px";
  applyCanvasTransform();
}
function setPseudocodeSize(size){
  pseudocodeSize=Math.max(13,Math.min(26,size));
  document.documentElement.style.setProperty("--pseudocode-font-size",pseudocodeSize+"px");
  document.body.style.setProperty("--fs",String(pseudocodeSize));
  const smaller=$("#simulator-text-smaller"),larger=$("#simulator-text-larger");
  if(smaller)smaller.disabled=pseudocodeSize<=13;
  if(larger)larger.disabled=pseudocodeSize>=26;
  try{window.localStorage.setItem("traza:v2:pseudocode-size",String(pseudocodeSize));}catch{}
}
function fitDiagram(){
  const stage=$("#diagram-stage"),svg=$("#flow-svg"),canvas=$("#flow-diagram-container");
  if(!stage||!svg||!diagram)return;
  const viewBox=svg.viewBox?.baseVal;
  if(!viewBox?.width||!viewBox?.height)return;
  const free=freeCanvasRect();
  const availableWidth=Math.max(180,free.width-24),availableHeight=Math.max(180,free.height-24);
  fitScale=Math.min(availableWidth/viewBox.width,availableHeight/viewBox.height);
  diagramFitWidth=viewBox.width*fitScale;diagramFitHeight=viewBox.height*fitScale;
  zoom=1;panOffset={x:0,y:0};
  if(cameraRaf)cancelAnimationFrame(cameraRaf);cameraRaf=0;
  stage.dataset.fitCount=String((Number(stage.dataset.fitCount)||0)+1);
  if(canvas){canvas.style.transition="none";canvas.style.transformOrigin="0 0";}
  applyDiagramZoom();renderMinimap();
  if(cameraAuto&&timeline)centerActiveNode(timeline.current,"auto");
}async function toggleDiagramFullscreen(){
  const stage=$("#diagram-stage");
  if(!stage)return;
  try{
    if(document.fullscreenElement)await document.exitFullscreen();
    else if(stage.requestFullscreen)await stage.requestFullscreen();
  }catch(error){
    $("#simulator-status").textContent="No se pudo activar pantalla completa: "+error.message;
  }
}
function updateFullscreenButton(){
  const active=document.fullscreenElement===$("#diagram-stage");
  const button=$("#diagram-fullscreen");
  button?.setAttribute("aria-pressed",String(active));
  if(button){
    button.setAttribute("aria-label",active?"Pantalla completa activa":"Ver diagrama a pantalla completa");
    button.title=active?"Pantalla completa activa":"Pantalla completa";
  }
  const exitButton=$("#diagram-fullscreen-exit");
  if(exitButton)exitButton.hidden=!active;
  if(active)requestAnimationFrame(()=>fitDiagram());
}
function bindDiagramPan(){
  const stage=$("#diagram-stage"),hit=$("#diagram-pan-hit"),canvas=$("#flow-diagram-container");
  if(!stage||!hit||!canvas)return;
  const getPoints=()=>[...pointerState.values()];
  const onDown=event=>{
    if(event.pointerType==="mouse"&&event.button!==0)return;
    const target=event.target instanceof Element?event.target:null;
    if(target?.closest("button,a,input,select,textarea,#sim-minimap,#sim-camera-follow,#simulator-shortcuts,#dock,#hd,.sim-window,.sim-window-rail,.diagram-heading"))return;
    const hitRect=hit.getBoundingClientRect();
    if(event.clientX<hitRect.left||event.clientX>hitRect.right||event.clientY<hitRect.top||event.clientY>hitRect.bottom)return;
    event.preventDefault();
    try{hit.setPointerCapture(event.pointerId);}catch{}
    pointerState.set(event.pointerId,{x:event.clientX,y:event.clientY,type:event.pointerType});
    setCameraFree();
    if(pointerState.size>=2){
      const [a,b]=getPoints();
      pinchState={distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),zoom,center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};
      panState=null;
    }else{
      panState={pointerId:event.pointerId,x:event.clientX,y:event.clientY,originX:panOffset.x,originY:panOffset.y};
    }
    stage.classList.add("is-panning");
    stage.dataset.panStart=String((Number(stage.dataset.panStart)||0)+1);
  };
  const onMove=event=>{
    if(!pointerState.has(event.pointerId))return;
    pointerState.set(event.pointerId,{x:event.clientX,y:event.clientY,type:event.pointerType});
    if(pointerState.size>=2){
      const [a,b]=getPoints(),distance=Math.max(1,Math.hypot(a.x-b.x,a.y-b.y));
      const center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
      if(!pinchState)pinchState={distance,zoom,center};
      zoomAt(pinchState.zoom*distance/pinchState.distance,center.x,center.y);
      stage.dataset.pinchZoom=String(zoom);
      return;
    }
    if(!panState||panState.pointerId!==event.pointerId)return;
    panOffset={x:panState.originX+(event.clientX-panState.x),y:panState.originY+(event.clientY-panState.y)};
    applyCanvasTransform();
    stage.dataset.panMoved=String((Number(stage.dataset.panMoved)||0)+1);
    stage.dataset.panOffset=panOffset.x+","+panOffset.y;
  };
  const onUp=event=>{
    if(!pointerState.has(event.pointerId))return;
    pointerState.delete(event.pointerId);
    if(pointerState.size>=2){
      const [a,b]=getPoints();
      pinchState={distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),zoom,center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};
      panState=null;
    }else if(pointerState.size===1){
      const [remainingId,point]=[...pointerState.entries()][0];
      panState={pointerId:remainingId,x:point.x,y:point.y,originX:panOffset.x,originY:panOffset.y};
      pinchState=null;
    }else{
      panState=null;pinchState=null;stage.classList.remove("is-panning");
    }
    try{if(hit.hasPointerCapture(event.pointerId))hit.releasePointerCapture(event.pointerId);}catch{}
  };
  document.addEventListener("pointerdown",onDown,true);
  document.addEventListener("pointermove",onMove,true);
  document.addEventListener("pointerup",onUp,true);
  document.addEventListener("pointercancel",onUp,true);
  hit.addEventListener("lostpointercapture",onUp);
  hit.addEventListener("wheel",event=>{
    event.preventDefault();zoomAt(zoom*(event.deltaY<0?1.12:1/1.12),event.clientX,event.clientY);
  },{passive:false});
  const minimap=$("#sim-minimap");
  if(minimap){
    let dragging=false;
    minimap.addEventListener("pointerdown",event=>{dragging=true;try{minimap.setPointerCapture(event.pointerId);}catch{}jumpMinimap(event);});
    minimap.addEventListener("pointermove",event=>{if(dragging)jumpMinimap(event);});
    const end=()=>{dragging=false;};
    minimap.addEventListener("pointerup",end);minimap.addEventListener("pointercancel",end);
  }
}function setMobilePanel(name){
  const valid=["problem","diagram","scene","variables","output","history"];
  if(!valid.includes(name))return;
  document.body.dataset.simulatorMobilePanel=name;
  $("#simulator-mobile-tabs")?.querySelectorAll("[data-mobile-panel]").forEach(button=>{
    const active=button.dataset.mobilePanel===name;
    button.setAttribute("aria-selected",String(active));
    button.tabIndex=active?0:-1;
  });
}
function bind(){
  $("#sim-exercise-strip")?.addEventListener("click",event=>{
    const button=event.target.closest("[data-sim-exercise]");
    if(!button)return;
    exerciseId=Number(button.dataset.simExercise)||1;
    methodIndex=0;
    selectedVariable=null;
    prepare();
  });
  $("#simulator-predict")?.addEventListener("click",()=>openLabActivity("predict"));
  $("#simulator-lab")?.addEventListener("click",()=>openLabActivity(null));
  $("#simulator-panel-toggle")?.addEventListener("click",()=>{
    const hidden=document.body.dataset.simulatorPanels==="hidden";
    document.body.dataset.simulatorPanels=hidden?"visible":"hidden";
    $("#simulator-panel-toggle").setAttribute("aria-pressed",String(!hidden));
    $("#simulator-panel-toggle").setAttribute("aria-label",hidden?"Ocultar paneles":"Mostrar paneles");
  });
  $("#simulator-mobile-tabs")?.addEventListener("click",event=>{
    const tab=event.target.closest("[data-mobile-panel]");
    if(tab)setMobilePanel(tab.dataset.mobilePanel);
  });
  $("#scene-minimize").addEventListener("click",()=>{
    const panel=document.querySelector(".scene-panel");
    const button=$("#scene-minimize");
    const collapsed=panel.classList.toggle("is-collapsed");
    button.setAttribute("aria-expanded",String(!collapsed));
    button.setAttribute("aria-label",collapsed?"Expandir explicación":"Minimizar explicación");
    button.title=collapsed?"Expandir explicación":"Minimizar explicación";
    button.textContent=collapsed?"+":"−";
  });
  $("#simulator-run").addEventListener("click",run);
  $("#simulator-restore-inputs").addEventListener("click",()=>{
    $("#simulator-inputs").value=defaultInputSample.join(", ");
    run();
  });
  $("#simulator-text-smaller").addEventListener("click",()=>setPseudocodeSize(pseudocodeSize-1));
  $("#simulator-text-larger").addEventListener("click",()=>setPseudocodeSize(pseudocodeSize+1));
  $("#simulator-text-reset").addEventListener("click",()=>setPseudocodeSize(17));
  $("#diagram-camera-toggle").addEventListener("click",()=>{
    cameraAuto=!cameraAuto;updateCameraButton();
    if(cameraAuto&&timeline)centerActiveNode(timeline.current,"auto");
  });
  $("#diagram-fullscreen").addEventListener("click",toggleDiagramFullscreen);
  $("#diagram-fullscreen-exit").addEventListener("click",toggleDiagramFullscreen);
  $("#simulator-shortcuts-close")?.addEventListener("click",()=>{$("#simulator-shortcuts").hidden=true;});
  $("#vf-close")?.addEventListener("click",closeContextWindow);
  bindWindows();
  document.addEventListener("fullscreenchange",updateFullscreenButton);
  $("#variables-content").addEventListener("click",event=>{
    const button=event.target.closest("[data-variable-history]");
    if(button){selectedVariable=button.dataset.variableHistory;render();}
  });
  $("#variable-history").addEventListener("click",event=>{
    if(event.target.closest("#variable-history-clear")){selectedVariable=null;render();return;}
    const row=event.target.closest("[data-variable-step]");
    if(row)seek(Number(row.dataset.variableStep));
  });
  $("#simulator-method").addEventListener("change",event=>{
    methodIndex=Number(event.target.value)||0;
    prepare();
  });
  $("#simulator-inputs").addEventListener("keydown",event=>{
    if(event.key==="Enter"){event.preventDefault();run();}
  });
  $("#simulator-first").addEventListener("click",()=>seek(0));
  $("#simulator-previous").addEventListener("click",()=>move(-1));
  $("#simulator-next").addEventListener("click",()=>move(1));
  $("#simulator-last").addEventListener("click",()=>seek((timeline?.length??1)-1));
  $("#simulator-play").addEventListener("click",play);
  $("#simulator-timeline").addEventListener("input",event=>seek(Number(event.target.value)));
  $("#simulator-speed").addEventListener("change",()=>{
    if(timer!==null){stop();play();}
  });
  $("#trace-history").addEventListener("click",event=>{
    const row=event.target.closest("[data-history-step]");if(row)seek(Number(row.dataset.historyStep));
  });
  $("#trace-history").addEventListener("keydown",event=>{
    if((event.key==="Enter"||event.key===" ")&&event.target.matches("[data-history-step]")){
      event.preventDefault();seek(Number(event.target.dataset.historyStep));
    }
  });
  $("#diagram-zoom-in").addEventListener("click",()=>zoomDiagram(1));
  $("#diagram-zoom-out").addEventListener("click",()=>zoomDiagram(-1));
  $("#diagram-fit").addEventListener("click",centerDiagram);
  $("#sim-camera-follow")?.addEventListener("click",setCameraFollowing);
  bindDiagramPan();
  document.addEventListener("keydown",event=>{
    const target=event.target;
    if(target instanceof HTMLElement&&(target.isContentEditable||/INPUT|TEXTAREA|SELECT/.test(target.tagName)))return;
    if(event.altKey||event.ctrlKey||event.metaKey)return;
    const key=event.key;
    if(key===" "){event.preventDefault();play();}
    else if(key==="ArrowRight"){event.preventDefault();move(1);}
    else if(key==="ArrowLeft"){event.preventDefault();move(-1);}
    else if(key==="Home"){event.preventDefault();seek(0);}
    else if(key==="End"){event.preventDefault();seek((timeline?.length??1)-1);}
    else if(key==="+"||key==="="){event.preventDefault();zoomDiagram(1);}
    else if(key==="-"){event.preventDefault();zoomDiagram(-1);}
    else if(key==="0"){event.preventDefault();centerDiagram();}
    else if(key.toLowerCase()==="c"){event.preventDefault();if(timeline)centerActiveNode(timeline.current,"auto");}
    else if(key.toLowerCase()==="p"){event.preventDefault();openLabActivity("predict");}
    else if(key.toLowerCase()==="l"){event.preventDefault();openLabActivity(null);}
    else if(key.toLowerCase()==="h"){event.preventDefault();document.body.dataset.simulatorPanels=document.body.dataset.simulatorPanels==="hidden"?"visible":"hidden";requestAnimationFrame(()=>fitDiagram());}
    else if(key.toLowerCase()==="f"){event.preventDefault();toggleDiagramFullscreen();}
    else if(key==="?"){event.preventDefault();const help=$("#simulator-shortcuts");if(help)help.hidden=!help.hidden;}
  });
  document.querySelector('[data-space="simulator"]')?.addEventListener("click",()=>{
    if(!execution)prepare();
    setMobilePanel("diagram");
    requestAnimationFrame(()=>{syncDockHeight();fitDiagram();});
  });
  syncDockHeight();
  const dock=$("#dock");
  if(dock&&"ResizeObserver" in window){
    const dockObserver=new ResizeObserver(()=>syncDockHeight());
    dockObserver.observe(dock);
  }
  const stage=$("#diagram-stage");
  if(stage&&"ResizeObserver" in window){
    const observer=new ResizeObserver(entries=>{
      const box=entries[0]?.contentRect;
      if(box?.width>0&&box?.height>0)requestAnimationFrame(()=>fitDiagram());
    });
    observer.observe(stage);
  }
  const freeAreaObserver=new ResizeObserver(()=>{
    requestAnimationFrame(()=>{
      if(cameraAuto&&timeline)centerActiveNode(timeline.current,"auto");
      updateMinimap();
    });
  });
  for(const selector of ["#hd","#PL","#RC","#dock","#simulator-mobile-tabs"]){
    const element=$(selector);if(element)freeAreaObserver.observe(element);
  }
  window.addEventListener("resize",()=>requestAnimationFrame(()=>cameraAuto?fitDiagram():updateMinimap()));
  document.addEventListener("traza:request-simulation",event=>{
    exerciseId=Number(event.detail?.exerciseId)||1;
    methodIndex=Number(event.detail?.methodIndex)||0;
    selectedVariable=null;
    prepare();
  });
  document.addEventListener("traza:jump-to-step",event=>{
    if(Number.isInteger(event.detail?.index))seek(event.detail.index);
  });
  document.addEventListener("traza:lab-sync-request",publishTrace);
}
export function initSimulator(){
  if(!$("#simulator-run"))return;
  setPseudocodeSize(readPseudocodeSize());
  paintExerciseSelector();
  document.documentElement.style.setProperty("--fs",String(pseudocodeSize));
  syncDockHeight();
  setMobilePanel("diagram");
  updateCameraButton();
  bind();prepare();
}
