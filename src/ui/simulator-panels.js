const STORAGE_KEY="traza-simulator-panels-v1";
const PANEL_SELECTOR="[data-floating-panel]";
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function readState(){
  try{
    const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");
    return value&&typeof value==="object"&&!Array.isArray(value)?value:{};
  }catch{return{};}
}
function getPosition(panel){
  return{
    x:Number.parseFloat(panel.style.getPropertyValue("--panel-drag-x"))||0,
    y:Number.parseFloat(panel.style.getPropertyValue("--panel-drag-y"))||0
  };
}
function setPosition(panel,pos){
  panel.style.setProperty("--panel-drag-x",pos.x+"px");
  panel.style.setProperty("--panel-drag-y",pos.y+"px");
}
function dispatchPanelChange(grid){
  grid.dispatchEvent(new CustomEvent("traza:panels-changed",{bubbles:true,detail:{hidden:grid.classList.contains("panels-hidden")}}));
}
function syncTopbarHeight(){
  const topbar=document.querySelector(".topbar");
  if(topbar)document.documentElement.style.setProperty("--simulator-topbar-height",Math.max(0,topbar.getBoundingClientRect().bottom)+"px");
}
export function initSimulatorPanels(){
  const grid=document.querySelector("#simulator-grid");
  const toggle=document.querySelector("#simulator-panels-toggle");
  if(!grid||!toggle)return;
  const panels=[...grid.querySelectorAll(PANEL_SELECTOR)];
  const state=readState();
  function saveState(){
    const panelState={};
    for(const panel of panels)panelState[panel.dataset.floatingPanel]={
      hidden:panel.hidden,collapsed:panel.classList.contains("is-panel-collapsed"),position:getPosition(panel)
    };
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify({allHidden:grid.classList.contains("panels-hidden"),panels:panelState}));}catch{}
  }
  function updateToggle(){
    const visible=!grid.classList.contains("panels-hidden")&&panels.some(panel=>!panel.hidden);
    toggle.setAttribute("aria-expanded",String(visible));
    toggle.setAttribute("aria-label",visible?"Ocultar todos los paneles":"Mostrar todos los paneles");
    toggle.title=visible?"Ocultar todos los paneles (H)":"Mostrar todos los paneles (H)";
  }
  function toggleAllPanels(){
    const anyVisible=!grid.classList.contains("panels-hidden")&&panels.some(panel=>!panel.hidden);
    if(anyVisible)grid.classList.add("panels-hidden");
    else{grid.classList.remove("panels-hidden");panels.forEach(panel=>{panel.hidden=false;});}
    updateToggle();saveState();dispatchPanelChange(grid);
  }
  function syncResponsivePanels(){
    const tabletLandscape=innerWidth>760&&innerWidth<=1100;
    for(const panel of panels){
      if(panel.dataset.userExpanded==="true")continue;
      panel.classList.toggle("is-auto-collapsed",tabletLandscape&&panel.dataset.floatingPanel!=="history");
    }
    syncTopbarHeight();dispatchPanelChange(grid);
  }
  function applySavedState(){
    for(const panel of panels){
      const saved=state.panels?.[panel.dataset.floatingPanel];
      if(!saved||typeof saved!=="object")continue;
      panel.hidden=saved.hidden===true;
      panel.classList.toggle("is-panel-collapsed",saved.collapsed===true);
      if(typeof saved.collapsed==="boolean")panel.dataset.userExpanded="true";
      if(saved.position&&Number.isFinite(saved.position.x)&&Number.isFinite(saved.position.y)){
        setPosition(panel,{x:clamp(saved.position.x,-innerWidth,innerWidth),y:clamp(saved.position.y,-innerHeight,innerHeight)});
      }
    }
    grid.classList.toggle("panels-hidden",state.allHidden===true);updateToggle();
  }
  grid.addEventListener("click",event=>{
    const hide=event.target.closest("[data-panel-hide]");
    if(hide&&grid.contains(hide)){
      const panel=panels.find(item=>item.dataset.floatingPanel===hide.dataset.panelHide);
      if(!panel)return;
      panel.hidden=true;saveState();updateToggle();dispatchPanelChange(grid);return;
    }
    const collapse=event.target.closest("[data-panel-collapse]");
    if(!collapse||!grid.contains(collapse))return;
    const panel=panels.find(item=>item.dataset.floatingPanel===collapse.dataset.panelCollapse);
    if(!panel)return;
    const collapsed=panel.classList.toggle("is-panel-collapsed");
    panel.classList.remove("is-auto-collapsed");panel.dataset.userExpanded="true";
    collapse.setAttribute("aria-expanded",String(!collapsed));
    collapse.setAttribute("aria-label",(collapsed?"Expandir ":"Contraer ")+panel.dataset.floatingPanel);
    collapse.title=collapsed?"Expandir panel":"Contraer panel";collapse.textContent=collapsed?"+":"−";
    saveState();updateToggle();dispatchPanelChange(grid);
  });
  toggle.addEventListener("click",toggleAllPanels);
  document.addEventListener("keydown",event=>{
    if(document.body.dataset.activeSpace!=="simulator"||event.altKey||event.ctrlKey||event.metaKey)return;
    const target=event.target;
    if(target instanceof HTMLElement&&(target.isContentEditable||/^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)))return;
    if(event.key.toLowerCase()==="h"){event.preventDefault();toggleAllPanels();}
  });
  for(const panel of panels){
    const handle=panel.querySelector("[data-panel-drag-handle]");
    if(!handle)continue;
    handle.addEventListener("pointerdown",event=>{
      if(innerWidth<=760||event.button!==0||event.target.closest("button,input,select,a"))return;
      const gridBounds=grid.getBoundingClientRect(),panelBounds=panel.getBoundingClientRect();
      const initial=getPosition(panel),origin={x:event.clientX,y:event.clientY},pointerId=event.pointerId;
      handle.setPointerCapture(pointerId);panel.classList.add("is-dragging");event.preventDefault();
      const move=moveEvent=>{
        if(moveEvent.pointerId!==pointerId)return;
        const dx=moveEvent.clientX-origin.x,dy=moveEvent.clientY-origin.y;
        const minX=gridBounds.left+6-panelBounds.left,maxX=gridBounds.right-6-panelBounds.right;
        const minY=gridBounds.top+6-panelBounds.top,maxY=gridBounds.bottom-6-panelBounds.bottom;
        setPosition(panel,{x:initial.x+clamp(dx,minX,maxX),y:initial.y+clamp(dy,minY,maxY)});
        dispatchPanelChange(grid);
      };
      const finish=finishEvent=>{
        if(finishEvent.pointerId!==pointerId)return;
        panel.classList.remove("is-dragging");
        handle.removeEventListener("pointermove",move);handle.removeEventListener("pointerup",finish);handle.removeEventListener("pointercancel",finish);
        saveState();dispatchPanelChange(grid);
      };
      handle.addEventListener("pointermove",move);handle.addEventListener("pointerup",finish);handle.addEventListener("pointercancel",finish);
    });
  }
  applySavedState();syncResponsivePanels();window.addEventListener("resize",syncResponsivePanels);
  const topbar=document.querySelector(".topbar");
  if(topbar&&"ResizeObserver"in window){const observer=new ResizeObserver(syncTopbarHeight);observer.observe(topbar);}
}
