import { exercises, getExercise } from "../content/exercises.js";
import { executePseudocode, createTimeline } from "../core/interpreter.js";
import { parsePseudocode } from "../core/parser.js";
import { layoutFlow } from "../diagram/layout.js";
import { renderDiagram, highlightDiagram } from "../diagram/renderer.js";

const $ = s => document.querySelector(s);
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt = value => typeof value==="number" ? String(Number(value.toFixed(6))) : String(value);
const labels = {basic:"Básico",intermediate:"Intermedio",advanced:"Avanzado"};
let exerciseId=1, methodIndex=0, exercise=null, execution=null, timeline=null, diagram=null, timer=null;
let cameraAuto=true, panState=null, pseudocodeSize=10, selectedVariable=null, defaultInputSample=[];

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
function centerActiveNode(event,behavior){
  if(!cameraAuto||!event||event.nodeId===null||event.nodeId===undefined)return;
  const stage=$("#diagram-stage"),node=document.getElementById("flow-node-"+event.nodeId);
  if(!stage||!node)return;
  const bounds=stage.getBoundingClientRect(),target=node.getBoundingClientRect();
  const left=stage.scrollLeft+target.left+target.width/2-(bounds.left+stage.clientWidth/2);
  const top=stage.scrollTop+target.top+target.height/2-(bounds.top+stage.clientHeight/2);
  stage.scrollTo({left:Math.max(0,left),top:Math.max(0,top),
    behavior:behavior??(document.documentElement.dataset.motion==="reduced"?"auto":"smooth")});
}
function render(){
  if(!execution||!timeline)return;
  const e=timeline.current;
  const seen=execution.events.slice(0,timeline.index+1);
  pseudocode(method().pseudocode,e.sourceLine,seen.map(x=>x.sourceLine).filter(Boolean));
  if(diagram)highlightDiagram($("#flow-diagram-container"),diagram,{
    activeNodeId:e.nodeId,visitedNodeIds:seen.map(x=>x.nodeId).filter(x=>x!==null&&x!==undefined)
  });
  centerActiveNode(e);
  const scene=e.scene??{title:typeName(e.type),body:e.message,technical:""};
  $("#scene-content").dataset.eventType=e.type;
  $("#scene-content").innerHTML='<div class="scene-event-visual" aria-hidden="true">'+sceneSymbol(e.type)+'</div>'+
    '<span class="scene-event-type">'+typeName(e.type)+'</span><h4 class="scene-event-title">'+esc(scene.title)+'</h4>'+
    '<p class="scene-event-body">'+esc(scene.body)+'</p><div class="scene-event-technical">'+esc(scene.technical)+'</div>'+
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
  if(e.type==="error"){
    $("#simulator-status").textContent="DETENIDO · "+e.message;
    $("#simulator-status").classList.add("simulator-status-error");
  }
  publishTrace();
}

