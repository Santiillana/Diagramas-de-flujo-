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
let lessonPlaybackTimer = 0;
let lessonPlaying = false;
let learnProgress = readLearnProgress();
let selectedExercise = null;
let selectedMethod = 0;
let exerciseQuery = "";
let exerciseLevel = "all";
let exerciseClassOnly = false;
let selectedConcepts = new Set();
let conceptMatchMode = "all";
let exercisePage = 0;
let modalExercise = null;
const PAGE_SIZE = 12;
const CLASS_EXERCISES = new Set([22,23,24,28]);

function exerciseConceptLabels(item){
  const labels=new Set();
  const map={input:"Entrada de datos",assignment:"Asignación",output:"Imprimir",if:"Decisiones",for:"Ciclo Para",while:"Ciclo Mientras",doWhile:"Ciclo Hacer–Mientras"};
  let nestedLoop=false;
  for(const method of item.methods){
    try{
      const root=parsePseudocode(method.pseudocode);
      const walk=(nodes,depth=0)=>{
        for(const node of nodes??[]){
          if(map[node.type])labels.add(map[node.type]);
          if(["for","while","doWhile"].includes(node.type)){
            if(depth>0)nestedLoop=true;
            walk(node.body,depth+1);
          }
          if(node.type==="if"){
            walk(node.thenBody,depth);walk(node.elseBody,depth);
          }
        }
      };
      walk(root.body);
      const source=method.pseudocode.toLocaleLowerCase("es");
      if(/(?:\+|-|\*|\/)/.test(source))labels.add("Operaciones aritméticas");
      if(/(?:<=|>=|<>|!=|==|<|>)/.test(source))labels.add("Comparaciones");
    }catch{}
  }
  const concepts=(item.concepts??[]).join(" ").toLocaleLowerCase("es");
  if(/acumulador|sumatoria|suma acumul/.test(concepts))labels.add("Acumuladores");
  if(/contador|contar|cantidad|intento/.test(concepts))labels.add("Contadores");
  if(/promedio|media|notas/.test(concepts)||/promedio/.test(item.title.toLocaleLowerCase("es")))labels.add("Promedios");
  if(/máximo|mayor|mínimo|menor/.test(concepts+" "+item.title.toLocaleLowerCase("es")))labels.add("Máximo y mínimo");
  if(/centinela/.test(concepts+" "+item.statement.toLocaleLowerCase("es")))labels.add("Centinelas");
  if(/validar|validación|rango/.test(concepts+" "+item.title.toLocaleLowerCase("es")))labels.add("Validación");
  if(/factorial|potencia|exponente|fibonacci|serie/.test((item.title+" "+concepts).toLocaleLowerCase("es")))labels.add("Series y potencias");
  if(nestedLoop||/anidados/.test(concepts))labels.add("Ciclos anidados");
  return [...labels];
}
function exerciseConceptUniverse(){
  return [...new Set(exercises.flatMap(exerciseConceptLabels))].sort((a,b)=>a.localeCompare(b,"es"));
}
function renderConceptFilters(){
  const host=$("#exercise-concepts");if(!host)return;
  host.innerHTML=exerciseConceptUniverse().map(label=>
    '<button type="button" class="concept-filter-chip '+(selectedConcepts.has(label)?"is-selected":"")+'" data-concept-filter="'+escapeHTML(label)+'" aria-pressed="'+String(selectedConcepts.has(label))+'">'+escapeHTML(label)+'</button>'
  ).join("");
  $$("[data-concept-mode]").forEach(button=>{
    button.setAttribute("aria-pressed",String(button.dataset.conceptMode===conceptMatchMode));
  });
  const summary=$("#exercise-filter-summary");
  if(summary)summary.textContent=selectedConcepts.size?selectedConcepts.size+" concepto(s) · "+(conceptMatchMode==="all"?"deben aparecer todos":"al menos uno"):"Todos los conceptos";
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
  const phases=lesson.visual.steps??[];
  const phaseIndex=phases.length?Math.min(phases.length-1,Math.floor(index/Math.max(1,events.length)*phases.length)):0;
  const phaseRail=phases.map(([title,description],position)=>
    '<div class="lesson-phase '+(position===phaseIndex?"is-current":position<phaseIndex?"is-complete":"")+'"><span>'+String(position+1).padStart(2,"0")+'</span><strong>'+escapeHTML(title)+'</strong><small>'+escapeHTML(description)+'</small></div>'
  ).join("");
  return '<section class="lesson-visual lesson-visual-'+escapeHTML(lesson.visual.kind)+'" data-visual-kind="'+escapeHTML(lesson.visual.kind)+'" aria-label="Escena de '+escapeHTML(lesson.title)+'">'+
    '<div class="lesson-visual-head"><div><p class="eyebrow">EXPERIMENTO VISUAL</p><strong>'+escapeHTML(lesson.visual.caption)+'</strong></div>'+
    '<span class="visual-step-count">Paso '+(index+1)+' / '+events.length+'</span></div>'+
    '<div class="lesson-phase-rail">'+phaseRail+'</div>'+
    (scene?'<div class="lesson-scene-host" role="img" aria-label="'+scene.alt+'">'+scene.markup+'</div>':'<p>'+escapeHTML(execution.error?.message??"No se pudo ejecutar el ejemplo.")+'</p>')+
    '<p class="lesson-scene-caption">'+escapeHTML(event?.scene?.body??event?.message??event?.sourceText??"")+'</p>'+
    '<div class="visual-controls"><button type="button" class="button button-secondary" data-visual-reset>Reiniciar</button>'+
    '<button type="button" class="button button-secondary" data-visual-prev '+(index<=0?"disabled":"")+'>← Anterior</button>'+
    '<button type="button" class="button button-secondary" data-visual-play aria-pressed="'+String(lessonPlaying)+'">'+(lessonPlaying?"Ⅱ Pausar":"▶ Reproducir")+'</button>'+
    '<button type="button" class="button button-primary" data-visual-next '+(index>=events.length-1?"disabled":"")+' >Siguiente paso <span aria-hidden="true">→</span></button></div></section>';
}
function stopLessonPlayback(){
  if(lessonPlaybackTimer)clearTimeout(lessonPlaybackTimer);
  lessonPlaybackTimer=0;lessonPlaying=false;
}
function startLessonPlayback(){
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const lesson=lessons.find(item=>item.id===selectedLesson)??lessons[0];
  const execution=runLesson(lesson),events=execution.ok?relevantLessonEvents(lesson,execution):[];
  if(!events.length)return;
  if(lessonVisualStep>=events.length-1)lessonVisualStep=0;
  lessonPlaying=true;renderLesson();
  const next=()=>{
    if(!lessonPlaying)return;
    if(lessonVisualStep>=events.length-1){stopLessonPlayback();renderLesson();return;}
    lessonPlaybackTimer=window.setTimeout(()=>{
      lessonVisualStep++;
      renderLesson();
      next();
    },1650);
  };
  next();
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
  const host=$("#exercise-grid");if(!host)return;
  const query=exerciseQuery.trim().toLocaleLowerCase("es");
  const filtered=exercises.filter(item=>{
    const concepts=exerciseConceptLabels(item);
    const matchesLevel=exerciseLevel==="all"||item.level===exerciseLevel;
    const matchesClass=!exerciseClassOnly||CLASS_EXERCISES.has(item.id);
    const matchesConcepts=!selectedConcepts.size||(conceptMatchMode==="all"
      ?[...selectedConcepts].every(tag=>concepts.includes(tag))
      :[...selectedConcepts].some(tag=>concepts.includes(tag)));
    const searchable=[item.title,item.statement,item.purpose,...item.concepts,...concepts].join(" ").toLocaleLowerCase("es");
    return matchesLevel&&matchesClass&&matchesConcepts&&(!query||searchable.includes(query)||String(item.id)===query);
  });
  const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  exercisePage=Math.min(exercisePage,pages-1);
  const visible=filtered.slice(exercisePage*PAGE_SIZE,(exercisePage+1)*PAGE_SIZE);
  $("#exercise-count").textContent=filtered.length+" de "+exercises.length+" ejercicios";
  host.innerHTML=visible.length?visible.map(item=>{
    const level=LEVELS[item.level];
    const labels=exerciseConceptLabels(item);
    return '<button type="button" class="exercise-card '+(selectedExercise?.id===item.id?"is-selected":"")+'" data-select-exercise="'+item.id+'" aria-pressed="'+String(selectedExercise?.id===item.id)+'">'+
      '<span class="exercise-card-top"><span class="exercise-number">'+String(item.id).padStart(2,"0")+'</span><span class="exercise-level '+level.className+'">'+level.label+'</span></span>'+
      (CLASS_EXERCISES.has(item.id)?'<span class="exercise-class-tag">De clase</span>':"")+
      '<strong>'+escapeHTML(item.title)+'</strong><small>'+escapeHTML(item.statement)+'</small>'+
      '<span class="exercise-card-concepts">'+labels.slice(0,4).map(label=>'<i>'+escapeHTML(label)+'</i>').join("")+'</span>'+
      '<span class="exercise-card-footer">Ver enunciado y requisitos <span aria-hidden="true">↗</span></span></button>';
  }).join(""):'<div class="catalog-empty"><strong>No hay ejercicios con estos filtros.</strong><p>Quita algún concepto o limpia la búsqueda para volver a ver el catálogo.</p></div>';
  let pagination=host.parentElement.querySelector(".exercise-pagination");
  if(!pagination){pagination=document.createElement("nav");pagination.className="exercise-pagination";pagination.setAttribute("aria-label","Páginas de ejercicios");host.after(pagination);}
  pagination.hidden=filtered.length<=PAGE_SIZE;
  pagination.innerHTML='<button type="button" data-page-prev '+(exercisePage===0?"disabled":"")+'>Anterior</button><span>Página '+(exercisePage+1)+' de '+pages+'</span><button type="button" data-page-next '+(exercisePage>=pages-1?"disabled":"")+'>Siguiente</button>';
  renderConceptFilters();
}
function renderExerciseDetail(){
  const host=$("#exercise-detail");if(!host)return;
  const item=selectedExercise;
  if(!item){
    host.innerHTML='<div class="detail-empty"><span class="detail-empty-mark">45</span><p class="eyebrow">INFORMACIÓN DEL EJERCICIO</p><h3>Selecciona un ejercicio.</h3><p>Verás el enunciado, su objetivo, los conceptos que necesitas y las restricciones. La solución se mantiene oculta hasta que decidas abrirla en el Simulador.</p></div>';
    return;
  }
  const level=LEVELS[item.level];
  const concepts=exerciseConceptLabels(item);
  host.innerHTML='<div class="exercise-detail-scroll">'+
    '<header class="exercise-detail-heading"><div class="exercise-detail-kicker"><span class="exercise-number">'+String(item.id).padStart(2,"0")+'</span><span class="exercise-level '+level.className+'">'+level.label+'</span></div>'+
    '<h3>'+escapeHTML(item.title)+'</h3><p>'+escapeHTML(item.statement)+'</p></header>'+
    '<section class="exercise-spec"><p class="eyebrow">OBJETIVO</p><p>'+escapeHTML(item.purpose)+'</p></section>'+
    '<section class="exercise-spec"><p class="eyebrow">CONCEPTOS NECESARIOS</p><div class="concept-tags">'+concepts.map(tag=>'<span>'+escapeHTML(tag)+'</span>').join("")+'</div></section>'+
    '<section class="exercise-spec"><p class="eyebrow">DATOS QUE DEBES CONSIDERAR</p><ul>'+item.inputs.map(value=>'<li>'+escapeHTML(value)+'</li>').join("")+'</ul></section>'+
    '<section class="exercise-spec"><p class="eyebrow">CONDICIONES Y RESTRICCIONES</p><ul>'+item.constraints.map(value=>'<li>'+escapeHTML(value)+'</li>').join("")+'</ul></section>'+
    '<button type="button" class="button button-primary exercise-simulate" data-start-exercise>Ver en el Simulador <span aria-hidden="true">→</span></button>'+
    '<p class="exercise-detail-note">El pseudocódigo y la solución solo se mostrarán después de confirmar que ya intentaste resolverlo.</p>'+
    '</div>';
}
function openExerciseTryModal(){
  const item=selectedExercise,modal=$("#exercise-try-modal");
  if(!item||!modal)return;
  modalExercise=item;
  const level=LEVELS[item.level];
  $("#exercise-try-level").textContent=level.label;
  $("#exercise-try-level").className="exercise-level "+level.className;
  $("#exercise-try-title").textContent=String(item.id).padStart(2,"0")+" · "+item.title;
  $("#exercise-try-statement").textContent=item.statement;
  $("#exercise-try-guidance").innerHTML=
    '<section><strong>Conceptos que necesitas</strong><p>'+exerciseConceptLabels(item).map(escapeHTML).join(" · ")+'</p></section>'+
    '<section><strong>Datos de entrada</strong><ul>'+item.inputs.map(value=>'<li>'+escapeHTML(value)+'</li>').join("")+'</ul></section>'+
    '<section><strong>Condiciones importantes</strong><ul>'+item.constraints.map(value=>'<li>'+escapeHTML(value)+'</li>').join("")+'</ul></section>';
  modal.hidden=false;
  document.body.classList.add("has-exercise-modal");
  $("#exercise-try-back")?.focus({preventScroll:true});
}
function closeExerciseTryModal(){
  const modal=$("#exercise-try-modal");
  if(modal)modal.hidden=true;
  document.body.classList.remove("has-exercise-modal");
  modalExercise=null;
}
function confirmExerciseInSimulator(){
  const item=modalExercise;if(!item)return;
  closeExerciseTryModal();
  selectedMethod=0;
  document.dispatchEvent(new CustomEvent("traza:request-simulation",{detail:{exerciseId:item.id,methodIndex:0}}));
  document.querySelector('#primary-nav [data-space="simulator"]')?.click();
}
function selectExercise(id){
  selectedExercise=exercises.find(item=>item.id===Number(id))??null;
  selectedMethod=0;
  renderExerciseCards();
  renderExerciseDetail();
  if(selectedExercise){
    const card=$('[data-select-exercise="'+selectedExercise.id+'"]');
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
