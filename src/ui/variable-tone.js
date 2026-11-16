const TONE_COUNT=6;

/* Hash estable: el mismo nombre de variable conserva el mismo acento entre pasos. */
export function variableTone(name){
  const value=String(name??"");
  let hash=2166136261;
  for(let index=0;index<value.length;index++){
    hash=Math.imul(hash^value.charCodeAt(index),16777619);
  }
  return "variable-tone-"+((hash>>>0)%TONE_COUNT+1);
}
