export const EMPTY_PROGRESS = Object.freeze({
  version:2,exercises:{},failed:[],streak:{current:0,lastDay:null}
});

export function normalizeProgress(value) {
  if(!value||typeof value!=="object"||value.version!==2||!value.exercises||typeof value.exercises!=="object") {
    return {version:2,exercises:{},failed:[],streak:{current:0,lastDay:null}};
  }
  return {
    version:2,
    exercises:value.exercises,
    failed:Array.isArray(value.failed)?value.failed.filter(item=>
      item&&Number.isInteger(item.exerciseId)&&typeof item.mode==="string"
    ):[],
    streak:value.streak&&Number.isInteger(value.streak.current)&&
      (value.streak.lastDay===null||typeof value.streak.lastDay==="string")
      ? value.streak : {current:0,lastDay:null}
  };
}

export function recordLabResult(progress,{exerciseId,mode,correct,hints=0}) {
  const next=normalizeProgress(progress);
  const key=String(exerciseId);
  const exercise=next.exercises[key]??(next.exercises[key]={});
  const previous=exercise[mode]??{stars:0,attempts:0,completed:false};
  const stars=correct?Math.max(previous.stars,Math.max(1,3-Math.max(0,Math.min(2,hints)))):previous.stars;
  exercise[mode]={stars,attempts:previous.attempts+1,completed:previous.completed||Boolean(correct)};
  next.failed=next.failed.filter(item=>!(item.exerciseId===exerciseId&&item.mode===mode));
  if(!correct)next.failed.push({exerciseId,mode});
  return next;
}

export function modeStars(progress,exerciseId,mode) {
  const value=normalizeProgress(progress).exercises[String(exerciseId)]?.[mode]?.stars;
  return Number.isInteger(value)?Math.max(0,Math.min(3,value)):0;
}

export function mixedModeOrder(exerciseId,attempt=0,available=["predict","table","order","symbol","error","whatif","fill-gap","follow-arrow"]) {
  let seed=((Number(exerciseId)||0)*1103515245+(Number(attempt)||0)*12345)>>>0;
  const list=[...available];
  for(let index=list.length-1;index>0;index--){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const swap=seed%(index+1);
    [list[index],list[swap]]=[list[swap],list[index]];
  }
  for(let index=1;index<list.length;index++){
    if(list[index]===list[index-1]){
      const next=(index+1)%list.length;
      [list[index],list[next]]=[list[next],list[index]];
    }
  }
  return list;
}
