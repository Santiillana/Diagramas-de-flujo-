import { flattenPseudocode } from "../core/parser.js";
import { executePseudocode } from "../core/interpreter.js";
import { buildArrowChallenge, buildGapChallenge, mixedModeOrder } from "./lab/generators.js";
import { normalizeProgress, recordLabResult, modeStars } from "./lab/progress.js";

const $=selector=>document.querySelector(selector);
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=value=>typeof value==="number"?String(Number(value.toFixed(6))):String(value);
let trace=null;
let activity="predict";
let orderedLines=[];
let selectedSymbol=null;
let predictionAnswer=null;
let whatIfResult=null;
let orderChecked=false;
let errorScenario=0;
let labAttempt=0;
let gapHints=0;
let mixedQueue=[];
let labProgress=loadLabProgress();

function loadLabProgress(){
  try{
    const saved=window.localStorage.getItem("traza:v2:progress");
    return normalizeProgress(saved?JSON.parse(saved):null);
  }catch{return normalizeProgress(null);}
}
function saveLabProgress(){
  try{window.localStorage.setItem("traza:v2:progress",JSON.stringify(labProgress));}catch{}
}
function updateProgressBadges(){
  const exerciseId=trace?.exercise?.id;
  if(!exerciseId)return;
  $("#lab-activity-list")?.querySelectorAll("[data-lab-activity]").forEach(button=>{
    const stars=modeStars(labProgress,exerciseId,button.dataset.labActivity);
    let output=button.querySelector(".activity-progress");
    if(!output){
      output=document.createElement("span");
      output.className="activity-progress";
      output.setAttribute("aria-label","Estrellas de progreso");
      button.append(output);
    }
    output.textContent="★".repeat(stars)+"☆".repeat(3-stars);
  });
}
function recordResult(mode,correct,hints=0){
  const exerciseId=trace?.exercise?.id;
  if(!exerciseId)return;
  labProgress=recordLabResult(labProgress,{exerciseId,mode,correct,hints});
  saveLabProgress();
  updateProgressBadges();
}
function mixedAdvanceMarkup(){
  return mixedQueue.length
    ? '<button type="button" class="button button-secondary" id="lab-next-mixed">Siguiente reto mixto</button>'
    : "";
}
function bindMixedAdvance(){
  $("#lab-next-mixed")?.addEventListener("click",nextMixed);
}
function nextMixed(){
  const next=mixedQueue.shift();
  if(!next){
    $("#lab-task-title").textContent="Práctica mixta completada";
    $("#lab-task-content").innerHTML='<div class="lab-guidance"><strong>Has completado los cinco retos.</strong><p>La práctica quedó guardada en tu progreso.</p></div>';
    return;
  }
  labAttempt++;
  setActivity(next,{keepMixed:true});
}
function startMixedPractice(){
  if(!requireTrace())return;
  const pool=["predict","order","symbol","error","fill-gap","follow-arrow"];
  mixedQueue=mixedModeOrder(trace.exercise.id,labAttempt,pool).slice(0,5);
  nextMixed();
}
function addLabActivity(id,title,description,icon){
  const list=$("#lab-activity-list");
  if(!list||list.querySelector('[data-lab-activity="'+id+'"]'))return;
  const button=document.createElement("button");
  button.type="button";
  button.className="activity-card";
  button.dataset.labActivity=id;
  button.innerHTML='<span class="activity-icon" aria-hidden="true">'+icon+'</span><span><strong></strong><small></small></span><span class="activity-arrow" aria-hidden="true">›</span>';
  button.querySelector("strong").textContent=title;
  button.querySelector("small").textContent=description;
  list.append(button);
}
function addMixedPracticeButton(){
  const view=$("#view-lab");
  const layout=view?.querySelector(".lab-layout");
  if(!layout||$("#lab-start-mixed"))return;
  const actions=document.createElement("div");
  actions.className="lab-practice-actions";
  const button=document.createElement("button");
  button.type="button";
  button.className="button button-primary";
  button.id="lab-start-mixed";
  button.textContent="Empezar práctica mixta · 5 retos";
  button.addEventListener("click",startMixedPractice);
  actions.append(button);
  layout.before(actions);
}
const symbolMap={
  input:{name:"Entrada de datos",options:["Paralelogramo","Rectángulo","Rombo"],correct:"Paralelogramo",why:"Leer recibe datos del exterior; se representa con un paralelogramo."},
  assignment:{name:"Proceso / asignación",options:["Rectángulo","Óvalo","Rombo"],correct:"Rectángulo",why:"Una asignación transforma o actualiza un valor; corresponde al símbolo de proceso."},
  output:{name:"Salida de datos",options:["Rombo","Documento / salida","Hexágono"],correct:"Documento / salida",why:"Imp comunica un dato o resultado; en este material la salida se diferencia del proceso."},
  if:{name:"Decisión Si",options:["Rombo","Rectángulo","Paralelogramo"],correct:"Rombo",why:"Una condición conduce por rutas alternativas, normalmente Verdadera (V) y Falsa (F)."},
  while:{name:"Ciclo Mientras",options:["Rombo de decisión","Documento","Óvalo"],correct:"Rombo de decisión",why:"Mientras evalúa una condición antes de ejecutar el cuerpo."},
  doWhile:{name:"Ciclo Hacer–Mientras",options:["Rombo de decisión","Paralelogramo","Rectángulo"],correct:"Rombo de decisión",why:"La condición de repetición se evalúa al final del cuerpo."},
  for:{name:"Ciclo Para",options:["Hexágono / ciclo definido","Óvalo","Documento"],correct:"Hexágono / ciclo definido",why:"La forma didáctica del Para concentra preparación, condición y avance; el flujo de ejecución sigue teniendo un cuerpo y un retorno."}
};
const errorScenarios=[
  {title:"Máximo inicializado en cero",statement:"El algoritmo busca el mayor de dos números. ¿Funciona si los dos son negativos?",source:"M=0|para i=1;i<=2;i++|leer n|si n>M|M=n|fin|fin|imp M",inputs:[-4,-2],expected:-2,explanation:"El máximo debe inicializarse con el primer dato. Empezar en cero falla cuando todos los números son negativos."},
  {title:"Factorial inicializado en cero",statement:"El algoritmo multiplica de 1 a N. ¿Obtiene el factorial para N = 5?",source:"F=0|para i=1;i<=5;i++|F=F*i|fin|imp F",inputs:[],expected:120,explanation:"El acumulador de producto comienza en 1, porque 1 es el elemento neutro de la multiplicación. Si comienza en cero, siempre permanece en cero."},
  {title:"Centinela contado como dato",statement:"El algoritmo cuenta datos hasta recibir cero. ¿Debe contar también el cero que detiene la lectura?",source:"C=0|hacer|leer n|C=C+1|hm n<>0|imp C",inputs:[4,5,0],expected:2,explanation:"El valor cero es una señal de parada, no un dato de la serie. La actualización del contador debe ejecutarse solo cuando el valor leído sea distinto del centinela."},
  {title:"Promedio correcto con centinela y sin datos",statement:"¿Este algoritmo calcula el promedio de los datos anteriores al cero y evita dividir entre cero cuando no hay entradas?",source:"S=0|C=0|leer n|mientras n<>0|S=S+n|C=C+1|leer n|fin|si C>0|imp S/C|sino|imp 0|fin",inputs:[2,4,0],expected:3,explanation:"El algoritmo excluye el centinela, cuenta los datos procesados y solo divide cuando hay al menos un dato. Por tanto, este caso es correcto."}
];
function publishContext(detail){
  if(!detail?.execution?.events?.length)return;
  trace=detail;
  updateLabContext();
  if(["predict","table","follow-arrow"].includes(activity))renderActivity();
  updateProgressBadges();
}
function updateLabContext(){
  if(!trace)return;
  const {execution,event,index,exercise}=trace;
  const visited=execution.events.slice(0,index+1);
  const seen=[...new Set(visited.map(x=>x.nodeId).filter(x=>x!==null&&x!==undefined))];
  const diagram=trace.diagram;
  if(diagram){
    const target=$("#lab-diagram-container");
    const sourceSvg=document.querySelector("#flow-svg");
    if(sourceSvg){
      target.innerHTML=sourceSvg.outerHTML.replaceAll("flow-arrow","lab-flow-arrow").replaceAll('id="flow-token"','id="lab-flow-token"');
      const svg=target.querySelector("svg");
      if(svg){svg.removeAttribute("id");svg.style.width="100%";svg.style.minWidth="0";svg.style.maxWidth="none";}
      target.querySelectorAll(".diagram-node").forEach(node=>{
        const sourceId=node.id.replace("flow-node-","");
        const model=diagram.byId.get(sourceId);
        node.classList.toggle("is-active",Boolean(model&&event.nodeId!==null&&String(model.sourceId)===String(event.nodeId)));
        node.classList.toggle("is-visited",Boolean(model&&model.sourceId!==null&&seen.includes(model.sourceId)));
      });
    }
  }
  const scene=event.scene??{title:"Paso",body:event.message??"",technical:""};
  $("#lab-scene-content").innerHTML="<strong>"+esc(scene.title)+"</strong><p>"+esc(scene.body)+"</p>";
  const vars=event.variables??{};
  const keys=Object.keys(vars);
  $("#lab-variables-content").innerHTML=keys.length?
    '<table class="variables-table"><tbody>'+keys.map(key=>"<tr><th>"+esc(key)+"</th><td>"+esc(fmt(vars[key]))+"</td></tr>").join("")+"</tbody></table>":
    '<span class="empty-state-copy">Sin variables todavía.</span>';
  $("#lab-context-title").textContent=(exercise?.title??"Diagrama de flujo")+" · En ejecución";
  $("#lab-current-step").innerHTML="PASO <b>"+(index+1)+" / "+execution.events.length+"</b>";
  $("#lab-current-exercise").innerHTML="EJERCICIO <b>"+(exercise?.id??"—")+"</b>";
}
function setActivity(next,options={}){
  if(!options.keepMixed)mixedQueue=[];
  activity=next;
  predictionAnswer=null;
  whatIfResult=null;
  orderChecked=false;
  $("#lab-activity-list").querySelectorAll("[data-lab-activity]").forEach(button=>
    button.classList.toggle("is-active",button.dataset.labActivity===next));
  const titles={predict:"Predice el siguiente paso",table:"Tabla de seguimiento",order:"Ordena instrucciones",symbol:"Identifica el símbolo",error:"Encuentra el error",whatif:"¿Y si…?", "fill-gap":"Completa el hueco","follow-arrow":"Sigue la flecha"};
  $("#lab-task-title").textContent=titles[next]??"Actividad";
  renderActivity();
}
function requireTrace(){
  if(trace)return true;
  $("#lab-task-content").innerHTML='<div class="lab-guidance"><strong>Primero necesitas una ejecución.</strong><p>Abre Ejercicios, elige un reto y pulsa «Preparar este método en el simulador». El laboratorio mantendrá esa traza mientras practicas.</p><button type="button" class="button button-primary" id="lab-go-exercises">Ir a Ejercicios</button></div>';
  $("#lab-go-exercises")?.addEventListener("click",()=>document.querySelector('[data-space="exercises"]')?.click());
  return false;
}
function eventOptions(expected){
  const labels={
    input:"Entrada de dato",assignment:"Asignación / cálculo",output:"Salida",
    decision:"Decisión",branch:"Selección de ruta", "loop-init":"Preparación del ciclo",
    "loop-condition":"Comprobación del ciclo","loop-enter":"Iteración",
    "loop-update":"Avance del contador","loop-exit":"Fin del ciclo",
    "program-end":"Fin del algoritmo"
  };
  const all=Object.entries(labels).filter(([key])=>key!==expected).map(([,value])=>value);
  const expectedLabel=labels[expected]??expected;
  return [expectedLabel,...all.slice(0,3)].sort((a,b)=>a.localeCompare(b,"es"));
}
function renderPredict(){
  if(!requireTrace())return;
  const targetIndex=Math.min(trace.index+1,trace.execution.events.length-1);
  if(targetIndex===trace.index){
    $("#lab-task-content").innerHTML='<div class="lab-guidance"><strong>Has llegado al último paso.</strong><p>Vuelve al simulador y selecciona un paso anterior para predecir lo que sigue.</p></div>';
    return;
  }
  const next=trace.execution.events[targetIndex];
  const options=eventOptions(next.type);
  $("#lab-task-content").innerHTML=
    '<div class="lab-question"><p class="eyebrow">ANTES DE REVELAR EL PASO '+(targetIndex+1)+'</p><h4>¿Qué tipo de acción ocurrirá después?</h4>'+
    '<p class="lab-muted">Paso actual: '+(trace.index+1)+' de '+trace.length+'.</p>'+
    '<div class="lab-choice-list">'+options.map(value=>'<button type="button" class="lab-choice" data-predict="'+esc(value)+'">'+esc(value)+'</button>').join("")+'</div>'+
    '<div id="lab-predict-feedback" class="lab-feedback" role="status"></div>'+
    '<button type="button" id="lab-reveal-prediction" class="button button-primary" disabled>Revelar el paso real</button></div>';
  $("#lab-reveal-prediction").addEventListener("click",()=>{
    const feedback=$("#lab-predict-feedback");
    const labels={
      input:"Entrada de dato",assignment:"Asignación / cálculo",output:"Salida",
      decision:"Decisión",branch:"Selección de ruta","loop-init":"Preparación del ciclo",
      "loop-condition":"Comprobación del ciclo","loop-enter":"Iteración",
      "loop-update":"Avance del contador","loop-exit":"Fin del ciclo",
      "program-end":"Fin del algoritmo"
    };
    const expected=labels[next.type]??next.type;
    const correct=predictionAnswer===expected;
    recordResult("predict",correct);
    const symbol=next.type==="input"?"Paralelogramo":
      ["assignment","loop-init","loop-update"].includes(next.type)?"Rectángulo de proceso":
      next.type==="output"?"Documento / salida":
      ["decision","loop-condition"].includes(next.type)?"Rombo de decisión":
      "Conector / terminal";
    feedback.innerHTML=
      "<strong>"+(correct?"Predicción correcta.":"La predicción no coincide.")+"</strong>"+
      "<p>El evento real es <b>"+esc(expected)+"</b>: "+esc(next.scene?.body??next.message??"")+"</p>"+
      "<p>Símbolo relacionado: "+esc(symbol)+". "+esc(next.scene?.technical??"")+"</p>"+
      "<button type='button' class='text-link' id='lab-go-predicted'>Inspeccionar el paso "+(targetIndex+1)+" ↗</button>"+mixedAdvanceMarkup();
    feedback.classList.toggle("is-correct",correct);
    feedback.classList.toggle("is-wrong",!correct);
    $("#lab-go-predicted")?.addEventListener("click",()=>document.dispatchEvent(new CustomEvent("traza:jump-to-step",{detail:{index:targetIndex}})));
    bindMixedAdvance();
  });
  $("#lab-task-content").querySelectorAll("[data-predict]").forEach(button=>{
    button.addEventListener("click",()=>{
      predictionAnswer=button.dataset.predict;
      $("#lab-task-content").querySelectorAll("[data-predict]").forEach(item=>item.classList.toggle("is-selected",item===button));
      $("#lab-reveal-prediction").disabled=false;
      $("#lab-predict-feedback").textContent="Predicción registrada. Revela el paso para compararla con el evento real.";
    });
  });
}

