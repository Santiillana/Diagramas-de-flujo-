const WIDTH = 190;
const HEIGHT = 52;
const VERTICAL_GAP = 88;
const BRANCH_GAP = 230;

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
      x,y,width:type==="merge"?28:WIDTH,height:type==="merge"?28:(isDecision?82:(type==="for"?64:HEIGHT)),
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
        cursorY+=VERTICAL_GAP;
        continue;
      }
      if (statement.type === "if") {
        const decision=addNode(statement.id,"if",labelFor(statement),x,cursorY,statement.line,statement.source);
        if (!first) first=decision.id;
        connect(previous,decision.id);
        const branchY=cursorY+140;
        const yes=place(statement.thenBody,x-BRANCH_GAP/2,branchY);
        const no=place(statement.elseBody,x+BRANCH_GAP/2,branchY);
        if (yes.entry) connect(decision.id,yes.entry,"V","true");
        if (no.entry) connect(decision.id,no.entry,"F","false");
        const joinY=Math.max(branchY+30,yes.bottom,no.bottom)+55;
        const join=mergeNode(x,joinY);
        connect(yes.exit??decision.id,join.id,"","merge");
        connect(no.exit??decision.id,join.id,"","merge");
        previous=join.id;
        cursorY=joinY+VERTICAL_GAP;
        continue;
      }
      if (statement.type === "while" || statement.type === "for") {
        const loopType=statement.type;
        const loop=addNode(statement.id,loopType,labelFor(statement),x,cursorY,statement.line,statement.source);
        if (!first) first=loop.id;
        connect(previous,loop.id);
        const bodyY=cursorY+145;
        const body=place(statement.body,x,bodyY);
        if (body.entry) connect(loop.id,body.entry,"V","true");
        if (body.exit) connect(body.exit,loop.id,"","back");
        const joinY=Math.max(bodyY+36,cursorY+180,body.bottom+52);
        const join=mergeNode(x+BRANCH_GAP/2,joinY);
        connect(loop.id,join.id,"F","false");
        previous=join.id;
        cursorY=joinY+VERTICAL_GAP;
        continue;
      }
      if (statement.type === "doWhile") {
        const bodyY=cursorY+70;
        const bodyStart=addNode("body-"+statement.id,"body","Ejecutar cuerpo",x,bodyY,statement.line,statement.source);
        if (!first) first=bodyStart.id;
        connect(previous,bodyStart.id);
        const body=place(statement.body,x,bodyY+VERTICAL_GAP,bodyStart.id);
        const checkY=Math.max(bodyY+VERTICAL_GAP,body.bottom+35);
        const decision=addNode(statement.id,"doWhile",labelFor(statement),x,checkY,statement.conditionLine??statement.line,"hm "+statement.condition);
        connect(body.exit??bodyStart.id,decision.id);
        connect(decision.id,bodyStart.id,"V","back");
        const join=mergeNode(x+BRANCH_GAP/2,checkY+110);
        connect(decision.id,join.id,"F","false");
        previous=join.id;
        cursorY=checkY+110+VERTICAL_GAP;
        continue;
      }
    }
    return {entry:first,exit:previous,bottom:cursorY};
  };

  const start=addNode("start","terminal","Inicio",520,36);
  const body=place(program.body,520,145,start.id);
  const endY=Math.max(body.bottom+38,210);
  const end=addNode("end","terminal","Fin",520,endY);
  connect(body.exit??start.id,end.id);
  return {
    nodes,edges,byId,
    width:Math.max(1040,maxX+90),
    height:Math.max(end.y+HEIGHT+60,maxY+60),
    startId:start.id,endId:end.id
  };
}
