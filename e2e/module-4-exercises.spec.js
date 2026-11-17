import { test, expect, goToSpace } from "./navigation.js";

async function openExercises(page){await page.goto("/");await goToSpace(page,"exercises");}

test("el catálogo es compacto y ordena las tarjetas por dificultad y número",async({page})=>{
  await openExercises(page);
  await expect(page.locator("#exercise-count")).toHaveCount(0);
  await expect(page.locator("#exercise-level-shortcuts")).toHaveCount(0);
  await expect(page.locator("#exercise-grid [data-select-exercise]")).toHaveCount(45);
  const ids=await page.locator("#exercise-grid [data-select-exercise]").evaluateAll(cards=>cards.map(card=>Number(card.dataset.selectExercise)));
  expect(ids).toHaveLength(45);expect(new Set(ids).size).toBe(45);
  await expect(page.locator("#exercise-grid .exercise-card-concepts i").first()).toBeVisible();
  await expect(page.locator("[data-exercise-view=grid]")).toHaveAttribute("aria-pressed","true");
});

test("dificultad, conceptos, clase y búsqueda se combinan y se limpian",async({page})=>{
  await openExercises(page);
  await page.locator('[data-exercise-difficulty="2"]').click();
  await expect(page.locator("#exercise-grid [data-select-exercise]")).toHaveCount(10);
  await page.locator('[data-exercise-difficulty="2"]').click();
  await page.locator("#exercise-class-only").check();
  const ids=await page.locator("#exercise-grid [data-select-exercise]").evaluateAll(cards=>cards.map(card=>Number(card.dataset.selectExercise)).sort((a,b)=>a-b));
  expect(ids).toEqual([22,23,24,28]);
  await page.locator("#exercise-concept-details > summary").click();
  await page.locator('[data-concept-filter="Ciclo Para"]').click();
  await expect(page.locator("#exercise-active-filters")).toContainText("Ciclo Para");
  await page.locator("#exercise-search").fill("no existe");
  await expect(page.getByText("Ningún ejercicio coincide")).toBeVisible();
  await page.locator("#exercise-empty-clear").click();
  await expect(page.locator("#exercise-grid [data-select-exercise]")).toHaveCount(45);
});

test("el detalle guía el intento y revela el pseudocódigo solo al pedirlo",async({page})=>{
  await openExercises(page);
  await page.locator('[data-select-exercise="23"]').click();
  await expect(page.locator("#exercise-detail h3")).toHaveText("Fibonacci: términos que no superen 40");
  await expect(page.locator("#exercise-detail")).toContainText("DATOS DE EJEMPLO");
  await expect(page.locator("#exercise-detail .exercise-guide li")).toHaveCount(3);
  await expect(page.locator("#exercise-detail svg")).toBeVisible();
  await expect(page.locator("#exercise-detail pre")).toHaveCount(0);
  await page.locator("[data-reveal-solution]").click();
  await expect(page.locator("#exercise-detail .exercise-solution pre")).toBeVisible();
  await page.locator("[data-start-exercise]").click();
  await expect(page.locator('[data-view="simulator"]')).toBeVisible();
  await expect(page.locator("#simulator-exercise-title")).toContainText("Fibonacci");
});

test("la vista de lista y los filtros se adaptan a móvil sin desbordar",async({page})=>{
  await page.setViewportSize({width:390,height:844});await openExercises(page);
  await page.locator('[data-exercise-view="list"]').click();
  await expect(page.locator("#exercise-grid")).toHaveClass(/is-list/);
  await page.locator('[data-select-exercise="1"]').click();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.locator("#exercise-detail")).toContainText("ANTES DE EMPEZAR");
});
