const escape = value => String(value??"").replace(/[&<>"']/g,ch=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[ch]));
const wrapped = (text,max=16) => {
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
  if (node.type==="terminal") return '<rect x="'+(x+25)+'" y="'+y+'" width="'+(w-50)+'" height="'+h+'" rx="'+(h/2)+'"/>';
  if (node.type==="input") return '<polygon points="'+(x+16)+','+y+' '+(x+w)+','+y+' '+(x+w-16)+','+(y+h)+' '+x+','+(y+h)+'"/>';
  if (node.type==="output") return '<path d="M '+x+' '+y+' H '+(x+w)+' V '+(y+h-10)+' Q '+(x+w*.75)+' '+(y+h-20)+' '+(x+w*.5)+' '+(y+h-10)+' T '+x+' '+(y+h-10)+' Z"/>';
  if (node.type==="if"||node.type==="while"||node.type==="doWhile") return '<polygon points="'+node.x+','+y+' '+(x+w)+','+(y+h/2)+' '+node.x+','+(y+h)+' '+x+','+(y+h/2)+'"/>';
  if (node.type==="for") return '<polygon points="'+(x+24)+','+y+' '+(x+w-24)+','+y+' '+(x+w)+','+(y+h/2)+' '+(x+w-24)+','+(y+h)+' '+(x+24)+','+(y+h)+' '+x+','+(y+h/2)+'"/>';
  if (node.type==="merge") return '<circle cx="'+node.x+'" cy="'+(y+h/2)+'" r="9"/>';
  if (node.type==="body") return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="12" stroke-dasharray="5 4"/>';
  return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="5"/>';
}
function edgePath(edge,diagram){
  const from=diagram.byId.get(edge.from),to=diagram.byId.get(edge.to);
  if (!from||!to) return "";
  const fx=from.x, fy=from.y+from.height/2, tx=to.x, ty=to.y+to.height/2;
  if (edge.kind==="false") {
    const y=from.y+from.height/2;
    return "M "+(from.x+from.width/2)+" "+y+" L "+tx+" "+y+" L "+tx+" "+to.y;
  }
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
    return '<g data-edge-id="'+escape(edge.id)+'" class="'+cls+'"><path d="'+d+'" marker-end="url(#flow-arrow)"/>'+label+'</g>';
  }).join("");
  const nodeMarkup=diagram.nodes.map(node=>{
    const isActive=active===String(node.sourceId);
    const isVisited=node.sourceId!==null&&visited.has(String(node.sourceId));
    const lines=wrapped(node.label,node.type==="if"||node.type==="while"||node.type==="doWhile"?14:16);
    const y=node.y+node.height/2-(lines.length-1)*10;
    const text= node.type==="merge" ? "" : lines.map((line,i)=>'<text x="'+node.x+'" y="'+(y+i*20+5)+'">'+escape(line)+'</text>').join("");
    return '<g id="flow-node-'+escape(node.id)+'" class="diagram-node node-'+escape(node.type)+(isActive?" is-active":"")+(isVisited?" is-visited":"")+'">'+shape(node)+text+'</g>';
  }).join("");
  const svg='<svg class="flow-svg" id="flow-svg" role="img" aria-label="Diagrama de flujo generado desde el pseudocódigo" viewBox="0 0 '+diagram.width+' '+diagram.height+'" xmlns="http://www.w3.org/2000/svg">'+
    '<defs><marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>'+
    '<polyline id="flow-trail" class="flow-trail" points=""/><polyline id="flow-active-trail" class="flow-active-trail" points=""/><g class="flow-edges">'+edgeMarkup+'</g><g class="flow-nodes">'+nodeMarkup+'</g>'+
    '<circle id="flow-token-ring" class="flow-token-ring" cx="520" cy="20" r="10" visibility="hidden" aria-hidden="true"/>'+
    '<circle class="flow-token" cx="520" cy="20" r="9" visibility="hidden" aria-hidden="true"/>'+
    '<text id="flow-token-label" class="flow-token-label" x="535" y="10" visibility="hidden" aria-hidden="true"></text></svg>';
  container.innerHTML=svg;
}
export function highlightDiagram(container,diagram,options={}) {
  if (!container||!diagram) return;
  const active=options.activeNodeId==null?null:String(options.activeNodeId);
  const visited=new Set((options.visitedNodeIds??[]).map(String));
  const routeNodeId=options.routeNodeId==null?null:String(options.routeNodeId);
  const route=options.route??null;
  const previous=options.previousNodeId==null?null:String(options.previousNodeId);
  const edgeElements=[...container.querySelectorAll(".diagram-edge")];
  const walkedEdges=new Set((options.walkEdgeIds??[]).map(String));
  edgeElements.forEach(element=>element.classList.toggle("is-token-route",walkedEdges.has(String(element.dataset.edgeId))));
  container.querySelectorAll(".diagram-node").forEach(element=>{
    const id=element.id.replace("flow-node-","");
    const model=diagram.byId.get(id);
    element.classList.toggle("is-active",Boolean(model&&active===String(model.sourceId)));
    element.classList.toggle("is-visited",Boolean(model&&model.sourceId!==null&&visited.has(String(model.sourceId))));
  });
  edgeElements.forEach(element=>{
    const edge=diagram.edges.find(candidate=>candidate.id===element.dataset.edgeId);
    const from=edge?diagram.byId.get(edge.from):null;
    const to=edge?diagram.byId.get(edge.to):null;
    const isChosen=Boolean(edge&&routeNodeId&&route&&from?.sourceId===Number(routeNodeId)&&edge.label===route);
    const isSequential=Boolean(edge&&previous&&active&&from?.sourceId===Number(previous)&&to?.sourceId===Number(active));
    element.classList.toggle("is-route-active",isChosen);
    element.classList.toggle("is-active-path",!isChosen&&isSequential);
  });
  const token=container.querySelector(".flow-token");
  if(token){
    let point=null;
    if(previous&&active){
      const travelled=diagram.edges.find(edge=>{
        const from=diagram.byId.get(edge.from),to=diagram.byId.get(edge.to);
        return String(from?.sourceId)===previous&&String(to?.sourceId)===active;
      });
      if(travelled){
        const edgeElement=edgeElements.find(element=>element.dataset.edgeId===travelled.id);
        const path=edgeElement?.querySelector("path");
        try{
          const length=path?.getTotalLength?.();
          if(path&&length>0)point=path.getPointAtLength(length*.58);
        }catch{/* El navegador puede no exponer la métrica SVG en algunos contextos. */}
        if(point)token.dataset.edgeId=travelled.id;
      }
    }
    const activeNode=diagram.nodes.find(node=>String(node.sourceId)===active);
    if(!point&&activeNode){
      point={x:activeNode.x,y:Math.max(10,activeNode.y-12)};
      delete token.dataset.edgeId;
    }
    if(point){
      token.setAttribute("cx",String(point.x));
      token.setAttribute("cy",String(point.y));
      token.setAttribute("visibility","visible");
      token.dataset.nodeId=active;
    }
  }
}
