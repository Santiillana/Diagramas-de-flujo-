import { test, expect } from "@playwright/test";

test("las ventanas se minimizan, fijan y restauran desde el rail",async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  const variables=page.locator('#PR > .variables-panel');
  await expect(variables).toBeVisible();
  await page.locator('[data-window-pin="variables"]').click();
  await expect(page.locator('[data-window-pin="variables"]')).toHaveAttribute("aria-pressed","true");
  await page.locator('[data-window-minimize="variables"]').click();
  await expect(variables).toBeHidden();
  await page.locator('#sim-window-rail [data-window-restore="variables"]').click();
  await expect(variables).toBeVisible();
  await expect(page.locator('[data-window-pin="variables"]')).toHaveAttribute("aria-pressed","true");
});

test("la ventana contextual evita nodos y conectores, o delega la explicación a En escena",async({page})=>{
  await page.setViewportSize({width:1920,height:1080});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator('#sim-exercise-strip [data-sim-exercise="24"]').click();
  await page.locator("#simulator-timeline").evaluate(input=>{
    input.value="7";input.dispatchEvent(new Event("input",{bubbles:true}));
  });
  await expect(page.locator("#vf")).toHaveAttribute("data-anchor-node","4");
  await page.waitForTimeout(80);
  const report=await page.evaluate(()=>{
    const vf=document.querySelector("#vf"),wire=document.querySelector("#vf-wire");
    const anchor=vf?.dataset.anchorNode,node=anchor?document.querySelector("#flow-node-"+anchor):null;
    if(!vf||!node)return null;
    const a=vf.getBoundingClientRect(),b=node.getBoundingClientRect();
    const box={left:a.left,top:a.top,right:a.right,bottom:a.bottom};
    const overlaps=selector=>[...document.querySelectorAll(selector)].map(element=>{
      try{
        let r;
        if(element.classList.contains("diagram-edge")){
          const b=element.getBBox(),m=element.getScreenCTM(),svg=element.ownerSVGElement;
          const points=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>{
            const p=svg.createSVGPoint();p.x=x;p.y=y;return p.matrixTransform(m);
          });
          const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
          r={left:Math.min(...xs)-10,top:Math.min(...ys)-10,right:Math.max(...xs)+10,bottom:Math.max(...ys)+10};
        }else r=element.getBoundingClientRect();
        return r.left<box.right&&r.right>box.left&&r.top<box.bottom&&r.bottom>box.top;
      }catch{return false;}
    }).some(Boolean);
    const nodeOverlap=box.left<b.right&&box.right>b.left&&box.top<b.bottom&&box.bottom>b.top;
    return {hidden:vf.hidden,wireVisible:wire?!wire.hidden:false,box,nodeOverlap,
      edgeOverlap:overlaps("#flow-svg .diagram-edge"),
      otherNodeOverlap:overlaps("#flow-svg .diagram-node:not(#flow-node-"+anchor+")"),
      inside:vf.hidden||(box.left>=0&&box.top>=54&&box.right<=1920&&box.bottom<=1080)};
  });
  expect(report).not.toBeNull();
  expect(report.inside).toBe(true);
  expect(report.nodeOverlap).toBe(false);
  expect(report.hidden?report.wireVisible:!report.edgeOverlap&&!report.otherNodeOverlap).toBe(true);
});
