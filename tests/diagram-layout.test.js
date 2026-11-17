import test from "node:test";
import assert from "node:assert/strict";
import { exercises } from "../src/content/exercises.js";
import { parsePseudocode } from "../src/core/parser.js";
import { layoutFlow } from "../src/diagram/layout.js";
import { edgePath, edgeLabelBox } from "../src/diagram/renderer.js";

function points(path){return [...path.matchAll(/[ML]\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map(match=>[Number(match[1]),Number(match[2])]);}
function hitsBox(a,b,node,padding=1){
  const box={left:node.x-node.width/2+padding,right:node.x+node.width/2-padding,top:node.y+padding,bottom:node.y+node.height-padding};
  if(a[0]===b[0])return a[0]>box.left&&a[0]<box.right&&Math.max(Math.min(a[1],b[1]),box.top)<Math.min(Math.max(a[1],b[1]),box.bottom);
  if(a[1]===b[1])return a[1]>box.top&&a[1]<box.bottom&&Math.max(Math.min(a[0],b[0]),box.left)<Math.min(Math.max(a[0],b[0]),box.right);
  return true;
}

test("los 45 diagramas mantienen texto dentro de figuras y rutas ortogonales fuera de otras figuras",()=>{
  for(const exercise of exercises)for(const method of exercise.methods){
    const diagram=layoutFlow(parsePseudocode(method.pseudocode));
    assert.ok(diagram.nodes.filter(node=>node.type!=="merge").every(node=>node.width>=120&&node.width<=220),"E"+exercise.id+" ancho de figura");
    assert.ok(diagram.nodes.every(node=>node.labelLines.every(line=>line.length>0)),"E"+exercise.id+" texto legible");
    assert.ok(diagram.nodes.every(node=>node.x-node.width/2>=0&&node.x+node.width/2<=diagram.width),"E"+exercise.id+" encuadre horizontal");
    for(const edge of diagram.edges){
      const sequence=points(edgePath(edge,diagram)),from=diagram.byId.get(edge.from),to=diagram.byId.get(edge.to);
      assert.ok(sequence.length>=2,"E"+exercise.id+" camino dibujado");
      for(let index=1;index<sequence.length;index++){
        const [x1,y1]=sequence[index-1],[x2,y2]=sequence[index];
        assert.ok(x1===x2||y1===y2,"E"+exercise.id+" flujo ortogonal");
        for(const node of diagram.nodes){
          if(node===from||node===to)continue;
          assert.equal(hitsBox(sequence[index-1],sequence[index],node),false,"E"+exercise.id+" · "+edge.id+" atraviesa "+node.id);
        }
      }
    }
    const labels=diagram.edges.map(edge=>({edge,box:edgeLabelBox(edge,diagram.byId.get(edge.from))})).filter(item=>item.box);
    for(const {edge,box} of labels)for(const node of diagram.nodes){
      const overlaps=box.x<node.x+node.width/2&&box.x+box.width>node.x-node.width/2&&box.y<node.y+node.height&&box.y+box.height>node.y;
      assert.equal(overlaps,false,"E"+exercise.id+" · "+edge.id+" etiqueta sobre "+node.id);
    }
    for(let a=0;a<labels.length;a++)for(let b=a+1;b<labels.length;b++){
      const left=labels[a].box,right=labels[b].box;
      const overlaps=left.x<right.x+right.width&&left.x+left.width>right.x&&left.y<right.y+right.height&&left.y+left.height>right.y;
      assert.equal(overlaps,false,"E"+exercise.id+" etiquetas de ramas superpuestas");
    }
  }
});

test("el ciclo Para se expresa en una línea y conserva las tres partes",()=>{
  const item=exercises.flatMap(exercise=>exercise.methods).find(method=>method.pseudocode.includes("para "));
  const diagram=layoutFlow(parsePseudocode(item.pseudocode));
  const loop=diagram.nodes.find(node=>node.type==="for");
  assert.ok(loop);
  assert.deepEqual(loop.labelParts.length,3);
  assert.equal(loop.labelLines.length,1);
  assert.match(loop.label,/; /);
});
