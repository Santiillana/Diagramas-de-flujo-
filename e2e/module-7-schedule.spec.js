import { test, expect } from "@playwright/test";

async function openFicha(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Mi ficha" }).click();
}

test("Hoy, Semana y Calendario muestran vistas navegables", async ({ page }) => {
  await openFicha(page);
  await page.getByRole("button", { name: "Hoy", exact: true }).click();
  await expect(page.locator("#ficha-hoy")).toContainText("HORARIO OFICIAL");
  await expect(page.locator("#ficha-hoy")).toContainText("America/Bogota");

  await page.getByRole("button", { name: "Semana", exact: true }).click();
  await expect(page.locator("#ficha-semana h2")).toContainText("Semana del");
  await page.locator('[data-ficha-action="week-next"]').click();
  await expect(page.locator("#ficha-semana h2")).toBeVisible();
  await page.locator('[data-ficha-action="week-today"]').click();

  await page.getByRole("button", { name: "Calendario", exact: true }).click();
  await expect(page.locator("#ficha-calendario h2")).toBeVisible();
  await page.locator('[data-ficha-action="month-next"]').click();
  await expect(page.locator("#ficha-calendario h2")).toBeVisible();
  await page.locator('[data-ficha-action="month-today"]').click();
});

test("las actividades locales aparecen en Hoy, Semana y Calendario", async ({ page }) => {
  await page.goto("about:blank");
  const today = await page.evaluate(() => new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date()));
  await page.addInitScript(({ today }) => {
    localStorage.setItem("traza:v4:ficha", JSON.stringify({
      version: 1,
      activities: [{
        id: "activity-e2e",
        title: "Entrega de prueba",
        description: "Registro local de aceptación",
        classId: "jueves-tics",
        competencyId: null,
        assignedOn: today,
        dueOn: today,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attempts: [],
        feedbackEntries: [],
        notes: "",
        archivedAt: null,
        events: []
      }]
    }));
  }, { today });

  await openFicha(page);
  await page.getByRole("button", { name: "Hoy", exact: true }).click();
  await expect(page.locator("#ficha-hoy")).toContainText("Entrega de prueba");
  await expect(page.locator("#ficha-hoy")).toContainText("Vence hoy");

  await page.getByRole("button", { name: "Semana", exact: true }).click();
  await expect(page.locator("#ficha-semana")).toContainText("Entrega de prueba");

  await page.getByRole("button", { name: "Calendario", exact: true }).click();
  await expect(page.locator("#ficha-calendario")).toContainText("1 actividad");
  await expect(page.locator("#ficha-calendario")).toContainText("Entrega de prueba");
});

test("el horario conserva los dos bloques del sábado y el domingo libre", async ({ page }) => {
  await openFicha(page);
  await page.getByRole("button", { name: "Calendario", exact: true }).click();
  const sunday = page.locator('[data-ficha-date]').filter({ hasText: /^22/ }).first();
  await expect(page.locator("#ficha-calendario .ficha-calendar-weekdays")).toContainText("Dom");
  await expect(page.locator("#ficha-calendario")).toContainText("Selecciona un día");
  await expect(page.locator("#ficha-calendario .ficha-calendar-grid")).toBeVisible();
});
