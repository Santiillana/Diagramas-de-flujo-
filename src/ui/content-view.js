import { lessons } from "../content/lessons.js";
import { exercises } from "../content/exercises.js";
import { escapeHTML } from "./escape.js";
import { renderLessonLiveMarkup, renderLessonLiveState, handleLessonLiveClick, resetLessonLiveSession } from "./lesson-live.js";
import { lessonGuideTopics } from "../content/symbol-guide.js";
import { executePseudocode } from "../core/interpreter.js";

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const LEVELS = {
  basic:{label:"Básico",className:"level-basic"},
  intermediate:{label:"Intermedio",className:"level-intermediate"},
  advanced:{label:"Avanzado",className:"level-advanced"}
};
let selectedLesson = lessons[0].id;
let lessonVisualStep = 0;
let selectedExercise = null;
let selectedMethod = 0;
let exerciseRevealed = false;
let exerciseHintStep = 0;
let exerciseQuery = "";
let exerciseLevel = "all";
let projectorActive = false;
const EXERCISE_PROGRESS_KEY = "traza-exercise-progress-v1";
let exerciseProgress = readExerciseProgress();

function lessonList(){
  const host=$("#lesson-catalog");
  if(!host)return;
  host.innerHTML=lessons.map((lesson,index)=>`
    <button class="lesson-list-item ${lesson.id===selectedLesson?"is-selected":""}" type="button"
      data-lesson-id="${escapeHTML(lesson.id)}" aria-current="${lesson.id===selectedLesson?"true":"false"}">
      <span class="lesson-list-number">${String(index+1).padStart(2,"0")}</span>
      <span class="lesson-list-copy"><strong>${escapeHTML(lesson.title)}</strong><small>${escapeHTML(lesson.duration)}</small></span>
      <span class="lesson-list-arrow" aria-hidden="true">›</span>
    </button>`).join("");
}

function visualMarkup(lesson){
  const visual=lesson.visual;
  const index=Math.min(lessonVisualStep,visual.steps.length-1);
  const kind=visual.kind;
  const symbols=kind.includes("decision")?["Pregunta","V · Verdadero","F · Falso"]:
    kind==="while"?["Condición","Cuerpo","Retorno"]:
    kind==="do-while"?["Cuerpo","Condición","Repetir / salir"]:
    kind==="for"?["Preparación","Condición","Avance"]:
    kind==="nested"?["Ciclo exterior","Ciclo interior","Siguiente vuelta"]:
    kind==="variable"?["Nombre","Valor anterior","Valor nuevo"]:
    kind==="counter"?["Inicializar","Actualizar","Acumular"]:
    kind==="validation"?["Leer","Comprobar","Aceptar / repetir"]:
    kind==="calculation"?["Operación 1","Operación 2","Resultado"]:
    ["Inicio","Proceso","Fin"];
  return `
    <section class="lesson-visual" aria-label="Visualización de ${escapeHTML(lesson.title)}">
      <div class="lesson-visual-head"><div><p class="eyebrow">VISUALIZACIÓN INTERACTIVA</p><strong>${escapeHTML(visual.caption)}</strong></div>
        <span class="visual-step-count">${index+1} / ${visual.steps.length}</span></div>
      <div class="visual-track visual-kind-${escapeHTML(kind)}" data-visual-step="${index}">
        ${visual.steps.map((step,i)=>`
          <div class="visual-stage-node ${i===index?"is-current":i<index?"is-complete":""}" data-visual-node="${i}">
            <span class="visual-node-index">${i+1}</span><strong>${escapeHTML(symbols[i]??step[0])}</strong>
            <small>${escapeHTML(step[0])}</small>
          </div>${i<visual.steps.length-1?'<span class="visual-track-arrow" aria-hidden="true">→</span>':""}`).join("")}
      </div>
      <div class="visual-explanation" aria-live="polite"><span>PASO ${index+1}</span><p>${escapeHTML(visual.steps[index][1])}</p></div>
      <div class="visual-controls"><button type="button" class="button button-secondary" data-visual-reset>Reiniciar</button>
        <button type="button" class="button button-primary" data-visual-next ${index>=visual.steps.length-1?"disabled":""}>Siguiente paso <span aria-hidden="true">→</span></button></div>
    </section>`;
}

