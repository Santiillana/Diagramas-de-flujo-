import { test, expect } from "@playwright/test";

async function openLibrary(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Mi ficha" }).click();
  await page.getByRole("button", { name: "Biblioteca", exact: true }).click();
  await page.getByRole("heading", { name: "Mi biblioteca" }).waitFor();
}

test("crear, consultar, editar y archivar un recurso", async ({ page }) => {
  await openLibrary(page);
  await page.getByRole("button", { name: /Añadir recurso/ }).click();
  await page.locator("#ficha-library-create-form [name=title]").fill("Video de estructuras");
  await page.locator("#ficha-library-create-form [name=kind]").selectOption("video");
  await page.locator("#ficha-library-create-form [name=classId]").selectOption("jueves-tics");
  await page.locator("#ficha-library-create-form [name=url]").fill("https://example.org/video");
  await page.locator("#ficha-library-create-form [name=description]").fill("Introducción a las estructuras de control.");
  await page.locator("#ficha-library-create-form [name=tags]").fill("algoritmos, estructuras");
  await page.locator("#ficha-library-create-form button[type=submit]").click();

  await expect(page.locator("#ficha-library-status")).toContainText("Recurso guardado");
  await expect(page.locator("#ficha-library-list")).toContainText("Video de estructuras");
  await expect(page.locator("#ficha-library-detail")).toContainText("Introducción a las estructuras");
  await expect(page.locator("#ficha-library-detail")).toContainText("jueves-tics");

  await page.locator("#ficha-library-detail details summary").filter({ hasText: "Editar recurso" }).click();
  await page.locator("#ficha-library-edit-form [name=title]").fill("Video actualizado");
  await page.locator("#ficha-library-edit-form [name=description]").fill("Material para repaso.");
  await page.locator("#ficha-library-edit-form button[type=submit]").click();
  await expect(page.locator("#ficha-library-detail")).toContainText("Video actualizado");

  await page.once("dialog", dialog => dialog.accept());
  await page.locator("#ficha-library-detail [data-library-archive]").click();
  await expect(page.locator("#ficha-library-list")).toContainText("No hay recursos");
});

test("búsqueda, filtros y respaldo de biblioteca funcionan", async ({ page }) => {
  await openLibrary(page);
  await page.getByRole("button", { name: /Añadir recurso/ }).click();
  await page.locator("#ficha-library-create-form [name=title]").fill("Apunte de lógica");
  await page.locator("#ficha-library-create-form [name=kind]").selectOption("note");
  await page.locator("#ficha-library-create-form [name=description]").fill("Operadores lógicos y tablas de verdad.");
  await page.locator("#ficha-library-create-form [name=tags]").fill("lógica, evaluación");
  await page.locator("#ficha-library-create-form button[type=submit]").click();

  await expect(page.locator("#ficha-library-status")).toContainText("Recurso guardado");
  await page.locator("#ficha-library-search").fill("tablas de verdad");
  await expect(page.locator("#ficha-library-list")).toContainText("Apunte de lógica");
  await page.locator("#ficha-library-kind-filter").selectOption("book");
  await expect(page.locator("#ficha-library-list")).toContainText("No hay recursos");
  await page.locator("#ficha-library-kind-filter").selectOption("all");

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#ficha-library-export").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^traza-biblioteca-.*\.json$/);
  await expect(page.locator("#ficha-library-backup-status")).toContainText("descargado");
});

test("restaurar respaldo válido recupera biblioteca y corrupción no se sobrescribe", async ({ page }) => {
  const timestamp = "2026-11-17T12:00:00.000Z";
  const backup = {
    format: "traza-library-backup",
    version: 1,
    exportedAt: timestamp,
    data: {
      version: 1,
      resources: [{
        id: "resource-test",
        title: "Guía recuperada",
        kind: "document",
        url: "https://example.org/guia",
        classId: null,
        description: "Recurso restaurado desde respaldo.",
        tags: ["recuperación"],
        createdAt: timestamp,
        updatedAt: timestamp,
        archivedAt: null
      }]
    }
  };
  await page.addInitScript(() => localStorage.setItem("traza:v4:library", "{"));
  await openLibrary(page);

  await page.locator("#ficha-library-export").click();
  await expect(page.locator("#ficha-library-backup-status")).toContainText("No se exportó un archivo vacío");

  await page.getByRole("button", { name: /Añadir recurso/ }).click();
  await page.locator("#ficha-library-create-form [name=title]").fill("No debe reemplazar la biblioteca dañada");
  await page.locator("#ficha-library-create-form [name=kind]").selectOption("note");
  await page.locator("#ficha-library-create-form [name=description]").fill("Intento bloqueado.");
  await page.locator("#ficha-library-create-form button[type=submit]").click();
  await expect(page.locator("#ficha-library-status")).toContainText("está dañada");
  expect(await page.evaluate(() => localStorage.getItem("traza:v4:library"))).toBe("{");

  await page.locator("#ficha-library-import").click();
  page.once("dialog", dialog => dialog.accept());
  await page.locator("#ficha-library-file").setInputFiles({
    name: "biblioteca.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup))
  });
  await expect(page.locator("#ficha-library-list")).toContainText("Guía recuperada");
  await expect(page.locator("#ficha-library-backup-status")).toContainText("restaurada");
});
