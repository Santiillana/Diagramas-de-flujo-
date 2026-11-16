import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{await page.goto("/");});

test("el catálogo muestra los cinco ejercicios expertos sin revelar soluciones",async({page})=>{
  await page.locator('[data-space="exercises"]').click();
  await page.locator("#exercise-level").selectOption("expert");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(5);
  await page.locator('[data-select-exercise="43"]').click();
  await expect(page.locator("#exercise-detail h3")).toContainText("Cramer");
  await expect(page.locator("#exercise-detail")).not.toContainText("PSEUDOCÓDIGO");
  await expect(page.locator("#exercise-detail [data-start-exercise]")).toBeVisible();
});

test("los filtros por conceptos y dificultad utilizan metadatos de los ejercicios",async({page})=>{
  await page.locator('[data-space="exercises"]').click();
  await page.locator("#exercise-level").selectOption("basic");
  await expect(page.locator("#exercise-count")).toHaveText("20 de 45 ejercicios");
  await page.locator('#exercise-concepts [data-concept-filter="Ciclo Para"]').click();
  await expect(page.locator("[data-select-exercise]")).not.toHaveCount(0);
  await page.locator("#exercise-level").selectOption("advanced");
  await expect(page.locator("[data-select-exercise]")).not.toHaveCount(0);
  await page.locator("#exercise-filters-clear").click();
  await expect(page.locator("#exercise-count")).toHaveText("45 de 45 ejercicios");
});

test("el constructor se encuentra dentro de Arma el diagrama y permite editar",async({page})=>{
  await page.locator('[data-space="simulator"]').click();
  await page.locator('[data-space="lab"]').click();
  await page.locator('[data-lab-mode="build"]').click();
  await page.locator("#lab-open-builder").click();
  await expect(page.locator("#lab-builder-stage")).toBeVisible();
  const cards=page.locator("#builder-canvas-list .builder-node-card");
  const initial=await cards.count();
  await page.locator('#lab-builder-stage [data-add-node="process"]').click();
  await expect(cards).toHaveCount(initial+1);
  await page.locator("#builder-undo").click();
  await expect(cards).toHaveCount(initial);
  await page.locator("#builder-redo").click();
  await expect(cards).toHaveCount(initial+1);
});

test("el catálogo busca por número y pagina sin perder los filtros",async({page})=>{
  await page.locator('[data-space="exercises"]').click();
  await page.locator("#exercise-search").fill("45");
  await expect(page.locator("[data-select-exercise]")).toHaveCount(1);
  await expect(page.locator('[data-select-exercise="45"]')).toBeVisible();
  await page.locator("#exercise-search").fill("");
  await expect(page.locator("[data-page-next]")).toBeEnabled();
  await page.locator("[data-page-next]").click();
  await expect(page.locator(".exercise-pagination")).toContainText("Página 2");
});

test("Arma el diagrama ofrece el acceso al Lienzo libre dentro del Laboratorio",async({page})=>{
  await page.locator('[data-space="lab"]').click();
  await page.locator('[data-lab-mode="build"]').click();
  await expect(page.locator("#lab-open-builder")).toBeVisible();
  await page.locator("#lab-open-builder").click();
  await expect(page.locator("#lab-builder-stage")).toBeVisible();
  await expect(page.locator("#view-lab")).toBeVisible();
  await expect(page.locator("#view-builder")).toHaveCount(0);
});

test("se puede deshacer y rehacer el diagrama con atajos desde el lienzo libre",async({page})=>{
  await page.locator('[data-space="simulator"]').click();
  await page.locator('[data-space="lab"]').click();
  await page.locator('[data-lab-mode="build"]').click();
  await page.locator("#lab-open-builder").click();
  await page.locator('[data-builder-preset="decision"]').click();
  const cards=page.locator("#builder-canvas-list .builder-node-card");
  const initial=await cards.count();
  await page.locator('#lab-builder-stage [data-add-node="process"]').click();
  await expect(cards).toHaveCount(initial+1);
  await page.locator("#lab-builder-stage").press("Control+z");
  await expect(cards).toHaveCount(initial);
  await page.locator("#lab-builder-stage").press("Control+Shift+z");
  await expect(cards).toHaveCount(initial+1);
});
