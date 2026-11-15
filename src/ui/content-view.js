import { lessons } from "../content/lessons.js";
import { exercises } from "../content/exercises.js";
import { executePseudocode } from "../core/interpreter.js";
import { renderScene } from "./scenes/index.js";
import { parsePseudocode } from "../core/parser.js";

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[ch]));
const LEVELS = {
  basic:{label:"Básico",className:"level-basic"},
  intermediate:{label:"Intermedio",className:"level-intermediate"},
  advanced:{label:"Avanzado",className:"level-advanced"},
  expert:{label:"Experto",className:"level-expert"}
};
let selectedLesson = lessons[0].id;
let lessonVisualStep = 0;
let lessonScreenStep = 0;
let learnProgress = readLearnProgress();
let selectedExercise = null;
let selectedMethod = 0;
let exerciseRevealed = false;
let exerciseHintStep = 0;
let exerciseQuery = "";
let exerciseLevel = "all";
let exerciseClassOnly = false;
let exerciseCategory = "all";
let exercisePage = 0;
const PAGE_SIZE = 12;
const CLASS_EXERCISES = new Set([22,23,24,28]);

function exerciseCategories(item){
  const categories=new Set();
  const labels={input:"Entrada",assignment:"Proceso",output:"Salida",if:"Decisión",for:"Repetición",while:"Repetición",doWhile:"Repetición"};
  const walk=nodes=>{for(const node of nodes){if(labels[node.type])categories.add(labels[node.type]);if(node.type==="if"){walk(node.thenBody);walk(node.elseBody);}if(["for","while","doWhile"].includes(node.type))walk(node.body);}};
  for(const method of item.methods){try{walk(parsePseudocode(method.pseudocode).body);}catch{}}
  return [...categories];
}


