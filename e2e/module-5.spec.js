import { test, expect } from "@playwright/test";

async function logHitTarget(locator, label) {
  await locator.scrollIntoViewIfNeeded();
  const hit = await locator.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const stack = document.elementsFromPoint(x, y).slice(0, 8).map(node => {
      const style = getComputedStyle(node);
      return {
        tag: node.tagName,
        id: node.id,
        className: typeof node.className === "string" ? node.className : "",
        pointerEvents: style.pointerEvents,
        position: style.position,
        zIndex: style.zIndex
      };
    });
    return {rect: {x:rect.x,y:rect.y,width:rect.width,height:rect.height}, stack};
  });
  console.log("SIMULATOR_HIT_TEST "+label+" "+JSON.stringify(hit));
}

test("restaurar ejemplo vuelve a cargar los datos originales del método",async({page})=>{
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-inputs").fill("2,3");
  await page.locator("#simulator-run").click();
  await page.locator("#simulator-last").click();
  await expect(page.locator("#simulator-output")).toContainText("5");
  await page.locator("#simulator-restore-inputs").click();
  await page.locator("#simulator-last").click();
  await expect(page.locator("#simulator-inputs")).toHaveValue("8, 5");
  await expect(page.locator("#simulator-output")).toContainText("13");
});

test("historial de variable se reconstruye desde la traza hasta el paso seleccionado",async({page})=>{
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-last").click();
  await logHitTarget(page.locator('#variables-content [data-variable-history="a"]'),"variable-history-trigger");
  await page.locator('#variables-content [data-variable-history="a"]').click();
  await expect(page.locator("#variable-history")).toContainText("Historial · a");
  await expect(page.locator("#variable-history .variable-history-list li")).toHaveCount(1);
  await page.locator("#variable-history [data-variable-step]").click();
  await expect(page.locator("#timeline-count")).toContainText("/");
});

test("cámara automática, texto escalable y fullscreen tienen controles utilizables",async({page})=>{
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  const camera=page.locator("#diagram-camera-toggle");
  await expect(camera).toHaveAttribute("aria-pressed","true");
  await camera.click();
  await expect(camera).toHaveAttribute("aria-pressed","false");
  await camera.click();
  await expect(camera).toHaveAttribute("aria-pressed","true");
  const code=page.locator(".pseudocode-lines li").first();
  const before=await code.evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  await page.locator("#simulator-text-larger").click();
  const after=await code.evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  expect(after).toBeGreaterThan(before);
  await page.locator("#simulator-text-reset").click();
  await expect(page.locator("#diagram-fullscreen")).toBeVisible();
  await page.locator("#diagram-fullscreen").click();
  await expect.poll(()=>page.evaluate(()=>Boolean(document.fullscreenElement))).toBe(true);
  await page.locator("#diagram-fullscreen-exit").click();
  await expect.poll(()=>page.evaluate(()=>Boolean(document.fullscreenElement))).toBe(false);
});

test("se puede desplazar el lienzo con arrastre y la cámara pasa a control manual",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#diagram-camera-toggle").click();
  await page.locator("#diagram-zoom-in").click();
  await page.locator("#diagram-zoom-in").click();
  await page.locator("#diagram-zoom-in").click();
  const stage=page.locator("#diagram-stage");
  await expect(stage).toBeVisible();
  const initialTransform=await page.locator("#flow-diagram-container").evaluate(el=>getComputedStyle(el).transform);
  const rect=await stage.boundingBox();
  await page.mouse.move(rect.x+Math.min(rect.width-30,170),rect.y+120);
  await page.mouse.down();
  await expect(page.locator("#diagram-camera-toggle")).toHaveAttribute("aria-pressed","false");
  await page.mouse.move(rect.x+40,rect.y+120,{steps:5});
  await page.mouse.up();
  const movedTransform=await page.locator("#flow-diagram-container").evaluate(el=>getComputedStyle(el).transform);
  expect(movedTransform).not.toBe(initialTransform);
  expect(Number(await stage.getAttribute("data-pan-moved"))).toBeGreaterThan(0);
});

test("tema y reducción de movimiento no alteran el estado de ejecución",async({page})=>{
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-next").click();
  const before=await page.locator("#timeline-count").textContent();
  await page.locator('[data-action="toggle-theme"]').click();
  await page.locator('[data-action="toggle-motion"]').click();
  await expect(page.locator("#timeline-count")).toHaveText(before);
  expect(errors).toEqual([]);
});


