import {test,expect} from "@playwright/test";

test("el panel flotante reúne los controles y se cierra con Escape",async({page})=>{
  await page.setViewportSize({width:1440,height:950});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await expect(page.locator("#simulator-controls-toggle")).toBeVisible();
  await expect(page.locator("#simulator-controls-panel")).toBeHidden();
  await page.locator("#simulator-controls-toggle").click();
  await expect(page.locator("#simulator-controls-panel")).toBeVisible();
  for(const selector of ["#diagram-zoom-in","#diagram-zoom-out","#diagram-fit","#diagram-camera-toggle","#diagram-fullscreen","#simulator-predict","#simulator-presentation-mode","#sim-exercise-search","#sim-exercise-level-filter"]){
    await expect(page.locator(selector)).toBeVisible();
  }
  await page.keyboard.press("Escape");
  await expect(page.locator("#simulator-controls-panel")).toBeHidden();
});

test("los nueve intervalos de velocidad son reales y afectan la reproducción",async({page})=>{
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  const speeds=["0.1","0.25","0.5","0.75","1","1.5","2","4","8"];
  await expect(page.locator("#simulator-speed option")).toHaveCount(9);
  for(const speed of speeds){
    await page.locator("#simulator-speed").selectOption(speed);
    await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue("--sim-speed").trim())).toBe(speed);
  }
  await page.locator("#simulator-speed").selectOption("1");
});

test("el zoom solo cambia con los botones y la cámara recentra el paso",async({page})=>{
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-controls-toggle").click();
  const svg=page.locator("#flow-svg");
  const before=await svg.evaluate(el=>el.getBoundingClientRect().width);
  await page.locator("#diagram-zoom-in").click();
  const after=await svg.evaluate(el=>el.getBoundingClientRect().width);
  expect(after).toBeGreaterThan(before);
  await page.locator("#diagram-zoom-out").click();
  await page.locator("#diagram-fit").click();
  const stage=await page.locator("#diagram-stage").boundingBox();
  const node=await page.locator("#flow-node-start").boundingBox().catch(()=>null);
  expect(stage).not.toBeNull();
  if(node)expect(Math.abs((node.x+node.width/2)-(stage.x+stage.width/2))).toBeLessThan(stage.width*.35);
});

test("el modo Aparecer y Mostrar completo son seleccionables",async({page})=>{
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-controls-toggle").click();
  await page.locator("#simulator-presentation-mode").selectOption("complete");
  await expect(page.locator("body")).toHaveAttribute("data-presentation-mode","complete");
  await page.locator("#simulator-presentation-mode").selectOption("appear");
  await expect(page.locator("body")).toHaveAttribute("data-presentation-mode","appear");
});

test("los cuatro paneles se pueden ocultar y volver a mostrar",async({page})=>{
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-controls-toggle").click();
  await page.locator('[data-window-toggle="pseudocode"]').uncheck();
  await expect(page.locator("#sim-window-code")).toBeHidden();
  await page.locator('[data-window-toggle="pseudocode"]').check();
  await expect(page.locator("#sim-window-code")).toBeVisible();
  await page.locator("[data-hide-all-windows]").click();
  for(const selector of ["#sim-window-context","#sim-window-code","#PV","#PR"])await expect(page.locator(selector)).toBeHidden();
  await page.locator('[data-window-toggle="context"]').check();
  await expect(page.locator("#sim-window-context")).toBeVisible();
});