function readLearnProgress(){
  try{
    const value=JSON.parse(localStorage.getItem("traza:v2:learn")||"null");
    if(!value||value.version!==2||!Array.isArray(value.completed))return {version:2,completed:[],current:lessons[0].id,screen:0};
    const valid=lessons.some(item=>item.id===value.current);
    return {version:2,completed:value.completed.filter(id=>lessons.some(item=>item.id===id)),current:valid?value.current:lessons[0].id,
      screen:Number.isInteger(value.screen)?Math.max(0,Math.min(4,value.screen)):0};
  }catch{return {version:2,completed:[],current:lessons[0].id,screen:0};}
}
function saveLearnProgress(){
  learnProgress.current=selectedLesson;
  learnProgress.screen=lessonScreenStep;
  try{localStorage.setItem("traza:v2:learn",JSON.stringify(learnProgress));}catch{}
}
function completeLesson(){
  if(!learnProgress.completed.includes(selectedLesson))learnProgress.completed.push(selectedLesson);
  saveLearnProgress();
  lessonList();
  renderLesson();
}
const lessonBlocks=[
  {title:"Fundamentos",ids:["algorithm","reading"]},
  {title:"Figuras",ids:["terminals","input","process","output"]},
  {title:"Variables y cuentas",ids:["variables","arithmetic"]},
  {title:"Decisiones",ids:["comparisons","decisions","nested-decisions"]},
  {title:"Repeticiones",ids:["counters-accumulators","for","while","do-while","nested-loops","validation-sentinel"]}
];
function lessonList(){
  const host=$("#lesson-catalog");
  if(!host)return;
  host.innerHTML=lessonBlocks.map(group=>
    '<div class="lesson-catalog-group"><p class="lesson-catalog-group-title">'+escapeHTML(group.title)+'</p>'+
    lessons.filter(lesson=>group.ids.includes(lesson.id)).map(lesson=>{
      const index=lessons.findIndex(item=>item.id===lesson.id);
      const done=learnProgress.completed.includes(lesson.id);
      return '<button class="lesson-list-item '+(lesson.id===selectedLesson?"is-selected":"")+'" type="button" data-lesson-id="'+escapeHTML(lesson.id)+'" aria-current="'+(lesson.id===selectedLesson?"true":"false")+'">'+
        '<span class="lesson-list-number">'+String(index+1).padStart(2,"0")+'</span>'+
        '<span class="lesson-list-copy"><strong>'+escapeHTML(lesson.title)+'</strong><small>'+escapeHTML(lesson.duration)+'</small></span>'+
        '<span class="lesson-list-state" aria-label="'+(done?"Completada":"Pendiente")+'">'+(done?"✓":"")+'</span></button>';
    }).join("")+'</div>'
  ).join("");
}
function lessonInputs(value){
  return String(value??"").split(/[;,]/).map(part=>part.trim()).filter(Boolean).map(Number);
}
function runLesson(lesson,values=lesson.miniProgram.sample){
  try{return executePseudocode(lesson.miniProgram.code,values);}
  catch(error){return {ok:false,error:{message:error.message},events:[],outputs:[],variables:{}};}
}
function relevantLessonEvents(lesson,execution){
  const targets={
    terminals:["program-start","program-end"],input:["input"],process:["assignment"],output:["output"],
    comparisons:["decision"],decisions:["decision","branch"],"nested-decisions":["decision","branch"],
    for:["loop-init","loop-condition","loop-update"],while:["loop-condition","loop-enter"],
    "do-while":["loop-enter","loop-condition"],"nested-loops":["loop-init","loop-enter","loop-condition"],
    "validation-sentinel":["input","loop-condition","assignment"]
  };
  const selected=targets[lesson.id];
  const events=selected?execution.events.filter(event=>selected.includes(event.type)):execution.events.filter(event=>!["program-start","program-end"].includes(event.type));
  return events.length?events:execution.events;
}
function lessonScene(lesson,position=0){
  const execution=runLesson(lesson);
  if(!execution.ok||!execution.events.length)return '<div class="lesson-scene-unavailable">'+escapeHTML(execution.error?.message??"No se pudo ejecutar el ejemplo.")+'</div>';
  const events=relevantLessonEvents(lesson,execution);
  const index=Math.max(0,Math.min(position,events.length-1));
  const event=events[index];
  const rendered=renderScene(event,{execution,events:execution.events,inputValues:lesson.miniProgram.sample});
  const body=event.scene?.body??event.message??event.sourceText??"";
  return '<div class="lesson-scene-host" role="img" aria-label="'+rendered.alt+'">'+rendered.markup+'</div>'+
    (body?'<p class="lesson-scene-caption">'+escapeHTML(body)+'</p>':"");
}
function visualMarkup(lesson){
  const execution=runLesson(lesson);
  const events=execution.ok?relevantLessonEvents(lesson,execution):[];
  const index=Math.min(lessonVisualStep,Math.max(0,events.length-1));
  const event=events[index];
  const scene=event?renderScene(event,{execution,events:execution.events,inputValues:lesson.miniProgram.sample}):null;
  return '<section class="lesson-visual" aria-label="Escena de '+escapeHTML(lesson.title)+'">'+
    '<div class="lesson-visual-head"><div><p class="eyebrow">ESCENA DEL ALGORITMO</p><strong>'+escapeHTML(lesson.visual.caption)+'</strong></div>'+
    '<span class="visual-step-count">'+(index+1)+' / '+events.length+'</span></div>'+
    (scene?'<div class="lesson-scene-host" role="img" aria-label="'+scene.alt+'">'+scene.markup+'</div>':'<p>'+escapeHTML(execution.error?.message??"No se pudo ejecutar el ejemplo.")+'</p>')+
    '<p class="lesson-scene-caption">'+escapeHTML(event?.scene?.body??event?.message??event?.sourceText??"")+'</p>'+
    '<div class="visual-controls"><button type="button" class="button button-secondary" data-visual-reset>Reiniciar</button>'+
    '<button type="button" class="button button-primary" data-visual-next '+(index>=events.length-1?"disabled":"")+' >Siguiente paso <span aria-hidden="true">→</span></button></div></section>';
}
function renderLesson(){
  const lesson=lessons.find(item=>item.id===selectedLesson)??lessons[0];
  const host=$("#lesson-detail");
  if(!host)return;
  const screen=lessonScreenStep;
  const stepNames=["Idea","Escena","Ejemplo","Inténtalo","Resumen"];
  let body="";
  if(screen===0){
    body='<section class="lesson-screen lesson-screen-idea"><p class="eyebrow">¿PARA QUÉ SIRVE?</p><p class="lesson-intuitive">'+escapeHTML(lesson.intuitive)+'</p>'+
      '<details class="lesson-technical"><summary>Versión técnica</summary><p>'+escapeHTML(lesson.technical)+'</p></details>'+
      '<div class="lesson-idea-scene">'+lessonScene(lesson,0)+'</div>'+
      '<p class="lesson-key-idea"><b>Idea clave</b> '+escapeHTML(lesson.summary??lesson.objective)+'</p></section>';
  }else if(screen===1){
    body=visualMarkup(lesson);
  }else if(screen===2){
    body='<section class="lesson-screen lesson-screen-example"><div class="lesson-section-heading"><div><p class="eyebrow">EJEMPLO CON VALORES</p><h4>'+escapeHTML(lesson.miniProgram.title)+'</h4></div></div>'+
      '<label class="lesson-data-control"><span>Datos de entrada</span><input id="lesson-data-input" type="text" value="'+escapeHTML(lesson.miniProgram.sample.join(", "))+'" aria-label="Datos de entrada separados por coma"></label>'+
      '<pre class="lesson-code"><code>'+escapeHTML(lesson.miniProgram.code.split("|").join("\n"))+'</code></pre>'+
      '<div class="lesson-example-output" id="lesson-data-result" role="status"></div>'+
      '<button type="button" class="button button-primary" data-run-mini-program>Ejecutar con estos datos</button>'+
      '<p class="lesson-example-note">'+escapeHTML(lesson.example.explanation)+'</p></section>';
  }else if(screen===3){
    body='<section class="lesson-screen lesson-screen-try"><p class="eyebrow">INTÉNTALO</p><h4>'+escapeHTML(lesson.tryIt?.prompt??"Predice antes de ver la respuesta.")+'</h4>'+
      '<p class="lesson-common-error"><b>Error común:</b> '+escapeHTML(lesson.commonError??"Revisa el orden de las instrucciones.")+'</p>'+
      '<div class="lesson-section-heading"><div><p class="eyebrow">COMPRUEBA TU COMPRENSIÓN</p><h4>'+escapeHTML(lesson.check.question)+'</h4></div></div>'+
      '<div class="lesson-options">'+lesson.check.options.map((option,index)=>
        '<button type="button" class="lesson-option" data-check-option="'+index+'"><span>'+String.fromCharCode(65+index)+'</span>'+escapeHTML(option)+'</button>'
      ).join("")+'</div><p class="lesson-feedback" id="lesson-feedback" role="status"></p></section>';
  }else{
    body='<section class="lesson-screen lesson-screen-summary"><p class="eyebrow">LO QUE YA SABES</p><h4>'+escapeHTML(lesson.title)+'</h4>'+
      '<p class="lesson-summary-text">'+escapeHTML(lesson.summary??lesson.objective)+'</p>'+
      '<p class="lesson-key-idea"><b>Idea clave</b> '+escapeHTML(lesson.objective)+'</p>'+
      '<button type="button" class="button button-primary" data-lesson-complete>'+(learnProgress.completed.includes(lesson.id)?"Lección completada":"Marcar lección completada")+'</button></section>';
  }
  const currentIndex=lessons.findIndex(item=>item.id===lesson.id);
  host.innerHTML='<header class="lesson-detail-heading"><div><p class="eyebrow">LECCIÓN '+String(lesson.order).padStart(2,"0")+' / 17 · '+escapeHTML(lesson.duration.toUpperCase())+'</p>'+
    '<h3>'+escapeHTML(lesson.title)+'</h3><p>'+escapeHTML(lesson.objective)+'</p></div><span class="lesson-completion">'+(learnProgress.completed.includes(lesson.id)?"COMPLETADA":"PANTALLA "+(screen+1)+" DE 5")+'</span></header>'+
    '<nav class="lesson-screen-tabs" aria-label="Pantallas de la lección">'+stepNames.map((name,index)=>
      '<span class="lesson-screen-step '+(index===screen?"is-current":index<screen?"is-past":"")+'">'+(index+1)+". "+name+'</span>'
    ).join("")+'</nav>'+body+
    '<nav class="lesson-screen-navigation" aria-label="Navegación de la lección">'+
      '<button type="button" class="button button-secondary" data-lesson-prev '+(screen===0?"disabled":"")+'>Anterior</button>'+
      '<span class="lesson-screen-count">'+(screen+1)+' de 5</span>'+
      '<button type="button" class="button button-primary" data-lesson-next>'+(screen===4?(currentIndex<lessons.length-1?"Siguiente lección":"Terminar ruta"):"Siguiente")+' <span aria-hidden="true">→</span></button></nav>';
  if(screen===2)updateLessonData();
  saveLearnProgress();
}
function updateLessonData(){
  const lesson=lessons.find(item=>item.id===selectedLesson)??lessons[0];
  const input=$("#lesson-data-input");
  const output=$("#lesson-data-result");
  if(!input||!output)return;
  const values=lessonInputs(input.value);
  if(values.some(value=>!Number.isFinite(value))){
    output.textContent="Usa números válidos separados por comas.";
    return;
  }
  const execution=runLesson(lesson,values);
  if(!execution.ok){
    output.textContent=execution.error?.message??"No se pudo ejecutar el ejemplo.";
    return;
  }
  const result=execution.outputs.length?execution.outputs.map(value=>String(value)).join(" · "):"El programa terminó sin mostrar datos.";
  const variables=Object.entries(execution.variables??{}).map(([name,value])=>name+" = "+value).join(" · ");
  output.textContent="Salida: "+result+(variables?" | Variables: "+variables:"");
}
function renderExerciseCards(){
  const host=$("#exercise-grid"); if(!host)return;
  const query=exerciseQuery.trim().toLocaleLowerCase("es");
  const filtered=exercises.filter(item=>{
    const matchesLevel=exerciseLevel==="all"||item.level===exerciseLevel;
    const matchesClass=!exerciseClassOnly||CLASS_EXERCISES.has(item.id);
    const matchesCategory=exerciseCategory==="all"||exerciseCategories(item).includes(exerciseCategory);
    const searchable=[item.title,item.statement,item.purpose,...item.concepts].join(" ").toLocaleLowerCase("es");
    return matchesLevel&&matchesClass&&matchesCategory&&(!query||searchable.includes(query)||String(item.id)===query);
  });
  const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE)); exercisePage=Math.min(exercisePage,pages-1);
  const visible=filtered.slice(exercisePage*PAGE_SIZE,(exercisePage+1)*PAGE_SIZE);
  $("#exercise-count").textContent=filtered.length+" ejercicios · página "+(exercisePage+1)+" de "+pages;
  host.innerHTML=visible.length?visible.map(item=>{
    const level=LEVELS[item.level];
    return '<button type="button" class="exercise-card '+(selectedExercise?.id===item.id?'is-selected':'')+'" data-select-exercise="'+item.id+'">'+
      '<span class="exercise-card-top"><span class="exercise-number">'+String(item.id).padStart(2,'0')+'</span><span class="exercise-level '+level.className+'">'+level.label+'</span></span>'+
      (CLASS_EXERCISES.has(item.id)?'<span class="exercise-class-tag">De clase</span>':'')+
      '<strong>'+escapeHTML(item.title)+'</strong><small>'+escapeHTML(item.concepts.slice(0,3).join(' · '))+'</small>'+
      '<span class="exercise-card-footer">'+item.methods.length+' '+(item.methods.length===1?'método':'métodos')+' <span aria-hidden="true">↗</span></span></button>';
  }).join(''):'<div class="catalog-empty">No hay ejercicios que coincidan con esa búsqueda.</div>';
  let pagination=host.parentElement.querySelector('.exercise-pagination');
  if(!pagination){pagination=document.createElement('nav');pagination.className='exercise-pagination';pagination.setAttribute('aria-label','Páginas de ejercicios');host.after(pagination);}
  pagination.innerHTML='<button type="button" data-page-prev '+(exercisePage===0?'disabled':'')+'>Anterior</button><span>Página '+(exercisePage+1)+' de '+pages+'</span><button type="button" data-page-next '+(exercisePage>=pages-1?'disabled':'')+'>Siguiente</button>';
}
function renderExerciseDetail(){
  const host=$("#exercise-detail");
  if(!host)return;
  const item=selectedExercise;
  if(!item){
    host.innerHTML='<div class="detail-empty"><span class="detail-empty-mark">40</span><p class="eyebrow">CATÁLOGO PROGRESIVO</p><h3>Selecciona un reto para analizarlo.</h3><p>Las fichas incluyen objetivo, conceptos, entradas, salidas, restricciones, métodos, pruebas y errores frecuentes.</p></div>';
    return;
  }
  selectedMethod=Math.min(selectedMethod,item.methods.length-1);
  const method=item.methods[selectedMethod];
  const level=LEVELS[item.level];
  host.innerHTML=`
    <div class="exercise-detail-scroll">
      <header class="exercise-detail-heading"><div class="exercise-detail-kicker"><span class="exercise-number">${String(item.id).padStart(2,"0")}</span><span class="exercise-level ${level.className}">${level.label}</span></div>
        <h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.statement)}</p></header>
      <section class="exercise-spec"><div class="exercise-section-heading"><p class="eyebrow">OBJETIVO Y CONCEPTOS</p></div>
        <p>${escapeHTML(item.purpose)}</p><div class="concept-tags">${item.concepts.map(tag=>`<span>${escapeHTML(tag)}</span>`).join("")}</div></section>
      <div class="exercise-io-grid">
        <section><p class="eyebrow">ENTRADAS</p><ul>${item.inputs.map(x=>`<li>${escapeHTML(x)}</li>`).join("")||"<li>No requiere entradas.</li>"}</ul></section>
        <section><p class="eyebrow">SALIDAS</p><ul>${item.outputs.map(x=>`<li>${escapeHTML(x)}</li>`).join("")}</ul></section>
      </div>
      <section class="exercise-spec"><p class="eyebrow">RESTRICCIONES</p><ul>${item.constraints.map(x=>`<li>${escapeHTML(x)}</li>`).join("")}</ul>
        <p class="eyebrow">ANÁLISIS DEL PROBLEMA</p><p>${escapeHTML(item.analysis)}</p></section>
      <section class="exercise-methods"><div class="exercise-section-heading"><div><p class="eyebrow">MÉTODOS DE RESOLUCIÓN</p><h4>${item.methods.length} ${item.methods.length===1?"método validable":"alternativas comparables"}</h4></div></div>
        <div class="method-tabs" role="tablist" aria-label="Métodos del ejercicio">
          ${item.methods.map((m,i)=>`<button type="button" role="tab" aria-selected="${i===selectedMethod}" class="method-tab ${i===selectedMethod?"is-active":""}" data-method-index="${i}">${escapeHTML(m.name)}</button>`).join("")}
        </div>
        ${method.note?`<p class="method-note">${escapeHTML(method.note)}</p>`:""}
        <pre class="exercise-pseudocode"><code>${escapeHTML(method.pseudocode.split("|").join("\n"))}</code></pre>
        <p class="exercise-analysis"><b>Cómo funciona:</b> ${escapeHTML(item.analysis)}</p>
        <div class="exercise-example-case"><span class="eyebrow">DATOS DE EJEMPLO</span><code>${escapeHTML(method.sample.join(", ")||"Sin datos de entrada")}</code>
          <span class="eyebrow">PRIMER RESULTADO ESPERADO</span><code>${escapeHTML(JSON.stringify(method.tests[0].expected))}</code></div>
        <details class="exercise-test-cases"><summary>Ver casos de prueba (${method.tests.length})</summary><ul>${method.tests.map(t=>`<li><b>${escapeHTML(t.name)}</b><span>Entrada: ${escapeHTML(JSON.stringify(t.input))}</span><span>Salida: ${escapeHTML(JSON.stringify(t.expected))}</span></li>`).join("")}</ul></details>
      </section>
      <section class="exercise-errors"><p class="eyebrow">ERRORES FRECUENTES</p><ul>${item.errors.map(x=>`<li>${escapeHTML(x)}</li>`).join("")}</ul></section>
      <button type="button" class="button button-primary exercise-simulate" data-open-simulator>Preparar este método en el simulador <span aria-hidden="true">→</span></button>
    </div>`;
  applyChallengeGate();
}

