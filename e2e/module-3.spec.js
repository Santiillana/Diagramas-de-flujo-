import { test, expect } from "@playwright/test";

test("el simulador ejecuta la suma y sincroniza salida, variables y SVG", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await expect(page.locator("#simulator-exercise-title")).toHaveText("Suma de dos números");
  await expect(page.locator("#simulator-status")).toContainText("TRAZA GENERADA");
  await page.locator("#simulator-last").click();
  await expect(page.locator("#simulator-output")).toContainText("13");
  await expect(page.locator("#variables-content")).toContainText("a");
  await expect(page.locator("#variables-content")).toContainText("13");
  await expect(page.locator("#flow-svg")).toBeVisible();
  await expect(page.locator(".diagram-node")).not.toHaveCount(0);
});

test("avanzar y retroceder reconstruye exactamente el estado del paso", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  const firstLabel = await page.locator("#dock-step-title").textContent();
  await page.locator("#simulator-next").click();
  const nextLabel = await page.locator("#dock-step-title").textContent();
  expect(nextLabel).not.toBe(firstLabel);
  await page.locator("#simulator-previous").click();
  await expect(page.locator("#dock-step-title")).toHaveText(firstLabel);
});

test("se puede seleccionar un ejercicio desde el catálogo y cambiar sus datos", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-page-next]").click();
  await page.locator('[data-select-exercise="14"]').click();
  await page.locator("#exercise-detail [data-reveal-solution]").click();
  await expect(page.locator("#exercise-detail [data-open-simulator]")).toBeVisible();
  await page.locator("#exercise-detail [data-open-simulator]").click();
  await expect(page.locator("#simulator-exercise-title")).toHaveText("Sumar los números de 1 hasta N");
  await page.locator("#simulator-last").click();
  await expect(page.locator("#simulator-output")).toContainText("10");
  await page.locator("#simulator-inputs").fill("6");
  await page.locator("#simulator-run").click();
  await page.locator("#simulator-last").click();
  await expect(page.locator("#simulator-output")).toContainText("21");
  await expect(page.locator("#simulator-status")).toContainText("TRAZA GENERADA");
});

test("el motor detiene entradas incompletas sin inventar valores", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-inputs").fill("8");
  await page.locator("#simulator-run").click();
  await expect(page.locator("#simulator-status")).toContainText("EJECUCIÓN DETENIDA");
  await page.locator("#simulator-last").click();
  await expect(page.locator("#scene-content")).toContainText("Falta un dato");
});

test("el diagrama y los paneles siguen contenidos en pantallas pequeñas", async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  const report = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        offenders: [...document.querySelectorAll("body *")].map(element => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {tag:element.tagName,id:element.id,className:typeof element.className==="string"?element.className:"",left:Math.round(rect.left),right:Math.round(rect.right),width:Math.round(rect.width),overflow:style.overflow,position:style.position};
        }).filter(item => item.width>0 && item.right>innerWidth+1 && item.overflow!=="hidden").sort((a,b)=>b.right-a.right).slice(0,12)
      }));
      const overflow=report.scrollWidth-report.width;
  expect(overflow,`overflow horizontal del simulador: ${JSON.stringify(report.offenders)}`).toBeLessThanOrEqual(1);
  await expect(page.locator("#flow-diagram-container")).toBeVisible();
  await page.locator('#simulator-mobile-tabs [data-mobile-panel="scene"]').click();
  await expect(page.locator("#scene-content")).toBeVisible();
  await page.locator('#simulator-mobile-tabs [data-mobile-panel="variables"]').click();
  await expect(page.locator("#variables-content")).toBeVisible();
  await page.locator('#simulator-mobile-tabs [data-mobile-panel="diagram"]').click();
  await expect(page.locator("#flow-diagram-container")).toBeVisible();
});
