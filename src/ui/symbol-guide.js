import { symbolGuideEntries } from "../content/symbol-guide.js";
import { escapeHTML as esc } from "./escape.js";

let dialog=null;
let activeCategory="figures";
let activeTopic="";
let activeQuery="";
let returnFocus=null;

const byId=id=>symbolGuideEntries.find(entry=>entry.id===id);

function iconFor(shape){
 const common='viewBox="0 0 160 86" role="img" aria-hidden="true"';
 const stroke='fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"';
 const shapes={
  terminal:'<rect x="36" y="22" width="88" height="42" rx="21" '+stroke+'/><path d="M80 6v13m0 48v13" '+stroke+'/>',
  parallelogram:'<path d="M45 22h88l-18 42H27z" '+stroke+'/><path d="M80 6v13m0 45v13" '+stroke+'/>',
  rectangle:'<rect x="35" y="22" width="90" height="42" rx="4" '+stroke+'/><path d="M80 6v13m0 45v13" '+stroke+'/>',
  diamond:'<path d="M80 10 130 43 80 76 30 43z" '+stroke+'/><path d="M80 6v4m0 66v4" '+stroke+'/>',
  document:'<path d="M35 22h90v24q-14 16-30 0t-30 0q-14 16-30 0z" '+stroke+'/><path d="M80 6v13m0 53v8" '+stroke+'/>',
  connector:'<circle cx="80" cy="43" r="24" '+stroke+'/><path d="M80 6v13m0 48v13" '+stroke+'/>',
  arrow:'<path d="M20 43h112m-15-14 15 14-15 14" '+stroke+'/><path d="M20 18v50" stroke="currentColor" stroke-width="1" opacity=".18"/>',
  hexagon:'<path d="M48 20h64l19 23-19 23H48L29 43z" '+stroke+'/><path d="M80 6v14m0 46v14" '+stroke+'/>',
  nested:'<rect x="18" y="12" width="124" height="62" rx="7" '+stroke+'/><rect x="43" y="27" width="74" height="32" rx="5" '+stroke+'/><path d="M80 3v9m0 62v9" '+stroke+'/>'
 };
 return '<svg class="guide-symbol-svg" '+common+'>'+(shapes[shape]??shapes.rectangle)+'</svg>';
}

function categoryMarkup(){
 return `
  <div class="symbol-guide-tabs" role="tablist" aria-label="Tipo de guía">
   <button type="button" role="tab" data-guide-category="figures" aria-selected="${activeCategory==="figures"}" class="${activeCategory==="figures"?"is-active":""}">Figuras y conexiones</button>
   <button type="button" role="tab" data-guide-category="cycles" aria-selected="${activeCategory==="cycles"}" class="${activeCategory==="cycles"?"is-active":""}">Ciclos y retornos</button>
  </div>`;
}

function cardMarkup(entry){
 const isActive=entry.id===activeTopic;
 const steps=entry.steps?.map((step,index)=>`<li><span>${index+1}</span><div><b>${esc(step[0])}</b><p>${esc(step[1])}</p></div></li>`).join("")??"";
 return `
  <article class="symbol-guide-card ${isActive?"is-contextual":""}" id="guide-${esc(entry.id)}" data-guide-card="${esc(entry.id)}">
   <div class="symbol-guide-card-visual"><span>${esc(entry.name)}</span>${iconFor(entry.shape)}</div>
   <div class="symbol-guide-card-copy">
    <div class="symbol-guide-card-title"><h3>${esc(entry.title)}</h3>${isActive?'<span class="symbol-guide-context">Tema de esta lección</span>':""}</div>
    <div class="symbol-guide-explanations">
     <section><span>EN PALABRAS SENCILLAS</span><p>${esc(entry.intuitive)}</p></section>
     <section><span>EXPLICACIÓN TÉCNICA</span><p>${esc(entry.technical)}</p></section>
    </div>
    <section class="symbol-guide-use"><span>CUÁNDO Y CÓMO USARLO</span><p>${esc(entry.use)}</p></section>
    <code class="symbol-guide-example">${esc(entry.example)}</code>
    ${steps?'<ol class="symbol-guide-steps">'+steps+'</ol>':""}
   </div>
  </article>`;
}

