import { test, expect } from "@playwright/test";

test("la barra tiene controles etiquetados, accesibles y sin Laboratorio",async({page})=>{
  await page.setViewportSize({width:1920,height:1080});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await expect(page.locator("#simulator-lab")).toHaveCount(0);
  await expect(page.locator("#sim-exercise-search")).toBeVisible();
  await expect(page.locator("#sim-exercise-level-filter")).toBeVisible();
  const controls=page.locator("#simulator-toolbar button");
  const count=await controls.count();
  expect(count).toBeGreaterThanOrEqual(10);
  for(let i=0;i<count;i++){
    const button=controls.nth(i);
    await expect(button).toHaveAttribute("aria-label",/.+/);
    await expect(button).toHaveAttribute("title",/.+/);
  }
  const before=await page.evaluate(()=>({hash:location.hash,space:document.body.dataset.activeSpace}));
  await page.locator("#simulator-predict").click();
  await expect(page.locator("#simulator-predict")).toHaveAttribute("aria-pressed","true");
  await page.locator("#simulator-predict").click();
  await page.locator("#diagram-camera-toggle").click();
  await expect(page.locator("#diagram-camera-toggle")).toHaveAttribute("aria-pressed","false");
  await page.locator("#diagram-zoom-in").click();
  const zoomed=Number(await page.locator("#flow-diagram-container").getAttribute("data-camera-zoom"));
  await page.locator("#diagram-zoom-out").click();
  expect(Number(await page.locator("#flow-diagram-container").getAttribute("data-camera-zoom"))).toBeLessThan(zoomed);
  await page.locator("#diagram-fit").click();
  await page.locator("#simulator-panel-toggle").click();
  await expect(page.locator("#PL")).toBeHidden();
  await page.locator("#simulator-panel-toggle").click();
  await expect(page.locator("#PL")).toBeVisible();
  await page.locator("#diagram-fullscreen").click();
  await expect(page.locator("body")).toHaveClass(/focus/);
  await page.keyboard.press("Escape");
  await expect(page.locator("body")).not.toHaveClass(/focus/);
  expect(await page.evaluate(()=>({hash:location.hash,space:document.body.dataset.activeSpace}))).toEqual(before);
});

test("el selector admite búsqueda y selección por teclado",async({page})=>{
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  const initial=await page.locator("#sim-exercise-select").inputValue();
  await page.locator("#sim-exercise-search").fill("Factorial");
  await expect(page.locator("#sim-exercise-select option")).toHaveCount(2);
  await expect(page.locator("#sim-exercise-select option").filter({hasText:"Factorial"})).toHaveCount(1);
  await page.locator("#sim-exercise-search").fill("");
  await page.locator("#sim-exercise-select").selectOption("21");
  await expect(page.locator("#simulator-exercise-title")).toContainText("Factorial");
  await page.locator("#simulator-text-smaller").click();
  await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.body).getPropertyValue("--fs").trim())).toBe("16");
  await page.locator("#simulator-text-reset").click();
  await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.body).getPropertyValue("--fs").trim())).toBe("17");
  await page.locator("#sim-exercise-select").selectOption(initial);
});