function renderLesson(){
  const lesson=lessons.find(x=>x.id===selectedLesson)??lessons[0];
  const host=$("#lesson-detail");
  if(!host)return;
  host.innerHTML=`
    <header class="lesson-detail-heading"><div><p class="eyebrow">LECCIÓN ${String(lesson.order).padStart(2,"0")} / 14 · ${escapeHTML(lesson.duration.toUpperCase())}</p>
      <h3>${escapeHTML(lesson.title)}</h3><p>${escapeHTML(lesson.objective)}</p></div><div class="lesson-detail-actions"><span class="lesson-completion" aria-label="Lección de la ruta">TRAZA · APRENDE</span><button class="symbol-guide-open" type="button" data-open-symbol-guide data-guide-topic="${escapeHTML(lessonGuideTopics[lesson.id]??"terminal")}"><span aria-hidden="true">?</span>Ayuda de esta lección</button></div></header>
    <div class="lesson-explanation-grid">
      <section class="lesson-explanation"><span class="explanation-label">01 · INTUITIVA</span><p>${escapeHTML(lesson.intuitive)}</p></section>
      <section class="lesson-explanation lesson-technical"><span class="explanation-label">02 · TÉCNICA</span><p>${escapeHTML(lesson.technical)}</p></section>
    </div>
    ${visualMarkup(lesson)}
    <section class="lesson-example"><div class="lesson-section-heading"><div><p class="eyebrow">EJEMPLO GUIADO</p><h4>${escapeHTML(lesson.example.title)}</h4></div><span class="panel-index">03</span></div>
      <pre class="lesson-code"><code>${escapeHTML(lesson.example.code)}</code></pre><p>${escapeHTML(lesson.example.explanation)}</p>
    </section>
    ${renderLessonLiveMarkup(lesson)}
    <section class="lesson-check">
      <div class="lesson-section-heading"><div><p class="eyebrow">COMPRUEBA TU COMPRENSIÓN</p><h4>${escapeHTML(lesson.check.question)}</h4></div><span class="panel-index">05</span></div>
      <div class="lesson-options">${lesson.check.options.map((option,i)=>`<button type="button" class="lesson-option" data-check-option="${i}"><span>${String.fromCharCode(65+i)}</span>${escapeHTML(option)}</button>`).join("")}</div>
      <p class="lesson-feedback" id="lesson-feedback" role="status"></p>
    </section>`;
  renderLessonLiveState(lesson.id,host);
}


