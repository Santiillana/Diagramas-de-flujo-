import { makeNode, createFlowPreset, validateFlow, compileFlow } from "../core/flow-compiler.js";
import { executePseudocode, createTimeline } from "../core/interpreter.js";
import { layoutFlow } from "../diagram/layout.js";
import { renderDiagram, highlightDiagram } from "../diagram/renderer.js";

const $=selector=>document.querySelector(selector);
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=value=>typeof value==="number"?String(Number(value.toFixed(6))):String(value);
const typeLabel={input:"Entrada",process:"Proceso",output:"Salida",decision:"Decisión",for:"Ciclo Para",while:"Ciclo Mientras",doWhile:"Hacer–Mientras",start:"Inicio",end:"Fin"};
let model=createFlowPreset("sequence");
let modelHistory=[JSON.stringify(model)];
let historyIndex=0;
let scopeStack=[];
let selectedId=null;
let runtime=null;
let runtimeTimeline=null;
let runtimeDiagram=null;

function findNode(id,nodes=model.nodes){
  for(const node of nodes){
    if(node.id===id)return node;
    for(const slot of ["trueBranch","falseBranch","body"]){
      if(Array.isArray(node[slot])){
        const found=findNode(id,node[slot]);
        if(found)return found;
      }
    }
  }
  return null;
}
function scope(){
  let nodes=model.nodes;
  for(const entry of scopeStack){
    const parent=findNode(entry.nodeId);
    if(!parent||!Array.isArray(parent[entry.slot]))return model.nodes;
    nodes=parent[entry.slot];
  }
  return nodes;
}
function pathLabel(){
  return ["Flujo principal",...scopeStack.map(item=>{
    const node=findNode(item.nodeId);
    const prefix=item.slot==="trueBranch"?"V · Verdadera":item.slot==="falseBranch"?"F · Falsa":"Cuerpo del ciclo";
    return (typeLabel[node?.type]??"Bloque")+" · "+(item.slot==="trueBranch"?"Rama Verdadera (V)":item.slot==="falseBranch"?"Rama Falsa (F)":prefix);
  })];
}
function selected(){
  return selectedId?findNode(selectedId):null;
}
function updateTimelineControls(){
  const enabled=Boolean(runtimeTimeline);
  ["#builder-first","#builder-previous","#builder-next","#builder-last","#builder-timeline"].forEach(selector=>{
    const control=$(selector);
    if(control)control.disabled=!enabled;
  });
  if(!enabled){
    $("#builder-timeline").max="0";
    $("#builder-timeline").value="0";
    $("#builder-timeline-label").textContent="Paso — / —";
  }
}
function updateHistoryControls(){
  const undo=$("#builder-undo"),redo=$("#builder-redo");
  if(undo)undo.disabled=historyIndex<=0;
  if(redo)redo.disabled=historyIndex>=modelHistory.length-1;
}
function recordHistory(){
  const snapshot=JSON.stringify(model);
  if(modelHistory[historyIndex]===snapshot){updateHistoryControls();return;}
  modelHistory=modelHistory.slice(0,historyIndex+1);
  modelHistory.push(snapshot);
  if(modelHistory.length>60)modelHistory.shift();
  historyIndex=modelHistory.length-1;
  updateHistoryControls();
}
function restoreHistory(index){
  if(index<0||index>=modelHistory.length)return;
  historyIndex=index;
  model=JSON.parse(modelHistory[historyIndex]);
  scopeStack=[];selectedId=null;
  markDirty("Historial restaurado",false);
  renderEditor();updateHistoryControls();
}
function undoBuilder(){restoreHistory(historyIndex-1);}
function redoBuilder(){restoreHistory(historyIndex+1);}
function markDirty(message="Cambios sin validar",record=true){
  runtime=null;runtimeTimeline=null;runtimeDiagram=null;
  $("#builder-status").textContent=message.toUpperCase();
  $("#builder-runtime-message").textContent="El flujo cambió. Vuelve a validar y ejecutar para generar una nueva traza.";
  $("#builder-errors").innerHTML="";
  $("#builder-diagram").innerHTML='<p class="empty-state-copy">Vuelve a validar el modelo para generar el SVG.</p>';
  $("#builder-scene").innerHTML="<p>Esperando una ejecución.</p>";
  $("#builder-variables").innerHTML="<p>Sin variables.</p>";
  $("#builder-output").innerHTML="<li>Sin salida.</li>";
  updateTimelineControls();
  if(record)recordHistory();else updateHistoryControls();
}
function scopeTitle(){
  const last=scopeStack.at(-1);
  if(!last)return "Secuencia principal";
  const node=findNode(last.nodeId);
  if(last.slot==="trueBranch")return "Rama Verdadera (V)";
  if(last.slot==="falseBranch")return "Rama Falsa (F)";
  return "Cuerpo · "+(typeLabel[node?.type]??"ciclo");
}
function renderBreadcrumb(){
  const parts=pathLabel();
  $("#builder-breadcrumb").innerHTML=parts.map((label,index)=>
    '<button type="button" class="breadcrumb-button" data-breadcrumb="'+index+'" '+(index===parts.length-1?'aria-current="page"':"")+'>'+esc(label)+'</button>'
  ).join('<span aria-hidden="true">/</span>');
}
function cardMarkup(node,index,nodes){
  const isSelected=node.id===selectedId;
  const meta=typeLabel[node.type]??node.type;
  const detail=node.type==="input"?node.variables:
    node.type==="process"?node.variable+" = "+node.expression:
    node.type==="output"?"Mostrar "+node.expression:
    node.type==="decision"?"¿"+node.condition+"?":
    node.type==="for"?node.initial+" · "+node.condition+" · "+node.update:
    node.condition;
  let nested="";
  if(node.type==="decision"){
    nested=`<div class="builder-node-nested">
      <button type="button" data-enter-scope="${esc(node.id)}" data-scope-slot="trueBranch">Editar rama V · ${node.trueBranch.length} instrucciones</button>
      <button type="button" data-enter-scope="${esc(node.id)}" data-scope-slot="falseBranch">Editar rama F · ${node.falseBranch.length} instrucciones</button>
    </div>`;
  }else if(["for","while","doWhile"].includes(node.type)){
    nested=`<div class="builder-node-nested">
      <button type="button" data-enter-scope="${esc(node.id)}" data-scope-slot="body">Editar cuerpo · ${node.body.length} instrucciones</button>
    </div>`;
  }
  return `
    <article class="builder-node-card ${isSelected?"is-selected":""}" data-node-card="${esc(node.id)}" draggable="true" aria-label="Instrucción movible: ${esc(meta)}">
      <button type="button" class="builder-node-select" data-select-node="${esc(node.id)}">
        <span class="builder-node-type">${esc(meta)}</span>
        <strong>${esc(detail)}</strong>
        <small>Elemento ${index+1}</small>
      </button>
      <div class="builder-node-actions">
        <button type="button" data-move-node="${esc(node.id)}" data-direction="up" ${index===0?"disabled":""} aria-label="Mover arriba">↑</button>
        <button type="button" data-move-node="${esc(node.id)}" data-direction="down" ${index===nodes.length-1?"disabled":""} aria-label="Mover abajo">↓</button>
        <button type="button" data-delete-node="${esc(node.id)}" aria-label="Eliminar elemento">×</button>
      </div>
      ${nested}
    </article>`;
}

