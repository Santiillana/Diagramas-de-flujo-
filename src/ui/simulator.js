import { exercises, getExercise } from "../content/exercises.js";
import { traceExpression } from "../core/expression.js";
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
let diagramFitWidth=0, diagramFitHeight=0, zoom=1;

function readPseudocodeSize(){
  try{
    const value=Number(window.localStorage.getItem("traza-pseudocode-size"));
    return Number.isFinite(value)&&value>=8&&value<=18?value:10;
  }catch{return 10;}
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
    highlightDiagram($("#flow-diagram-container"),diagram,{
      activeNodeId:e.nodeId,visitedNodeIds:seen.map(x=>x.nodeId).filter(x=>x!==null&&x!==undefined),
      route:routeEvent?.route??null,routeNodeId:routeEvent?.nodeId??null,previousNodeId:previousSource??null
    });
  }
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
  $("#scene-content").innerHTML='<div class="scene-event-visual" aria-hidden="true">'+sceneSymbol(e.type)+'</div>'+
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
function play(){
  if(!timeline)return;
  if(timer!==null){stop();return;}
  if(timeline.index>=timeline.length-1)timeline.first();
  const button=$("#simulator-play");button.textContent="Ⅱ";button.title="Pausar";button.setAttribute("aria-label","Pausar");
  timer=window.setInterval(()=>{
    timeline.next();render();
    if(timeline.index>=timeline.length-1)stop();
  },Number($("#simulator-speed").value)||650);
}
function applyDiagramZoom(){
  const svg=$("#flow-svg");
  if(!svg||!diagramFitWidth||!diagramFitHeight)return;
  svg.style.minWidth="0";
  svg.style.maxWidth="none";
  svg.style.width=(diagramFitWidth*zoom)+"px";
  svg.style.height=(diagramFitHeight*zoom)+"px";
}
function zoomDiagram(change){
  const svg=$("#flow-svg");
  if(!svg)return;
  if(!diagramFitWidth||!diagramFitHeight)fitDiagram();
  zoom=Math.max(.65,Math.min(3,zoom+change*.15));
  applyDiagramZoom();
  if(cameraAuto&&timeline)centerActiveNode(timeline.current,"auto");
}
function setPseudocodeSize(size){
  pseudocodeSize=Math.max(8,Math.min(18,size));
  document.documentElement.style.setProperty("--pseudocode-font-size",pseudocodeSize+"px");
  $("#simulator-text-smaller").disabled=pseudocodeSize<=8;
  $("#simulator-text-larger").disabled=pseudocodeSize>=18;
  try{window.localStorage.setItem("traza-pseudocode-size",String(pseudocodeSize));}catch{}
}
function fitDiagram(){
  const stage=$("#diagram-stage"),svg=$("#flow-svg");
  if(!stage||!svg)return;
  const viewBox=svg.viewBox?.baseVal;
  if(!viewBox?.width||!viewBox?.height)return;
  const availableWidth=Math.max(180,stage.clientWidth-48);
  const availableHeight=Math.max(180,stage.clientHeight-48);
  const scale=Math.min(availableWidth/viewBox.width,availableHeight/viewBox.height);
  diagramFitWidth=viewBox.width*scale;
  diagramFitHeight=viewBox.height*scale;
  zoom=1;
  applyDiagramZoom();
  stage.scrollTo({left:0,top:0,behavior:"auto"});
  if(cameraAuto&&timeline)centerActiveNode(timeline.current,"auto");
}
async function toggleDiagramFullscreen(){
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
  const stage=$("#diagram-stage");
  if(!stage)return;
  const insideStage=event=>{
    const box=stage.getBoundingClientRect();
    return event.clientX>=box.left&&event.clientX<=box.right&&
      event.clientY>=box.top&&event.clientY<=box.bottom;
  };
  document.addEventListener("pointerdown",event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!insideStage(event)||target?.closest("#diagram-stage-tools"))return;
    if(event.pointerType==="mouse"&&event.button!==0)return;
    panState={pointerId:event.pointerId,x:event.clientX,y:event.clientY,left:stage.scrollLeft,top:stage.scrollTop};
    stage.classList.add("is-panning");
    stage.dataset.panStart=String((Number(stage.dataset.panStart)||0)+1);
    cameraAuto=false;updateCameraButton();
    event.preventDefault();
  },true);
  document.addEventListener("pointermove",event=>{
    if(!panState||event.pointerId!==panState.pointerId)return;
    stage.scrollLeft=panState.left-(event.clientX-panState.x);
    stage.scrollTop=panState.top-(event.clientY-panState.y);
    stage.dataset.panMoved=String((Number(stage.dataset.panMoved)||0)+1);
    event.preventDefault();
  },true);
  const end=event=>{
    if(!panState||event.pointerId!==panState.pointerId)return;
    panState=null;stage.classList.remove("is-panning");
  };
  document.addEventListener("pointerup",end,true);
  document.addEventListener("pointercancel",end,true);
  document.addEventListener("wheel",event=>{
    if(insideStage(event)&&cameraAuto){cameraAuto=false;updateCameraButton();}
  },{capture:true,passive:true});
}

function bind(){
  $("#simulator-run").addEventListener("click",run);
  $("#simulator-restore-inputs").addEventListener("click",()=>{
    $("#simulator-inputs").value=defaultInputSample.join(", ");
    run();
  });
  $("#simulator-text-smaller").addEventListener("click",()=>setPseudocodeSize(pseudocodeSize-1));
  $("#simulator-text-larger").addEventListener("click",()=>setPseudocodeSize(pseudocodeSize+1));
  $("#simulator-text-reset").addEventListener("click",()=>setPseudocodeSize(10));
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
  $("#diagram-fit").addEventListener("click",fitDiagram);
  bindDiagramPan();
  document.querySelector('[data-space="simulator"]')?.addEventListener("click",()=>{if(!execution)prepare();});
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
  updateCameraButton();
  bind();prepare();
}
