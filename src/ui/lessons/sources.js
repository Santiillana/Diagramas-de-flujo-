import { sourceLessonById } from "../../content/sources-lessons.js";

const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sourceNames={primary:"Primaria",secondary:"Secundaria",tertiary:"Terciaria"};
const badge=(type,label=sourceNames[type])=>'<span class="source-type source-type-'+type+'" aria-label="Fuente '+label.toLocaleLowerCase("es")+'"><b aria-hidden="true">'+({primary:"P",secondary:"S",tertiary:"T"}[type])+'</b><span>'+esc(label)+'</span></span>';

export function sourceSurveyResults(scene){
  const total=scene.total||scene.survey.reduce((sum,item)=>sum+item.count,0);
  return scene.survey.map(item=>({...item,percent:total?item.count/total*100:0,total}));
}

function requirementScene(data,index){
  return '<div class="source-requirement-scene"><div class="source-person-card"><span class="source-avatar" aria-hidden="true">M</span><div><strong>Doña Marta</strong><small>Dueña de la tienda</small></div></div><div class="source-need-sheet"><span class="source-sheet-label">'+(index===0?"HOJA DE REQUISITOS · VACÍA":index===1?"NECESIDAD · ESCUCHAR ANTES DE PROPONER":"REQUISITO · CLARO Y VERIFICABLE")+'</span>'+(index===0?'<div class="source-empty-lines"><i></i><i></i><i></i></div>':index===1?'<blockquote>“'+esc(data.need)+'”</blockquote><small>La necesidad todavía no prescribe una solución.</small>':'<article class="source-requirement-card"><span>R-01</span><strong>'+esc(data.requirement.replace("R-01 · ",""))+'</strong></article><small>'+esc(data.solution)+'</small>')+'</div></div>';
}
function distanceScene(data,index){
  const nodes=[data.origin,...data.intermediaries.slice(0,index),data.analyst];
  return '<div class="source-distance-scene"><div class="source-distance-chain">'+nodes.map((node,n)=>'<div class="source-distance-node '+(n===0?"is-origin":n===nodes.length-1?"is-analyst":"is-intermediary")+'"><span aria-hidden="true">'+(n===0?"◉":n===nodes.length-1?"⌕":"▤")+'</span><strong>'+esc(node)+'</strong>'+(n<nodes.length-1?'<small>'+String(n+1)+" salto"+(n===0?"":"s")+'</small>':"")+'</div>').join('<span class="source-distance-arrow" aria-hidden="true">→</span>')+'</div><div class="source-distance-ticket"><span aria-hidden="true">▤</span>Ficha del dato · punto '+String(index+1)+' de '+nodes.length+'<i style="--source-progress:'+((index+1)/nodes.length*100)+'%"></i></div><div class="source-route-compare"><p><b>Camino corto</b><span>Origen → analista</span><strong>1 salto</strong></p><p><b>Camino largo</b><span>Origen → registro → resumen → analista</span><strong>3 saltos</strong></p></div></div>';
}
function interviewScene(data,index){
  return '<div class="source-interview-scene"><div class="source-dialogue"><p class="source-bubble source-bubble-owner"><b>Doña Marta</b>'+((index>=1)?'“'+esc(data.quote)+'”':'“Te cuento cómo recibo los pedidos.”')+'</p><p class="source-bubble source-bubble-analyst"><b>Analista</b>'+((index>=2)?'“Voy a registrar esta necesidad para comprobarla después.”':'“¿Qué ocurre cuando hay muchas personas esperando?”')+'</p></div><div class="source-distance-label">'+badge(data.type)+'<span>'+data.hops+' salto · dato directo</span></div>'+(index>=2?'<article class="source-requirement-card"><span>R-01</span><strong>'+esc(data.requirement.replace("R-01 · ",""))+'</strong></article>':'<div class="source-data-ticket">Ficha del dato <span aria-hidden="true">→</span> llega sin intermediarios</div>')+'</div>';
}
function documentScene(data,index){
  return '<div class="source-document-scene"><div class="source-document-stack"><article class="source-document '+(index>=0?"is-front":"")+'"><span>REGISTRO · PEDIDOS ANTERIORES</span><h4>'+esc(data.document)+'</h4><p>'+esc(data.quote)+'</p><small>Registro existente · fecha: mayo</small></article><div class="source-document-shadow" aria-hidden="true"></div></div><div class="source-evidence-link">'+badge(data.type)+'<span>2 saltos hasta el análisis</span></div>'+(index>=2?'<article class="source-requirement-card"><span>R-04</span><strong>'+esc(data.requirement.replace("R-04 · ",""))+'</strong></article><p class="source-limitation">Límite: '+esc(data.limitation)+'</p>':'<p class="source-limitation">El documento aporta antecedentes; contrasta si aún describen el proceso actual.</p>')+'</div>';
}
function indexScene(data,index){
  const chain=index===0?[data.origin,data.analyst]:index===1?[data.origin,data.document,data.analyst]:[data.origin,data.document,data.index,data.analyst];
  return '<div class="source-index-scene"><div class="source-distance-chain">'+chain.map((node,n)=>'<div class="source-distance-node '+(n===0?"is-origin":n===chain.length-1?"is-analyst":"is-intermediary")+'"><span aria-hidden="true">'+(n===0?"◉":n===chain.length-1?"⌕":"▤")+'</span><strong>'+esc(node)+'</strong></div>').join('<span class="source-distance-arrow" aria-hidden="true">→</span>')+'</div><div class="source-evidence-link">'+badge(data.type)+'<strong>'+data.hops+' saltos</strong></div><p class="source-limitation">'+esc(data.limitation)+'</p></div>';
}
function laneScene(data,index){
  const revealed=data.cards.slice(0,Math.min(data.cards.length,index===0?0:index===1?3:data.cards.length));
  return '<div class="source-lanes-scene"><div class="source-lanes">'+["primary","secondary","tertiary"].map(type=>'<section class="source-lane source-lane-'+type+'"><header>'+badge(type)+'</header><div class="source-lane-cards">'+revealed.filter(card=>card.type===type).map(card=>'<article class="source-lane-card">'+esc(card.text)+'</article>').join("")+'</div></section>').join("")+'</div><p class="source-boundary-case"><b>Depende del recorrido:</b> '+esc(data.boundary)+'</p></div>';
}
function techniquesScene(data,index){
  const rows=[
    ["Entrevista","Profundizar en cómo Marta anota cada pedido","◖◗"],
    ["Encuesta","Contar preferencias entre clientes","▥"],
    ["Observación","Ver cómo atiende cuando hay fila","◉"],
    ["Taller","Agrupar ideas y acordar prioridades","▧"],
    ["Revisión documental","Consultar cuadernos y manuales existentes","▤"]
  ];
  const results=sourceSurveyResults(data);
  const moment=index===1?'<section class="source-survey-bars"><header><strong>Preferencia de 40 clientes</strong><small>Muestra pequeña · no representa a todas las personas</small></header>'+results.map(item=>'<div class="source-survey-row"><span>'+esc(item.label)+'</span><div><i style="--source-bar:'+item.percent+'%"></i></div><b>'+item.percent.toLocaleString("es-CO",{maximumFractionDigits:1})+'%</b></div>').join("")+'</section>':index===2?'<div class="source-observation-demo"><span class="source-eye" aria-hidden="true">◉</span><div class="source-observation-screens"><b>Observación · recorrido del pedido</b><ol><li class="'+(index>=2?"is-current":"")+'">1 · Buscar producto</li><li class="is-current">2 · Confirmar pedido <strong> duda</strong></li><li>3 · Ver estado</li></ol><small>La analista registra la acción y el punto de fricción.</small></div><span class="source-friction">Fricción observada</span></div>':index===3?'<div class="source-workshop-notes"><strong>Taller · agrupar propuestas</strong><div><span>Confirmar pedidos</span><span>Ver disponibilidad</span><span>Priorizar con Marta</span></div></div>':index===4?'<div class="source-four-documents">'+["Cuaderno de pedidos","Manual de caja","Recibos de mayo","Lista de productos"].map((title,position)=>'<article style="--document-order:'+position+'"><span>REGISTRO · '+String(position+1).padStart(2,"0")+'</span><b>'+title+'</b><small>Leer, fechar y contrastar</small></article>').join("")+'</div>':'<p class="source-technique-caption">Elige la técnica de acuerdo con la pregunta y la evidencia que necesitas.</p>';
  const decision='<table class="source-technique-decision"><caption>Pregunta que ayuda a elegir la técnica</caption><tbody><tr><th>Entender razones</th><td>Entrevista</td></tr><tr><th>Contar preferencias</th><td>Encuesta</td></tr><tr><th>Ver una tarea real</th><td>Observación</td></tr><tr><th>Acordar prioridades</th><td>Taller</td></tr><tr><th>Consultar antecedentes</th><td>Revisión documental</td></tr></tbody></table>';
  return '<div class="source-techniques-scene"><div class="source-technique-cards">'+rows.map(([name,description,icon],position)=>'<article class="source-technique-card '+(position===index?"is-current":position<index?"is-seen":"")+'"><span aria-hidden="true">'+icon+'</span><strong>'+name+'</strong><small>'+description+'</small></article>').join("")+'</div>'+moment+decision+'</div>';
}
function traceabilityScene(data,index){
  const rows=data.requirements.slice(0,index===0?1:index===1?2:data.requirements.length);
  return '<div class="source-traceability-scene">'+(index<2?'<div class="source-source-pair"><p>'+badge("primary")+' '+esc(data.discrepancy.a)+'</p><p>'+badge("secondary")+' '+esc(data.discrepancy.b)+'</p></div><div class="source-discrepancy">'+(index===0?"Las fuentes coinciden en algunos datos y difieren en otros.":"Diferencia detectada · consultar una fuente primaria antes de decidir.")+'</div>':'<div class="source-resolution-note"><b>Verificación</b><span>'+esc(data.discrepancy.resolution)+'</span></div>')+'<div class="source-requirement-sheet"><header><strong>Hoja de requisitos · procedencia</strong><span>Áreas con evidencia '+rows.length+'/'+data.requirements.length+'</span></header>'+rows.map(row=>'<article class="source-trace-row"><b>'+esc(row.id)+'</b><span>'+esc(row.text)+'</span>'+badge(row.type)+'<small>'+esc(row.source)+'</small></article>').join("")+'<div class="source-coverage"><i style="--source-coverage:'+(rows.length/data.requirements.length*100)+'%"></i></div></div></div>';
}

export function renderSourceScene(lesson,index=0){
  const data=sourceLessonById(lesson.id)?.visual.sourceScene;if(!data)return '<p class="source-scene-empty">No hay una escena disponible.</p>';
  const renderers={requirement:requirementScene,distance:distanceScene,interview:interviewScene,document:documentScene,index:indexScene,lanes:laneScene,techniques:techniquesScene,traceability:traceabilityScene};
  const markup=renderers[data.kind]?.(data,index)??"";
  return '<div class="sources-scene" data-sources-scene="'+data.kind+'" data-sources-step="'+index+'" role="img" aria-label="'+esc(lesson.title)+'. Escena '+(index+1)+' de '+lesson.visual.steps.length+'">'+markup+'</div>';
}