function applyChallengeGate(){
  const host=$("#exercise-detail");
  const item=selectedExercise;
  const scroll=host?.querySelector(".exercise-detail-scroll");
  if(!host||!item||!scroll)return;
  const gate=document.createElement("section");
  gate.className="exercise-gate";
  gate.innerHTML='<p class="eyebrow">MODO RETO · ANTES DE VER LA SOLUCIÓN</p><h4>Piensa entradas, proceso y salidas</h4><p>Registra tu análisis. Puedes pedir una pista o revelar la explicación cuando estés preparado.</p><div class="exercise-attempt-fields"><label>Entradas<textarea data-attempt-field="inputs" rows="2" placeholder="¿Qué datos se necesitan?"></textarea></label><label>Proceso<textarea data-attempt-field="process" rows="2" placeholder="¿Cómo se transforman los datos?"></textarea></label><label>Salidas<textarea data-attempt-field="outputs" rows="2" placeholder="¿Qué debe mostrarse?"></textarea></label></div><div class="exercise-gate-actions"><button type="button" class="button button-secondary" data-save-attempt>Guardar análisis</button><button type="button" class="text-button" data-exercise-hint>Ver una pista</button><button type="button" class="button button-primary" data-reveal-solution>Revelar explicación</button></div><p class="exercise-gate-feedback" data-gate-feedback role="status"></p>';
  scroll.prepend(gate);
  let saved={};
  try{saved=JSON.parse(localStorage.getItem("traza-exercise-attempt-"+item.id)||"{}");}catch{}
  $$('[data-attempt-field]',gate).forEach(field=>{field.value=saved[field.dataset.attemptField]||"";});
  const hiddenSelectors=[".exercise-methods",".exercise-errors",".exercise-simulate",".exercise-detail-scroll > .exercise-spec:nth-of-type(2)"];
  if(!exerciseRevealed)hiddenSelectors.forEach(selector=>{const element=scroll.querySelector(selector);if(element)element.hidden=true;});
  else gate.querySelector('[data-reveal-solution]').textContent="Explicación revelada";
}
function selectExercise(id){
  selectedExercise=exercises.find(item=>item.id===Number(id))??null;
  selectedMethod=0;
  exerciseRevealed=false;
  exerciseHintStep=0;
  renderExerciseCards();
  renderExerciseDetail();
  if(selectedExercise){
    const card=$(`[data-select-exercise="${selectedExercise.id}"]`);
    card?.scrollIntoView({block:"nearest"});
  }
}

