import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("el catálogo muestra los cinco ejercicios expertos y su ficha matemática", async ({ page }) => {
  await page.locator("#exercise-level").selectOption("expert");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(5);
  await page.locator('[data-select-exercise="43"]').click();
  await expect(page.locator("#exercise-detail h3")).toContainText("Cramer");
  await page.locator("[data-reveal-solution]").click();
  await expect(page.locator(".exercise-pseudocode")).toContainText("Dx");
});

test("el filtro por concepto y el filtro De clase reducen el catálogo", async ({ page }) => {
  await page.locator("#exercise-category").selectOption("Repetición");
  const loopCount = await page.locator("[data-select-exercise]").count();
  expect(loopCount).toBeGreaterThan(0);
  await page.locator("#exercise-category").selectOption("all");
  await page.locator("#exercise-class-only").check();
  await expect(page.locator("[data-select-exercise]")).toHaveCount(4);
});

test("el constructor permite deshacer y rehacer una instrucción", async ({ page }) => {
  await page.locator('[data-space="builder"]').click();
  const cards=page.locator("#builder-canvas-list .builder-node-card");
  const initialCount=await cards.count();
  await page.locator('[data-add-node="process"]').click();
  await expect(cards).toHaveCount(initialCount+1);
  await page.locator("#builder-undo").click();
  await expect(cards).toHaveCount(initialCount);
  await page.locator("#builder-redo").click();
  await expect(cards).toHaveCount(initialCount+1);
});

test("el catálogo busca por número y pagina sin perder los filtros", async ({ page }) => {
  await page.locator("#exercise-search").fill("45");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(1);
  await expect(page.locator('[data-select-exercise="45"]')).toBeVisible();
  await page.locator("#exercise-search").fill("");
  await page.locator("#exercise-level").selectOption("all");
  await expect(page.locator("[data-page-next]")).toBeEnabled();
  await page.locator("[data-page-next]").click();
  await expect(page.locator(".exercise-pagination")).toContainText("Página 2");
});

test("el panel de inicio actualiza el progreso y sus accesos llevan al espacio correcto", async ({ page }) => {
  await expect(page.locator("#home-lesson-count")).toHaveText("17");
  await expect(page.locator("#home-exercise-count")).toHaveText("45");
  await expect(page.locator("#home-expert-count")).toHaveText("5");
  await page.locator('[data-go="builder"]').click();
  await expect(page.locator("#view-builder")).toBeVisible();
  await expect(page.locator('[data-space="builder"]')).toHaveAttribute("aria-current","page");
});

test("el Constructor restaura plantillas y admite deshacer/rehacer con teclado", async ({ page }) => {
  await page.locator('[data-space="builder"]').click();
  await page.locator('[data-builder-preset="decision"]').click();
  const cards=page.locator("#builder-canvas-list .builder-node-card");
  const before=await cards.count();
  await page.locator('[data-add-node="process"]').click();
  await expect(cards).toHaveCount(before+1);
  await page.locator("#view-builder").press("Control+z");
  await expect(cards).toHaveCount(before);
  await page.locator("#view-builder").press("Control+Shift+z");
  await expect(cards).toHaveCount(before+1);
});
