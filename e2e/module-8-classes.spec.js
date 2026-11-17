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
  await expect(saturday.nth(0)).not.toContainText("TICS");
  await expect(saturday.nth(0)).not.toContainText("Matemáticas");
  await expect(saturday.nth(1)).not.toContainText("TICS");
  await expect(saturday.nth(1)).not.toContainText("Matemáticas");
  await expect(saturday.nth(0)).toContainText("Sin asociación pedagógica confirmada");
  await expect(saturday.nth(1)).toContainText("Sin asociación pedagógica confirmada");
});

test("los vínculos curriculares verificados abren la lección y el ejercicio exactos", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mi ficha" }).click();
  await page.getByRole("button", { name: "Clases", exact: true }).click();

  await page.locator("#ficha-clases").evaluate(root => {
    const fixtures = document.createElement("div");
    fixtures.innerHTML =
      '<button type="button" data-class-open-lesson="algorithm">Lección de prueba</button>' +
      '<button type="button" data-class-open-exercise="1">Ejercicio de prueba</button>';
    root.append(fixtures);
  });

  await page.locator("#ficha-clases [data-class-open-lesson]").click();
  await expect(page.locator('[data-view="learn"]')).toBeVisible();
  await expect(page.locator("#lesson-detail")).toContainText("Algoritmos y diagramas de flujo");

  await page.locator('[data-section-switch="ficha"]').click();
  await page.getByRole("button", { name: "Clases", exact: true }).click();
  await page.locator("#ficha-clases [data-class-open-exercise]").click();
  await expect(page.locator('[data-view="exercises"]')).toBeVisible();
  await expect(page.locator("#exercise-detail")).toContainText("Suma de dos números");
});
