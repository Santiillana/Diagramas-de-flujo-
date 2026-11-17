function hashSeed(parts) {
  const source=parts.join(":");
  let hash=2166136261;
  for(let index=0;index<source.length;index++){
    hash^=source.charCodeAt(index);
    hash=Math.imul(hash,16777619);
  }
  return hash>>>0;
}

function randomGenerator(seed) {
  let state=seed>>>0;
  return ()=>{
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    return state/4294967296;
  };
}

function shuffled(items,seed) {
  const output=[...items],random=randomGenerator(seed);
  for(let index=output.length-1;index>0;index--){
    const swap=Math.floor(random()*(index+1));
    [output[index],output[swap]]=[output[swap],output[index]];
  }
  return output;
}

export function buildGapChallenge(exerciseId,methodIndex,source,attempt=0) {
  const lines=String(source??"").split("|");
  const candidates=lines.map((line,index)=>{
    const match=/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s*$/.exec(line);
    if(!match||/^leer\b|^imp\b/i.test(line.trim()))return null;
    return {index,line,variable:match[1],answer:match[2]};
  }).filter(Boolean);
  if(!candidates.length)return null;
  const seed=hashSeed([exerciseId,methodIndex,attempt,"gap"]);
  const selected=candidates[Math.floor(randomGenerator(seed)()*candidates.length)];
  return {...selected,seed,lines,maskedLines:lines.map((line,index)=>index===selected.index?selected.variable+" = __HUECO__":line)};
}

export function buildArrowChallenge(events,index,exerciseId,attempt=0) {
  const current=events[index];
  if(!current)return null;
  const next=events.slice(index+1).find(event=>event.nodeId!==null&&event.nodeId!==undefined&&
    (current.nodeId===null||current.nodeId===undefined||String(event.nodeId)!==String(current.nodeId)));
  if(!next)return null;
  const unique=new Map();
  for(const event of events){
    if(event.nodeId===null||event.nodeId===undefined||String(event.nodeId)===String(next.nodeId))continue;
    if(!unique.has(String(event.nodeId))){
      unique.set(String(event.nodeId),{
        nodeId:event.nodeId,
        label:event.sourceText||event.scene?.title||"Instrucción",
        sourceLine:event.sourceLine
      });
    }
  }
  const correct={
    nodeId:next.nodeId,
    label:next.sourceText||next.scene?.title||"Siguiente instrucción",
    sourceLine:next.sourceLine
  };
  const seed=hashSeed([exerciseId,index,attempt,"arrow"]);
  const distractors=shuffled([...unique.values()],seed).slice(0,3);
  const options=shuffled([correct,...distractors],seed^0x9e3779b9).map(option=>({
    ...option,correct:String(option.nodeId)===String(correct.nodeId)
  }));
  return {seed,current,next,correct,options};
}

const symbolMatches=[
  {id:"input",left:"Leer datos",right:"Paralelogramo"},
  {id:"process",left:"Asignar o calcular",right:"Rectángulo"},
  {id:"decision",left:"Evaluar una condición",right:"Rombo"},
  {id:"terminal",left:"Indicar inicio o fin",right:"Óvalo"},
  {id:"for",left:"Repetir un número fijo de veces",right:"Hexágono"},
  {id:"output",left:"Mostrar un resultado",right:"Documento de salida"}
];
export function buildMatchChallenge(exerciseId,methodIndex=0,attempt=0){
  const seed=hashSeed([exerciseId,methodIndex,attempt,"match"]);
  return {
    seed,
    left:shuffled(symbolMatches,seed).map(({id,left})=>({id,label:left})),
    right:shuffled(symbolMatches,seed^0x85ebca6b).map(({id,right})=>({id,label:right}))
  };
}


export function mixedModeOrder(exerciseId,attempt=0,modes=["predict","order","symbol","error","fill-gap","follow-arrow"]) {
  const available=[...new Set(modes)].filter(Boolean);
  if(!available.length)return [];
  return shuffled(available,hashSeed([exerciseId,attempt,"mixed-modes"]));
}
