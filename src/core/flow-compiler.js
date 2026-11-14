import { parsePseudocode } from "./parser.js";

const NODE_TYPES = new Set(["start","end","input","process","output","decision","for","while","doWhile"]);
const ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;
let sequence = 0;

export function makeNode(type, values = {}) {
  sequence++;
  const id = values.id ?? "node-"+sequence;
  const defaults = {
    start:{}, end:{},
    input:{variables:"x"},
    process:{variable:"y",expression:"x*2"},
    output:{expression:"y"},
    decision:{condition:"x>0",trueBranch:[],falseBranch:[]},
    for:{initial:"i=1",condition:"i<=3",update:"i++",body:[]},
    while:{condition:"i<=3",body:[]},
    doWhile:{condition:"i<3",body:[]}
  };
  if (!NODE_TYPES.has(type)) throw new TypeError("Tipo de símbolo desconocido: "+type);
  return {id,type,...defaults[type],...values};
}

export function createFlowPreset(kind = "sequence") {
  const start=makeNode("start",{id:"start"});
  const end=makeNode("end",{id:"end"});
  const nodes = {
    sequence:[
      makeNode("input",{variables:"x"}),
      makeNode("process",{variable:"doble",expression:"x*2"}),
      makeNode("output",{expression:"doble"})
    ],
    decision:[
      makeNode("input",{variables:"n"}),
      makeNode("decision",{condition:"n>0",
        trueBranch:[makeNode("output",{expression:"1"})],
        falseBranch:[makeNode("output",{expression:"0"})]})
    ],
    for:[
      makeNode("process",{variable:"suma",expression:"0"}),
      makeNode("for",{initial:"i=1",condition:"i<=4",update:"i++",
        body:[makeNode("process",{variable:"suma",expression:"suma+i"})]}),
      makeNode("output",{expression:"suma"})
    ],
    while:[
      makeNode("process",{variable:"i",expression:"1"}),
      makeNode("while",{condition:"i<=3",body:[
        makeNode("output",{expression:"i"}),
        makeNode("process",{variable:"i",expression:"i+1"})
      ]})
    ],
    doWhile:[
      makeNode("process",{variable:"i",expression:"0"}),
      makeNode("doWhile",{condition:"i<3",body:[
        makeNode("process",{variable:"i",expression:"i+1"}),
        makeNode("output",{expression:"i"})
      ]})
    ]
  };
  if (!nodes[kind]) throw new TypeError("Plantilla desconocida: "+kind);
  return {version:1,nodes:[start,...nodes[kind],end]};
}

