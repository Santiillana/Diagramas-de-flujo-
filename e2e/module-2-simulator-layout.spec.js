import {test,expect} from "@playwright/test";

for(const viewport of [
 {name:"pantalla amplia",width:1920,height:1080,mobile:false},
 {name:"referencia",width:1649,height:928,mobile:false},
 {name:"escritorio",width:1440,height:900,mobile:false},
 {name:"tableta",width:1024,height:768,mobile:false},
 {name:"móvil ancho",width:900,height:800,mobile:true},
 {name:"móvil",width:390,height:844,mobile:true}
]){
 test("Simulador sin desbordamiento y con cuatro espacios en "+viewport.name,async({page})=>{
  await page.setViewportSize({width:viewport.width,height:viewport.height});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await expect(page.locator("#flow-svg")).toBeVisible();
  await expect(page.locator("#diagram-stage")).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const stage=await page.locator("#diagram-stage").boundingBox(),dock=await page.locator("#dock").boundingBox();
  expect(stage?.width??0).toBeGreaterThan(viewport.mobile?250:360);
  expect(stage?.height??0).toBeGreaterThan(viewport.mobile?160:300);
  expect(dock).not.toBeNull();
  expect(dock.x).toBeGreaterThanOrEqual(0);
  expect(dock.x+dock.width).toBeLessThanOrEqual(viewport.width+1);
  if(viewport.mobile){
   await expect(page.locator("#simulator-mobile-tabs [data-mobile-panel]")).toHaveCount(4);
   for(const panel of ["problem","scene","variables","diagram"]){
    await page.locator('#simulator-mobile-tabs [data-mobile-panel="'+panel+'"]').click();
    await expect(page.locator("body")).toHaveAttribute("data-simulator-mobile-panel",panel);
    if(panel==="problem")await expect(page.locator("#sim-window-context")).toBeVisible();
    if(panel==="scene")await expect(page.locator("#PV")).toBeVisible();
    if(panel==="variables")await expect(page.locator("#PR")).toBeVisible();
    const xOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(xOverflow).toBeLessThanOrEqual(1);
   }
  }else{
   for(const selector of ["#sim-window-context","#sim-window-code","#PV","#PR"])await expect(page.locator(selector)).toBeVisible();
   const columns=await page.evaluate(()=>{
    const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return {left:b.left,right:b.right,width:b.width}};
    return {problem:r("#PL"),diagram:r(".diagram-panel"),inspector:r("#RC")};
   });
   expect(columns.problem.right).toBeLessThanOrEqual(columns.diagram.left+2);
   expect(columns.diagram.right).toBeLessThanOrEqual(columns.inspector.left+2);
   expect(columns.diagram.width).toBeGreaterThan(columns.problem.width*1.5);
   expect(columns.diagram.width).toBeGreaterThan(columns.inspector.width*1.15);
  }
  await page.locator("#hd").screenshot({path:"test-results/module-2-simulator-"+viewport.width+".png"});
 });
}

test("la cámara centra el primer nodo al entrar y al cambiar ejercicio o método",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 await page.locator("#simulator-next").click();
 const centered=async()=>{
  const activeId=await expect.poll(()=>page.evaluate(()=>document.querySelector("#flow-svg .diagram-node.is-active")?.id??"")).not.toBe("");
  const nodeId=String(await page.locator("#flow-svg .diagram-node.is-active").getAttribute("id")).replace("flow-node-","");
  await expect.poll(()=>page.locator("#diagram-stage").getAttribute("data-camera-target")).toBe(nodeId);
  await expect.poll(()=>page.evaluate(()=>{
   const stage=document.querySelector("#diagram-stage").getBoundingClientRect();
   const node=document.querySelector("#flow-svg .diagram-node.is-active")?.getBoundingClientRect();
   if(!node)return false;
   return Math.abs(node.left+node.width/2-(stage.left+stage.width/2))<stage.width*.12&&
     Math.abs(node.top+node.height/2-(stage.top+stage.height/2))<stage.height*.16;
  })).toBe(true);
 };
 await centered();
 await page.locator("#simulator-controls-toggle").click();
 await page.locator("#sim-exercise-select").selectOption("24");
 await page.locator("#simulator-next").click();
 await centered();
 const methods=page.locator("#simulator-method-tabs [data-method-index]");
 if(await methods.count()>1){
  await methods.nth(1).click();
  await page.locator("#simulator-next").click();
  await centered();
 }
});

test("Ctrl/Meta+rueda no modifica el zoom y el panel flotante evita el nodo activo",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto("/");
 await page.locator('[data-space="simulator"]').click();
 const canvas=page.locator("#flow-diagram-container"),stage=page.locator("#diagram-stage");
 await expect(canvas).toHaveAttribute("data-camera-zoom",/.+/);
 const zoom=Number(await canvas.getAttribute("data-camera-zoom"));
 await page.evaluate(()=>{
  const s=document.querySelector("#diagram-stage");
  s.dispatchEvent(new WheelEvent("wheel",{deltaY:180,ctrlKey:true,bubbles:true,cancelable:true}));
 });
 await expect(stage).toHaveAttribute("data-wheel-zoom-blocked","1");
 expect(Number(await canvas.getAttribute("data-camera-zoom"))).toBe(zoom);
 await page.locator("#simulator-controls-toggle").click();
 await expect(page.locator("#simulator-controls-panel")).toHaveAttribute("data-avoids-active-node","true");
 const overlap=await page.evaluate(()=>{
  const p=document.querySelector("#simulator-controls-panel").getBoundingClientRect();
  const n=document.querySelector("#flow-svg .diagram-node.is-active")?.getBoundingClientRect();
  return !!n&&p.left<n.right+10&&p.right>n.left-10&&p.top<n.bottom+10&&p.bottom>n.top-10;
 });
 expect(overlap).toBe(false);
 await page.keyboard.press("Escape");
 await expect(page.locator("#simulator-controls-panel")).toBeHidden();
});
