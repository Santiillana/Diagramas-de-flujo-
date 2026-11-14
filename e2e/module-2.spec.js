import { test, expect } from "@playwright/test";

test("Aprende presenta las catorce lecciones con explicación y comprobación", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-space="learn"]').click();
  await expect(page.locator('[data-lesson-id]')).toHaveCount(14);
  await page.locator('[data-lesson-id="variables"]').click();
  await expect(page.locator("#lesson-detail h3")).toHaveText("Variables y asignación");
  await page.locator("[data-visual-next]").click();
  await expect(page.locator(".visual-step-count")).toHaveText("2 / 3");
  await page.locator('[data-check-option="1"]').click();
  await expect(page.locator("#lesson-feedback")).toContainText("Correcto");
});

test("el catálogo muestra exactamente cuarenta ejercicios y filtra 20/10/10", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(40);
  await page.locator("#exercise-level").selectOption("basic");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(20);
  await page.locator("#exercise-level").selectOption("intermediate");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(10);
  await page.locator("#exercise-level").selectOption("advanced");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(10);
  await page.locator("#exercise-level").selectOption("all");
  await page.locator("#exercise-search").fill("Fibonacci");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(1);
});

test("la ficha del ejercicio explica las entradas, métodos y pruebas", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-select-exercise="23"]').click();
  await expect(page.locator("#exercise-detail h3")).toHaveText("Fibonacci: términos que no superen 40");
  await expect(page.locator("#exercise-detail .method-tab")).toHaveCount(1);
  await expect(page.locator("#exercise-detail .exercise-test-cases")).toContainText("secuencia completa");
  await expect(page.locator("#exercise-detail")).toContainText("El límite es inclusivo");
});

test("un ejercicio con alternativas permite cambiar de método", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-select-exercise="4"]').click();
  await expect(page.locator("#exercise-detail .method-tab")).toHaveCount(2);
  await page.locator("#exercise-detail [data-method-index='1']").click();
  await expect(page.locator("#exercise-detail .method-tab[aria-selected='true']")).toContainText("Acumular con Para");
});
