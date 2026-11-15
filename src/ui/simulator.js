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

function readPseudocodeSize(){
  try{
    const value=Number(window.localStorage.getItem("traza:v2:pseudocode-size")??window.localStorage.getItem("traza-pseudocode-size"));
    return Number.isFinite(value)&&value>=13&&value<=26?value:17;
  }catch{return 17;}
}


function stop(){
  if(timer!==null){clearInterval(timer);timer=null;}
  const b=$("#simulator-play");
  if(b){b.textContent="▶";b.title="Reproducir";b.setAttribute("aria-label","Reproducir");}
}
function method(){return exercise?.methods[methodIndex]??null;}

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
  if(follow)follow.hidden=false;
}
function setCameraFollowing(){
  cameraAuto=true;
  updateCameraButton();
  const follow=$("#sim-camera-follow");
  if(follow)follow.hidden=true;
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
    const a=diagram.byId.get(edge.from),b=diagram.byId.get(edge.to);
    if(!a||!b)return "";
    return '<path d="M '+(ox+a.x*ratio)+' '+(oy+(a.y+a.height/2)*ratio)+' L '+(ox+b.x*ratio)+' '+(oy+(b.y+b.height/2)*ratio)+'"/>';
  }).join("");
  const nodeMarkup=diagram.nodes.map(node=>{
    const width=Math.max(2,node.width*ratio),height=Math.max(2,node.height*ratio);
    return '<rect x="'+(ox+(node.x-node.width/2)*ratio)+'" y="'+(oy+node.y*ratio)+'" width="'+width+'" height="'+height+'" rx="1"/>';
  }).join("");
  svg.innerHTML='<g class="minimap-edges">'+edgeMarkup+'</g><g class="minimap-nodes">'+nodeMarkup+'</g><rect id="sim-minimap-viewport" class="minimap-viewport" x="0" y="0" width="1" height="1" rx="3"/>';
  updateMinimap();
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
    highlightDiagram($("#flow-diagram-container"),diagram,{
      activeNodeId:e.nodeId,visitedNodeIds:seen.map(x=>x.nodeId).filter(x=>x!==null&&x!==undefined),
      route:routeEvent?.route??null,routeNodeId:routeEvent?.nodeId??null,previousNodeId:previousSource??null
    });
  }
  centerActiveNode(e);
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
  svg.style.minWidth="0";svg.style.maxWidth="none";
  svg.style.width=diagramFitWidth+"px";svg.style.height=diagramFitHeight+"px";
  applyCanvasTransform();
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
  applyDiagramZoom();stage.scrollLeft=0;stage.scrollTop=0;renderMinimap();
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
    if(event.target.closest("button,a,input,select,textarea"))return;
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
  hit.addEventListener("pointerdown",onDown);
  hit.addEventListener("pointermove",onMove);
  hit.addEventListener("pointerup",onUp);
  hit.addEventListener("pointercancel",onUp);
  hit.addEventListener("lostpointercapture",onUp);
  hit.addEventListener("wheel",event=>{
    event.preventDefault();zoomAt(zoom*(event.deltaY<0?1.12:1/1.12),event.clientX,event.clientY);
  },{passive:false});
  stage.addEventListener("wheel",event=>{
    if(event.target.closest("#sim-minimap"))return;
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
  paintExerciseSelector();
  document.documentElement.style.setProperty("--fs",String(pseudocodeSize));
  syncDockHeight();
  setMobilePanel("diagram");
  updateCameraButton();
  bind();prepare();
}
