const VERTICAL_GAP = 26;
const BRANCH_GAP = 360;
const MIN_NODE_WIDTH = 120;
const MAX_NODE_WIDTH = 220;
const nodeHeight = type => type==="terminal"?48:type==="merge"?28:48;

const visualOperators = value => String(value??"").replace(/<>|!=/g,"≠").replace(/>=/g,"≥").replace(/<=/g,"≤").replace(/\*/g,"×").replace(/\//g,"÷");
const charWidth = char => /[ilI.,:;'!|]/.test(char)?4:/[MW@%]/.test(char)?12:/[A-ZÁÉÍÓÚÑ0-9]/.test(char)?9:char===" "?5:8;
function measure(text){return [...String(text)].reduce((width,char)=>width+charWidth(char),0);}
function wrapLabel(label,maxWidth){
  const lines=[];let line="";
  for(const word of String(label??"").split(/\s+/)){
    if(!line){line=word;continue;}
    if(measure(line+" "+word)<=maxWidth){line+=" "+word;continue;}
    lines.push(line);line=word;
  }
  if(line)lines.push(line);
  return lines.flatMap(part=>measure(part)<=maxWidth?[part]:[...part].reduce((chunks,char)=>{
    const last=chunks.at(-1)??"";
    if(measure(last+char)>maxWidth)chunks.push(char);else chunks[chunks.length-1]=last+char;
    return chunks;
  },[""]).filter(Boolean));
}

const labelFor = node => {
  if (node.type === "input") return "Leer "+node.variables.join(", ");
  if (node.type === "output") return "Imprimir "+visualOperators(node.expression);
  if (node.type === "assignment") return node.variable+" = "+visualOperators(node.expression);
  if (node.type === "if" || node.type === "while" || node.type === "doWhile") return "¿"+visualOperators(node.condition)+"?";
  if (node.type === "for") return [node.initial.variable+" = "+visualOperators(node.initial.expression),visualOperators(node.condition),node.update.kind==="step"?node.update.variable+node.update.operator:visualOperators(node.update.variable+" = "+node.update.expression)].join("; ");
  return node.source;
};

export function layoutFlow(program) {
  const nodes = [];
  const edges = [];
  const byId = new Map();
  let synthetic = 0;
  let maxX = 0;
  let maxY = 0;
  const addNode = (id,type,label,x,y,line=null,source="") => {
    const lines=wrapLabel(label,type==="if"||type==="while"||type==="doWhile"||type==="for"?138:188);
    const width=Math.max(type==="for"?160:MIN_NODE_WIDTH,Math.min(MAX_NODE_WIDTH,Math.ceil(Math.max(...lines.map(measure),0)+(type==="for"?48:32))));
    const height=type==="merge"?28:type==="terminal"?48:type==="if"||type==="while"||type==="doWhile"||type==="for"?Math.max(72,lines.length*24+48):Math.max(48,lines.length*20+24);
    const node = {
      id:String(id),sourceId:typeof id==="number"?id:null,type,label,
      labelLines:lines,labelParts:type==="for"?String(label).split("; "):null,
      x,y,width:type==="merge"?28:width,height,
      line,source
    };
    nodes.push(node);
    byId.set(node.id,node);
    maxX=Math.max(maxX,x+node.width/2);
    maxY=Math.max(maxY,y+node.height);
    return node;
  };
  const connect = (from,to,label="",kind="flow",routeLane=0) => {
    if (!from || !to) return;
    edges.push({id:"edge-"+edges.length,from:String(from),to:String(to),label,kind,routeLane});
  };
  const mergeNode = (x,y) => addNode("merge-"+(++synthetic),"merge","Continuar",x,y);
  const place = (statements,x,y,incoming=null,loopDepth=0,branchDepth=0) => {
    let previous = incoming;
    let first = null;
    let cursorY = y;
    for (const statement of statements) {
      if (["input","output","assignment"].includes(statement.type)) {
        const node=addNode(statement.id,statement.type,labelFor(statement),x,cursorY,statement.line,statement.source);
        if (!first) first=node.id;
        connect(previous,node.id);
        previous=node.id;
        cursorY+=node.height+VERTICAL_GAP;
        continue;
      }
      if (statement.type === "if") {
        const decision=addNode(statement.id,"if",labelFor(statement),x,cursorY,statement.line,statement.source);
        if (!first) first=decision.id;
        connect(previous,decision.id);
        const branchY=cursorY+decision.height+VERTICAL_GAP;
        const yes=place(statement.thenBody,x-BRANCH_GAP/2,branchY,null,loopDepth,branchDepth+1);
        const no=place(statement.elseBody,x+BRANCH_GAP/2,branchY,null,loopDepth,branchDepth+1);
        const joinY=Math.max(branchY+30,yes.bottom,no.bottom)+VERTICAL_GAP;
        const join=mergeNode(x,joinY);
        if (yes.entry) connect(decision.id,yes.entry,"V","true"); else connect(decision.id,join.id,"V","true");
        if (no.entry) connect(decision.id,no.entry,"F","false"); else connect(decision.id,join.id,"F","false",loopDepth+branchDepth);
        if (yes.exit) connect(yes.exit,join.id,"","merge",loopDepth+branchDepth+1);
        if (no.exit) connect(no.exit,join.id,"","merge",loopDepth+branchDepth+1);
        previous=join.id;
        cursorY=joinY+VERTICAL_GAP;
        continue;
      }
      if (statement.type === "while" || statement.type === "for") {
        const loopType=statement.type;
        const loop=addNode(statement.id,loopType,labelFor(statement),x,cursorY,statement.line,statement.source);
        if (!first) first=loop.id;
        connect(previous,loop.id);
        const bodyY=cursorY+loop.height+VERTICAL_GAP;
        const body=place(statement.body,x,bodyY,null,loopDepth+1,branchDepth);
        if (body.entry) connect(loop.id,body.entry,"V","true");
        if (body.exit) connect(body.exit,loop.id,"","back",loopDepth+branchDepth);
        const joinY=Math.max(bodyY+36,cursorY+loop.height+VERTICAL_GAP+26,body.bottom+VERTICAL_GAP);
        const join=mergeNode(x+BRANCH_GAP/2,joinY);
        connect(loop.id,join.id,"F","false",loopDepth+branchDepth);
        previous=join.id;
        cursorY=joinY+VERTICAL_GAP;
        continue;
      }
      if (statement.type === "doWhile") {
        const bodyY=cursorY+VERTICAL_GAP;
        const bodyStart=addNode("body-"+statement.id,"body","Ejecutar cuerpo",x,bodyY,statement.line,statement.source);
        if (!first) first=bodyStart.id;
        connect(previous,bodyStart.id);
        const body=place(statement.body,x,bodyY+VERTICAL_GAP,bodyStart.id,loopDepth+1,branchDepth);
        const checkY=Math.max(bodyY+bodyStart.height+VERTICAL_GAP,body.bottom+VERTICAL_GAP);
        const decision=addNode(statement.id,"doWhile",labelFor(statement),x,checkY,statement.conditionLine??statement.line,"hm "+statement.condition);
        connect(body.exit??bodyStart.id,decision.id);
        connect(decision.id,bodyStart.id,"V","back",loopDepth+branchDepth);
        const joinY=checkY+decision.height+VERTICAL_GAP;
        const join=mergeNode(x+BRANCH_GAP/2,joinY);
        connect(decision.id,join.id,"F","false",loopDepth+branchDepth);
        previous=join.id;
        cursorY=joinY+join.height+VERTICAL_GAP;
        continue;
      }
    }
    return {entry:first,exit:previous,bottom:cursorY};
  };

  const start=addNode("start","terminal","Inicio",520,10);
  const body=place(program.body,520,start.y+start.height+VERTICAL_GAP,start.id);
  const endY=Math.max(body.bottom+VERTICAL_GAP,150);
  const end=addNode("end","terminal","Fin",520,endY);
  connect(body.exit??start.id,end.id);
  const minNodeX=Math.min(...nodes.map(node=>node.x-node.width/2));
  const maxLane=Math.max(0,...edges.map(edge=>edge.routeLane??0));
  const shiftX=48+maxLane*24-minNodeX;
  if(shiftX)for(const node of nodes)node.x+=shiftX;
  const right=Math.max(...nodes.map(node=>node.x+node.width/2));
  return {
    nodes,edges,byId,maxRouteLane:maxLane,
    width:Math.max(160,right+48+maxLane*24),
    height:Math.max(end.y+end.height+60,maxY+60),
    startId:start.id,endId:end.id
  };
}
