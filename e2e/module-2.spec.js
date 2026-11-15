import { test, expect } from "@playwright/test";

test("Aprende presenta las diecisiete lecciones con explicación y comprobación", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-space="learn"]').click();
  await expect(page.locator('[data-lesson-id]')).toHaveCount(17);
  await page.locator('[data-lesson-id="variables"]').click();
  await expect(page.locator("#lesson-detail h3")).toHaveText("Variables y asignación");
  await page.locator("#lesson-data-input").fill("15");
  await expect(page.locator("#lesson-data-result")).toContainText("15 → 20");
  await page.locator("[data-visual-next]").click();
  await expect(page.locator(".visual-step-count")).toHaveText("2 / 3");
  await page.locator('[data-check-option="1"]').click();
  await expect(page.locator("#lesson-feedback")).toContainText("Correcto");
});

test("el catálogo muestra 45 ejercicios, filtra los niveles y pagina el resultado", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(12);
  await expect(page.locator("#exercise-count")).toContainText("45 ejercicios");
  await page.locator("#exercise-level").selectOption("basic");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(12);
  await page.locator("[data-page-next]").click();
  await expect(page.locator("[data-select-exercise]")).toHaveCount(8);
  await page.locator("#exercise-level").selectOption("intermediate");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(10);
  await page.locator("#exercise-level").selectOption("advanced");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(10);
  await page.locator("#exercise-level").selectOption("expert");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(5);
  await page.locator("#exercise-level").selectOption("all");
  await page.locator("#exercise-search").fill("Fibonacci");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(1);
});

test("la ficha del ejercicio explica las entradas, métodos y pruebas", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-page-next]").click();
  await page.locator('[data-select-exercise="23"]').click();
  await expect(page.locator("#exercise-detail h3")).toHaveText("Fibonacci: términos que no superen 40");
  await expect(page.locator(".exercise-gate")).toBeVisible();
  await expect(page.locator("#exercise-detail .exercise-methods")).toBeHidden();
  await page.locator("[data-exercise-hint]").click();
  await expect(page.locator("[data-gate-feedback]")).toContainText("Conceptos");
  await page.locator("[data-reveal-solution]").click();
  await expect(page.locator("#exercise-detail .method-tab")).toHaveCount(1);
  await expect(page.locator("#exercise-detail .exercise-test-cases")).toContainText("secuencia completa");
  await expect(page.locator("#exercise-detail")).toContainText("El límite es inclusivo");
});

test("un ejercicio con alternativas permite cambiar de método", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-select-exercise="4"]').click();
  await page.locator("[data-reveal-solution]").click();
  await expect(page.locator("#exercise-detail .method-tab")).toHaveCount(2);
  await page.locator("#exercise-detail [data-method-index='1']").click();
  await expect(page.locator("#exercise-detail .method-tab[aria-selected='true']")).toContainText("Acumular con Para");
});

test("el modo reto guarda entradas, proceso y salida antes de revelar", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-select-exercise=\"1\"]").click();
  await page.locator("[data-attempt-field=\"inputs\"]").fill("a=8, b=5");
  await page.locator("[data-attempt-field=\"process\"]").fill("sumar los dos valores");
  await page.locator("[data-attempt-field=\"outputs\"]").fill("13");
  await page.locator("[data-save-attempt]").click();
  await expect(page.locator("[data-gate-feedback]")).toContainText("guardado");
  await page.locator("[data-reveal-solution]").click();
  await page.reload();
  await page.locator("[data-select-exercise=\"1\"]").click();
  await expect(page.locator("[data-attempt-field=\"outputs\"]")).toHaveValue("13");
});

test("Aprende y Ejercicios se mantienen dentro del ancho en móvil", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const space of ["learn", "exercises"]) {
    await page.locator("[data-space=\"" + space + "\"]").click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "overflow horizontal en " + space).toBeLessThanOrEqual(1);
  }
});