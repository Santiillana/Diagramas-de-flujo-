import { test, expect } from "@playwright/test";

test("la salida no repite el índice de la lista nativa", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await page.locator("#simulator-run").click();
  await expect(page.locator("#simulator-output li").first()).toHaveText("1. 13");
});

test("el placeholder oculto del diagrama no tapa la vista SVG", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-space="simulator"]').click();
  await expect(page.locator("#diagram-empty")).toBeHidden();
  const display = await page.locator("#diagram-empty").evaluate(element => getComputedStyle(element).display);
  expect(display).toBe("none");
  await expect(page.locator("#flow-diagram-container svg")).toBeVisible();
});

test("el Constructor conserva la última vista válida y actualiza el SVG al corregir", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-space="builder"]').click();
  await page.locator('[data-builder-preset="sequence"]').click();
  await expect(page.locator("#builder-diagram svg")).toBeVisible();

  const processCard=page.locator('[data-node-card]').filter({hasText:"Proceso"}).first();
  await processCard.locator("[data-select-node]").click();
  const expression=page.locator('#builder-inspector-content [data-inspector-field="expression"]');
  await expression.fill("");
  await page.locator("#builder-inspector-form button[type=submit]").click();

  await expect(page.locator("#builder-diagram svg")).toBeVisible();
  await expect(page.locator("#builder-errors")).toContainText("expression");
  await expect(page.locator('[data-node-card].has-errors')).toBeVisible();
  await expect(page.locator("#builder-runtime-message")).toContainText("Se conserva el último diagrama válido");

  const corrected=page.locator('#builder-inspector-content [data-inspector-field="expression"]');
  await corrected.fill("x*3");
  await page.locator("#builder-inspector-form button[type=submit]").click();
  await expect(page.locator("#builder-diagram svg")).toBeVisible();
  await expect(page.locator("#builder-code")).toContainText("doble=x*3");
  await expect(page.locator('[data-node-card].has-errors')).toHaveCount(0);

  await page.setViewportSize({width:1440,height:960});
  await page.screenshot({path:"test-results/instruction-2-t1-desktop.png",fullPage:true});
  await page.setViewportSize({width:1024,height:768});
  await page.screenshot({path:"test-results/instruction-2-t1-tablet.png",fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:"test-results/instruction-2-t1-mobile.png",fullPage:true});
});
