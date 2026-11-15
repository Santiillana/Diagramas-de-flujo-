import { test, expect } from "@playwright/test";

test("paridad geométrica con el prototipo original en el ejercicio 14, paso 7",async({browser})=>{
  const viewport={width:1920,height:1080};
  const reference=await browser.newPage({viewport});
  await reference.goto("/reference/diagramas_de_flujo_original.html");
  await reference.locator("#ch button").nth(13).click();
  await reference.locator("#gt #rv").click();
  await reference.locator("#sl").evaluate(input=>{
    input.value="7";
    input.dispatchEvent(new Event("input",{bubbles:true}));
  });

  const app=await browser.newPage({viewport});
  await app.goto("/");
  await app.locator('[data-space="simulator"]').click();
  await app.locator('#sim-exercise-strip [data-sim-exercise="24"]').click();
  await app.locator("#simulator-timeline").evaluate(input=>{
    input.value="7";
    input.dispatchEvent(new Event("input",{bubbles:true}));
  });

  const pairs=[
    ["barra superior","#hd","#hd"],
    ["panel izquierdo","#PL","#PL"],
    ["columna derecha","#RC","#RC"],
    ["En escena","#PV","#PV"],
    ["dock","#dock","#dock"]
  ];
  const measurements=[];
  for(const [label,referenceSelector,appSelector] of pairs){
    const refBox=await reference.locator(referenceSelector).boundingBox();
    const appBox=await app.locator(appSelector).boundingBox();
    expect(refBox, "No se midió "+label+" en la referencia").not.toBeNull();
    expect(appBox, "No se midió "+label+" en Traza").not.toBeNull();
    const delta={
      x:Math.abs(refBox.x-appBox.x),
      y:Math.abs(refBox.y-appBox.y),
      width:Math.abs(refBox.width-appBox.width),
      height:Math.abs(refBox.height-appBox.height)
    };
    measurements.push({label,delta});
    console.log("PARITY_GEOMETRY "+JSON.stringify({label,reference:refBox,app:appBox,delta}));
    for(const [dimension,pixels] of Object.entries(delta)){
      expect(pixels, label+": diferencia de "+dimension+" "+pixels.toFixed(2)+" px").toBeLessThanOrEqual(6);
    }
  }
  await reference.screenshot({path:"test-results/reference-parity-1920x1080.png",animations:"disabled"});
  await app.screenshot({path:"test-results/traza-parity-1920x1080.png",animations:"disabled"});
  expect(measurements).toHaveLength(5);
  await reference.close();
  await app.close();
});

test("el escenario cubre el viewport bajo la barra y no usa scroll interno",async({page})=>{
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  const state=await page.evaluate(()=>{
    const stage=document.querySelector("#wrap");
    const topbar=document.querySelector("#hd");
    const svg=document.querySelector("#flow-svg");
    const rect=stage.getBoundingClientRect();
    const header=topbar.getBoundingClientRect();
    const ancestors=[];
    for(let node=svg?.parentElement;node;node=node.parentElement){
      const style=getComputedStyle(node);
      ancestors.push({overflowX:style.overflowX,overflowY:style.overflowY});
      if(node===stage)break;
    }
    return {stage:{top:rect.top,left:rect.left,width:rect.width,height:rect.height},header:{height:header.height},ancestors};
  });
  expect(state.stage.top).toBeCloseTo(state.header.height,0);
  expect(state.stage.left).toBe(0);
  expect(state.stage.width).toBe(1280);
  expect(state.ancestors.some(item=>["auto","scroll"].includes(item.overflowX)||["auto","scroll"].includes(item.overflowY))).toBe(false);
});
