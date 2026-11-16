export const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[ch]));

export const displayValue = value => escapeHTML(typeof value === "number" ? String(Number(value.toFixed(6))) : String(value ?? "—"));

export function variableCards(variables) {
  const entries = Object.entries(variables ?? {});
  if (!entries.length) return '<span class="scene-empty-memory">Memoria vacía</span>';
  return entries.map(([name,value]) =>
    '<span class="scene-memory-value"><b>'+escapeHTML(name)+'</b><strong>'+displayValue(value)+'</strong></span>'
  ).join("");
}

export function routeLabel(route) {
  return route === "V" ? "V · Verdadero" : route === "F" ? "F · Falso" : "Sin ruta";
}

export function substituteExpression(expression,variables={}) {
  let result=String(expression??"");
  for(const [name,value] of Object.entries(variables).sort(([a],[b])=>b.length-a.length)){
    const safe=name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    result=result.replace(new RegExp("\\b"+safe+"\\b","g"),String(value??""));
  }
  return result;
}

export function loopTrack(stages,activeIndex,completedIndices=null) {
  const completed=new Set(completedIndices??stages.map((_,index)=>index).filter(index=>index<activeIndex));
  return '<div class="scene-loop-track" role="img" aria-label="Fases del ciclo">'+
    stages.map((label,index)=>'<div class="scene-loop-step '+(index===activeIndex?'is-active':completed.has(index)?'is-complete':'')+'"><i aria-hidden="true"></i><span>'+escapeHTML(label)+'</span></div>').join('')+
    '</div>';
}