function renderItems(){
 if(!dialog)return;
 const list=dialog.querySelector("[data-guide-list]");
 if(!list)return;
 const query=activeQuery.trim().toLocaleLowerCase("es");
 const entries=symbolGuideEntries.filter(entry=>entry.category===activeCategory&&
  (!query||[entry.title,entry.name,entry.intuitive,entry.technical,entry.use,entry.example].join(" ").toLocaleLowerCase("es").includes(query)));
 list.innerHTML=entries.length?entries.map(cardMarkup).join(""):'<p class="symbol-guide-empty">No hay conceptos en esta categoría que coincidan con la búsqueda.</p>';
 dialog.querySelectorAll("[data-guide-category]").forEach(button=>{
  const selected=button.dataset.guideCategory===activeCategory;
  button.setAttribute("aria-selected",String(selected));
  button.classList.toggle("is-active",selected);
 });
 const count=dialog.querySelector("[data-guide-count]");
 if(count)count.textContent=entries.length+" conceptos";
}

function chooseTopic(topic){
 const entry=byId(topic);
 activeTopic=entry?.id??"";
 if(entry)activeCategory=entry.category;
}

function openGuide(topic=""){
 returnFocus=document.activeElement;
 chooseTopic(topic);
 activeQuery="";
 const search=dialog.querySelector("[data-guide-search]");
 if(search)search.value="";
 renderItems();
 if(!dialog.open)dialog.showModal();
 requestAnimationFrame(()=>{
  if(activeTopic)dialog.querySelector("#guide-"+CSS.escape(activeTopic))?.scrollIntoView({block:"nearest"});
  dialog.querySelector("[data-guide-search]")?.focus({preventScroll:true});
 });
}

function renderDialog(){
 dialog=document.createElement("dialog");
 dialog.id="symbol-guide-dialog";
 dialog.className="symbol-guide-dialog";
 dialog.setAttribute("aria-labelledby","symbol-guide-title");
 dialog.innerHTML=`
  <div class="symbol-guide-shell">
   <header class="symbol-guide-header">
    <div><p class="eyebrow">AYUDA CONTEXTUAL · TRAZA</p><h2 id="symbol-guide-title">Guía de figuras y ciclos</h2>
     <p>Qué representa cada figura, cuándo usarla y cómo se comporta cada repetición.</p></div>
    <button type="button" class="symbol-guide-close" data-guide-close aria-label="Cerrar guía">×</button>
   </header>
   <div class="symbol-guide-toolbar">
    <label class="symbol-guide-search"><span>BUSCAR EN LA GUÍA</span><input type="search" data-guide-search placeholder="Ej. rombo, retorno, centinela" autocomplete="off"></label>
    <span class="symbol-guide-count" data-guide-count></span>
   </div>
   ${categoryMarkup()}
   <div class="symbol-guide-list" data-guide-list></div>
   <footer class="symbol-guide-footnote">
    <strong>Convención de Traza.</strong> El símbolo compacto de Para resume preparación, condición y avance. No debe confundirse con el flujo de Mientras o Hacer–Mientras, que se dibuja como condición, cuerpo y retorno. La guía describe la notación educativa que implementa esta aplicación y no certifica equivalencia normativa con ISO 5807.
   </footer>
  </div>`;
 document.body.append(dialog);
 dialog.addEventListener("click",event=>{
  if(event.target===dialog||event.target.closest("[data-guide-close]")){dialog.close();return;}
  const tab=event.target.closest("[data-guide-category]");
  if(tab){activeCategory=tab.dataset.guideCategory;activeTopic="";renderItems();}
 });
 dialog.addEventListener("input",event=>{
  if(event.target.matches("[data-guide-search]")){activeQuery=event.target.value;activeTopic="";renderItems();}
 });
 dialog.addEventListener("close",()=>{
  if(returnFocus instanceof HTMLElement&&returnFocus.isConnected)returnFocus.focus();
 });
}

export function initSymbolGuide(){
 if(!document.body)return;
 if(!dialog)renderDialog();
 if(document.documentElement.dataset.symbolGuideBound==="true")return;
 document.documentElement.dataset.symbolGuideBound="true";
 document.addEventListener("click",event=>{
  const trigger=event.target.closest("[data-open-symbol-guide]");
  if(!trigger)return;
  event.preventDefault();
  openGuide(trigger.dataset.guideTopic??"");
 });
}
