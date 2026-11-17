import { test, expect } from "@playwright/test";

async function openActivities(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Mi ficha" }).click();
  await page.getByRole("button", { name: "Actividades", exact: true }).click();
}

test("crear actividad, registrar intentos y devoluciones, y archivar", async ({ page }) => {
  await openActivities(page);
  await page.getByRole("heading", { name: "Mis actividades" }).waitFor();

  await page.getByRole("button", { name: /Nueva actividad/ }).click();
  await page.locator('#ficha-activity-create-form [name="title"]').fill("Construir un algoritmo");
  await page.locator('#ficha-activity-create-form [name="description"]').fill("Resolver el problema y documentar el procedimiento.");
  await page.locator('#ficha-activity-create-form [name="classId"]').selectOption("jueves-tics");
  await page.locator('#ficha-activity-create-form button[type="submit"]').click();

  await expect(page.locator("#ficha-activities-list")).toContainText("Construir un algoritmo");
  await expect(page.locator("#ficha-activity-detail")).toContainText("Construir un algoritmo");
  await expect(page.locator("#ficha-activity-detail")).toContainText("Pendiente");

  await page.locator("#ficha-activity-detail details summary").filter({ hasText: "Editar información" }).click();
  await page.locator('#ficha-activity-edit-form [name="title"]').fill("Construir un algoritmo corregido");
  await page.locator('#ficha-activity-edit-form button[type="submit"]').click();
  await expect(page.locator("#ficha-activity-detail")).toContainText("Construir un algoritmo corregido");

  await page.locator('#ficha-activity-detail [data-activity-start]').click();
  await expect(page.locator("#ficha-activity-detail")).toContainText("En curso");

  await page.locator('#ficha-activity-submit-form [name="summary"]').fill("Primera versión del algoritmo.");
  await page.locator('#ficha-activity-submit-form button[type="submit"]').click();
  await expect(page.locator("#ficha-activity-detail")).toContainText("Entrega 1");
  await expect(page.locator("#ficha-activity-detail")).toContainText("Entregada");

  await page.locator('#ficha-activity-feedback-form [name="result"]').selectOption("correction_requested");
  await page.locator('#ficha-activity-feedback-form [name="comment"]').fill("Corregir la condición del ciclo.");
  await page.locator('#ficha-activity-feedback-form button[type="submit"]').click();
  await expect(page.locator("#ficha-activity-detail")).toContainText("Por corregir");

  await page.locator('#ficha-activity-submit-form [name="summary"]').fill("Segunda versión corregida.");
  await page.locator('#ficha-activity-submit-form button[type="submit"]').click();
  await expect(page.locator("#ficha-activity-detail")).toContainText("Entrega 2");

  await page.locator('#ficha-activity-feedback-form [name="result"]').selectOption("favorable");
  await page.locator('#ficha-activity-feedback-form [name="comment"]').fill("La corrección cumple con lo solicitado.");
  await page.locator('#ficha-activity-feedback-form button[type="submit"]').click();
  await expect(page.locator("#ficha-activity-detail")).toContainText("Aprobada");
  await expect(page.locator("#ficha-activity-detail")).toContainText("no verificada");

  await page.locator("#ficha-activity-detail details summary").filter({ hasText: "Notas personales" }).click();
  await page.locator("#ficha-activity-notes-form [name=notes]").fill("Revisar este método antes de la próxima clase.");
  await page.locator('#ficha-activity-notes-form button[type="submit"]').click();
  await expect(page.locator("#ficha-activities-status")).toContainText("Notas guardadas");

  page.once("dialog", dialog => dialog.accept());
  await page.locator("#ficha-activity-detail [data-activity-archive]").click();
  await expect(page.locator("#ficha-activities-list")).toContainText("No hay actividades");
});

test("búsqueda y filtro de atrasadas operan sin modificar los registros", async ({ page }) => {
  await page.addInitScript(() => {
    const timestamp = "2026-11-01T12:00:00.000Z";
    localStorage.setItem("traza:v4:ficha", JSON.stringify({
      version: 1,
      activities: [{
        id: "activity-overdue",
        title: "Informe vencido",
        description: "Documento de análisis",
        classId: null,
        competencyId: null,
        assignedOn: "2026-10-20",
        dueOn: "2026-10-25",
        status: "pending",
        createdAt: timestamp,
        updatedAt: timestamp,
        attempts: [],
        feedbackEntries: [],
        notes: "",
        archivedAt: null,
        events: []
      }]
    }));
  });
  await openActivities(page);

  await page.locator("#ficha-activity-date-filter").selectOption("overdue");
  await expect(page.locator("#ficha-activities-list")).toContainText("Informe vencido");
  await page.locator("#ficha-activity-search").fill("no existe");
  await expect(page.locator("#ficha-activities-list")).toContainText("No hay actividades");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("traza:v4:ficha")));
  expect(stored.activities).toHaveLength(1);
  expect(stored.activities[0].status).toBe("pending");
});

test("el almacenamiento corrupto no se descarga vacío ni se sobrescribe al crear", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("traza:v4:ficha", "{"));
  await page.goto("/");
  await page.getByRole("button", { name: "Mi ficha" }).click();
  await page.getByRole("button", { name: "Hoy", exact: true }).click();

  await page.locator("#ficha-backup-export").click();
  await expect(page.locator("#ficha-backup-status")).toContainText("No se generó un respaldo vacío");

  await page.getByRole("button", { name: "Actividades", exact: true }).click();
  await page.getByRole("button", { name: /Nueva actividad/ }).click();
  await page.locator('#ficha-activity-create-form [name="title"]').fill("No debe sobrescribir");
  await page.locator('#ficha-activity-create-form button[type="submit"]').click();
  await expect(page.locator("#ficha-activities-status")).toContainText("dañados");
  const raw = await page.evaluate(() => localStorage.getItem("traza:v4:ficha"));
  expect(raw).toBe("{");
});
