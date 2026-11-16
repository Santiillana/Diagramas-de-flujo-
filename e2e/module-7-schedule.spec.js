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
  await page.getByRole("button", { name: "Semana", exact: true }).click();
  const saturday = page.locator(".ficha-day-block").filter({ hasText: "sábado" });
  const sunday = page.locator(".ficha-day-block").filter({ hasText: "domingo" });
  await expect(saturday.locator(".ficha-class-card")).toHaveCount(2);
  await expect(saturday).toContainText("Clase del sábado");
  await expect(sunday).toContainText("No tienes clases programadas este día.");
});


test("el respaldo se descarga y la importación válida reemplaza con confirmación", async ({ page }) => {
  await openFicha(page);
  await page.getByRole("button", { name: "Hoy", exact: true }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#ficha-backup-export").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^traza-mi-ficha-\d{4}-\d{2}-\d{2}\.json$/);
  await expect(page.locator("#ficha-backup-status")).toContainText("Respaldo descargado");

  const timestamp = new Date().toISOString();
  const backup = {
    format: "traza-ficha-backup",
    version: 1,
    exportedAt: timestamp,
    data: {
      version: 1,
      activities: [{
        id: "activity-imported",
        title: "Actividad restaurada",
        description: "",
        classId: null,
        competencyId: null,
        assignedOn: null,
        dueOn: null,
        status: "pending",
        createdAt: timestamp,
        updatedAt: timestamp,
        attempts: [],
        feedbackEntries: [],
        notes: "",
        archivedAt: null,
        events: []
      }]
    }
  };
  page.once("dialog", dialog => dialog.accept());
  await page.locator("#ficha-backup-file").setInputFiles({
    name: "respaldo.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup))
  });
  await expect(page.locator("#ficha-backup-status")).toContainText("Respaldo restaurado");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("traza:v4:ficha")));
  expect(stored.activities[0].title).toBe("Actividad restaurada");
});
