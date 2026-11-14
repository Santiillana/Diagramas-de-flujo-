import { test, expect } from "@playwright/test";

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
  await page.locator("#diagram-fullscreen").click();
  await expect.poll(()=>page.evaluate(()=>Boolean(document.fullscreenElement))).toBe(false);
});

test("se puede desplazar el lienzo con arrastre y la cámara pasa a control manual",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  const stage=page.locator("#diagram-stage");
  await expect(stage).toBeVisible();
  const initial=await stage.evaluate(el=>el.scrollLeft);
  const rect=await stage.boundingBox();
  await page.mouse.move(rect.x+Math.min(rect.width-30,280),rect.y+120);
  await page.mouse.down();
  await page.mouse.move(rect.x+40,rect.y+120,{steps:5});
  await page.mouse.up();
  const scrolled=await stage.evaluate(el=>el.scrollLeft);
  expect(scrolled).toBeGreaterThanOrEqual(initial);
  await expect(page.locator("#diagram-camera-toggle")).toHaveAttribute("aria-pressed","false");
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
  await decision.click();
  await expect(page.locator("#flow-token")).toHaveAttribute("visibility","visible");
  await expect(page.locator(".diagram-edge.is-route-active")).toHaveCount(1);
  await expect(page.locator(".diagram-edge.is-route-active .diagram-edge-label")).toContainText("F");
});
