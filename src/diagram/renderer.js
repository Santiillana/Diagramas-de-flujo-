import { escapeHTML as escape } from "../ui/escape.js";

const wrapped = (text, max = 20) => {
  const words = String(text ?? "").split(/\s+/), lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > max && line) { lines.push(line); line = word; }
    else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
};

function shape(node) {
  const x = node.x - node.width / 2, y = node.y, w = node.width, h = node.height;
  if (node.type === "terminal") return '<rect x="' + (x + 28) + '" y="' + y + '" width="' + (w - 56) + '" height="' + h + '" rx="' + (h / 2) + '"/>';
  if (node.type === "input") return '<polygon points="' + (x + 15) + ',' + y + ' ' + (x + w) + ',' + y + ' ' + (x + w - 15) + ',' + (y + h) + ' ' + x + ',' + (y + h) + '"/>';
  if (node.type === "output") return '<path d="M ' + x + ' ' + y + ' H ' + (x + w) + ' V ' + (y + h - 10) + ' Q ' + (x + w * .75) + ' ' + (y + h - 24) + ' ' + (x + w * .5) + ' ' + (y + h - 10) + ' T ' + x + ' ' + (y + h - 10) + ' Z"/>';
  if (["if", "while", "doWhile"].includes(node.type)) return '<polygon points="' + node.x + ',' + y + ' ' + (x + w) + ',' + (y + h / 2) + ' ' + node.x + ',' + (y + h) + ' ' + x + ',' + (y + h / 2) + '"/>';
  if (node.type === "for") return '<polygon points="' + (x + 22) + ',' + y + ' ' + (x + w - 22) + ',' + y + ' ' + (x + w) + ',' + (y + h / 2) + ' ' + (x + w - 22) + ',' + (y + h) + ' ' + (x + 22) + ',' + (y + h) + ' ' + x + ',' + (y + h / 2) + '"/>';
  if (node.type === "merge") return '<circle cx="' + node.x + '" cy="' + (y + h / 2) + '" r="9"/>';
  if (node.type === "body") return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12" stroke-dasharray="5 4"/>';
  return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5"/>';
}

function edgePath(edge, diagram) {
  const from = diagram.byId.get(edge.from), to = diagram.byId.get(edge.to);
  if (!from || !to) return "";
  const fx = from.x, fy = from.y + from.height / 2, tx = to.x, ty = to.y + to.height / 2;
  if (edge.kind === "back") {
    const bendX = Math.min(fx, tx) - 95;
    return "M " + fx + " " + fy + " L " + bendX + " " + fy + " L " + bendX + " " + ty + " L " + tx + " " + ty;
  }
  if (Math.abs(fx - tx) < 4) return "M " + fx + " " + (from.y + from.height) + " L " + tx + " " + to.y;
  const mid = (fy + ty) / 2;
  return "M " + fx + " " + (from.y + from.height) + " L " + fx + " " + mid + " L " + tx + " " + mid + " L " + tx + " " + to.y;
}

export function renderDiagram(container, diagram, options = {}) {
  if (!container || !diagram) return;
  const active = options.activeNodeId == null ? null : String(options.activeNodeId);
  const visited = new Set((options.visitedNodeIds ?? []).map(String));
  const idPrefix = String(options.idPrefix ?? "");
  const edgeMarkup = diagram.edges.map(edge => {
    const d = edgePath(edge, diagram);
    if (!d) return "";
    const from = diagram.byId.get(edge.from), to = diagram.byId.get(edge.to);
    const label = edge.label ? '<text class="diagram-edge-label" x="' + ((from.x + to.x) / 2) +
      '" y="' + ((from.y + from.height + to.y) / 2 - 8) + '">' + escape(edge.label) + '</text>' : "";
    return '<g data-edge-id="' + escape(edge.id) + '" class="diagram-edge ' +
      (edge.kind === "back" ? "is-back " : "") + '">' +
      '<path d="' + d + '" marker-end="url(#' + escape(idPrefix) + 'flow-arrow)"/>' + label + '</g>';
  }).join("");
  const nodeMarkup = diagram.nodes.map(node => {
    const isActive = active === String(node.sourceId);
    const isVisited = node.sourceId !== null && visited.has(String(node.sourceId));
    let text;
    if (node.type === "merge") text = "";
    else if (node.type === "for" && node.forParts?.length === 3) {
      text = '<text class="for-parts" x="' + node.x + '" y="' + (node.y + node.height / 2 + 6) + '">' +
        node.forParts.map((part,index) => '<tspan data-for-part="' + index + '" x="' +
          (node.x + (index - 1) * 78) + '">' + escape(part) + '</tspan>').join("") + '</text>';
    } else {
      const lines = wrapped(node.label, node.type === "if" || node.type === "while" || node.type === "doWhile" ? 20 : 24);
      const y = node.y + node.height / 2 - (lines.length - 1) * 11;
      text = lines.map((line,i) => '<text x="' + node.x + '" y="' + (y + i * 22 + 6) + '">' + escape(line) + '</text>').join("");
    }
    return '<g id="' + escape(idPrefix) + 'flow-node-' + escape(node.id) +
      '" data-diagram-node-id="' + escape(node.id) + '" class="diagram-node node-' + escape(node.type) +
      (isActive ? " is-active" : "") + (isVisited ? " is-visited" : "") + '">' + shape(node) + text + '</g>';
  }).join("");
  container.innerHTML = '<svg class="flow-svg" id="' + escape(idPrefix) +
    'flow-svg" role="img" aria-label="Diagrama de flujo generado desde el pseudocódigo" viewBox="0 0 ' +
    diagram.width + ' ' + diagram.height + '" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><marker id="' + escape(idPrefix) +
    'flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
    '<path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>' +
    '<g id="' + escape(idPrefix) + 'cam" class="diagram-camera">' +
    '<g class="flow-edges">' + edgeMarkup + '</g><g class="flow-nodes">' + nodeMarkup + '</g>' +
    '<polyline id="' + escape(idPrefix) + 'trail" class="flow-trail" points="" aria-hidden="true"/>' +
    '<circle class="flow-token" cx="0" cy="0" r="9" visibility="hidden" aria-hidden="true"/></g></svg>';
}

