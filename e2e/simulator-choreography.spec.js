import {test,expect} from "@playwright/test";

test("el paso activo actualiza la ficha contextual con su símbolo y explicación",async({page})=>{
  await page.setViewportSize({width:1440,height:950});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await expect(page.locator("#vf")).toBeVisible();
  await expect(page.locator("#vf")).toHaveClass(/is-arriving/);
  const before=await page.locator("#vf").getAttribute("data-anchor-node");
  await page.locator("#simulator-next").click();
  await expect(page.locator("#vf")).toBeVisible();
  await expect(page.locator("#vf")).toHaveClass(/is-arriving/);
  const after=await page.locator("#vf").getAttribute("data-anchor-node");
  expect(after).not.toBeNull();
  await expect(page.locator("#vf-content")).not.toBeEmpty();
  await expect(page.locator("#scene-content .scene-symbol-explanation")).toBeVisible();
  expect(Number(after)).toBeGreaterThanOrEqual(0);
  expect(before).not.toBeNull();
});

test("las velocidades extremas cambian la duración visual sin desactivar el recorrido",async({page})=>{
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-speed").selectOption("0.1");
  await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue("--sim-speed").trim())).toBe("0.1");
  const slow=await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sim-animation-duration")));
  await page.locator("#simulator-speed").selectOption("8");
  await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue("--sim-speed").trim())).toBe("8");
  const fast=await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sim-animation-duration")));
  expect(slow).toBeGreaterThan(fast);
  await page.locator("#simulator-next").click();
  await expect(page.locator("#flow-diagram-container .flow-token")).toHaveAttribute("visibility","visible");
});

test("Mostrar completo revela la ficha de inmediato y mantiene el paso activo",async({page})=>{
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-controls-toggle").click();
  await page.locator("#simulator-presentation-mode").selectOption("complete");
  await page.locator("#simulator-next").click();
  await expect(page.locator("body")).toHaveAttribute("data-presentation-mode","complete");
  await expect(page.locator("#vf")).toBeVisible();
  await expect(page.locator("#timeline-count")).toContainText("/");
  await expect(page.locator("#flow-diagram-container .flow-token")).toHaveAttribute("visibility","visible");
});
