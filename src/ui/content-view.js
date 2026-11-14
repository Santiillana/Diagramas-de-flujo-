import { lessons } from "../content/lessons.js";
import { exercises } from "../content/exercises.js";
import { escapeHTML } from "./escape.js";
import { renderLessonLiveMarkup, renderLessonLiveState, handleLessonLiveClick, resetLessonLiveSession } from "./lesson-live.js";

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
      <h3>${escapeHTML(lesson.title)}</h3><p>${escapeHTML(lesson.objective)}</p></div><span class="lesson-completion" aria-label="Lección de la ruta">TRAZA · APRENDE</span></header>
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
  host.innerHTML=filtered.length?filtered.map(item=>{
    const level=LEVELS[item.level];
    return `
      <button type="button" class="exercise-card ${selectedExercise?.id===item.id?"is-selected":""}" data-select-exercise="${item.id}">
        <span class="exercise-card-top"><span class="exercise-number">${String(item.id).padStart(2,"0")}</span><span class="exercise-level ${level.className}">${level.label}</span></span>
        <strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.concepts.slice(0,3).join(" · "))}</small>
        <span class="exercise-card-footer">${item.methods.length} ${item.methods.length===1?"método":"métodos"} <span aria-hidden="true">↗</span></span>
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
  lessonList();renderLesson();
  renderExerciseCards();renderExerciseDetail();
  bindContentEvents();
}
