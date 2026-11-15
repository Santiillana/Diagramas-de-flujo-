import { test, expect } from "@playwright/test";

test("Concentración ocupa el viewport, mantiene el lienzo y permite pasos exactos",async({page})=>{
  await page.setViewportSize({width:1920,height:1080});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await expect(page.locator("#flow-svg")).toBeVisible();
  const initialExercise=await page.locator("#sim-exercise-select").inputValue();
  await page.locator("#diagram-fullscreen").click();
  await expect(page.locator("body")).toHaveClass(/focus/);
  await expect(page.locator("#hd")).toBeHidden();
  await expect(page.locator("#PL")).toBeHidden();
  await expect(page.locator("#RC")).toBeHidden();
  await expect(page.locator("#dock")).toBeHidden();
  await expect(page.locator("#sim-minimap,.sim-minimap")).toHaveCount(0);
  await expect(page.locator("#flow-svg")).toBeVisible();
  const visual=await page.evaluate(()=>{
    const body=getComputedStyle(document.body),stage=document.querySelector("#diagram-stage").getBoundingClientRect();
    const node=document.querySelector(".diagram-node");
    return {background:body.backgroundColor+body.backgroundImage,stage:{x:stage.x,y:stage.y,width:stage.width,height:stage.height},
      nodeWidth:node?.getBoundingClientRect().width};
  });
  expect(visual.background).not.toMatch(/rgb\(0, 0, 0\)\s*none$/);
  expect(visual.stage.x).toBe(0);expect(visual.stage.y).toBe(0);
  expect(visual.stage.width).toBe(1920);expect(visual.stage.height).toBe(1080);
  expect(visual.nodeWidth).toBeGreaterThanOrEqual(260);
  const progress=page.locator("#simulator-timeline");
  const start=Number(await progress.inputValue());
  await page.keyboard.press("ArrowRight");
  await expect(progress).toHaveValue(String(start+1));
  await page.keyboard.press("ArrowLeft");
  await expect(progress).toHaveValue(String(start));
  for(let i=0;i<5;i++)await page.keyboard.press("ArrowRight");
  await expect(progress).toHaveValue(String(start+5));
  await expect(page.locator(".sim-flight-chip")).toHaveCount(0);
  await expect(page.locator("#simulator-question")).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(page.locator("body")).not.toHaveClass(/focus/);
  await expect(page.locator("#sim-exercise-select")).toHaveValue(initialExercise);
  await expect(progress).toHaveValue(String(start+5));
});

test("Concentración funciona por CSS aunque Fullscreen API no esté disponible",async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.evaluate(()=>{
    Object.defineProperty(document.documentElement,"requestFullscreen",{configurable:true,value:()=>Promise.reject(new Error("unsupported"))});
  });
  await page.locator("#diagram-fullscreen").click();
  await expect(page.locator("body")).toHaveClass(/focus/);
  await expect(page.locator("#diagram-fullscreen-exit")).toBeVisible();
  await page.locator("#diagram-fullscreen-exit").click();
  await expect(page.locator("body")).not.toHaveClass(/focus/);
});

test("modo Predice no cambia de sección ni el hash, y revela el evento después de responder",async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#sim-exercise-select").selectOption("24");
  const before=await page.evaluate(()=>({hash:location.hash,space:document.body.dataset.activeSpace}));
  await page.locator("#simulator-predict").click();
  await expect(page.locator("#simulator-predict")).toHaveAttribute("aria-pressed","true");
  const progress=page.locator("#simulator-timeline");
  const start=Number(await progress.inputValue());
  for(let step=0;step<40;step++){
    await page.locator("#simulator-next").click();
    if(await page.locator("#simulator-question").isVisible())break;
  }
  await expect(page.locator("#simulator-question")).toBeVisible();
  const question=await page.locator("#simulator-question").innerText();
  expect(question).toContain("PREDICE ANTES DE VER");
  const questionIndex=Number(await progress.inputValue())+1;
  await page.locator("#simulator-question [data-prediction-answer]").first().click();
  await expect(page.locator("#simulator-question-reveal")).toBeVisible();
  await expect(page.locator("#sim-question-feedback")).not.toBeEmpty();
  await page.locator("#simulator-question-reveal").click();
  await expect(progress).toHaveValue(String(questionIndex));
  const after=await page.evaluate(()=>({hash:location.hash,space:document.body.dataset.activeSpace}));
  expect(after).toEqual(before);
});