export function highlightDiagram(container, diagram, options = {}) {
  if (!container || !diagram) return;
  const active = options.activeNodeId == null ? null : String(options.activeNodeId);
  const visited = new Set((options.visitedNodeIds ?? []).map(String));
  const routeNodeId = options.routeNodeId == null ? null : String(options.routeNodeId);
  const route = options.route ?? null;
  const edges = [...container.querySelectorAll(".diagram-edge")];
  container.querySelectorAll(".diagram-node").forEach(element => {
    const model = diagram.byId.get(element.dataset.diagramNodeId);
    element.classList.toggle("is-active", Boolean(model && active === String(model.sourceId)));
    element.classList.toggle("is-visited", Boolean(model && model.sourceId !== null && visited.has(String(model.sourceId))));
    element.classList.toggle("is-active-true", Boolean(model && active === String(model.sourceId) && options.result === true));
    element.classList.toggle("is-active-false", Boolean(model && active === String(model.sourceId) && options.result === false));
    if (model?.type === "for") {
      const phase = options.forPhase ?? "";
      element.dataset.forPhase = phase;
      element.querySelectorAll("[data-for-part]").forEach(span => {
        const current = (phase === "loop-init" && span.dataset.forPart === "0") ||
          (phase === "loop-condition" && span.dataset.forPart === "1") ||
          (phase === "loop-update" && span.dataset.forPart === "2");
        span.classList.toggle("is-current", current);
      });
    }
  });
  edges.forEach(element => {
    const edge = diagram.edges.find(candidate => candidate.id === element.dataset.edgeId);
    const from = edge ? diagram.byId.get(edge.from) : null;
    const to = edge ? diagram.byId.get(edge.to) : null;
    const chosen = Boolean(edge && routeNodeId && route && from?.sourceId === Number(routeNodeId) && edge.label === route);
    const sequential = Boolean(edge && options.previousNodeId != null && active &&
      String(from?.sourceId) === String(options.previousNodeId) && String(to?.sourceId) === active);
    element.classList.toggle("is-route-active", chosen);
    element.classList.toggle("is-route-true", chosen && edge.label === "V");
    element.classList.toggle("is-route-false", chosen && edge.label === "F");
    element.classList.toggle("is-active-path", !chosen && sequential);
    element.classList.toggle("is-route-unchosen", Boolean(route && from?.sourceId === Number(routeNodeId) && edge.label !== route));
  });
}

let activeTokenFrame = null, activeTokenGroup = null, trailFadeTimer = null;
function pointOnPath(path, distance) {
  try {
    const length = path.getTotalLength();
    if (!Number.isFinite(length) || length <= 0) return null;
    const point = path.getPointAtLength(Math.max(0, Math.min(length, distance)));
    return {x:point.x,y:point.y,length};
  } catch { return null; }
}
function cubicBezierProgress(t) {
  const cubic = (a,b,c,d,p) => {
    const u=1-p; return u*u*u*a + 3*u*u*p*b + 3*u*p*p*c + p*p*p*d;
  };
  let low=0,high=1,u=t;
  for(let i=0;i<12;i++){const x=cubic(0,.5,.2,1,u);if(x<t)low=u;else high=u;u=(low+high)/2;}
  return cubic(0,0,1,1,u);
}

