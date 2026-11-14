import { executePseudocode, createTimeline } from "../core/interpreter.js";
import { layoutFlow } from "../diagram/layout.js";
import { renderDiagram, highlightDiagram, animateDiagramTransition } from "../diagram/renderer.js";
import { renderSceneVisual } from "./scene-visuals.js";
import { lessonPrograms } from "../content/lesson-programs.js";
import { escapeHTML as esc } from "./escape.js";

let liveSession=null;

const display=value=>value===undefined||value===null?"—":
  typeof value==="number"?String(Number(value.toFixed(6))):String(value);

export function renderLessonLiveMarkup(lesson){
  const program=lessonPrograms[lesson.id];
  if(!program)return "";
  const code=program.pseudocode.split("|");
  const inputMarkup=program.sampleInputs.length
    ? '<label class="lesson-live-input"><span>DATOS DE ENTRADA</span><input type="text" data-lesson-live-input value="'+esc(program.sampleInputs.join(", "))+'" aria-label="Datos de entrada del mini-programa"><small>Separa los valores con comas.</small></label>'
    : '<div class="lesson-live-no-input">Este mini-programa no necesita datos de entrada.</div>';
  return `
    <section class="lesson-live-program" data-lesson-live>
      <div class="lesson-live-heading">
        <div><p class="eyebrow">MINIPROGRAMA EN VIVO</p><h4>Ejecútalo con el motor del simulador</h4>
          <p>${esc(program.purpose)}</p></div>
        <span class="lesson-live-engine">PARSER + INTÉRPRETE</span>
      </div>
      <div class="lesson-live-toolbar">
        ${inputMarkup}
        <div class="lesson-live-run-actions">
          <button type="button" class="button button-primary" data-lesson-live-action="run">Ejecutar</button>
          <button type="button" class="button button-secondary" data-lesson-live-action="reset">Restaurar ejemplo</button>
        </div>
      </div>
      <div class="lesson-live-grid">
        <section class="lesson-live-code-panel">
          <div class="lesson-live-subhead"><p class="eyebrow">PSEUDOCÓDIGO</p><span data-lesson-live-line>—</span></div>
          <ol class="lesson-live-code" data-lesson-live-code aria-label="Pseudocódigo del mini-programa">
            ${code.map((line,index)=>'<li><span>'+(index+1)+'</span><code>'+esc(line.trim())+'</code></li>').join("")}
          </ol>
        </section>
        <section class="lesson-live-diagram-panel">
          <div class="lesson-live-subhead"><p class="eyebrow">DIAGRAMA GENERADO</p><span>SVG · AST</span></div>
          <div class="lesson-live-diagram" data-lesson-live-diagram>
            <p class="lesson-live-placeholder">Ejecuta el mini-programa para generar el diagrama.</p>
          </div>
        </section>
        <section class="lesson-live-scene-panel">
          <div class="lesson-live-subhead"><p class="eyebrow">EVENTO ACTUAL</p><span data-lesson-live-step>Sin ejecutar</span></div>
          <div data-lesson-live-scene class="lesson-live-scene">
            <p class="empty-state-copy">Aquí aparecerá la entrada, operación, decisión o vuelta real del intérprete.</p>
          </div>
          <div class="lesson-live-explanations">
            <div><span>EXPLICACIÓN SENCILLA</span><p data-lesson-live-simple>Elige Ejecutar para comenzar.</p></div>
            <div><span>EXPLICACIÓN TÉCNICA</span><p data-lesson-live-technical>La traza se generará desde el pseudocódigo de esta lección.</p></div>
          </div>
        </section>
        <section class="lesson-live-state-panel">
          <div class="lesson-live-subhead"><p class="eyebrow">VARIABLES</p><span>SNAPSHOT</span></div>
          <div data-lesson-live-variables><p class="empty-state-copy">Sin variables todavía.</p></div>
          <div class="lesson-live-subhead lesson-live-output-heading"><p class="eyebrow">SALIDA</p><span data-lesson-live-output-count>0</span></div>
          <ol class="lesson-live-output" data-lesson-live-output><li>Sin resultados todavía.</li></ol>
        </section>
      </div>
      <div class="lesson-live-transport">
        <span class="lesson-live-status" data-lesson-live-progress>Sin ejecución</span>
        <div class="lesson-live-transport-buttons">
          <button type="button" class="button button-secondary" data-lesson-live-action="first" disabled>Inicio</button>
          <button type="button" class="button button-secondary" data-lesson-live-action="previous" disabled>Anterior</button>
          <button type="button" class="button button-primary" data-lesson-live-action="next" disabled>Siguiente paso</button>
          <button type="button" class="button button-secondary" data-lesson-live-action="last" disabled>Final</button>
        </div>
        <span class="lesson-live-result" data-lesson-live-result role="status">Aún no se ha ejecutado.</span>
      </div>
      <details class="lesson-live-observe"><summary>Qué debes observar</summary><p>${esc(lesson.manipulation.prompt)}</p><ol>
        ${lesson.manipulation.steps.map((step,index)=>'<li><b>'+(index+1)+'</b>'+esc(step)+'</li>').join("")}
      </ol></details>
    </section>`;
}

