import { test, expect } from "@playwright/test";

test("Leer anima el valor hasta Variables y pulsa la ventana de destino",async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-speed").selectOption("300");
  await page.locator("#simulator-play").click();
  const flight=page.locator('#simulator-flight-layer .sim-flight-chip[data-destination="variables"]');
  await expect(flight).toBeAttached({timeout:5000});
  await expect(flight).toContainText("8");
  await expect(page.locator('#PR > .variables-panel[data-pulse]')).toBeVisible({timeout:5000});
  await expect(page.locator('#PR > .variables-panel .sim-pulse-count')).toContainText("+1");
});

test("Imprimir vuela hacia Pantalla y una interrupción manual cancela los vuelos pendientes",async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  const outputStep=page.locator("#trace-history li").filter({hasText:"SALIDA"}).first();
  const index=Number(await outputStep.getAttribute("data-history-step"));
  await page.locator("#simulator-timeline").evaluate((input,value)=>{input.value=String(value-1);input.dispatchEvent(new Event("input",{bubbles:true}));},index);
  await page.locator("#simulator-speed").selectOption("300");
  await page.locator("#simulator-play").click();
  await expect(page.locator('#simulator-flight-layer .sim-flight-chip[data-destination="output"]')).toBeAttached({timeout:5000});
  await page.locator("#simulator-next").click();
  await expect(page.locator("#simulator-flight-layer .sim-flight-chip")).toHaveCount(0);
  await expect(page.locator("#timeline-count")).toContainText("/");
});
