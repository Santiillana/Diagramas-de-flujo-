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
  await page.locator('[data-add-node="process"]').click();
  await expect(page.locator("#builder-canvas-list .builder-node-card")).toHaveCount(1);
  await page.locator("#builder-undo").click();
  await expect(page.locator("#builder-canvas-list .builder-node-card")).toHaveCount(0);
  await page.locator("#builder-redo").click();
  await expect(page.locator("#builder-canvas-list .builder-node-card")).toHaveCount(1);
});