function parseInputValues(raw){
  if(!String(raw??"").trim())return [];
  return String(raw).trim().split(/[,;\s]+/).filter(Boolean).map(item=>Number(item.replace(",", ".")));
}

export function resetLessonLiveSession(){
  liveSession=null;
}

function startLessonLive(lessonId,root){
  const program=lessonPrograms[lessonId];
  if(!program||!root)return;
  const input=root.querySelector("[data-lesson-live-input]");
  const raw=input?input.value:program.sampleInputs.join(", ");
  try{
    const execution=executePseudocode(program.pseudocode,parseInputValues(raw));
    const diagram=layoutFlow(execution.program);
    liveSession={lessonId,program,execution,diagram,timeline:createTimeline(execution),lastIndex:null};
    renderLessonLiveState(lessonId,root);
  }catch(error){
    const result=root.querySelector("[data-lesson-live-result]");
    if(result)result.textContent="No se pudo analizar el mini-programa: "+error.message;
  }
}

export function renderLessonLiveState(lessonId,root=document){
  const host=root.querySelector("[data-lesson-live]");
  if(!host)return;
  const session=liveSession?.lessonId===lessonId?liveSession:null;
  if(!session)return;
  const {execution,diagram,timeline,program}=session;
  const event=timeline.current;
  const priorIndex=session.lastIndex;
  const priorEvent=priorIndex!==null&&Math.abs(timeline.index-priorIndex)===1?execution.events[priorIndex]:null;
  const seen=execution.events.slice(0,timeline.index+1);
  const previousSource=[...seen.slice(0,-1)].reverse().find(item=>item.nodeId!==null&&item.nodeId!==undefined)?.nodeId;
  const routeEvent=[...seen].reverse().find(item=>item.route&&(item.type==="branch"||item.type==="decision"||item.type==="loop-condition"));
  const diagramHost=host.querySelector("[data-lesson-live-diagram]");
  if(diagramHost&&!diagramHost.querySelector(".flow-svg"))renderDiagram(diagramHost,diagram,{idPrefix:"lesson-live-"});
  highlightDiagram(diagramHost,diagram,{
    activeNodeId:event.nodeId,
    visitedNodeIds:seen.map(item=>item.nodeId).filter(id=>id!==null&&id!==undefined),
    route:routeEvent?.route??null,
    routeNodeId:routeEvent?.nodeId??null,
    previousNodeId:previousSource??null
  });
  animateDiagramTransition(diagramHost,diagram,{
    previousNodeId:priorEvent?.nodeId??null,
    activeNodeId:event.nodeId,
    durationMs:650,
    motionMode:document.documentElement.dataset.motion??"full"
  });
  session.lastIndex=timeline.index;

  const codeHost=host.querySelector("[data-lesson-live-code]");
  if(codeHost){
    codeHost.innerHTML=program.pseudocode.split("|").map((line,index)=>{
      const sourceLine=index+1;
      const isActive=event.sourceLine===sourceLine;
      const visited=seen.some(item=>item.sourceLine===sourceLine);
      return '<li class="'+(isActive?"is-active":visited?"is-visited":"")+'"><span>'+sourceLine+'</span><code>'+esc(line.trim())+'</code></li>';
    }).join("");
  }
  const sceneHost=host.querySelector("[data-lesson-live-scene]");
  if(sceneHost){
    sceneHost.innerHTML=renderSceneVisual(event);
    sceneHost.dataset.eventType=event.type;
  }
  const simple=host.querySelector("[data-lesson-live-simple]");
  const technical=host.querySelector("[data-lesson-live-technical]");
  if(simple)simple.textContent=event.scene?.body??event.message??"";
  if(technical)technical.textContent=event.scene?.technical??event.sourceText??"";
  const line=host.querySelector("[data-lesson-live-line]");
  if(line)line.textContent=event.sourceLine?"Línea "+event.sourceLine:"Control del programa";
  const step=host.querySelector("[data-lesson-live-step]");
  if(step)step.textContent=(event.scene?.title??event.type);
  const variables=host.querySelector("[data-lesson-live-variables]");
  const entries=Object.entries(event.variables??{});
  if(variables)variables.innerHTML=entries.length
    ?'<table class="lesson-live-variable-table"><thead><tr><th>Variable</th><th>Valor</th></tr></thead><tbody>'+
      entries.map(([name,value])=>'<tr><td>'+esc(name)+'</td><td>'+esc(display(value))+'</td></tr>').join("")+'</tbody></table>'
    :'<p class="empty-state-copy">Todavía no hay variables asignadas.</p>';
  const output=host.querySelector("[data-lesson-live-output]");
  const outputs=event.outputs??[];
  if(output)output.innerHTML=outputs.length?outputs.map((value,index)=>'<li><span>'+(index+1)+'.</span>'+esc(display(value))+'</li>').join(""):'<li>El programa todavía no ha producido una salida.</li>';
  const count=host.querySelector("[data-lesson-live-output-count]");
  if(count)count.textContent=String(outputs.length);
  const progress=host.querySelector("[data-lesson-live-progress]");
  if(progress)progress.textContent="Paso "+(timeline.index+1)+" de "+timeline.length;
  const result=host.querySelector("[data-lesson-live-result]");
  if(result){
    result.textContent=event.type==="error"?"Ejecución detenida: "+event.message:
      execution.ok&&timeline.index===timeline.length-1?"Programa finalizado correctamente.":"Avanza paso a paso para observar el estado.";
  }
  const setDisabled=(action,disabled)=>{
    const button=host.querySelector('[data-lesson-live-action="'+action+'"]');
    if(button)button.disabled=disabled;
  };
  setDisabled("first",timeline.index===0);
  setDisabled("previous",timeline.index===0);
  setDisabled("next",timeline.index>=timeline.length-1);
  setDisabled("last",timeline.index>=timeline.length-1);
}

export function handleLessonLiveClick(event,lessonId,root=document){
  const button=event.target.closest("[data-lesson-live-action]");
  if(!button)return false;
  const action=button.dataset.lessonLiveAction;
  if(action==="run"||action==="reset"){
    const program=lessonPrograms[lessonId];
    const input=root.querySelector("[data-lesson-live-input]");
    if(action==="reset"&&input)input.value=program.sampleInputs.join(", ");
    startLessonLive(lessonId,root);
    return true;
  }
  if(!liveSession||liveSession.lessonId!==lessonId)return true;
  const timeline=liveSession.timeline;
  if(action==="first")timeline.first();
  else if(action==="previous")timeline.previous();
  else if(action==="next")timeline.next();
  else if(action==="last")timeline.last();
  else return false;
  renderLessonLiveState(lessonId,root);
  return true;
}

export function getLessonLiveSession(){
  return liveSession;
}