function bindContentEvents(){
  $("#lesson-catalog")?.addEventListener("click",event=>{
    const button=event.target.closest("[data-lesson-id]");
    if(!button)return;
    selectedLesson=button.dataset.lessonId;
    lessonVisualStep=0;lessonScreenStep=0;
    saveLearnProgress();lessonList();renderLesson();
  });
  $("#lesson-detail")?.addEventListener("input",event=>{
    if(event.target.id==="lesson-data-input")updateLessonData();
  });
  $("#lesson-detail")?.addEventListener("click",event=>{
    if(event.target.closest("[data-visual-next]")){lessonVisualStep++;renderLesson();}
    if(event.target.closest("[data-visual-reset]")){lessonVisualStep=0;renderLesson();}
    if(event.target.closest("[data-run-mini-program]"))updateLessonData();
    if(event.target.closest("[data-lesson-prev]")&&lessonScreenStep>0){lessonScreenStep--;lessonVisualStep=0;renderLesson();}
    if(event.target.closest("[data-lesson-next]")){
      if(lessonScreenStep<4){lessonScreenStep++;lessonVisualStep=0;renderLesson();}
      else{
        completeLesson();
        const index=lessons.findIndex(item=>item.id===selectedLesson);
        if(index<lessons.length-1){selectedLesson=lessons[index+1].id;lessonScreenStep=0;lessonVisualStep=0;saveLearnProgress();lessonList();renderLesson();}
      }
    }
    if(event.target.closest("[data-lesson-complete]"))completeLesson();
    const answer=event.target.closest("[data-check-option]");
    if(answer){
      const lesson=lessons.find(x=>x.id===selectedLesson);
      const chosen=Number(answer.dataset.checkOption);
      $$(".lesson-option",$("#lesson-detail")).forEach(button=>{
        const n=Number(button.dataset.checkOption);
        button.classList.toggle("is-correct",n===lesson.check.answer);
        button.classList.toggle("is-wrong",n===chosen&&chosen!==lesson.check.answer);
        button.disabled=true;
      });
      const feedback=$("#lesson-feedback");
      feedback.textContent=chosen===lesson.check.answer?"Correcto. "+lesson.check.why:"No todavía. "+lesson.check.why;
      feedback.classList.toggle("is-correct",chosen===lesson.check.answer);
      feedback.classList.toggle("is-wrong",chosen!==lesson.check.answer);
    }
  });
  $("#exercise-search")?.addEventListener("input",event=>{exerciseQuery=event.target.value;exercisePage=0;renderExerciseCards();});
  $("#exercise-level")?.addEventListener("change",event=>{exerciseLevel=event.target.value;exercisePage=0;renderExerciseCards();});
  $("#exercise-class-only")?.addEventListener("change",event=>{exerciseClassOnly=event.target.checked;exercisePage=0;renderExerciseCards();});
  $("#exercise-category")?.addEventListener("change",event=>{exerciseCategory=event.target.value;exercisePage=0;renderExerciseCards();});
  $("#view-exercises")?.addEventListener("click",event=>{if(event.target.closest("[data-page-prev]")){exercisePage=Math.max(0,exercisePage-1);renderExerciseCards();}if(event.target.closest("[data-page-next]")){exercisePage++;renderExerciseCards();}});
  $("#exercise-grid")?.addEventListener("click",event=>{
    const card=event.target.closest("[data-select-exercise]");
    if(card)selectExercise(card.dataset.selectExercise);
  });
  $("#exercise-detail")?.addEventListener("click",event=>{
    if(event.target.closest("[data-save-attempt]")){
      const answer={};
      $$("[data-attempt-field]",$("#exercise-detail")).forEach(field=>answer[field.dataset.attemptField]=field.value);
      try{localStorage.setItem("traza-exercise-attempt-"+selectedExercise.id,JSON.stringify(answer));}catch{}
      const feedback=$("[data-gate-feedback]",$("#exercise-detail"));
      if(feedback)feedback.textContent="Tu análisis quedó guardado en este navegador.";
      return;
    }
    if(event.target.closest("[data-exercise-hint]")){
      const hint=exerciseHintStep===0
        ?"Conceptos que se ponen en práctica: "+selectedExercise.concepts.slice(0,3).join(", ")+".":"Restricción que debes respetar: "+selectedExercise.constraints[0];
      const feedback=$("[data-gate-feedback]",$("#exercise-detail"));
      if(feedback)feedback.textContent=hint;
      exerciseHintStep=Math.min(exerciseHintStep+1,1);
      return;
    }
    if(event.target.closest("[data-reveal-solution]")){
      exerciseRevealed=true;
      renderExerciseDetail();
      return;
    }
    const tab=event.target.closest("[data-method-index]");
    if(tab){selectedMethod=Number(tab.dataset.methodIndex);renderExerciseDetail();return;}
    if(event.target.closest("[data-open-simulator]")&&selectedExercise){
      document.dispatchEvent(new CustomEvent("traza:request-simulation",{detail:{exerciseId:selectedExercise.id,methodIndex:selectedMethod}}));
      document.querySelector('[data-space="simulator"]')?.click();
    }
  });
}

export function initContentViews(){
  selectedLesson=learnProgress.current;lessonScreenStep=learnProgress.screen;
  const count=$("#view-learn .lesson-catalog-panel h3");if(count)count.textContent="17 lecciones";
  const homeProgress=$("#home-learn-progress");if(homeProgress)homeProgress.textContent=learnProgress.completed.length+" completadas";
  const mark=$("#view-learn .detail-empty-mark");if(mark)mark.textContent="17";
  lessonList();renderLesson();
  renderExerciseCards();renderExerciseDetail();
  bindContentEvents();
}
