import { lessons } from "../content/lessons.js";
import { rutas } from "../content/rutas.js";
import { exercises } from "../content/exercises.js";
import { executePseudocode } from "../core/interpreter.js";
import { renderScene, createClock, lessonRecipe, recipeFrame, recipeMoment, recipeMomentIndex, recipeSceneMarkup } from "./kit/index.js";
import { parsePseudocode } from "../core/parser.js";
import { temas, competenciasAprende, temaPorId } from "../content/temas.js";
import { conceptos } from "../content/conceptos.js";
import { normalizeLearnProgress, dateInBogota, currentStreak } from "../content/learn-progress.js";

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
let lessonPlaybackFrame = 0;
let lessonClock = null;
let lessonPlaying = false;
let lessonTryResolved = false;
let learnProgress = readLearnProgress();
let selectedTheme = learnProgress.theme;
let topicTab = learnProgress.tab;
let learnDifficulty = "todas";
let learnCompetence = "todas";
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
const LESSON_TERMS = {
  algorithm:"Algoritmo",reading:"Flujo y secuencia",terminals:"Símbolos de diagrama",
  input:"Entrada",process:"Proceso",output:"Salida",variables:"Variable",arithmetic:"Operación aritmética",
  comparisons:"Operadores relacionales",decisions:"Decisión","nested-decisions":"Decisión anidada",
  "counters-accumulators":"Contador y acumulador",for:"Ciclo Para",while:"Ciclo Mientras",
  "do-while":"Ciclo Hacer–Mientras","nested-loops":"Ciclos anidados","validation-sentinel":"Validación con centinela"
};

export function exerciseConceptLabels(item){
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
  const conceptSummary=$("#exercise-concepts-summary");
  if(conceptSummary)conceptSummary.textContent=selectedConcepts.size
    ?selectedConcepts.size+" seleccionado(s)"
    :"Todos los conceptos";
}



function readLearnProgress(){
  try{
    const value=JSON.parse(localStorage.getItem("traza:v2:learn")||"null");
    return normalizeLearnProgress(value, lessons.map(item=>item.id), temas.map(item=>item.id));
  }catch{return normalizeLearnProgress(null, lessons.map(item=>item.id), temas.map(item=>item.id));}
}
function saveLearnProgress(){
  learnProgress.current=selectedLesson;
  learnProgress.screen=lessonScreenStep;
  learnProgress.theme=selectedTheme;
  learnProgress.tab=topicTab;
  try{localStorage.setItem("traza:v2:learn",JSON.stringify(learnProgress));}catch{}
}
function completeLesson(){
  if(!learnProgress.completed.includes(selectedLesson))learnProgress.completed.push(selectedLesson);
  recordLearnActivity();
  saveLearnProgress();
  lessonList();
  renderLesson();
}
function recordLearnActivity(){
  const day=dateInBogota();
  learnProgress.activityDays=Array.isArray(learnProgress.activityDays)?learnProgress.activityDays:[];
  if(!learnProgress.activityDays.includes(day))learnProgress.activityDays.push(day);
  learnProgress.activityDays=learnProgress.activityDays.slice(-60);
  const streak=document.querySelector("#learn-streak");
  if(streak)streak.textContent="Racha: "+currentStreak(learnProgress.activityDays,day)+" días";
}

function showLearnPanel(panel){
  const catalog=$("#learn-catalog-home"),progress=$("#learn-progress-page"),topic=$("#learn-topic-space");
  if(catalog)catalog.hidden=panel!=="catalog";
  if(progress)progress.hidden=panel!=="progress";
  if(topic)topic.hidden=panel!=="topic";
}
function progressRing(done,total){return `<span class="theme-progress-ring" style="--theme-progress:${total?Math.round(done/total*100):0}%" aria-label="${done} de ${total} lecciones completadas">${total?Math.round(done/total*100):"–"}%</span>`;}

function renderLearnCatalog(){
  const host=$("#learn-catalog-bands");if(!host)return;
  const filterHost=$("#learn-competence-filters");
  if(filterHost)filterHost.innerHTML=`<button type="button" class="learn-competence-chip${learnCompetence==="todas"?" is-active":""}" data-learn-competence="todas" aria-pressed="${learnCompetence==="todas"}">Todas las competencias</button>`+competenciasAprende.map(item=>`<button type="button" class="learn-competence-chip${learnCompetence===item.id?" is-active":""}" data-learn-competence="${item.id}" aria-pressed="${learnCompetence===item.id}"><span class="competence-marker" data-forma="${item.forma}" aria-hidden="true"></span>${escapeHTML(item.titulo)}</button>`).join("");
  host.innerHTML=competenciasAprende.filter(competence=>learnCompetence==="todas"||competence.id===learnCompetence).map(competence=>{
    const items=temas.filter(theme=>theme.competenciaId===competence.id&&
      (learnDifficulty==="todas"||String(theme.dificultad)===learnDifficulty)).sort((a,b)=>a.dificultad-b.dificultad);
    const all=temas.filter(theme=>theme.competenciaId===competence.id);
    const tiles=items.map(theme=>{
      const available=theme.estado==="disponible";
      const complete=theme.lecciones.filter(id=>learnProgress.completed.includes(id)).length;
      const include=[theme.lecciones.length,theme.ejercicios.length,theme.simulador?1:0,theme.laboratorio?.mecanicas.length||0];
      return `<button type="button" class="theme-card${available?"":" is-coming"}" data-topic-open="${escapeHTML(theme.id)}" data-difficulty="${theme.dificultad}" aria-disabled="${String(!available)}" aria-label="${escapeHTML(theme.titulo)}${available?"":"; no disponible todavía"}"><span class="theme-icon" aria-hidden="true">${escapeHTML(theme.icono)}</span>${available?progressRing(complete,theme.lecciones.length):'<span class="theme-coming-label">◷ Próximamente</span>'}<strong>${escapeHTML(theme.titulo)}</strong><span class="theme-difficulty" aria-label="Dificultad ${theme.dificultad} de 4">${[1,2,3,4].map(n=>`<i class="${n<=theme.dificultad?"is-filled":""}"></i>`).join("")}</span><span class="theme-includes"><span>▤ ${include[0]}</span><span>◇ ${include[1]}</span><span>⌘ ${include[2]}</span><span>⌑ ${include[3]}</span></span></button>`;
    }).join("");
    return `<section class="learn-competence-band"><header><span class="competence-marker" data-forma="${competence.forma}" aria-hidden="true"></span><h3>${escapeHTML(competence.titulo)}</h3><span>${all.length} ${all.length===1?"tema":"temas"}</span></header>${tiles?`<div class="theme-grid">${tiles}</div>`:all.length?'<p class="learn-coming-empty">No hay temas con esta dificultad.</p>':'<p class="learn-coming-empty">Próximamente</p>'}</section>`;
  }).join("");
}

