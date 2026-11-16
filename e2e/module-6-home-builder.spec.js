import { test, expect, goToSpace } from "./navigation.js";

async function openBuilder(page) {
  await page.goto("/");
  await goToSpace(page, "lab");
  await page.locator('[data-lab-mode="build"]').click();
  await page.locator("#lab-open-builder").click();
  await expect(page.locator("#lab-builder-stage")).toBeVisible();
}

test("Inicio muestra el progreso real de Aprende y lo conserva después de recargar", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("traza:v2:learn", JSON.stringify({
      version: 2,
      completed: ["algorithm", "reading"],
      current: "terminals",
      screen: 0
    }));
  });

  await page.goto("/");
  await expect(page.locator("#home-learn-progress")).toHaveText("2 de 17 completadas");
  await expect(page.locator("#home-learn-progress-percent")).toHaveText("12%");
  await expect(page.locator("#home-learn-progress-bar")).toHaveAttribute("aria-valuenow", "2");
  await expect(page.locator("#home-learn-progress-bar")).toHaveAttribute(
    "aria-valuetext", "2 de 17 lecciones completadas"
  );

  await page.locator("#home-learn-continue").click();
  await expect(page.locator('[data-view="learn"]')).toBeVisible();
  await expect(page.locator("#lesson-catalog [data-lesson-id="terminals"]')).toBeVisible();

  for (let step = 0; step < 5; step++) {
    await page.locator("#lesson-detail [data-lesson-next]").click();
  }

  await goToSpace(page, "home");
  await expect(page.locator("#home-learn-progress")).toHaveText("3 de 17 completadas");
  await expect(page.locator("#home-learn-progress-percent")).toHaveText("18%");
  await expect(page.locator("#home-learn-progress-bar")).toHaveAttribute("aria-valuenow", "3");
  await expect(page.locator("#home-learn-progress-copy")).toContainText("14 lecciones");

  await page.reload();
  await expect(page.locator('[data-view="home"]')).toBeVisible();
  await expect(page.locator("#home-learn-progress")).toHaveText("3 de 17 completadas");
  await expect(page.locator("#home-learn-progress-bar")).toHaveAttribute("aria-valuenow", "3");
});

test("Inicio ofrece accesos directos funcionales a Ejercicios, Simulador y Laboratorio", async ({ page }) => {
  await page.goto("/");

  for (const space of ["exercises", "simulator", "lab"]) {
    const shortcut = page.locator('.home-shortcut[data-go="' + space + '"]');
    await expect(shortcut).toBeVisible();
    await shortcut.click();
    await expect(page.locator('[data-view="' + space + '"]')).toBeVisible();
    await goToSpace(page, "home");
    await expect(page.locator('[data-view="home"]')).toBeVisible();
  }
});

test("el Constructor deshace y rehace con atajos y elimina la rama futura al crear un cambio nuevo", async ({ page }) => {
  await openBuilder(page);
  await page.locator('[data-builder-preset="empty"]').click();

  const cards = page.locator("#builder-canvas-list .builder-node-card");
  const undo = page.locator("#builder-undo");
  const redo = page.locator("#builder-redo");
  const addProcess = page.locator('#lab-builder-stage [data-add-node="process"]');

  await expect(cards).toHaveCount(2);
  await expect(undo).toBeDisabled();
  await expect(redo).toBeDisabled();
  await expect(undo).toHaveAttribute("aria-keyshortcuts", "Control+Z Meta+Z");
  await expect(redo).toHaveAttribute("aria-keyshortcuts", "Control+Shift+Z Control+Y Meta+Shift+Z Meta+Y");

  await addProcess.click();
  await expect(cards).toHaveCount(3);
  await expect(undo).toBeEnabled();

  await page.locator("#lab-builder-stage").press("Control+z");
  await expect(cards).toHaveCount(2);
  await expect(redo).toBeEnabled();

  await addProcess.click();
  await expect(cards).toHaveCount(3);
  await expect(redo).toBeDisabled();

  await page.locator("#lab-builder-stage").press("Control+z");
  await expect(cards).toHaveCount(2);
  await page.locator("#lab-builder-stage").press("Control+Shift+z");
  await expect(cards).toHaveCount(3);
});

test("el historial del Constructor conserva exactamente los últimos 60 estados y permite recorrerlos", async ({ page }) => {
  test.setTimeout(90000);
  await openBuilder(page);
  await page.locator('[data-builder-preset="empty"]').click();

  const cards = page.locator("#builder-canvas-list .builder-node-card");
  const undo = page.locator("#builder-undo");
  const redo = page.locator("#builder-redo");
  const addProcess = page.locator('#lab-builder-stage [data-add-node="process"]');

  for (let index = 0; index < 65; index++) {
    await addProcess.click();
  }
  await expect(cards).toHaveCount(67);
  await expect(undo).toBeEnabled();

  for (let index = 0; index < 59; index++) {
    await undo.click();
  }

  // El límite de 60 estados mantiene el estado inicial alcanzable en el sexto agregado.
  await expect(cards).toHaveCount(8);
  await expect(undo).toBeDisabled();
  await expect(redo).toBeEnabled();

  for (let index = 0; index < 59; index++) {
    await redo.click();
  }

  await expect(cards).toHaveCount(67);
  await expect(redo).toBeDisabled();
});
