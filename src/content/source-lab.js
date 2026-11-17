import { sourceCoverage, sourceScenarios } from "./source-scenarios.js";

export const sourceLabMechanics=Object.freeze(["classify","match","order","error","whatif","fill-gap"]);
export const sourceLabMeta=Object.freeze({
  classify:{label:"Clasifica",family:"Observa",icon:"◉",description:"Ubica una fuente primaria, secundaria o terciaria."},
  match:{label:"Relaciona",family:"Observa",icon:"⇄",description:"Empareja una técnica con el tipo de fuente que produce."},
  order:{label:"Ordena",family:"Construye",icon:"↕",description:"Organiza los pasos de una recolección confiable."},
  "fill-gap":{label:"Completa el hueco",family:"Construye",icon:"＿",description:"Completa la procedencia o la técnica que falta."},
  error:{label:"Encuentra el error",family:"Investiga",icon:"⌕",description:"Detecta una clasificación o técnica inadecuada."},
  whatif:{label:"¿Y si…?",family:"Investiga",icon:"¿…?",description:"Elige una fuente alternativa y evalúa su cobertura."}
});

const techniques=[
  {label:"Entrevista directa",type:"P",why:"La información se obtiene directamente de la persona consultada."},
  {label:"Encuesta a usuarios",type:"P",why:"Las respuestas se recogen de primera mano."},
  {label:"Observación del proceso",type:"P",why:"Se registra directamente lo que ocurre."},
  {label:"Revisión de un manual vigente",type:"S",why:"El manual organiza información ya documentada."},
  {label:"Consulta de un registro histórico",type:"S",why:"El registro conserva datos reunidos previamente."},
  {label:"Búsqueda en un índice temático",type:"T",why:"El índice ayuda a localizar fuentes, pero no suele aportar evidencia directa."}
];
const typeNames={P:"Primaria",S:"Secundaria",T:"Terciaria"};
const hash=value=>{let n=2166136261;for(const c of String(value))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
const pick=(items,seed)=>items[hash(seed)%items.length];
const shuffle=(items,seed)=>{const out=[...items];let n=hash(seed);for(let i=out.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;};
const sourcePool=()=>sourceScenarios.flatMap(s=>s.sources.map(source=>({...source,scenario:s.title})));

export function buildSourceLabChallenge(mechanic,seed="fuentes",round=0){
  if(!sourceLabMechanics.includes(mechanic))throw new RangeError(`Mecánica de fuentes desconocida: ${mechanic}`);
  const key=`${seed}:${mechanic}:${round}`,sources=sourcePool(),source=pick(sources,key);
  const options=(answer,others)=>shuffle([{id:"correct",label:answer,correct:true},...others.map((label,index)=>({id:`option-${index}`,label,correct:false}))],key+":options");
  const base={id:`source-${mechanic}-${hash(key).toString(36)}`,mechanic,mechanicLabel:sourceLabMeta[mechanic].label};
  if(mechanic==="classify")return {...base,kind:"choice",sourceTitle:source.title,sourceType:source.type,question:`¿Cómo se clasifica “${source.title}”?`,options:options(typeNames[source.type],["Primaria","Secundaria","Terciaria"].filter(x=>x!==typeNames[source.type])),explanation:`Es una fuente ${typeNames[source.type].toLowerCase()}. ${source.limitation}` ,hint:"Piensa quién produjo la información y cuántos pasos la separan de la experiencia original."};
  if(mechanic==="match"){
    const technique=pick(techniques,key+":technique");
    return {...base,kind:"choice",question:`¿Qué tipo de fuente produce normalmente esta técnica: ${technique.label.toLowerCase()}?`,options:options(typeNames[technique.type],["Primaria","Secundaria","Terciaria"].filter(x=>x!==typeNames[technique.type])),explanation:technique.why,hint:"Distingue entre evidencia directa, información documentada y herramientas para encontrarla."};
  }
  if(mechanic==="order"){
    const canonical=[{id:"question",label:"Precisar qué requisito se necesita comprender."},{id:"source",label:"Elegir personas, documentos o registros pertinentes."},{id:"collect",label:"Aplicar la técnica y registrar la procedencia."},{id:"verify",label:"Contrastar hallazgos y anotar límites de la evidencia."}];
    return {...base,kind:"order",question:"Ordena estos pasos para recolectar y valorar evidencia.",items:shuffle(canonical,key+":steps"),answer:canonical.map(x=>x.id),explanation:"Una pregunta delimitada orienta la selección; registrar y contrastar la evidencia permite valorar su alcance.",hint:"Primero define qué necesitas saber; al final contrasta lo encontrado."};
  }
  if(mechanic==="error"){
    const wrong=typeNames[source.type]==="Primaria"?"Secundaria":"Primaria";
    const correct=`${source.title} — ${typeNames[source.type]}`;
    const distractors=[`${source.title} — ${wrong}`,`${pick(sources.filter(s=>s.id!==source.id),key+":other").title} — ${typeNames[pick(sources.filter(s=>s.id!==source.id),key+":other").type]}`];
    return {...base,kind:"choice",question:"Señala la clasificación que contiene un error.",options:options(`${source.title} — ${wrong}`,distractors.filter(x=>x!==`${source.title} — ${wrong}`).concat(correct)),explanation:`“${source.title}” se clasifica aquí como ${typeNames[source.type].toLowerCase()}, porque ${source.contribution.toLowerCase()}`,hint:"Una entrevista, observación o encuesta directa suele ser primaria; revisa quién produjo la información."};
  }
  if(mechanic==="whatif"){
    const scenario=pick(sourceScenarios,key+":scenario"),primary=pick(scenario.sources.filter(s=>s.type==="P"&&s.requirementIds.length),key+":primary");
    const requirementId=primary.requirementIds[0],requirement=scenario.requirements.find(item=>item.id===requirementId),secondary=pick(scenario.sources.filter(s=>s.type==="S"),key+":secondary");
    const after={...scenario,sources:scenario.sources.map(item=>item.id===secondary.id?{...item,requirementIds:[...new Set([...item.requirementIds,requirementId])]}:item),requirements:scenario.requirements.map(item=>item.id===requirementId?{...item,sourceId:secondary.id}:item)};
    const beforeCoverage=sourceCoverage(scenario),afterCoverage=sourceCoverage(after),answer=`Usar ${secondary.title}`;
    return {...base,kind:"choice",question:`En “${scenario.title}”, la fuente “${primary.title}” no está disponible para investigar “${requirement.text}”. ¿Qué alternativa documentada permite continuar?`,options:options(answer,[`Esperar sin avanzar`,`Usar ${pick(scenario.sources.filter(s=>s.type==="T"),key+":tertiary").title}`]),explanation:`La cobertura de requisitos se mantiene en ${afterCoverage.coveredAreas}/${afterCoverage.totalAreas} áreas; la evidencia primaria verificada cambia de ${beforeCoverage.primaryVerified} a ${afterCoverage.primaryVerified} áreas. “${secondary.title}” permite avanzar, aunque conviene validar su vigencia y contrastar luego con una fuente primaria.`,hint:"Elige una fuente secundaria vinculada al requisito; después revisa qué cobertura conserva y qué queda por verificar."};
  }
  return {...base,kind:"choice",question:`La fuente es “${source.title}”. ¿Qué etiqueta completa correctamente su procedencia?`,options:options(typeNames[source.type],["Primaria","Secundaria","Terciaria"].filter(x=>x!==typeNames[source.type])),explanation:`La etiqueta correcta es ${typeNames[source.type]}. ${source.contribution} Su límite es: ${source.limitation}`,hint:"La procedencia depende de cómo se produjo la información, no solo del formato en que se consulta."};
}
