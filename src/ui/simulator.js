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

function stop(){
  if(timer!==null){clearInterval(timer);timer=null;}
  const b=$("#simulator-play");
  if(b){b.textContent="▶";b.title="Reproducir";b.setAttribute("aria-label","Reproducir");}
}
function method(){return exercise?.methods[methodIndex]??null;}
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
  $("#simulator-inputs").value=(method().sample??[]).join(", ");
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
function render(){
  if(!execution||!timeline)return;
  const e=timeline.current;
  const seen=execution.events.slice(0,timeline.index+1);
  pseudocode(method().pseudocode,e.sourceLine,seen.map(x=>x.sourceLine).filter(Boolean));
  if(diagram)highlightDiagram($("#flow-diagram-container"),diagram,{
    activeNodeId:e.nodeId,visitedNodeIds:seen.map(x=>x.nodeId).filter(x=>x!==null&&x!==undefined)
  });
  const scene=e.scene??{title:typeName(e.type),body:e.message,technical:""};
  $("#scene-content").innerHTML='<span class="scene-event-type">'+typeName(e.type)+'</span><h4 class="scene-event-title">'+esc(scene.title)+'</h4><p class="scene-event-body">'+esc(scene.body)+'</p><div class="scene-event-technical">'+esc(scene.technical)+'</div>';
  const vars=e.variables??{}, names=Object.keys(vars), change=e.change;
  $("#variables-content").innerHTML=names.length?'<table class="variables-table"><thead><tr><th>VARIABLE</th><th>VALOR ACTUAL</th></tr></thead><tbody>'+
    names.map(name=>'<tr class="'+(change?.name===name?"is-changed":"")+'"><td>'+esc(name)+'</td><td>'+esc(fmt(vars[name]))+'</td></tr>').join("")+'</tbody></table>':'<p class="empty-state-copy">Todavía no hay variables asignadas.</p>';
  $("#variable-change").textContent=change?change.name+": "+(change.previous===undefined?"(sin valor)":fmt(change.previous))+" → "+fmt(change.value):"Sin cambios en este paso.";
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
}
function run(){
  stop();
  try{
    execution=executePseudocode(method().pseudocode,parseInputs());
    timeline=createTimeline(execution);
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
function zoomDiagram(change){
  const svg=$("#flow-svg");if(!svg)return;
  const width=parseFloat(svg.style.width)||100;
  const next=Math.max(55,Math.min(180,width+change*10));
  svg.style.width=next+"%";svg.style.maxWidth="none";
}
function bind(){
  $("#simulator-run").addEventListener("click",run);
  $("#simulator-method").addEventListener("change",e=>{
    methodIndex=Number(e.target.value)||0;
    $("#simulator-inputs").value=(method().sample??[]).join(", ");
    prepare();
  });
  $("#simulator-inputs").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();run();}});
  $("#simulator-first").addEventListener("click",()=>seek(0));
  $("#simulator-previous").addEventListener("click",()=>move(-1));
  $("#simulator-next").addEventListener("click",()=>move(1));
  $("#simulator-last").addEventListener("click",()=>seek((timeline?.length??1)-1));
  $("#simulator-play").addEventListener("click",play);
  $("#simulator-timeline").addEventListener("input",e=>seek(Number(e.target.value)));
  $("#simulator-speed").addEventListener("change",()=>{if(timer!==null){stop();play();}});
  $("#trace-history").addEventListener("click",e=>{
    const row=e.target.closest("[data-history-step]");if(row)seek(Number(row.dataset.historyStep));
  });
  $("#trace-history").addEventListener("keydown",e=>{
    if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-history-step]")){e.preventDefault();seek(Number(e.target.dataset.historyStep));}
  });
  $("#diagram-zoom-in").addEventListener("click",()=>zoomDiagram(1));
  $("#diagram-zoom-out").addEventListener("click",()=>zoomDiagram(-1));
  $("#diagram-fit").addEventListener("click",()=>{const svg=$("#flow-svg");if(svg){svg.style.width="100%";svg.style.maxWidth="none";}});
  document.querySelector('[data-space="simulator"]')?.addEventListener("click",()=>{if(!execution)prepare();});
  document.addEventListener("traza:request-simulation",e=>{
    exerciseId=Number(e.detail?.exerciseId)||1;
    methodIndex=Number(e.detail?.methodIndex)||0;
    prepare();
  });
}
export function initSimulator(){
  if(!$("#simulator-run"))return;
  bind();prepare();
}