function renderTable(){
  if(!requireTrace())return;
  const events=trace.execution.events;
  const keys=[...new Set(events.flatMap(e=>Object.keys(e.variables??{})))];
  const headings=["Paso","Iteración","Evento",...keys.map(key=>key+" · anterior → actual"),"Salida"];
  $("#lab-task-content").innerHTML=
    '<p class="lab-muted">Cada fila conserva el snapshot del motor. Las celdas muestran la primera asignación, el cambio anterior → actual o un valor sin cambio; la fila activa sigue al simulador.</p>'+
    '<div class="lab-table-wrap"><table class="lab-trace-table"><thead><tr>'+headings.map(x=>"<th>"+esc(x)+"</th>").join("")+'</tr></thead><tbody>'+
    events.map((event,index)=>{
      const previous=events[index-1]?.variables??{};
      const current=event.variables??{};
      const iteration=(event.loopStack??[]).map(loop=>loop.iteration).join(" / ")||"—";
      const variableCells=keys.map(key=>{
        const hasCurrent=Object.hasOwn(current,key);
        const hasPrevious=Object.hasOwn(previous,key);
        if(!hasCurrent)return "—";
        const value=fmt(current[key]);
        if(!hasPrevious)return "(nace) → "+value;
        const before=fmt(previous[key]);
        return before===value?value+" (sin cambio)":before+" → "+value;
      });
      const cells=[index+1,iteration,event.scene?.title??event.type,...variableCells,(event.outputs??[]).map(fmt).join(", ")||"—"];
      return '<tr class="'+(index===trace.index?"is-current":"")+'" data-lab-row="'+index+'">'+cells.map(cell=>"<td>"+esc(cell)+"</td>").join("")+"</tr>";
    }).join("")+
    '</tbody></table></div><button type="button" class="button button-secondary" id="lab-table-follow">Ir a la fila actual</button>';
  $("#lab-table-follow").addEventListener("click",()=>$("#lab-task-content").querySelector('[data-lab-row="'+trace.index+'"]')?.scrollIntoView({block:"center"}));
  $("#lab-task-content").querySelector('[data-lab-row="'+trace.index+'"]')?.scrollIntoView({block:"nearest",inline:"nearest"});
}

