import { test, expect, goToSpace } from "./navigation.js";

test("Horario da más presencia a la materia, la hora y el emblema de competencia", async ({ page }) => {
  await page.goto("/");
  await goToSpace(page, "hoy");
  const days = page.locator(".control-day");
  await expect(days).toHaveCount(6);
  await expect(page.locator(".control-class-heading .competence-emblem").first()).toBeVisible();
  await expect(page.locator(".control-class-heading strong").first()).toHaveCSS("font-size", "18px");
  await expect(page.locator(".control-class time").first()).toContainText("18:00");
  await expect(page.locator(".control-day.is-today")).toBeVisible();
});

test("cada evidencia abre su detalle con competencia, fecha, instrucciones y entrega", async ({ page }) => {
  await page.goto("/");
  await goToSpace(page, "hoy");
  const cards = page.locator(".control-evidence-card");
  await expect(cards).toHaveCount(4);
  await expect(cards.first().locator(".competence-emblem svg")).toBeVisible();
  await expect(cards.first().locator(".control-evidence-description")).not.toBeEmpty();
  await cards.first().locator("[data-evidence-open]").click();
  const dialog = page.locator("#control-evidence-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".control-evidence-detail-competence")).toBeVisible();
  await expect(dialog.locator(".control-evidence-detail-date")).toContainText("Límite");
  await expect(dialog).toContainText("Qué debes hacer");
  await expect(dialog).toContainText("Qué debes entregar");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("el Centro de control y su detalle se adaptan a 375 y 1280 px", async ({ page }) => {
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await goToSpace(page, "hoy");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "desbordamiento del Centro de control en " + width).toBeLessThanOrEqual(1);
    await page.locator("[data-evidence-open]").first().click();
    await expect(page.locator("#control-evidence-dialog")).toBeVisible();
    const dialogOverflow = await page.evaluate(() => {
      const dialog = document.querySelector("#control-evidence-dialog");
      return dialog.scrollWidth - dialog.clientWidth;
    });
    expect(dialogOverflow, "desbordamiento del detalle en " + width).toBeLessThanOrEqual(1);
  }
});
