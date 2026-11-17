import { test, expect } from "@playwright/test";

test("Clases presenta el horario vigente, los bloques del sábado y el historial", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mi ficha" }).click();
  await page.getByRole("button", { name: "Clases", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Mis clases" })).toBeVisible();
  const cards = page.locator("#ficha-clases .ficha-class-card");
  await expect(cards).toHaveCount(7);

  await expect(page.locator("#ficha-clases")).toContainText("Matemáticas");
  await expect(page.locator("#ficha-clases")).toContainText("Yilliam Romero");
  await expect(page.locator("#ficha-clases")).toContainText("Comunicación");
  await expect(page.locator("#ficha-clases")).toContainText("TICS");
  await expect(page.locator("#ficha-clases")).toContainText("Establecer requisitos");
  await expect(page.locator("#ficha-clases")).toContainText("Clase del sábado");
  await expect(page.locator("#ficha-clases")).toContainText("Gloria Romero");
  await expect(page.locator("#ficha-clases")).toContainText("Jair Castañeda");
  await expect(page.locator("#ficha-clases")).toContainText("6 p. m. – 10 p. m.");
  await expect(page.locator("#ficha-clases")).toContainText("Sin asociación pedagógica confirmada");

  const history = page.locator("#ficha-clases .ficha-classes-history");
  await expect(history).toContainText("Evaluar requisitos");
  await expect(history).toContainText("Jair Castañeda");
  await expect(history).toContainText("Vigente hasta 2026-11-01");
});

test("Clases nunca inventa materias para los bloques del sábado ni vínculos con Aprende", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mi ficha" }).click();
  await page.getByRole("button", { name: "Clases", exact: true }).click();

  const saturday = page.locator("#ficha-clases .ficha-class-card").filter({ hasText: "Clase del sábado" });
  await expect(saturday).toHaveCount(2);
  await expect(saturday.nth(0)).toContainText("12 p. m. – 4 p. m.");
  await expect(saturday.nth(0)).toContainText("Gloria Romero");
  await expect(saturday.nth(1)).toContainText("4 p. m. – 10 p. m.");
  await expect(saturday.nth(1)).toContainText("Jair Castañeda");
  await expect(saturday).not.toContainText("TICS");
  await expect(saturday).not.toContainText("Matemáticas");
  await expect(saturday).toContainText("Sin asociación pedagógica confirmada");
});