function renderOrder(){
  if(!requireTrace())return;
  const lines=trace.method.pseudocode.split("|").map(x=>x.trim()).filter(Boolean);
  if(!orderedLines.length||orderedLines.length!==lines.length)orderedLines=[...lines].reverse();
  $("#lab-task-content").innerHTML=
    '<p class="lab-muted">Reordena las instrucciones para reconstruir el pseudocódigo original. Este ejercicio no modifica la ejecución que aparece a la izquierda.</p>'+
    '<ol class="lab-sort-list">'+orderedLines.map((line,index)=>'<li><code>'+esc(line)+'</code><span class="lab-sort-controls"><button type="button" data-order-up="'+index+'" '+(index===0?"disabled":"")+' aria-label="Subir instrucción">↑</button><button type="button" data-order-down="'+index+'" '+(index===orderedLines.length-1?"disabled":"")+' aria-label="Bajar instrucción">↓</button></span></li>').join("")+'</ol>'+
    '<div class="lab-task-actions"><button type="button" class="button button-secondary" id="lab-order-reset">Mezclar de nuevo</button><button type="button" class="button button-primary" id="lab-order-check">Comprobar orden</button></div>'+
    '<div id="lab-order-feedback" class="lab-feedback" role="status">'+(orderChecked?"Orden comprobado.":"")+'</div>';
  $("#lab-order-reset").addEventListener("click",()=>{orderedLines=[...lines].reverse();orderChecked=false;renderOrder();});
  $("#lab-order-check").addEventListener("click",()=>{
    const correct=orderedLines.every((line,index)=>line===lines[index]);
    recordResult("order",correct);
    orderChecked=true;
    $("#lab-order-feedback").innerHTML=correct?
      "<strong>Correcto.</strong> El orden coincide con el pseudocódigo de este método.":
      "<strong>Hay instrucciones fuera de lugar.</strong> Revisa la secuencia y vuelve a comprobarla.";
    $("#lab-order-feedback").innerHTML+=mixedAdvanceMarkup();
    bindMixedAdvance();
    $("#lab-order-feedback").classList.toggle("is-correct",correct);
    $("#lab-order-feedback").classList.toggle("is-wrong",!correct);
  });
  $("#lab-task-content").querySelectorAll("[data-order-up]").forEach(button=>button.addEventListener("click",()=>{
    const index=Number(button.dataset.orderUp);[orderedLines[index-1],orderedLines[index]]=[orderedLines[index],orderedLines[index-1]];orderChecked=false;renderOrder();
  }));
  $("#lab-task-content").querySelectorAll("[data-order-down]").forEach(button=>button.addEventListener("click",()=>{
    const index=Number(button.dataset.orderDown);[orderedLines[index+1],orderedLines[index]]=[orderedLines[index],orderedLines[index+1]];orderChecked=false;renderOrder();
  }));
}
function symbolOptions(type){
  return symbolMap[type]?.options??[];
}
function renderSymbol(){
  if(!requireTrace())return;
  const ast=flattenPseudocode(trace.execution.program);
  const candidates=ast.filter(row=>symbolMap[row.type]);
  if(!candidates.length){$("#lab-task-content").innerHTML="<p>El método no contiene un elemento para clasificar.</p>";return;}
  const event=trace.event;
  const row=candidates.find(item=>item.id===event?.nodeId)||
    candidates.find(item=>item.line===event?.sourceLine)||
    candidates[0];
  const model=symbolMap[row.type];
  $("#lab-task-content").innerHTML=
    '<div class="lab-question"><p class="eyebrow">INSTRUCCIÓN ACTIVA · LÍNEA '+row.line+'</p><pre class="lab-snippet"><code>'+esc(row.source)+'</code></pre>'+
    '<p class="lab-muted">El ejercicio utiliza el nodo que corresponde al paso '+(trace.index+1)+' de la ejecución.</p>'+
    '<h4>¿Qué símbolo representa esta instrucción?</h4><div class="lab-choice-list">'+model.options.map(option=>'<button type="button" class="lab-choice" data-symbol-choice="'+esc(option)+'">'+esc(option)+'</button>').join("")+'</div>'+
    '<div id="lab-symbol-feedback" class="lab-feedback" role="status"></div></div>';
  $("#lab-task-content").querySelectorAll("[data-symbol-choice]").forEach(button=>button.addEventListener("click",()=>{
    const correct=button.dataset.symbolChoice===model.correct;
    recordResult("symbol",correct);
    $("#lab-symbol-feedback").innerHTML=(correct?"<strong>Correcto.</strong> ":"<strong>No exactamente.</strong> ")+esc(model.why)+mixedAdvanceMarkup();
    bindMixedAdvance();
    $("#lab-symbol-feedback").classList.toggle("is-correct",correct);
    $("#lab-symbol-feedback").classList.toggle("is-wrong",!correct);
    $("#lab-task-content").querySelectorAll("[data-symbol-choice]").forEach(item=>item.disabled=true);
  }));
}