test("el token SVG sigue el paso y destaca la rama V/F realmente seleccionada",async({page})=>{
  await page.goto("/");
  await page.locator('[data-select-exercise="7"]').click();
  await page.locator("#exercise-detail [data-reveal-solution]").click();
  await page.locator("#exercise-detail [data-open-simulator]").click();
  const decision=page.locator("#trace-history li").filter({hasText:"DECISIÓN"}).first();
  await logHitTarget(decision,"decision-history");
  await decision.click();
  await expect(page.locator("#flow-diagram-container .flow-token")).toHaveAttribute("visibility","visible");
  await expect(page.locator("#flow-diagram-container .flow-token")).toHaveAttribute("visibility","visible");
  await expect(page.locator("#flow-diagram-container .diagram-edge.is-route-active")).toHaveCount(1);
  await expect(page.locator("#flow-diagram-container .diagram-edge.is-route-active .diagram-edge-label")).toContainText("F");
});


test("la escena desglosa los operandos y el resultado del cálculo activo",async({page})=>{
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  const assignment=page.locator("#trace-history li").filter({hasText:"ASIGNACIÓN"}).first();
  await logHitTarget(assignment,"assignment-history");
  await assignment.click();
  await expect(page.locator("#scene-content .scene-operation-breakdown")).toContainText("8 + 5 = 13");
  expect(errors).toEqual([]);
});


test("captura vistas del simulador, laboratorio y constructor en tres tamaños",async({page},testInfo)=>{
  const viewports=[
    ["desktop",1440,1000],
    ["tablet",1024,768],
    ["mobile",390,844]
  ];
  for(const [name,width,height] of viewports){
    await page.setViewportSize({width,height});
    await page.goto("/");
    await page.locator('[data-space="simulator"]').click();
    await expect(page.locator("#flow-svg")).toBeVisible();
    await page.screenshot({path:testInfo.outputPath(name+"-simulator.png"),fullPage:true,animations:"disabled"});
    await page.locator('[data-space="lab"]').click();
    await expect(page.locator('[data-view="lab"]')).toBeVisible();
    await page.screenshot({path:testInfo.outputPath(name+"-lab.png"),fullPage:true,animations:"disabled"});
    await page.locator('[data-space="builder"]').click();
    await expect(page.locator('[data-view="builder"]')).toBeVisible();
    await page.screenshot({path:testInfo.outputPath(name+"-builder.png"),fullPage:true,animations:"disabled"});
  }
});


test("zoom y ajuste automático encajan el SVG y la preferencia de tamaño persiste",async({page})=>{
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  const svg=page.locator("#flow-svg");
  await expect.poll(()=>svg.evaluate(el=>el.getBoundingClientRect().width)).toBeGreaterThan(300);
  await expect(page.locator("#diagram-empty")).toBeHidden();
  const fitted=await svg.evaluate(el=>el.getBoundingClientRect().width);
  await page.locator("#diagram-zoom-in").click();
  await page.locator("#diagram-zoom-in").click();
  const enlarged=await svg.evaluate(el=>el.getBoundingClientRect().width);
  expect(enlarged).toBeGreaterThan(fitted);
  const previousFitCount=Number(await page.locator("#diagram-stage").getAttribute("data-fit-count"));
  await page.locator("#diagram-fit").click();
  await expect.poll(async()=>Number(await page.locator("#diagram-stage").getAttribute("data-fit-count"))).toBeGreaterThan(previousFitCount);
  await expect.poll(()=>svg.evaluate(el=>el.getBoundingClientRect().width)).toBeLessThan(enlarged);
  await page.locator("#simulator-text-larger").click();
  const stored=await page.evaluate(()=>localStorage.getItem("traza:v2:pseudocode-size"));
  expect(stored).toBe("18");
  await page.reload();
  await page.locator('[data-space="simulator"]').click();
  const restored=await page.locator(".pseudocode-lines li").first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  expect(restored).toBe(18);
});


test("las vistas móviles cambian de panel sin reiniciar la traza y la escena se puede minimizar",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-last").click();
  const finalStep=await page.locator("#timeline-count").textContent();
  await page.locator('#simulator-mobile-tabs [data-mobile-panel="variables"]').click();
  await expect(page.locator("#variables-content")).toBeVisible();
  await expect(page.locator("#timeline-count")).toHaveText(finalStep);
  await page.locator('#simulator-mobile-tabs [data-mobile-panel="scene"]').click();
  await expect(page.locator("#scene-content")).toBeVisible();
  await page.locator("#scene-minimize").click();
  await expect(page.locator("#scene-minimize")).toHaveAttribute("aria-expanded","false");
  await expect(page.locator("#scene-content")).toBeHidden();
  await page.locator("#scene-minimize").click();
  await expect(page.locator("#scene-content")).toBeVisible();
  await page.locator('#simulator-mobile-tabs [data-mobile-panel="diagram"]').click();
  await expect(page.locator("#flow-diagram-container")).toBeVisible();
  await expect(page.locator("#timeline-count")).toHaveText(finalStep);
});
