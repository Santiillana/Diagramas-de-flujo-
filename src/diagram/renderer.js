const escape = value => String(value??"").replace(/[&<>"']/g,ch=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[ch]));
const wrapped = (text,max=25) => {
  const words=String(text??"").split(/\s+/);
  const lines=[];
  let line="";
  for (const word of words) {
    if ((line+" "+word).trim().length>max && line) { lines.push(line); line=word; }
    else line=(line+" "+word).trim();
  }
  if (line) lines.push(line);
  return lines.slice(0,3);
};
function shape(node){
  const x=node.x-node.width/2,y=node.y,w=node.width,h=node.height;
  if (node.type==="terminal") return '<rect x="'+(x+28)+'" y="'+y+'" width="'+(w-56)+'" height="'+h+'" rx="'+(h/2)+'"/>';
  if (node.type==="input") return '<polygon points="'+(x+15)+','+y+' '+(x+w)+','+y+' '+(x+w-15)+','+(y+h)+' '+x+','+(y+h)+'"/>';
  if (node.type==="output") return '<path d="M '+x+' '+y+' H '+(x+w)+' V '+(y+h-10)+' Q '+(x+w*.75)+' '+(y+h-24)+' '+(x+w*.5)+' '+(y+h-10)+' T '+x+' '+(y+h-10)+' Z"/>';
  if (node.type==="if"||node.type==="while"||node.type==="doWhile") return '<polygon points="'+node.x+','+y+' '+(x+w)+','+(y+h/2)+' '+node.x+','+(y+h)+' '+x+','+(y+h/2)+'"/>';
  if (node.type==="for") return '<polygon points="'+(x+22)+','+y+' '+(x+w-22)+','+y+' '+(x+w)+','+(y+h/2)+' '+(x+w-22)+','+(y+h)+' '+(x+22)+','+(y+h)+' '+x+','+(y+h/2)+'"/>';
  if (node.type==="merge") return '<circle cx="'+node.x+'" cy="'+(y+h/2)+'" r="9"/>';
  if (node.type==="body") return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="12" stroke-dasharray="5 4"/>';
  return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="5"/>';
}
function edgePath(edge,diagram){
  const from=diagram.byId.get(edge.from),to=diagram.byId.get(edge.to);
  if (!from||!to) return "";
  const fx=from.x, fy=from.y+from.height/2, tx=to.x, ty=to.y+to.height/2;
  if (edge.kind==="back") {
    const bendX=Math.min(fx,tx)-95;
    const top=Math.min(from.y,to.y)-25;
    return "M "+fx+" "+(from.y+from.height/2)+" L "+bendX+" "+(from.y+from.height/2)+" L "+bendX+" "+(to.y+to.height/2)+" L "+tx+" "+(to.y+to.height/2);
  }
  if (Math.abs(fx-tx)<4) {
    return "M "+fx+" "+(from.y+from.height)+" L "+tx+" "+to.y;
  }
  const mid=(fy+ty)/2;
  return "M "+fx+" "+(from.y+from.height)+" L "+fx+" "+mid+" L "+tx+" "+mid+" L "+tx+" "+to.y;
}
export function renderDiagram(container,diagram,options={}){
  if (!container||!diagram) return;
  const active=options.activeNodeId==null?null:String(options.activeNodeId);
  const visited=new Set((options.visitedNodeIds??[]).map(String));
  const edgeMarkup=diagram.edges.map(edge=>{
    const d=edgePath(edge,diagram);
    if (!d) return "";
    const from=diagram.byId.get(edge.from),to=diagram.byId.get(edge.to);
    const activeEdge=active&&(from.sourceId===Number(active)||to.sourceId===Number(active));
    const cls="diagram-edge "+(edge.kind==="back"?"is-back":"")+(activeEdge?" is-near-active":"");
    const label=edge.label?'<text class="diagram-edge-label" x="'+((from.x+to.x)/2)+'" y="'+((from.y+from.height+to.y)/2-8)+'">'+escape(edge.label)+'</text>':"";
    return '<g class="'+cls+'"><path d="'+d+'" marker-end="url(#flow-arrow)"/>'+label+'</g>';
  }).join("");
  const nodeMarkup=diagram.nodes.map(node=>{
    const isActive=active===String(node.sourceId);
    const isVisited=node.sourceId!==null&&visited.has(String(node.sourceId));
    const lines=wrapped(node.label,node.type==="if"||node.type==="while"||node.type==="doWhile"?22:25);
    const y=node.y+node.height/2-(lines.length-1)*7;
    const text= node.type==="merge" ? "" : lines.map((line,i)=>'<text x="'+node.x+'" y="'+(y+i*14+4)+'">'+escape(line)+'</text>').join("");
    return '<g id="flow-node-'+escape(node.id)+'" class="diagram-node node-'+escape(node.type)+(isActive?" is-active":"")+(isVisited?" is-visited":"")+'">'+shape(node)+text+'</g>';
  }).join("");
  const svg='<svg class="flow-svg" id="flow-svg" role="img" aria-label="Diagrama de flujo generado desde el pseudocódigo" viewBox="0 0 '+diagram.width+' '+diagram.height+'" xmlns="http://www.w3.org/2000/svg">'+
    '<defs><marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>'+
    '<g class="flow-edges">'+edgeMarkup+'</g><g class="flow-nodes">'+nodeMarkup+'</g></svg>';
  container.innerHTML=svg;
}
export function highlightDiagram(container,diagram,options={}) {
  if (!container) return;
  const active=options.activeNodeId==null?null:String(options.activeNodeId);
  const visited=new Set((options.visitedNodeIds??[]).map(String));
  container.querySelectorAll(".diagram-node").forEach(node=>{
    const id=node.id.replace("flow-node-","");
    const model=diagram.byId.get(id);
    node.classList.toggle("is-active",Boolean(model&&active===String(model.sourceId)));
    node.classList.toggle("is-visited",Boolean(model&&model.sourceId!==null&&visited.has(String(model.sourceId))));
  });
}
