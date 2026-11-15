import { test, expect } from "@playwright/test";

test("Leer anima el valor hasta Variables y pulsa la ventana de destino",async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-next").click();
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
  await page.locator("#simulator-next").click();
  await expect(page.locator('#simulator-flight-layer .sim-flight-chip[data-destination="output"]')).toBeAttached({timeout:5000});
  await page.locator("#simulator-next").click();
  await expect(page.locator("#simulator-flight-layer .sim-flight-chip")).toHaveCount(0);
  await expect(page.locator("#timeline-count")).toContainText("/");
});


test("cinco saltos rápidos cancelan chips, pulsos y contadores pendientes",async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-speed").selectOption("300");
  await page.locator("#simulator-next").click();
  await expect(page.locator('#simulator-flight-layer .sim-flight-chip[data-destination="variables"]')).toBeAttached({timeout:5000});
  const timeline=page.locator("#simulator-timeline");
  for(const step of [2,3,4,5,1]){
    await timeline.evaluate((input,value)=>{
      input.value=String(value);
      input.dispatchEvent(new Event("input",{bubbles:true}));
    },step);
  }
  await expect(page.locator("#simulator-flight-layer .sim-flight-chip")).toHaveCount(0);
  await expect(page.locator("[data-pulse]")).toHaveCount(0);
  await expect(page.locator(".sim-pulse-count")).toHaveCount(0);
});

test("movimiento reducido conserva el resaltado instantáneo y omite vuelos y animaciones",async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-next").click();
  await expect(page.locator('#PR > .variables-panel[data-pulse]')).toBeVisible();
  await expect(page.locator("#simulator-flight-layer .sim-flight-chip")).toHaveCount(0);
  const styles=await page.locator('#PR > .variables-panel').evaluate(el=>({
    animation:getComputedStyle(el).animationName,
    duration:getComputedStyle(el).animationDuration
  }));
  expect(styles.animation).toBe("none");
  expect(styles.duration==="0s"||styles.duration==="1ms").toBe(true);
});
