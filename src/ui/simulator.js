import { escapeHTML as esc } from "./escape.js";
import { renderSceneVisual } from "./scene-visuals.js";
import { exercises, getExercise } from "../content/exercises.js";
import { traceExpression } from "../core/expression.js";
import { executePseudocode, createTimeline } from "../core/interpreter.js";
import { parsePseudocode } from "../core/parser.js";
import { layoutFlow } from "../diagram/layout.js";
import { renderDiagram, highlightDiagram, animateDiagramTransition } from "../diagram/renderer.js";

const $ = s => document.querySelector(s);
const fmt = value => typeof value==="number" ? String(Number(value.toFixed(6))) : String(value);
const labels = {basic:"Básico",intermediate:"Intermedio",advanced:"Avanzado"};
let exerciseId=1, methodIndex=0, exercise=null, execution=null, timeline=null, diagram=null, timer=null;
let cameraAuto=true, panState=null, pinchState=null, pseudocodeSize=14, selectedVariable=null, defaultInputSample=[];
let diagramFitWidth=0, diagramFitHeight=0, zoom=1, panOffset={x:0,y:0};
let cameraFrame=null, cameraTarget=null, cameraLastFrame=0;
const activePointers=new Map();
let lastRenderedStep=null;
let exerciseSearch="",predictionMode=false;
const SPEEDS=[0.25,0.5,1,2,4,8];

function readPseudocodeSize(){
  try{
    const value=Number(window.localStorage.getItem("traza-pseudocode-size"));
    return Number.isFinite(value)&&value>=14&&value<=18?value:14;
  }catch{return 14;}
}


