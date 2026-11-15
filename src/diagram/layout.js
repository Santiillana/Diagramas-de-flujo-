const WIDTH = 200;
const HEIGHT = 40;
const VERTICAL_GAP = 26;
const BRANCH_GAP = 270;
const nodeHeight = type => type==="terminal"?36:type==="output"?34:type==="if"||type==="while"||type==="doWhile"?60:type==="for"?44:type==="merge"?28:40;

const labelFor = node => {
  if (node.type === "input") return "Leer "+node.variables.join(", ");
  if (node.type === "output") return "Imprimir "+node.expression;
  if (node.type === "assignment") return node.variable+" = "+node.expression;
  if (node.type === "if" || node.type === "while" || node.type === "doWhile") return node.condition;
  if (node.type === "for") return "Para "+node.initial.variable+" · "+node.condition+" · "+node.update.variable+(node.update.operator??"");
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
    const isDecision = ["if","while","doWhile"].includes(type);
    const node = {
      id:String(id),sourceId:typeof id==="number"?id:null,type,label,
      x,y,width:type==="merge"?28:WIDTH,height:nodeHeight(type),
      line,source
    };
    nodes.push(node);
    byId.set(node.id,node);
    maxX=Math.max(maxX,x+node.width/2);
    maxY=Math.max(maxY,y+node.height);
    return node;
  };
  const connect = (from,to,label="",kind="flow") => {
    if (!from || !to) return;
    edges.push({id:"edge-"+edges.length,from:String(from),to:String(to),label,kind});
  };
  const mergeNode = (x,y) => addNode("merge-"+(++synthetic),"merge","Continuar",x,y);
  const place = (statements,x,y,incoming=null) => {
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
        const yes=place(statement.thenBody,x-BRANCH_GAP/2,branchY);
        const no=place(statement.elseBody,x+BRANCH_GAP/2,branchY);
        const joinY=Math.max(branchY+30,yes.bottom,no.bottom)+VERTICAL_GAP;
        const join=mergeNode(x,joinY);
        if (yes.entry) connect(decision.id,yes.entry,"V","true"); else connect(decision.id,join.id,"V","true");
        if (no.entry) connect(decision.id,no.entry,"F","false"); else connect(decision.id,join.id,"F","false");
        if (yes.exit) connect(yes.exit,join.id,"","merge");
        if (no.exit) connect(no.exit,join.id,"","merge");
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
        const body=place(statement.body,x,bodyY);
        if (body.entry) connect(loop.id,body.entry,"V","true");
        if (body.exit) connect(body.exit,loop.id,"","back");
        const joinY=Math.max(bodyY+36,cursorY+loop.height+VERTICAL_GAP+26,body.bottom+VERTICAL_GAP);
        const join=mergeNode(x+BRANCH_GAP/2,joinY);
        connect(loop.id,join.id,"F","false");
        previous=join.id;
        cursorY=joinY+VERTICAL_GAP;
        continue;
      }
      if (statement.type === "doWhile") {
        const bodyY=cursorY+VERTICAL_GAP;
        const bodyStart=addNode("body-"+statement.id,"body","Ejecutar cuerpo",x,bodyY,statement.line,statement.source);
        if (!first) first=bodyStart.id;
        connect(previous,bodyStart.id);
        const body=place(statement.body,x,bodyY+VERTICAL_GAP,bodyStart.id);
        const checkY=Math.max(bodyY+bodyStart.height+VERTICAL_GAP,body.bottom+VERTICAL_GAP);
        const decision=addNode(statement.id,"doWhile",labelFor(statement),x,checkY,statement.conditionLine??statement.line,"hm "+statement.condition);
        connect(body.exit??bodyStart.id,decision.id);
        connect(decision.id,bodyStart.id,"V","back");
        const joinY=checkY+decision.height+VERTICAL_GAP;
        const join=mergeNode(x+BRANCH_GAP/2,joinY);
        connect(decision.id,join.id,"F","false");
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
  return {
    nodes,edges,byId,
    width:Math.max(1040,maxX+90),
    height:Math.max(end.y+end.height+60,maxY+60),
    startId:start.id,endId:end.id
  };
}
