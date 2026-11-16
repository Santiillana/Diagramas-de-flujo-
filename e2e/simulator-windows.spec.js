import { test, expect, goToSpace } from "./navigation.js";

test("las cuatro ventanas tienen controles de visibilidad y no botones de minimizar",async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("/");
  await goToSpace(page, "simulator");
  for(const selector of ["#sim-window-context","#sim-window-code","#PV","#PR"])await expect(page.locator(selector)).toBeVisible();
  await expect(page.locator("[data-window-minimize]")).toHaveCount(0);
  await expect(page.locator("[data-window-pin]")).toHaveCount(0);
  await page.locator("#simulator-controls-toggle").click();
  await page.locator('[data-window-toggle="variables"]').uncheck();
  await expect(page.locator("#PR")).toBeHidden();
  await page.locator('[data-window-toggle="variables"]').check();
  await expect(page.locator("#PR")).toBeVisible();
  await page.locator("[data-hide-all-windows]").click();
  for(const selector of ["#sim-window-context","#sim-window-code","#PV","#PR"])await expect(page.locator(selector)).toBeHidden();
  await page.locator('[data-window-toggle="context"]').check();
  await expect(page.locator("#sim-window-context")).toBeVisible();
  await expect(page.locator("#flow-svg")).toBeVisible();
});

test("la ficha contextual aparece asociada al paso y se mantiene dentro del escenario",async({page})=>{
  await page.setViewportSize({width:1440,height:950});
  await page.goto("/");
  await goToSpace(page, "simulator");
  await page.locator("#simulator-controls-toggle").click();
  await page.locator("#sim-exercise-select").selectOption("24");
  await page.locator("#simulator-timeline").evaluate(input=>{
    input.value="7";input.dispatchEvent(new Event("input",{bubbles:true}));
  });
  const card=page.locator("#vf");
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute("data-anchor-node",/.+/);
  const geometry=await page.evaluate(()=>{
    const box=document.querySelector("#vf").getBoundingClientRect();
    const stage=document.querySelector("#diagram-stage").getBoundingClientRect();
    return {inside:box.left>=stage.left&&box.right<=stage.right&&box.top>=stage.top&&box.bottom<=stage.bottom,
      width:box.width,height:box.height};
  });
  expect(geometry.inside).toBe(true);
  expect(geometry.width).toBeGreaterThan(100);
  expect(geometry.height).toBeGreaterThan(30);
});