function stop(){
  if(timer!==null){clearInterval(timer);timer=null;}
  const b=$("#simulator-play");
  if(b){b.textContent="▶";b.title="Reproducir";b.setAttribute("aria-label","Reproducir");}
}
function method(){return exercise?.methods[methodIndex]??null;}
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
function renderExercisePicker(){
  const host=$("#simulator-exercise-picker");
  if(!host)return;
  const query=exerciseSearch.trim().toLocaleLowerCase("es");
  const visible=exercises.filter(item=>!query||String(item.id).includes(query)||item.title.toLocaleLowerCase("es").includes(query)||item.concepts.join(" ").toLocaleLowerCase("es").includes(query));
  host.innerHTML=visible.map(item=>{
    const level=item.level==="basic"?"level-basic":item.level==="intermediate"?"level-intermediate":"level-advanced";
    const active=item.id===exerciseId?" is-active":"";
    return '<button type="button" class="simulator-exercise-dot '+level+active+'" data-simulator-exercise="'+item.id+'" aria-pressed="'+String(item.id===exerciseId)+'" title="Ejercicio '+item.id+' · '+esc(item.title)+'">'+String(item.id).padStart(2,"0")+'</button>';
  }).join("");
  host.dataset.visibleCount=String(visible.length);
  host.setAttribute("aria-label",visible.length+" ejercicios disponibles");
}
function chooseExercise(id){
  const next=exercises.find(item=>item.id===Number(id));
  if(!next)return;
  exerciseId=next.id;methodIndex=0;selectedVariable=null;
  prepare();renderExercisePicker();
  $("#simulator-status").textContent="EJERCICIO "+String(exerciseId).padStart(2,"0")+" · LISTO PARA RECORRER";
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
  renderExercisePicker();
  $("#simulator-exercise-number").textContent=String(exercise.id).padStart(2,"0");
  $("#simulator-exercise-level").textContent=labels[exercise.level]??exercise.level;
  $("#simulator-exercise-level").className="exercise-level "+(exercise.level==="basic"?"level-basic":exercise.level==="intermediate"?"level-intermediate":"level-advanced");
  $("#simulator-exercise-title").textContent=exercise.title;
  $("#simulator-exercise-statement").textContent=exercise.statement;
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
    $("#diagram-empty").hidden=true;
    requestAnimationFrame(()=>fitDiagram());
    $("#diagram-dimensions").textContent=diagram.width+" × "+diagram.height;
    const svg=$("#flow-svg");if(svg){svg.style.width="100%";svg.style.maxWidth="none";}
  }catch(error){
    diagram=null;$("#flow-diagram-container").innerHTML="";
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
function brief(e){
  if(e.type==="input")return "Leer "+e.change?.name+" = "+fmt(e.value);
  if(["assignment","loop-init","loop-update"].includes(e.type))return (e.change?.name??"Variable")+" = "+fmt(e.change?.value);
  if(e.type==="output")return "Imprimir "+fmt(e.value);
  if(e.type==="decision"||e.type==="loop-condition")return (e.result?"V":"F")+" · "+(e.condition??"");
  if(e.type==="loop-enter")return "Vuelta "+e.iteration;
  if(e.type==="loop-exit")return "Ciclo terminado";
  if(e.type==="program-start")return "Comienza el algoritmo";
  if(e.type==="program-end")return "El algoritmo finalizó";
  return e.message||typeName(e.type);
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
function getAvailableDiagramRect(stage){
  const bounds=stage.getBoundingClientRect();
  if(document.fullscreenElement===stage){
    const result={left:bounds.left+24,top:bounds.top+24,right:bounds.right-24,bottom:bounds.bottom-24,
      width:Math.max(160,bounds.width-48),height:Math.max(140,bounds.height-48)};
    stage.dataset.availableWidth=String(Math.round(result.width));
    stage.dataset.availableHeight=String(Math.round(result.height));
    stage.dataset.availableRatio=String(Math.round(result.width/window.innerWidth*100));
    return result;
  }
  const grid=$("#simulator-grid");
  const mobile=window.matchMedia("(max-width:760px)").matches;
  const gridHidden=grid?.classList.contains("panels-hidden");
  const visible=panel=>panel&&!panel.hidden&&!gridHidden&&
    !panel.classList.contains("is-panel-collapsed")&&!panel.classList.contains("is-auto-collapsed");
  let left=bounds.left+18,right=bounds.right-18,top=bounds.top+154,bottom=bounds.bottom-150;
  if(mobile){
    const tabs=$("#simulator-mobile-tabs");
    if(tabs)bottom=Math.min(bottom,tabs.getBoundingClientRect().top-10);
  }else{
    const problem=grid?.querySelector('[data-floating-panel="problem"]');
    const inspector=grid?.querySelector(".simulator-inspector");
    const history=grid?.querySelector('[data-floating-panel="history"]');
    if(visible(problem))left=Math.max(left,problem.getBoundingClientRect().right+14);
    const inspectorVisible=inspector&&[...inspector.querySelectorAll("[data-floating-panel]")].some(visible);
    if(inspectorVisible)right=Math.min(right,inspector.getBoundingClientRect().left-14);
    if(visible(history))bottom=Math.min(bottom,history.getBoundingClientRect().top-10);
  }
  const dock=grid?.querySelector(".simulator-dock");
  if(dock&&getComputedStyle(dock).display!=="none")bottom=Math.min(bottom,dock.getBoundingClientRect().top-12);
  if(right-left<160){left=bounds.left+18;right=bounds.right-18;}
  if(bottom-top<140){top=bounds.top+50;bottom=bounds.bottom-100;}
  const result={left,top,right,bottom,width:Math.max(160,right-left),height:Math.max(140,bottom-top)};
  stage.dataset.availableWidth=String(Math.round(result.width));
  stage.dataset.availableHeight=String(Math.round(result.height));
  stage.dataset.availableRatio=String(Math.round(result.width/window.innerWidth*100));
  return result;
}
function stopCameraAnimation(){
  if(cameraFrame!==null)cancelAnimationFrame(cameraFrame);
  cameraFrame=null;cameraLastFrame=0;cameraTarget=null;
  const stage=$("#diagram-stage");if(stage)stage.dataset.cameraAnimating="false";
}
function applyCanvasOffset(){
  const canvas=$("#flow-diagram-container");
  if(!canvas)return;
  canvas.style.transition="none";
  canvas.style.transform="translate3d("+panOffset.x+"px,"+panOffset.y+"px,0)";
  const stage=$("#diagram-stage");
  if(stage)stage.dataset.panOffset=panOffset.x+","+panOffset.y;
}
function cameraAnimationTick(now){
  if(!cameraTarget){stopCameraAnimation();return;}
  const elapsed=cameraLastFrame?Math.min(64,now-cameraLastFrame):16;
  cameraLastFrame=now;
  const factor=1-Math.exp(-elapsed/105);
  panOffset.x+=(cameraTarget.x-panOffset.x)*factor;
  panOffset.y+=(cameraTarget.y-panOffset.y)*factor;
  if(Math.abs(cameraTarget.x-panOffset.x)<.45&&Math.abs(cameraTarget.y-panOffset.y)<.45){
    panOffset={x:cameraTarget.x,y:cameraTarget.y};
    applyCanvasOffset();
    cameraFrame=null;cameraLastFrame=0;cameraTarget=null;
    const stage=$("#diagram-stage");if(stage)stage.dataset.cameraAnimating="false";
    return;
  }
  applyCanvasOffset();
  cameraFrame=requestAnimationFrame(cameraAnimationTick);
}
function moveCameraTo(next,instant=false){
  const reduced=document.documentElement.dataset.motion!=="full"||
    (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??false);
  if(instant||reduced){
    stopCameraAnimation();
    panOffset={x:next.x,y:next.y};
    applyCanvasOffset();
    return;
  }
  cameraTarget={x:next.x,y:next.y};
  const stage=$("#diagram-stage");if(stage)stage.dataset.cameraAnimating="true";
  if(cameraFrame===null)cameraFrame=requestAnimationFrame(cameraAnimationTick);
}
function centerActiveNode(event,behavior){
  if(!cameraAuto||!event||event.nodeId===null||event.nodeId===undefined)return;
  const stage=$("#diagram-stage"),canvas=$("#flow-diagram-container");
  const node=document.getElementById("flow-node-"+event.nodeId);
  if(!stage||!canvas||!node)return;
  const available=getAvailableDiagramRect(stage),target=node.getBoundingClientRect();
  const dx=available.left+available.width/2-(target.left+target.width/2);
  const dy=available.top+available.height/2-(target.top+target.height/2);
  moveCameraTo({x:panOffset.x+dx,y:panOffset.y+dy},behavior==="auto");
  stage.dataset.cameraTarget=String(event.nodeId);
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
  const priorIndex=lastRenderedStep;
  const priorEvent=priorIndex!==null&&Math.abs(timeline.index-priorIndex)===1?execution.events[priorIndex]:null;
  const seen=execution.events.slice(0,timeline.index+1);
  pseudocode(method().pseudocode,e.sourceLine,seen.map(x=>x.sourceLine).filter(Boolean));
  if(diagram){
    const routeEvent=[...seen].reverse().find(item=>item.route&&(item.type==="branch"||item.type==="decision"||item.type==="loop-condition"));
    const previousSource=[...seen.slice(0,-1)].reverse().find(item=>item.nodeId!==null&&item.nodeId!==undefined)?.nodeId;
    highlightDiagram($("#flow-diagram-container"),diagram,{
      activeNodeId:e.nodeId,visitedNodeIds:seen.map(x=>x.nodeId).filter(x=>x!==null&&x!==undefined),
      route:routeEvent?.route??null,routeNodeId:routeEvent?.nodeId??null,previousNodeId:previousSource??null
    });
    animateDiagramTransition($("#flow-diagram-container"),diagram,{
      previousNodeId:priorEvent?.nodeId??null,
      activeNodeId:e.nodeId,
      durationMs:Math.max(90,Math.min(4000,Math.round(850/speedFactor()))),
      motionMode:document.documentElement.dataset.motion??"full"
    });
  }
  lastRenderedStep=timeline.index;
  document.documentElement.style.setProperty("--simulator-speed-factor",String(speedFactor()));
  centerActiveNode(e);
  const scene=e.scene??{title:typeName(e.type),body:e.message,technical:""};
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
  $("#scene-content").innerHTML=renderSceneVisual(e)+
    '<span class="scene-event-type">'+typeName(e.type)+'</span><h4 class="scene-event-title">'+esc(scene.title)+'</h4>'+
    '<p class="scene-event-body">'+esc(scene.body)+'</p>'+transfer+
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
  $("#trace-history").querySelectorAll("[data-history-step]").forEach(item=>item.classList.toggle("is-active",Number(item.dataset.historyStep)===timeline.index));
  $("#trace-history").querySelector('[data-history-step="'+timeline.index+'"]')?.scrollIntoView({block:"nearest",inline:"nearest"});
  $("#timeline-count").textContent=(timeline.index+1)+" / "+timeline.length;
  $("#simulator-timeline").max=String(timeline.length-1);
  $("#simulator-timeline").value=String(timeline.index);
  $("#dock-step-title").textContent=typeName(e.type)+" · "+(timeline.index+1);
  $("#dock-step-description").textContent=brief(e);
  $("#simulator-first").disabled=timeline.index===0;
  $("#simulator-previous").disabled=timeline.index===0;
  $("#simulator-next").disabled=timeline.index>=timeline.length-1;
  $("#simulator-last").disabled=timeline.index>=timeline.length-1;
  $("#simulator-play").disabled=timeline.index>=timeline.length-1;
  const activeLoop=(e.loopStack??[]).at(-1);
  const nextIteration=activeLoop&&execution.events.findIndex((item,index)=>index>timeline.index&&item.type==="loop-enter"&&item.nodeId===activeLoop.nodeId&&item.iteration>activeLoop.iteration);
  const loopExit=activeLoop&&execution.events.findIndex((item,index)=>index>timeline.index&&item.type==="loop-exit"&&item.nodeId===activeLoop.nodeId);
  $("#simulator-next-loop").disabled=!(activeLoop&&nextIteration>=0);
  $("#simulator-exit-loop").disabled=!(activeLoop&&loopExit>=0);
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
    lastRenderedStep=null;
    selectedVariable=null;
    history();render();
    $("#simulator-status").textContent=execution.ok?"TRAZA GENERADA · "+execution.events.length+" PASOS":"EJECUCIÓN DETENIDA";
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
  timeline.seek(timeline.index+delta);render();
  if(timeline.index===timeline.length-1)stop();
}

function jumpToNextLoopIteration(){
  if(!timeline||!execution)return;
  const activeLoop=(timeline.current?.loopStack??[]).at(-1);
  if(!activeLoop)return;
  const index=execution.events.findIndex((item,i)=>i>timeline.index&&item.type==="loop-enter"&&item.nodeId===activeLoop.nodeId&&item.iteration>activeLoop.iteration);
  if(index>=0)seek(index);
}
function exitCurrentLoop(){
  if(!timeline||!execution)return;
  const activeLoop=(timeline.current?.loopStack??[]).at(-1);
  if(!activeLoop)return;
  const index=execution.events.findIndex((item,i)=>i>timeline.index&&item.type==="loop-exit"&&item.nodeId===activeLoop.nodeId);
  if(index>=0)seek(index);
}

function speedFactor(){return Number($("#simulator-speed")?.value)||1;}
function setSpeedFactor(value){
  const selected=SPEEDS.reduce((best,item)=>Math.abs(item-value)<Math.abs(best-value)?item:best,SPEEDS[0]);
  $("#simulator-speed").value=String(selected);
  $("#simulator-speed-fine").value=String(selected);
  $("#simulator-speed-label").textContent=String(selected).replace(".",",")+"×";
  if(timer!==null){stop();play();}
}
function cycleExercise(delta){
  const current=exercises.findIndex(item=>item.id===exerciseId);
  const next=(current+delta+exercises.length)%exercises.length;
  chooseExercise(exercises[next].id);
}
function togglePredictionMode(){
  predictionMode=!predictionMode;
  const button=$("#simulator-predict-toggle");
  button?.setAttribute("aria-pressed",String(predictionMode));
  button?.setAttribute("aria-label",predictionMode?"Desactivar modo predicción (P)":"Activar modo predicción (P)");
  button?.classList.toggle("is-active",predictionMode);
  document.body.dataset.predictionMode=String(predictionMode);
  document.dispatchEvent(new CustomEvent("traza:prediction-mode",{detail:{enabled:predictionMode}}));
}
function toggleShortcuts(){const panel=$("#simulator-shortcuts");if(panel)panel.hidden=!panel.hidden;}
function bindKeyboard(){
  window.addEventListener("keydown",event=>{
    const space=document.body.dataset.activeSpace;
    if(!["simulator","lab"].includes(space)||event.altKey||event.ctrlKey||event.metaKey)return;
    const target=event.target;
    if(target instanceof HTMLElement&&(target.isContentEditable||/^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)))return;
    if(event.key==="Escape"){$("#simulator-shortcuts").hidden=true;return;}
    if(event.key==="?"||event.key==="/"){event.preventDefault();toggleShortcuts();return;}
    if(event.key.toLowerCase()==="l"){
      event.preventDefault();
      document.querySelector(space==="simulator"?'[data-space="lab"]':'[data-space="simulator"]')?.click();
      return;
    }
    if(space!=="simulator")return;
    switch(event.key){
      case "ArrowRight":event.preventDefault();move(1);break;
      case "ArrowLeft":event.preventDefault();move(-1);break;
      case " ":case "Space":event.preventDefault();play();break;
      case "Home":event.preventDefault();seek(0);break;
      case "End":event.preventDefault();seek((timeline?.length??1)-1);break;
      case "ArrowUp":event.preventDefault();setSpeedFactor(Math.min(8,speedFactor()*2));break;
      case "ArrowDown":event.preventDefault();setSpeedFactor(Math.max(.25,speedFactor()/2));break;
      case "[":event.preventDefault();cycleExercise(-1);break;
      case "]":event.preventDefault();cycleExercise(1);break;
      case "+":case "=":event.preventDefault();zoomDiagram(1);break;
      case "-":event.preventDefault();zoomDiagram(-1);break;
      case "0":event.preventDefault();fitDiagram();break;
      case "c":case "C":event.preventDefault();$("#diagram-camera-toggle").click();break;
      case "n":case "N":event.preventDefault();jumpToNextLoopIteration();break;
      case "p":case "P":event.preventDefault();togglePredictionMode();break;
      case "f":case "F":event.preventDefault();toggleDiagramFullscreen();break;
    }
  },true);
}
function play(){
  if(!timeline)return;
  if(timer!==null){stop();return;}
  if(timeline.index>=timeline.length-1)timeline.first();
  const button=$("#simulator-play");button.textContent="Ⅱ";button.title="Pausar";button.setAttribute("aria-label","Pausar");
  timer=window.setInterval(()=>{
    timeline.next();render();
    if(timeline.index>=timeline.length-1)stop();
  },Math.max(60,Math.round(650/speedFactor())));
}
function applyDiagramZoom(){
  const svg=$("#flow-svg");
  if(!svg||!diagramFitWidth||!diagramFitHeight)return;
  svg.style.minWidth="0";
  svg.style.maxWidth="none";
  svg.style.width=(diagramFitWidth*zoom)+"px";
  svg.style.height=(diagramFitHeight*zoom)+"px";
  const stage=$("#diagram-stage");
  if(stage){stage.dataset.zoomCount=String(Number(stage.dataset.zoomCount||0));stage.dataset.zoom=zoom.toFixed(3);}
}
function setDiagramZoomAt(nextZoom,anchor,manual=false){
  const svg=$("#flow-svg"),stage=$("#diagram-stage");
  if(!svg||!stage)return;
  if(!diagramFitWidth||!diagramFitHeight)fitDiagram();
  const next=Math.max(.45,Math.min(3.5,nextZoom));
  if(Math.abs(next-zoom)<.0005)return;
  const rectBefore=svg.getBoundingClientRect();
  const focus=anchor??{x:rectBefore.left+rectBefore.width/2,y:rectBefore.top+rectBefore.height/2};
  const previousZoom=zoom;
  if(manual){cameraAuto=false;updateCameraButton();stopCameraAnimation();}
  zoom=next;applyDiagramZoom();
  const rectAfter=svg.getBoundingClientRect(),ratio=zoom/previousZoom;
  const projectedX=rectAfter.left+(focus.x-rectBefore.left)*ratio;
  const projectedY=rectAfter.top+(focus.y-rectBefore.top)*ratio;
  panOffset={x:panOffset.x+focus.x-projectedX,y:panOffset.y+focus.y-projectedY};
  applyCanvasOffset();
  stage.dataset.zoomCount=String((Number(stage.dataset.zoomCount)||0)+1);
  stage.dataset.zoom=zoom.toFixed(3);
  if(!manual&&cameraAuto&&timeline)centerActiveNode(timeline.current,"auto");
}
function zoomDiagram(change,anchor){
  setDiagramZoomAt(zoom+change*.15,anchor,Boolean(anchor));
}
function setPseudocodeSize(size){
  pseudocodeSize=Math.max(14,Math.min(18,size));
  document.documentElement.style.setProperty("--pseudocode-font-size",pseudocodeSize+"px");
  $("#simulator-text-smaller").disabled=pseudocodeSize<=14;
  $("#simulator-text-larger").disabled=pseudocodeSize>=18;
  try{window.localStorage.setItem("traza-pseudocode-size",String(pseudocodeSize));}catch{}
}
function fitDiagram(){
  const stage=$("#diagram-stage"),svg=$("#flow-svg");
  if(!stage||!svg)return;
  const viewBox=svg.viewBox?.baseVal;
  if(!viewBox?.width||!viewBox?.height)return;
  const available=getAvailableDiagramRect(stage);
  const availableWidth=Math.max(180,available.width-30);
  const availableHeight=Math.max(180,available.height-30);
  const scale=Math.max(.45,Math.min(availableWidth/viewBox.width,availableHeight/viewBox.height));
  diagramFitWidth=viewBox.width*scale;
  diagramFitHeight=viewBox.height*scale;
  stopCameraAnimation();
  zoom=1;
  panOffset={x:0,y:0};
  const canvas=$("#flow-diagram-container");
  if(canvas)canvas.style.transform="translate3d(0,0,0)";
  stage.dataset.zoom="1.000";
  stage.dataset.fitCount=String((Number(stage.dataset.fitCount)||0)+1);
  applyDiagramZoom();
  stage.scrollTo({left:0,top:0,behavior:"auto"});
  if(cameraAuto&&timeline)centerActiveNode(timeline.current,"auto");
}
async function toggleDiagramFullscreen(){
  const stage=$("#diagram-stage");
  if(!stage)return;
  try{
    if(document.fullscreenElement===stage)await document.exitFullscreen();
    else if(document.fullscreenElement)await document.exitFullscreen();
    else if(stage.requestFullscreen)await stage.requestFullscreen({navigationUI:"hide"});
    else throw new Error("Este navegador no ofrece la API de pantalla completa.");
  }catch(error){
    $("#simulator-status").textContent="No se pudo activar pantalla completa: "+error.message;
  }
}
function updateFullscreenButton(){
  const stage=$("#diagram-stage"),active=document.fullscreenElement===stage;
  const button=$("#diagram-fullscreen");
  button?.setAttribute("aria-pressed",String(active));
  if(button){
    button.setAttribute("aria-label",active?"Salir de pantalla completa":"Ver diagrama a pantalla completa");
    button.title=active?"Salir de pantalla completa":"Pantalla completa";
  }
  const exitButton=$("#diagram-fullscreen-exit");
  if(exitButton)exitButton.hidden=!active;
  stage?.classList.toggle("is-fullscreen",active);
  document.body.classList.toggle("diagram-fullscreen-active",active);
  if(stage){stage.dataset.fullscreen=String(active);requestAnimationFrame(()=>fitDiagram());}
}
function bindDiagramPan(){
  const stage=$("#diagram-stage");
  if(!stage)return;
  const insideStage=event=>{
    const box=stage.getBoundingClientRect();
    return event.clientX>=box.left&&event.clientX<=box.right&&event.clientY>=box.top&&event.clientY<=box.bottom;
  };
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
  document.addEventListener("pointerdown",event=>{
    if(!insideStage(event))return;
    const target=event.target instanceof Element?event.target:null;
    if(target?.closest("button,.diagram-header-tools"))return;
    if(event.pointerType==="mouse"&&event.button!==0)return;
    activePointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(activePointers.size>=2){
      const points=[...activePointers.entries()].slice(-2),a=points[0][1],b=points[1][1];
      stopCameraAnimation();cameraAuto=false;updateCameraButton();panState=null;
      pinchState={ids:[points[0][0],points[1][0]],startDistance:Math.max(1,distance(a,b)),startZoom:zoom};
      stage.classList.add("is-pinching");stage.classList.remove("is-panning");
      stage.dataset.pinchStart=String((Number(stage.dataset.pinchStart)||0)+1);
      event.preventDefault();return;
    }
    stopCameraAnimation();
    panState={pointerId:event.pointerId,x:event.clientX,y:event.clientY,originX:panOffset.x,originY:panOffset.y};
    stage.classList.add("is-panning");
    stage.dataset.panStart=String((Number(stage.dataset.panStart)||0)+1);
    cameraAuto=false;updateCameraButton();event.preventDefault();
  },true);
  document.addEventListener("pointermove",event=>{
    if(activePointers.has(event.pointerId))activePointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pinchState&&pinchState.ids.every(id=>activePointers.has(id))){
      const a=activePointers.get(pinchState.ids[0]),b=activePointers.get(pinchState.ids[1]);
      setDiagramZoomAt(pinchState.startZoom*distance(a,b)/pinchState.startDistance,midpoint(a,b),true);
      stage.dataset.pinchZoom=zoom.toFixed(3);event.preventDefault();return;
    }
    if(!panState||event.pointerId!==panState.pointerId)return;
    panOffset={x:panState.originX+(event.clientX-panState.x),y:panState.originY+(event.clientY-panState.y)};
    applyCanvasOffset();stage.dataset.panMoved=String((Number(stage.dataset.panMoved)||0)+1);event.preventDefault();
  },true);
  const end=event=>{
    activePointers.delete(event.pointerId);
    if(pinchState){pinchState=null;stage.classList.remove("is-pinching");panState=null;}
    else if(panState&&event.pointerId===panState.pointerId){panState=null;stage.classList.remove("is-panning");}
  };
  document.addEventListener("pointerup",end,true);
  document.addEventListener("pointercancel",end,true);
  document.addEventListener("wheel",event=>{
    if(!insideStage(event)||Math.abs(event.deltaY)<.01)return;
    setDiagramZoomAt(zoom*Math.exp(-event.deltaY*.0012),{x:event.clientX,y:event.clientY},true);
    stage.dataset.wheelZoom=String((Number(stage.dataset.wheelZoom)||0)+1);event.preventDefault();
  },{capture:true,passive:false});
}
function setMobilePanel(name){
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
  $("#simulator-exercise-picker").addEventListener("click",event=>{
    const button=event.target.closest("[data-simulator-exercise]");
    if(button)chooseExercise(button.dataset.simulatorExercise);
  });
  $("#simulator-exercise-search").addEventListener("input",event=>{
    exerciseSearch=event.target.value;renderExercisePicker();
  });
  $("#simulator-shortcuts-toggle").addEventListener("click",toggleShortcuts);
  $("#simulator-shortcuts-close").addEventListener("click",()=>{$("#simulator-shortcuts").hidden=true;});
  $("#simulator-predict-toggle").addEventListener("click",togglePredictionMode);
  $("#simulator-mobile-tabs")?.addEventListener("click",event=>{
    const tab=event.target.closest("[data-mobile-panel]");
    if(tab)setMobilePanel(tab.dataset.mobilePanel);
  });
  $("#simulator-run").addEventListener("click",run);
  $("#simulator-restore-inputs").addEventListener("click",()=>{
    $("#simulator-inputs").value=defaultInputSample.join(", ");
    run();
  });
  $("#simulator-text-smaller").addEventListener("click",()=>setPseudocodeSize(pseudocodeSize-1));
  $("#simulator-text-larger").addEventListener("click",()=>setPseudocodeSize(pseudocodeSize+1));
  $("#simulator-text-reset").addEventListener("click",()=>setPseudocodeSize(14));
  $("#diagram-camera-toggle").addEventListener("click",()=>{
    cameraAuto=!cameraAuto;updateCameraButton();
    if(cameraAuto&&timeline)centerActiveNode(timeline.current,"auto");
  });
  $("#diagram-fullscreen").addEventListener("click",toggleDiagramFullscreen);
  $("#diagram-fullscreen-exit").addEventListener("click",toggleDiagramFullscreen);
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
  $("#simulator-next-loop").addEventListener("click",jumpToNextLoopIteration);
  $("#simulator-exit-loop").addEventListener("click",exitCurrentLoop);
  $("#simulator-last").addEventListener("click",()=>seek((timeline?.length??1)-1));
  $("#simulator-play").addEventListener("click",play);
  $("#simulator-timeline").addEventListener("input",event=>seek(Number(event.target.value)));
  $("#simulator-speed").addEventListener("change",event=>setSpeedFactor(Number(event.target.value)||1));
  $("#simulator-speed-fine").addEventListener("input",event=>setSpeedFactor(Number(event.target.value)||1));
  bindKeyboard();
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
  $("#diagram-fit").addEventListener("click",fitDiagram);
  bindDiagramPan();
  $("#simulator-grid")?.addEventListener("traza:panels-changed",()=>requestAnimationFrame(()=>fitDiagram()));
  document.querySelector('[data-space="simulator"]')?.addEventListener("click",()=>{
    if(!execution)prepare();
    setMobilePanel("diagram");
    requestAnimationFrame(()=>fitDiagram());
  });
  const stage=$("#diagram-stage");
  if(stage&&"ResizeObserver" in window){
    const observer=new ResizeObserver(entries=>{
      const box=entries[0]?.contentRect;
      if(box?.width>0&&box?.height>0)requestAnimationFrame(()=>fitDiagram());
    });
    observer.observe(stage);
  }
  window.addEventListener("resize",()=>requestAnimationFrame(()=>fitDiagram()));
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
  setMobilePanel("diagram");
  updateCameraButton();
  bind();prepare();
  renderExercisePicker();
  setSpeedFactor(1);
}