function readExerciseProgress(){
  if(typeof window==="undefined")return {};
  try{
    const stored=JSON.parse(window.localStorage.getItem(EXERCISE_PROGRESS_KEY)||"{}");
    return stored&&typeof stored==="object"?stored:{};
  }catch{return {};}
}
function persistExerciseProgress(){
  try{window.localStorage.setItem(EXERCISE_PROGRESS_KEY,JSON.stringify(exerciseProgress));}catch{}
}
function markExerciseProgress(id,status){
  const previous=exerciseProgress[id]??{attempts:0};
  exerciseProgress[id]={
    ...previous,
    status,
    attempts:(previous.attempts??0)+1,
    updatedAt:Date.now()
  };
  persistExerciseProgress();
  renderExerciseCards();
}
function exerciseProgressStatus(id){
  return exerciseProgress[id]?.status??"not-started";
}
function renderExerciseProgressSummary(){
  const host=$("#exercise-progress-summary");
  if(!host)return;
  const levels=["basic","intermediate","advanced"];
  const totalVerified=exercises.filter(item=>exerciseProgressStatus(item.id)==="verified").length;
  const totalStarted=exercises.filter(item=>exerciseProgressStatus(item.id)==="in-progress").length;
  const totalHints=Object.values(exerciseProgress).reduce((sum,item)=>sum+(item.hintsUsed??0),0);
  const totalErrors=Object.values(exerciseProgress).reduce((sum,item)=>sum+(item.wrongPredictions??0),0);
  host.innerHTML=`
    <div class="exercise-progress-overall"><strong>${totalVerified} de 40 retos verificados</strong><span>${totalStarted} en práctica · ${totalHints} pistas usadas · ${totalErrors} errores por revisar · guardado en este navegador</span></div>
    <div class="exercise-progress-levels">${levels.map(level=>{
      const group=exercises.filter(item=>item.level===level);
      const verified=group.filter(item=>exerciseProgressStatus(item.id)==="verified").length;
      const started=group.filter(item=>exerciseProgressStatus(item.id)==="in-progress").length;
      return '<span><b>'+LEVELS[level].label+'</b><small>'+verified+'/'+group.length+' verificados · '+started+' en práctica</small></span>';
    }).join("")}</div>`;
}
function recordExerciseHint(id){
  const previous=exerciseProgress[id]??{attempts:0};
  exerciseProgress[id]={...previous,hintsUsed:(previous.hintsUsed??0)+1,updatedAt:Date.now()};
  persistExerciseProgress();
  renderExerciseProgressSummary();
}
function recordExercisePredictionError(id,diagnostic){
  const previous=exerciseProgress[id]??{attempts:0};
  exerciseProgress[id]={
    ...previous,
    wrongPredictions:(previous.wrongPredictions??0)+1,
    lastDiagnostic:diagnostic,
    updatedAt:Date.now()
  };
  persistExerciseProgress();
  renderExerciseProgressSummary();
}
function parseInputValues(raw){
  const text=String(raw??"").trim();
  if(!text)return [];
  return text.split(/[;,]/).map(token=>{
    const item=token.trim();
    if(!item)return "";
    const number=Number(item.replace(",","."));
    return Number.isFinite(number)?number:item.replace(/^"(.*)"$/,"$1");
  });
}
function parsePredictionValues(raw){
  const text=String(raw??"").trim();
  if(!text)return null;
  try{
    const parsed=JSON.parse(text);
    return Array.isArray(parsed)?parsed:[parsed];
  }catch{
    return text.split(/[;,]/).map(token=>{
      const item=token.trim();
      const number=Number(item);
      return item!==""&&Number.isFinite(number)?number:item.replace(/^"(.*)"$/,"$1");
    });
  }
}
function outputsMatch(actual,expected){
  if(!Array.isArray(actual)||!Array.isArray(expected)||actual.length!==expected.length)return false;
  return actual.every((value,index)=>{
    const target=expected[index];
    if(typeof value==="number"&&typeof target==="number")return Math.abs(value-target)<=1e-9;
    return Object.is(value,target);
  });
}
function safeExecuteMethod(method,inputs){
  try{
    const execution=executePseudocode(method.pseudocode,inputs);
    return {ok:Boolean(execution.ok),outputs:execution.outputs??[],error:execution.error?.message??null};
  }catch(error){
    return {ok:false,outputs:[],error:error.message};
  }
}
function buildExerciseShareUrl(item,methodIndex){
  const url=new URL(window.location.href);
  url.search="";
  url.hash="";
  url.searchParams.set("reto",String(item.id));
  url.searchParams.set("metodo",String(methodIndex));
  return url.toString();
}
async function handleExerciseShare(action){
  if(!selectedExercise)return;
  const field=$("#exercise-detail [data-exercise-share-url]");
  const feedback=$("#exercise-detail [data-share-feedback]");
  const url=buildExerciseShareUrl(selectedExercise,selectedMethod);
  if(field){field.value=url;field.hidden=false;}
  const title="Reto "+selectedExercise.id+": "+selectedExercise.title;
  if(action==="share"&&typeof navigator.share==="function"){
    try{
      await navigator.share({title,text:"Practica este ejercicio de diagramas de flujo en Traza.",url});
      if(feedback)feedback.textContent="Enlace compartido.";
      return;
    }catch(error){
      if(error?.name==="AbortError")return;
      // Si el navegador cancela o no ofrece compartir, se intenta copiar el enlace.
    }
  }
  try{
    if(navigator.clipboard?.writeText){
      await navigator.clipboard.writeText(url);
      if(feedback)feedback.textContent="Enlace copiado. Abre el vínculo para volver a este reto y método.";
      return;
    }
  }catch{}
  field?.focus();
  field?.select();
  if(feedback)feedback.textContent="El enlace está listo y seleccionado para copiarlo manualmente.";
}
function setProjectorMode(active){
  projectorActive=Boolean(active);
  document.body.classList.toggle("exercise-projector-mode",projectorActive);
  const button=$("#exercise-detail [data-projector-toggle]");
  if(button){
    button.setAttribute("aria-pressed",String(projectorActive));
    button.textContent=projectorActive?"Salir del proyector":"Modo proyector";
  }
  const exit=$("#exercise-detail [data-projector-exit]");
  if(exit)exit.hidden=!projectorActive;
  if(projectorActive&&!document.fullscreenElement&&document.documentElement.requestFullscreen){
    document.documentElement.requestFullscreen({navigationUI:"hide"}).catch(()=>{});
  }else if(!projectorActive&&document.fullscreenElement){
    document.exitFullscreen().catch(()=>{});
  }
}
function updateProjectorAfterFullscreen(){
  if(projectorActive&&!document.fullscreenElement){
    projectorActive=false;
    document.body.classList.remove("exercise-projector-mode");
    const button=$("#exercise-detail [data-projector-toggle]");
    button?.setAttribute("aria-pressed","false");
    if(button)button.textContent="Modo proyector";
    const exit=$("#exercise-detail [data-projector-exit]");
    if(exit)exit.hidden=true;
  }
}
function runExerciseTestSuite(item){
  const results=[];
  for(const method of item.methods){
    for(const scenario of method.tests){
      const execution=safeExecuteMethod(method,scenario.input);
      const passed=execution.ok&&outputsMatch(execution.outputs,scenario.expected);
      results.push({method:method.name,scenario:scenario.name,passed,expected:scenario.expected,actual:execution.outputs,error:execution.error});
    }
  }
  return results;
}
function renderExerciseTestSuite(results){
  const host=$("#exercise-detail [data-suite-feedback]");
  if(!host)return;
  const passed=results.filter(result=>result.passed).length;
  const ok=passed===results.length;
  host.innerHTML=`
    <p class="exercise-suite-summary ${ok?"is-correct":"is-wrong"}">${passed} de ${results.length} pruebas superadas.</p>
    <ul class="exercise-suite-results">${results.map(result=>'<li class="'+(result.passed?"is-correct":"is-wrong")+'"><span>'+(result.passed?"✓":"!")+'</span><div><b>'+escapeHTML(result.method)+" · "+escapeHTML(result.scenario)+'</b><small>Esperado: '+escapeHTML(JSON.stringify(result.expected))+" · obtenido: "+escapeHTML(JSON.stringify(result.actual))+(result.error?" · "+escapeHTML(result.error):"")+'</small></div></li>').join("")}</ul>`;
}
function runCustomExercisePrediction(){
  if(!selectedExercise)return;
  const method=selectedExercise.methods[selectedMethod];
  const input=parseInputValues($("#exercise-detail [data-solution-input]")?.value??"");
  const predicted=parsePredictionValues($("#exercise-detail [data-solution-prediction]")?.value??"");
  const execution=safeExecuteMethod(method,input);
  const feedback=$("#exercise-detail [data-solution-feedback]");
  if(!feedback)return;
  markExerciseProgress(selectedExercise.id,"in-progress");
  feedback.classList.remove("is-correct","is-wrong");
  if(!execution.ok){
    feedback.textContent="La ejecución no pudo completarse: "+(execution.error??"error desconocido")+". Revisa las entradas y el método.";
    feedback.classList.add("is-wrong");
    return;
  }
  const reference=method.tests.find(scenario=>outputsMatch(input,scenario.input));
  const matchesPrediction=predicted===null?null:outputsMatch(predicted,execution.outputs);
  const matchesReference=reference?outputsMatch(execution.outputs,reference.expected):null;
  const actualText="Salida real del intérprete: "+JSON.stringify(execution.outputs)+".";
  if(predicted===null){
    feedback.textContent=actualText+" Escribe tu predicción antes de ejecutar para diagnosticar tu razonamiento.";
    return;
  }
  if(matchesReference===true&&matchesPrediction===true){
    feedback.textContent="Tu predicción coincide con el intérprete y con la prueba de referencia. "+actualText;
    feedback.classList.add("is-correct");
  }else if(matchesReference===true){
    const diagnostic=selectedExercise.errors?.[0]??"Compara el orden de las operaciones y el valor de las variables.";
    recordExercisePredictionError(selectedExercise.id,diagnostic);
    feedback.textContent="El método coincide con la salida de referencia, pero tu predicción no coincide. Posible confusión: "+diagnostic+" "+actualText;
    feedback.classList.add("is-wrong");
  }else if(matchesReference===false&&matchesPrediction===true){
    feedback.textContent="Predijiste correctamente lo que hace este método, pero el resultado no coincide con la referencia. El método necesita revisión. "+actualText;
    feedback.classList.add("is-wrong");
  }else if(matchesReference===false){
    const diagnostic=selectedExercise.errors?.[0]??"Revisa las condiciones y los límites del ciclo.";
    recordExercisePredictionError(selectedExercise.id,diagnostic);
    feedback.textContent="La predicción y la ejecución difieren de la salida de referencia. Posible error frecuente: "+diagnostic+" "+actualText;
    feedback.classList.add("is-wrong");
  }else if(matchesPrediction){
    feedback.textContent="Tu predicción coincide con la ejecución real. Para una comprobación independiente, ejecuta todos los casos definidos. "+actualText;
    feedback.classList.add("is-correct");
  }else{
    feedback.textContent="Tu predicción no coincide con la ejecución real. Observa el valor de cada variable y vuelve a intentarlo. "+actualText;
    feedback.classList.add("is-wrong");
  }
}
function runExerciseVerification(){
  if(!selectedExercise)return;
  const results=runExerciseTestSuite(selectedExercise);
  renderExerciseTestSuite(results);
  markExerciseProgress(selectedExercise.id,results.length>0&&results.every(result=>result.passed)?"verified":"in-progress");
}
function restoreSharedExercise(){
  if(typeof window==="undefined")return false;
  const params=new URLSearchParams(window.location.search);
  const id=Number(params.get("reto"));
  const item=exercises.find(candidate=>candidate.id===id);
  if(!item)return false;
  selectedExercise=item;
  const requestedMethod=Number(params.get("metodo"));
  selectedMethod=Number.isInteger(requestedMethod)&&requestedMethod>=0&&requestedMethod<item.methods.length?requestedMethod:0;
  exerciseRevealed=false;
  exerciseHintStep=0;
  return true;
}
function renderExerciseCards(){
  const host=$("#exercise-grid");
  if(!host)return;
  const query=exerciseQuery.trim().toLocaleLowerCase("es");
  const filtered=exercises.filter(item=>{
    const matchesLevel=exerciseLevel==="all"||item.level===exerciseLevel;
    const searchable=[item.title,item.statement,item.purpose,...item.concepts].join(" ").toLocaleLowerCase("es");
    return matchesLevel&&(!query||searchable.includes(query)||String(item.id)===query);
  });
  $("#exercise-count").textContent=filtered.length+" de 40 ejercicios";
  renderExerciseProgressSummary();
  host.innerHTML=filtered.length?filtered.map(item=>{
    const level=LEVELS[item.level];
    const status=exerciseProgressStatus(item.id);
    const statusLabel=status==="verified"?"Verificado":status==="in-progress"?"En práctica":"Sin iniciar";
    return `
      <button type="button" class="exercise-card ${selectedExercise?.id===item.id?"is-selected":""}" data-select-exercise="${item.id}">
        <span class="exercise-card-top"><span class="exercise-number">${String(item.id).padStart(2,"0")}</span><span class="exercise-level ${level.className}">${level.label}</span></span>
        <strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.concepts.slice(0,3).join(" · "))}</small>
        <span class="exercise-card-footer"><span class="exercise-progress-status is-${status}">${statusLabel}</span><span>${item.methods.length} ${item.methods.length===1?"método":"métodos"} ↗</span></span>
      </button>`;
  }).join(""):'<div class="catalog-empty">No hay ejercicios que coincidan con esa búsqueda.</div>';
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
  const shareUrl=buildExerciseShareUrl(item,selectedMethod);
  const suiteSize=item.methods.reduce((sum,current)=>sum+current.tests.length,0);
  host.innerHTML=`
    <div class="exercise-detail-scroll">
      <header class="exercise-detail-heading"><div class="exercise-detail-kicker"><span class="exercise-number">${String(item.id).padStart(2,"0")}</span><span class="exercise-level ${level.className}">${level.label}</span></div>
        <h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.statement)}</p></header>
      <div class="exercise-action-bar">
        <button type="button" class="button button-secondary" data-share-action="copy">Copiar enlace</button>
        <button type="button" class="button button-secondary" data-share-action="share">Compartir reto</button>
        <button type="button" class="button button-primary" data-projector-toggle aria-pressed="${projectorActive}">${projectorActive?"Salir del proyector":"Modo proyector"}</button>
      </div>
      <div class="exercise-share-panel">
        <label><span>ENLACE DIRECTO AL RETO Y MÉTODO</span><input type="url" data-exercise-share-url readonly value="${escapeHTML(shareUrl)}" aria-label="Enlace para compartir este ejercicio"></label>
        <p data-share-feedback role="status">El enlace abre este ejercicio y el método seleccionado, sin compartir tus respuestas guardadas.</p>
      </div>
      <button type="button" class="exercise-projector-exit" data-projector-exit ${projectorActive?"":"hidden"}>Salir del modo proyector ✕</button>
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
        <p class="method-approach"><b>Enfoque de este método:</b> ${escapeHTML(method.approach??method.note??item.analysis)}</p>
        ${item.comparacionMetodos?.length>1?`
          <section class="method-comparison" aria-label="Comparación de métodos">
            <p class="eyebrow">COMPARA LAS ALTERNATIVAS</p>
            <p>Ambos métodos deben respetar el mismo enunciado, entradas, restricciones y resultados. La diferencia está en cómo organizan el proceso.</p>
            <div class="method-comparison-list">
              ${item.comparacionMetodos.map((alternative,index)=>`<article><b>${index+1}. ${escapeHTML(alternative.nombre)}</b><p>${escapeHTML(alternative.enfoque)}</p></article>`).join("")}
            </div>
          </section>`: ""}
        <section class="exercise-reasoning" aria-label="Razonamiento del problema">
          <div class="exercise-section-heading"><div><p class="eyebrow">RAZONAMIENTO · ANTES Y DESPUÉS DE PROGRAMAR</p><h4>Cómo pensar la solución</h4></div></div>
          <div class="exercise-reasoning-grid">
            <article><span>01 · COMPRENDER</span><p>${escapeHTML(item.razonamiento.comprender)}</p></article>
            <article><span>02 · IDENTIFICAR DATOS</span><p>${escapeHTML(item.razonamiento.datos)}</p></article>
            <article><span>03 · PLANIFICAR</span><p>${escapeHTML(item.razonamiento.estrategia)}</p></article>
            <article><span>04 · COMPROBAR</span><p>${escapeHTML(item.razonamiento.comprobar)}</p></article>
          </div>
        </section>
        <div class="exercise-example-case"><span class="eyebrow">DATOS DE EJEMPLO</span><code>${escapeHTML(method.sample.join(", ")||"Sin datos de entrada")}</code>
          <span class="eyebrow">PRIMER RESULTADO ESPERADO</span><code>${escapeHTML(JSON.stringify(method.tests[0].expected))}</code></div>
        <details class="exercise-test-cases"><summary>Ver casos de prueba (${method.tests.length})</summary><ul>${method.tests.map(t=>`<li><b>${escapeHTML(t.name)}</b><span>Entrada: ${escapeHTML(JSON.stringify(t.input))}</span><span>Salida: ${escapeHTML(JSON.stringify(t.expected))}</span></li>`).join("")}</ul></details>
        <section class="exercise-test-runner" aria-label="Prueba y diagnóstico de la solución">
          <div class="exercise-section-heading"><div><p class="eyebrow">PRUEBA DE SOLUCIÓN</p><h4>Ejecuta con tus propios datos</h4></div><span class="panel-index">TEST</span></div>
          <p>El pseudocódigo se ejecuta con el intérprete de Traza. Puedes contrastar una predicción o correr todos los casos definidos para todos los métodos.</p>
          <div class="exercise-test-inputs">
            <label>Entradas de prueba<input type="text" data-solution-input value="${escapeHTML(method.sample.join(", "))}" aria-label="Entradas para probar la solución"></label>
            <label>Tu predicción de salida<input type="text" data-solution-prediction placeholder="Ej. 13 o 13, 14" aria-label="Predicción de salida"></label>
          </div>
          <button type="button" class="button button-primary" data-run-solution>Ejecutar y diagnosticar predicción</button>
          <p class="exercise-solution-feedback" data-solution-feedback role="status">Escribe primero lo que esperas obtener. Después, compara tu predicción con la ejecución.</p>
          <div class="exercise-suite-toolbar"><span>Casos definidos: ${suiteSize} entre ${item.methods.length} ${item.methods.length===1?"método":"métodos"}</span><button type="button" class="button button-secondary" data-run-suite>Ejecutar todas las pruebas</button></div>
          <div class="exercise-suite-feedback" data-suite-feedback role="status"></div>
        </section>
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
  gate.innerHTML='<p class="eyebrow">MODO RETO · ANTES DE VER LA SOLUCIÓN</p><h4>Piensa entradas, proceso y salidas</h4><p>Registra tu análisis. Puedes pedir una pista o revelar la explicación cuando estés preparado.</p><div class="exercise-attempt-fields"><label>Entradas<textarea data-attempt-field="inputs" rows="2" placeholder="¿Qué datos se necesitan?"></textarea></label><label>Proceso<textarea data-attempt-field="process" rows="2" placeholder="¿Cómo se transforman los datos?"></textarea></label><label>Salidas<textarea data-attempt-field="outputs" rows="2" placeholder="¿Qué debe mostrarse?"></textarea></label></div><div class="exercise-gate-actions"><button type="button" class="button button-secondary" data-save-attempt>Guardar análisis</button><button type="button" class="text-button" data-exercise-hint>Ver pista 1 de 3</button><button type="button" class="button button-primary" data-reveal-solution>Revelar explicación</button></div><p class="exercise-gate-feedback" data-gate-feedback role="status"></p>';
  scroll.prepend(gate);
  let saved={};
  try{saved=JSON.parse(localStorage.getItem("traza-exercise-attempt-"+item.id)||"{}");}catch{}
  $$('[data-attempt-field]',gate).forEach(field=>{field.value=saved[field.dataset.attemptField]||"";});
  const hiddenSelectors=[".exercise-methods",".exercise-errors",".exercise-simulate",".exercise-reasoning",".exercise-detail-scroll > .exercise-spec:nth-of-type(2)"];
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
    resetLessonLiveSession();
    selectedLesson=button.dataset.lessonId;
    lessonVisualStep=0;
    lessonList();renderLesson();
  });
  $("#lesson-detail")?.addEventListener("click",event=>{
    if(handleLessonLiveClick(event,selectedLesson,$("#lesson-detail")))return;
    if(event.target.closest("[data-visual-next]")&&lessonVisualStep<lessons.find(x=>x.id===selectedLesson).visual.steps.length-1){lessonVisualStep++;renderLesson();}
    if(event.target.closest("[data-visual-reset]")){lessonVisualStep=0;renderLesson();}
    if(event.target.closest("[data-practice-next]")&&lessonPracticeStep<lessons.find(x=>x.id===selectedLesson).manipulation.steps.length-1){lessonPracticeStep++;renderLesson();}
    if(event.target.closest("[data-practice-reset]")){lessonPracticeStep=0;renderLesson();}
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
  $("#exercise-search")?.addEventListener("input",event=>{exerciseQuery=event.target.value;renderExerciseCards();});
  $("#exercise-level")?.addEventListener("change",event=>{exerciseLevel=event.target.value;renderExerciseCards();});
  $("#exercise-grid")?.addEventListener("click",event=>{
    const card=event.target.closest("[data-select-exercise]");
    if(card)selectExercise(card.dataset.selectExercise);
  });
  $("#exercise-detail")?.addEventListener("click",event=>{
    if(event.target.closest("[data-save-attempt]")){
      const answer={};
      $$("[data-attempt-field]",$("#exercise-detail")).forEach(field=>answer[field.dataset.attemptField]=field.value);
      try{localStorage.setItem("traza-exercise-attempt-"+selectedExercise.id,JSON.stringify(answer));}catch{}
      markExerciseProgress(selectedExercise.id,"in-progress");
      const feedback=$("[data-gate-feedback]",$("#exercise-detail"));
      if(feedback)feedback.textContent="Tu análisis quedó guardado en este navegador.";
      return;
    }
    if(event.target.closest("[data-exercise-hint]")){
      const hints=selectedExercise.pistas??[];
      const button=event.target.closest("[data-exercise-hint]");
      const feedback=$("[data-gate-feedback]",$("#exercise-detail"));
      if(exerciseHintStep<hints.length){
        const current=exerciseHintStep;
        if(feedback)feedback.textContent="Pista "+(current+1)+" de "+hints.length+" · "+hints[current];
        exerciseHintStep++;
        recordExerciseHint(selectedExercise.id);
        if(button){
          button.textContent=exerciseHintStep<hints.length?"Ver pista "+(exerciseHintStep+1)+" de "+hints.length:"Pistas utilizadas";
          button.disabled=exerciseHintStep>=hints.length;
        }
      }else if(feedback)feedback.textContent="Ya has utilizado las tres pistas. La explicación sigue disponible cuando decidas revelarla.";
      return;
    }
    const share=event.target.closest("[data-share-action]");
    if(share){void handleExerciseShare(share.dataset.shareAction);return;}
    if(event.target.closest("[data-projector-toggle]")){setProjectorMode(!projectorActive);return;}
    if(event.target.closest("[data-projector-exit]")){setProjectorMode(false);return;}
    if(event.target.closest("[data-run-solution]")){runCustomExercisePrediction();return;}
    if(event.target.closest("[data-run-suite]")){runExerciseVerification();return;}
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
  const shared=restoreSharedExercise();
  lessonList();renderLesson();
  renderExerciseCards();renderExerciseDetail();
  bindContentEvents();
  document.addEventListener("fullscreenchange",updateProjectorAfterFullscreen);
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&projectorActive&&!document.fullscreenElement){
      event.preventDefault();setProjectorMode(false);
    }
  });
  if(shared)document.querySelector("[data-space=exercises]")?.click();
}