function renderTopicTabs(){
  const host=$("#learn-topic-tabs");const theme=temaPorId(selectedTheme);if(!host||!theme)return;
  const entries=[
    ["lecciones","Lecciones",theme.lecciones.length,null],
    ["ejercicios","Ejercicios",theme.ejercicios.length,"exercises"],
    ["simulador","Simulador",theme.simulador?1:0,"simulator"],
    ["laboratorio","Laboratorio",theme.laboratorio?.mecanicas.length||0,"lab"]
  ];
  host.innerHTML=entries.map(([id,label,count,space])=>`<button type="button" class="learn-topic-tab${topicTab===id?" is-active":""}" data-topic-tab="${id}"${space?` data-go="${space}"`:""} aria-current="${topicTab===id?"page":"false"}"><span aria-hidden="true">${({lecciones:"▤",ejercicios:"◇",simulador:"⌘",laboratorio:"⌑"})[id]}</span>${label}<small>${count}</small></button>`).join("");
}

function renderTopicSpace(){
  const theme=temaPorId(selectedTheme);if(!theme||theme.estado!=="disponible")return;
  const competence=competenciasAprende.find(item=>item.id===theme.competenciaId);
  const label=$("#learn-topic-competence"),title=$("#learn-topic-title"),select=$("#learn-topic-select");
  if(label)label.textContent=competence?.titulo||"Aprende";
  if(title)title.textContent=theme.titulo;
  const count=$("#learn-catalog-count");
  const topicConcepts=conceptos.filter(item=>theme.conceptos.includes(item.id));
  if(count)count.textContent=theme.lecciones.length+" lecciones · "+topicConcepts.length+" conceptos";
  if(select){
    select.innerHTML=competenciasAprende.map(item=>`<optgroup label="${escapeHTML(item.titulo)}">${temas.filter(topic=>topic.competenciaId===item.id).map(topic=>`<option value="${escapeHTML(topic.id)}"${topic.id===selectedTheme?" selected":""}${topic.estado!=="disponible"?' data-coming="true"':""}>${escapeHTML(topic.titulo)}${topic.estado!=="disponible"?" · Próximamente":""}</option>`).join("")}</optgroup>`).join("");
  }
  renderTopicTabs();
  const lessonsHost=$("#learn-lessons-content"),empty=$("#learn-topic-empty");
  if(lessonsHost)lessonsHost.hidden=topicTab!=="lecciones";
  if(empty){empty.hidden=topicTab==="lecciones";empty.innerHTML=topicTab==="lecciones"?"":`<span aria-hidden="true">◇</span><strong>Vista de ${escapeHTML(topicTab)} para ${escapeHTML(theme.titulo)}</strong><p>Usa la pestaña superior para abrir esta herramienta. El tema queda guardado para volver a sus lecciones.</p><button type="button" class="button button-secondary" data-go="${topicTab==="ejercicios"?"exercises":topicTab==="simulador"?"simulator":"lab"}">Abrir ${escapeHTML(topicTab)}</button>`;}
}

function openTheme(id){
  const theme=temaPorId(id);if(!theme||theme.estado!=="disponible")return;
  selectedTheme=id;
  if(!theme.lecciones.includes(selectedLesson)){selectedLesson=theme.lecciones[0]||lessons[0].id;lessonScreenStep=0;lessonVisualStep=0;}
  topicTab=learnProgress.tab||"lecciones";
  saveLearnProgress();
  showLearnPanel("topic");
  lessonList();renderLesson();renderTopicSpace();
}

