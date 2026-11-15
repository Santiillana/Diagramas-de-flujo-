const SPACE_META = {
  learn: { title: "Aprende", description: "Comprende cada figura, decisión y ciclo con ejemplos y escenas propias." },
  exercises: { title: "Ejercicios", description: "Elige un problema y revisa qué necesitas para resolverlo." },
  simulator: { title: "Simulador", description: "Observa el algoritmo paso a paso y entiende cada cambio." },
  lab: { title: "Laboratorio", description: "Sigue la ficha, arma diagramas y encuentra errores." }
};

export function initNavigation() {
  const nav=document.querySelector("#primary-nav");
  const views=[...document.querySelectorAll("[data-view]")];
  const buttons=[...document.querySelectorAll("#primary-nav [data-space]")];
  if(!nav||!views.length||!buttons.length)return;
  function activate(space,options={}) {
    if(space==="builder")space="lab";
    const meta=SPACE_META[space];
    const target=views.find(view=>view.dataset.view===space);
    if(!meta||!target)return;
    for(const view of views)view.hidden=view!==target;
    for(const button of buttons){
      const active=button.dataset.space===space;
      button.classList.toggle("is-active",active);
      button.setAttribute("aria-current",active?"page":"false");
    }
    document.body.dataset.activeSpace=space;
    document.title=meta.title+" · Traza";
    if(options.focus){
      const heading=target.querySelector("h2,h3");
      heading?.setAttribute("tabindex","-1");
      heading?.focus({preventScroll:true});
    }
    document.dispatchEvent(new CustomEvent("traza:space-change",{detail:{space}}));
  }
  for(const button of buttons){
    button.addEventListener("click",()=>activate(button.dataset.space));
  }
  nav.addEventListener("keydown",event=>{
    if(!["ArrowRight","ArrowLeft","Home","End"].includes(event.key))return;
    const current=buttons.indexOf(document.activeElement);
    if(current<0)return;
    event.preventDefault();
    const next=event.key==="Home"?0:event.key==="End"?buttons.length-1:
      event.key==="ArrowRight"?(current+1)%buttons.length:(current-1+buttons.length)%buttons.length;
    buttons[next].focus();
    activate(buttons[next].dataset.space);
  });
  document.addEventListener("click",event=>{
    const shortcut=event.target.closest("[data-go]");
    if(!shortcut)return;
    const space=shortcut.dataset.go==="builder"?"lab":shortcut.dataset.go;
    if(!SPACE_META[space])return;
    activate(space,{focus:true});
    buttons.find(button=>button.dataset.space===space)?.focus({preventScroll:true});
  });
  activate("exercises");
}