function renderError(){
  const scenario=errorScenarios[errorScenario%errorScenarios.length];
  $("#lab-task-content").innerHTML=
    '<div class="lab-question"><p class="eyebrow">CASO DE PRUEBA · '+(errorScenario+1)+' / '+errorScenarios.length+'</p><h4>'+esc(scenario.title)+'</h4><p>'+esc(scenario.statement)+'</p>'+
    '<pre class="lab-snippet"><code>'+esc(scenario.source.split("|").join("\n"))+'</code></pre><div class="lab-choice-list">'+
    '<button type="button" class="lab-choice" data-error-choice="correct">El algoritmo es correcto</button>'+
    '<button type="button" class="lab-choice" data-error-choice="incorrect">El algoritmo tiene un error</button></div>'+
    '<div id="lab-error-feedback" class="lab-feedback" role="status"></div>'+
    '<button type="button" class="button button-secondary" id="lab-next-error">Siguiente caso</button></div>';
  $("#lab-task-content").querySelectorAll("[data-error-choice]").forEach(button=>button.addEventListener("click",()=>{
    const tested=executePseudocode(scenario.source,scenario.inputs);
    const actual=tested.outputs[0];
    const correct=tested.ok&&JSON.stringify(tested.outputs)===JSON.stringify([scenario.expected]);
    const chosen=button.dataset.errorChoice==="correct";
    recordResult("error",chosen===correct);
    const feedback=$("#lab-error-feedback");
    feedback.innerHTML=(chosen===correct?"<strong>Buena detección.</strong> ":"<strong>Revisa el contraejemplo.</strong> ")+
      "<p>Entrada: "+esc(JSON.stringify(scenario.inputs))+". Resultado del algoritmo: "+esc(JSON.stringify(actual))+
      "; resultado esperado: "+esc(JSON.stringify(scenario.expected))+".</p><p>"+esc(scenario.explanation)+"</p>"+mixedAdvanceMarkup();
    bindMixedAdvance();
    feedback.classList.toggle("is-correct",chosen===correct);
    feedback.classList.toggle("is-wrong",chosen!==correct);
    $("#lab-task-content").querySelectorAll("[data-error-choice]").forEach(item=>item.disabled=true);
  }));
  $("#lab-next-error").addEventListener("click",()=>{errorScenario=(errorScenario+1)%errorScenarios.length;renderError();});
}
function renderWhatIf(){
  if(!requireTrace())return;
  $("#lab-task-content").innerHTML=
    '<div class="lab-question"><p class="eyebrow">EXPERIMENTO CONTROLADO · COPIA INDEPENDIENTE</p><h4>Cambia una condición, una instrucción o los datos y observa qué consecuencia produce.</h4>'+
    '<label class="lab-editor-field"><span>PSEUDOCÓDIGO MODIFICABLE</span><textarea id="lab-whatif-code" rows="6">'+esc(trace.source.split("|").join("\n"))+'</textarea></label>'+
    '<label class="lab-editor-field"><span>DATOS DE ENTRADA (SEPARADOS POR COMAS)</span><input id="lab-whatif-inputs" value="'+esc((trace.method.sample??[]).join(", "))+'"></label>'+
    '<div class="lab-task-actions"><button type="button" class="button button-primary" id="lab-whatif-run">Ejecutar cambio</button></div>'+
    '<div id="lab-whatif-result" class="lab-comparison" role="status"></div></div>';
  $("#lab-whatif-run").addEventListener("click",()=>{
    const source=$("#lab-whatif-code").value.split("\n").map(x=>x.trim()).filter(Boolean).join("|");
    const inputs=$("#lab-whatif-inputs").value.trim()?$("#lab-whatif-inputs").value.split(/[;,]/).map(x=>x.trim()):[];
    let changed;
    try{changed=executePseudocode(source,inputs);}
    catch(error){changed={ok:false,error:{message:error.message},outputs:[],variables:{},events:[]};}
    const before=trace.execution;
    const beforeValue=JSON.stringify(before.outputs);
    const afterValue=JSON.stringify(changed.outputs);
    const names=[...new Set([...Object.keys(before.variables??{}),...Object.keys(changed.variables??{})])];
    const differences=names.filter(name=>JSON.stringify(before.variables?.[name])!==JSON.stringify(changed.variables?.[name]));
    const variableExplanation=differences.length?
      differences.map(name=>name+": "+(Object.hasOwn(before.variables??{},name)?fmt(before.variables[name]):"(sin valor)")+" → "+(Object.hasOwn(changed.variables??{},name)?fmt(changed.variables[name]):"(sin valor)")).join("; "):
      "Las variables finales no cambiaron.";
    const originalBranches=before.events.filter(event=>event.type==="decision"||event.type==="loop-condition").map(event=>event.route??(event.result?"V":"F"));
    const changedBranches=changed.events.filter(event=>event.type==="decision"||event.type==="loop-condition").map(event=>event.route??(event.result?"V":"F"));
    const status=changed.ok?"Ejecución terminada":"Ejecución detenida por error";
    const explanation=beforeValue===afterValue&&changed.ok?
      "Con estas entradas, el cambio mantiene la misma salida; revisa también el recorrido y los valores intermedios.":
      "La modificación alteró el resultado o la terminación. La causa se observa en los valores y decisiones que cambiaron.";
    $("#lab-whatif-result").innerHTML=
      '<div><span class="eyebrow">RESULTADO ORIGINAL · FINAL</span><code>'+esc(beforeValue)+'</code><small>Variables: '+esc(JSON.stringify(before.variables??{}))+'</small></div>'+
      '<div><span class="eyebrow">RESULTADO MODIFICADO · FINAL</span><code>'+esc(afterValue)+'</code><small>'+esc(status+(changed.error?": "+changed.error.message:""))+'</small></div>'+
      '<div><span class="eyebrow">CAMBIOS EN VARIABLES</span><code>'+esc(variableExplanation)+'</code><small>Pasos: '+before.events.length+" → "+changed.events.length+'</small></div>'+
      '<div><span class="eyebrow">RUTAS EVALUADAS</span><code>'+esc(originalBranches.join(" · ")||"Sin decisiones")+' → '+esc(changedBranches.join(" · ")||"Sin decisiones")+'</code></div>'+
      '<p>'+esc(explanation)+'</p>';
  });
}