function renderLearnProgress(){
  const host=$("#learn-progress-topics");if(!host)return;
  const done=learnProgress.completed.length;const percent=Math.round(done/lessons.length*100);
  const ring=$("#learn-progress-ring"),text=$("#learn-progress-percent"),total=$("#learn-progress-total"),fill=$("#learn-progress-fill");
  if(ring){ring.style.setProperty("--learn-progress",percent+"%");ring.setAttribute("aria-valuenow",String(done));}
  if(text)text.textContent=percent+"%";if(total)total.textContent=done+" de "+lessons.length+" lecciones completadas";if(fill)fill.style.width=percent+"%";
  let lab={};try{lab=JSON.parse(localStorage.getItem("traza:v2:progress")||"{}").exercises||{};}catch{}
  host.innerHTML=competenciasAprende.map(competence=>{
    const owned=temas.filter(theme=>theme.competenciaId===competence.id);
    const lessonIds=owned.flatMap(theme=>theme.lecciones);const completed=lessonIds.filter(id=>learnProgress.completed.includes(id)).length;
    return `<article class="learn-progress-competence"><header><span class="competence-marker" data-forma="${competence.forma}" aria-hidden="true"></span><strong>${escapeHTML(competence.titulo)}</strong>${progressRing(completed,lessonIds.length)}</header>${owned.map(theme=>{const count=theme.lecciones.filter(id=>learnProgress.completed.includes(id)).length;const pct=theme.lecciones.length?Math.round(count/theme.lecciones.length*100):0;const stars=theme.ejercicios.reduce((sum,id)=>sum+Object.values(lab[String(id)]||{}).reduce((n,mode)=>n+(Number(mode?.stars)||0),0),0);return `<div class="learn-progress-topic"><span>${escapeHTML(theme.titulo)}</span><span class="learn-topic-track"><i style="width:${pct}%"></i></span><small>${count} de ${theme.lecciones.length} lecciones · ${stars} estrellas del Laboratorio</small></div>`;}).join("")||'<p>Próximamente</p>'}</article>`;
  }).join("");
}
function lessonList(){
  const host=$("#lesson-catalog");
  if(!host)return;
  const routeCount=$("#lesson-route-count"),routeFill=$("#lesson-route-fill");
  const current=lessons.findIndex(item=>item.id===selectedLesson)+1;
  if(routeCount){routeCount.textContent=current+" de "+lessons.length;routeCount.parentElement?.setAttribute("role","progressbar");routeCount.parentElement?.setAttribute("aria-valuemin","0");routeCount.parentElement?.setAttribute("aria-valuemax",String(lessons.length));routeCount.parentElement?.setAttribute("aria-valuenow",String(current));}
  if(routeFill)routeFill.style.width=Math.round(current/lessons.length*100)+"%";
  host.innerHTML=rutas.map(group=>{
    const done=group.ids.filter(id=>learnProgress.completed.includes(id)).length;
    const items=lessons.filter(lesson=>group.ids.includes(lesson.id)).map(lesson=>{
      const index=lessons.findIndex(item=>item.id===lesson.id);
      const completedLesson=learnProgress.completed.includes(lesson.id);
      const difficulty=Math.max(1,rutas.findIndex(item=>item.ids.includes(lesson.id))+1);
      return '<button class="lesson-list-item '+(lesson.id===selectedLesson?"is-selected":"")+'" type="button" data-lesson-id="'+escapeHTML(lesson.id)+'" aria-current="'+(lesson.id===selectedLesson?"true":"false")+'" aria-label="Lección '+String(index+1)+': '+escapeHTML(lesson.title)+(completedLesson?", completada":", pendiente")+'">'+
        '<span class="lesson-list-number">'+String(index+1).padStart(2,"0")+'</span>'+
        '<span class="lesson-list-copy"><strong>'+escapeHTML(lesson.title)+'</strong></span>'+
        '<span class="lesson-list-state" aria-hidden="true">'+(completedLesson?"✓":lesson.id===selectedLesson?"◐":"○")+'</span>'+
        '<span class="lesson-list-difficulty" aria-label="Dificultad '+difficulty+' de 4">'+[1,2,3,4].map(value=>'<i class="'+(value<=difficulty?"is-filled":"")+'"></i>').join("")+'</span></button>';
    }).join("");
    return '<section class="lesson-catalog-group" data-route-id="'+escapeHTML(group.id)+'" aria-label="'+escapeHTML(group.title)+'">'+
      '<div class="lesson-catalog-group-heading"><div><p class="lesson-catalog-group-title">'+escapeHTML(group.title)+'</p><small>'+escapeHTML(group.description)+'</small></div>'+
      '<span class="lesson-group-progress" aria-label="'+done+' de '+group.ids.length+' lecciones completadas">'+done+'/'+group.ids.length+'</span></div>'+
      '<div class="lesson-catalog-items">'+items+'</div></section>';
  }).join("")+'<details class="lesson-glossary"><summary>Glosario del tema</summary><dl>'+lessons.map(lesson=>'<dt>'+escapeHTML(LESSON_TERMS[lesson.id]??lesson.title)+'</dt><dd>'+escapeHTML(lesson.technical)+'</dd>').join("")+'</dl></details>';
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
    comparisons:["decision"],decisions:["decision","branch"],"nested-decisions":["decision","branch"],
    for:["loop-init","loop-condition","loop-enter","loop-update","loop-exit"],
    while:["loop-condition","loop-enter","loop-exit"],
    "do-while":["loop-enter","loop-condition","loop-exit"],
    "nested-loops":["loop-init","loop-enter","loop-update","loop-condition","loop-exit"],
    "validation-sentinel":["input","loop-condition","assignment","loop-exit"]
  };
  const selected=targets[lesson.id];
  const events=selected?execution.events.filter(event=>selected.includes(event.type)):
    execution.events.filter(event=>lesson.id==="terminals"||!["program-start","program-end"].includes(event.type));
  return events.length?events:execution.events;
}
function lessonScene(lesson,position=0){
  const recipe=lessonRecipe(lesson.id);
  if(recipe)return '<div class="lesson-scene-host" role="img" aria-label="'+escapeHTML(recipe.cierre)+'">'+recipeSceneMarkup(recipe,0)+'</div>';
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
function lessonPhaseForEvent(event){
  const map={
    "program-start":["start","Inicio","Preparar el recorrido"],
    input:["input","Entrada","Leer los datos necesarios"],
    assignment:["process","Proceso","Transformar o actualizar un valor"],
    decision:["decision","Decisión","Evaluar una condición y elegir ruta"],
    branch:["route","Ruta","Seguir la rama verdadera o falsa"],
    "loop-init":["loop-init","Preparación del ciclo","Inicializar el contador o acumulador"],
    "loop-condition":["loop-condition","Condición del ciclo","Comprobar si la repetición continúa"],
    "loop-enter":["loop-body","Cuerpo del ciclo","Ejecutar las instrucciones repetidas"],
    "loop-update":["loop-update","Avance del ciclo","Actualizar el contador"],
    "loop-exit":["loop-exit","Fin del ciclo","Salir de la repetición"],
    output:["output","Salida","Mostrar el resultado"],
    "program-end":["end","Fin","Completar el algoritmo"],
    error:["error","Error","Revisar el dato o la instrucción que detuvo el recorrido"]
  };
  return map[event?.type]??["other","Ejecución","Seguir el siguiente evento del algoritmo"];
}
function visualMarkup(lesson){
  const execution=runLesson(lesson);
  const events=execution.ok?relevantLessonEvents(lesson,execution):[];
  const index=Math.min(lessonVisualStep,Math.max(0,events.length-1));
  const event=events[index];
  const scene=event?renderScene(event,{execution,events:execution.events,inputValues:lesson.miniProgram.sample}):null;
  const recipe=lessonRecipe(lesson.id);
  const frame=recipe?recipeFrame(recipe,index,events.length):0;
  const declared=Array.isArray(lesson.visual.steps)&&lesson.visual.steps.length>0;
  let phases,phaseIndex;
  if(declared){
    phases=lesson.visual.steps.map(([title,description],position)=>({key:"lesson-"+position,title,description}));
    const phaseMap={algorithm:{input:0,assignment:1,output:2},reading:{input:0,assignment:1,decision:1,branch:1,output:2},terminals:{"program-start":0,input:1,assignment:1,decision:1,output:1,"program-end":2},input:{input:1},process:{assignment:1},output:{output:1},variables:{assignment:1},arithmetic:{assignment:1},comparisons:{decision:1},decisions:{decision:0,branch:1},"nested-decisions":{decision:0,branch:1},"counters-accumulators":{"loop-init":0,input:1,assignment:1,"loop-update":2},for:{"loop-init":0,"loop-condition":1,"loop-enter":2,"loop-update":3,"loop-exit":4},while:{"loop-condition":0,"loop-enter":1,"loop-exit":2},"do-while":{"loop-enter":0,"loop-condition":1,"loop-exit":2},"nested-loops":{"loop-init":0,"loop-enter":1,"loop-update":2,"loop-exit":2},"validation-sentinel":{input:0,"loop-condition":1,assignment:2,"loop-exit":2}};
    const matched=phaseMap[lesson.id]?.[event?.type];
    phaseIndex=Number.isInteger(matched)?Math.min(phases.length-1,matched):Math.min(phases.length-1,Math.floor(index/Math.max(1,events.length)*phases.length));
  }else{
    const unique=new Map();
    for(const item of events){
      const [key,title,description]=lessonPhaseForEvent(item);
      if(!unique.has(key))unique.set(key,{key,title,description});
    }
    phases=[...unique.values()];
    if(!phases.length)phases=[{key:"waiting",title:"Preparación",description:"El ejemplo todavía no produjo eventos para recorrer"}];
    const activeKey=event?lessonPhaseForEvent(event)[0]:phases[0].key;
    phaseIndex=Math.max(0,phases.findIndex(phase=>phase.key===activeKey));
  }
  const phaseRail=phases.map((phase,position)=>
    '<div class="lesson-phase '+(position===phaseIndex?"is-current":position<phaseIndex?"is-complete":"")+'" data-phase-key="'+escapeHTML(phase.key)+'">'+
    '<span>'+String(position+1).padStart(2,"0")+'</span><strong>'+escapeHTML(phase.title)+'</strong><small>'+escapeHTML(phase.description)+'</small></div>'
  ).join("");
  return '<section class="lesson-visual lesson-visual-'+escapeHTML(lesson.visual.kind)+'" data-lesson-id="'+escapeHTML(lesson.id)+'" data-recipe-id="'+escapeHTML(recipe?.id??"eventos-del-motor")+'" data-visual-kind="'+escapeHTML(lesson.visual.kind)+'" data-phase-source="'+(declared?"lesson":"events")+'" aria-label="Escena de '+escapeHTML(lesson.title)+'">'+
    '<div class="lesson-visual-head"><div><p class="eyebrow">EXPERIMENTO VISUAL</p><strong>'+escapeHTML(lesson.visual.caption)+'</strong></div>'+
    '<span class="visual-step-count">'+(recipe?"Momento "+(recipeMomentIndex(recipe,index,events.length)+1)+"/"+recipe.moments.length+" · Paso "+(events.length?index+1:0)+"/"+events.length:"Paso "+(events.length?index+1:0)+" / "+events.length)+'</span></div>'+
    '<div class="lesson-phase-rail">'+phaseRail+'</div>'+
    (recipe?'<div class="lesson-scene-host" role="img" aria-label="'+escapeHTML(recipe.cierre)+'">'+recipeSceneMarkup(recipe,frame,recipeMomentIndex(recipe,index,events.length))+'</div>':scene?'<div class="lesson-scene-host" role="img" aria-label="'+scene.alt+'">'+scene.markup+'</div>':'<p>'+escapeHTML(execution.error?.message??"No se pudo ejecutar el ejemplo.")+'</p>')+
    '<p class="lesson-scene-caption">'+escapeHTML(recipe?recipeMoment(recipe,index,events.length):event?.scene?.body??event?.message??event?.sourceText??"")+'</p>'+
    '<details class="lesson-static-sequence" '+((document.documentElement.dataset.motion==="reduced"||window.matchMedia("(prefers-reduced-motion: reduce)").matches)?"open":"")+'><summary>Ver secuencia estática</summary>'+(recipe?'<ol class="recipe-static-sequence">'+recipe.moments.map((moment,position)=>'<li><span>'+String(position+1)+'</span>'+escapeHTML(moment)+'</li>').join("")+'</ol>':"")+'<ol>'+events.map((item,position)=>'<li><span>'+String(position+1)+'</span>'+escapeHTML(item.scene?.body??item.message??item.sourceText??"Paso del algoritmo")+'</li>').join("")+'</ol></details>'+
    '<div class="visual-controls" tabindex="0" aria-label="Controles de la escena. Usa espacio para reproducir o pausar y las flechas para avanzar o retroceder." data-visual-player><button type="button" class="button button-secondary" data-visual-reset>Reiniciar</button>'+
    '<button type="button" class="button button-secondary" data-visual-prev '+(index<=0?"disabled":"")+'>← Anterior</button>'+
    '<button type="button" class="button button-secondary" data-visual-play aria-pressed="'+String(lessonPlaying)+'">'+(lessonPlaying?"Ⅱ Pausar":"▶ Reproducir")+'</button>'+
    '<button type="button" class="button button-primary" data-visual-next '+(!events.length||index>=events.length-1?"disabled":"")+' >Siguiente paso <span aria-hidden="true">→</span></button>'+
    '<label class="visual-speed-label">Velocidad<select data-visual-speed aria-label="Velocidad de reproducción"><option value="0.5" '+(lessonClock?.speed===0.5?"selected":"")+'>0,5×</option><option value="1" '+((lessonClock?.speed??1)===1?"selected":"")+'>1×</option><option value="2" '+(lessonClock?.speed===2?"selected":"")+'>2×</option></select></label></div></section>';
}
function stopLessonPlayback(){
  if(lessonPlaybackFrame)cancelAnimationFrame(lessonPlaybackFrame);
  lessonPlaybackFrame=0;lessonClock?.pause();lessonPlaying=false;
}
function startLessonPlayback(){
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches||document.documentElement.dataset.motion==="reduced")return;
  const lesson=lessons.find(item=>item.id===selectedLesson)??lessons[0];
  const execution=runLesson(lesson),events=execution.ok?relevantLessonEvents(lesson,execution):[];
  if(!events.length)return;
  if(lessonVisualStep>=events.length-1)lessonVisualStep=0;
  lessonClock=createClock({duration:events.length*1300});
  lessonClock.seek(lessonVisualStep*1300);lessonClock.play();lessonPlaying=true;renderLesson();
  let previous=null;
  const frame=timestamp=>{
    if(!lessonPlaying||!lessonClock)return;
    if(previous!==null){
      const oldStep=lessonVisualStep;
      lessonClock.advance(Math.min(100,Math.max(0,timestamp-previous)));
      lessonVisualStep=Math.min(events.length-1,Math.floor(lessonClock.time/1300));
      if(lessonVisualStep!==oldStep)renderLesson();
    }
    previous=timestamp;
    if(lessonClock.playing)lessonPlaybackFrame=requestAnimationFrame(frame);
    else{lessonPlaying=false;lessonPlaybackFrame=0;renderLesson();}
  };
  lessonPlaybackFrame=requestAnimationFrame(frame);
}
function renderLesson(){
  const lesson=lessons.find(item=>item.id===selectedLesson)??lessons[0];
  const host=$("#lesson-detail");if(!host)return;
  const route=rutas.find(group=>group.ids.includes(lesson.id));
  const completed=learnProgress.completed.includes(lesson.id);
  const recipe=lessonRecipe(lesson.id);
  const execution=runLesson(lesson),events=execution.ok?relevantLessonEvents(lesson,execution):[];
  const steps=events.map((item,index)=>'<li><span>'+String(index+1).padStart(2,"0")+'</span><p>'+escapeHTML(item.scene?.body??item.message??item.sourceText??"Paso del algoritmo")+'</p></li>').join("");
  const activeLine=events[Math.min(lessonVisualStep,Math.max(0,events.length-1))]?.sourceLine;
  const codeLines=lesson.miniProgram.code.split("|").map((line,index)=>'<li class="'+(activeLine===index+1?"is-active":"")+'"><span>'+(index+1)+'</span><code>'+escapeHTML(line)+'</code></li>').join("");
  const options=lesson.check.options.map((option,index)=>'<button type="button" class="lesson-option" data-check-option="'+index+'"><span>'+String.fromCharCode(65+index)+'</span>'+escapeHTML(option)+'</button>').join("");
  const prereq=lesson.id==="process"?"Variables":lesson.id==="arithmetic"?"Asignación":lesson.id==="for"?"Contador y acumulador":"";
  const idea='<section class="lesson-reading-section" id="lesson-idea"><p class="eyebrow">01 · IDEA</p><p class="lesson-intuitive">'+escapeHTML(recipe?.idea??lesson.intuitive)+'</p><div class="lesson-idea-scene lesson-idea-scene-'+escapeHTML(lesson.visual.kind)+'" data-lesson-kind="'+escapeHTML(lesson.visual.kind)+'">'+lessonScene(lesson,0)+'</div>'+(prereq?'<p class="lesson-prerequisite">Antes conviene ver: <button type="button" data-prerequisite="'+escapeHTML(prereq)+'">'+escapeHTML(prereq)+'</button></p>':"")+'</section>';
  const concept='<section class="lesson-reading-section" id="lesson-concept"><p class="eyebrow">02 · CONCEPTO</p><p class="lesson-support-copy">'+escapeHTML(lesson.visual.caption)+'</p>'+visualMarkup(lesson)+'</section>';
  const term='<section class="lesson-reading-section" id="lesson-term"><p class="eyebrow">03 · PALABRA TÉCNICA</p><h4 class="lesson-term-title">'+escapeHTML(recipe?.term??LESSON_TERMS[lesson.id]??lesson.title)+'</h4><p class="lesson-term-definition">'+escapeHTML(lesson.technical)+'</p><p class="lesson-key-idea"><b>En pocas palabras</b> '+escapeHTML(lesson.summary??lesson.objective)+'</p><details class="lesson-technical"><summary>Cómo se escribe o se representa</summary><p>'+escapeHTML(lesson.example.code.split("|").join(" · "))+'</p></details></section>';
  const example='<section class="lesson-reading-section" id="lesson-example"><p class="eyebrow">04 · EJEMPLO PASO A PASO</p><h4>'+escapeHTML(lesson.miniProgram.title)+'</h4><div class="lesson-worked-layout"><ol class="lesson-code-lines" aria-label="Pseudocódigo con la línea activa">'+codeLines+'</ol><ol class="lesson-worked-steps">'+steps+'</ol></div><p class="lesson-example-note">'+escapeHTML(lesson.example.explanation)+'</p><details class="lesson-interactive-test"><summary>Probar con otros datos</summary><label class="lesson-data-control"><span>Datos de entrada</span><input id="lesson-data-input" type="text" value="'+escapeHTML(lesson.miniProgram.sample.join(", "))+'" aria-label="Datos de entrada separados por coma"></label><div class="lesson-example-output" id="lesson-data-result" role="status"></div><button type="button" class="button button-primary" data-run-mini-program>Ejecutar prueba</button></details></section>';
  const practice='<section class="lesson-reading-section" id="lesson-practice"><p class="eyebrow">05 · INTÉNTALO</p><h4>'+escapeHTML(lesson.tryIt?.prompt??"Predice antes de ver la respuesta.")+'</h4><p class="lesson-common-error"><b>Error común:</b> '+escapeHTML(lesson.commonError??"Revisa el orden de las instrucciones.")+'</p><p>'+escapeHTML(lesson.check.question)+'</p><div class="lesson-options">'+options+'</div><p class="lesson-feedback" id="lesson-feedback" role="status"></p><button type="button" class="text-link" data-skip-practice>Saltar la práctica</button></section>';
  const summary='<section class="lesson-reading-section lesson-summary-section" id="lesson-summary"><p class="eyebrow">06 · RESUMEN</p><h4>'+escapeHTML(lesson.title)+'</h4><div class="lesson-summary-points"><p><span aria-hidden="true">◇</span>'+escapeHTML(lesson.intuitive.split(/[.!?]/)[0])+'.</p><p><span aria-hidden="true">⌘</span>'+escapeHTML(lesson.summary??lesson.objective)+'</p><p><span aria-hidden="true">✓</span>'+escapeHTML(lesson.objective)+'</p></div><button type="button" class="button button-primary" data-lesson-complete '+(!lessonTryResolved&&!completed?"disabled":"")+'>'+(completed?"Lección completada":"Entendido")+'</button>'+(completed?'<button type="button" class="button button-secondary" data-lesson-next>Siguiente lección</button><button type="button" class="button button-secondary" data-go="lab">Practicar en el Laboratorio</button>':"")+'</section>';
  host.innerHTML='<div class="lesson-reader">'+
    '<nav class="lesson-breadcrumb" aria-label="Ubicación de la lección"><button type="button" data-learn-list>‹ Lista</button><span>›</span><span>Aprende</span><span aria-hidden="true">›</span><span>'+escapeHTML(route?.title??"Ruta de aprendizaje")+'</span><span aria-hidden="true">›</span><strong>Lección '+String(lesson.order).padStart(2,"0")+'</strong></nav>'+
    '<header class="lesson-detail-heading"><div><p class="eyebrow">LECCIÓN '+String(lesson.order).padStart(2,"0")+' / 17 · '+escapeHTML(lesson.duration.toUpperCase())+'</p><h3>'+escapeHTML(lesson.title)+'</h3><p>'+escapeHTML(lesson.objective)+'</p></div><span class="lesson-completion">'+(completed?"COMPLETADA":"EN CURSO")+'</span></header>'+
    '<div class="lesson-reading-progress" role="progressbar" aria-label="Progreso de lectura" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div>'+idea+concept+term+example+practice+summary+'</div>';
  if($("#lesson-data-input"))updateLessonData();
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
  const counts={
    all:exercises.length,
    basic:exercises.filter(item=>item.level==="basic").length,
    intermediate:exercises.filter(item=>item.level==="intermediate").length,
    advanced:exercises.filter(item=>item.level==="advanced").length,
    expert:exercises.filter(item=>item.level==="expert").length
  };
  const quickLevels=[
    ["all","Todos","Los 45 retos"],
    ["basic","Básico","Empieza por lo esencial"],
    ["intermediate","Intermedio","Combina conceptos"],
    ["advanced","Avanzado","Integra varios pasos"],
    ["expert","Experto","Retos de mayor alcance"]
  ];
  const shortcuts=$("#exercise-level-shortcuts");
  if(shortcuts){
    shortcuts.innerHTML=quickLevels.map(([key,label,description])=>
      '<button type="button" class="exercise-level-shortcut '+(exerciseLevel===key?"is-active":"")+'" data-exercise-level-shortcut="'+key+'" aria-pressed="'+String(exerciseLevel===key)+'">'+
      '<span class="exercise-level-shortcut-top"><strong>'+label+'</strong><b>'+counts[key]+'</b></span>'+
      '<small>'+description+'</small></button>'
    ).join("");
  }

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
  const count=$("#exercise-count");
  if(count)count.textContent=filtered.length+" de "+exercises.length+" ejercicios";

  host.innerHTML=visible.length?visible.map(item=>{
    const level=LEVELS[item.level];
    const labels=exerciseConceptLabels(item);
    const caseCount=item.methods.reduce((total,method)=>total+(method.tests?.length??0),0);
    return '<button type="button" class="exercise-card '+(selectedExercise?.id===item.id?"is-selected":"")+'" data-select-exercise="'+item.id+'" aria-pressed="'+String(selectedExercise?.id===item.id)+'">'+
      '<span class="exercise-card-top"><span class="exercise-number">'+String(item.id).padStart(2,"0")+'</span><span class="exercise-level '+level.className+'">'+level.label+'</span></span>'+
      (CLASS_EXERCISES.has(item.id)?'<span class="exercise-class-tag">De clase</span>':"")+
      '<strong>'+escapeHTML(item.title)+'</strong><small>'+escapeHTML(item.statement)+'</small>'+
      '<span class="exercise-card-concepts">'+labels.slice(0,4).map(label=>'<i>'+escapeHTML(label)+'</i>').join("")+'</span>'+
      '<span class="exercise-card-meta"><span>'+item.methods.length+' método(s)</span><span>'+caseCount+' casos de prueba</span></span>'+
      '<span class="exercise-card-footer">Abrir ficha del reto <span aria-hidden="true">↗</span></span></button>';
  }).join(""):'<div class="catalog-empty"><span class="catalog-empty-mark">⌕</span><strong>No encontramos ejercicios con esos filtros.</strong><p>Prueba con otro término, cambia la dificultad o elimina algún concepto.</p><button type="button" class="button button-secondary" id="exercise-empty-clear">Limpiar búsqueda y filtros</button></div>';

  let pagination=host.parentElement.querySelector(".exercise-pagination");
  if(!pagination){pagination=document.createElement("nav");pagination.className="exercise-pagination";pagination.setAttribute("aria-label","Páginas de ejercicios");host.after(pagination);}
  pagination.hidden=filtered.length<=PAGE_SIZE;
  pagination.innerHTML='<button type="button" data-page-prev '+(exercisePage===0?"disabled":"")+'>Anterior</button><span>Página '+(exercisePage+1)+' de '+pages+'</span><button type="button" data-page-next '+(exercisePage>=pages-1?"disabled":"")+'>Siguiente</button>';

  const active=$("#exercise-active-filters");
  if(active){
    const chips=[];
    if(query)chips.push("Búsqueda: "+exerciseQuery.trim());
    if(exerciseLevel!=="all")chips.push("Nivel: "+LEVELS[exerciseLevel].label);
    if(exerciseClassOnly)chips.push("De clase");
    if(selectedConcepts.size)chips.push(...[...selectedConcepts].map(label=>"Concepto: "+label));
    active.innerHTML=chips.map(label=>'<span class="exercise-active-filter">'+escapeHTML(label)+'</span>').join("");
    active.hidden=chips.length===0;
  }
  renderConceptFilters();
}
function renderExerciseDetail(){
  const host=$("#exercise-detail");if(!host)return;
  const item=selectedExercise;
  if(!item){
    host.innerHTML='<div class="detail-empty">'+
      '<span class="detail-empty-mark">45</span>'+
      '<p class="eyebrow">FICHA DEL RETO</p>'+
      '<h3>Selecciona un ejercicio.</h3>'+
      '<p>Verás qué debes resolver, qué conocimientos necesitas y qué condiciones debes respetar. El pseudocódigo seguirá oculto hasta que confirmes que ya intentaste resolverlo.</p>'+
      '<span class="exercise-detail-hint"><i aria-hidden="true">↖</i> Elige una tarjeta para abrir su ficha.</span></div>';
    return;
  }
  const level=LEVELS[item.level];
  const concepts=exerciseConceptLabels(item);
  const caseCount=item.methods.reduce((total,method)=>total+(method.tests?.length??0),0);
  host.innerHTML='<div class="exercise-detail-scroll">'+
    '<header class="exercise-detail-heading">'+
      '<div class="exercise-detail-kicker"><span class="exercise-number">'+String(item.id).padStart(2,"0")+'</span><span class="exercise-level '+level.className+'">'+level.label+'</span>'+(CLASS_EXERCISES.has(item.id)?'<span class="exercise-class-tag">De clase</span>':"")+'</div>'+
      '<p class="eyebrow exercise-detail-overline">FICHA DEL RETO · '+String(item.id).padStart(2,"0")+' / 45</p>'+
      '<h3>'+escapeHTML(item.title)+'</h3><p>'+escapeHTML(item.statement)+'</p>'+
    '</header>'+
    '<div class="exercise-detail-stats"><span><strong>'+item.methods.length+'</strong> método(s)</span><span><strong>'+caseCount+'</strong> casos de prueba</span></div>'+
    '<section class="exercise-spec"><p class="eyebrow">QUÉ VAS A RESOLVER</p><p>'+escapeHTML(item.purpose)+'</p></section>'+
    '<section class="exercise-spec"><p class="eyebrow">CONCEPTOS NECESARIOS</p><div class="concept-tags">'+concepts.map(tag=>'<span>'+escapeHTML(tag)+'</span>').join("")+'</div></section>'+
    '<section class="exercise-io-grid"><div><p class="eyebrow">DATOS DE ENTRADA</p><ul>'+item.inputs.map(value=>'<li>'+escapeHTML(value)+'</li>').join("")+'</ul></div><div><p class="eyebrow">RESULTADOS ESPERADOS</p><ul>'+item.outputs.map(value=>'<li>'+escapeHTML(value)+'</li>').join("")+'</ul></div></section>'+
    '<section class="exercise-spec"><p class="eyebrow">CONDICIONES Y RESTRICCIONES</p><ul>'+item.constraints.map(value=>'<li>'+escapeHTML(value)+'</li>').join("")+'</ul></section>'+
    '<section class="exercise-detail-approach"><p class="eyebrow">PISTA DE ENFOQUE</p><p>'+escapeHTML(item.analysis)+'</p></section>'+
    '<button type="button" class="button button-primary exercise-simulate" data-start-exercise>He intentado resolverlo · Abrir en Simulador <span aria-hidden="true">→</span></button>'+
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

function selectLesson(id){
  if(!lessons.some(lesson=>lesson.id===id))return;
  stopLessonPlayback();selectedLesson=id;lessonVisualStep=0;lessonScreenStep=0;lessonTryResolved=false;
  saveLearnProgress();lessonList();renderLesson();
  $("#learn-topic-space")?.classList.remove("is-list-open");
}
function bindContentEvents(){
  $("#learn-open-progress")?.addEventListener("click",()=>{renderLearnProgress();showLearnPanel("progress");});
  $("#learn-progress-page")?.addEventListener("click",event=>{if(event.target.closest("[data-learn-back]"))showLearnPanel("catalog");});
  $("#learn-topic-space")?.addEventListener("click",event=>{
    if(event.target.closest("[data-learn-back]")){showLearnPanel("catalog");return;}
    const card=event.target.closest("[data-topic-open]");
    if(card){const topic=temaPorId(card.dataset.topicOpen);if(topic?.estado==="disponible")openTheme(topic.id);return;}
    const tab=event.target.closest("[data-topic-tab]");
    if(tab){topicTab=tab.dataset.topicTab;saveLearnProgress();renderTopicSpace();}
  });
  $("#learn-catalog-bands")?.addEventListener("click",event=>{
    const card=event.target.closest("[data-topic-open]");
    if(card){const topic=temaPorId(card.dataset.topicOpen);if(topic?.estado==="disponible")openTheme(topic.id);}
  });
  $("#learn-difficulty")?.addEventListener("change",event=>{learnDifficulty=event.target.value;renderLearnCatalog();});
  $("#learn-competence-filters")?.addEventListener("click",event=>{const chip=event.target.closest("[data-learn-competence]");if(!chip)return;learnCompetence=chip.dataset.learnCompetence;renderLearnCatalog();});
  $("#learn-all-competencies")?.addEventListener("click",()=>{learnCompetence="todas";learnDifficulty="todas";const select=$("#learn-difficulty");if(select)select.value="todas";renderLearnCatalog();});
  $("#learn-topic-select")?.addEventListener("change",event=>{
    const theme=temaPorId(event.target.value);
    if(theme?.estado==="disponible")openTheme(theme.id);
    else {showLearnPanel("catalog");renderLearnCatalog();}
  });
  document.addEventListener("traza:space-change",event=>{
    const space=event.detail?.space;
    if(space==="learn"){
      if(selectedTheme){showLearnPanel("topic");renderTopicSpace();lessonList();renderLesson();}
      else showLearnPanel("catalog");
      return;
    }
    const tab={exercises:"ejercicios",simulator:"simulador",lab:"laboratorio"}[space];
    if(tab&&selectedTheme){topicTab=tab;saveLearnProgress();renderTopicSpace();}
  });
  document.addEventListener("traza:actividad-laboratorio",()=>{recordLearnActivity();saveLearnProgress();});
  $("#lesson-catalog")?.addEventListener("click",event=>{
    const button=event.target.closest("[data-lesson-id]");
    if(!button)return;
    selectLesson(button.dataset.lessonId);
  });
  $("#lesson-detail")?.addEventListener("click",event=>{
    if(event.target.closest("[data-learn-list]")){$("#learn-topic-space")?.classList.add("is-list-open");return;}
    if(event.target.closest("[data-skip-practice]")){lessonTryResolved=true;const feedback=$("#lesson-feedback");if(feedback)feedback.textContent="Práctica saltada. Puedes seguir al resumen.";const done=$("[data-lesson-complete]");if(done)done.disabled=false;return;}
    if(event.target.closest("[data-prerequisite]")){const name=event.target.closest("[data-prerequisite]").dataset.prerequisite;const match=lessons.find(item=>item.title.toLocaleLowerCase("es").includes(name.toLocaleLowerCase("es")));if(match)selectLesson(match.id);return;}
    if(event.target.closest("[data-lesson-next]")){const index=lessons.findIndex(item=>item.id===selectedLesson);if(index<lessons.length-1)selectLesson(lessons[index+1].id);return;}
    if(event.target.closest("[data-lesson-complete]")){if(lessonTryResolved||learnProgress.completed.includes(selectedLesson))completeLesson();return;}
  });
  $("#lesson-detail")?.addEventListener("input",event=>{
    if(event.target.id==="lesson-data-input")updateLessonData();
  });
  $("#lesson-detail")?.addEventListener("click",event=>{
    if(event.target.closest("[data-visual-next]")){
      stopLessonPlayback();
      const lesson=lessons.find(item=>item.id===selectedLesson)??lessons[0];
      const execution=runLesson(lesson),events=execution.ok?relevantLessonEvents(lesson,execution):[];
      lessonVisualStep=Math.min(Math.max(0,events.length-1),lessonVisualStep+1);lessonClock?.seek(lessonVisualStep*1300);renderLesson();
    }
    if(event.target.closest("[data-visual-prev]")){
      stopLessonPlayback();lessonVisualStep=Math.max(0,lessonVisualStep-1);lessonClock?.seek(lessonVisualStep*1300);renderLesson();
    }
    if(event.target.closest("[data-visual-reset]")){
      stopLessonPlayback();lessonVisualStep=0;lessonClock?.restart();renderLesson();
    }
    if(event.target.closest("[data-visual-play]")){
      if(lessonPlaying){stopLessonPlayback();renderLesson();}
      else startLessonPlayback();
    }
    if(event.target.closest("[data-run-mini-program]"))updateLessonData();
    const answer=event.target.closest("[data-check-option]");
    if(answer){
      const lesson=lessons.find(item=>item.id===selectedLesson);
      const chosen=Number(answer.dataset.checkOption);
      $$(".lesson-option",$("#lesson-detail")).forEach(button=>{
        const index=Number(button.dataset.checkOption);
        button.classList.toggle("is-correct",index===lesson.check.answer);
        button.classList.toggle("is-wrong",index===chosen&&chosen!==lesson.check.answer);
        button.disabled=true;
      });
      const feedback=$("#lesson-feedback");
      feedback.textContent=chosen===lesson.check.answer?"Correcto. "+lesson.check.why:"Revisa la pista. "+lesson.check.why;
      feedback.classList.toggle("is-correct",chosen===lesson.check.answer);
      feedback.classList.toggle("is-wrong",chosen!==lesson.check.answer);
      lessonTryResolved=true;
      const done=$("[data-lesson-complete]");if(done)done.disabled=false;
    }
  });
  $("#lesson-detail")?.addEventListener("change",event=>{
    if(event.target.matches("[data-visual-speed]"))lessonClock?.setSpeed(Number(event.target.value));
  });
  $("#lesson-detail")?.addEventListener("keydown",event=>{
    if(!event.target.closest("[data-visual-player]"))return;
    if(event.code==="Space"){event.preventDefault();if(lessonPlaying){stopLessonPlayback();renderLesson();}else startLessonPlayback();}
    else if(event.key==="ArrowRight"){event.preventDefault();$("[data-visual-next]",event.currentTarget)?.click();}
    else if(event.key==="ArrowLeft"){event.preventDefault();$("[data-visual-prev]",event.currentTarget)?.click();}
    else if(event.key.toLowerCase()==="r"){event.preventDefault();$("[data-visual-reset]",event.currentTarget)?.click();}
  });
  window.addEventListener("scroll",()=>{
    const reader=$(".lesson-reader"),bar=$(".lesson-reading-progress",reader??undefined);if(!reader||!bar)return;
    const top=reader.getBoundingClientRect().top+window.scrollY;
    const range=Math.max(1,reader.offsetHeight-window.innerHeight);
    const value=Math.max(0,Math.min(100,Math.round((window.scrollY-top)/range*100)));
    bar.setAttribute("aria-valuenow",String(value));$("span",bar).style.width=value+"%";
  },{passive:true});
  $("#exercise-search")?.addEventListener("input",event=>{exerciseQuery=event.target.value;exercisePage=0;renderExerciseCards();});
  $("#exercise-level")?.addEventListener("change",event=>{exerciseLevel=event.target.value;exercisePage=0;renderExerciseCards();});
  $("#exercise-class-only")?.addEventListener("change",event=>{exerciseClassOnly=event.target.checked;exercisePage=0;renderExerciseCards();});
  $("#exercise-concepts")?.addEventListener("click",event=>{
    const chip=event.target.closest("[data-concept-filter]");if(!chip)return;
    const label=chip.dataset.conceptFilter;
    selectedConcepts.has(label)?selectedConcepts.delete(label):selectedConcepts.add(label);
    exercisePage=0;renderExerciseCards();
  });
  $("#view-exercises")?.addEventListener("click",event=>{
    const quickLevel=event.target.closest("[data-exercise-level-shortcut]");
    if(quickLevel){
      exerciseLevel=quickLevel.dataset.exerciseLevelShortcut;
      if($("#exercise-level"))$("#exercise-level").value=exerciseLevel;
      exercisePage=0;renderExerciseCards();return;
    }
    if(event.target.closest("#exercise-empty-clear")||event.target.closest("#exercise-filters-clear")){
      exerciseQuery="";exerciseLevel="all";exerciseClassOnly=false;selectedConcepts.clear();conceptMatchMode="all";exercisePage=0;
      if($("#exercise-search"))$("#exercise-search").value="";
      if($("#exercise-level"))$("#exercise-level").value="all";
      if($("#exercise-class-only"))$("#exercise-class-only").checked=false;
      renderExerciseCards();return;
    }
    const mode=event.target.closest("[data-concept-mode]");
    if(mode){conceptMatchMode=mode.dataset.conceptMode==="any"?"any":"all";exercisePage=0;renderExerciseCards();return;}
    if(event.target.closest("[data-page-prev]")){exercisePage=Math.max(0,exercisePage-1);renderExerciseCards();}
    if(event.target.closest("[data-page-next]")){exercisePage++;renderExerciseCards();}
  });
  $("#exercise-grid")?.addEventListener("click",event=>{
    const card=event.target.closest("[data-select-exercise]");
    if(card)selectExercise(card.dataset.selectExercise);
  });
  $("#exercise-detail")?.addEventListener("click",event=>{
    if(event.target.closest("[data-start-exercise]"))openExerciseTryModal();
  });
  $("#exercise-try-back")?.addEventListener("click",closeExerciseTryModal);
  $("#exercise-try-confirm")?.addEventListener("click",confirmExerciseInSimulator);
  $("#exercise-try-modal")?.addEventListener("click",event=>{
    if(event.target.id==="exercise-try-modal")closeExerciseTryModal();
  });
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&!$("#exercise-try-modal")?.hidden)closeExerciseTryModal();
  });
}

export function initContentViews(){
  selectedLesson=learnProgress.current;lessonScreenStep=learnProgress.screen;
  const count=$("#view-learn .lesson-catalog-panel h3");if(count)count.textContent=lessons.length+" lecciones";
  const mark=$("#view-learn .detail-empty-mark");if(mark)mark.textContent=String(lessons.length);
  lessonList();renderLesson();renderLearnCatalog();renderLearnProgress();
  const streak=$("#learn-streak");if(streak)streak.textContent="Racha: "+currentStreak(learnProgress.activityDays||[])+" días";
  if(selectedTheme){showLearnPanel("topic");renderTopicSpace();}else showLearnPanel("catalog");
  renderConceptFilters();renderExerciseCards();renderExerciseDetail();
  bindContentEvents();
}
