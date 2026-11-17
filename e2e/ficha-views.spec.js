import { test, expect } from "@playwright/test";
import { goToSpace } from "./navigation.js";

test("Hoy presenta actividades, filtros compartidos y horario del día", async ({ page }) => {
  await page.goto("/");
  await goToSpace(page, "hoy");
  await expect(page.locator("#view-hoy .ficha-demo-notice")).toBeVisible();
  await expect(page.locator("#view-hoy .ficha-activity-card").first()).toBeVisible();
  await expect(page.locator("#hoy-competencia")).toHaveValue("todas");
  const weekday = await page.evaluate(() => new Date().getDay());
  const classesExpected = weekday === 0 ? 0 : weekday === 6 ? 2 : 1;
  await expect(page.locator("#view-hoy .ficha-class-item")).toHaveCount(classesExpected);
  await page.locator("#hoy-competencia").selectOption("matematicas");
  await goToSpace(page, "semana");
  await expect(page.locator("#semana-competencia")).toHaveValue("matematicas");
  await page.locator("#semana-competencia").selectOption("todas");
  await expect(page.locator("#view-semana .ficha-week-block")).toHaveCount(7);
});

test("Semana permite navegar y muestra los bloques transcritos del lunes al sábado", async ({ page }) => {
  await page.goto("/");
  await goToSpace(page, "semana");
  await expect(page.locator("#view-semana .ficha-week-desktop")).toBeVisible();
  await expect(page.locator("#view-semana .ficha-week-block")).toHaveCount(7);
  await expect(page.locator("#view-semana .ficha-week-note")).toContainText("Matemáticas");
  await expect(page.locator("#view-semana .ficha-week-block").filter({ hasText: "Comunicación" })).toBeVisible();
  await expect(page.locator("#view-semana .ficha-week-block").filter({ hasText: "TICS" })).toBeVisible();
  const antes = await page.locator("#view-semana .ficha-date-range").textContent();
  await page.locator("[data-week-action='next']").click();
  expect(await page.locator("#view-semana .ficha-date-range").textContent()).not.toBe(antes);
  await page.locator("[data-week-action='today']").click();
  await expect(page.locator("#view-semana .ficha-date-range")).toBeVisible();
});

test("Calendario ofrece navegación mensual, horario recurrente y detalle seleccionable", async ({ page }) => {
  await page.goto("/");
  await goToSpace(page, "calendario");
  await expect(page.locator("#view-calendario .ficha-calendar-grid")).toBeVisible();
  await expect(page.locator("#view-calendario .ficha-calendar-cell")).toHaveCount(42);
  await expect(page.locator("#view-calendario .ficha-calendar-event--class").first()).toBeVisible();
  const antes = await page.locator("#view-calendario .ficha-month-title").textContent();
  await page.locator("[data-month-action='next']").click();
  expect(await page.locator("#view-calendario .ficha-month-title").textContent()).not.toBe(antes);
  await page.locator("[data-month-action='today']").click();
  const monday = await page.evaluate(() => {
    const date = new Date();
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  });
  await page.locator('[data-calendar-day="' + monday + '"]').click();
  await expect(page.locator("#view-calendario .ficha-calendar-detail")).toContainText("Evaluar requisitos");
});

test("Semana y Calendario responden en tableta y móvil sin desbordamiento", async ({ page }) => {
  for (const width of [760, 390, 320]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/");
    await goToSpace(page, "semana");
    if (width <= 760) {
      await expect(page.locator("#view-semana .ficha-mobile-week")).toBeVisible();
      await expect(page.locator("#view-semana [data-mobile-day]")).toHaveCount(6);
    } else {
      await expect(page.locator("#view-semana .ficha-week-desktop")).toBeVisible();
    }
    let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "desbordamiento de Semana en " + width).toBeLessThanOrEqual(1);
    await goToSpace(page, "calendario");
    overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "desbordamiento de Calendario en " + width).toBeLessThanOrEqual(1);
  }
});

test("el filtro por estado y Limpiar funcionan", async ({ page }) => {
  await page.goto("/");
  await goToSpace(page, "hoy");
  await page.locator("#hoy-estado").selectOption("atrasada");
  await expect(page.locator("#view-hoy .ficha-activity-card")).toHaveCount(1);
  await page.locator("[data-ficha-filter-clear]").click();
  await expect(page.locator("#hoy-estado")).toHaveValue("todos");
  await expect(page.locator("#hoy-competencia")).toHaveValue("todas");
});