function renderCanvas(){
  const host=$("#builder-canvas-list");
  const nodes=scope();
  const root=scopeStack.length===0;
  const visible=root?nodes.slice(1,-1):nodes;
  let output="";
  if(root)output+='<div class="builder-terminal"><span class="terminal-shape"></span><strong>Inicio</strong><small>Punto de entrada fijo</small></div>';
  if(!visible.length)output+='<div class="builder-scope-empty"><strong>Este bloque todavía está vacío.</strong><p>Añade una instrucción desde la paleta. Las ramas V/F y el cuerpo de cada ciclo se editan como bloques independientes.</p></div>';
  output+=visible.map((node,index)=>cardMarkup(node,index,visible)).join('<div class="builder-connector"><span>↓</span><small>Continuación del flujo</small></div>');
  if(root)output+='<div class="builder-connector"><span>↓</span></div><div class="builder-terminal"><span class="terminal-shape"></span><strong>Fin</strong><small>Punto de salida fijo</small></div>';
  host.innerHTML=output;
  renderBreadcrumb();
  $("#builder-status").textContent=root?"SECUENCIA PRINCIPAL":scopeTitle().toUpperCase();
}
function field(label,name,value,type="text",hint=""){
  return '<label class="builder-field"><span>'+label+'</span><input type="'+type+'" data-inspector-field="'+name+'" value="'+esc(value)+'" autocomplete="off">'+(hint?'<small>'+esc(hint)+'</small>':"")+'</label>';
}
function renderInspector(){
  const node=selected();
  const host=$("#builder-inspector-content");
  if(!node){
    host.innerHTML='<p class="empty-state-copy">Selecciona un símbolo para editar sus propiedades. Entra en una rama V/F o en el cuerpo del ciclo para construir bloques anidados.</p>';
    return;
  }
  let fields="";
  if(node.type==="input")fields+=field("Variables separadas por coma","variables",node.variables);
  if(node.type==="process"){
    fields+=field("Nombre de variable","variable",node.variable);
    fields+=field("Expresión","expression",node.expression);
  }
  if(node.type==="output")fields+=field("Expresión que se mostrará","expression",node.expression);
  if(node.type==="decision")fields+=field("Condición","condition",node.condition);
  if(node.type==="for"){
    fields+=field("Preparación","initial",node.initial);
    fields+=field("Condición de repetición","condition",node.condition);
    fields+=field("Avance","update",node.update);
  }
  if(node.type==="while"||node.type==="doWhile")fields+=field("Condición","condition",node.condition);
  if(["decision","for","while","doWhile"].includes(node.type)){
    const slots=node.type==="decision"?["trueBranch","falseBranch"]:["body"];
    fields+='<div class="builder-inspector-scopes">'+slots.map(slot=>{
      const label=slot==="trueBranch"?"Editar salida V":slot==="falseBranch"?"Editar salida F":"Editar cuerpo";
      const count=node[slot].length;
      return '<button type="button" class="button button-secondary" data-enter-scope="'+node.id+'" data-scope-slot="'+slot+'">'+label+' <span>'+count+'</span></button>';
    }).join("")+'</div>';
  }
  host.innerHTML='<div class="builder-inspector-meta"><span class="exercise-number">'+esc(typeLabel[node.type])+'</span><small>ID '+esc(node.id)+'</small></div>'+
    '<form id="builder-inspector-form">'+fields+
    '<button type="submit" class="button button-primary">Guardar propiedades</button></form>'+
    '<button type="button" class="builder-delete-button" data-delete-node="'+node.id+'">Eliminar este símbolo</button>';
}
function renderEditor(){
  renderCanvas();renderInspector();
}
function addNode(type){
  const target=scope();
  const node=makeNode(type);
  if(!scopeStack.length&&target.length>=2)target.splice(target.length-1,0,node);
  else target.push(node);
  selectedId=node.id;
  markDirty("Nuevo elemento");
  renderEditor();
}
function enterScope(nodeId,slot){
  const node=findNode(nodeId);
  if(!node||!Array.isArray(node[slot]))return;
  scopeStack.push({nodeId,slot});
  selectedId=null;
  renderEditor();
}
function moveNode(id,direction){
  const nodes=scope();
  const index=nodes.findIndex(node=>node.id===id);
  const next=index+(direction==="up"?-1:1);
  if(index<0||next<0||next>=nodes.length)return;
  [nodes[index],nodes[next]]=[nodes[next],nodes[index]];
  markDirty("Orden actualizado");renderEditor();
}
function moveNodeRelative(draggedId,targetId,after=false){
  if(draggedId===targetId)return;
  const nodes=scope();
  const from=nodes.findIndex(node=>node.id===draggedId);
  const to=nodes.findIndex(node=>node.id===targetId);
  if(from<0||to<0)return;
  const [moving]=nodes.splice(from,1);
  const targetIndex=nodes.findIndex(node=>node.id===targetId);
  nodes.splice(Math.max(0,targetIndex+(after?1:0)),0,moving);
  selectedId=draggedId;
  markDirty("Piezas reordenadas con arrastre");
  renderEditor();
}
function deleteNode(id){
  const nodes=scope();
  const index=nodes.findIndex(node=>node.id===id);
  if(index<0)return;
  nodes.splice(index,1);
  selectedId=null;
  markDirty("Elemento eliminado");renderEditor();
}
function saveInspector(event){
  event.preventDefault();
  const node=selected();
  if(!node)return;
  $("#builder-inspector-form").querySelectorAll("[data-inspector-field]").forEach(input=>{
    node[input.dataset.inspectorField]=input.value.trim();
  });
  markDirty("Propiedades actualizadas");renderEditor();
}
function goBreadcrumb(index){
  if(index===0){scopeStack=[];selectedId=null;}
  else scopeStack=scopeStack.slice(0,index);
  renderEditor();
}
function validate(){
  try{
    const compiled=compileFlow(model);
    $("#builder-status").textContent="ESTRUCTURA VÁLIDA";
    $("#builder-errors").innerHTML='<p class="builder-success">El diagrama está completo y listo para ejecutarse.</p>';
    $("#builder-code").textContent=compiled.source.split("|").join("\n");
    return compiled;
  }catch(error){
    const errors=error.errors??[];
    $("#builder-status").textContent="HAY ERRORES";
    $("#builder-errors").innerHTML='<ul class="builder-error-list">'+(errors.length?errors.map(item=>'<li data-error-node="'+esc(item.nodeId)+'"><strong>'+esc(item.field)+'</strong> · '+esc(item.message)+'</li>').join(""):'<li>'+esc(error.message)+'</li>')+'</ul>';
    $("#builder-code").textContent="Corrige los errores antes de compilar.";
    return null;
  }
}
function inputs(){
  const raw=$("#builder-inputs").value.trim();
  return raw?raw.split(/[;,]/).map(x=>x.trim()):[];
}
function seekBuilder(index){
  const control=$("#builder-last");
  if(control)control.dataset.lastSeekAttempt=String(index);
  if(!runtimeTimeline||!runtime)return;
  runtimeTimeline.seek(index);
  const actualIndex=runtimeTimeline.index;
  if(control){
    control.dataset.lastSeekBefore=String(index);
    control.dataset.lastSeekAfter=String(actualIndex);
  }
  renderBuilderTimeline(actualIndex);
}
function renderBuilderTimeline(requestedIndex=runtimeTimeline?.index??0){
  if(!runtime||!runtimeTimeline)return;
  const index=Math.max(0,Math.min(runtime.events.length-1,Math.trunc(requestedIndex)));
  const event=runtime.events[index];
  const history=runtime.events.slice(0,index+1);
  try{
    if(runtimeDiagram){
      const routeEvent=[...history].reverse().find(item=>item.route&&(item.type==="branch"||item.type==="decision"||item.type==="loop-condition"));
      const previousSource=[...history.slice(0,-1)].reverse().find(item=>item.nodeId!==null&&item.nodeId!==undefined)?.nodeId;
      highlightDiagram($("#builder-diagram"),runtimeDiagram,{
        activeNodeId:event.nodeId,visitedNodeIds:history.map(e=>e.nodeId).filter(id=>id!==null&&id!==undefined),
        route:routeEvent?.route??null,routeNodeId:routeEvent?.nodeId??null,previousNodeId:previousSource??null
      });
    }
  }catch(error){
    $("#builder-runtime-message").textContent="El estado se calculó, pero no se pudo resaltar el SVG: "+error.message;
  }
  const scene=event.scene??{title:event.type,body:event.message};
  $("#builder-scene").innerHTML='<strong>'+esc(scene.title)+'</strong><p>'+esc(scene.body)+'</p><small>'+esc(scene.technical??"")+'</small>';
  const vars=event.variables??{};
  const keys=Object.keys(vars);
  $("#builder-variables").innerHTML=keys.length?
    '<table class="variables-table"><tbody>'+keys.map(key=>'<tr><th>'+esc(key)+'</th><td>'+esc(fmt(vars[key]))+'</td></tr>').join("")+'</tbody></table>':
    "<p>Sin variables en este paso.</p>";
  const outputs=event.outputs??[];
  $("#builder-output").innerHTML=outputs.length?outputs.map(x=>"<li>"+esc(fmt(x))+"</li>").join(""):"<li>Sin salida todavía.</li>";
  $("#builder-timeline-label").textContent="Paso "+(index+1)+" / "+runtime.events.length;
  $("#builder-timeline-label").dataset.currentStep=String(index+1);
  $("#builder-timeline-label").dataset.totalSteps=String(runtime.events.length);
  $("#builder-timeline").max=String(runtime.events.length-1);
  $("#builder-timeline").value=String(index);
  $("#builder-timeline").disabled=false;
  $("#builder-first").disabled=index===0;
  $("#builder-previous").disabled=index===0;
  $("#builder-next").disabled=index===runtime.events.length-1;
  $("#builder-last").disabled=index===runtime.events.length-1;
  $("#builder-runtime-message").textContent=runtime.ok?
    "Ejecución de "+runtime.events.length+" pasos. "+scene.body:
    "Ejecución detenida: "+runtime.error?.message;
}