/** La ficha recorre el conector exacto; el resaltado semántico vive en highlightDiagram. */
export function animateDiagramTransition(container, diagram, options = {}) {
  if(!container||!diagram)return 0;
  if(activeTokenFrame!==null)cancelAnimationFrame(activeTokenFrame);
  if(activeTokenGroup){activeTokenGroup.classList.remove("is-token-path");activeTokenGroup.style.removeProperty("--token-duration");}
  if(trailFadeTimer!==null)clearTimeout(trailFadeTimer);
  activeTokenFrame=null;activeTokenGroup=null;trailFadeTimer=null;
  const token=container.querySelector(".flow-token"),trail=container.querySelector(".flow-trail");
  if(!token)return 0;
  const activeId=options.activeNodeId==null?null:String(options.activeNodeId);
  const previousId=options.previousNodeId==null?null:String(options.previousNodeId);
  const activeNode=diagram.nodes.find(node=>String(node.sourceId)===activeId);
  const speed=Math.max(.25,Number(options.speed)||1);
  const reduced=options.motionMode!=="full"||(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??false);
  const staticPosition=()=>{
    if(activeNode){token.setAttribute("cx",String(activeNode.x));token.setAttribute("cy",String(Math.max(10,activeNode.y-12)));}
    token.setAttribute("visibility",activeNode?"visible":"hidden");
    token.removeAttribute("data-travelling");token.removeAttribute("data-edge-id");
    if(trail){trail.setAttribute("points","");trail.style.opacity="0";}
  };
  if(reduced||!activeId||!previousId){staticPosition();return 0;}
  if(activeId===previousId){
    if(!activeNode){staticPosition();return 0;}
    const baseY=Math.max(10,activeNode.y-12),start=performance.now(),duration=220/speed;
    token.setAttribute("cx",String(activeNode.x));token.setAttribute("cy",String(baseY));
    token.setAttribute("visibility","visible");token.dataset.nodeId=activeId;token.dataset.travelling="true";
    const hop=now=>{
      const progress=Math.min(1,(now-start)/duration),lift=Math.sin(progress*Math.PI)*6;
      token.setAttribute("cy",String(baseY-lift));options.onFrame?.({x:activeNode.x,y:baseY-lift});
      if(progress<1)activeTokenFrame=requestAnimationFrame(hop);
      else{activeTokenFrame=null;token.setAttribute("cy",String(baseY));token.removeAttribute("data-travelling");}
    };
    activeTokenFrame=requestAnimationFrame(hop);return duration;
  }
  const direct=diagram.edges.find(edge=>{
    const from=diagram.byId.get(edge.from),to=diagram.byId.get(edge.to);
    return String(from?.sourceId)===previousId&&String(to?.sourceId)===activeId;
  });
  const reverse=direct?null:diagram.edges.find(edge=>{
    const from=diagram.byId.get(edge.from),to=diagram.byId.get(edge.to);
    return String(from?.sourceId)===activeId&&String(to?.sourceId)===previousId;
  });
  const travelled=direct??reverse;
  const group=travelled&&container.querySelector('[data-edge-id="'+travelled.id+'"]');
  const path=group?.querySelector("path");
  let total=0;try{total=path?.getTotalLength?.()??0;}catch{total=0;}
  if(!path||!Number.isFinite(total)||total<=0){staticPosition();return 0;}
  const backwards=Boolean(reverse),duration=(total<1?150:Math.min(500+total*1.6,1500))/speed,start=performance.now();
  const points=[];
  token.setAttribute("visibility","visible");token.setAttribute("r","9");
  token.dataset.edgeId=travelled.id;token.dataset.nodeId=activeId;token.dataset.travelling="true";
  if(trail){trail.setAttribute("points","");trail.style.opacity=".7";trail.style.strokeDasharray="none";}
  group.classList.add("is-token-path");group.style.setProperty("--token-duration",duration+"ms");activeTokenGroup=group;
  const frame=now=>{
    const progress=Math.max(0,Math.min(1,(now-start)/duration)),eased=cubicBezierProgress(progress);
    const point=pointOnPath(path,backwards?total*(1-eased):total*eased);
    if(point){
      token.setAttribute("cx",String(point.x));token.setAttribute("cy",String(point.y));
      points.push(point.x+","+point.y);if(trail&&points.length>1)trail.setAttribute("points",points.join(" "));
      options.onFrame?.(point);
    }
    if(progress<1)activeTokenFrame=requestAnimationFrame(frame);
    else{
      activeTokenFrame=null;token.removeAttribute("data-travelling");
      group.classList.remove("is-token-path");group.style.removeProperty("--token-duration");activeTokenGroup=null;
      if(trail){
        trail.style.transition="opacity "+(1200/speed)+"ms linear";
        trailFadeTimer=window.setTimeout(()=>{trail.style.opacity="0";trailFadeTimer=window.setTimeout(()=>{
          trail.setAttribute("points","");trail.style.removeProperty("transition");
        },1200/speed);},0);
      }
    }
  };
  const first=pointOnPath(path,backwards?total:0);
  if(first){token.setAttribute("cx",String(first.x));token.setAttribute("cy",String(first.y));if(trail)trail.setAttribute("points",first.x+","+first.y);options.onFrame?.(first);}
  activeTokenFrame=requestAnimationFrame(frame);
  return duration;
}