const error=(errors,node,field,message,path)=>errors.push({
  nodeId:node?.id??null,field,message,path:[...path]
});
function visitScope(nodes,errors,path,ids,requireLoopBody=true) {
  if (!Array.isArray(nodes)) {
    error(errors,null,"nodes","El bloque debe ser una secuencia de instrucciones.",path);
    return;
  }
  for (let index=0;index<nodes.length;index++) {
    const node=nodes[index];
    const currentPath=[...path,index];
    if (!node||typeof node!=="object") {
      error(errors,null,"node","La instrucción no contiene un nodo válido.",currentPath);
      continue;
    }
    if (!NODE_TYPES.has(node.type)) error(errors,node,"type","Tipo de símbolo no permitido.",currentPath);
    if (typeof node.id!=="string"||!ID_PATTERN.test(node.id)) {
      error(errors,node,"id","Cada nodo necesita un identificador válido.",currentPath);
    } else if (ids.has(node.id)) {
      error(errors,node,"id","El identificador está duplicado: "+node.id,currentPath);
    } else ids.add(node.id);
    if (["start","end"].includes(node.type)) {
      error(errors,node,"type","Inicio y Fin solo pueden aparecer en los extremos del flujo principal.",currentPath);
    }
    const required=(field,value,message="Este campo es obligatorio.")=>{
      if(typeof value!=="string"||!value.trim()) error(errors,node,field,message,currentPath);
    };
    if(node.type==="input"){
      required("variables",node.variables);
      const vars=String(node.variables??"").split(",").map(x=>x.trim());
      if(vars.some(name=>!ID_PATTERN.test(name))) error(errors,node,"variables","Usa nombres de variables separados por comas.",currentPath);
    }
    if(node.type==="process"){
      required("variable",node.variable);
      required("expression",node.expression);
      if(node.variable&&!ID_PATTERN.test(node.variable))error(errors,node,"variable","El nombre de la variable no es válido.",currentPath);
    }
    if(node.type==="output") required("expression",node.expression);
    if(["decision","while","doWhile"].includes(node.type)) required("condition",node.condition);
    if(node.type==="for"){
      required("initial",node.initial);
      required("condition",node.condition);
      required("update",node.update);
    }
    if(node.type==="decision"){
      if(!Array.isArray(node.trueBranch)||node.trueBranch.length===0){
        error(errors,node,"trueBranch","Falta al menos una instrucción en la salida Verdadera (V).",currentPath);
      } else visitScope(node.trueBranch,errors,[...currentPath,"V"],ids);
      if(!Array.isArray(node.falseBranch)||node.falseBranch.length===0){
        error(errors,node,"falseBranch","Falta al menos una instrucción en la salida Falsa (F).",currentPath);
      } else visitScope(node.falseBranch,errors,[...currentPath,"F"],ids);
    }
    if(["for","while","doWhile"].includes(node.type)){
      if(!Array.isArray(node.body)||node.body.length===0){
        error(errors,node,"body","El ciclo necesita al menos una instrucción dentro del cuerpo.",currentPath);
      } else visitScope(node.body,errors,[...currentPath,"body"],ids);
    }
  }
}
export function validateFlow(model) {
  const errors=[];
  if(!model||!Array.isArray(model.nodes)){
    return {valid:false,errors:[{nodeId:null,field:"nodes",message:"El diagrama no contiene una secuencia de nodos.",path:[]}]};
  }
  const nodes=model.nodes;
  if(nodes.length===2){
    errors.push({nodeId:null,field:"nodes",message:"Añade al menos una instrucción entre Inicio y Fin.",path:[]});
  }
  if(nodes.length<2){
    errors.push({nodeId:null,field:"terminals",message:"El diagrama necesita un Inicio y un Fin.",path:[]});
    return {valid:false,errors};
  }
  const starts=nodes.filter(node=>node?.type==="start");
  const ends=nodes.filter(node=>node?.type==="end");
  if(starts.length!==1)errors.push({nodeId:null,field:"start",message:"El diagrama debe tener exactamente un Inicio.",path:[]});
  if(ends.length!==1)errors.push({nodeId:null,field:"end",message:"El diagrama debe tener exactamente un Fin.",path:[]});
  if(nodes[0]?.type!=="start")errors.push({nodeId:nodes[0]?.id??null,field:"start",message:"Inicio debe ser el primer elemento del flujo.",path:[0]});
  if(nodes.at(-1)?.type!=="end")errors.push({nodeId:nodes.at(-1)?.id??null,field:"end",message:"Fin debe ser el último elemento del flujo.",path:[nodes.length-1]});
  const ids=new Set();
  visitScope(nodes.slice(1,-1),errors,[],ids);
  const allIds=[...starts,...ends].map(n=>n?.id);
  for(const id of allIds){
    if(typeof id!=="string"||!ID_PATTERN.test(id))errors.push({nodeId:id??null,field:"id",message:"El nodo terminal necesita identificador válido.",path:[]});
    else if(ids.has(id))errors.push({nodeId:id,field:"id",message:"El identificador del terminal está duplicado.",path:[]});
    else ids.add(id);
  }
  return {valid:errors.length===0,errors};
}

function compileScope(nodes) {
  const output=[];
  for(const node of nodes){
    if(node.type==="input") output.push("leer "+node.variables);
    else if(node.type==="process") output.push(node.variable+"="+node.expression);
    else if(node.type==="output") output.push("imp "+node.expression);
    else if(node.type==="decision"){
      output.push("si "+node.condition);
      output.push(...compileScope(node.trueBranch));
      output.push("sino");
      output.push(...compileScope(node.falseBranch));
      output.push("fin");
    } else if(node.type==="for"){
      output.push("para "+node.initial+";"+node.condition+";"+node.update);
      output.push(...compileScope(node.body));
      output.push("fin");
    } else if(node.type==="while"){
      output.push("mientras "+node.condition);
      output.push(...compileScope(node.body));
      output.push("fin");
    } else if(node.type==="doWhile"){
      output.push("hacer");
      output.push(...compileScope(node.body));
      output.push("hm "+node.condition);
    }
  }
  return output;
}
export function compileFlow(model) {
  const validation=validateFlow(model);
  if(!validation.valid){
    const error=new Error("No se puede ejecutar el diagrama: "+validation.errors.map(e=>e.message).join(" "));
    error.name="FlowValidationError";
    error.errors=validation.errors;
    throw error;
  }
  const source=compileScope(model.nodes.slice(1,-1)).join("|");
  try{return {source,program:parsePseudocode(source),validation};}
  catch(cause){
    const error=new Error("El diagrama no se puede traducir a pseudocódigo válido: "+cause.message);
    error.name="FlowCompilationError";
    error.cause=cause;
    throw error;
  }
}