function actualInputValues(){
  return trace.execution.events.filter(event=>event.type==="input").map(event=>event.value);
}
function stableValues(value){
  if(!value||typeof value!=="object"||Array.isArray(value))return JSON.stringify(value);
  return JSON.stringify(Object.keys(value).sort().map(key=>[key,value[key]]));
}
function renderFillGap(){
  if(!requireTrace())return;
  const challenge=buildGapChallenge(trace.exercise.id,trace.methodIndex,trace.source,labAttempt);
  gapHints=0;
  if(!challenge){
    $("#lab-task-content").innerHTML='<div class="lab-guidance"><strong>Este método no tiene una asignación que se pueda ocultar.</strong><p>Elige otro método o un ejercicio distinto.</p></div>';
    return;
  }
  $("#lab-task-content").innerHTML=
    '<div class="lab-question"><p class="eyebrow">RETO '+(labAttempt+1)+' · MISMO EJERCICIO Y MISMA TRAZA</p><h4>Completa la expresión que falta.</h4>'+
    '<p class="lab-muted">La respuesta se comprobará ejecutando el pseudocódigo con los mismos datos de esta ejecución.</p>'+
    '<pre class="lab-snippet"><code>'+esc(challenge.maskedLines.join("\n"))+'</code></pre>'+
    '<label class="lab-editor-field"><span>EXPRESIÓN QUE FALTA EN '+esc(challenge.variable)+'</span><input id="lab-gap-answer" autocomplete="off" spellcheck="false"></label>'+
    '<div class="lab-task-actions"><button type="button" class="button button-secondary" id="lab-gap-hint">Pista</button><button type="button" class="button button-primary" id="lab-gap-check">Comprobar</button><button type="button" class="button button-secondary" id="lab-gap-surrender">Ver solución</button><button type="button" class="button button-secondary" id="lab-gap-new">Nuevo reto</button></div>'+
    '<div id="lab-gap-feedback" class="lab-feedback" role="status"></div></div>';
  $("#lab-gap-hint").addEventListener("click",()=>{
    const hints=[
      "Piensa qué valores necesita la variable para completar el cálculo.",
      "La expresión debe usar variables que ya existan en ese punto del programa.",
      "La expresión original es: "+challenge.answer
    ];
    $("#lab-gap-feedback").textContent=hints[Math.min(gapHints,hints.length-1)];
    gapHints=Math.min(3,gapHints+1);
  });
  $("#lab-gap-check").addEventListener("click",()=>{
    const answer=$("#lab-gap-answer").value.trim();
    if(!answer){$("#lab-gap-feedback").textContent="Escribe una expresión antes de comprobar.";return;}
    const candidate=[...challenge.lines];
    candidate[challenge.index]=challenge.variable+" = "+answer;
    let result;
    try{result=executePseudocode(candidate.join("|"),actualInputValues());}
    catch(error){result={ok:false,error:{message:error.message},outputs:[],variables:{}};}
    const sameOutputs=JSON.stringify(result.outputs)===JSON.stringify(trace.execution.outputs);
    const sameVariables=stableValues(result.variables)===stableValues(trace.execution.variables);
    const correct=Boolean(result.ok&&sameOutputs&&sameVariables);
    recordResult("fill-gap",correct,gapHints);
    const feedback=$("#lab-gap-feedback");
    feedback.innerHTML=(correct?"<strong>Correcto.</strong> ":"<strong>Aún no coincide.</strong> ")+
      (correct?"La ejecución conserva las mismas salidas y variables.":"Resultado obtenido: "+esc(JSON.stringify(result.outputs))+". Resultado esperado: "+esc(JSON.stringify(trace.execution.outputs))+".")+
      (result.error?"<p>"+esc(result.error.message)+"</p>":"")+mixedAdvanceMarkup();
    feedback.classList.toggle("is-correct",correct);
    feedback.classList.toggle("is-wrong",!correct);
    bindMixedAdvance();
  });
  $("#lab-gap-surrender").addEventListener("click",()=>{
    recordResult("fill-gap",false,gapHints);
    $("#lab-gap-answer").value=challenge.answer;
    const feedback=$("#lab-gap-feedback");
    feedback.innerHTML="<strong>Solución:</strong> "+esc(challenge.answer)+
      "<p>Esta expresión reproduce las salidas y variables de la traza original.</p>"+mixedAdvanceMarkup();
    bindMixedAdvance();
  });
  $("#lab-gap-new").addEventListener("click",()=>{labAttempt++;renderFillGap();});
}
function renderFollowArrow(){
  if(!requireTrace())return;
  const challenge=buildArrowChallenge(trace.execution.events,trace.index,trace.exercise.id,labAttempt);
  if(!challenge){
    $("#lab-task-content").innerHTML='<div class="lab-guidance"><strong>Ya no hay otra figura por recorrer.</strong><p>Vuelve al simulador y selecciona un paso anterior para seguir una ruta distinta.</p></div>';
    return;
  }
  $("#lab-task-content").innerHTML=
    '<div class="lab-question"><p class="eyebrow">PASO ACTUAL · '+(trace.index+1)+' / '+trace.execution.events.length+'</p>'+
    '<h4>¿A qué figura llegará la ficha después?</h4>'+
    '<p class="lab-muted">Sigue la conexión que se ejecuta, no la figura que esté más cerca.</p>'+
    '<div class="lab-choice-list">'+challenge.options.map(option=>
      '<button type="button" class="lab-choice" data-arrow-node="'+esc(option.nodeId)+'">'+esc(option.label)+'</button>'
    ).join("")+'</div>'+
    '<div id="lab-arrow-feedback" class="lab-feedback" role="status"></div></div>';
  $("#lab-task-content").querySelectorAll("[data-arrow-node]").forEach(button=>button.addEventListener("click",()=>{
    const correct=String(button.dataset.arrowNode)===String(challenge.correct.nodeId);
    recordResult("follow-arrow",correct);
    const feedback=$("#lab-arrow-feedback");
    feedback.innerHTML=(correct?"<strong>Correcto.</strong> ":"<strong>Ese no es el siguiente paso.</strong> ")+
      "<p>La siguiente instrucción real es: "+esc(challenge.next.sourceText||challenge.next.scene?.title||"Fin")+". "+
      esc(challenge.next.scene?.body??challenge.next.message??"")+"</p>"+
      '<button type="button" class="text-link" id="lab-arrow-inspect">Míralo correr</button>'+mixedAdvanceMarkup();
    feedback.classList.toggle("is-correct",correct);
    feedback.classList.toggle("is-wrong",!correct);
    $("#lab-arrow-inspect")?.addEventListener("click",()=>document.dispatchEvent(new CustomEvent("traza:jump-to-step",{detail:{index:challenge.next.step}})));
    bindMixedAdvance();
  }));
}
function renderActivity(){
  if(activity==="predict")renderPredict();
  else if(activity==="table")renderTable();
  else if(activity==="order")renderOrder();
  else if(activity==="symbol")renderSymbol();
  else if(activity==="error")renderError();
  else if(activity==="whatif")renderWhatIf();
  else if(activity==="fill-gap")renderFillGap();
  else if(activity==="follow-arrow")renderFollowArrow();
}
export function initLab(){
  $("#lab-activity-list")?.addEventListener("click",event=>{
    const button=event.target.closest("[data-lab-activity]");
    if(button)setActivity(button.dataset.labActivity);
  });
  $("#lab-open-simulator")?.addEventListener("click",()=>document.querySelector('[data-space="simulator"]')?.click());
  document.addEventListener("traza:execution-updated",event=>{
    publishContext(event.detail);
  });
  addLabActivity("fill-gap","Completa el hueco","Escribe una expresión y comprueba la ejecución.","▤");
  addLabActivity("follow-arrow","Sigue la flecha","Predice la siguiente figura del recorrido.","➜");
  addMixedPracticeButton();
  document.dispatchEvent(new CustomEvent("traza:lab-sync-request"));
  setActivity("predict");
  updateProgressBadges();
}
