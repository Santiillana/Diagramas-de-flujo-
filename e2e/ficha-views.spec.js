import { test, expect, goToSpace } from "./navigation.js";

test("Clases abre en hoy y omite el domingo", async ({ page }) => {
  await page.goto("/");
  await goToSpace(page, "clases");
  await expect(page.locator("#view-clases .class-rail")).toBeVisible();
  await expect(page.locator("#view-clases .class-day-card")).toHaveCount(6);
  await expect(page.locator("#view-clases .class-day-card.is-selected")).toHaveCount(1);
  await expect(page.locator("#view-clases .class-detail")).toBeVisible();
});

test("las vistas diaria, semana y mes conservan el día seleccionado", async ({ page }) => {
  await page.goto("/");
  await goToSpace(page, "clases");
  const selected = page.locator("#view-clases .class-day-card").nth(2);
  await selected.click();
  const date = await selected.getAttribute("data-class-date");
  await page.locator('[data-class-view="semana"]').click();
  await expect(page.locator("#view-clases .class-week-card[data-class-date='" + date + "']")).toHaveAttribute("aria-pressed", "true");
  await page.locator('[data-class-view="mes"]').click();
  await expect(page.locator("#view-clases .class-month-day.is-selected")).toHaveAttribute("data-class-date", date);
  await page.locator('[data-class-view="diaria"]').click();
  await expect(page.locator("#view-clases .class-day-card.is-selected")).toHaveAttribute("data-class-date", date);
});

test("la semana y el mes permiten cambiar de periodo", async ({ page }) => {
  await page.goto("/");
  await goToSpace(page, "clases");
  await page.locator('[data-class-view="semana"]').click();
  const week = page.locator("#view-clases .class-month-heading h3");
  const weekBefore = await week.innerText();
  await page.locator('[data-class-week="1"]').click();
  await expect(week).not.toHaveText(weekBefore);
  await page.locator('[data-class-view="mes"]').click();
  const month = page.locator("#view-clases .class-month-heading h3");
  const monthBefore = await month.innerText();
  await page.locator('[data-class-month="1"]').click();
  await expect(month).not.toHaveText(monthBefore);
});

test("Clases no desborda en tablet ni móvil", async ({ page }) => {
  for (const width of [1280, 760, 390, 375]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/");
    await goToSpace(page, "clases");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "desbordamiento de Clases en " + width).toBeLessThanOrEqual(1);
  }
});

test("el botón Hoy vuelve al día actual después de navegar", async ({ page }) => {
  await page.goto("/");
  await goToSpace(page, "clases");
  await page.locator("#view-clases .class-day-card").first().click();
  await page.locator('[data-class-view="semana"]').click();
  await page.locator('[data-class-week="1"]').click();
  await page.locator("[data-class-today]").click();
  await expect(page.locator("#view-clases .class-week-card.is-today")).toHaveAttribute("aria-pressed", "true");
});