function runBuilder(){
  const compiled=validate();
  if(!compiled)return;
  try{
    runtime=executePseudocode(compiled.source,inputs());
    runtimeTimeline=createTimeline(runtime);
    const diagramModel=layoutFlow(compiled.program);
    runtimeDiagram=diagramModel;
    renderDiagram($("#builder-diagram"),diagramModel);
    $("#builder-code").textContent=compiled.source.split("|").join("\n");
    $("#builder-runtime-message").textContent=runtime.ok?"El flujo se ejecutó. Recorre sus pasos.":"Ejecución detenida: "+runtime.error?.message;
    renderBuilderTimeline();
  }catch(error){
    runtime=null;runtimeTimeline=null;runtimeDiagram=null;
    $("#builder-runtime-message").textContent=error.message;
    $("#builder-diagram").innerHTML='<p class="builder-error-message">'+esc(error.message)+'</p>';
  }
}
function bindBuilder(){
  const canvas=$("#builder-canvas-list");
  let dragId=null;
  canvas.addEventListener("dragstart",event=>{
    const card=event.target.closest("[data-node-card]");
    if(!card||!event.target.closest(".builder-node-select")){event.preventDefault();return;}
    dragId=card.dataset.nodeCard;card.classList.add("is-dragging");
    event.dataTransfer.effectAllowed="move";
    event.dataTransfer.setData("text/plain",dragId);
  });
  canvas.addEventListener("dragover",event=>{
    const card=event.target.closest("[data-node-card]");
    if(!dragId||!card||card.dataset.nodeCard===dragId)return;
    event.preventDefault();event.dataTransfer.dropEffect="move";
    canvas.querySelectorAll(".is-drop-before,.is-drop-after").forEach(node=>node.classList.remove("is-drop-before","is-drop-after"));
    const after=event.clientY>card.getBoundingClientRect().top+card.getBoundingClientRect().height/2;
    card.classList.add(after?"is-drop-after":"is-drop-before");
    card.dataset.dropAfter=String(after);
  });
  canvas.addEventListener("drop",event=>{
    const card=event.target.closest("[data-node-card]");
    if(!dragId||!card)return;
    event.preventDefault();
    const targetId=card.dataset.nodeCard,after=card.dataset.dropAfter==="true";
    canvas.querySelectorAll(".is-dragging,.is-drop-before,.is-drop-after").forEach(node=>node.classList.remove("is-dragging","is-drop-before","is-drop-after"));
    delete card.dataset.dropAfter;
    const moving=dragId;dragId=null;moveNodeRelative(moving,targetId,after);
  });
  canvas.addEventListener("dragend",()=>{
    dragId=null;
    canvas.querySelectorAll(".is-dragging,.is-drop-before,.is-drop-after").forEach(node=>node.classList.remove("is-dragging","is-drop-before","is-drop-after"));
  });
  canvas.addEventListener("click",event=>{
    const select=event.target.closest("[data-select-node]");
    if(select){selectedId=select.dataset.selectNode;renderEditor();return;}
    const enter=event.target.closest("[data-enter-scope]");
    if(enter){enterScope(enter.dataset.enterScope,enter.dataset.scopeSlot);return;}
    const move=event.target.closest("[data-move-node]");
    if(move){moveNode(move.dataset.moveNode,move.dataset.direction);return;}
    const remove=event.target.closest("[data-delete-node]");
    if(remove)deleteNode(remove.dataset.deleteNode);
  });
  $("#builder-inspector-content").addEventListener("submit",saveInspector);
  $("#builder-inspector-content").addEventListener("click",event=>{
    const enter=event.target.closest("[data-enter-scope]");
    if(enter){enterScope(enter.dataset.enterScope,enter.dataset.scopeSlot);return;}
    const remove=event.target.closest("[data-delete-node]");
    if(remove)deleteNode(remove.dataset.deleteNode);
  });
  $("#builder-breadcrumb").addEventListener("click",event=>{
    const button=event.target.closest("[data-breadcrumb]");
    if(button)goBreadcrumb(Number(button.dataset.breadcrumb));
  });
  document.querySelectorAll("[data-add-node]").forEach(button=>button.addEventListener("click",()=>addNode(button.dataset.addNode)));
  document.querySelectorAll("[data-builder-preset]").forEach(button=>button.addEventListener("click",()=>{
    const preset=button.dataset.builderPreset;
    model=preset==="empty"?{version:1,nodes:[makeNode("start",{id:"start"}),makeNode("end",{id:"end"})]}:createFlowPreset(preset);
    scopeStack=[];selectedId=null;markDirty("Plantilla cargada");renderEditor();
  }));
  $("#builder-undo")?.addEventListener("click",undoBuilder);
  $("#builder-redo")?.addEventListener("click",redoBuilder);
  $("#lab-builder-stage")?.addEventListener("keydown",event=>{
    if(!(event.ctrlKey||event.metaKey)||event.target.matches("input,textarea"))return;
    if(event.key.toLowerCase()==="z"){event.preventDefault();event.shiftKey?redoBuilder():undoBuilder();}
    else if(event.key.toLowerCase()==="y"){event.preventDefault();redoBuilder();}
  });
  $("#builder-validate").addEventListener("click",validate);
  $("#builder-run").addEventListener("click",runBuilder);
  $("#builder-timeline").addEventListener("input",event=>{
    if(!runtimeTimeline)return;
    seekBuilder(Number(event.target.value));
  });
  $("#builder-first").addEventListener("click",()=>seekBuilder(0));
  $("#builder-previous").addEventListener("click",()=>seekBuilder((runtimeTimeline?.index??0)-1));
  $("#builder-next").addEventListener("click",()=>seekBuilder((runtimeTimeline?.index??0)+1));
  $("#builder-last").addEventListener("click",()=>seekBuilder((runtimeTimeline?.length??1)-1));
}
export function initBuilder(){
  if(!$("#builder-canvas-list"))return;
  bindBuilder();
  renderEditor();
  updateHistoryControls();
  validate();
}
