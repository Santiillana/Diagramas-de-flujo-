import {test,expect} from "@playwright/test";

test("Concentración cubre el viewport, oculta el menú y conserva los pasos",async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-controls-toggle").click();
  const initial=await page.locator("#sim-exercise-select").inputValue();
  await page.locator("#diagram-fullscreen").click();
  await expect(page.locator("body")).toHaveClass(/focus/);
  for(const selector of ["#hd","#PL","#RC","#dock",".simulator-control-dock"])await expect(page.locator(selector)).toBeHidden();
  await expect(page.locator("#flow-svg")).toBeVisible();
  const stage=await page.locator("#diagram-stage").boundingBox();
  expect(stage.x).toBe(0);expect(stage.y).toBe(0);
  expect(stage.width).toBe(1440);expect(stage.height).toBe(900);
  await expect(page.locator(".diagram-node").first()).toBeVisible();
  const progress=page.locator("#simulator-timeline");
  const start=Number(await progress.inputValue());
  await page.keyboard.press("ArrowRight");
  await expect(progress).toHaveValue(String(start+1));
  await page.keyboard.press("ArrowLeft");
  await expect(progress).toHaveValue(String(start));
  await page.locator("#focus-next").click();
  await expect(progress).toHaveValue(String(start+1));
  await page.keyboard.press("Escape");
  await expect(page.locator("body")).not.toHaveClass(/focus/);
  await expect(page.locator("#hd")).toBeVisible();
  await expect(page.locator("#sim-exercise-select")).toHaveValue(initial);
});

test("Concentración funciona sin Fullscreen API",async({page})=>{
  await page.setViewportSize({width:1024,height:768});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-controls-toggle").click();
  await page.evaluate(()=>{
    Object.defineProperty(document.documentElement,"requestFullscreen",{configurable:true,value:()=>Promise.reject(new Error("unsupported"))});
  });
  await page.locator("#diagram-fullscreen").click();
  await expect(page.locator("body")).toHaveClass(/focus/);
  await expect(page.locator("#diagram-fullscreen-exit")).toBeVisible();
  await page.locator("#diagram-fullscreen-exit").click();
  await expect(page.locator("body")).not.toHaveClass(/focus/);
});

test("Predice detiene el recorrido antes de revelar un evento y no cambia de espacio",async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-controls-toggle").click();
  await page.locator("#sim-exercise-select").selectOption("24");
  const before=await page.evaluate(()=>({space:document.body.dataset.activeSpace,hash:location.hash}));
  await page.locator("#simulator-predict").click();
  await expect(page.locator("#simulator-predict")).toHaveAttribute("aria-pressed","true");
  for(let i=0;i<40;i++){
    await page.locator("#simulator-next").click();
    if(await page.locator("#simulator-question").isVisible())break;
  }
  await expect(page.locator("#simulator-question")).toBeVisible();
  await expect(page.locator("#simulator-question")).toContainText("PREDICE ANTES DE VER");
  await page.locator("#simulator-question [data-prediction-answer]").first().click();
  await expect(page.locator("#simulator-question-reveal")).toBeVisible();
  await page.locator("#simulator-question-reveal").click();
  const after=await page.evaluate(()=>({space:document.body.dataset.activeSpace,hash:location.hash}));
  expect(after).toEqual(before);
});
